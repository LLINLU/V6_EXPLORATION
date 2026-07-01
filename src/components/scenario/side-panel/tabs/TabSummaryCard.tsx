import type React from "react"
import { ExpandableSummary } from "../ExpandableSummary"

interface TabSummaryCardProps {
	content: string
	title: string
}

export const TabSummaryCard: React.FC<TabSummaryCardProps> = ({
	content,
	title,
}) => {
	return (
		<div className="mb-4 rounded-lg bg-blue-50/70 p-4">
			<div
				className="mb-2 font-semibold text-slate-950"
				style={{ fontSize: "18px" }}
			>
				<span>{title}</span>
			</div>
			<ExpandableSummary content={content} />
		</div>
	)
}
