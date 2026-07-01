import { CheckCircle2, Circle, Loader2, RotateCcw } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar"
import { QueryReportHeader } from "@/components/scenario/report/query/QueryReportHeader"
import { QueryReportView } from "@/components/scenario/report/query/QueryReportView"
import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueryReport } from "@/hooks/useQueryReport"
import { supabase } from "@/integrations/supabase/client"
import { ApiError } from "@/lib/apiClient"
import { getOutputLanguage } from "@/lib/outputLanguage"
import { queryReportApiService } from "@/services/queryReportApiService"

type BootstrapStage = "technical_advantage" | "report_start" | null

type QueryReportLocationState = {
	createReport?: boolean
	query?: string
	language?: string
}

type QueryTreeRow = {
	search_theme: string | null
	name: string | null
	description: string | null
	mode: string | null
}

type ExistingQueryTreeRow = QueryTreeRow & {
	id: string
}

type TechnicalAdvantage = {
	strengthName: string | null
	description: string | null
	potentialApplications: string | null
}

type TechnicalStrengthRow = {
	strength_name?: string | null
	strengthName?: string | null
	name?: string | null
	description?: string | null
	potential_applications?: string | null
	potentialApplications?: string | null
}

function normalizeTechnicalAdvantages(value: unknown): TechnicalAdvantage[] {
	if (!Array.isArray(value)) return []
	return value
		.map((item) => {
			if (!item || typeof item !== "object") return null
			const row = item as TechnicalStrengthRow
			return {
				strengthName: row.strengthName ?? row.strength_name ?? row.name ?? null,
				description: row.description ?? null,
				potentialApplications:
					row.potentialApplications ?? row.potential_applications ?? null,
			}
		})
		.filter((item): item is TechnicalAdvantage => Boolean(item))
}

async function hasTechnicalStrengths(treeId: string): Promise<boolean> {
	const { data, error } = await supabase
		.from("technical_strengths")
		.select("id")
		.eq("tree_id", treeId)
		.limit(1)

	if (error) {
		throw new Error(error.message)
	}

	return Boolean(data?.length)
}

async function loadTechnicalAdvantages(
	treeId: string,
): Promise<TechnicalAdvantage[]> {
	const { data, error } = await supabase
		.from("technical_strengths")
		.select("strength_name, description, potential_applications")
		.eq("tree_id", treeId)
		.order("ordinal", { ascending: true })

	if (error) {
		throw new Error(error.message)
	}

	return normalizeTechnicalAdvantages(data)
}

function getQueryFromTreeRow(tree: QueryTreeRow) {
	return (
		tree.search_theme?.trim() ||
		tree.name?.replace(/^Search Theme:\s*/i, "").trim() ||
		""
	)
}

async function loadQueryFromTree(treeId: string): Promise<{
	query: string
	tree: QueryTreeRow
}> {
	const { data: tree, error } = await supabase
		.from("technology_trees")
		.select("search_theme, name, description, mode")
		.eq("id", treeId)
		.maybeSingle<QueryTreeRow>()

	if (error || !tree) {
		throw new Error(error?.message ?? "Query record was not found")
	}

	const query = getQueryFromTreeRow(tree)

	if (!query) {
		throw new Error("Query record does not contain a search theme")
	}

	return { query, tree }
}

async function findExistingQueryTree(
	query: string,
): Promise<ExistingQueryTreeRow | null> {
	const { data, error } = await supabase
		.from("technology_trees")
		.select("id, search_theme, name, description, mode")
		.eq("search_theme", query)
		.eq("mode", "REPORT")
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle<ExistingQueryTreeRow>()

	if (error) {
		throw new Error(error.message)
	}

	return data ?? null
}

function getProgressLabel(
	progress: string | null,
	message: string | null,
	isEnglish: boolean,
) {
	switch (progress) {
		case "step:generate":
			return isEnglish ? "Generating report body" : "レポート本文を生成中"
		case "step:validate":
			return isEnglish ? "Checking report structure" : "レポート構造を検証中"
		case "step:persist":
			return isEnglish ? "Saving report" : "レポートを保存中"
		default:
			return (
				message ??
				(isEnglish ? "Waiting for report generation" : "レポート生成を待機中")
			)
	}
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
	const fallback =
		error instanceof Error ? error.message : "Supabase function request failed"
	const context = (error as { context?: unknown } | null)?.context

	if (!(context instanceof Response)) {
		return fallback
	}

	const text = await context.text().catch(() => "")
	if (!text) return fallback

	try {
		const json = JSON.parse(text)
		console.error("[QueryReportPreview] generate-tech-strengths failed", json)
		return [
			json.error,
			json.details?.code,
			json.details?.message,
			json.details?.details,
			json.details?.hint,
			json.status ? `status: ${json.status}` : null,
			json.body,
			json.treeId ? `treeId: ${json.treeId}` : null,
		]
			.filter(Boolean)
			.join(" - ")
	} catch {
		console.error("[QueryReportPreview] generate-tech-strengths failed", text)
		return `${fallback} - ${text}`
	}
}

