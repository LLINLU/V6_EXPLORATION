import {
	buildContextInfoMessage,
	extractResearchContext,
	type ResearchContextData,
} from "../researchContextParser"

describe("researchContextParser", () => {
	describe("extractResearchContext", () => {
		it("should return empty object when no research context data provided", () => {
			const result = extractResearchContext(undefined, "TED")
			expect(result).toEqual({})
		})

		it("should return empty object when userAnswers is undefined", () => {
			const data: ResearchContextData = {}
			const result = extractResearchContext(data, "TED")
			expect(result).toEqual({})
		})

		it("should extract purpose from array", () => {
			const data: ResearchContextData = {
				userAnswers: {
					purpose: ["Research", "Development"],
				},
			}
			const result = extractResearchContext(data, "TED")
			expect(result.purpose).toBe("Research, Development")
		})

		it("should not extract purpose when array is empty", () => {
			const data: ResearchContextData = {
				userAnswers: {
					purpose: [],
				},
			}
			const result = extractResearchContext(data, "TED")
			expect(result.purpose).toBeUndefined()
		})

		it("should extract TED mode target fields correctly", () => {
			const data: ResearchContextData = {
				userAnswers: {
					targetField: {
						"市場領域 (Target Market Areas)": ["Healthcare", "Finance"],
						"アプリケーション領域 (Application Areas)": ["AI", "ML"],
						"応用テーマ (Application Themes)": ["Automation"],
					},
				},
			}
			const result = extractResearchContext(data, "TED")
			expect(result.domain).toBe(
				"市場領域: Healthcare, Finance | アプリケーション領域: AI, ML | 応用テーマ: Automation",
			)
		})

		it("should extract FAST mode target fields correctly", () => {
			const data: ResearchContextData = {
				userAnswers: {
					targetField: {
						"技術領域 (Technical Domains)": ["Computer Vision", "NLP"],
						"注目すべき技術的な仕組み (Focus Mechanisms)": [
							"Transformers",
							"CNNs",
						],
					},
				},
			}
			const result = extractResearchContext(data, "FAST")
			expect(result.domain).toBe("Computer Vision, NLP")
			expect(result.mechanism).toBe("Transformers, CNNs")
		})

		it("should extract additional context", () => {
			const data: ResearchContextData = {
				userAnswers: {
					additionalContext: "  Some additional context  ",
				},
			}
			const result = extractResearchContext(data, "TED")
			expect(result.context).toBe("Some additional context")
		})

		it("should not extract empty additional context", () => {
			const data: ResearchContextData = {
				userAnswers: {
					additionalContext: "   ",
				},
			}
			const result = extractResearchContext(data, "TED")
			expect(result.context).toBeUndefined()
		})

		it("should handle complete research context data", () => {
			const data: ResearchContextData = {
				userAnswers: {
					purpose: ["Research"],
					targetField: {
						"技術領域 (Technical Domains)": ["AI"],
						"注目すべき技術的な仕組み (Focus Mechanisms)": ["Neural Networks"],
					},
					additionalContext: "Focus on scalability",
				},
			}
			const result = extractResearchContext(data, "FAST")
			expect(result).toEqual({
				purpose: "Research",
				domain: "AI",
				mechanism: "Neural Networks",
				context: "Focus on scalability",
			})
		})
	})

	describe("buildContextInfoMessage", () => {
		it("should return empty string when no parameters provided", () => {
			const result = buildContextInfoMessage()
			expect(result).toBe("")
		})

		it("should build message with purpose only", () => {
			const result = buildContextInfoMessage("Research")
			expect(result).toBe(" (目的: Research)")
		})

		it("should build message with domain for TED mode", () => {
			const result = buildContextInfoMessage(
				undefined,
				"Healthcare",
				undefined,
				"TED",
			)
			expect(result).toBe(" (分野: Healthcare)")
		})

		it("should build message with domain for FAST mode", () => {
			const result = buildContextInfoMessage(
				undefined,
				"Computer Vision",
				undefined,
				"FAST",
			)
			expect(result).toBe(" (技術領域: Computer Vision)")
		})

		it("should include mechanism only for FAST mode", () => {
			const result = buildContextInfoMessage(
				undefined,
				undefined,
				"Transformers",
				"FAST",
			)
			expect(result).toBe(" (技術的仕組み: Transformers)")
		})

		it("should not include mechanism for TED mode", () => {
			const result = buildContextInfoMessage(
				undefined,
				undefined,
				"Transformers",
				"TED",
			)
			expect(result).toBe("")
		})

		it("should combine all parameters for FAST mode", () => {
			const result = buildContextInfoMessage(
				"Research",
				"AI",
				"Neural Networks",
				"FAST",
			)
			expect(result).toBe(
				" (目的: Research, 技術領域: AI, 技術的仕組み: Neural Networks)",
			)
		})

		it("should combine purpose and domain for TED mode", () => {
			const result = buildContextInfoMessage(
				"Development",
				"Healthcare",
				"Some mechanism",
				"TED",
			)
			expect(result).toBe(" (目的: Development, 分野: Healthcare)")
		})
	})
})
