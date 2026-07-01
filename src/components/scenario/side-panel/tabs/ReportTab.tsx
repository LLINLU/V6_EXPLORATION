import { Clock, Loader2 } from "lucide-react"
import type React from "react"
import { type RefObject, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { REPORT_MAX_MS } from "@/hooks/useScenarioReportState"
import type { ThemeReportData } from "@/types/theme-report"
import { ReportGenerateButton } from "../../report"
import { ensureStoreEntry } from "../../report/ReportStateStore"
import { ThemeReportView } from "../../report/theme/ThemeReportView"

const MAX_SECONDS = Math.floor(REPORT_MAX_MS / 1000) // 180

interface ReportTabProps {
	storeKey: string
	isLoading: boolean
	showReport: boolean
	reportData: ThemeReportData | null
	finalizeProgress: number
	apiHealthy: boolean | null
	checkingScenario: boolean
	scenarioData: Record<string, unknown> | null
	queueStatus: "queued" | "running" | null
	jobStartedAt: string | null
	treeId?: string | null
	isExpanded: boolean
	onGenerate: () => void
	onResetError: () => void
	reportContainerRef?: RefObject<HTMLDivElement>
}

function useElapsed(isLoading: boolean, jobStartedAt: string | null) {
	const getElapsed = useCallback(() => {
		if (!jobStartedAt) return 0
		return Math.min(
			Math.floor((Date.now() - new Date(jobStartedAt).getTime()) / 1000),
			MAX_SECONDS,
		)
	}, [jobStartedAt])

	const [elapsed, setElapsed] = useState(getElapsed)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
		}
		setElapsed(getElapsed())
		if (isLoading) {
			intervalRef.current = setInterval(() => setElapsed(getElapsed()), 1000)
		}
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
				intervalRef.current = null
			}
		}
	}, [isLoading, getElapsed])

	return elapsed
}

export const ReportTab: React.FC<ReportTabProps> = ({
	storeKey,
	isLoading,
	showReport,
	reportData,
	checkingScenario,
	scenarioData,
	queueStatus,
	jobStartedAt,
	treeId,
	isExpanded,
	onGenerate,
	onResetError,
	reportContainerRef,
}) => {
	const { t } = useTranslation()
	const jobError = ensureStoreEntry(storeKey).jobError
	const elapsed = useElapsed(isLoading, jobStartedAt)

	// Both the bar and the timer derive from the same elapsed value
	const progressPct = Math.min(
		Math.max(Math.round((elapsed / MAX_SECONDS) * 100), 0),
		100,
	)
	const remaining = Math.max(0, MAX_SECONDS - elapsed)
	const mins = Math.floor(remaining / 60)
	const secs = remaining % 60

	return (
		<div className="space-y-4">
			{/* queued */}
			{queueStatus === "queued" && !isLoading && (
				<div className="border border-amber-200 rounded-lg bg-amber-50 px-6 py-5 mt-4">
					<div className="flex items-center gap-3 mb-2">
						<Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
						<span className="text-sm font-medium text-amber-800">
							{t("scenario.report.queued_title")}
						</span>
					</div>
					<p className="text-xs text-amber-700 leading-relaxed">
						{t("scenario.report.queued_desc")}
					</p>
					<div className="mt-3 h-1 w-full bg-amber-100 rounded-full overflow-hidden">
						<div className="h-full bg-amber-400 rounded-full animate-pulse w-1/3" />
					</div>
				</div>
			)}

			{/* loading / running */}
			{isLoading && (
				<div className="border border-gray-200 rounded-lg bg-white px-6 py-6 mt-4">
					<div className="mb-5">
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
								<span className="text-sm font-medium text-gray-700">
									{t("scenario.report.generating_title")}
								</span>
							</div>
							<span className="text-xs text-gray-400 tabular-nums">
								{t("scenario.report.elapsed", { elapsed })}
								<span className="text-gray-300 mx-1">/</span>
								{mins > 0
									? t("scenario.report.remaining_with_min", { mins, secs })
									: t("scenario.report.remaining_secs", { secs })}
							</span>
						</div>
						<div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
							<div
								className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
								style={{ width: `${progressPct}%` }}
							/>
						</div>
						<div className="flex justify-between mt-1">
							<span className="text-[10px] text-gray-400">{progressPct}%</span>
							<span className="text-[10px] text-gray-400">
								{t("scenario.report.approx_duration", { max: MAX_SECONDS })}
							</span>
						</div>
					</div>
				</div>
			)}

			{/* ready */}
			{!isLoading && showReport && reportData && (
				<div className="mt-4" ref={reportContainerRef}>
					<ThemeReportView data={reportData} isExpanded={isExpanded} />
				</div>
			)}

			{/* error */}
			{!isLoading && showReport && !reportData && (
				<div className="border border-red-200 rounded-lg bg-red-50 px-5 py-5 mt-4 space-y-3">
					<div className="flex items-start gap-2">
						<span className="text-red-500 text-lg leading-none">✕</span>
						<div>
							<p className="text-sm font-semibold text-red-700 mb-1">
								{t("scenario.report.error_title")}
							</p>
							{jobError && (
								<p className="text-xs text-red-600 font-mono break-all bg-red-100 rounded px-2 py-1">
									{jobError}
								</p>
							)}
						</div>
					</div>
					<button
						type="button"
						className="text-xs text-red-600 underline hover:text-red-800"
						onClick={onResetError}
					>
						{t("scenario.report.retry")}
					</button>
				</div>
			)}

			{/* generate button */}
			{!isLoading &&
				!showReport &&
				!checkingScenario &&
				!queueStatus &&
				treeId && (
					<div className="border border-gray-200 rounded-lg bg-white p-8 mt-4 text-center">
						<p className="text-sm text-gray-500 mb-4">
							{t("scenario.report.intro")}
						</p>
						{!scenarioData && <ReportGenerateButton onGenerate={onGenerate} />}
					</div>
				)}
		</div>
	)
}
