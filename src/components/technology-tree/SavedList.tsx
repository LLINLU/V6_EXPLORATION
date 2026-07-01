import { useEffect } from "react"
import type {
	CasesWithSaved,
	PapersWithSaved,
} from "@/integrations/supabase/types/more_types"
import { usePaperList } from "./hooks/usePaperList"
import { ImplementationCard } from "./ImplementationCard"
import { PaperCard } from "./PaperCard"

interface SavedListProps {
	papers: PapersWithSaved[]
	cases: CasesWithSaved[]
	selectedNodeId?: string
	filterString?: string
	sortBy?: string
	keyword?: string
	onTotalCountChange?: (count: number) => void
	togglePaper: (paper: PapersWithSaved) => void
	toggleCase: (usecase: CasesWithSaved) => void
}

export const SavedList = ({
	selectedNodeId,
	filterString,
	papers,
	cases,
	sortBy,
	keyword,
	onTotalCountChange,
	togglePaper,
	toggleCase,
}: SavedListProps) => {
	const { totalCount, loading } = usePaperList(
		selectedNodeId,
		filterString,
		sortBy,
		keyword,
	)

	// Notify parent component of total count changes
	useEffect(() => {
		onTotalCountChange?.(totalCount)
	}, [totalCount, onTotalCountChange])

	// Show loading state when fetching real data
	if (selectedNodeId && loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		)
	}

	// Show empty state only when a node is selected but has no papers
	if (papers.length === 0 && cases.length === 0 && selectedNodeId) {
		return (
			<div className="flex items-center justify-center py-8">
				<p className="text-gray-500 text-sm">この技術の論文はまだありません</p>
			</div>
		)
	}

	// If no node is selected, return null and let TabContent handle the empty state
	if (!selectedNodeId) {
		return null
	}

	return (
		<>
			<ul className="w-full space-y-4">
				{papers.map((paper) => (
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
						saved={paper.saved ?? false}
						togglePaper={() => togglePaper(paper)}
					/>
				))}
				{cases.map((useCase) => (
					<ImplementationCard
						key={useCase.id}
						title={useCase.product}
						description={useCase.description}
						company={useCase.company}
						releases={useCase.press_releases.length}
						badgeColor="bg-[#E8F1FF]"
						badgeTextColor="text-[#0EA5E9]"
						pressReleases={useCase.press_releases.map((url, index) => {
							// Try to extract a meaningful title from the URL or use a default
							try {
								const urlObj = new URL(url)
								const title = `${urlObj.hostname}`
								return {
									title: title,
									url: url,
								}
							} catch {
								// If URL is invalid, just use a default title
								return {
									title: `プレスリリース ${index + 1}`,
									url: url,
								}
							}
						})}
						saved={useCase.saved ?? false}
						toggleCase={() => toggleCase(useCase)}
					/>
				))}
			</ul>

			{/* <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                    setPageSize(size)
                    setCurrentPage(1)
                }}
            /> */}
		</>
	)
}
