import "dotenv/config"
import Anthropic from "@anthropic-ai/sdk"
import { beforeAll, describe, expect, it } from "vitest"
import { getModelList } from "../../src/constants/modelCosts.js"
import { logger } from "../../src/logger.js"

const apiKey = process.env.ANTHROPIC_API_KEY
// `sk-ant-test` is the placeholder injected by vitest.config.ts when no real
// key is exported in the shell — treat it as "no key" so this suite is skipped
// in CI rather than hitting the live API and 401-ing.
const hasApiKey = !!apiKey && apiKey !== "sk-ant-test"

const client = hasApiKey ? new Anthropic({ apiKey }) : null

const cache = new Map<string, boolean>()

async function tryModel(model: string): Promise<boolean> {
	if (!client) throw new Error("Missing ANTHROPIC_API_KEY")

	if (cache.has(model)) return cache.get(model) ?? false

	try {
		await client.messages.create({
			model,
			max_tokens: 1,
			messages: [{ role: "user", content: "ping" }],
		})

		cache.set(model, true)
		return true
	} catch (err: any) {
		const msg = err?.message ?? ""

		if (msg.includes("invalid_model") || msg.includes("not found")) {
			cache.set(model, false)
			return false
		}

		throw err
	}
}

async function fetchAvailableModels(): Promise<Set<string>> {
	if (!client) throw new Error("Missing ANTHROPIC_API_KEY")

	const res = await client.models.list()
	return new Set(res.data.map((m) => m.id))
}

function resolveLatestModel(
	base: string,
	available: Set<string>,
): string | null {
	const candidates = Array.from(available).filter((id) => id.startsWith(base))

	if (candidates.length === 0) return null

	return candidates
		.map((id) => ({
			id,
			date: Number(id.match(/-(\d{8})$/)?.[1] ?? 0),
		}))
		.sort((a, b) => b.date - a.date)[0].id
}

;(hasApiKey ? describe : describe.skip)(
	"Anthropic model compatibility (API-driven)",
	() => {
		const models = getModelList()

		let availableModels: Set<string>

		beforeAll(async () => {
			availableModels = await fetchAvailableModels()

			logger.info(
				{
					availableModels: Array.from(availableModels),
				},
				"[model-test] available models",
			)
		})

		for (const [modelId, config] of models) {
			it(`[${modelId}] resolves latest + suggest config update`, async () => {
				const latest = resolveLatestModel(modelId, availableModels)

				logger.info({ modelId, latest }, "[model-test] resolved latest model")

				expect(latest).not.toBeNull()

				if (latest && config.apiModel !== latest) {
					logger.warn(
						{
							modelId,
							current: config.apiModel ?? null,
							suggested: latest,
						},
						"[model-update-suggestion]",
					)
				}

				if (!latest)
					throw new Error(`resolveLatestModel returned null for ${modelId}`)
				const ok = await tryModel(latest)

				logger.info(
					{ modelId, latest, usable: ok },
					"[model-test] latest model usability",
				)

				expect(ok).toBe(true)
			}, 10000)

			it(`[${modelId}] short alias still works`, async () => {
				const ok = await tryModel(modelId)

				logger.info({ modelId, usable: ok }, "[model-test] alias usability")

				expect(ok).toBe(true)
			}, 10000)
		}
	},
)
