import { BarChart3, CheckCircle2, Loader2, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { OverallStatus, SectionState } from "@/types/services"

interface ReportProgressBannerProps {
	overallStatus: OverallStatus
	sectionStates?: Record<string, SectionState>
}

export function ReportProgressBanner({
	overallStatus,
	sectionStates,
}: ReportProgressBannerProps) {
	const { t } = useTranslation()

	const PHASE_CONFIG: Record<
		string,
		{ icon: typeof Loader2; label: string; color: string }
	> = {
		pending: {
			icon: Loader2,
			label: t("scenario.report.phase_pending"),
			color: "text-blue-600",
		},
		searching: {
			icon: Search,
			label: t("scenario.report.phase_searching"),
			color: "text-blue-600",
		},
		search_done: {
			icon: BarChart3,
			label: t("scenario.report.phase_search_done"),
			color: "text-indigo-600",
		},
		analyzing: {
			icon: BarChart3,
			label: t("scenario.report.phase_analyzing"),
			color: "text-indigo-600",
		},
	}

	const SECTION_LABELS: Record<string, string> = {
		trl: t("scenario.report.section_trl"),
		market: t("scenario.report.section_market"),
		social_issue: t("scenario.report.section_social_issue"),
		technical_competitors: t("scenario.report.section_technical_competitors"),
		executive_summary: t("scenario.report.section_executive_summary"),
		research_landscape: t("scenario.report.section_research_landscape"),
		market_implementations: t("scenario.report.section_market_implementations"),
	}

	const STATUS_BADGE: Record<string, { label: string; className: string }> = {
		pending: {
			label: t("scenario.report.status_pending"),
			className: "bg-gray-100 text-gray-600",
		},
		running: {
			label: t("scenario.report.status_running"),
			className: "bg-blue-100 text-blue-700",
		},
		done: {
			label: t("scenario.report.status_done"),
			className: "bg-green-100 text-green-700",
		},
		error: {
			label: t("scenario.report.status_error"),
			className: "bg-red-100 text-red-700",
		},
	}

	if (overallStatus === "idle" || overallStatus === "done") return null

	const phase = PHASE_CONFIG[overallStatus]
	if (!phase) return null

	const Icon = phase.icon
	const isAnimated = overallStatus !== "search_done"

	const doneCount = sectionStates
		? Object.values(sectionStates).filter((s) => s.status === "done").length
		: 0
	const totalCount = sectionStates ? Object.keys(sectionStates).length : 7

	return (
		<div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
			<div className="flex items-center gap-3">
				<Icon
					className={`h-5 w-5 ${phase.color} ${isAnimated ? "animate-spin" : ""}`}
				/>
				<div className="flex-1">
					<p className={`text-sm font-medium ${phase.color}`}>{phase.label}</p>
					{totalCount > 0 && (
						<p className="mt-0.5 text-xs text-gray-500">
							{t("scenario.report.sections_complete", {
								done: doneCount,
								total: totalCount,
							})}
						</p>
					)}
				</div>
			</div>

			{sectionStates &&
				(overallStatus === "analyzing" || overallStatus === "search_done") && (
					<div className="mt-3 flex flex-wrap gap-2">
						{Object.entries(sectionStates).map(([type, state]) => {
							const badge = STATUS_BADGE[state.status]
							if (!badge) return null
							return (
								<span
									key={type}
									className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
								>
									{state.status === "done" && (
										<CheckCircle2 className="h-3 w-3" />
									)}
									{state.status === "running" && (
										<Loader2 className="h-3 w-3 animate-spin" />
									)}
									{SECTION_LABELS[type] ?? type}: {badge.label}
								</span>
							)
						})}
					</div>
				)}
		</div>
	)
}
