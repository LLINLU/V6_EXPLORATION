import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import type { ScenarioReportData } from "@/types/report"
import type { OverallStatus, SectionState } from "@/types/services"

export type { OverallStatus, SectionState } from "@/types/services"

import type {
	CompetitorEntry,
	JournalEntry,
	TechnicalCompetitorData,
	YearlyCount,
} from "@/types/report"

function toYear(value: unknown): number | null {
	if (!value) return null
	if (typeof value === "number" && Number.isFinite(value)) return value
	const date = new Date(String(value))
	const year = date.getFullYear()
	return Number.isFinite(year) ? year : null
}

function buildYearlyCountsForArticles(
	items: Array<{ date?: string | null }>,
): YearlyCount[] {
	const yearMap = new Map<number, number>()
	for (const item of items) {
		const year = toYear(item.date)
		if (year == null) continue
		yearMap.set(year, (yearMap.get(year) ?? 0) + 1)
	}
	return Array.from(yearMap.entries())
		.sort((a, b) => a[0] - b[0])
		.map(([year, count]) => ({ year, count }))
}

function buildYearlyCountsForPatents(
	items: Array<{ earliest_priority_date: unknown; date?: string | null }>,
): YearlyCount[] {
	const yearMap = new Map<number, number>()
	for (const item of items) {
		const year = toYear(item.earliest_priority_date)
		if (year == null) continue
		yearMap.set(year, (yearMap.get(year) ?? 0) + 1)
	}
	return Array.from(yearMap.entries())
		.sort((a, b) => a[0] - b[0])
		.map(([year, count]) => ({ year, count }))
}

// Convert the backend annual_trend map ({ "1970": 64, ... }) into sorted
// YearlyCount[], dropping zero-filled years.
function annualTrendToYearlyCounts(
	trend: Record<string, number> | null | undefined,
): YearlyCount[] {
	if (!trend) return []
	return Object.entries(trend)
		.map(([year, count]) => ({ year: Number(year), count: Number(count) }))
		.filter((d) => Number.isFinite(d.year) && d.count > 0)
		.sort((a, b) => a.year - b.year)
}

function buildTopJournals(
	papers: Array<{ journal?: string | null }>,
): JournalEntry[] {
	const journalMap = new Map<string, number>()
	for (const paper of papers) {
		const journal = (paper.journal ?? "").trim()
		if (!journal) continue
		journalMap.set(journal, (journalMap.get(journal) ?? 0) + 1)
	}
	return Array.from(journalMap.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([journal, count]) => ({ name: journal, count }))
}

function formatCurrency(value: number | null | undefined): string {
	if (value == null || !Number.isFinite(value)) return "—"
	if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
	if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
	if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
	return `$${value}`
}

function buildMarketData(market: any, derivationRaw: any): any {
	const tam = market?.tam ?? {}
	const sam = market?.sam ?? {}

	const tamValue = typeof tam?.value === "number" ? tam.value : null
	const samValue = typeof sam?.value === "number" ? sam.value : null
	const tamFormatted = tam?.market_size ?? formatCurrency(tamValue)
	const samFormatted = sam?.formatted ?? formatCurrency(samValue)
	const cagr = tam?.cagr ?? ""

	const derivation = derivationRaw
		? {
				tam_source_url:
					tam?.source_url ?? derivationRaw?.sources?.[0]?.url ?? undefined,
				tam_source_name:
					tam?.market_name ?? derivationRaw?.sources?.[0]?.title ?? undefined,
				sam_formula: sam?.equation_template ?? undefined,
				sam_description: samFormatted,
				reference_sources: Array.isArray(derivationRaw?.sources)
					? derivationRaw.sources.map((s: any) => ({
							url: s.url ?? "",
							label: s.title ?? s.url ?? "",
						}))
					: [],
			}
		: { reference_sources: [] }

	return {
		japanMarket: undefined,
		globalTam: {
			value: tamFormatted,
			description: tam?.market_definition ?? "",
		},
		globalSam: {
			value: samFormatted,
			description: sam?.equation_template ?? "",
		},
		globalCagr:
			typeof cagr === "string"
				? cagr
				: typeof cagr === "number"
					? `${cagr}%`
					: "",
		tamNumber: tamValue ?? 0,
		samNumber: samValue ?? 0,
		segments: Array.isArray(market?.segments) ? market.segments : [],
		derivation,
		rawSummary: market?.summary ?? "",
	}
}

