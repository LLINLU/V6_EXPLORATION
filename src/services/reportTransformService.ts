/**
 * Transform raw API section data (from scenario_report_sections DB rows)
 * into the ScenarioReportData shape used by the frontend.
 */

import type { ReportSectionRecord } from "@/services/scenarioReportService"
import type {
	ExecutiveSummaryData,
	MarketAnalysisData,
	MarketImpl,
	ResearchLandscapeData,
	ScenarioReportData,
	SocialIssueSolution,
	TechnicalCompetitorData,
	TechnologyScore,
	TrlData,
	TrlDerivation,
	TrlReportSection,
} from "@/types/report"

// ── Helpers ─────────────────────────────────────────

function getSectionData(
	sections: ReportSectionRecord[],
	type: string,
): { raw: unknown; transformed: unknown } | null {
	const section = sections.find((s) => s.section_type === type)
	if (!section || section.status !== "done") return null
	return { raw: section.raw_data, transformed: section.transformed_data }
}

// ── TRL Transform ───────────────────────────────────

function transformTrl(raw: unknown): TrlData | null {
	if (!raw || typeof raw !== "object") return null
	const data = raw as Record<string, unknown>

	const scores: TechnologyScore[] = []
	const reportSections: TrlReportSection[] = []
	const derivations: TrlDerivation[] = []

	// Extract from raw.report (TRLReportOutput format)
	const rawReport = data.raw as Record<string, unknown> | undefined
	const table = data.table as Record<string, unknown> | undefined

	// Build scores from table — support both "rows" (legacy) and "technology_scores" (ApiTRLTableOutput)
	const tableRows =
		(table?.technology_scores as Array<Record<string, unknown>>) ??
		(table?.rows as Array<Record<string, unknown>>) ??
		[]
	for (const row of tableRows) {
		const integratedTrl =
			(row.integrated_trl as number) ?? (row.trl_score as number) ?? 0
		scores.push({
			technology_name: String(
				row.tech_name ?? row.technology_name ?? row.technology ?? "",
			),
			category:
				(row.classification as "feasible" | "bottleneck") ??
				(integratedTrl >= 7 ? "feasible" : "bottleneck"),
			integrated_trl: integratedTrl,
			article_trl: (row.article_trl as number) ?? null,
			patent_trl: (row.patent_trl as number) ?? null,
			market_trl: (row.market_trl as number) ?? null,
			assessment: String(row.feasibility_assessment ?? ""),
			integratedReasoning: String(row.integrated_reasoning ?? ""),
			sourceDetails: [],
		})
	}

	// Build report sections from raw report
	if (rawReport?.report) {
		const reportData = rawReport.report as Record<string, unknown>
		const techs =
			(reportData.technologies as Array<Record<string, unknown>>) ?? []

		const bottlenecks = techs.filter(
			(t) =>
				(t.classification as string) === "bottleneck" ||
				(!t.classification && (t.integrated_trl as number) < 7),
		)
		const feasibles = techs.filter(
			(t) =>
				(t.classification as string) === "feasible" ||
				(!t.classification && (t.integrated_trl as number) >= 7),
		)

		if (bottlenecks.length > 0) {
			reportSections.push({
				heading: "ボトルネック技術",
				summary:
					"以下の技術はTRL 7未満であり、商用展開に向けた追加の開発・検証が必要です。",
				technologies: bottlenecks.map((t) => ({
					name: String(t.tech_name ?? t.technology_name ?? ""),
					content: String(
						t.feasibility_assessment ?? t.integrated_reasoning ?? "",
					),
				})),
			})
		}

		if (feasibles.length > 0) {
			reportSections.push({
				heading: "実現可能な技術",
				summary: "以下の技術はTRL 7以上で、商用利用が見込める段階にあります。",
				technologies: feasibles.map((t) => ({
					name: String(t.tech_name ?? t.technology_name ?? ""),
					content: String(
						t.feasibility_assessment ?? t.integrated_reasoning ?? "",
					),
				})),
			})
		}
	}

	// Enrich scores with sourceDetails from raw.report.technologies
	if (rawReport?.report) {
		const reportData = rawReport.report as Record<string, unknown>
		const techs =
			(reportData.technologies as Array<Record<string, unknown>>) ?? []
		const techMap = new Map<string, Record<string, unknown>>()
		for (const t of techs) {
			const name = String(t.tech_name ?? t.technology_name ?? "")
			if (name) techMap.set(name, t)
		}
		for (const score of scores) {
			if (score.sourceDetails.length > 0) continue
			const match = techMap.get(score.technology_name)
			const assessments =
				(match?.source_assessments as Array<Record<string, unknown>>) ?? []
			if (assessments.length > 0) {
				score.sourceDetails = assessments.map((sa) => ({
					source: sa.source as "article" | "patent" | "market",
					trl_score: (sa.trl_score as number) ?? null,
					reasoning: String(sa.reasoning ?? ""),
					item_count: sa.item_count as number | undefined,
					item_ids: sa.item_ids as string[] | undefined,
					bestSourceRefs: [],
				}))
				if (!score.assessment && match?.feasibility_assessment) {
					score.assessment = String(match.feasibility_assessment)
				}
				if (!score.integratedReasoning && match?.integrated_reasoning) {
					score.integratedReasoning = String(match.integrated_reasoning)
				}
			}
		}
	}

	// Build derivations
	for (const score of scores) {
		derivations.push({
			technology_name: score.technology_name,
			integrated_trl: score.integrated_trl,
			article_trl: score.article_trl,
			patent_trl: score.patent_trl,
			market_trl: score.market_trl,
		})
	}

	return { reportSections, scores, derivations }
}

