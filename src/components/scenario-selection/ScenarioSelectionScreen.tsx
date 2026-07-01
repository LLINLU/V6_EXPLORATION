import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { toast as sonnerToast } from "sonner"
import { ScenarioSelectionHeader } from "@/components/scenario-selection/ScenarioSelectionHeader"
import { ScenarioSelectionMainLayout } from "@/components/scenario-selection/ScenarioSelectionMainLayout"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useScenarioEnrichment } from "@/hooks/useScenarioEnrichment"
import { supabase } from "@/integrations/supabase/client"
import { getOutputLanguage } from "@/lib/outputLanguage"
import { triggerEnrichmentRefresh } from "@/stores/enrichedDataStore"
import type {
	Scenario,
	ScenarioMetrics,
	TechnologicalAdvantage,
	TechnologyCharacteristics,
	TechnologyTRL,
} from "@/types/scenario"

// ── Toast IDs ────────────────────────────────
const TOAST_IDS = {
	FETCH_TREE_META_FAILED: "fetch-tree-meta-failed",
	FETCH_STRENGTHS_FAILED: "fetch-strengths-failed",
	FETCH_SCENARIOS_FAILED: "fetch-scenarios-failed",
	GENERATE_SCENARIOS_FAILED: "generate-scenarios-failed",
	GENERATE_SCENARIOS_TIMEOUT: "generate-scenarios-timeout",
	LOAD_MORE_EMPTY: "load-more-empty",
	LOAD_MORE_FAILED: "load-more-failed",
	METRIC_PAPERS_FAILED: "metric-papers-failed",
	METRIC_PATENTS_FAILED: "metric-patents-failed",
	METRIC_USE_CASES_FAILED: "metric-use-cases-failed",
	PREANALYZE_FAILED: "preanalyze-failed",
} as const

const normalizeMetrics = (
	metrics?: Partial<ScenarioMetrics> | null,
): ScenarioMetrics => ({
	tam: metrics?.tam ?? null,
	tamCategory: metrics?.tamCategory ?? null,
	trl: metrics?.trl ?? null,
	trlCategory: metrics?.trlCategory ?? null,
	cagr: metrics?.cagr ?? null,
	cagrCategory: metrics?.cagrCategory ?? null,
	marketGrowthRate: metrics?.marketGrowthRate ?? null,
	competitiveness: metrics?.competitiveness ?? null,
	implementationDifficulty: metrics?.implementationDifficulty ?? null,
	timeToMarket: metrics?.timeToMarket ?? null,
	paperCount: metrics?.paperCount ?? null,
	patentCount: metrics?.patentCount ?? null,
	implementationCount: metrics?.implementationCount ?? null,
	marketSizing: metrics?.marketSizing,
	papers: metrics?.papers,
	patents: metrics?.patents,
	useCases: metrics?.useCases,
	trlBreakdown: metrics?.trlBreakdown,
	technologiesTrl: metrics?.technologiesTrl,
})

function toNumberOrNull(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null
}

function mapAnalyzeMarketToMetrics(raw: any): Partial<ScenarioMetrics> {
	const analyzeMarket = raw?.analyze_market ?? raw ?? null
	const resultData = analyzeMarket?.data ?? {}
	const tam = resultData?.tam ?? {}
	const sam = resultData?.sam ?? {}
	const summaryCagr = resultData?.projection?.cagr_percent
	const table = Array.isArray(analyzeMarket?.table) ? analyzeMarket.table : []

	const tableValue = (columnName: string): number | null => {
		const row = table.find((item: any) => item?.column_name === columnName)
		return toNumberOrNull(row?.value)
	}

	const marketTam = toNumberOrNull(tam?.value) ?? tableValue("market_tam")
	const marketSam = toNumberOrNull(sam?.value) ?? tableValue("market_sam")
	const marketCagr =
		toNumberOrNull(summaryCagr) ??
		toNumberOrNull(
			typeof tam?.cagr === "string"
				? Number(tam.cagr.replace("%", ""))
				: tam?.cagr,
		) ??
		tableValue("market_cagr")

	return {
		tam: marketTam,
		cagr: marketCagr,
		marketGrowthRate: marketCagr,
		marketSizing: {
			domestic: {
				tam: { value: null },
				sam: { value: null },
				som: { value: null },
			},
			global: {
				tam: {
					value: marketTam,
					reasoning: tam?.market_definition ?? analyzeMarket?.summary,
				},
				sam: {
					value: marketSam,
					reasoning: sam?.equation_template ?? undefined,
				},
				som: { value: null },
			},
			cagr: {
				value: marketCagr,
				reasoning: tam?.source_url ?? undefined,
			},
			structure: {
				value: resultData?.summary ?? null,
				reasoning: undefined,
			},
			marketStructure: resultData?.summary ?? null,
		},
	}
}

function mapAnalyzeTrlToMetrics(raw: any): Partial<ScenarioMetrics> {
	const analyzeTrl = raw?.analyze_trl ?? raw ?? null
	const table = analyzeTrl?.table
	const rawResult = analyzeTrl?.raw
	const result = analyzeTrl?.data ?? analyzeTrl ?? {}

	let totalTrl: number | null = null

	if (typeof table?.value === "number") {
		totalTrl = table.value
	}

	if (
		totalTrl == null &&
		Array.isArray(table?.technology_scores) &&
		table.technology_scores.length > 0
	) {
		const scores = table.technology_scores
			.map((t: any) => t.trl_score ?? t.integrated_trl)
			.filter((v: any) => typeof v === "number")
		if (scores.length > 0) {
			totalTrl = Math.round(
				scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
			)
		}
	}

	if (
		totalTrl == null &&
		Array.isArray(rawResult?.report?.technologies) &&
		rawResult.report.technologies.length > 0
	) {
		const scores = rawResult.report.technologies
			.map((t: any) => t.integrated_trl)
			.filter((v: any) => typeof v === "number")
		if (scores.length > 0) {
			totalTrl = Math.round(
				scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
			)
		}
	}

	if (totalTrl == null && typeof result?.trl === "number") totalTrl = result.trl
	if (totalTrl == null && typeof result?.overall_trl === "number")
		totalTrl = result.overall_trl

	const paperContribution =
		typeof result?.paper_contribution === "number"
			? result.paper_contribution
			: null

	const patentContribution =
		typeof result?.patent_contribution === "number"
			? result.patent_contribution
			: null

	let technologiesTrl: TechnologyTRL[] | undefined

	if (Array.isArray(table?.technology_scores)) {
		technologiesTrl = rawResult.technology_results
			.map((item: any) => ({
				name: item?.tech_name ?? item?.best_tech_name ?? "",
				description: item?.tech_definition ?? "",
				trl: item?.article_trl ?? null,
			}))
			.filter((item: any) => item.name)
	} else if (
		!technologiesTrl?.length &&
		Array.isArray(rawResult?.report?.technologies)
	) {
		technologiesTrl = rawResult.report.technologies
			.map((item: any) => ({
				name: item?.tech_name ?? item?.technology_name ?? "",
				trl: item?.article_trl ?? null,
			}))
			.filter((item: any) => item.name && item.trl != null)
	} else if (!technologiesTrl?.length && Array.isArray(result?.technologies)) {
		technologiesTrl = result.technologies
			.map((item: any) => ({
				name: item?.tech_name ?? item?.name ?? "",
				trl:
					typeof item?.article_trl === "number"
						? item.article_trl
						: typeof item?.article_trl === "number"
							? item.article_trl
							: null,
			}))
			.filter((item: any) => item.name && item.trl != null)
	}

	const reasoning =
		rawResult?.report?.final_summary ??
		analyzeTrl?.derivation?.reasoning_steps?.[0]?.reasoning ??
		result?.reasoning ??
		result?.summary ??
		undefined

	return {
		trl: totalTrl,
		trlBreakdown: {
			total: totalTrl,
			paperContribution,
			patentContribution,
			reasoning,
		},
		technologiesTrl,
	}
}