function mapTechToScore(tech: any): any {
	const integratedTrl = tech.integrated_trl ?? tech.trl_score ?? 0
	const sourceAssessments: any[] = tech.source_assessments ?? []
	return {
		technology_name:
			tech.tech_name ?? tech.technology_name ?? tech.technology ?? "",
		category:
			tech.classification ?? (integratedTrl >= 7 ? "feasible" : "bottleneck"),
		integrated_trl: integratedTrl,
		article_trl:
			tech.article_trl ??
			sourceAssessments.find((s: any) => s.source === "article")?.trl_score ??
			null,
		patent_trl:
			tech.patent_trl ??
			sourceAssessments.find((s: any) => s.source === "patent")?.trl_score ??
			null,
		market_trl:
			tech.market_trl ??
			sourceAssessments.find((s: any) => s.source === "market")?.trl_score ??
			null,
		assessment: tech.feasibility_assessment ?? "",
		integratedReasoning: tech.integrated_reasoning ?? "",
		sourceDetails: sourceAssessments.map((sa: any) => ({
			source: sa.source,
			trl_score: sa.trl_score ?? null,
			reasoning: sa.reasoning ?? "",
			item_count: sa.item_count,
			item_ids: sa.item_ids,
			bestSourceRefs: [],
		})),
	}
}

