import {
	Pagination,
	PaginationContent,
	PaginationFirst,
	PaginationItem,
	PaginationLast,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"

// Removed Radix UI Select to prevent Portal DOM conflicts

interface PaginationControlsProps {
	currentPage: number
	totalPages: number
	pageSize: number
	onPageChange: (page: number) => void
	onPageSizeChange: (size: number) => void
}

export const PaginationControls = ({
	currentPage,
	totalPages,
	pageSize,
	onPageChange,
	onPageSizeChange,
}: PaginationControlsProps) => {
	return (
		<div className="flex items-center gap-1 mt-4">
			<Pagination>
				<PaginationContent className="gap-0.5">
					{/* First Page Button */}
					<PaginationItem>
						<PaginationFirst
							onClick={() => onPageChange(1)}
							aria-disabled={currentPage === 1}
							className={
								currentPage === 1 ? "pointer-events-none opacity-50" : ""
							}
						/>
					</PaginationItem>

					{/* Previous Page Button */}
					<PaginationItem>
						<PaginationPrevious
							onClick={() => onPageChange(Math.max(1, currentPage - 1))}
							aria-disabled={currentPage === 1}
							className={
								currentPage === 1 ? "pointer-events-none opacity-50" : ""
							}
						/>
					</PaginationItem>

					{/* Next Page Button */}
					<PaginationItem>
						<PaginationNext
							onClick={() =>
								onPageChange(Math.min(totalPages, currentPage + 1))
							}
							aria-disabled={currentPage === totalPages}
							className={
								currentPage === totalPages
									? "pointer-events-none opacity-50"
									: ""
							}
						/>
					</PaginationItem>

					{/* Last Page Button */}
					<PaginationItem>
						<PaginationLast
							onClick={() => onPageChange(totalPages)}
							aria-disabled={currentPage === totalPages}
							className={
								currentPage === totalPages
									? "pointer-events-none opacity-50"
									: ""
							}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>

			<select
				value={pageSize.toString()}
				onChange={(e) => onPageSizeChange(Number(e.target.value))}
				className="w-[180px] min-w-0 px-3 py-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shrink"
			>
				<option value="5">5件ずつ表示</option>
				<option value="10">10件ずつ表示</option>
				<option value="15">15件ずつ表示</option>
				<option value="20">20件ずつ表示</option>
			</select>
		</div>
	)
}