function mapPreanalyzeToMetrics(preanalyze: any): Partial<ScenarioMetrics> {
	const market = preanalyze?.market
	if (!market) return {}

	const tam = market?.tam
	const projection = market?.projection

	const tamValue = toNumberOrNull(tam?.value)
	const cagrValue =
		toNumberOrNull(projection?.cagr_percent) ??
		toNumberOrNull(
			typeof tam?.cagr === "string"
				? Number(tam.cagr.replace("%", ""))
				: tam?.cagr,
		)

	return {
		tam: tamValue,
		cagr: cagrValue,
		marketGrowthRate: cagrValue,
		marketSizing: {
			domestic: {
				tam: { value: null },
				sam: { value: null },
				som: { value: null },
			},
			global: {
				tam: {
					value: tamValue,
					reasoning: tam?.market_definition,
				},
				sam: { value: null },
				som: { value: null },
			},
			cagr: {
				value: cagrValue,
				reasoning: tam?.source_url,
			},
			structure: {
				value: market?.summary ?? null,
			},
			marketStructure: market?.summary ?? null,
		},
	}
}

type ScenarioAnalysisData = {
	analyze_market?: any
	analyze_social_issue?: any
	preanalyze?: any
	[key: string]: any
}

type ScenarioWithAnalysis = Scenario & {
	analysisData?: ScenarioAnalysisData
}

type TreeMeta = {
	search_theme?: string | null
	mode?: "TED" | "FAST" | null
}

type TechnicalStrength = {
	id: string
	tree_id: string
	name?: string | null
	strength_name?: string | null
	description?: string | null
	potential_applications?: string | null
	[key: string]: any
}

type ScenarioNodeRow = {
	id: string
	tree_id: string
	level: number
	name?: string | null
	content?: string | null
	description?: string | null
	metrics?: Record<string, any> | null
	tags?: string[] | null
}

