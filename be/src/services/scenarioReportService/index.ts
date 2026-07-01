import Anthropic from "@anthropic-ai/sdk"
import { getAnthropicClient } from "../../lib/anthropicClient.js"
import { logger } from "../../logger.js"
import type { ReportJobData } from "../../queue/index.js"
import { buildReportPrompt, MODEL_CONFIG, SYSTEM_PROMPT } from "./prompt.js"

export interface GenerateResult {
	report: Record<string, unknown>
	usage: {
		promptTokens: number
		completionTokens: number
		webSearches: number
		tokenCostUsd: number
		webSearchCostUsd: number
		costUsd: number
	}
}

export function extractJsonFromText(text: string): Record<string, unknown> {
	let raw = text.trim()

	if (raw.startsWith("```")) {
		raw = raw
			.replace(/^```[a-z]*\n?/, "")
			.replace(/\n?```$/, "")
			.trim()
	}

	const jsonStart = raw.indexOf("{")
	const jsonEnd = raw.lastIndexOf("}")

	if (jsonStart === -1 || jsonEnd === -1) {
		throw new Error(
			`No JSON object found in response. Preview: ${raw.slice(0, 200)}`,
		)
	}

	raw = raw.slice(jsonStart, jsonEnd + 1)

	try {
		return JSON.parse(raw)
	} catch (err) {
		throw new Error(
			`Invalid JSON from Anthropic: ${(err as Error).message}. Preview: ${raw.slice(0, 200)}`,
		)
	}
}

