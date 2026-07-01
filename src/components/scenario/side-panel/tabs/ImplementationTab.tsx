import { Inbox, Loader2, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ImplementationList } from "@/components/technology-tree/ImplementationList"
import { Button } from "@/components/ui/button"
import type { CasesWithSaved } from "@/integrations/supabase/types/more_types"
import { TabSummaryCard } from "./TabSummaryCard"

const CASE_SUMMARY_COUNT_LIMIT = 10

interface ImplementationTabProps {
	isLoading: boolean
	displayedCases: CasesWithSaved[]
	totalCasesCount: number
	showSavedOnly: boolean
	marketSummary?: string
	scenarioId: string
	onReload?: () => void
	onToggleCase: (useCase: CasesWithSaved) => void
}

export const ImplementationTab: React.FC<ImplementationTabProps> = ({
	isLoading,
	displayedCases,
	totalCasesCount,
	showSavedOnly,
	marketSummary,
	scenarioId,
	onReload,
	onToggleCase,
}) => {
	const { t } = useTranslation()
	const showSummary = !!marketSummary
	const summaryTitle = t("summary_section.cases_title", {
		count: Math.min(totalCasesCount, CASE_SUMMARY_COUNT_LIMIT),
	})

	if (isLoading && displayedCases.length === 0) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
				<span className="ml-2 text-sm text-gray-500">
					{t("common.loading")}
				</span>
			</div>
		)
	}

	if (showSavedOnly && displayedCases.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-gray-500">
				<Inbox className="h-12 w-12 mb-4 text-gray-300" />
				<p
					className="font-medium"
					style={{ fontSize: "14px", lineHeight: "21px" }}
				>
					{t("scenario.tab.cases_saved_empty")}
				</p>
				<p className="text-sm mt-2">{t("scenario.tab.cases_saved_hint")}</p>
			</div>
		)
	}

	if (displayedCases.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 gap-3">
				{onReload && (
					<Button variant="outline" size="sm" onClick={onReload}>
						<RefreshCw className="h-4 w-4 mr-2" />
						{t("scenario.tab.cases_reload")}
					</Button>
				)}
			</div>
		)
	}

	return (
		<>
			{showSummary && (
				<TabSummaryCard content={marketSummary} title={summaryTitle} />
			)}
			<div>
				<ImplementationList
					selectedNodeId={scenarioId}
					useCases={displayedCases}
					loadingUseCases={isLoading}
					toggleCase={onToggleCase}
				/>
			</div>
		</>
	)
}
