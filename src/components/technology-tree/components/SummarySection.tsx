import {
	BookOpen,
	Briefcase,
	ChevronDown,
	ChevronUp,
	ScrollText,
} from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ExpandableSummary } from "@/components/scenario/side-panel/ExpandableSummary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { enrichmentEventBus } from "@/hooks/useEnrichedData"
import { supabase } from "@/integrations/supabase/client"
import { isMostlyJapanese } from "@/lib/languageUtils"

interface SummaryData {
	papers?: {
		summary: string
		papers_count: number
		query: string
	}
	useCases?: {
		summary: string
		usecases_count: number
		query: string
	}
	patents?: {
		summary: string
		patents_count: number
	}
}

interface SummaryCounts {
	papers: number
	useCases: number
	patents: number
}

interface SummarySectionProps {
	selectedNodeId?: string
	activeTab: string
}

const SUMMARY_RETRY_DELAYS_MS = [1500, 4000, 8000]

function getPatentSummaryFromAnalysis(data: unknown): string | undefined {
	if (!data || typeof data !== "object") return undefined
	const analysis = data as any
	const summary =
		analysis.patent_summary ??
		analysis.analyze_trl?.patent_summary ??
		analysis.analyze_trl?.data?.patent_summary ??
		analysis.analyze_trl?.report?.patent_summary
	return typeof summary === "string" && summary.trim()
		? summary.trim()
		: undefined
}

function getPatentCountFromAnalysis(data: unknown): number | undefined {
	if (!data || typeof data !== "object") return undefined
	const analysis = data as any
	const count =
		analysis.patents_count ??
		analysis.patent_count ??
		analysis.analyze_trl?.patents_count ??
		analysis.analyze_trl?.data?.patents_count
	return typeof count === "number" && Number.isFinite(count) ? count : undefined
}

