import { useCallback, useEffect, useRef, useState } from "react"
import {
	type AnalysisStep,
	ensureStoreEntry,
	SECTION_STEPS,
} from "@/components/scenario/report/ReportStateStore"
import { ApiError, apiClient } from "@/lib/apiClient"
import { getOutputLanguage } from "@/lib/outputLanguage"
import type { Scenario } from "@/types/scenario"
import type { ThemeReportData } from "@/types/theme-report"

export const REPORT_MAX_MS = 420_000

const TICK_MS = 200

type ScenarioStatus = "done" | "running" | "queued" | "failed" | "not_found"

interface ScenarioReportResponse {
	scenario_id: string
	job_id: string | null
	status: ScenarioStatus
	progress: string | null
	job_created_at: string | null
	job_updated_at: string | null
	job_elapsed_sec: number | null
	data: unknown
	message: string
}

interface UseScenarioReportStateOptions {
	scenario: Scenario | null
	userQuery?: string | null
	storeKey: string
	apiHealthy: boolean | null
}

function calcProgress(elapsedMs: number): number {
	const ratio = Math.min(elapsedMs / REPORT_MAX_MS, 1)
	return Math.max(1, Math.round(ratio * 98))
}

/**
 * Safely read a string-typed field from an unknown error body. Returns
 * `undefined` if the body isn't an object or the field isn't a string —
 * defensive against server-side schema drift.
 */
function pickStringField(body: unknown, key: string): string | undefined {
	if (body === null || typeof body !== "object") return undefined
	const value = (body as Record<string, unknown>)[key]
	return typeof value === "string" ? value : undefined
}

