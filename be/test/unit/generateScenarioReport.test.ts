import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReportJobData } from "../../src/queue/index.js"
import { createScenarioReport } from "../../src/services/scenarioReportService/index.js"

function makeStream(response: object) {
	return {
		on: vi.fn().mockReturnThis(),
		finalMessage: vi.fn().mockResolvedValue(response),
	}
}

function makeStreamError(error: Error) {
	return {
		on: vi.fn().mockReturnThis(),
		finalMessage: vi.fn().mockRejectedValue(error),
	}
}

const mockClient = {
	messages: {
		stream: vi.fn(),
	},
} as any

const generate = createScenarioReport(mockClient)

function buildJobData(overrides: Partial<ReportJobData> = {}): ReportJobData {
	return {
		jobId: "job-1",
		userId: "user-1",
		scenarioId: "scenario-1",
		theme: "AI",
		scenarioTitle: "Test Scenario",
		scenarioDescription: "Test Description",
		language: "ja",
		...overrides,
	}
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe("generateScenarioReport (service)", () => {
	it("returns parsed report and usage", async () => {
		mockClient.messages.stream.mockReturnValue(
			makeStream({
				stop_reason: "end_turn",
				content: [{ type: "text", text: `{ "foo": "bar" }` }],
				usage: { input_tokens: 100, output_tokens: 50 },
			}),
		)

		const result = await generate(buildJobData())

		expect(result.report).toEqual({ foo: "bar" })
		expect(result.usage).toEqual(
			expect.objectContaining({
				promptTokens: 100,
				completionTokens: 50,
			}),
		)
		expect(result.usage.costUsd).toBeGreaterThan(0)
	})

	it("parses markdown-wrapped JSON", async () => {
		mockClient.messages.stream.mockReturnValue(
			makeStream({
				stop_reason: "end_turn",
				content: [{ type: "text", text: '```json\n{ "foo": "bar" }\n```' }],
				usage: { input_tokens: 10, output_tokens: 5 },
			}),
		)

		const result = await generate(buildJobData())

		expect(result.report).toEqual({ foo: "bar" })
	})

	it("throws when no JSON exists in response text", async () => {
		mockClient.messages.stream.mockReturnValue(
			makeStream({
				stop_reason: "end_turn",
				content: [{ type: "text", text: "no json here" }],
				usage: { input_tokens: 10, output_tokens: 5 },
			}),
		)

		await expect(generate(buildJobData())).rejects.toThrow(
			"No JSON object found in response",
		)
	})

	it("throws when response has no text block", async () => {
		mockClient.messages.stream.mockReturnValue(
			makeStream({
				stop_reason: "end_turn",
				content: [],
				usage: { input_tokens: 10, output_tokens: 5 },
			}),
		)

		await expect(generate(buildJobData())).rejects.toThrow(
			"No text content returned",
		)
	})

	it("throws on unexpected stop reason", async () => {
		mockClient.messages.stream.mockReturnValue(
			makeStream({
				stop_reason: "stop_sequence",
				content: [{ type: "text", text: `{ "ok": true }` }],
				usage: { input_tokens: 10, output_tokens: 5 },
			}),
		)

		await expect(generate(buildJobData())).rejects.toThrow(
			"Unexpected stop_reason",
		)
	})

	it("propagates stream errors", async () => {
		mockClient.messages.stream.mockReturnValue(
			makeStreamError(new Error("network error")),
		)

		await expect(generate(buildJobData())).rejects.toThrow("network error")
	})

	it("calculates cost correctly", async () => {
		mockClient.messages.stream.mockReturnValue(
			makeStream({
				stop_reason: "end_turn",
				content: [{ type: "text", text: `{ "ok": true }` }],
				usage: { input_tokens: 1000, output_tokens: 500 },
			}),
		)

		const result = await generate(buildJobData())

		expect(result.usage.promptTokens).toBe(1000)
		expect(result.usage.completionTokens).toBe(500)
		expect(result.usage.costUsd).toBeGreaterThan(0)
	})
})