export function createScenarioReport(client: Anthropic) {
	return async function generateScenarioReport(
		data: ReportJobData,
	): Promise<GenerateResult> {
		const {
			model,
			apiModel,
			maxTokens,
			maxSearches,
			temperature,
			inputCostPerToken,
			outputCostPerToken,
			webSearchCostPerSearch,
		} = MODEL_CONFIG

		const resolvedModel = apiModel ?? model
		const useSearch = maxSearches !== null

		const userMessage = buildReportPrompt(data)

		logger.info(
			{
				provider: "anthropic",
				model: resolvedModel,
				maxTokens,
				temperature,
				useSearch,
				maxSearches,
				webSearchCostPerSearch,
				systemPromptLength: SYSTEM_PROMPT.length,
				userMessageLength: userMessage.length,
				jobId: data.jobId,
				scenarioId: data.scenarioId,
				theme: data.theme,
				language: data.language,
			},
			"scenarioReportService::generateScenarioReport::LLM call starting",
		)

		logger.debug(
			{ scenarioId: data.scenarioId, preview: userMessage.slice(0, 500) },
			"scenarioReportService::generateScenarioReport::user message preview",
		)

		const callStart = Date.now()

		const stream = client.messages.stream({
			model: resolvedModel,
			max_tokens: maxTokens,
			temperature,
			system: SYSTEM_PROMPT,
			...(useSearch && {
				tools: [
					{
						type: "web_search_20250305",
						name: "web_search",
						max_uses: maxSearches,
					} as unknown as Anthropic.Tool,
				],
			}),
			messages: [{ role: "user", content: userMessage }],
		})

		let charsReceived = 0

		stream.on("text", (text) => {
			charsReceived += text.length
		})

		let response: Awaited<ReturnType<typeof stream.finalMessage>>

		try {
			response = await stream.finalMessage()
		} catch (err) {
			const durationMs = Date.now() - callStart

			if (err instanceof Anthropic.AuthenticationError) {
				logger.error(
					{
						jobId: data.jobId,
						scenarioId: data.scenarioId,
						durationMs,
					},
					"scenarioReportService::generateScenarioReport::LLM call failed — AUTHENTICATION ERROR: check ANTHROPIC_API_KEY in be/.env",
				)
			} else if (err instanceof Anthropic.RateLimitError) {
				logger.error(
					{ jobId: data.jobId, scenarioId: data.scenarioId, durationMs },
					"scenarioReportService::generateScenarioReport::LLM call failed — RATE LIMITED",
				)
			} else if (err instanceof Anthropic.APIError && err.status >= 500) {
				logger.error(
					{
						jobId: data.jobId,
						scenarioId: data.scenarioId,
						status: err.status,
						durationMs,
					},
					"scenarioReportService::generateScenarioReport::LLM call failed — ANTHROPIC SERVER ERROR",
				)
			} else {
				logger.error(
					{ err, jobId: data.jobId, scenarioId: data.scenarioId, durationMs },
					"scenarioReportService::generateScenarioReport::LLM call failed",
				)
			}

			throw err
		}

		const durationMs = Date.now() - callStart

		const searchUses = response.content.filter(
			(block) => block.type === "tool_use" && block.name === "web_search",
		).length

		logger.info(
			{
				provider: "anthropic",
				model: resolvedModel,
				stopReason: response.stop_reason,
				inputTokens: response.usage.input_tokens,
				outputTokens: response.usage.output_tokens,
				searchUses,
				charsReceived,
				blocks: response.content.length,
				durationMs,
				jobId: data.jobId,
				scenarioId: data.scenarioId,
			},
			"scenarioReportService::generateScenarioReport::LLM call complete",
		)

		for (const block of response.content) {
			if (block.type === "text") {
				logger.debug(
					{ scenarioId: data.scenarioId, preview: block.text.slice(0, 300) },
					"scenarioReportService::generateScenarioReport::text block",
				)
			} else {
				logger.debug(
					{ scenarioId: data.scenarioId, type: block.type },
					"scenarioReportService::generateScenarioReport::non-text block",
				)
			}
		}

		if (
			response.stop_reason !== "end_turn" &&
			response.stop_reason !== "tool_use" &&
			response.stop_reason !== "max_tokens"
		) {
			logger.error(
				{
					stopReason: response.stop_reason,
					scenarioId: data.scenarioId,
					jobId: data.jobId,
				},
				"scenarioReportService::generateScenarioReport::unexpected stop reason",
			)

			throw new Error(
				`Unexpected stop_reason from Anthropic: ${response.stop_reason}`,
			)
		}

		if (searchUses > 0) {
			logger.info(
				{
					searchUses,
					webSearchCostUsd: searchUses * webSearchCostPerSearch,
					scenarioId: data.scenarioId,
				},
				"scenarioReportService::generateScenarioReport::web search used",
			)
		}
		const textBlocks = response.content.filter((block) => block.type === "text")

		const rawText = textBlocks
			.map((block) => block.text)
			.join("\n")
			.trim()

		if (!rawText) {
			logger.error(
				{
					stopReason: response.stop_reason,
					contentTypes: response.content.map((block) => block.type),
					scenarioId: data.scenarioId,
					jobId: data.jobId,
				},
				"scenarioReportService::generateScenarioReport::no text content in response",
			)

			throw new Error(
				`No text content returned. stop_reason=${response.stop_reason}, blocks=[${response.content.map((block) => block.type).join(",")}]`,
			)
		}

		logger.debug(
			{
				scenarioId: data.scenarioId,
				textLength: rawText.length,
				preview: rawText.slice(0, 500),
			},
			"scenarioReportService::generateScenarioReport::raw text response",
		)

		const report = extractJsonFromText(rawText)

		const promptTokens = response.usage.input_tokens
		const completionTokens = response.usage.output_tokens
		const tokenCostUsd =
			promptTokens * inputCostPerToken + completionTokens * outputCostPerToken
		const webSearchCostUsd = searchUses * webSearchCostPerSearch
		const costUsd = tokenCostUsd + webSearchCostUsd

		logger.info(
			{
				scenarioId: data.scenarioId,
				jobId: data.jobId,
				promptTokens,
				completionTokens,
				searchUses,
				tokenCostUsd,
				webSearchCostUsd,
				costUsd,
				reportKeys: Object.keys(report),
			},
			"scenarioReportService::generateScenarioReport::report parsed",
		)

		return {
			report,
			usage: {
				promptTokens,
				completionTokens,
				webSearches: searchUses,
				tokenCostUsd,
				webSearchCostUsd,
				costUsd,
			},
		}
	}
}

export function generateScenarioReport(data: ReportJobData) {
	const client = getAnthropicClient()
	return createScenarioReport(client)(data)
}