function QueryReportLoading({
	queryTitle,
	stage,
	progress,
	message,
	elapsedSeconds,
	isEnglish,
}: {
	queryTitle: string
	stage: BootstrapStage
	progress: string | null
	message: string | null
	elapsedSeconds: number | null
	isEnglish: boolean
}) {
	const activeLabel =
		stage === "technical_advantage"
			? isEnglish
				? "Generating technical advantages"
				: "技術的優位性を生成中"
			: stage === "report_start"
				? isEnglish
					? "Starting report generation"
					: "レポート生成を開始中"
				: getProgressLabel(progress, message, isEnglish)

	const steps = [
		{
			key: "technical_advantage",
			label: isEnglish ? "Generate technical advantages" : "技術的優位性を生成",
			active: stage === "technical_advantage",
			done: stage !== "technical_advantage",
		},
		{
			key: "report_start",
			label: isEnglish ? "Start report generation" : "レポート生成を開始",
			active: stage === "report_start",
			done: stage === null,
		},
		{
			key: "report",
			label: getProgressLabel(progress, message, isEnglish),
			active: stage === null,
			done: false,
		},
	]

	return (
		<div className="space-y-5">
			{queryTitle && (
				<div className="border-b border-gray-100 pb-5">
					<p className="font-mono text-[10px] uppercase tracking-widest text-blue-600 mb-2">
						{isEnglish ? "Query Report" : "クエリレポート"}
					</p>
					<h1 className="text-2xl font-bold text-gray-900 leading-snug">
						{queryTitle}
					</h1>
				</div>
			)}
			<div className="rounded-lg border border-gray-200 bg-white p-4">
				<div className="flex items-center gap-2 text-sm font-medium text-gray-900">
					<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
					{activeLabel}
				</div>
				{elapsedSeconds !== null && (
					<p className="mt-1 text-xs text-gray-500">
						{isEnglish ? "Elapsed time" : "経過時間"}: {elapsedSeconds}
						{isEnglish ? "s" : "秒"}
					</p>
				)}
				<div className="mt-4 grid gap-2 md:grid-cols-3">
					{steps.map((item) => {
						const Icon = item.done
							? CheckCircle2
							: item.active
								? Loader2
								: Circle
						return (
							<div
								key={item.key}
								className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700"
							>
								<Icon
									className={`h-3.5 w-3.5 ${
										item.active
											? "animate-spin text-blue-600"
											: item.done
												? "text-emerald-600"
												: "text-gray-300"
									}`}
								/>
								<span className="truncate">{item.label}</span>
							</div>
						)
					})}
				</div>
			</div>
			<div className="space-y-2">
				<Skeleton className="h-7 w-64" />
				<Skeleton className="h-4 w-full max-w-3xl" />
				<Skeleton className="h-4 w-4/5 max-w-2xl" />
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				<Skeleton className="h-28 rounded-lg" />
				<Skeleton className="h-28 rounded-lg" />
				<Skeleton className="h-28 rounded-lg" />
			</div>
			<Skeleton className="h-72 rounded-lg" />
			<Skeleton className="h-48 rounded-lg" />
		</div>
	)
}

function QueryReportFailed({
	canRetry,
	isRetrying,
	onRetry,
	isEnglish,
}: {
	canRetry: boolean
	isRetrying: boolean
	onRetry: () => void
	isEnglish: boolean
}) {
	return (
		<div className="py-16 text-center">
			<p className="text-sm font-medium text-foreground">
				{isEnglish
					? "Report generation failed."
					: "レポート生成に失敗しました。"}
			</p>
			<p className="mt-1 text-xs text-muted-foreground">
				{isEnglish
					? "Please try again after a moment."
					: "時間をおいて再試行してください。"}
			</p>
			<Button
				type="button"
				onClick={onRetry}
				disabled={!canRetry || isRetrying}
				className="mt-5 h-9 rounded-md"
			>
				{isRetrying ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<RotateCcw className="mr-2 h-4 w-4" />
				)}
				{isEnglish ? "Retry" : "再試行"}
			</Button>
		</div>
	)
}

