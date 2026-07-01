import { useCallback, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { getOutputLanguage } from "@/lib/outputLanguage"

type FetchScenarioPaperArgs = {
	treeId: string
	nodeId: string
	query: string
	scenarioName: string
	teamId?: string | null
	treeType?: "TED" | "FAST" | null
	language?: string
}

type FetchScenarioPatentsArgs = {
	treeId: string
	nodeId: string
	query: string
	scenarioName: string
	teamId?: string | null
	language?: string
}

type FetchScenarioMarketImplsArgs = {
	treeId: string
	nodeId: string
	query: string
	scenarioName: string
	teamId?: string | null
	language?: string
}

type ScenarioPaperResult = {
	paperCount: number
	topTitles: string[]

	// CAGR results
	cagr?: number | null
	cagrPct?: number | null

	// optional metadata for debugging / charts
	cagrMeta?: {
		startYear: number | null
		endYear: number | null
		startValue: number | null
		endValue: number | null
		yearCounts: Record<number, number>
	}

	summary?: string
	raw?: any
	source?: "db" | "edge"
}

type ScenarioPatentResult = {
	patentCount: number
	topTitles: string[]
	summary?: string
	raw?: any
	source?: "db" | "edge"
}

type ScenarioMarketImplsResult = {
	useCaseCount: number
	summary?: string
	raw?: any
	source?: "db" | "edge"
}

type CAGRResult = {
	cagr: number | null
	startYear: number | null
	endYear: number | null
	startValue: number | null
	endValue: number | null
	yearCounts: Record<number, number>
}

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
		analysis.analyze_trl?.patents_count ??
		analysis.analyze_trl?.data?.patents_count ??
		analysis.analyze_trl?.report?.patents_count
	return typeof count === "number" && Number.isFinite(count) ? count : undefined
}

function calculatePaperCAGRFromField<T extends Record<string, unknown>>(
	papers: T[],
	dateField: keyof T,
): CAGRResult {
	const yearCounts: Record<number, number> = {}

	for (const paper of papers) {
		const raw = paper[dateField]
		if (typeof raw !== "string" || raw.length < 4) continue

		const year = Number(raw.slice(0, 4))
		if (!Number.isFinite(year)) continue

		yearCounts[year] = (yearCounts[year] ?? 0) + 1
	}

	const years = Object.keys(yearCounts)
		.map(Number)
		.sort((a, b) => a - b)

	if (years.length < 2) {
		return {
			cagr: null,
			startYear: null,
			endYear: null,
			startValue: null,
			endValue: null,
			yearCounts,
		}
	}

	const startYear = years[0]
	const endYear = years[years.length - 1]
	const startValue = yearCounts[startYear]
	const endValue = yearCounts[endYear]
	const numYears = endYear - startYear

	if (startValue <= 0 || endValue <= 0 || numYears <= 0) {
		return {
			cagr: null,
			startYear,
			endYear,
			startValue,
			endValue,
			yearCounts,
		}
	}

	return {
		cagr: (endValue / startValue) ** (1 / numYears) - 1,
		startYear,
		endYear,
		startValue,
		endValue,
		yearCounts,
	}
}
// Tracks nodeIds where search-scenario-articles has already been invoked this session,
// preventing duplicate concurrent calls when the user navigates back before papers are ready.
const invokedArticleNodeIds = new Set<string>()

// ── Analysis job types ──────────────────────────────

type AnalysisKind =
	| "analyze_market"
	| "analyze_trl"
	| "analyze_social_issue"
	| "preanalyze"

type AnalysisJobResult = {
	source: "db" | "edge" | "queued" | "polling" | "running"
	raw: any
}

type AnalysisJobArgs = {
	treeId: string
	nodeId: string
	query: string
	scenarioName: string
	scenarioDescription?: string
	userContext?: string
	language?: string
	force?: boolean
}

const ANALYSIS_CONFIG: Record<
	AnalysisKind,
	{
		dataKey: string
		jobKey: string
		edgeFunctionName: string
		inProgressStatuses: string[]
	}