// ── Market Transform ────────────────────────────────

function transformMarket(raw: unknown): MarketAnalysisData | null {
	if (!raw || typeof raw !== "object") return null
	const data = raw as Record<string, unknown>

	const marketData = data.data as Record<string, unknown> | undefined

	if (!marketData) return null

	const segments = (
		(marketData.segments as Array<Record<string, unknown>>) ?? []
	).map((s) => ({
		segment_name: String(s.segment_name ?? ""),
		share_percent: (s.share_percent as number) ?? 0,
		estimated_size: String(s.estimated_size ?? ""),
		description: s.description ? String(s.description) : undefined,
	}))

	const tamStr = String(marketData.tam_value ?? marketData.tam ?? "N/A")
	const samStr = String(marketData.sam_value ?? marketData.sam ?? "N/A")
	const cagrStr = String(marketData.cagr ?? "N/A")

	return {
		globalTam: { value: tamStr, description: "Total Addressable Market" },
		globalSam: {
			value: samStr,
			description: "Serviceable Addressable Market",
		},
		globalCagr: {
			value: cagrStr,
			description: "Compound Annual Growth Rate",
		},
		tamNumber: parseFloat(String(marketData.tam_numeric ?? "0")) || 0,
		samNumber: parseFloat(String(marketData.sam_numeric ?? "0")) || 0,
		segments,
		derivation: {
			reference_sources: [],
		},
		rawSummary: marketData.summary ? String(marketData.summary) : undefined,
	}
}

// ── Social Issue Transform ──────────────────────────

function transformSocialIssue(raw: unknown): {
	overallSummary: string
	solutions: SocialIssueSolution[]
	totalIssues: number
	totalReferences: number
} | null {
	if (!raw || typeof raw !== "object") return null
	const data = raw as Record<string, unknown>

	const rawResult = data.raw as Record<string, unknown> | undefined
	const solutions: SocialIssueSolution[] = []
	let totalReferences = 0

	const rawSolutions =
		(rawResult?.solutions as Array<Record<string, unknown>>) ?? []
	for (const sol of rawSolutions) {
		const citedSources =
			(sol.cited_sources as Array<Record<string, unknown>>) ?? []
		const sources = citedSources.map((cs, idx) => ({
			index: idx + 1,
			url: String(cs.url ?? ""),
			title: cs.title ? String(cs.title) : undefined,
		}))
		totalReferences += sources.length

		solutions.push({
			title: String(sol.title ?? sol.issue_title ?? ""),
			text: String(sol.reason_annotated ?? sol.description ?? ""),
			sources,
		})
	}

	return {
		overallSummary:
			solutions.length > 0
				? `${solutions.length}件の社会課題ソリューションが特定されました。`
				: "社会課題データがありません。",
		solutions,
		totalIssues: solutions.length,
		totalReferences,
	}
}

// ── Technical Competitors Transform ─────────────────

function transformTechnicalCompetitors(
	raw: unknown,
): TechnicalCompetitorData[] {
	if (!raw || !Array.isArray(raw)) return []

	return raw.map((tc: Record<string, unknown>) => {
		const table = tc.table as Record<string, unknown> | undefined
		const rows =
			(table?.rows as Array<Record<string, unknown>>) ??
			(tc.competitors as Array<Record<string, unknown>>) ??
			[]

		const competitors = rows.map((r, idx) => ({
			rank: (r.rank as number) ?? idx + 1,
			company_name: String(r.company_name ?? r.assignee ?? ""),
			country: String(r.country ?? ""),
			patent_count: (r.patent_count as number) ?? 0,
		}))

		return {
			technology_name: String(
				tc.technology_name ?? table?.technology_name ?? "",
			),
			technology_name_ja: tc.technology_name_ja
				? String(tc.technology_name_ja)
				: undefined,
			unique_companies:
				(table?.unique_companies as number) ?? competitors.length,
			analyzed_companies:
				(table?.analyzed_companies as number) ?? competitors.length,
			competitors,
		}
	})
}

// ── Research Landscape (from transformed_data) ──────