export default function QueryReportPreview() {
	const [params] = useSearchParams()
	const location = useLocation()
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const isEnglish = i18n.language === "en"
	const locationState = useMemo(
		() => (location.state ?? {}) as QueryReportLocationState,
		[location.state],
	)
	const initialQueryId = params.get("id")
	const bootstrapQuery = locationState.query?.trim() ?? ""
	const shouldBootstrap = Boolean(locationState.createReport && bootstrapQuery)
	const [generatedQueryId, setGeneratedQueryId] = useState<string | null>(null)
	const [bootstrapStage, setBootstrapStage] = useState<BootstrapStage>(
		shouldBootstrap ? "technical_advantage" : null,
	)
	const [bootstrapError, setBootstrapError] = useState<string | null>(null)
	const [reportPollingEnabled, setReportPollingEnabled] = useState(
		!shouldBootstrap,
	)
	const [displayQuery, setDisplayQuery] = useState(bootstrapQuery)
	const [bootstrapStartedAt, setBootstrapStartedAt] = useState<number | null>(
		shouldBootstrap ? Date.now() : null,
	)
	const [localElapsedSeconds, setLocalElapsedSeconds] = useState<number | null>(
		shouldBootstrap ? 0 : null,
	)
	const [retryKey, setRetryKey] = useState(0)
	const [isRetrying, setIsRetrying] = useState(false)
	const didBootstrapRef = useRef(false)
	const queryId = initialQueryId ?? generatedQueryId
	const { status, data, isLoading, error, message, progress, elapsedSeconds } =
		useQueryReport(reportPollingEnabled ? queryId : null, retryKey)
	const query = data?.theme ?? displayQuery

	const startBootstrapTimer = useCallback(() => {
		const now = Date.now()
		setBootstrapStartedAt(now)
		setLocalElapsedSeconds(0)
	}, [])

	const stopBootstrapTimer = useCallback(() => {
		setBootstrapStartedAt(null)
	}, [])

	useEffect(() => {
		if (!bootstrapStartedAt) return

		const tick = () => {
			setLocalElapsedSeconds(
				Math.max(0, Math.floor((Date.now() - bootstrapStartedAt) / 1000)),
			)
		}

		tick()
		const intervalId = window.setInterval(tick, 1000)
		return () => window.clearInterval(intervalId)
	}, [bootstrapStartedAt])

	useEffect(() => {
		if (!initialQueryId || displayQuery || bootstrapQuery) return

		let cancelled = false
		const loadTitle = async () => {
			try {
				const loaded = await loadQueryFromTree(initialQueryId)
				if (!cancelled) setDisplayQuery(loaded.query)
			} catch {
				// Keep the loading view usable even when the tree row cannot be read.
			}
		}

		void loadTitle()
		return () => {
			cancelled = true
		}
	}, [bootstrapQuery, displayQuery, initialQueryId])

	useEffect(() => {
		if (!shouldBootstrap || didBootstrapRef.current) return
		didBootstrapRef.current = true

		const language = locationState.language ?? getOutputLanguage()

		const start = async () => {
			try {
				setDisplayQuery(bootstrapQuery)
				startBootstrapTimer()
				setBootstrapStage("technical_advantage")

				const existingTree = await findExistingQueryTree(bootstrapQuery)

				if (existingTree) {
					const nextQueryId = existingTree.id
					setGeneratedQueryId(nextQueryId)
					navigate(`/query-report?id=${encodeURIComponent(nextQueryId)}`, {
						replace: true,
						state: {
							query: bootstrapQuery,
							language,
						},
					})

					let technicalAdvantages = await loadTechnicalAdvantages(nextQueryId)

					if (technicalAdvantages.length === 0) {
						const { data: techData, error: techError } =
							await supabase.functions.invoke("generate-tech-strengths", {
								body: {
									treeId: nextQueryId,
									searchTheme: bootstrapQuery,
									description: existingTree.description ?? "",
									language,
									mode: "REPORT",
								},
							})

						if (techError) {
							throw new Error(await getFunctionErrorMessage(techError))
						}

						const generatedAdvantages = normalizeTechnicalAdvantages(
							techData?.tech_strengths,
						)
						technicalAdvantages =
							generatedAdvantages.length > 0
								? generatedAdvantages
								: await loadTechnicalAdvantages(nextQueryId)
					}

					setBootstrapStage("report_start")
					const report = await queryReportApiService.getReport(nextQueryId)

					if (report.status === "not_found" || report.status === "failed") {
						try {
							await queryReportApiService.createReport({
								query_id: nextQueryId,
								query: bootstrapQuery,
								language,
								technicalAdvantages,
							})
						} catch (err) {
							if (!(err instanceof ApiError && err.status === 409)) {
								throw err
							}
						}
					}

					setBootstrapStage(null)
					stopBootstrapTimer()
					setReportPollingEnabled(true)
					return
				}

				const { data: techData, error: techError } =
					await supabase.functions.invoke("generate-tech-strengths", {
						body: {
							searchTheme: bootstrapQuery,
							language,
							mode: "REPORT",
						},
					})

				if (techError) {
					throw new Error(await getFunctionErrorMessage(techError))
				}

				if (!techData?.treeId) {
					throw new Error(
						"Technical advantage generation did not return a tree id",
					)
				}

				const nextQueryId = techData.treeId as string
				const generatedAdvantages = normalizeTechnicalAdvantages(
					techData.tech_strengths,
				)
				const technicalAdvantages =
					generatedAdvantages.length > 0
						? generatedAdvantages
						: await loadTechnicalAdvantages(nextQueryId)
				setGeneratedQueryId(nextQueryId)
				navigate(`/query-report?id=${encodeURIComponent(nextQueryId)}`, {
					replace: true,
					state: locationState,
				})

				setBootstrapStage("report_start")
				try {
					await queryReportApiService.createReport({
						query_id: nextQueryId,
						query: bootstrapQuery,
						language,
						technicalAdvantages,
					})
				} catch (err) {
					if (!(err instanceof ApiError && err.status === 409)) {
						throw err
					}
				}

				setBootstrapStage(null)
				stopBootstrapTimer()
				setReportPollingEnabled(true)
			} catch (err) {
				setBootstrapStage(null)
				stopBootstrapTimer()
				setBootstrapError(
					err instanceof Error ? err.message : "Query report generation failed",
				)
			}
		}

		void start()
	}, [
		bootstrapQuery,
		locationState,
		navigate,
		shouldBootstrap,
		startBootstrapTimer,
		stopBootstrapTimer,
	])

	const handleRetry = useCallback(async () => {
		if (!queryId || isRetrying) return

		try {
			setIsRetrying(true)
			let retryQuery = (query || displayQuery).trim()
			if (!retryQuery) {
				const loaded = await loadQueryFromTree(queryId)
				retryQuery = loaded.query
				setDisplayQuery(retryQuery)
			}

			setBootstrapError(null)
			setReportPollingEnabled(false)
			setBootstrapStage("report_start")
			startBootstrapTimer()

			await queryReportApiService.createReport({
				query_id: queryId,
				query: retryQuery,
				language: locationState.language ?? getOutputLanguage(),
				technicalAdvantages: await loadTechnicalAdvantages(queryId),
			})

			setBootstrapStage(null)
			stopBootstrapTimer()
			setReportPollingEnabled(true)
			setRetryKey((value) => value + 1)
		} catch (err) {
			setBootstrapStage(null)
			stopBootstrapTimer()
			if (err instanceof ApiError && err.status === 409) {
				setReportPollingEnabled(true)
				setRetryKey((value) => value + 1)
			} else {
				setBootstrapError("Query report generation failed")
			}
		} finally {
			setIsRetrying(false)
		}
	}, [
		displayQuery,
		isRetrying,
		locationState.language,
		query,
		queryId,
		startBootstrapTimer,
		stopBootstrapTimer,
	])

	useEffect(() => {
		if (
			!initialQueryId ||
			shouldBootstrap ||
			didBootstrapRef.current ||
			status !== "not_found"
		) {
			return
		}

		didBootstrapRef.current = true
		setReportPollingEnabled(false)

		const language = locationState.language ?? getOutputLanguage()

		const start = async () => {
			try {
				startBootstrapTimer()
				setBootstrapStage("technical_advantage")

				const { query: queryFromTree, tree } =
					await loadQueryFromTree(initialQueryId)

				if (tree.mode !== "REPORT") {
					const existingReportTree = await findExistingQueryTree(queryFromTree)
					if (existingReportTree) {
						navigate(
							`/query-report?id=${encodeURIComponent(existingReportTree.id)}`,
							{
								replace: true,
								state: {
									query: queryFromTree,
									language,
								},
							},
						)
						return
					}

					const { data: techData, error: techError } =
						await supabase.functions.invoke("generate-tech-strengths", {
							body: {
								searchTheme: queryFromTree,
								description: tree.description ?? "",
								language,
								mode: "REPORT",
							},
						})

					if (techError) {
						throw new Error(await getFunctionErrorMessage(techError))
					}

					if (!techData?.treeId) {
						throw new Error(
							"Technical advantage generation did not return a tree id",
						)
					}

					navigate(`/query-report?id=${encodeURIComponent(techData.treeId)}`, {
						replace: true,
						state: {
							query: queryFromTree,
							language,
						},
					})
					return
				}

				setDisplayQuery(queryFromTree)
				const strengthsExist = await hasTechnicalStrengths(initialQueryId)

				let technicalAdvantages = await loadTechnicalAdvantages(initialQueryId)

				if (!strengthsExist) {
					const { data: techData, error: techError } =
						await supabase.functions.invoke("generate-tech-strengths", {
							body: {
								treeId: initialQueryId,
								searchTheme: queryFromTree,
								description: tree.description ?? "",
								language,
								mode: "REPORT",
							},
						})

					if (techError) {
						throw new Error(await getFunctionErrorMessage(techError))
					}

					const generatedAdvantages = normalizeTechnicalAdvantages(
						techData?.tech_strengths,
					)
					technicalAdvantages =
						generatedAdvantages.length > 0
							? generatedAdvantages
							: await loadTechnicalAdvantages(initialQueryId)
				}

				setBootstrapStage("report_start")
				try {
					await queryReportApiService.createReport({
						query_id: initialQueryId,
						query: queryFromTree,
						language,
						technicalAdvantages,
					})
				} catch (err) {
					if (!(err instanceof ApiError && err.status === 409)) {
						throw err
					}
				}

				setBootstrapStage(null)
				stopBootstrapTimer()
				setReportPollingEnabled(true)
			} catch (err) {
				setBootstrapStage(null)
				stopBootstrapTimer()
				setBootstrapError(
					err instanceof Error ? err.message : "Query report generation failed",
				)
			}
		}

		void start()
	}, [
		initialQueryId,
		locationState.language,
		navigate,
		shouldBootstrap,
		startBootstrapTimer,
		status,
		stopBootstrapTimer,
	])

	const canBootstrapExistingQuery = Boolean(initialQueryId && !shouldBootstrap)
	const isBootstrappingExistingQuery =
		status === "not_found" && canBootstrapExistingQuery && !bootstrapError
	const displayedBootstrapStage =
		bootstrapStage ??
		(isBootstrappingExistingQuery ? "technical_advantage" : null)
	const displayedElapsedSeconds =
		displayedBootstrapStage || isBootstrappingExistingQuery
			? localElapsedSeconds
			: elapsedSeconds

	return (
		<SidebarProvider defaultOpen={true}>
			<div className="min-h-screen flex w-full">
				<AppSidebar />
				<div className="flex-1 h-screen overflow-hidden">
					<div className="relative h-full">
						<SidebarTrigger className="absolute left-4 top-4 md:hidden z-10" />

						<div className="h-full bg-[#EEEEEE] p-1 flex flex-col overflow-hidden gap-1">
							<QueryReportHeader query={query} reportData={data} />

							<div className="flex-1 min-h-0 bg-white rounded-lg overflow-auto">
								<div className="max-w-[1180px] mx-auto px-6 py-6">
									{!queryId && !shouldBootstrap ? (
										<div className="py-16 text-center text-sm text-muted-foreground">
											{t("scenario.report.query_missing_id")}
										</div>
									) : bootstrapError ||
										error ||
										status === "failed" ||
										(status === "not_found" &&
											!isBootstrappingExistingQuery) ? (
										<QueryReportFailed
											canRetry={Boolean(queryId)}
											isRetrying={isRetrying}
											onRetry={handleRetry}
											isEnglish={isEnglish}
										/>
									) : bootstrapStage ||
										isBootstrappingExistingQuery ||
										isLoading ||
										status !== "done" ||
										!data ? (
										<QueryReportLoading
											queryTitle={query}
											stage={displayedBootstrapStage}
											progress={progress}
											message={message}
											elapsedSeconds={displayedElapsedSeconds}
											isEnglish={isEnglish}
										/>
									) : (
										<QueryReportView data={data} isExpanded={true} />
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</SidebarProvider>
	)
}
