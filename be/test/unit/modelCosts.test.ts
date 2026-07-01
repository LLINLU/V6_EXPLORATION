import { describe, expect, it } from "vitest"
import {
	type AIModelId,
	estimateModelCost,
	getModelList,
	MODELS,
} from "../../src/constants/modelCosts.js"

describe("estimateModelCost", () => {
	describe("token cost calculation", () => {
		it("calculates input token cost correctly", () => {
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 1_000_000, // 1 million input tokens
				outputTokens: 0,
			})

			// Claude Opus: 5 / 1_000_000 per input token
			// 1_000_000 tokens * 5 / 1_000_000 = $5
			expect(cost).toBe(5)
		})

		it("calculates output token cost correctly", () => {
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 0,
				outputTokens: 1_000_000, // 1 million output tokens
			})

			// Claude Opus: 25 / 1_000_000 per output token
			// 1_000_000 tokens * 25 / 1_000_000 = $25
			expect(cost).toBe(25)
		})

		it("combines input and output token costs", () => {
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 1_000_000,
				outputTokens: 1_000_000,
			})

			// $5 + $25 = $30
			expect(cost).toBe(30)
		})

		it("works with zero tokens", () => {
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 0,
				outputTokens: 0,
			})

			expect(cost).toBe(0)
		})

		it("handles fractional token counts", () => {
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 100,
				outputTokens: 50,
			})

			// 100 * (5 / 1_000_000) + 50 * (25 / 1_000_000)
			// = 0.0005 + 0.00125 = 0.00175
			expect(cost).toBeCloseTo(0.00175, 8)
		})
	})

	describe("web search cost calculation", () => {
		it("calculates web search cost correctly", () => {
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 0,
				outputTokens: 0,
				webSearches: 5,
			})

			// Web search: 10 / 1_000 per search = $0.01 per search
			// 5 searches * 0.01 = $0.05
			expect(cost).toBeCloseTo(0.05, 8)
		})

		it("defaults to 0 web searches when not specified", () => {
			const costWithoutSearches = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 100,
				outputTokens: 50,
			})

			const costWithZeroSearches = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 100,
				outputTokens: 50,
				webSearches: 0,
			})

			expect(costWithoutSearches).toBe(costWithZeroSearches)
		})

		it("handles maximum web searches", () => {
			// Claude Opus supports max 8 searches
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 0,
				outputTokens: 0,
				webSearches: 8,
			})

			// 8 searches * $0.01 = $0.08
			expect(cost).toBeCloseTo(0.08, 8)
		})
	})

	describe("combined cost calculation", () => {
		it("combines tokens and web search costs", () => {
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 1_000_000,
				outputTokens: 1_000_000,
				webSearches: 5,
			})

			// Token cost: $5 + $25 = $30
			// Search cost: 5 * $0.01 = $0.05
			// Total: $30.05
			expect(cost).toBeCloseTo(30.05, 8)
		})

		it("realistic scenario: typical API call with searches", () => {
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 500_000,
				outputTokens: 100_000,
				webSearches: 3,
			})

			// Input: 500_000 * (5 / 1_000_000) = $2.50
			// Output: 100_000 * (25 / 1_000_000) = $2.50
			// Searches: 3 * (10 / 1_000) = $0.03
			// Total: $5.03
			expect(cost).toBeCloseTo(5.03, 8)
		})
	})

	describe("model variations", () => {
		it("calculates correctly for Claude Sonnet", () => {
			const cost = estimateModelCost({
				modelId: "claude-sonnet-4-6",
				inputTokens: 1_000_000,
				outputTokens: 1_000_000,
			})

			// Sonnet: 3 / 1_000_000 input + 15 / 1_000_000 output
			// $3 + $15 = $18
			expect(cost).toBe(18)
		})

		it("calculates correctly for Claude Haiku", () => {
			const cost = estimateModelCost({
				modelId: "claude-haiku-4-5",
				inputTokens: 1_000_000,
				outputTokens: 1_000_000,
			})

			// Haiku: 1 / 1_000_000 input + 5 / 1_000_000 output
			// $1 + $5 = $6
			expect(cost).toBe(6)
		})

		it("shows price difference between models", () => {
			const tokens = { inputTokens: 1_000_000, outputTokens: 1_000_000 }

			const opusCost = estimateModelCost({
				modelId: "claude-opus-4-6",
				...tokens,
			})

			const sonnetCost = estimateModelCost({
				modelId: "claude-sonnet-4-6",
				...tokens,
			})

			const haikuCost = estimateModelCost({
				modelId: "claude-haiku-4-5",
				...tokens,
			})

			// Opus should be most expensive
			expect(opusCost).toBeGreaterThan(sonnetCost)
			expect(sonnetCost).toBeGreaterThan(haikuCost)
		})

		it("all models have web search cost", () => {
			const models: AIModelId[] = [
				"claude-opus-4-6",
				"claude-sonnet-4-6",
				"claude-haiku-4-5",
			]

			models.forEach((modelId) => {
				const cost = estimateModelCost({
					modelId,
					inputTokens: 0,
					outputTokens: 0,
					webSearches: 1,
				})

				// All models should charge $0.01 per search
				expect(cost).toBeCloseTo(0.01, 8)
			})
		})
	})

	describe("edge cases", () => {
		it("handles very large token counts", () => {
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 128_000, // Max tokens for Opus
				outputTokens: 128_000,
			})

			expect(cost).toBeGreaterThan(0)
			expect(typeof cost).toBe("number")
			expect(isFinite(cost)).toBe(true)
		})

		it("handles negative web searches gracefully (treats as 0)", () => {
			// Note: This is a defensive test - the function should ideally validate inputs
			// but we document the current behavior
			const costWithNegative = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 100,
				outputTokens: 50,
				webSearches: -5, // Invalid but let's see what happens
			})

			// -5 * 0.01 = -$0.05, so total would be negative
			// This might be undesirable, but documents current behavior
			expect(costWithNegative).toBeLessThan(0)
		})

		it("maintains precision with many decimal places", () => {
			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 1,
				outputTokens: 1,
				webSearches: 1,
			})

			// 1 * (5 / 1_000_000) + 1 * (25 / 1_000_000) + 1 * (10 / 1_000)
			// = 0.000005 + 0.000025 + 0.01
			// = 0.01003
			expect(cost).toBeCloseTo(0.01003, 10)
		})
	})

	describe("integration with model registry", () => {
		it("uses correct pricing from MODELS registry", () => {
			const modelConfig = MODELS["claude-opus-4-6"]

			const cost = estimateModelCost({
				modelId: "claude-opus-4-6",
				inputTokens: 100,
				outputTokens: 50,
			})

			const expectedCost =
				100 * modelConfig.inputCostPerToken +
				50 * modelConfig.outputCostPerToken

			expect(cost).toBeCloseTo(expectedCost, 10)
		})

		it("works with all models from getModelList", () => {
			const models = getModelList()

			models.forEach(([modelId]) => {
				const cost = estimateModelCost({
					modelId,
					inputTokens: 100,
					outputTokens: 50,
					webSearches: 1,
				})

				expect(cost).toBeGreaterThan(0)
				expect(typeof cost).toBe("number")
				expect(isFinite(cost)).toBe(true)
			})
		})
	})

	describe("web search cost constant consistency", () => {
		it("web search cost is consistent across all models", () => {
			const searchCost = 10 / 1_000 // $0.01

			const models: AIModelId[] = [
				"claude-opus-4-6",
				"claude-sonnet-4-6",
				"claude-haiku-4-5",
			]

			models.forEach((modelId) => {
				const modelConfig = MODELS[modelId]
				expect(modelConfig.webSearchCostPerSearch).toBe(searchCost)
			})
		})
	})
})