export const useScenarioReportState = ({
	scenario,
	userQuery,
	storeKey,
	apiHealthy,
}: UseScenarioReportStateOptions) => {
	const storedState = ensureStoreEntry(storeKey)

	const [showReport, _setShowReport] = useState(storedState.showReport ?? false)
	const [isLoading, _setIsLoading] = useState(
		storedState.isReportLoading ?? false,
	)
	const [reportData, setReportData] = useState<ThemeReportData | null>(
		(storedState.reportData as ThemeReportData) ?? null,
	)
	const [checkingScenario, setCheckingScenario] = useState(false)
	const [scenarioData, setScenarioData] = useState<Record<
		string,
		unknown
	> | null>(null)
	const [queueStatus, setQueueStatus] = useState<"queued" | "running" | null>(
		null,
	)
	const [jobStartedAt, setJobStartedAt] = useState<string | null>(null)
	const [analysisSteps, _setAnalysisSteps] = useState<AnalysisStep[]>(
		storedState.analysisSteps?.length > 0
			? storedState.analysisSteps
			: SECTION_STEPS,
	)
	const [finalizeProgress, _setFinalizeProgress] = useState(
		storedState.finalizeProgress ?? 0,
	)

	const pollingAbortRef = useRef<AbortController | null>(null)

	// ── Store-synced setters ────────────────────────────────────────────────

	const setShowReport = useCallback(
		(v: boolean) => {
			ensureStoreEntry(storeKey).showReport = v
			_setShowReport(v)
		},
		[storeKey],
	)
	const setIsLoading = useCallback(
		(v: boolean) => {
			ensureStoreEntry(storeKey).isReportLoading = v
			_setIsLoading(v)
		},
		[storeKey],
	)
	const setAnalysisSteps = useCallback(
		(v: AnalysisStep[] | ((prev: AnalysisStep[]) => AnalysisStep[])) => {
			_setAnalysisSteps((prev) => {
				const next = typeof v === "function" ? v(prev) : v
				ensureStoreEntry(storeKey).analysisSteps = next
				return next
			})
		},
		[storeKey],
	)
	const setFinalizeProgress = useCallback(
		(v: number) => {
			ensureStoreEntry(storeKey).finalizeProgress = v
			_setFinalizeProgress(v)
		},
		[storeKey],
	)

	// ── Polling ─────────────────────────────────────────────────────────────
	// Polls GET /scenario-report/:scenarioId until done/failed.
	// The done response includes the report data inline — no separate result fetch.

	const pollUntilDone = useCallback(
		async (
			scenarioId: string,
			signal: AbortSignal,
			timerStarted: boolean,
			startTimer: () => void,
			stopTimer: () => void,
		): Promise<boolean> => {
			const LOG = (...args: any[]) => console.log("[Report]", ...args)
			const ERR = (...args: any[]) => console.error("[Report ERROR]", ...args)

			const MAX_POLLS = 200
			const POLL_INTERVAL = 5000
			let _timerStarted = timerStarted

			for (let poll = 0; poll < MAX_POLLS; poll++) {
				await new Promise((r) => setTimeout(r, POLL_INTERVAL))
				if (signal.aborted) {
					LOG("Polling aborted")
					return false
				}

				const json = await apiClient
					.get<ScenarioReportResponse>(`/scenario-report/${scenarioId}`, {
						signal,
					})
					.catch((err: unknown) => {
						if (err instanceof DOMException && err.name === "AbortError")
							throw err
						// 401/403 are terminal — auth has been revoked or expired.
						// Surface to the user instead of polling silently to timeout.
						if (
							err instanceof ApiError &&
							(err.status === 401 || err.status === 403)
						) {
							ensureStoreEntry(storeKey).jobError =
								err.status === 401
									? "Session expired — please sign in again."
									: "Access denied."
							throw err
						}
						// 5xx and transient network errors are treated as "skip this
						// poll, try again next interval".
						if (err instanceof ApiError && err.status >= 500) return null
						ERR(`Poll #${poll + 1} — fetch failed`, err)
						return null
					})

				if (!json) continue

				const status: ScenarioStatus = json.status
				LOG(`Poll #${poll + 1} — status: "${status}"`)

				if (status === "queued") {
					setQueueStatus("queued")
					continue
				}

				if (status === "running") {
					setQueueStatus("running")
					if (!_timerStarted) {
						_timerStarted = true
						setIsLoading(true)
						setJobStartedAt(new Date().toISOString())
						setFinalizeProgress(1)
						startTimer()
					}
					continue
				}

				if (status === "done") {
					stopTimer()
					setFinalizeProgress(100)
					await new Promise((r) => setTimeout(r, 400))
					const reportPayload = json.data as ThemeReportData
					ensureStoreEntry(storeKey).reportData = reportPayload
					setReportData(reportPayload)
					return true
				}

				if (status === "failed") {
					const serverError =
						typeof json.message === "string" &&
						json.message.startsWith("Error:")
							? json.message
							: `Job failed — see backend logs. scenario_id: ${scenarioId}`
					ensureStoreEntry(storeKey).jobError = serverError
					stopTimer()
					return false
				}
			}

			ensureStoreEntry(storeKey).jobError = "Polling timed out"
			stopTimer()
			return false
		},
		[storeKey, setIsLoading, setFinalizeProgress],
	)

	// ── Cache check + resume polling on page load ─────────────────────────

	useEffect(() => {
		if (!scenario?.id) return
		if (storedState.showReport && storedState.reportData) return

		pollingAbortRef.current?.abort()
		const abort = new AbortController()
		pollingAbortRef.current = abort

		let cancelled = false
		setCheckingScenario(true)

		;(async () => {
			try {
				const json = await apiClient.get<ScenarioReportResponse>(
					`/scenario-report/${scenario.id}`,
					{ signal: abort.signal },
				)
				if (cancelled || abort.signal.aborted) return

				const status: ScenarioStatus = json?.status ?? "not_found"

				if (status === "done") {
					const payload = json.data as ThemeReportData
					const entry = ensureStoreEntry(storeKey)
					entry.reportData = payload
					entry.showReport = true
					setReportData(payload)
					setScenarioData(json.data as Record<string, unknown>)
					_setShowReport(true)
				} else if (status === "running" || status === "queued") {
					if (status === "running") {
						const elapsedMs =
							typeof json.job_elapsed_sec === "number"
								? json.job_elapsed_sec * 1000
								: json.job_created_at
									? Math.max(
											0,
											Date.now() - new Date(json.job_created_at).getTime(),
										)
									: REPORT_MAX_MS * 0.3
						const clampedMs = Math.min(elapsedMs, REPORT_MAX_MS - 1000)
						setFinalizeProgress(calcProgress(clampedMs))
						setJobStartedAt(
							json.job_created_at ??
								new Date(Date.now() - clampedMs).toISOString(),
						)
						setQueueStatus("running")
						setIsLoading(true)
					} else {
						setQueueStatus("queued")
					}

					setCheckingScenario(false)

					let stopTimer: () => void = () => {}
					const startTimer = () => {
						let elapsed = TICK_MS
						const iv = setInterval(() => {
							elapsed += TICK_MS
							setFinalizeProgress(calcProgress(elapsed))
							if (elapsed >= REPORT_MAX_MS) clearInterval(iv)
						}, TICK_MS)
						stopTimer = () => {
							clearInterval(iv)
							setFinalizeProgress(100)
						}
					}

					if (status === "running") startTimer()

					await pollUntilDone(
						scenario.id,
						abort.signal,
						status === "running",
						startTimer,
						stopTimer,
					)

					if (abort.signal.aborted) return

					stopTimer()
					setIsLoading(false)
					setQueueStatus(null)
					setJobStartedAt(null)
					setShowReport(true) // shows result or error state
					return
				} else if (status === "failed") {
					const entry = ensureStoreEntry(storeKey)
					entry.jobError = json.message ?? "Report generation failed"
					_setShowReport(true)
				}
				// "not_found" → generate button will show
			} catch (err: any) {
				if (err?.name === "AbortError") return
				console.error("Scenario check failed:", err)
			} finally {
				if (!cancelled) setCheckingScenario(false)
			}
		})()

		return () => {
			cancelled = true
			abort.abort()
		}
	}, [
		scenario?.id,
		storeKey,
		pollUntilDone,
		setFinalizeProgress,
		setIsLoading,
		setShowReport,
		storedState.reportData,
		storedState.showReport,
	])

	// ── Report generation ───────────────────────────────────────────────────

	const generate = useCallback(async () => {
		if (!scenario) return

		const LOG = (...args: any[]) => console.log("[Report]", ...args)
		const ERR = (...args: any[]) => console.error("[Report ERROR]", ...args)

		LOG("▶ Generate clicked", { scenario_id: scenario.id, apiHealthy })

		pollingAbortRef.current?.abort()
		const abort = new AbortController()
		pollingAbortRef.current = abort

		setShowReport(false)
		setIsLoading(false)
		setQueueStatus(null)
		setJobStartedAt(null)
		setFinalizeProgress(0)
		setAnalysisSteps(
			SECTION_STEPS.map((s) => ({ ...s, status: "pending" as const })),
		)

		let stopTimer: () => void = () => {}
		const startTimer = () => {
			let elapsed = TICK_MS
			const iv = setInterval(() => {
				elapsed += TICK_MS
				setFinalizeProgress(calcProgress(elapsed))
				if (elapsed >= REPORT_MAX_MS) clearInterval(iv)
			}, TICK_MS)
			stopTimer = () => {
				clearInterval(iv)
				setFinalizeProgress(100)
			}
		}

		try {
			const body = {
				theme: userQuery ?? scenario.name,
				scenario_title: scenario.name,
				scenario_description: scenario.description ?? "",
				scenario_id: scenario.id,
				language: getOutputLanguage(),
			}
			LOG("POST /scenario-report", body)

			let genJson: { job_id?: string; status?: string } = {}
			try {
				genJson = await apiClient.post<{ job_id: string; status: string }>(
					"/scenario-report",
					body,
					{ signal: abort.signal },
				)
				LOG("Response:", genJson)
			} catch (err: unknown) {
				if (err instanceof ApiError && err.status === 409) {
					LOG("⚠ 409 — polling existing job for scenario:", scenario.id)
					// 409 body shape: { job_id, status: "queued" | "running", error }.
					// Fall through with whatever status the server reported; downstream
					// `isQueued` check will normalize. Do NOT default to "running" —
					// that would flip a queued job to running here and start the timer
					// prematurely. We runtime-check the shape so a server-side schema
					// change can't silently shape-shift our state through a type cast.
					genJson = {
						job_id: pickStringField(err.body, "job_id"),
						status: pickStringField(err.body, "status"),
					}
				} else {
					throw err
				}
			}

			const isQueued = genJson.status === "queued"
			if (isQueued) {
				LOG("Job is queued — waiting for running state")
				setQueueStatus("queued")
			} else {
				setQueueStatus("running")
				setIsLoading(true)
				setJobStartedAt(new Date().toISOString())
				setFinalizeProgress(1)
				startTimer()
			}

			await pollUntilDone(
				scenario.id,
				abort.signal,
				!isQueued,
				startTimer,
				stopTimer,
			)

			if (abort.signal.aborted) return

			stopTimer()
			setIsLoading(false)
			setQueueStatus(null)
			setJobStartedAt(null)
			setShowReport(true) // shows result or error state
		} catch (err: any) {
			if (err?.name === "AbortError") return
			ERR("Unhandled error:", err)
			stopTimer()
			setFinalizeProgress(0)
			setIsLoading(false)
			setQueueStatus(null)
			const entry = ensureStoreEntry(storeKey)
			if (!entry.jobError) {
				entry.jobError = err instanceof Error ? err.message : String(err)
			}
			setShowReport(true)
		}
	}, [
		scenario,
		userQuery,
		storeKey,
		apiHealthy,
		setShowReport,
		setIsLoading,
		setFinalizeProgress,
		setAnalysisSteps,
		pollUntilDone,
	])

	const resetError = useCallback(() => {
		pollingAbortRef.current?.abort()
		const entry = ensureStoreEntry(storeKey)
		delete entry.jobError
		entry.showReport = false
		entry.isReportLoading = false
		_setShowReport(false)
		_setIsLoading(false)
		setQueueStatus(null)
		setJobStartedAt(null)
	}, [storeKey])

	return {
		showReport,
		reportData,
		isLoading,
		analysisSteps,
		finalizeProgress,
		checkingScenario,
		scenarioData,
		queueStatus,
		jobStartedAt,
		generate,
		resetError,
	}
}
