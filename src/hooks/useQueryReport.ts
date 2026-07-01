import { useEffect, useState } from "react"
import {
	type QueryReportStatus,
	queryReportApiService,
} from "@/services/queryReportApiService"
import type { QueryReportData } from "@/types/query-report"

interface UseQueryReportResult {
	status: QueryReportStatus | "idle"
	data: QueryReportData | null
	isLoading: boolean
	error: string | null
	message: string | null
	progress: string | null
	elapsedSeconds: number | null
}

const POLL_INTERVAL_MS = 3000

export function useQueryReport(
	queryId: string | null,
	refreshKey = 0,
): UseQueryReportResult {
	const [status, setStatus] = useState<QueryReportStatus | "idle">("idle")
	const [data, setData] = useState<QueryReportData | null>(null)
	const [isLoading, setIsLoading] = useState(Boolean(queryId))
	const [error, setError] = useState<string | null>(null)
	const [message, setMessage] = useState<string | null>(null)
	const [progress, setProgress] = useState<string | null>(null)
	const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null)

	useEffect(() => {
		// Re-run polling when callers bump the retry key.
		void refreshKey

		if (!queryId) {
			setStatus("idle")
			setData(null)
			setIsLoading(false)
			setError(null)
			setMessage(null)
			setProgress(null)
			setElapsedSeconds(null)
			return
		}

		const abort = new AbortController()
		let timeoutId: ReturnType<typeof setTimeout> | null = null
		let cancelled = false

		const poll = async () => {
			try {
				setError(null)
				const response = await queryReportApiService.getReport(
					queryId,
					abort.signal,
				)
				if (cancelled || abort.signal.aborted) return

				setStatus(response.status)
				setMessage(response.message ?? null)
				setProgress(response.progress ?? null)
				setElapsedSeconds(response.job_elapsed_sec ?? null)

				if (response.status === "done") {
					setData(response.data as QueryReportData)
					setIsLoading(false)
					return
				}

				setData(null)
				setIsLoading(
					response.status === "queued" || response.status === "running",
				)

				if (response.status === "queued" || response.status === "running") {
					timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
					return
				}

				if (response.status === "failed") {
					setError(response.message || "Report generation failed")
				}
			} catch (err) {
				if (abort.signal.aborted || cancelled) return
				setStatus("failed")
				setIsLoading(false)
				setError(
					err instanceof Error ? err.message : "Failed to load query report",
				)
			}
		}

		setStatus("queued")
		setData(null)
		setIsLoading(true)
		setError(null)
		setMessage(null)
		setProgress(null)
		setElapsedSeconds(null)
		void poll()

		return () => {
			cancelled = true
			abort.abort()
			if (timeoutId) clearTimeout(timeoutId)
		}
	}, [queryId, refreshKey])

	return { status, data, isLoading, error, message, progress, elapsedSeconds }
}