export const SummarySection: React.FC<SummarySectionProps> = ({
	selectedNodeId,
	activeTab,
}) => {
	// console.log(
	// `[SummarySection] Rendering with selectedNodeId: ${selectedNodeId}, activeTab: ${activeTab}`,
	// )
	const { t, i18n } = useTranslation()
	const [summaryData, setSummaryData] = useState<SummaryData>({})
	const [summaryCounts, setSummaryCounts] = useState<SummaryCounts>({
		papers: 0,
		useCases: 0,
		patents: 0,
	})
	const [, setLoading] = useState(false)
	const retryTimersRef = useRef<number[]>([])
	const retryCountRef = useRef(0)
	const [expandedSections, setExpandedSections] = useState<{
		papers: boolean
		patents: boolean
		useCases: boolean
	}>({
		papers: true,
		patents: true,
		useCases: true,
	})

	const clearSummaryRetries = useCallback(() => {
		for (const timerId of retryTimersRef.current) {
			window.clearTimeout(timerId)
		}
		retryTimersRef.current = []
	}, [])

	// Fetch summaries from database - memoized to prevent infinite loops
	const fetchSummaries = useCallback(
		async (nodeId: string) => {
			try {
				setLoading(true)

				const [
					papersSummaryResult,
					useCasesSummaryResult,
					papersCountResult,
					useCasesCountResult,
					patentsCountResult,
					analysisResult,
				] = await Promise.all([
					supabase
						.from("node_papers_summary")
						.select("summary, papers_count, query")
						.eq("node_id", nodeId)
						.maybeSingle(),
					supabase
						.from("node_usecases_summary")
						.select("summary, usecases_count, query")
						.eq("node_id", nodeId)
						.maybeSingle(),
					supabase
						.from("node_papers")
						.select("id", { count: "exact", head: true })
						.eq("node_id", nodeId),
					supabase
						.from("node_use_cases")
						.select("id", { count: "exact", head: true })
						.eq("node_id", nodeId),
					supabase
						.from("node_patents")
						.select("id", { count: "exact", head: true })
						.eq("node_id", nodeId),
					supabase
						.from("node_analysis")
						.select("data")
						.eq("node_id", nodeId)
						.maybeSingle(),
				])

				const { data: papersData, error: papersError } = papersSummaryResult
				const { data: useCasesData, error: useCasesError } =
					useCasesSummaryResult
				const { count: papersCount, error: papersCountError } =
					papersCountResult
				const { count: useCasesCount, error: useCasesCountError } =
					useCasesCountResult
				const { count: patentsCount, error: patentsCountError } =
					patentsCountResult
				const { data: analysisData, error: analysisError } = analysisResult

				if (papersError) {
					console.error("Error fetching papers summary:", papersError)
				}
				if (useCasesError) {
					console.error("Error fetching use cases summary:", useCasesError)
				}
				if (papersCountError) {
					console.error("Error fetching papers count:", papersCountError)
				}
				if (useCasesCountError) {
					console.error("Error fetching use cases count:", useCasesCountError)
				}
				if (patentsCountError) {
					console.error("Error fetching patents count:", patentsCountError)
				}
				if (analysisError) {
					console.error("Error fetching patent summary:", analysisError)
				}

				const patentSummary = getPatentSummaryFromAnalysis(analysisData?.data)
				const patentTotalCount = getPatentCountFromAnalysis(analysisData?.data)
				const nextCounts = {
					papers: papersCount ?? papersData?.papers_count ?? 0,
					useCases: useCasesCount ?? useCasesData?.usecases_count ?? 0,
					patents: patentTotalCount ?? patentsCount ?? 0,
				}

				const summaryData: SummaryData = {
					papers: papersData
						? {
								summary: papersData.summary,
								papers_count: papersData.papers_count,
								query: papersData.query,
							}
						: undefined,
					useCases: useCasesData
						? {
								summary: useCasesData.summary,
								usecases_count: useCasesData.usecases_count,
								query: useCasesData.query,
							}
						: undefined,
					patents: patentSummary
						? {
								summary: patentSummary,
								patents_count: nextCounts.patents,
							}
						: undefined,
				}

				// console.log(`[SummarySection] Fetched summaries for node ${nodeId}:`, {
				// hasPapersSummary: !!summaryData.papers?.summary,
				// hasUseCasesSummary: !!summaryData.useCases?.summary,
				// papersCount: summaryData.papers?.papers_count || 0,
				// useCasesCount: summaryData.useCases?.usecases_count || 0,
				// summaryData,
				// })

				setSummaryData(summaryData)
				setSummaryCounts(nextCounts)

				const hasPendingSummary =
					(nextCounts.papers > 0 && !summaryData.papers?.summary) ||
					(nextCounts.useCases > 0 && !summaryData.useCases?.summary) ||
					(nextCounts.patents > 0 && !summaryData.patents?.summary)

				if (hasPendingSummary) {
					const retryIndex = retryCountRef.current
					const delay = SUMMARY_RETRY_DELAYS_MS[retryIndex]
					if (delay !== undefined) {
						retryCountRef.current = retryIndex + 1
						const timerId = window.setTimeout(() => {
							retryTimersRef.current = retryTimersRef.current.filter(
								(id) => id !== timerId,
							)
							fetchSummaries(nodeId)
						}, delay)
						retryTimersRef.current.push(timerId)
					}
				} else {
					clearSummaryRetries()
					retryCountRef.current = 0
				}
			} catch (error) {
				console.error("Error fetching summaries:", error)
			} finally {
				setLoading(false)
			}
		},
		[clearSummaryRetries],
	)

	useEffect(() => {
		clearSummaryRetries()
		retryCountRef.current = 0
		if (selectedNodeId) {
			fetchSummaries(selectedNodeId)
		} else {
			setSummaryData({})
			setSummaryCounts({ papers: 0, useCases: 0, patents: 0 })
		}
		return clearSummaryRetries
	}, [selectedNodeId, fetchSummaries, clearSummaryRetries])

	// Subscribe to enrichment events to refresh summaries when enrichment data updates
	useEffect(() => {
		if (!selectedNodeId) return

		// console.log(
		// `[SummarySection] Setting up enrichment listener for node: ${selectedNodeId}`,
		// )

		const unsubscribe = enrichmentEventBus.subscribe((enrichedNodeId) => {
			if (enrichedNodeId === selectedNodeId) {
				// console.log(
				// `[SummarySection] Refreshing summaries for node: ${selectedNodeId}`,
				// )
				clearSummaryRetries()
				retryCountRef.current = 0
				fetchSummaries(selectedNodeId)
			}
		})

		return () => {
			// console.log(
			// `[SummarySection] Cleaning up enrichment listener for node: ${selectedNodeId}`,
			// )
			unsubscribe()
		}
	}, [selectedNodeId, fetchSummaries, clearSummaryRetries])

	const toggleSection = (section: "papers" | "patents" | "useCases") => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}))
	}

	// Don't render if no node is selected
	if (!selectedNodeId) {
		return null
	}

	// Hide summaries that were generated in a different UI language.
	const isEnglish = i18n.language?.toLowerCase().startsWith("en")
	const summaryMatchesCurrentLanguage = (summary: string | undefined) => {
		if (!summary?.trim()) return false
		const summaryIsJapanese = isMostlyJapanese(summary)
		return isEnglish ? !summaryIsJapanese : summaryIsJapanese
	}

	const hasPapersSummary =
		!!summaryData.papers?.summary &&
		summaryMatchesCurrentLanguage(summaryData.papers.summary)
	const hasUseCasesSummary =
		!!summaryData.useCases?.summary &&
		summaryMatchesCurrentLanguage(summaryData.useCases.summary)
	const hasPatentsSummary =
		!!summaryData.patents?.summary &&
		summaryMatchesCurrentLanguage(summaryData.patents.summary)
	const hasPendingSummary =
		(summaryCounts.papers > 0 && !summaryData.papers?.summary) ||
		(summaryCounts.useCases > 0 && !summaryData.useCases?.summary) ||
		(summaryCounts.patents > 0 && !summaryData.patents?.summary)

	if (
		!hasPapersSummary &&
		!hasPatentsSummary &&
		!hasUseCasesSummary &&
		!hasPendingSummary
	) {
		return null
	}

	return (
		<div className="px-4 mb-4">
			<div className="space-y-3">
				{/* Papers Summary */}
				{hasPapersSummary &&
					(activeTab === "papers" || activeTab === "all") && (
						<Card className="border-blue-200 bg-blue-50/30">
							<CardContent className="p-4">
								<Button
									variant="ghost"
									className="w-full justify-between p-0 h-auto font-medium text-blue-800 hover:bg-transparent"
									onClick={() => toggleSection("papers")}
								>
									<div className="flex items-center gap-2">
										<BookOpen className="h-4 w-4" />
										<span>
											{t("summary_section.papers_title", {
												count: summaryData.papers?.papers_count || 0,
											})}
										</span>
									</div>
									{expandedSections.papers ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</Button>

								{expandedSections.papers && (
									<div className="mt-3 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
										<ExpandableSummary
											content={summaryData.papers?.summary || ""}
										/>
									</div>
								)}
							</CardContent>
						</Card>
					)}

				{/* Patents Summary */}
				{hasPatentsSummary &&
					(activeTab === "patents" || activeTab === "all") && (
						<Card className="border-amber-200 bg-amber-50/30">
							<CardContent className="p-4">
								<Button
									variant="ghost"
									className="w-full justify-between p-0 h-auto font-medium text-amber-800 hover:bg-transparent"
									onClick={() => toggleSection("patents")}
								>
									<div className="flex items-center gap-2">
										<ScrollText className="h-4 w-4" />
										<span>
											{t("summary_section.patents_title", {
												count: summaryData.patents?.patents_count || 0,
											})}
										</span>
									</div>
									{expandedSections.patents ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</Button>

								{expandedSections.patents && (
									<div className="mt-3 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
										<ExpandableSummary
											content={summaryData.patents?.summary || ""}
										/>
									</div>
								)}
							</CardContent>
						</Card>
					)}

				{/* Use Cases Summary */}
				{hasUseCasesSummary &&
					(activeTab === "implementation" || activeTab === "all") && (
						<Card className="border-green-200 bg-green-50/30">
							<CardContent className="p-4">
								<Button
									variant="ghost"
									className="w-full justify-between p-0 h-auto font-medium text-green-800 hover:bg-transparent"
									onClick={() => toggleSection("useCases")}
								>
									<div className="flex items-center gap-2">
										<Briefcase className="h-4 w-4" />
										<span>
											{t("summary_section.cases_title", {
												count: summaryData.useCases?.usecases_count || 0,
											})}
										</span>
									</div>
									{expandedSections.useCases ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</Button>

								{expandedSections.useCases && (
									<div className="mt-3 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
										<ExpandableSummary
											content={summaryData.useCases?.summary || ""}
										/>
									</div>
								)}
							</CardContent>
						</Card>
					)}

				{hasPendingSummary && (
					<Card className="border-gray-200 bg-gray-50/30">
						<CardContent className="p-4">
							<div className="flex items-center gap-2 text-gray-600">
								<div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
								<span className="text-sm">{t("summary_section.loading")}</span>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}