function buildTrlData(trl: any): {
	reportSections: any[]
	scores: any[]
	derivations: any[]
} {
	const reportSections = trl?.report_sections ?? []
	let scores = trl?.scores ?? []

	if (scores.length === 0 && trl?.report?.technologies) {
		scores = trl.report.technologies.map(mapTechToScore)
	}

	if (scores.length === 0 && trl?.table?.technology_scores) {
		scores = trl.table.technology_scores.map(mapTechToScore)
	}

	if (scores.length === 0 && Array.isArray(trl?.table?.rows)) {
		scores = trl.table.rows.map(mapTechToScore)
	}

	if (scores.length === 0 && trl?.technology_results) {
		scores = trl.technology_results.map((tr: any) => {
			const articleTrl = tr.article_trl?.trl_score ?? null
			const patentTrl = tr.patent_trl?.trl_score ?? null
			const marketTrl = tr.market_trl?.trl_score ?? null
			const validScores = [articleTrl, patentTrl, marketTrl].filter(
				(s) => s != null,
			)
			const integratedTrl =
				validScores.length > 0
					? Math.round(
							validScores.reduce((a: number, b: number) => a + b, 0) /
								validScores.length,
						)
					: 0

			const sourceDetails: any[] = []
			for (const [key, source] of [
				["article_trl", "article"],
				["patent_trl", "patent"],
				["market_trl", "market"],
			] as const) {
				const judgment = tr[key]
				if (judgment && typeof judgment === "object") {
					sourceDetails.push({
						source,
						trl_score: judgment.trl_score ?? null,
						reasoning: judgment.reasoning ?? "",
						item_count: undefined,
						item_ids: judgment.best_source_ids,
						bestSourceRefs: [],
					})
				}
			}

			return {
				technology_name: tr.tech_name ?? "",
				category: integratedTrl >= 7 ? "feasible" : "bottleneck",
				integrated_trl: integratedTrl,
				article_trl: articleTrl,
				patent_trl: patentTrl,
				market_trl: marketTrl,
				assessment: "",
				integratedReasoning: "",
				sourceDetails,
			}
		})
	}

	const techsWithAssessments =
		trl?.raw?.report?.technologies ?? trl?.report?.technologies ?? null
	const derivationTechs = trl?.derivation?.technology_derivations ?? []

	if (
		scores.length > 0 &&
		(techsWithAssessments || derivationTechs.length > 0)
	) {
		const techMap = new Map<string, any>()
		if (techsWithAssessments) {
			for (const t of techsWithAssessments) {
				const name = t.tech_name ?? t.technology_name ?? t.technology ?? ""
				if (name) techMap.set(name, t)
			}
		}

		const derivMap = new Map<string, any>()
		for (const d of derivationTechs) {
			const name = d.tech_name ?? ""
			if (name) derivMap.set(name, d)
		}

		scores = scores.map((s: any) => {
			const match = techMap.get(s.technology_name)
			if (match?.source_assessments?.length && s.sourceDetails?.length === 0) {
				const assessments = match.source_assessments as any[]
				const articleSa = assessments.find((sa: any) => sa.source === "article")
				const patentSa = assessments.find((sa: any) => sa.source === "patent")
				const marketSa = assessments.find((sa: any) => sa.source === "market")
				return {
					...s,
					integrated_trl: s.integrated_trl || match.integrated_trl || 0,
					article_trl: s.article_trl ?? articleSa?.trl_score ?? null,
					patent_trl: s.patent_trl ?? patentSa?.trl_score ?? null,
					market_trl: s.market_trl ?? marketSa?.trl_score ?? null,
					category:
						s.category !== "feasible" && s.category !== "bottleneck"
							? (match.classification ?? s.category)
							: s.category,
					assessment: s.assessment || match.feasibility_assessment || "",
					integratedReasoning:
						s.integratedReasoning || match.integrated_reasoning || "",
					sourceDetails: assessments.map((sa: any) => ({
						source: sa.source,
						trl_score: sa.trl_score ?? null,
						reasoning: sa.reasoning ?? "",
						item_count: sa.item_count,
						item_ids: sa.item_ids,
						bestSourceRefs: [],
					})),
				}
			}

			const deriv = derivMap.get(s.technology_name)
			if (deriv?.source_derivations?.length && s.sourceDetails?.length === 0) {
				const derivations = deriv.source_derivations as any[]
				const articleDeriv = derivations.find(
					(d: any) => d.source === "article",
				)
				const patentDeriv = derivations.find((d: any) => d.source === "patent")
				const marketDeriv = derivations.find((d: any) => d.source === "market")
				return {
					...s,
					integrated_trl: s.integrated_trl || deriv.integrated_trl || 0,
					article_trl: s.article_trl ?? articleDeriv?.trl_score ?? null,
					patent_trl: s.patent_trl ?? patentDeriv?.trl_score ?? null,
					market_trl: s.market_trl ?? marketDeriv?.trl_score ?? null,
					integratedReasoning:
						s.integratedReasoning || deriv.integrated_reasoning || "",
					sourceDetails: derivations.map((sd: any) => ({
						source: sd.source,
						trl_score: sd.trl_score ?? null,
						reasoning: sd.reasoning ?? "",
						item_count: sd.item_count,
						item_ids: sd.best_source_ids,
						bestSourceRefs: [],
					})),
				}
			}

			return s
		})
	}

	return { reportSections, scores, derivations: [] }
}

function buildSocialIssuesData(raw: any): {
	overallSummary: string
	solutions: {
		title: string
		text: string
		sources: {
			index: number
			url: string
			title?: string
			contribution?: string
		}[]
	}[]
	totalIssues: number
	totalReferences: number
} {
	const artifacts = Array.isArray(raw?.report?.content)
		? raw.report.content
		: []
	const legacySolutions = Array.isArray(raw?.solutions) ? raw.solutions : []
	const rawSolutions = Array.isArray(raw?.raw?.solutions)
		? raw.raw.solutions
		: []

	let mapped: { title: string; text: string; sources: any[] }[] = []

	if (artifacts.length > 0) {
		mapped = artifacts
			.filter((a: any) => a.artifact_type === "text" && a.text)
			.map((a: any) => ({
				title: a.artifact_name ?? "",
				text: a.text ?? "",
				sources: [],
			}))
	} else {
		const solutions =
			legacySolutions.length > 0 ? legacySolutions : rawSolutions
		mapped = solutions.map((sol: any) => ({
			title: sol.issue_name ?? sol.title ?? "",
			text: sol.reason_annotated ?? sol.text ?? "",
			sources: Array.isArray(sol.cited_sources)
				? sol.cited_sources.map((src: any, i: number) => ({
						index: i + 1,
						url: src.url ?? "",
						title: src.title,
						contribution: src.contribution,
					}))
				: [],
		}))
	}

	const totalReferences = mapped.reduce(
		(sum: number, s: any) => sum + s.sources.length,
		0,
	)

	return {
		overallSummary:
			mapped.length > 0 ? `${mapped.length}件の社会課題が特定されました。` : "",
		solutions: mapped,
		totalIssues: mapped.length,
		totalReferences,
	}
}