> = {
	analyze_market: {
		dataKey: "analyze_market",
		jobKey: "analyze_market_job",
		edgeFunctionName: "scenario-analyze-market",
		inProgressStatuses: ["queued", "running"],
	},
	analyze_trl: {
		dataKey: "analyze_trl",
		jobKey: "analyze_trl_job",
		edgeFunctionName: "scenario-analyze-trl",
		inProgressStatuses: ["queued", "running"],
	},
	analyze_social_issue: {
		dataKey: "analyze_social_issue",
		jobKey: "analyze_social_issue_job",
		edgeFunctionName: "scenario-analyze-social-issue",
		inProgressStatuses: ["queued", "running"],
	},
	preanalyze: {
		dataKey: "preanalyze",
		jobKey: "preanalyze_job",
		edgeFunctionName: "scenario-preanalyze",
		inProgressStatuses: ["running"],
	},
}

/** Shared logic for all analysis job fetch functions */
async function fetchAnalysisJob(
	kind: AnalysisKind,
	args: AnalysisJobArgs,
	extraBody?: Record<string, unknown>,
): Promise<AnalysisJobResult> {
	const config = ANALYSIS_CONFIG[kind]

	// Check existing data in DB
	const { data: existingRow, error: existingError } = await supabase
		.from("node_analysis")
		.select("id, node_id, data")
		.eq("node_id", args.nodeId)
		.maybeSingle()

	if (existingError) {
		console.error(
			`[useScenarioEnrichment] node_analysis lookup failed (${kind}):`,
			existingError,
		)
	}

	const analysisData: any =
		existingRow?.data && typeof existingRow.data === "object"
			? existingRow.data
			: {}

	// Already completed — skip cache if force=true (retry)
	const existing = analysisData[config.dataKey]
	if (existing && existing?.status !== "not_available" && !extraBody?.force) {
		return { source: "db", raw: existing }
	}

	// Job already in progress — skip check if force=true (retry)
	const jobInfo = analysisData[config.jobKey]
	if (
		!extraBody?.force &&
		jobInfo &&
		config.inProgressStatuses.includes(jobInfo.status)
	) {
		return { source: "polling", raw: analysisData }
	}

	// Invoke Edge Function
	const { data, error } = await supabase.functions.invoke(
		config.edgeFunctionName,
		{
			body: {
				treeId: args.treeId,
				nodeId: args.nodeId,
				scenario: {
					user_query: args.query,
					user_context: args.userContext ?? "",
					scenario_name: args.scenarioName,
					scenario_description: args.scenarioDescription ?? "",
				},
				...(args.language ? { language: args.language } : {}),
				...extraBody,
			},
		},
	)

	if (error) {
		console.error(`[useScenarioEnrichment] ${kind} invoke failed:`, error)
		throw error
	}

	// Handle not_available (endpoint not yet deployed on Search API)
	if (data?.status === "not_available") {
		console.warn(
			`[useScenarioEnrichment] ${kind} endpoint not available:`,
			data.message,
		)
		return { source: "edge", raw: data }
	}

	return { source: "queued", raw: data }
}

