import Anthropic from "@anthropic-ai/sdk"
import { getAnthropicClient } from "../../lib/anthropicClient.js"
import { logger } from "../../logger.js"
import type { QueryReportJobData } from "../../worker/queryReportPipeline.js"
import {
	buildQueryReportPrompt,
	MODEL_CONFIG,
	SYSTEM_PROMPT,
} from "./prompt.js"

export interface QueryGenerateResult {
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

function extractJsonCandidate(text: string): string {
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

	return raw.slice(jsonStart, jsonEnd + 1)
}

export function extractJsonFromText(text: string): Record<string, unknown> {
	const raw = extractJsonCandidate(text)

	try {
		return JSON.parse(raw)
	} catch (err) {
		throw new Error(
			`Invalid JSON from Anthropic: ${(err as Error).message}. Preview: ${raw.slice(0, 200)}`,
		)
	}
}

function extractTextBlocks(response: Anthropic.Message) {
	return response.content
		.filter((block) => block.type === "text")
		.map((block) => block.text)
		.join("\n")
		.trim()
}

async function repairJsonResponse({
	client,
	model,
	maxTokens,
	originalText,
	parseError,
	jobId,
	queryId,
}: {
	client: Anthropic
	model: string
	maxTokens: number
	originalText: string
	parseError: unknown
	jobId: string
	queryId: string
}) {
	logger.warn(
		{
			jobId,
			queryId,
			err: parseError,
			textLength: originalText.length,
			preview: originalText.slice(0, 500),
		},
		"queryReportService::generateQueryReport::invalid JSON, attempting repair",
	)

	const response = await client.messages.create({
		model,
		max_tokens: maxTokens,
		temperature: 0,
		system:
			"You repair invalid JSON. Return exactly one valid JSON object and nothing else. Preserve the original fields and wording as much as possible. If a value is unrecoverable, use an empty string, empty array, or empty object that fits the surrounding schema. Do not use markdown fences.",
		messages: [
			{
				role: "user",
				content: `This response was intended to be a single JSON object for a query report with top-level keys theme, scenario, summary, s01, s02, s03, s04, s05, s06, and s07.

It failed JSON.parse with this error:
${parseError instanceof Error ? parseError.message : String(parseError)}

Repair the JSON syntax only and return the repaired JSON object:

${originalText}`,
			},
		],
	})

	const repairedText = extractTextBlocks(response)

	if (!repairedText) {
		throw new Error("JSON repair returned no text content")
	}

	const report = extractJsonFromText(repairedText)

	logger.info(
		{
			jobId,
			queryId,
			inputTokens: response.usage.input_tokens,
			outputTokens: response.usage.output_tokens,
			reportKeys: Object.keys(report),
		},
		"queryReportService::generateQueryReport::JSON repair complete",
	)

	return {
		report,
		promptTokens: response.usage.input_tokens,
		completionTokens: response.usage.output_tokens,
	}
}

export function createQueryReport(client: Anthropic) {
	return async function generateQueryReport(
		data: QueryReportJobData,
	): Promise<QueryGenerateResult> {
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

		const userMessage = buildQueryReportPrompt(data)

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
				queryId: data.queryId,
				query: data.query,
				language: data.language,
			},
			"queryReportService::generateQueryReport::LLM call starting",
		)

		logger.debug(
			{ queryId: data.queryId, preview: userMessage.slice(0, 500) },
			"queryReportService::generateQueryReport::user message preview",
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
					{ jobId: data.jobId, queryId: data.queryId, durationMs },
					"queryReportService::generateQueryReport::LLM call failed — AUTHENTICATION ERROR: check ANTHROPIC_API_KEY in be/.env",
				)
			} else if (err instanceof Anthropic.RateLimitError) {
				logger.error(
					{ jobId: data.jobId, queryId: data.queryId, durationMs },
					"queryReportService::generateQueryReport::LLM call failed — RATE LIMITED",
				)
			} else if (err instanceof Anthropic.APIError && err.status >= 500) {
				logger.error(
					{
						jobId: data.jobId,
						queryId: data.queryId,
						status: err.status,
						durationMs,
					},
					"queryReportService::generateQueryReport::LLM call failed — ANTHROPIC SERVER ERROR",
				)
			} else {
				logger.error(
					{ err, jobId: data.jobId, queryId: data.queryId, durationMs },
					"queryReportService::generateQueryReport::LLM call failed",
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
				queryId: data.queryId,
			},
			"queryReportService::generateQueryReport::LLM call complete",
		)

		for (const block of response.content) {
			if (block.type === "text") {
				logger.debug(
					{ queryId: data.queryId, preview: block.text.slice(0, 300) },
					"queryReportService::generateQueryReport::text block",
				)
			} else {
				logger.debug(
					{ queryId: data.queryId, type: block.type },
					"queryReportService::generateQueryReport::non-text block",
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
					queryId: data.queryId,
					jobId: data.jobId,
				},
				"queryReportService::generateQueryReport::unexpected stop reason",
			)

			throw new Error(
				`Unexpected stop_reason from Anthropic: ${response.stop_reason}`,
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
					queryId: data.queryId,
					jobId: data.jobId,
				},
				"queryReportService::generateQueryReport::no text content in response",
			)

			throw new Error(
				`No text content returned. stop_reason=${response.stop_reason}, blocks=[${response.content.map((block) => block.type).join(",")}]`,
			)
		}

		logger.debug(
			{
				queryId: data.queryId,
				textLength: rawText.length,
				preview: rawText.slice(0, 500),
			},
			"queryReportService::generateQueryReport::raw text response",
		)

		let report: Record<string, unknown>
		let repairPromptTokens = 0
		let repairCompletionTokens = 0

		try {
			report = extractJsonFromText(rawText)
		} catch (err) {
			const repaired = await repairJsonResponse({
				client,
				model: resolvedModel,
				maxTokens,
				originalText: rawText,
				parseError: err,
				jobId: data.jobId,
				queryId: data.queryId,
			})
			report = repaired.report
			repairPromptTokens = repaired.promptTokens
			repairCompletionTokens = repaired.completionTokens
		}

		const promptTokens = response.usage.input_tokens + repairPromptTokens
		const completionTokens =
			response.usage.output_tokens + repairCompletionTokens
		const tokenCostUsd =
			promptTokens * inputCostPerToken + completionTokens * outputCostPerToken
		const webSearchCostUsd = searchUses * webSearchCostPerSearch
		const costUsd = tokenCostUsd + webSearchCostUsd

		logger.info(
			{
				queryId: data.queryId,
				jobId: data.jobId,
				promptTokens,
				completionTokens,
				searchUses,
				tokenCostUsd,
				webSearchCostUsd,
				costUsd,
				reportKeys: Object.keys(report),
			},
			"queryReportService::generateQueryReport::report parsed",
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

export function generateQueryReport(data: QueryReportJobData) {
	const client = getAnthropicClient()
	return createQueryReport(client)(data)
}