function buildTechnicalCompetitors(raw: unknown): TechnicalCompetitorData[] {
	if (!raw || !Array.isArray(raw)) return []

	return raw.map((tc: any) => {
		const table = tc.table ?? {}
		const rows: any[] = table?.rows ?? tc.competitors ?? []

		const competitors: CompetitorEntry[] = rows.map((r: any, idx: number) => ({
			rank: r.rank ?? idx + 1,
			company_name: String(r.company_name ?? r.assignee ?? ""),
			country: String(r.country ?? ""),
			patent_count: r.patent_count ?? 0,
		}))

		return {
			technology_name: String(
				tc.technology_name ?? table?.technology_name ?? "",
			),
			technology_name_ja: tc.technology_name_ja
				? String(tc.technology_name_ja)
				: undefined,
			unique_companies: table?.unique_companies ?? competitors.length,
			analyzed_companies: table?.analyzed_companies ?? competitors.length,
			competitors,
		}
	})
}

export interface UseScenarioReportResult {
	reportData: ScenarioReportData | null
	isLoading: boolean
	error: Error | null
	sectionStates: Record<string, SectionState>
	overallStatus: OverallStatus
	refetch: () => void
	generate: () => Promise<void>
	retrySection: () => Promise<void>
	reportId: string | null
}

