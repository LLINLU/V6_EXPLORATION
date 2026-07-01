/**
 * Source Pool Overview Component
 * Displays 3-section overview with counts for papers, patents, and implementations
 */

import { ChevronRight } from "lucide-react"
import type React from "react"
import type { QuantitativeData } from "@/types/sourcePool"

interface SourcePoolOverviewProps {
	data: QuantitativeData
	onSectionClick: (type: "papers" | "patents" | "implementations") => void
}

export const SourcePoolOverview: React.FC<SourcePoolOverviewProps> = ({
	data,
	onSectionClick,
}) => {
	return (
		<div className="flex flex-wrap gap-2">
			{/* Research Papers Section */}
			<button
				onClick={() => onSectionClick("papers")}
				className="inline-flex items-center gap-2 px-4 rounded-full border transition-all bg-white hover:shadow-sm"
				style={{
					height: "32px",
					borderColor: "#e2e8f0",
					color: "#596370",
				}}
			>
				<span className="text-sm">研究論文</span>
				<span className="text-sm font-semibold">{data.paperCount}</span>
				<ChevronRight className="h-4 w-4" />
			</button>

			{/* Patents Section */}
			<button
				onClick={() => onSectionClick("patents")}
				className="inline-flex items-center gap-2 px-4 rounded-full border transition-all bg-white hover:shadow-sm"
				style={{
					height: "32px",
					borderColor: "#e2e8f0",
					color: "#596370",
				}}
			>
				<span className="text-sm">関連特許</span>
				<span className="text-sm font-semibold">{data.patentCount}</span>
				<ChevronRight className="h-4 w-4" />
			</button>

			{/* Market Implementations Section */}
			<button
				onClick={() => onSectionClick("implementations")}
				className="inline-flex items-center gap-2 px-4 rounded-full border transition-all bg-white hover:shadow-sm"
				style={{
					height: "32px",
					borderColor: "#e2e8f0",
					color: "#596370",
				}}
			>
				<span className="text-sm">市場実装例</span>
				<span className="text-sm font-semibold">
					{data.implementationCount}
				</span>
				<ChevronRight className="h-4 w-4" />
			</button>
		</div>
	)
}
