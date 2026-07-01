import { useEffect, useState } from "react"

import { useEnrichedData } from "@/hooks/useEnrichedData"
import {
	containsJapanese,
	debouncedTranslateSearchTerm,
} from "@/utils/searchTranslation"

export const usePaperList = (
	selectedNodeId?: string,
	externalFilterString?: string,
	externalSortBy?: string,
	externalKeyword?: string,
) => {
	const [refreshKey, setRefreshKey] = useState(0)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)
	const [filters, setFilters] = useState({
		timePeriod: "",
		citations: "",
		region: "",
		completeness: "",
	})
	const [sortBy, setSortBy] = useState("")
	const [translatedSearchTerm, setTranslatedSearchTerm] = useState("")
	// Use external filter/sort if provided, otherwise use internal state
	const activeFilters = externalFilterString
		? (() => {
				const filterArray = externalFilterString.split(",").filter(Boolean)
				const newFilters = {
					timePeriod: "",
					citations: "",
					region: "",
					completeness: "",
				}

				filterArray.forEach((filter) => {
					if (filter.includes("past-")) {
						newFilters.timePeriod = filter
					} else if (filter.includes("citations-") || filter === "any") {
						newFilters.citations = filter
					} else if (["domestic", "international", "both"].includes(filter)) {
						newFilters.region = filter
					} else if (["complete", "incomplete", "all"].includes(filter)) {
						newFilters.completeness = filter
					}
				})

				return newFilters
			})()
		: filters

	const activeSortBy = externalSortBy || sortBy

	// Use real data from database when node is selected
	const { papers: realPapers, loadingPapers } = useEnrichedData(
		selectedNodeId || null,
	)
	// Transform real data to match the expected format for PaperCard
	const transformedRealPapers = realPapers.map((paper) => ({
		title: {
			english: paper.title,
		},
		authors: paper.authors,
		journal: paper.journal,
		tags: paper.tags,
		abstract: paper.abstract,
		date: paper.date,
		citations: paper.citations || 0,
		region: paper.region || "domestic",
		doi: paper.doi,
		score: paper.score,
	}))

	// Use real data if available, show loading state during fetch, otherwise show empty if no node selected
	const basePapers = selectedNodeId ? transformedRealPapers : []

	// Apply filters
	const filteredPapers = basePapers.filter((paper) => {
		// Keyword search filter (search in title, abstract, and authors)
		if (externalKeyword?.trim()) {
			// Use translated search term if available, otherwise use original
			const searchTerm = translatedSearchTerm || externalKeyword
			const keyword = searchTerm.toLowerCase()
			const titleMatch =
				paper.title?.english?.toLowerCase().includes(keyword) ||
				paper.title?.toString()?.toLowerCase().includes(keyword)
			const abstractMatch = paper.abstract?.toLowerCase().includes(keyword)
			const authorsMatch = paper.authors?.toLowerCase().includes(keyword)

			if (!titleMatch && !abstractMatch && !authorsMatch) {
				return false
			}
		}
		// Time period filter
		if (activeFilters.timePeriod) {
			const paperYear = new Date(paper.date || "").getFullYear()
			const currentYear = new Date().getFullYear()

			switch (activeFilters.timePeriod) {
				case "past-year":
					if (currentYear - paperYear > 1) return false
					break
				case "past-5-years":
					if (currentYear - paperYear > 5) return false
					break
				case "past-10-years":
					if (currentYear - paperYear > 10) return false
					break
			}
		} // Citations filter (only apply if the paper has citations property)
		if (activeFilters.citations && "citations" in paper) {
			const citations = paper.citations || 0
			switch (activeFilters.citations) {
				case "any":
					// Show all papers including those with 0 citations
					break
				case "citations-0":
					if (citations !== 0) return false
					break
				case "citations-10":
					if (citations < 10) return false
					break
				case "citations-50":
					if (citations < 50) return false
					break
				case "citations-100":
					if (citations < 100) return false
					break
			}
		} // Region filter (only apply if the paper has region property)
		if (
			activeFilters.region &&
			activeFilters.region !== "both" &&
			"region" in paper
		) {
			if (paper.region !== activeFilters.region) return false
		}

		// Completeness filter
		if (activeFilters.completeness) {
			const hasCompleteInfo = paper.authors && paper.journal
			switch (activeFilters.completeness) {
				case "complete":
					if (!hasCompleteInfo) return false
					break
				case "incomplete":
					if (hasCompleteInfo) return false
					break
				case "all":
					// Show all papers regardless of completeness
					break
			}
		}

		return true
	})

	// Apply sorting
	const sortedPapers = [...filteredPapers].sort((a, b) => {
		switch (activeSortBy) {
			case "newest":
				return (
					new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
				)
			case "oldest":
				return (
					new Date(a.date || "").getTime() - new Date(b.date || "").getTime()
				)
			case "citations":
				return (b.citations || 0) - (a.citations || 0)
			default:
				return 0
		}
	})

	const finalPapers = sortedPapers

	useEffect(() => {
		const handleRefresh = (event: Event) => {
			// console.log("Refreshing papers with event:", event)
			const customEvent = event as CustomEvent

			if (customEvent.detail) {
				// console.log("Refresh detail:", customEvent.detail)
				// Legacy paper set handling - no longer used but kept for compatibility
				// console.log("Paper refresh requested for:", customEvent.detail.nodeId)
			}

			setRefreshKey((prev) => prev + 1)
			setCurrentPage(1)

			setTimeout(() => {
				const sidebarContent = document.querySelector(
					'[data-sidebar="content"]',
				)
				if (sidebarContent) {
					sidebarContent.scrollTop = 0
				}
			}, 100)
		}

		document.addEventListener("refresh-papers", handleRefresh)
		return () => {
			document.removeEventListener("refresh-papers", handleRefresh)
		}
	}, [])

	// Handle translation of Japanese search terms
	useEffect(() => {
		if (externalKeyword?.trim()) {
			if (containsJapanese(externalKeyword)) {
				// console.log(
				// "Detected Japanese in search term, translating:",
				// externalKeyword,
				// )
				debouncedTranslateSearchTerm(externalKeyword, (translatedText) => {
					// console.log(
					// "Translation completed:",
					// externalKeyword,
					// "->",
					// translatedText,
					// )
					setTranslatedSearchTerm(translatedText)
				})
			} else {
				// console.log(
				// "No Japanese detected, using original search term:",
				// externalKeyword,
				// )
				setTranslatedSearchTerm("")
			}
		} else {
			setTranslatedSearchTerm("")
		}
	}, [externalKeyword])

	// Reset pagination when filters or sort change
	useEffect(() => {
		setCurrentPage(1)
	}, [])
	const handleFilterChange = (filterString: string) => {
		const filterArray = filterString.split(",").filter(Boolean)
		const newFilters = {
			timePeriod: "",
			citations: "",
			region: "",
			completeness: "",
		}

		filterArray.forEach((filter) => {
			if (filter.includes("past-")) {
				newFilters.timePeriod = filter
			} else if (filter.includes("citations-") || filter === "any") {
				newFilters.citations = filter
			} else if (["domestic", "international", "both"].includes(filter)) {
				newFilters.region = filter
			} else if (["complete", "incomplete", "all"].includes(filter)) {
				newFilters.completeness = filter
			}
		})

		setFilters(newFilters)
	}

	const handleSortChange = (sort: string) => {
		setSortBy(sort)
	}
	const totalPages = Math.ceil(finalPapers.length / pageSize)
	const startIndex = (currentPage - 1) * pageSize
	const visiblePapers = finalPapers.slice(startIndex, startIndex + pageSize)
	return {
		papers: visiblePapers,
		allPapers: finalPapers, // All papers for context
		currentPage,
		setCurrentPage,
		pageSize,
		setPageSize,
		totalPages,
		totalCount: finalPapers.length,
		refreshKey,
		loading: loadingPapers,
		onFilterChange: handleFilterChange,
		onSortChange: handleSortChange,
	}
}
