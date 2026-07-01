import type {
	ExtractedResearchContext,
	ResearchContextData,
} from "@/types/services"

export type { ResearchContextData, ExtractedResearchContext }

/**
 * Extracts and formats research context parameters from user answers.
 * Handles both TED and FAST modes with different extraction logic.
 */
export function extractResearchContext(
	researchContextData: ResearchContextData | undefined,
	mode: "TED" | "FAST",
): ExtractedResearchContext {
	if (!researchContextData?.userAnswers) {
		return {}
	}

	const { userAnswers } = researchContextData
	const result: ExtractedResearchContext = {}

	// Extract purpose from purpose array
	if (userAnswers.purpose && userAnswers.purpose.length > 0) {
		result.purpose = userAnswers.purpose.join(", ")
	}

	// Extract domain and mechanism from targetField
	if (userAnswers.targetField) {
		const targetFieldEntries = Object.entries(userAnswers.targetField)

		if (mode === "TED") {
			// TED mode: Extract market areas, application areas, and application themes
			const marketEntry = targetFieldEntries.find(
				([key]) =>
					key.includes("市場領域") || key.includes("Target Market Areas"),
			)
			const applicationEntry = targetFieldEntries.find(
				([key]) =>
					key.includes("アプリケーション領域") ||
					key.includes("Application Areas"),
			)
			const themeEntry = targetFieldEntries.find(
				([key]) =>
					key.includes("応用テーマ") || key.includes("Application Themes"),
			)

			// Combine all TED selections into domain
			const tedSelections = []
			if (marketEntry && marketEntry[1].length > 0) {
				tedSelections.push(`市場領域: ${marketEntry[1].join(", ")}`)
			}
			if (applicationEntry && applicationEntry[1].length > 0) {
				tedSelections.push(
					`アプリケーション領域: ${applicationEntry[1].join(", ")}`,
				)
			}
			if (themeEntry && themeEntry[1].length > 0) {
				tedSelections.push(`応用テーマ: ${themeEntry[1].join(", ")}`)
			}

			if (tedSelections.length > 0) {
				result.domain = tedSelections.join(" | ")
			}
		} else {
			// FAST mode: Extract technical domains and focus mechanisms
			const domainEntry = targetFieldEntries.find(
				([key]) =>
					key.includes("技術領域") || key.includes("Technical Domains"),
			)
			const mechanismEntry = targetFieldEntries.find(
				([key]) =>
					key.includes("注目すべき技術的な仕組み") ||
					key.includes("Focus Mechanisms"),
			)

			if (domainEntry && domainEntry[1].length > 0) {
				result.domain = domainEntry[1].join(", ")
			}
			if (mechanismEntry && mechanismEntry[1].length > 0) {
				result.mechanism = mechanismEntry[1].join(", ")
			}
		}
	}

	// Extract additional context
	if (userAnswers.additionalContext?.trim()) {
		result.context = userAnswers.additionalContext.trim()
	}

	return result
}

/**
 * Builds a context info message for toasts describing the research context parameters.
 */
export function buildContextInfoMessage(
	purpose?: string,
	domain?: string,
	mechanism?: string,
	mode?: "TED" | "FAST",
): string {
	const contextInfo = []

	if (purpose) contextInfo.push(`目的: ${purpose}`)

	if (domain) {
		if (mode === "TED") {
			contextInfo.push(`分野: ${domain}`)
		} else {
			contextInfo.push(`技術領域: ${domain}`)
		}
	}

	if (mechanism && mode === "FAST") {
		contextInfo.push(`技術的仕組み: ${mechanism}`)
	}

	return contextInfo.length > 0 ? ` (${contextInfo.join(", ")})` : ""
}