function transformResearchLandscape(
	transformed: unknown,
): ResearchLandscapeData | null {
	if (!transformed || typeof transformed !== "object") return null
	const data = transformed as Record<string, unknown>

	return {
		articleCommentary: String(data.articleCommentary ?? ""),
		articleYearlyData:
			(data.articleYearlyData as Array<{
				year: number
				count: number
			}>) ?? [],
		patentCommentary: String(data.patentCommentary ?? ""),
		patentYearlyData:
			(data.patentYearlyData as Array<{
				year: number
				count: number
			}>) ?? [],
		topJournals:
			(data.topJournals as Array<{ name: string; count: number }>) ?? [],
	}
}

// ── Market Implementations (from transformed_data) ──

function transformMarketImplementations(transformed: unknown): MarketImpl[] {
	if (!transformed || !Array.isArray(transformed)) return []

	return transformed.map((item: Record<string, unknown>) => ({
		product: String(item.product ?? ""),
		company: String(item.company ?? ""),
		stage: (item.stage as "commercial" | "rnd") ?? "commercial",
		description: String(item.description ?? ""),
		urls: (item.urls as string[]) ?? [],
		year: (item.year as number) ?? undefined,
	}))
}

// ── Executive Summary (from transformed_data) ───────

function transformExecutiveSummary(
	transformed: unknown,
): ExecutiveSummaryData | null {
	if (!transformed || typeof transformed !== "object") return null
	const data = transformed as Record<string, unknown>

	return {
		narrative: String(data.narrative ?? ""),
		findings: (data.findings as string[]) ?? [],
		marketRows:
			(data.marketRows as Array<{
				index: number
				label: string
				value: string
			}>) ?? [],
		researchRows:
			(data.researchRows as Array<{
				index: number
				label: string
				value: string
			}>) ?? [],
	}
}

// ── Main Transform Function ─────────────────────────

export function transformSectionsToReportData(
	sections: ReportSectionRecord[],
	_scenarioName: string,
): Partial<ScenarioReportData> {
	const result: Partial<ScenarioReportData> = {}

	// TRL
	const trlSection = getSectionData(sections, "trl")
	if (trlSection?.raw) {
		const trl = transformTrl(trlSection.raw)
		if (trl) result.trl = trl
	}

	// Market
	const marketSection = getSectionData(sections, "market")
	if (marketSection?.raw) {
		const market = transformMarket(marketSection.raw)
		if (market) result.market = market
	}

	// Social Issues
	const socialSection = getSectionData(sections, "social_issue")
	if (socialSection?.raw) {
		const social = transformSocialIssue(socialSection.raw)
		if (social) result.socialIssues = social
	}

	// Technical Competitors
	const tcSection = getSectionData(sections, "technical_competitors")
	if (tcSection?.raw) {
		result.technicalCompetitors = transformTechnicalCompetitors(tcSection.raw)
	}

	// Research Landscape (uses transformed_data from derived section)
	const researchSection = getSectionData(sections, "research_landscape")
	if (researchSection?.transformed) {
		const research = transformResearchLandscape(researchSection.transformed)
		if (research) result.research = research
	}

	// Market Implementations (uses transformed_data from derived section)
	const implSection = getSectionData(sections, "market_implementations")
	if (implSection?.transformed) {
		result.marketImplementations = transformMarketImplementations(
			implSection.transformed,
		)
	}

	// Executive Summary (uses transformed_data from derived section)
	const execSection = getSectionData(sections, "executive_summary")
	if (execSection?.transformed) {
		const summary = transformExecutiveSummary(execSection.transformed)
		if (summary) result.executiveSummary = summary
	}

	// Build KPI items from available data
	const kpiItems = buildKpiItems(result)
	if (kpiItems.length > 0) {
		result.kpiItems = kpiItems
	}

	return result
}

function buildKpiItems(data: Partial<ScenarioReportData>) {
	const items: Array<{ label: string; value: string }> = []

	if (data.trl?.scores?.length) {
		const avg =
			data.trl.scores.reduce((s, sc) => s + sc.integrated_trl, 0) /
			data.trl.scores.length
		items.push({ label: "統合TRL", value: avg.toFixed(1) })
	}

	if (data.research) {
		const totalArticles = data.research.articleYearlyData.reduce(
			(s, d) => s + d.count,
			0,
		)
		const totalPatents = data.research.patentYearlyData.reduce(
			(s, d) => s + d.count,
			0,
		)
		if (totalArticles > 0) {
			items.push({
				label: "論文数",
				value: totalArticles.toLocaleString(),
			})
		}
		if (totalPatents > 0) {
			items.push({
				label: "特許数",
				value: totalPatents.toLocaleString(),
			})
		}
	}

	if (data.market) {
		if (data.market.globalTam?.value) {
			items.push({
				label: "TAM (Global)",
				value: data.market.globalTam.value,
			})
		}
		if (data.market.globalSam?.value) {
			items.push({
				label: "SAM (Global)",
				value: data.market.globalSam.value,
			})
		}
	}

	if (data.marketImplementations?.length) {
		items.push({
			label: "市場実装",
			value: `${data.marketImplementations.length}件`,
		})
	}

	return items
}
