/**
 * Scenario Filter Utilities
 * Logic for filtering scenarios based on various criteria
 */

import type { FilterState, Scenario } from "@/types/scenario"

/**
 * Apply all filters to scenario list
 */
export function applyFilters(
	scenarios: Scenario[],
	filters: FilterState,
): Scenario[] {
	return scenarios.filter((scenario) => {
		// TAM Category filter
		if (filters.tamCategory !== "all") {
			if (scenario.metrics.tamCategory !== filters.tamCategory) {
				return false
			}
		}

		// TRL Category filter
		if (filters.trlCategory !== "all") {
			if (scenario.metrics.trlCategory !== filters.trlCategory) {
				return false
			}
		}

		// CAGR Category filter
		if (filters.cagrCategory && filters.cagrCategory !== "all") {
			if (scenario.metrics.cagrCategory !== filters.cagrCategory) {
				return false
			}
		}

		// Implementation Difficulty filter
		if (
			filters.implementationDifficulty &&
			filters.implementationDifficulty !== "all"
		) {
			if (
				scenario.metrics.implementationDifficulty !==
				filters.implementationDifficulty
			) {
				return false
			}
		}

		// Time to Market filter
		if (filters.timeToMarket && filters.timeToMarket !== "all") {
			if (scenario.metrics.timeToMarket !== filters.timeToMarket) {
				return false
			}
		}

		// Paper Count filters
		if (filters.minPaperCount && filters.minPaperCount > 0) {
			if (
				!scenario.metrics.paperCount ||
				scenario.metrics.paperCount < filters.minPaperCount
			) {
				return false
			}
		}
		if (filters.maxPaperCount) {
			if (
				!scenario.metrics.paperCount ||
				scenario.metrics.paperCount > filters.maxPaperCount
			) {
				return false
			}
		}

		// Patent Count filters
		if (filters.minPatentCount && filters.minPatentCount > 0) {
			if (
				!scenario.metrics.patentCount ||
				scenario.metrics.patentCount < filters.minPatentCount
			) {
				return false
			}
		}
		if (filters.maxPatentCount) {
			if (
				!scenario.metrics.patentCount ||
				scenario.metrics.patentCount > filters.maxPatentCount
			) {
				return false
			}
		}

		// Implementation Count filters
		if (filters.minImplementationCount && filters.minImplementationCount > 0) {
			if (
				!scenario.metrics.implementationCount ||
				scenario.metrics.implementationCount < filters.minImplementationCount
			) {
				return false
			}
		}
		if (filters.maxImplementationCount) {
			if (
				!scenario.metrics.implementationCount ||
				scenario.metrics.implementationCount > filters.maxImplementationCount
			) {
				return false
			}
		}

		// Competitiveness filters
		if (filters.minCompetitiveness && filters.minCompetitiveness > 0) {
			if (
				!scenario.metrics.competitiveness ||
				scenario.metrics.competitiveness < filters.minCompetitiveness
			) {
				return false
			}
		}
		if (filters.maxCompetitiveness && filters.maxCompetitiveness < 10) {
			if (
				!scenario.metrics.competitiveness ||
				scenario.metrics.competitiveness > filters.maxCompetitiveness
			) {
				return false
			}
		}

		// Selected tags filter (OR logic - scenario must have at least one of the selected tags)
		if (filters.selectedTags.length > 0) {
			const hasAnyTag = filters.selectedTags.some((tag) =>
				scenario.tags.includes(tag),
			)
			if (!hasAnyTag) return false
		}

		return true
	})
}

/**
 * Get all unique tags from scenarios
 */
export function getAllUniqueTags(scenarios: Scenario[]): string[] {
	const tagSet = new Set<string>()
	scenarios.forEach((scenario) => {
		scenario.tags.forEach((tag) => tagSet.add(tag))
	})
	return Array.from(tagSet).sort()
}

/**
 * Get count of scenarios matching each filter category
 */
export function getFilterCounts(scenarios: Scenario[]) {
	const counts = {
		tamCategories: {
			small: 0,
			medium: 0,
			large: 0,
			"very-large": 0,
		},
		trlCategories: {
			early: 0,
			mid: 0,
			mature: 0,
		},
		cagrCategories: {
			low: 0,
			medium: 0,
			high: 0,
			"very-high": 0,
		},
	}

	scenarios.forEach((scenario) => {
		if (scenario.metrics.tamCategory) {
			counts.tamCategories[scenario.metrics.tamCategory]++
		}
		if (scenario.metrics.trlCategory) {
			counts.trlCategories[scenario.metrics.trlCategory]++
		}
		if (scenario.metrics.cagrCategory) {
			counts.cagrCategories[scenario.metrics.cagrCategory]++
		}
	})

	return counts
}
