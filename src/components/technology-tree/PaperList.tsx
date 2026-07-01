import { useEffect, useState } from "react"
import type { Tables } from "@/integrations/supabase/types/database.types"
import { PaginationControls } from "./components/PaginationControls"
import { PaperCard } from "./PaperCard"

type PaperData = Tables<"node_papers">
type PapersWithSaved = Omit<PaperData, "saved"> & { saved: boolean }

interface PaperListProps {
	papers: PapersWithSaved[]
	selectedNodeId?: string
	filterString?: string
	sortBy?: string
	onTotalCountChange?: (count: number) => void
	togglePaper: (paper: PapersWithSaved) => void
}

export const PaperList = ({
	selectedNodeId,
	//filterString,
	papers,
	//sortBy,
	onTotalCountChange,
	togglePaper,
}: PaperListProps) => {
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)

	// Calculate pagination from the papers prop
	const totalPages = Math.ceil(papers.length / pageSize)
	const startIndex = (currentPage - 1) * pageSize
	const paginatedPapers = papers.slice(startIndex, startIndex + pageSize)

	// Notify parent component of total count changes
	useEffect(() => {
		onTotalCountChange?.(papers.length)
	}, [papers.length, onTotalCountChange])

	// Reset to page 1 when filters/sort change or papers array changes
	useEffect(() => {
		setCurrentPage(1)
	}, [])

	// Show empty state only when a node is selected but has no papers
	if (papers.length === 0 && selectedNodeId) {
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
				{paginatedPapers.map((paper) => (
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
						togglePaper={() => togglePaper(paper)}
					/>
				))}
			</ul>

			<PaginationControls
				currentPage={currentPage}
				totalPages={totalPages}
				pageSize={pageSize}
				onPageChange={setCurrentPage}
				onPageSizeChange={(size) => {
					setPageSize(size)
					setCurrentPage(1)
				}}
			/>
		</>
	)
}
