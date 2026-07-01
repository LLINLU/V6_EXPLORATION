import type { ThemeS05 } from "@/types/theme-report"
import { ReportInfoCallout } from "../../primitives"
import { ThemeMemlabBadges } from "../ThemeMemlabBadges"
import { ThemeSectionHeader } from "../ThemeSectionHeader"

const BARRIER_STYLE = { bg: "bg-gray-100", text: "text-gray-600" }

function getBarrierStyle(_type: string) {
	return BARRIER_STYLE
}

export function ThemeSection05({
	data,
	isExpanded = false,
	title,
	labels,
}: {
	data: ThemeS05
	isExpanded?: boolean
	title: string
	labels: {
		currentIssues: string
		approach: string
		limitation: string
		barrierType: string
	}
}) {
	return (
		<section id="theme-s05" className="scroll-mt-2">
			<ThemeSectionHeader num="05" title={title} />
			<ThemeMemlabBadges sources={data.sources} />

			{/* Approach cards */}
			<div
				className={`grid gap-3 mb-5 ${isExpanded ? "grid-cols-2" : "grid-cols-1"}`}
			>
				{data.approaches.map((a, i) => (
					<div
						key={i}
						className="bg-white rounded-lg border border-gray-200 p-3"
					>
						<p className="text-[14px] font-semibold text-gray-900 mb-1">
							{a.title}
						</p>
						<p className="text-[14px] text-gray-600 leading-relaxed">
							{a.desc}
						</p>
					</div>
				))}
			</div>

			{/* Issues table */}
			<p className="text-[12px] font-mono text-gray-600 font-semibold mb-2">
				{labels.currentIssues}
			</p>
			<div className="rounded-lg border border-gray-200 overflow-hidden mb-4">
				<table className="w-full">
					<thead>
						<tr className="bg-gray-50 border-b border-gray-200">
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
								{labels.approach}
							</th>
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
								{labels.limitation}
							</th>
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">
								{labels.barrierType}
							</th>
						</tr>
					</thead>
					<tbody>
						{data.issues.map((issue, i) => {
							const style = getBarrierStyle(issue.barrierType)
							return (
								<tr key={i} className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}>
									<td className="px-3 py-2.5 align-top text-[14px] font-medium text-gray-800 whitespace-nowrap">
										{issue.approach}
									</td>
									<td className="px-3 py-2.5 align-top text-[14px] text-gray-600 leading-relaxed">
										{issue.limitation}
									</td>
									<td className="px-3 py-2.5 align-top">
										<span
											className={`inline-block font-mono text-[14px] px-2 py-0.5 rounded-full whitespace-nowrap ${style.bg} ${style.text}`}
										>
											{issue.barrierType}
										</span>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>

			{/* Structural barriers */}
			<ReportInfoCallout showInfoIcon className="mb-2">
				{data.structuralBarriers}
			</ReportInfoCallout>
		</section>
	)
}