/** Dedicated fetch for analyze_trl — sends only node_id and tree_id */
async function fetchAnalyzeTrlJob(args: {
	treeId: string
	nodeId: string
	force?: boolean
	language?: string
}): Promise<AnalysisJobResult> {
	const config = ANALYSIS_CONFIG.analyze_trl

	// Check existing data in DB
	const { data: existingRow, error: existingError } = await supabase
		.from("node_analysis")
		.select("id, node_id, data")
		.eq("node_id", args.nodeId)
		.maybeSingle()

	if (existingError) {
		console.error(
			"[useScenarioEnrichment] node_analysis lookup failed (analyze_trl):",
			existingError,
		)
	}

	const analysisData: any =
		existingRow?.data && typeof existingRow.data === "object"
			? existingRow.data
			: {}

	// Already completed — skip cache if force=true (retry)
	const existing = analysisData[config.dataKey]
	if (existing && existing?.status !== "not_available" && !args.force) {
		return { source: "db", raw: existing }
	}

	// Invoke Edge Function — only node_id and tree_id
	const { data, error } = await supabase.functions.invoke(
		config.edgeFunctionName,
		{
			body: {
				nodeId: args.nodeId,
				treeId: args.treeId,
				...(args.language ? { language: args.language } : {}),
			},
		},
	)

	if (error) {
		console.error("[useScenarioEnrichment] analyze_trl invoke failed:", error)
		throw error
	}

	if (data?.status === "not_available") {
		console.warn(
			"[useScenarioEnrichment] analyze_trl endpoint not available:",
			data.message,
		)
		return { source: "edge", raw: data }
	}

	// Papers/patents not yet in DB — signal caller to retry
	if (data?.status === "data_not_ready") {
		return { source: "queued", raw: null }
	}

	// Edge function now returns synchronously with status "completed"
	if (data?.status === "completed") {
		return { source: "edge", raw: data }
	}

	if (data?.status === "already_exists") {
		return { source: "db", raw: data }
	}

	return { source: "edge", raw: data }
}