export function useScenarioReport(
	scenarioName: string | null,
	scenarioId?: string | null,
): UseScenarioReportResult {
	const [reportData, setReportData] = useState<ScenarioReportData | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const sectionStates: Record<string, SectionState> = {}
	const [overallStatus, setOverallStatus] = useState<OverallStatus>("idle")

	const fetchReport = useCallback(async () => {
		if (!scenarioId || !scenarioName) return

		setIsLoading(true)
		setError(null) // Clear stale errors on each fetch

		try {
			// Use allSettled so one failed query doesn't discard all others
			const [
				analysisResult,
				papersResult,
				patentsResult,
				usecasesResult,
				reportRowResult,
			] = await Promise.allSettled([
				supabase
					.from("node_analysis")
					.select("*")
					.eq("node_id", scenarioId)
					.maybeSingle(),
				supabase.from("node_papers").select("*").eq("node_id", scenarioId),
				supabase.from("node_patents").select("*").eq("node_id", scenarioId),
				supabase.from("node_use_cases").select("*").eq("node_id", scenarioId),
				(supabase as any)
					.from("scenario_reports")
					.select("id")
					.eq("scenario_id", scenarioId)
					.order("created_at", { ascending: false })
					.limit(1)
					.maybeSingle(),
			])

			// Extract data safely — fall back to null/[] if query failed or returned an error
			const analysisRow =
				analysisResult.status === "fulfilled" && !analysisResult.value.error
					? analysisResult.value.data
					: null

			const papers =
				papersResult.status === "fulfilled" && !papersResult.value.error
					? papersResult.value.data
					: []

			const patents =
				patentsResult.status === "fulfilled" && !patentsResult.value.error
					? patentsResult.value.data
					: []

			const usecases =
				usecasesResult.status === "fulfilled" && !usecasesResult.value.error
					? usecasesResult.value.data
					: []

			const reportRow =
				reportRowResult.status === "fulfilled" && !reportRowResult.value.error
					? reportRowResult.value.data
					: null

			// Fetch technical competitors — non-fatal if it fails
			let techCompetitorsRaw: any = null
			if (reportRow?.id) {
				const { data: sections, error: sectionsError } = await (supabase as any)
					.from("scenario_report_sections")
					.select("raw_data")
					.eq("report_id", reportRow.id)
					.eq("section_type", "technical_competitors")
					.eq("status", "done")
					.maybeSingle()

				if (!sectionsError) {
					techCompetitorsRaw = sections?.raw_data ?? null
				}
			}

			const analysis = analysisRow?.data ?? {}
			const market = analysis?.analyze_market?.data ?? {}
			const trl = analysis?.analyze_trl ?? {}
			const socialIssueRaw = analysis?.analyze_social_issue ?? {}

			const papersData = papers ?? []
			const patentsData = patents ?? []

			const articleYearlyData = buildYearlyCountsForArticles(papersData)
			// Prefer the backend annual_trend (full population, persisted in
			// node_analysis.data.patent_annual_trend); fall back to bucketing the
			// saved (<=200) patents by earliest_priority_date.
			const patentAnnualTrend = (analysis as Record<string, unknown>)
				?.patent_annual_trend as Record<string, number> | undefined
			const patentTrendFromBackend =
				annualTrendToYearlyCounts(patentAnnualTrend)
			const patentYearlyData =
				patentTrendFromBackend.length > 0
					? patentTrendFromBackend
					: buildYearlyCountsForPatents(patentsData)
			const patentTotalCount =
				patentTrendFromBackend.length > 0
					? patentTrendFromBackend.reduce((s, d) => s + d.count, 0)
					: patentsData.length
			const topJournals = buildTopJournals(papersData)

			const report: ScenarioReportData = {
				title: scenarioName,
				subtitle: "シナリオレポート",
				kpiItems: [],
				executiveSummary: {
					narrative: market?.summary ?? "",
					findings: [],
					marketRows: [],
					researchRows: [],
				},
				trl: buildTrlData(trl),
				market: buildMarketData(market, analysis?.analyze_market?.derivation),
				research: {
					articleCommentary:
						articleYearlyData.length > 0
							? `論文は ${articleYearlyData[0]?.year}年から${articleYearlyData[articleYearlyData.length - 1]?.year}年にかけて収集されています。総件数は ${papersData.length} 件です。`
							: "論文データはまだありません。",
					articleYearlyData,
					patentCommentary:
						patentYearlyData.length > 0
							? `特許は ${patentYearlyData[0]?.year}年から${patentYearlyData[patentYearlyData.length - 1]?.year}年にかけて収集されています。総件数は ${patentTotalCount} 件です。`
							: "特許データはまだありません。",
					patentYearlyData,
					topJournals,
				},
				marketImplementations: usecases ?? [],
				socialIssues: buildSocialIssuesData(socialIssueRaw),
				technicalCompetitors: buildTechnicalCompetitors(techCompetitorsRaw),
			}

			const hasContent =
				!!market?.summary ||
				!!market?.tam ||
				!!trl?.scores?.length ||
				!!trl?.report_sections?.length ||
				!!trl?.report?.technologies?.length ||
				!!trl?.table?.technology_scores?.length ||
				!!trl?.table?.rows?.length ||
				!!trl?.technology_results?.length ||
				!!socialIssueRaw?.report?.content?.length ||
				!!socialIssueRaw?.solutions?.length ||
				!!techCompetitorsRaw

			if (hasContent) {
				setReportData(report)
				setOverallStatus("done")
			} else {
				setReportData(null)
				setOverallStatus("idle")
			}
		} catch (err) {
			setError(err instanceof Error ? err : new Error("report load failed"))
			setReportData(null)
			setOverallStatus("idle")
		} finally {
			setIsLoading(false)
		}
	}, [scenarioId, scenarioName])

	useEffect(() => {
		fetchReport()
	}, [fetchReport])

	return {
		reportData,
		isLoading,
		error,
		sectionStates,
		overallStatus,
		refetch: fetchReport,
		generate: async () => {},
		retrySection: async () => {},
		reportId: null,
	}
}
