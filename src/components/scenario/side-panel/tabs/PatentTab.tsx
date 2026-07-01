import { Loader2, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PatentCard } from "@/components/technology-tree/PatentCard"
import { Button } from "@/components/ui/button"
import type { NodePatent } from "@/stores/enrichedDataStore"
import { TabSummaryCard } from "./TabSummaryCard"

const PATENT_SUMMARY_COUNT_LIMIT = 10

const InlineLoadingStatus = ({ label }: { label: string }) => (
	<div className="mb-3 flex items-center gap-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
		<Loader2 className="h-3.5 w-3.5 animate-spin" />
		<span>{label}</span>
	</div>
)

interface PatentTabProps {
	isLoading: boolean
	displayedPatents: NodePatent[]
	totalPatentsCount?: number
	patentsSummary?: string
	onReload?: () => void
}

export const PatentTab: React.FC<PatentTabProps> = ({
	isLoading,
	displayedPatents,
	totalPatentsCount,
	patentsSummary,
	onReload,
}) => {
	const { t } = useTranslation()
	const showSummary = !!patentsSummary
	const effectiveTotalPatentsCount =
		typeof totalPatentsCount === "number" && totalPatentsCount > 0
			? totalPatentsCount
			: displayedPatents.length
	const visiblePatents =
		effectiveTotalPatentsCount > 0
			? displayedPatents.slice(
					0,
					Math.min(displayedPatents.length, effectiveTotalPatentsCount),
				)
			: displayedPatents
	const displayedPatentsCount = visiblePatents.length
	const summaryTitle = t("summary_section.patents_title", {
		count: Math.min(effectiveTotalPatentsCount, PATENT_SUMMARY_COUNT_LIMIT),
	})

	if (isLoading && displayedPatentsCount === 0) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
				<span className="ml-2 text-sm text-gray-500">
					{t("common.loading")}
				</span>
			</div>
		)
	}

	if (displayedPatentsCount === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 gap-3">
				{onReload && (
					<Button variant="outline" size="sm" onClick={onReload}>
						<RefreshCw className="h-4 w-4 mr-2" />
						{t("scenario.tab.patent_reload")}
					</Button>
				)}
			</div>
		)
	}

	return (
		<>
			{isLoading && <InlineLoadingStatus label={t("tech.searching")} />}
			{showSummary && (
				<TabSummaryCard content={patentsSummary} title={summaryTitle} />
			)}
			<p className="mb-3 text-xs text-gray-500">
				{t("scenario.tab.patent_displayed_count", {
					displayed: displayedPatentsCount.toLocaleString(),
					total: effectiveTotalPatentsCount.toLocaleString(),
				})}
			</p>
			<div>
				<ul className="space-y-4 px-1">
					{visiblePatents.map((patent) => (
						<PatentCard key={patent.id} patent={patent} />
					))}
				</ul>
			</div>
		</>
	)
}