export function useScenarioEnrichment() {
	const [isFetchingScenarioPaper, setIsFetchingScenarioPaper] = useState(false)
	const [isFetchingScenarioPatents, setIsFetchingScenarioPatents] =
		useState(false)
	const [isFetchingScenarioMarketImpls, setIsFetchingScenarioMarketImpls] =
		useState(false)
	const [isFetchingScenarioPreanalyze, setIsFetchingScenarioPreanalyze] =
		useState(false)

	const fetchScenarioPaper = useCallback(
		async ({
			treeId,
			nodeId,
			query,
			scenarioName,
			teamId,
			treeType,
			language,
		}: FetchScenarioPaperArgs): Promise<ScenarioPaperResult> => {
			setIsFetchingScenarioPaper(true)

			try {
				const [
					{ count, error: countError },
					{ data: preview, error: previewError },
					{ data: summaryRow },
				] = await Promise.all([
					supabase
						.from("node_papers")
						.select("id", { head: true, count: "exact" })
						.eq("tree_id", treeId)
						.eq("node_id", nodeId),
					supabase
						.from("node_papers")
						.select("title, date")
						.eq("tree_id", treeId)
						.eq("node_id", nodeId)
						.order("score", { ascending: false }),
					supabase
						.from("node_papers_summary")
						.select("summary")
						.eq("node_id", nodeId)
						.maybeSingle(),
				])

				if (!countError && !previewError && (count ?? 0) > 0) {
					const growth = calculatePaperCAGRFromField(preview ?? [], "date")

					return {
						paperCount: Number(count ?? 0),
						topTitles: (preview ?? [])
							.map((r: any) => r.title)
							.filter(Boolean)
							.slice(0, 3),
						cagr: growth.cagr,
						cagrPct:
							growth.cagr != null
								? Number((growth.cagr * 100).toFixed(2))
								: null,
						cagrMeta: {
							startYear: growth.startYear,
							endYear: growth.endYear,
							startValue: growth.startValue,
							endValue: growth.endValue,
							yearCounts: growth.yearCounts,
						},
						summary: summaryRow?.summary ?? undefined,
						raw: { preview },
						source: "db",
					}
				}

				if (!invokedArticleNodeIds.has(nodeId)) {
					invokedArticleNodeIds.add(nodeId)
					const { error: invokeError } = await supabase.functions.invoke(
						"search-scenario-articles",
						{
							body: {
								treeId,
								nodeId,
								query: (query ?? "").slice(0, 120),
								scenarioName,
								team_id: teamId ?? null,
								treeType: treeType ?? null,
								language: language ?? getOutputLanguage(),
							},
						},
					)
					if (invokeError) {
						invokedArticleNodeIds.delete(nodeId)
						throw invokeError
					}
				}

				// Edge function writes papers to DB asynchronously — poll until they arrive
				let savedCount = 0
				let savedPreview: { title: string; date: string }[] = []
				for (let attempt = 0; attempt < 10; attempt++) {
					const [{ count: newCount }, { data: newPreview }] = await Promise.all(
						[
							supabase
								.from("node_papers")
								.select("id", { head: true, count: "exact" })
								.eq("tree_id", treeId)
								.eq("node_id", nodeId),
							supabase
								.from("node_papers")
								.select("title, date")
								.eq("tree_id", treeId)
								.eq("node_id", nodeId)
								.order("score", { ascending: false }),
						],
					)
					savedCount = Number(newCount ?? 0)
					savedPreview = (newPreview ?? []) as {
						title: string
						date: string
					}[]
					if (savedCount > 0) break
					await new Promise((r) => setTimeout(r, 3000))
				}

				const growth = calculatePaperCAGRFromField(savedPreview, "date")

				return {
					paperCount: savedCount,
					topTitles: savedPreview
						.map((r) => r.title)
						.filter(Boolean)
						.slice(0, 3),
					cagr: growth.cagr,
					cagrPct:
						growth.cagr != null ? Number((growth.cagr * 100).toFixed(2)) : null,
					cagrMeta: {
						startYear: growth.startYear,
						endYear: growth.endYear,
						startValue: growth.startValue,
						endValue: growth.endValue,
						yearCounts: growth.yearCounts,
					},
					raw: { preview: savedPreview },
					source: "edge",
				}
			} finally {
				setIsFetchingScenarioPaper(false)
			}
		},
		[],
	)

	const fetchScenarioPatents = useCallback(
		async ({
			treeId,
			nodeId,
			query,
			scenarioName,
			teamId,
			language,
		}: FetchScenarioPatentsArgs): Promise<ScenarioPatentResult> => {
			setIsFetchingScenarioPatents(true)

			try {
				const [
					{ count, error: countError },
					{ data: preview, error: previewError },
					{ data: analysisRow },
				] = await Promise.all([
					supabase
						.from("node_patents")
						.select("id", { head: true, count: "exact" })
						.eq("node_id", nodeId),
					supabase
						.from("node_patents")
						.select("title")
						.eq("node_id", nodeId)
						.limit(3),
					supabase
						.from("node_analysis")
						.select("data")
						.eq("node_id", nodeId)
						.maybeSingle(),
				])

				const patentSummary = getPatentSummaryFromAnalysis(analysisRow?.data)
				const patentTotalCount = getPatentCountFromAnalysis(analysisRow?.data)

				if (!countError && !previewError && (count ?? 0) > 0) {
					return {
						patentCount: patentTotalCount ?? Number(count ?? 0),
						topTitles: (preview ?? []).map((r: any) => r.title).filter(Boolean),
						summary: patentSummary,
						raw: { preview },
						source: "db",
					}
				}

				const { data, error } = await supabase.functions.invoke(
					"search-scenario-patents",
					{
						body: {
							tree_id: treeId,
							treeId,
							node_id: nodeId,
							nodeId,
							query: (query ?? "").slice(0, 200),
							scenarioName,
							scenario_name: scenarioName,
							team_id: teamId ?? null,
							language: language ?? getOutputLanguage(),
						},
					},
				)

				if (error) throw error

				return {
					patentCount: Number(
						data?.fetchedCount ??
							data?.results?.patents?.count ??
							data?.displayedCount ??
							data?.savedCount ??
							0,
					),
					topTitles: Array.isArray(data?.topTitles) ? data.topTitles : [],
					summary: typeof data?.summary === "string" ? data.summary : undefined,
					raw: data,
					source: "edge",
				}
			} finally {
				setIsFetchingScenarioPatents(false)
			}
		},
		[],
	)

	const fetchScenarioMarketImpls = useCallback(
		async ({
			treeId,
			nodeId,
			query,
			scenarioName,
			teamId,
			language,
		}: FetchScenarioMarketImplsArgs): Promise<ScenarioMarketImplsResult> => {
			setIsFetchingScenarioMarketImpls(true)

			try {
				const [{ count, error: countError }, { data: summaryRow }] =
					await Promise.all([
						supabase
							.from("node_use_cases")
							.select("id", { head: true, count: "exact" })
							.eq("node_id", nodeId),
						supabase
							.from("node_usecases_summary")
							.select("summary")
							.eq("node_id", nodeId)
							.maybeSingle(),
					])

				if (!countError && (count ?? 0) > 0) {
					return {
						useCaseCount: Number(count ?? 0),
						summary: summaryRow?.summary ?? undefined,
						raw: null,
						source: "db",
					}
				}

				const { data, error } = await supabase.functions.invoke(
					"scenario-market-impls",
					{
						body: {
							tree_id: treeId,
							treeId,
							node_id: nodeId,
							nodeId,
							query: (query ?? "").slice(0, 200),
							scenarioName,
							scenario_name: scenarioName,
							team_id: teamId ?? null,
							language: language ?? getOutputLanguage(),
						},
					},
				)

				if (error) throw error

				// Edge function saves to DB internally. Poll for results.
				let savedCount = 0
				for (let attempt = 0; attempt < 10; attempt++) {
					const { count } = await supabase
						.from("node_use_cases")
						.select("id", { head: true, count: "exact" })
						.eq("node_id", nodeId)
					savedCount = Number(count ?? 0)
					if (savedCount > 0) break
					await new Promise((r) => setTimeout(r, 3000))
				}

				return {
					useCaseCount: savedCount,
					raw: data,
					source: "edge",
				}
			} finally {
				setIsFetchingScenarioMarketImpls(false)
			}
		},
		[],
	)

	const fetchScenarioAnalyzeMarket = useCallback(
		async (
			args: AnalysisJobArgs & {
				segments?: string[]
				targetYear?: number
				targetRegion?: string
				useSelfRefinement?: boolean
			},
		): Promise<AnalysisJobResult> => {
			const {
				segments = [],
				targetYear = 2024,
				targetRegion = "Global",
				useSelfRefinement = true,
				...baseArgs
			} = args
			return fetchAnalysisJob("analyze_market", baseArgs, {
				target_year: targetYear,
				target_region: targetRegion,
				segments,
				use_self_refinement: useSelfRefinement,
			})
		},
		[],
	)

	const fetchScenarioAnalyzeTrl = useCallback(
		async (args: {
			treeId: string
			nodeId: string
			force?: boolean
		}): Promise<AnalysisJobResult> => {
			return fetchAnalyzeTrlJob({
				treeId: args.treeId,
				nodeId: args.nodeId,
				force: args.force,
				language: getOutputLanguage(),
			})
		},
		[],
	)

	const fetchScenarioAnalyzeSocialIssue = useCallback(
		async (_args: AnalysisJobArgs): Promise<AnalysisJobResult | null> => {
			return null
			// return fetchAnalysisJob("analyze_social_issue", args)
		},
		[],
	)

	const fetchScenarioPreanalyze = useCallback(
		async (
			args: AnalysisJobArgs & { force?: boolean },
		): Promise<AnalysisJobResult> => {
			setIsFetchingScenarioPreanalyze(true)
			try {
				return await fetchAnalysisJob("preanalyze", args, {
					force: args.force ?? false,
				})
			} finally {
				setIsFetchingScenarioPreanalyze(false)
			}
		},
		[],
	)

	return {
		fetchScenarioPaper,
		fetchScenarioPatents,
		fetchScenarioMarketImpls,
		fetchScenarioAnalyzeMarket,
		fetchScenarioAnalyzeSocialIssue,
		fetchScenarioAnalyzeTrl,
		fetchScenarioPreanalyze,
		isFetchingScenarioPaper,
		isFetchingScenarioPatents,
		isFetchingScenarioMarketImpls,
		isFetchingScenarioPreanalyze,
		isFetchingAnyScenarioEnrichment:
			isFetchingScenarioPaper ||
			isFetchingScenarioPatents ||
			isFetchingScenarioMarketImpls ||
			isFetchingScenarioPreanalyze,
	}
}
