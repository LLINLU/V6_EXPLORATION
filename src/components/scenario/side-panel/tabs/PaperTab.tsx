import { Inbox, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PaginationControls } from "@/components/technology-tree/components/PaginationControls"
import { PaperCard } from "@/components/technology-tree/PaperCard"
import { Button } from "@/components/ui/button"
import type { PapersWithSaved } from "@/integrations/supabase/types/more_types"
import { TabSummaryCard } from "./TabSummaryCard"

const PAPER_SUMMARY_COUNT_LIMIT = 5

const InlineLoadingStatus = ({ label }: { label: string }) => (
	<div className="mb-3 flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
		<Loader2 className="h-3.5 w-3.5 animate-spin" />
		<span>{label}</span>
	</div>
)

interface PaperTabProps {
	isLoading: boolean
	visiblePapers: PapersWithSaved[]
	sortedPapersCount: number
	showSavedOnly: boolean
	papersSummary?: string
	currentPage: number
	totalPages: number
	pageSize: number
	treeId?: string | null
	isFetchingFromEdge: boolean
	onTogglePaper: (paper: PapersWithSaved) => void
	onPageChange: (page: number) => void
	onPageSizeChange: (size: number) => void
	onFetchPapers: () => void
}

export const PaperTab: React.FC<PaperTabProps> = ({
	isLoading,
	visiblePapers,
	sortedPapersCount,
	showSavedOnly,
	papersSummary,
	currentPage,
	totalPages,
	pageSize,
	treeId,
	isFetchingFromEdge,
	onTogglePaper,
	onPageChange,
	onPageSizeChange,
	onFetchPapers,
}) => {
	const { t } = useTranslation()
	const showSummary = !!papersSummary
	const summaryTitle = t("summary_section.papers_title", {
		count: Math.min(sortedPapersCount, PAPER_SUMMARY_COUNT_LIMIT),
	})

	if (isLoading && sortedPapersCount === 0) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
				<span className="ml-2 text-sm text-gray-500">
					論文データを読み込み中...
				</span>
			</div>
		)
	}

	if (showSavedOnly && visiblePapers.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-gray-500">
				<Inbox className="h-12 w-12 mb-4 text-gray-300" />
				<p
					className="font-medium"
					style={{ fontSize: "14px", lineHeight: "21px" }}
				>
					{t("scenario.tab.papers_saved_empty")}
				</p>
				<p className="text-sm mt-2">{t("scenario.tab.papers_saved_hint")}</p>
			</div>
		)
	}

	if (sortedPapersCount === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 gap-3">
				<p className="text-gray-500 text-sm">
					{t("scenario.tab.papers_empty")}
				</p>
				<Button
					variant="outline"
					size="sm"
					onClick={onFetchPapers}
					disabled={!treeId || isFetchingFromEdge}
				>
					{isFetchingFromEdge ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							{t("common.loading")}
						</>
					) : (
						t("scenario.tab.papers_fetch")
					)}
				</Button>
			</div>
		)
	}

	return (
		<div>
			{isLoading && <InlineLoadingStatus label={t("tech.searching")} />}
			{showSummary && (
				<TabSummaryCard content={papersSummary} title={summaryTitle} />
			)}
			<ul className="w-full space-y-4">
				{visiblePapers.map((paper) => (
					<PaperCard
						id={paper.id}
						key={paper.doi || paper.title}
						title={paper.title}
						authors={paper.authors || ""}
						journal={paper.journal || ""}
						tags={(paper.tags as string[]) || []}
						abstract={paper.abstract || ""}
						date={paper.date || ""}
						citations={paper.citations || 0}
						doi={paper.doi || ""}
						score={paper.score ?? 0}
						saved={paper.saved}
						togglePaper={() => onTogglePaper(paper)}
					/>
				))}
			</ul>
			<PaginationControls
				currentPage={currentPage}
				totalPages={totalPages}
				pageSize={pageSize}
				onPageChange={onPageChange}
				onPageSizeChange={(size) => {
					onPageSizeChange(size)
					onPageChange(1)
				}}
			/>
		</div>
	)
}