export function ScenarioSelectionScreen() {
	const { t } = useTranslation()
	const location = useLocation()
	const navigate = useNavigate()

	const [searchParams] = useSearchParams()
	const navState = (location.state || {}) as any
	const metricJobKeysRef = useRef<Set<string>>(new Set())

	const _setScenarioAnalysisData = useCallback(
		(
			scenarioId: string,
			updater: (prev: ScenarioAnalysisData) => ScenarioAnalysisData,
		) => {
			setScenarios((prev) =>
				prev.map((scenario) => {
					if (scenario.id !== scenarioId) return scenario
					const current = (scenario as ScenarioWithAnalysis).analysisData ?? {}
					return {
						...scenario,
						analysisData: updater(current),
					} as ScenarioWithAnalysis
				}),
			)
		},
		[],
	)

	const treeId = useMemo(() => {
		const resolved =
			(navState.treeId as string | undefined) ??
			searchParams.get("tree_id") ??
			searchParams.get("treeId") ??
			searchParams.get("id") ??
			undefined
		return resolved
	}, [searchParams, navState.treeId])

	const [treeMeta, setTreeMeta] = useState<TreeMeta | null>(null)
	const [technicalStrengths, setTechnicalStrengths] = useState<
		TechnicalStrength[]
	>([])
	const [scenarios, setScenarios] = useState<Scenario[]>([])
	const [isLoadingMoreScenarios, setIsLoadingMoreScenarios] = useState(false)

	const [isLoadingTechnicalStrengths, setIsLoadingTechnicalStrengths] =
		useState(false)
	const [isLoadingScenarios, setIsLoadingScenarios] = useState(false)

	const [stage, setStage] = useState("idle")

	const isLoading = isLoadingTechnicalStrengths || isLoadingScenarios
	const [_scenarioGenerated, setScenarioGenerated] = useState<boolean>(false)

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const isPageActiveRef = useRef(true)
	const activeTreeIdRef = useRef<string | null>(null)
	const runVersionRef = useRef(0)

	const preanalyzeQueueRef = useRef<Scenario[]>([])
	const preanalyzeRunningRef = useRef<Set<string>>(new Set())
	const preanalyzePumpRunningRef = useRef(false)
	const preanalyzeActiveTreeRef = useRef<string | null>(null)
	const preanalyzePollingRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	)

	const stopAllClientJobs = useCallback(() => {
		runVersionRef.current += 1
		isPageActiveRef.current = false

		if (intervalRef.current) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
		}

		if (preanalyzePollingRef.current) {
			clearInterval(preanalyzePollingRef.current)
			preanalyzePollingRef.current = null
		}

		generateInFlightRef.current = false

		metricQueueRef.current = {
			papers: [],
			patents: [],
			useCases: [],
		}

		metricRunningRef.current = {
			papers: new Set(),
			patents: new Set(),
			useCases: new Set(),
		}

		metricPumpRunningRef.current = {
			papers: false,
			patents: false,
			useCases: false,
		}
		metricJobKeysRef.current.clear()

		preanalyzeQueueRef.current = []
		preanalyzeRunningRef.current.clear()
		preanalyzePumpRunningRef.current = false
		preanalyzeIdlePollCountsRef.current.clear()
	}, [])

	useEffect(() => {
		if (activeTreeIdRef.current !== treeId) {
			stopAllClientJobs()
			activeTreeIdRef.current = treeId ?? null
			isPageActiveRef.current = true
		}
	}, [treeId, stopAllClientJobs])

	useEffect(() => {
		isPageActiveRef.current = true
		return () => {
			stopAllClientJobs()
		}
	}, [stopAllClientJobs])

	useEffect(() => {
		const handlePageHide = () => stopAllClientJobs()
		window.addEventListener("pagehide", handlePageHide)
		window.addEventListener("beforeunload", handlePageHide)
		return () => {
			window.removeEventListener("pagehide", handlePageHide)
			window.removeEventListener("beforeunload", handlePageHide)
		}
	}, [stopAllClientJobs])

	// ──────────────────────────────────────────────
	// 1) tree meta + technical strengths
	// ──────────────────────────────────────────────
	useEffect(() => {
		if (!treeId) return
		let cancelled = false

		const fetchBaseData = async () => {
			setIsLoadingTechnicalStrengths(true)
			setStage("fetch_base_data")

			try {
				const [
					{ data: treeData, error: treeError },
					{ data: strengthsData, error: strengthsError },
				] = await Promise.all([
					supabase
						.from("technology_trees")
						.select("search_theme, mode")
						.eq("id", treeId)
						.single(),
					supabase
						.from("technical_strengths")
						.select("*")
						.eq("tree_id", treeId),
				])

				if (cancelled) return

				if (treeError) {
					sonnerToast.error(t("scenario.toast.fetch_tree_meta_failed"), {
						id: TOAST_IDS.FETCH_TREE_META_FAILED,
						description: t("scenario.toast.try_again"),
					})
					setTreeMeta(null)
				} else {
					setTreeMeta(treeData)
				}

				if (strengthsError) {
					sonnerToast.error(t("scenario.toast.fetch_strengths_failed"), {
						id: TOAST_IDS.FETCH_STRENGTHS_FAILED,
						description: t("scenario.toast.try_again"),
					})
					setTechnicalStrengths([])
				} else {
					setTechnicalStrengths((strengthsData ?? []) as TechnicalStrength[])
				}
			} catch {
				if (!cancelled) {
					sonnerToast.error(t("scenario.toast.fetch_data_failed"), {
						id: TOAST_IDS.FETCH_TREE_META_FAILED,
						description: t("scenario.toast.reload_page"),
					})
					setTreeMeta(null)
					setTechnicalStrengths([])
				}
			} finally {
				if (!cancelled) {
					setStage("base_data_done")
					setIsLoadingTechnicalStrengths(false)
				}
			}
		}

		void fetchBaseData()
		return () => {
			cancelled = true
		}
	}, [treeId, t])

	// ──────────────────────────────────────────────
	// 2) fetch existing scenarios
	// ──────────────────────────────────────────────
	const initialFetchDoneRef = useRef(false)

	useEffect(() => {
		if (!treeId) return
		let cancelled = false
		initialFetchDoneRef.current = false

		const fetchScenarios = async () => {
			setIsLoadingScenarios(true)
			setStage("fetch_scenarios")
			try {
				const { data, error } = await supabase
					.from("tree_nodes")
					.select("id, tree_id, level, name, description")
					.eq("tree_id", treeId)
					.eq("level", 1)
					.order("created_at", { ascending: true })

				if (cancelled) return

				if (error) {
					sonnerToast.error(t("scenario.toast.fetch_scenarios_failed"), {
						id: TOAST_IDS.FETCH_SCENARIOS_FAILED,
						description: t("scenario.toast.try_again"),
					})
					return
				}

				const rows = (data ?? []) as ScenarioNodeRow[]

				const nodeIds = rows.map((r) => r.id)
				const techStrengthMap = new Map<string, any[]>()
				const techAdvantageMap = new Map<string, TechnologicalAdvantage>()
				if (nodeIds.length > 0) {
					const { data: analysisData } = await supabase
						.from("node_analysis")
						.select("node_id, data")
						.in("node_id", nodeIds)

					if (analysisData) {
						for (const a of analysisData) {
							const ts = (a.data as any)?.technology_strength
							if (Array.isArray(ts) && ts.length > 0) {
								techStrengthMap.set(a.node_id, ts)
							}

							const ta = (a.data as any)?.technological_advantage
							if (ta && typeof ta === "object" && ta.rating) {
								techAdvantageMap.set(a.node_id, ta)
							}
						}
					}
				}
				const mapped: Scenario[] = rows.map((node) => ({
					id: node.id,
					name: node.name || node.content || "",
					description: node.description || "",
					level: 1,
					metrics: normalizeMetrics(
						node.metrics as Partial<ScenarioMetrics> | null,
					),
					analysisData: {},
					tags: node.tags ?? [],
					techCharacteristics: (techStrengthMap.get(node.id) ?? []).map(
						(ts: any) => ({
							name: ts.strength_name ?? "",
							description: ts.description ?? "",
							potential_applications: ts.potential_applications ?? "",
						}),
					),
					technologicalAdvantage: techAdvantageMap.get(node.id),
				}))

				setScenarios(mapped)
				setStage("done")
			} catch {
				if (!cancelled) {
					sonnerToast.error(t("scenario.toast.fetch_scenarios_failed"), {
						id: TOAST_IDS.FETCH_SCENARIOS_FAILED,
						description: t("scenario.toast.reload_page"),
					})
					setScenarios([])
				}
			} finally {
				if (!cancelled) {
					setIsLoadingScenarios(false)
					initialFetchDoneRef.current = true
				}
			}
		}

		void fetchScenarios()
		return () => {
			cancelled = true
		}
	}, [treeId, t])

	// ──────────────────────────────────────────────
	// 2-1) poll node_analysis for enrichment data
	// ──────────────────────────────────────────────
	useEffect(() => {
		if (!treeId) return
		if (scenarios.length === 0) return
		if (intervalRef.current) return

		const fetchScenarioAnalysisData = async () => {
			try {
				const nodeIds = scenarios.map((s) => s.id).filter(Boolean)
				if (nodeIds.length === 0) return

				const { data, error } = await supabase
					.from("node_analysis")
					.select("*")
					.in("node_id", nodeIds)

				if (error) return

				const analysisByNodeId = new Map<string, ScenarioAnalysisData>()
				for (const row of data ?? []) {
					const analysisData =
						row?.data && typeof row.data === "object" ? row.data : {}
					if (row?.node_id) {
						analysisByNodeId.set(row.node_id, analysisData)
					}
				}

				setScenarios((prev) =>
					prev.map((scenario) => {
						const newAnalysis = analysisByNodeId.get(scenario.id) ?? {}
						const prevAnalysis =
							(scenario as ScenarioWithAnalysis).analysisData ?? {}

						let metricsUpdate: Partial<ScenarioMetrics> = {}

						if (newAnalysis.analyze_market && !prevAnalysis.analyze_market) {
							metricsUpdate = {
								...metricsUpdate,
								...mapAnalyzeMarketToMetrics(newAnalysis),
							}
						}

						if (newAnalysis.analyze_trl && !prevAnalysis.analyze_trl) {
							metricsUpdate = {
								...metricsUpdate,
								...mapAnalyzeTrlToMetrics(newAnalysis.analyze_trl),
							}
						}

						if (newAnalysis.preanalyze && !prevAnalysis.preanalyze) {
							const preanalyzeMetrics = mapPreanalyzeToMetrics(
								newAnalysis.preanalyze,
							)
							if (newAnalysis.analyze_market || metricsUpdate.marketSizing) {
								const {
									tam: _t,
									cagr: _c,
									marketGrowthRate: _m,
									marketSizing: _ms,
									...rest
								} = preanalyzeMetrics
								metricsUpdate = { ...metricsUpdate, ...rest }
							} else {
								metricsUpdate = { ...metricsUpdate, ...preanalyzeMetrics }
							}
						}

						const hasMetricsUpdate = Object.keys(metricsUpdate).length > 0
						const hasAnalysisChanged =
							JSON.stringify(prevAnalysis) !== JSON.stringify(newAnalysis)

						const techStrength = (newAnalysis as any)?.technology_strength
						let techCharacteristicsUpdate:
							| Scenario["techCharacteristics"]
							| undefined

						if (
							Array.isArray(techStrength) &&
							techStrength.length > 0 &&
							(!scenario.techCharacteristics ||
								scenario.techCharacteristics.length === 0)
						) {
							techCharacteristicsUpdate = techStrength.map((ts: any) => ({
								name: ts.strength_name ?? "",
								description: ts.description ?? "",
								potential_applications: ts.potential_applications ?? "",
							}))
						}

						// ── technological_advantage from node_analysis ──
						const newTechAdvantage = newAnalysis.technological_advantage
						if (
							!hasMetricsUpdate &&
							!hasAnalysisChanged &&
							!techCharacteristicsUpdate &&
							!newTechAdvantage
						) {
							return scenario
						}

						return {
							...scenario,
							analysisData: newAnalysis,
							...(hasMetricsUpdate
								? { metrics: { ...scenario.metrics, ...metricsUpdate } }
								: {}),
							...(techCharacteristicsUpdate
								? { techCharacteristics: techCharacteristicsUpdate }
								: {}),
							...(newTechAdvantage
								? { technologicalAdvantage: newTechAdvantage }
								: {}),
						}
					}),
				)
			} catch (error) {
				console.error("Failed to fetch scenario analysis data:", error)
			}
		}

		void fetchScenarioAnalysisData()
		intervalRef.current = setInterval(fetchScenarioAnalysisData, 10000)

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
				intervalRef.current = null
			}
		}
	}, [treeId, scenarios.length, scenarios])

	// ──────────────────────────────────────────────
	// 3) Generate scenarios if none exist
	// ──────────────────────────────────────────────
	const [retryGenerateScenarios, setRetryGenerateScenarios] = useState(0)
	const generateInFlightRef = useRef(false)
	const generatedTreeIdsRef = useRef<Set<string>>(new Set())

	// biome-ignore lint/correctness/useExhaustiveDependencies: retryGenerateScenarios is a retry signal — not read in body but must re-trigger this effect
	useEffect(() => {
		if (!initialFetchDoneRef.current) return
		if (!treeId) return
		if (isLoadingTechnicalStrengths) return
		if (technicalStrengths.length === 0) return
		if (scenarios.length > 0) return
		if (generateInFlightRef.current) return
		if (generatedTreeIdsRef.current.has(treeId)) return

		const currentTreeId = treeId

		generateInFlightRef.current = true
		generatedTreeIdsRef.current.add(currentTreeId)

		let cancelled = false

		const loadScenarioRows = async () => {
			const { data, error } = await supabase
				.from("tree_nodes")
				.select("id, tree_id, level, name, description")
				.eq("tree_id", currentTreeId)
				.eq("level", 1)
				.order("created_at", { ascending: true })
			if (error) throw error
			return (data ?? []) as ScenarioNodeRow[]
		}

		const loadAnalysisData = async (nodeIds: string[]) => {
			if (nodeIds.length === 0)
				return {
					techMap: new Map<string, TechnologyCharacteristics[]>(),
					advantageMap: new Map<string, TechnologicalAdvantage>(),
				}
			const { data: analysisData } = await supabase
				.from("node_analysis")
				.select("node_id, data")
				.in("node_id", nodeIds)

			const techMap = new Map<string, TechnologyCharacteristics[]>()
			const advantageMap = new Map<string, TechnologicalAdvantage>()
			if (analysisData) {
				for (const a of analysisData) {
					const ts =
						(a.data as any)?.technology_strength ??
						(a.data as any)?.tech_strength
					if (Array.isArray(ts) && ts.length > 0) {
						techMap.set(a.node_id, ts)
					}

					const ta = (a.data as any)?.technological_advantage
					if (ta && typeof ta === "object" && ta.rating) {
						advantageMap.set(a.node_id, ta)
					}
				}
			}
			return { techMap, advantageMap }
		}

		const mapScenarioRows = (
			rows: ScenarioNodeRow[],
			techMap: Map<string, TechnologyCharacteristics[]>,
			advantageMap: Map<string, TechnologicalAdvantage>,
		): Scenario[] =>
			rows.map((node) => ({
				id: node.id,
				name: node.name || "",
				description: node.description || "",
				level: 1,
				metrics: normalizeMetrics(
					node.metrics as Partial<ScenarioMetrics> | null,
				),
				analysisData: {},
				tags: node.tags ?? [],
				techCharacteristics: (techMap.get(node.id) ?? []).map((ts: any) => ({
					name: ts.strength_name ?? "",
					description: ts.description ?? "",
					potential_applications: ts.potential_applications ?? "",
				})),
				technologicalAdvantage: advantageMap.get(node.id) ?? null,
			}))

		const sleep = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms))

		const MAX_POLL_ATTEMPTS = 40
		const POLL_INTERVAL_MS = 8000

		const run = async () => {
			setStage("run_generate_scenarios")
			setIsLoadingScenarios(true)

			try {
				void supabase.functions.invoke("generate-scenarios-sse", {
					body: { tree_id: currentTreeId, language: getOutputLanguage() },
				})

				let scenarioRows: ScenarioNodeRow[] = []

				for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
					if (cancelled) return
					scenarioRows = await loadScenarioRows()
					if (scenarioRows.length > 0) break
					await sleep(POLL_INTERVAL_MS)
				}

				if (cancelled) return

				if (scenarioRows.length === 0) {
					sonnerToast.error(t("scenario.toast.generate_scenarios_timeout"), {
						id: TOAST_IDS.GENERATE_SCENARIOS_TIMEOUT,
						description: t("scenario.toast.try_again"),
					})
					throw new Error("Scenarios were not generated in time")
				}

				const nodeIds = scenarioRows.map((r) => r.id)
				const { techMap, advantageMap } = await loadAnalysisData(nodeIds)

				if (cancelled) return

				const mapped = mapScenarioRows(scenarioRows, techMap, advantageMap)

				setScenarioGenerated(true)
				setStage("done")
				setIsLoadingScenarios(false)
				generateInFlightRef.current = false
				setScenarios(mapped)
			} catch {
				if (!cancelled) {
					sonnerToast.error(t("scenario.toast.generate_scenarios_failed"), {
						id: TOAST_IDS.GENERATE_SCENARIOS_FAILED,
						description: t("scenario.toast.try_again"),
					})
					setStage("error_generate_scenarios")
					generatedTreeIdsRef.current.delete(currentTreeId)
					setIsLoadingScenarios(false)
					generateInFlightRef.current = false
				}
			}
		}

		void run()

		return () => {
			cancelled = true
		}
	}, [
		treeId,
		isLoadingTechnicalStrengths,
		technicalStrengths.length,
		scenarios.length,
		t,
		retryGenerateScenarios,
	])

	const handleRetryGeneration = useCallback(() => {
		if (!treeId) return
		generateInFlightRef.current = false
		generatedTreeIdsRef.current.delete(treeId)
		setRetryGenerateScenarios((prev) => prev + 1)
		sonnerToast.info(t("scenario.toast.auto_retry"))
	}, [treeId, t])

	// ──────────────────────────────────────────────
	// 4) Load more scenarios (user action)
	// ──────────────────────────────────────────────
	const handleLoadMoreScenarios = useCallback(async () => {
		if (!treeId) return
		setIsLoadingMoreScenarios(true)

		try {
			const { data, error } = await supabase.functions.invoke(
				"add-scenarios-v5",
				{
					body: {
						tree_id: treeId,
						n: 20,
						language: getOutputLanguage(),
					},
				},
			)

			if (error) throw error

			const addedScenarios = Array.isArray(data?.scenarios)
				? data.scenarios
				: []

			if (addedScenarios.length === 0) {
				sonnerToast.error(t("scenario.toast.load_more_empty"), {
					id: TOAST_IDS.LOAD_MORE_EMPTY,
					description: t("scenario.toast.load_more_empty_description"),
				})
				return
			}

			setScenarios((prev) => {
				const existingIds = new Set(prev.map((scenario) => scenario.id))
				const next = [...prev]
				for (const scenario of addedScenarios) {
					if (existingIds.has(scenario.id)) continue
					next.push({
						id: scenario.id,
						name: scenario.name || "",
						description: scenario.description || "",
						level: 1,
						metrics: normalizeMetrics(null),
						analysisData: {},
						tags: [],
						isAIGenerated: true,
						technologicalAdvantage: null,
					})
				}
				return next
			})

			sonnerToast.success(t("scenario.toast.scenarios_added"), {
				description: t("scenario.toast.scenarios_added_description", {
					count: addedScenarios.length,
				}),
			})
		} catch {
			sonnerToast.error(t("scenario.toast.load_more_failed"), {
				id: TOAST_IDS.LOAD_MORE_FAILED,
				description: t("scenario.toast.load_more_failed_description"),
			})
		} finally {
			setIsLoadingMoreScenarios(false)
		}
	}, [treeId, t])

	// ──────────────────────────────────────────────
	// 5) Metric enrichment (papers, patents, useCases)
	// ──────────────────────────────────────────────
	const {
		fetchScenarioPaper,
		fetchScenarioPatents,
		fetchScenarioMarketImpls,
		fetchScenarioPreanalyze,
	} = useScenarioEnrichment()

	const metricQueueRef = useRef<
		Record<"papers" | "patents" | "useCases", Scenario[]>
	>({
		papers: [],
		patents: [],
		useCases: [],
	})

	const metricRunningRef = useRef<
		Record<"papers" | "patents" | "useCases", Set<string>>
	>({
		papers: new Set(),
		patents: new Set(),
		useCases: new Set(),
	})

	const metricPumpRunningRef = useRef<
		Record<"papers" | "patents" | "useCases", boolean>
	>({
		papers: false,
		patents: false,
		useCases: false,
	})

	const metricActiveTreeRef = useRef<string | null>(null)
	const METRIC_CONCURRENCY = 3

	useEffect(() => {
		if (metricActiveTreeRef.current !== treeId) {
			metricActiveTreeRef.current = treeId ?? null
			metricQueueRef.current = { papers: [], patents: [], useCases: [] }
			metricRunningRef.current = {
				papers: new Set(),
				patents: new Set(),
				useCases: new Set(),
			}
			metricPumpRunningRef.current = {
				papers: false,
				patents: false,
				useCases: false,
			}
		}
	}, [treeId])

	useEffect(() => {
		if (!treeId) return
		if (isLoadingScenarios) return
		if (scenarios.length === 0) return
		if (treeMeta?.search_theme === "") return
		if (treeMeta?.mode === undefined) return

		const isNil = (value: unknown) => value === null || value === undefined

		const hasMissingCoreMetrics = (scenario: Scenario) => {
			const m = scenario.metrics
			return {
				paperCount: isNil(m.paperCount),
				patentCount: isNil(m.patentCount),
				implementationCount: isNil(m.implementationCount),
				papers: isNil(m.papers),
				patents: isNil(m.patents),
				useCases: isNil(m.useCases),
			}
		}

		const setScenarioMetrics = (
			scenarioId: string,
			updater: (prev: ScenarioMetrics) => ScenarioMetrics,
		) => {
			setScenarios((prev) =>
				prev.map((scenario) =>
					scenario.id === scenarioId
						? { ...scenario, metrics: updater(scenario.metrics) }
						: scenario,
				),
			)
		}

		const queueKey = (
			scenarioId: string,
			jobType: "papers" | "patents" | "useCases",
		) => `${scenarioId}:${jobType}`

		const isMetricDone = (
			scenario: Scenario,
			jobType: "papers" | "patents" | "useCases",
		) => {
			const m = scenario.metrics
			if (jobType === "papers") return !isNil(m.paperCount) || !isNil(m.papers)
			if (jobType === "patents")
				return !isNil(m.patentCount) || !isNil(m.patents)
			return !isNil(m.implementationCount) || !isNil(m.useCases)
		}

		const enqueueMissingScenarios = (
			jobType: "papers" | "patents" | "useCases",
		) => {
			const queuedIds = new Set(
				metricQueueRef.current[jobType].map((s) => s.id),
			)
			for (const scenario of scenarios) {
				const missing = hasMissingCoreMetrics(scenario)
				const shouldQueue =
					jobType === "papers"
						? missing.paperCount || missing.papers
						: jobType === "patents"
							? missing.patentCount || missing.patents
							: missing.implementationCount || missing.useCases

				if (!shouldQueue) continue
				if (isMetricDone(scenario, jobType)) continue
				if (metricRunningRef.current[jobType].has(scenario.id)) continue
				if (queuedIds.has(scenario.id)) continue

				const jobKey = queueKey(scenario.id, jobType)
				if (metricJobKeysRef.current.has(jobKey)) continue

				metricQueueRef.current[jobType].push(scenario)
			}
		}

		const isStillActive = (treeIdAtStart: string, runVersionAtStart: number) =>
			isPageActiveRef.current &&
			activeTreeIdRef.current === treeIdAtStart &&
			runVersionRef.current === runVersionAtStart

		const runMetricJob = async (
			scenario: Scenario,
			jobType: "papers" | "patents" | "useCases",
		) => {
			const treeIdAtStart = treeId
			const runVersionAtStart = runVersionRef.current

			if (jobType === "papers") {
				if (!isStillActive(treeIdAtStart, runVersionAtStart)) return
				setScenarioMetrics(scenario.id, (prev) => ({
					...prev,
					_fetchingPapers: true,
				}))
				try {
					const result = await fetchScenarioPaper({
						treeId,
						nodeId: scenario.id,
						query: treeMeta?.search_theme || "",
						scenarioName: scenario.name,
						treeType: treeMeta?.mode,
					})
					if (!isStillActive(treeIdAtStart, runVersionAtStart)) return
					if (!result) throw new Error(`papers result empty for ${scenario.id}`)
					setScenarioMetrics(scenario.id, (prev) => ({
						...prev,
						_fetchingPapers: false,
						paperCount: result.paperCount ?? prev.paperCount,
						papers: {
							count: result.paperCount ?? prev.papers?.count ?? null,
							cagr: result.cagrPct ?? null,
							reasoning: prev.papers?.reasoning,
							cagrMeta: result.cagrMeta,
						},
					}))
					triggerEnrichmentRefresh(scenario.id)
				} catch {
					if (!isStillActive(treeIdAtStart, runVersionAtStart)) return
					setScenarioMetrics(scenario.id, (prev) => ({
						...prev,
						_fetchingPapers: false,
					}))
					sonnerToast.error(t("scenario.toast.metric_papers_failed"), {
						id: TOAST_IDS.METRIC_PAPERS_FAILED,
						description: t("scenario.toast.auto_retry"),
					})
					throw new Error("papers fetch failed")
				}
				return
			}

			if (jobType === "patents") {
				if (!isStillActive(treeIdAtStart, runVersionAtStart)) return
				setScenarioMetrics(scenario.id, (prev) => ({
					...prev,
					_fetchingPatents: true,
				}))
				try {
					const result = await fetchScenarioPatents({
						treeId,
						nodeId: scenario.id,
						query: treeMeta?.search_theme || "",
						scenarioName: scenario.name,
						language: getOutputLanguage(),
					})
					if (!isStillActive(treeIdAtStart, runVersionAtStart)) return
					if (!result)
						throw new Error(`patents result empty for ${scenario.id}`)
					setScenarioMetrics(scenario.id, (prev) => ({
						...prev,
						_fetchingPatents: false,
						patentCount: result.patentCount ?? prev.patentCount,
						patents: {
							count: result.patentCount ?? prev.patents?.count ?? null,
							cagr: prev.patents?.cagr ?? null,
							reasoning: prev.patents?.reasoning,
						},
					}))
					triggerEnrichmentRefresh(scenario.id)
				} catch {
					if (!isStillActive(treeIdAtStart, runVersionAtStart)) return
					setScenarioMetrics(scenario.id, (prev) => ({
						...prev,
						_fetchingPatents: false,
					}))
					sonnerToast.error(t("scenario.toast.metric_patents_failed"), {
						id: TOAST_IDS.METRIC_PATENTS_FAILED,
						description: t("scenario.toast.auto_retry"),
					})
					throw new Error("patents fetch failed")
				}
				return
			}

			// useCases
			if (!isStillActive(treeIdAtStart, runVersionAtStart)) return
			setScenarioMetrics(scenario.id, (prev) => ({
				...prev,
				_fetchingUseCases: true,
			}))
			try {
				const result = await fetchScenarioMarketImpls({
					treeId,
					nodeId: scenario.id,
					query: treeMeta?.search_theme || "",
					scenarioName: scenario.name,
					language: getOutputLanguage(),
				})
				if (!isStillActive(treeIdAtStart, runVersionAtStart)) return
				if (!result) throw new Error(`useCases result empty for ${scenario.id}`)
				setScenarioMetrics(scenario.id, (prev) => ({
					...prev,
					_fetchingUseCases: false,
					implementationCount: result.useCaseCount ?? prev.implementationCount,
					useCases: {
						count: result.useCaseCount ?? prev.useCases?.count ?? null,
						cagr: prev.useCases?.cagr ?? null,
						reasoning: prev.useCases?.reasoning,
					},
				}))
				triggerEnrichmentRefresh(scenario.id)
			} catch {
				if (!isStillActive(treeIdAtStart, runVersionAtStart)) return
				setScenarioMetrics(scenario.id, (prev) => ({
					...prev,
					_fetchingUseCases: false,
				}))
				sonnerToast.error(t("scenario.toast.metric_use_cases_failed"), {
					id: TOAST_IDS.METRIC_USE_CASES_FAILED,
					description: t("scenario.toast.auto_retry"),
				})
				throw new Error("useCases fetch failed")
			}
		}

		const pumpQueue = async (jobType: "papers" | "patents" | "useCases") => {
			if (metricPumpRunningRef.current[jobType]) return
			metricPumpRunningRef.current[jobType] = true

			try {
				while (true) {
					if (metricActiveTreeRef.current !== treeId) break
					let startedAny = false

					while (
						metricRunningRef.current[jobType].size < METRIC_CONCURRENCY &&
						metricQueueRef.current[jobType].length > 0
					) {
						const nextScenario = metricQueueRef.current[jobType].shift()
						if (!nextScenario) break
						if (isMetricDone(nextScenario, jobType)) continue

						const jobKey = queueKey(nextScenario.id, jobType)
						metricJobKeysRef.current.add(jobKey)
						metricRunningRef.current[jobType].add(nextScenario.id)
						startedAny = true

						void (async () => {
							try {
								await runMetricJob(nextScenario, jobType)
							} catch {
								metricJobKeysRef.current.delete(jobKey)
							} finally {
								metricRunningRef.current[jobType].delete(nextScenario.id)
								enqueueMissingScenarios(jobType)
								void pumpQueue(jobType)
							}
						})()
					}

					if (!startedAny) break
				}
			} finally {
				metricPumpRunningRef.current[jobType] = false
			}
		}

		enqueueMissingScenarios("papers")
		enqueueMissingScenarios("patents")
		enqueueMissingScenarios("useCases")

		void pumpQueue("papers")
		void pumpQueue("patents")
		void pumpQueue("useCases")
	}, [
		treeId,
		scenarios,
		isLoadingScenarios,
		treeMeta?.search_theme,
		treeMeta?.mode,
		fetchScenarioPaper,
		fetchScenarioMarketImpls,
		fetchScenarioPatents,
		t,
	])

	// ──────────────────────────────────────────────
	// 6) Preanalyze enrichment
	// ──────────────────────────────────────────────
	const PREANALYZE_CONCURRENCY = 10
	const PREANALYZE_MAX_RETRIES = 2
	const PREANALYZE_IDLE_POLL_THRESHOLD = 30

	const preanalyzeRetriesRef = useRef<Map<string, number>>(new Map())
	const preanalyzeDoneRef = useRef<Set<string>>(new Set())
	const preanalyzeIdlePollCountsRef = useRef<Map<string, number>>(new Map())

	useEffect(() => {
		if (preanalyzeActiveTreeRef.current !== treeId) {
			preanalyzeActiveTreeRef.current = treeId ?? null
			preanalyzeQueueRef.current = []
			preanalyzeRunningRef.current.clear()
			preanalyzePumpRunningRef.current = false
			preanalyzeRetriesRef.current.clear()
			preanalyzeDoneRef.current.clear()
			preanalyzeIdlePollCountsRef.current.clear()
			if (preanalyzePollingRef.current) {
				clearInterval(preanalyzePollingRef.current)
				preanalyzePollingRef.current = null
			}
		}
	}, [treeId])

	useEffect(() => {
		if (!treeId) return
		if (isLoadingScenarios) return
		if (scenarios.length === 0) return
		if (!treeMeta?.search_theme) return

		const queueKey = (scenarioId: string) => `${scenarioId}:preanalyze`

		const hasGlobalTam = (scenario: Scenario): boolean => {
			if (scenario.metrics.tam != null) return true
			const globalTam = scenario.metrics.marketSizing?.global?.tam?.value
			if (globalTam != null) return true
			return false
		}

		const getPreanalyzeJobStatus = (
			analysisData: ScenarioAnalysisData | undefined,
		): "queued" | "running" | "done" | "failed" | "idle" => {
			if (!analysisData) return "idle"
			if (analysisData.preanalyze) return "done"
			const job = analysisData.preanalyze_job
			if (!job || typeof job !== "object") return "idle"
			if (job.status === "queued") return "queued"
			if (job.status === "running") return "running"
			if (job.status === "failed") return "failed"
			if (job.status === "completed") return "done"
			return "idle"
		}

		const treeIdAtStart = treeId
		const runVersionAtStart = runVersionRef.current

		if (
			!isPageActiveRef.current ||
			activeTreeIdRef.current !== treeIdAtStart ||
			runVersionRef.current !== runVersionAtStart
		) {
			return
		}

		const canRetry = (scenarioId: string): boolean => {
			const retries = preanalyzeRetriesRef.current.get(scenarioId) ?? 0
			return retries < PREANALYZE_MAX_RETRIES
		}

		const enqueueMissingScenarios = () => {
			const queuedIds = new Set(preanalyzeQueueRef.current.map((s) => s.id))

			for (const scenario of scenarios) {
				if (hasGlobalTam(scenario)) {
					preanalyzeDoneRef.current.add(scenario.id)
					continue
				}
				if (preanalyzeDoneRef.current.has(scenario.id)) continue
				if (!canRetry(scenario.id)) {
					preanalyzeDoneRef.current.add(scenario.id)
					continue
				}

				const scenarioWithAnalysis = scenario as ScenarioWithAnalysis
				const status = getPreanalyzeJobStatus(scenarioWithAnalysis.analysisData)
				const jobKey = queueKey(scenario.id)

				if (status === "done" && !hasGlobalTam(scenario)) {
					const retries = preanalyzeRetriesRef.current.get(scenario.id) ?? 0
					if (
						!preanalyzeRunningRef.current.has(scenario.id) &&
						!queuedIds.has(scenario.id)
					) {
						if (retries === 0) {
							preanalyzeRetriesRef.current.set(scenario.id, 1)
						}
						metricJobKeysRef.current.delete(jobKey)
						preanalyzeRunningRef.current.delete(scenario.id)
					}
				}

				if (status === "failed") {
					if (
						!preanalyzeRunningRef.current.has(scenario.id) &&
						!queuedIds.has(scenario.id)
					) {
						metricJobKeysRef.current.delete(jobKey)
						preanalyzeRunningRef.current.delete(scenario.id)
					}
				}

				if (status === "queued" || status === "running") {
					preanalyzeRunningRef.current.add(scenario.id)
					continue
				}

				if (preanalyzeRunningRef.current.has(scenario.id)) continue
				if (queuedIds.has(scenario.id)) continue
				if (metricJobKeysRef.current.has(jobKey)) continue

				preanalyzeQueueRef.current.push(scenario)
			}
		}

		const pumpQueue = async () => {
			if (preanalyzePumpRunningRef.current) return
			preanalyzePumpRunningRef.current = true
			try {
				while (true) {
					if (preanalyzeActiveTreeRef.current !== treeId) break
					let startedAny = false

					while (
						preanalyzeRunningRef.current.size < PREANALYZE_CONCURRENCY &&
						preanalyzeQueueRef.current.length > 0
					) {
						const nextScenario = preanalyzeQueueRef.current.shift()
						if (!nextScenario) break

						if (hasGlobalTam(nextScenario)) {
							preanalyzeDoneRef.current.add(nextScenario.id)
							continue
						}
						if (preanalyzeDoneRef.current.has(nextScenario.id)) continue
						if (!canRetry(nextScenario.id)) {
							preanalyzeDoneRef.current.add(nextScenario.id)
							continue
						}

						const scenarioWithAnalysis = nextScenario as ScenarioWithAnalysis
						const currentStatus = getPreanalyzeJobStatus(
							scenarioWithAnalysis.analysisData,
						)
						if (
							(currentStatus === "queued" || currentStatus === "running") &&
							(preanalyzeRetriesRef.current.get(nextScenario.id) ?? 0) === 0
						) {
							preanalyzeRunningRef.current.add(nextScenario.id)
							continue
						}

						const jobKey = queueKey(nextScenario.id)
						metricJobKeysRef.current.add(jobKey)
						preanalyzeRunningRef.current.add(nextScenario.id)
						startedAny = true

						const retryCount =
							preanalyzeRetriesRef.current.get(nextScenario.id) ?? 0
						const isRetry = retryCount > 0

						try {
							await fetchScenarioPreanalyze({
								treeId,
								nodeId: nextScenario.id,
								query: treeMeta.search_theme || "",
								scenarioName: nextScenario.name,
								scenarioDescription: nextScenario.description,
								force: isRetry,
							})
							preanalyzeIdlePollCountsRef.current.set(nextScenario.id, 0)
						} catch {
							preanalyzeRunningRef.current.delete(nextScenario.id)
							metricJobKeysRef.current.delete(jobKey)
							preanalyzeIdlePollCountsRef.current.delete(nextScenario.id)

							const retries =
								preanalyzeRetriesRef.current.get(nextScenario.id) ?? 0
							preanalyzeRetriesRef.current.set(nextScenario.id, retries + 1)

							if (retries + 1 >= PREANALYZE_MAX_RETRIES) {
								preanalyzeDoneRef.current.add(nextScenario.id)
							}

							sonnerToast.error(t("scenario.toast.preanalyze_failed"), {
								id: TOAST_IDS.PREANALYZE_FAILED,
								description: t("scenario.toast.auto_retry"),
							})
						}
					}

					if (!startedAny) break
				}
			} finally {
				preanalyzePumpRunningRef.current = false
			}
		}

		const pollRunningJobs = async () => {
			if (!treeId) return
			if (preanalyzeRunningRef.current.size === 0) return

			const runningIds = Array.from(preanalyzeRunningRef.current)
			if (runningIds.length === 0) return

			try {
				const { data, error } = await supabase
					.from("node_analysis")
					.select("node_id, data")
					.in("node_id", runningIds)

				if (error) return

				const statusMap = new Map<
					string,
					{
						status: "queued" | "running" | "done" | "failed" | "idle"
						analysisData: ScenarioAnalysisData | undefined
					}
				>()

				for (const row of data ?? []) {
					const analysisData =
						row?.data && typeof row.data === "object"
							? (row.data as ScenarioAnalysisData)
							: undefined
					if (row?.node_id) {
						statusMap.set(row.node_id, {
							status: getPreanalyzeJobStatus(analysisData),
							analysisData,
						})
					}
				}

				let releasedAny = false

				for (const scenarioId of runningIds) {
					const entry = statusMap.get(scenarioId)
					const status = entry?.status ?? "idle"
					const jobKey = queueKey(scenarioId)
					if (status === "queued" || status === "running") {
						preanalyzeIdlePollCountsRef.current.set(scenarioId, 0)
					}

					if (status === "done") {
						preanalyzeRunningRef.current.delete(scenarioId)
						preanalyzeIdlePollCountsRef.current.delete(scenarioId)
						releasedAny = true

						const preanalyzeData = entry?.analysisData?.preanalyze
						const tamValue = preanalyzeData?.market?.tam?.value

						if (tamValue != null) {
							preanalyzeDoneRef.current.add(scenarioId)
							const preanalyzeMetrics = mapPreanalyzeToMetrics(preanalyzeData)

							setScenarios((prev) =>
								prev.map((s) => {
									if (s.id !== scenarioId) return s
									const prevAnalysis =
										(s as ScenarioWithAnalysis).analysisData ?? {}

									if (prevAnalysis.analyze_market || s.metrics.marketSizing) {
										const {
											tam: _t,
											cagr: _c,
											marketGrowthRate: _m,
											marketSizing: _ms,
											...rest
										} = preanalyzeMetrics
										return {
											...s,
											analysisData: {
												...prevAnalysis,
												preanalyze: preanalyzeData,
											},
											metrics: { ...s.metrics, ...rest },
										}
									}

									return {
										...s,
										analysisData: {
											...prevAnalysis,
											preanalyze: preanalyzeData,
										},
										metrics: { ...s.metrics, ...preanalyzeMetrics },
									}
								}),
							)
						}
					} else if (status === "failed") {
						preanalyzeRunningRef.current.delete(scenarioId)
						metricJobKeysRef.current.delete(jobKey)
						preanalyzeIdlePollCountsRef.current.delete(scenarioId)
						releasedAny = true

						const retries = preanalyzeRetriesRef.current.get(scenarioId) ?? 0
						preanalyzeRetriesRef.current.set(scenarioId, retries + 1)

						if (retries + 1 >= PREANALYZE_MAX_RETRIES) {
							preanalyzeDoneRef.current.add(scenarioId)
						}
					} else if (status === "idle") {
						const idlePolls =
							(preanalyzeIdlePollCountsRef.current.get(scenarioId) ?? 0) + 1
						preanalyzeIdlePollCountsRef.current.set(scenarioId, idlePolls)

						if (idlePolls >= PREANALYZE_IDLE_POLL_THRESHOLD) {
							preanalyzeRunningRef.current.delete(scenarioId)
							metricJobKeysRef.current.delete(jobKey)
							preanalyzeIdlePollCountsRef.current.delete(scenarioId)
							releasedAny = true

							const retries = preanalyzeRetriesRef.current.get(scenarioId) ?? 0
							preanalyzeRetriesRef.current.set(scenarioId, retries + 1)
							if (retries + 1 >= PREANALYZE_MAX_RETRIES) {
								preanalyzeDoneRef.current.add(scenarioId)
							}
						}
					}
				}

				if (releasedAny) {
					enqueueMissingScenarios()
					void pumpQueue()
				}
			} catch {
				// Polling failures are silent — next interval will retry
			}
		}

		enqueueMissingScenarios()
		void pumpQueue()

		if (!preanalyzePollingRef.current) {
			preanalyzePollingRef.current = setInterval(() => {
				void pollRunningJobs()
			}, 4000)
		}

		return () => {
			// polling stopped via treeId change / unmount
		}
	}, [
		treeId,
		scenarios,
		isLoadingScenarios,
		treeMeta?.search_theme,
		fetchScenarioPreanalyze,
		t,
	])

	// ──────────────────────────────────────────────
	// 5-1) TRL analysis — triggered when papers > 0 AND patents > 0
	// ──────────────────────────────────────────────
	const { fetchScenarioAnalyzeTrl } = useScenarioEnrichment()

	const trlQueueRef = useRef<Scenario[]>([])
	const trlRunningRef = useRef<Set<string>>(new Set())
	const trlPumpRunningRef = useRef(false)
	const trlDoneRef = useRef<Set<string>>(new Set())
	const trlRetriesRef = useRef<Map<string, number>>(new Map())
	const trlActiveTreeRef = useRef<string | null>(null)

	const TRL_CONCURRENCY = 5
	const TRL_MAX_RETRIES = 3

	// Reset TRL state when treeId changes
	useEffect(() => {
		if (trlActiveTreeRef.current !== treeId) {
			trlActiveTreeRef.current = treeId ?? null
			trlQueueRef.current = []
			trlRunningRef.current.clear()
			trlPumpRunningRef.current = false
			trlDoneRef.current.clear()
			trlRetriesRef.current.clear()
		}
	}, [treeId])

	useEffect(() => {
		if (!treeId) return
		if (isLoadingScenarios) return
		if (scenarios.length === 0) return

		const hasPapersAndPatents = (scenario: Scenario): boolean => {
			const m = scenario.metrics
			const paperCount = m.paperCount ?? m.papers?.count ?? null
			const patentCount = m.patentCount ?? m.patents?.count ?? null
			return (
				paperCount !== null &&
				paperCount > 0 &&
				patentCount !== null &&
				patentCount > 0
			)
		}

		const hasTrlResult = (scenario: Scenario): boolean => {
			const m = scenario.metrics
			if (m.trl != null) return true
			const analysisData = (scenario as ScenarioWithAnalysis).analysisData
			if (analysisData?.analyze_trl) return true
			return false
		}

		const isStillActive = (treeIdAtStart: string, runVersionAtStart: number) =>
			isPageActiveRef.current &&
			activeTreeIdRef.current === treeIdAtStart &&
			runVersionRef.current === runVersionAtStart

		const setScenarioMetrics = (
			scenarioId: string,
			updater: (prev: ScenarioMetrics) => ScenarioMetrics,
		) => {
			setScenarios((prev) =>
				prev.map((scenario) =>
					scenario.id === scenarioId
						? { ...scenario, metrics: updater(scenario.metrics) }
						: scenario,
				),
			)
		}

		const enqueueMissing = () => {
			const queuedIds = new Set(trlQueueRef.current.map((s) => s.id))

			for (const scenario of scenarios) {
				if (trlDoneRef.current.has(scenario.id)) continue
				if (trlRunningRef.current.has(scenario.id)) continue
				if (queuedIds.has(scenario.id)) continue
				if (hasTrlResult(scenario)) {
					trlDoneRef.current.add(scenario.id)
					continue
				}
				// Skip if max retries exhausted
				const retries = trlRetriesRef.current.get(scenario.id) ?? 0
				if (retries > TRL_MAX_RETRIES) {
					trlDoneRef.current.add(scenario.id)
					continue
				}
				// Only enqueue if both papers and patents are available
				if (!hasPapersAndPatents(scenario)) continue

				trlQueueRef.current.push(scenario)
			}
		}

		const runTrlJob = async (scenario: Scenario) => {
			const treeIdAtStart = treeId
			const runVersionAtStart = runVersionRef.current

			try {
				const result = await fetchScenarioAnalyzeTrl({
					treeId,
					nodeId: scenario.id,
				})
				console.log(result)

				if (!isStillActive(treeIdAtStart, runVersionAtStart)) {
					return
				}

				const trlData = result.raw

				if (!trlData) {
					const retries = trlRetriesRef.current.get(scenario.id) ?? 0
					trlRetriesRef.current.set(scenario.id, retries + 1)
					if (retries + 1 > TRL_MAX_RETRIES) {
						trlDoneRef.current.add(scenario.id)
					} else {
						// Back off before allowing re-enqueue — enrichment may still be in flight
						await new Promise((r) => setTimeout(r, (retries + 1) * 5000))
					}
					return
				}

				const trlMetrics = mapAnalyzeTrlToMetrics({ analyze_trl: trlData })

				setScenarioMetrics(scenario.id, (prev) => ({
					...prev,
					...trlMetrics,
				}))

				_setScenarioAnalysisData(scenario.id, (prev) => ({
					...prev,
					analyze_trl: trlData,
				}))

				trlDoneRef.current.add(scenario.id)
				triggerEnrichmentRefresh(scenario.id)
			} catch (err) {
				const retries = trlRetriesRef.current.get(scenario.id) ?? 0
				trlRetriesRef.current.set(scenario.id, retries + 1)
				const exhausted = retries + 1 > TRL_MAX_RETRIES
				if (exhausted) {
					trlDoneRef.current.add(scenario.id)
				}
				console.error(
					`[TRL] Failed for id=${scenario.id} | retry=${retries + 1}/${TRL_MAX_RETRIES + 1} exhausted=${exhausted}`,
					err,
				)
			}
		}

		const pumpQueue = async () => {
			if (trlPumpRunningRef.current) return
			trlPumpRunningRef.current = true

			try {
				while (true) {
					if (trlActiveTreeRef.current !== treeId) break
					let startedAny = false

					while (
						trlRunningRef.current.size < TRL_CONCURRENCY &&
						trlQueueRef.current.length > 0
					) {
						const next = trlQueueRef.current.shift()
						if (!next) break
						if (trlDoneRef.current.has(next.id)) continue
						if (hasTrlResult(next)) {
							trlDoneRef.current.add(next.id)
							continue
						}

						trlRunningRef.current.add(next.id)
						startedAny = true

						void (async () => {
							try {
								await runTrlJob(next)
							} finally {
								trlRunningRef.current.delete(next.id)
								enqueueMissing()
								void pumpQueue()
							}
						})()
					}

					if (!startedAny) break
				}
			} finally {
				trlPumpRunningRef.current = false
			}
		}

		enqueueMissing()
		void pumpQueue()
	}, [
		treeId,
		scenarios,
		isLoadingScenarios,
		fetchScenarioAnalyzeTrl,
		_setScenarioAnalysisData,
	])

	useEffect(() => {
		return () => {
			if (preanalyzePollingRef.current) {
				clearInterval(preanalyzePollingRef.current)
				preanalyzePollingRef.current = null
			}
		}
	}, [])

	// ──────────────────────────────────────────────
	// 7) Redirect if no technical strengths
	// ──────────────────────────────────────────────
	useEffect(() => {
		if (!treeId) return
		if (isLoading) return
		if (technicalStrengths.length !== 0) return
		if (stage !== "base_data_done") return
		if (!initialFetchDoneRef.current) return

		navigate(`/technology-tree?id=${encodeURIComponent(treeId)}`, {
			state: {
				query: treeMeta?.search_theme || "",
				searchMode: "TED",
				treeId,
				fromDatabase: true,
				isDemo: false,
				mode: "TED",
			},
			replace: true,
		})
	}, [
		treeId,
		isLoading,
		technicalStrengths.length,
		treeMeta?.search_theme,
		stage,
		navigate,
	])

	// ──────────────────────────────────────────────
	// Render
	// ──────────────────────────────────────────────
	if (!treeId) {
		return (
			<div className="flex-1 h-screen flex items-center justify-center">
				<p className="text-gray-600">{t("scenario.screen.no_data_found")}</p>
			</div>
		)
	}

	return (
		<div className="flex-1 h-screen overflow-hidden">
			<div className="relative h-full">
				<SidebarTrigger className="absolute left-4 top-4 md:hidden z-10" />

				<div className="h-full bg-[#EEEEEE] p-1 flex flex-col overflow-hidden gap-1">
					<ScenarioSelectionHeader
						query={treeMeta?.search_theme || ""}
						mode={treeMeta?.mode}
						keywords={[]}
					/>

					<ScenarioSelectionMainLayout
						scenarios={scenarios}
						treeId={treeId}
						technicalStrengths={technicalStrengths}
						query={treeMeta?.search_theme || ""}
						effectiveMode={treeMeta?.mode}
						isLoading={isLoading}
						stage={stage}
						onLoadMoreScenarios={handleLoadMoreScenarios}
						isLoadingMoreScenarios={isLoadingMoreScenarios}
						onRetryGeneration={handleRetryGeneration}
						onUpdateScenarioCounts={(scenarioId, counts) => {
							setScenarios((prev) =>
								prev.map((s) => {
									if (s.id !== scenarioId) return s
									const m = s.metrics
									const previousPaperCount =
										m?.paperCount ?? m?.papers?.count ?? null
									const previousPatentCount =
										m?.patentCount ?? m?.patents?.count ?? null
									const previousUseCasesCount =
										m?.implementationCount ?? m?.useCases?.count ?? null
									const paperCount =
										previousPaperCount != null &&
										previousPaperCount > counts.papers
											? previousPaperCount
											: counts.papers
									const patentCount =
										previousPatentCount != null &&
										previousPatentCount > counts.patents
											? previousPatentCount
											: counts.patents
									const useCasesCount =
										previousUseCasesCount != null &&
										previousUseCasesCount > counts.useCases
											? previousUseCasesCount
											: counts.useCases
									return {
										...s,
										metrics: {
											...m,
											paperCount,
											patentCount,
											implementationCount: useCasesCount,
											papers: {
												cagr: m?.papers?.cagr ?? null,
												reasoning: m?.papers?.reasoning,
												count: paperCount,
												cagrMeta: m?.papers?.cagrMeta,
											},
											patents: {
												cagr: m?.patents?.cagr ?? null,
												reasoning: m?.patents?.reasoning,
												count: patentCount,
											},
											useCases: {
												cagr: m?.useCases?.cagr ?? null,
												reasoning: m?.useCases?.reasoning,
												count: useCasesCount,
											},
										},
									}
								}),
							)
						}}
						onScenarioAdded={(newScenarios) => {
							setScenarios((prev) => [...prev, ...newScenarios])
						}}
					/>
				</div>
			</div>
		</div>
	)
}
