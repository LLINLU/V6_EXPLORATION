import { ArrowUpRight } from "lucide-react"
import type { QueryS07, QueryTableCell } from "@/types/query-report"
import { QuerySectionHeader } from "../QuerySectionHeader"
import { QuerySources } from "../QuerySources"
import { useQueryReportLabels } from "../queryReportLabels"

const STATUS_BADGE_CLS = "bg-gray-100 text-gray-600"

function normalizeLinkUrl(url: string) {
	const trimmed = url.trim()
	if (!trimmed) return null
	if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed
	return `https://${trimmed}`
}

function renderCell(c: QueryTableCell, colIdx: number, openApplyLabel: string) {
	// Column 4 (status) gets a neutral gray badge
	if (colIdx === 4 && typeof c === "string") {
		return (
			<span
				className={`font-mono text-[11px] px-2 py-0.5 rounded-lg whitespace-nowrap ${STATUS_BADGE_CLS}`}
			>
				{c}
			</span>
		)
	}
	if (typeof c === "string") return c
	const href = normalizeLinkUrl(c.url)
	if (!href) return c.text
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={openApplyLabel}
			className="group inline-flex items-center text-blue-600 transition-colors duration-200 hover:text-blue-700"
		>
			<span className="inline-flex items-center transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 query-report-screen-link-icon">
				<ArrowUpRight size={16} strokeWidth={2.25} />
			</span>
			<span className="hidden query-report-print-link">{c.text || href}</span>
		</a>
	)
}

export function QuerySection07({ data }: { data: QueryS07 }) {
	const labels = useQueryReportLabels()
	return (
		<section id="query-s07" className="scroll-mt-2">
			<QuerySectionHeader num="07" title={labels.section07.title} />

			{/* Intro */}
			{data.intro && (
				<div className="bg-blue-50 rounded-lg p-3 mb-4">
					<p className="font-mono text-[12px] uppercase tracking-widest text-blue-600 mb-1 inline-flex items-center gap-1.5">
						<svg
							className="w-3.5 h-3.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" />
						</svg>
						{labels.sectionPoint}
					</p>
					<p className="text-[14px] text-gray-700 leading-relaxed">
						{data.intro}
					</p>
				</div>
			)}

			{/* Program table */}
			<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
				{labels.section07.programs}
			</p>
			<div className="rounded-lg border border-gray-200 overflow-hidden mb-2 overflow-x-auto">
				<table className="w-full min-w-[720px] text-[14px]">
					<thead>
						<tr className="bg-gray-50 border-b border-gray-200">
							{data.programTable.headers.map((h, i) => (
								<th
									key={i}
									className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap"
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data.programTable.rows.map((row, i) => (
							<tr key={i} className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}>
								{row.map((cell, j) => (
									<td
										key={j}
										className="px-3 py-2.5 align-top text-gray-700 leading-relaxed"
									>
										{renderCell(cell, j, labels.section07.openApply)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<QuerySources sources={data.sources} />
		</section>
	)
}
