import { ArrowUpRight } from "lucide-react"
import ReactCountryFlag from "react-country-flag"
import type { QueryS04, QueryTableCell } from "@/types/query-report"
import { ConfidenceBadge } from "../ConfidenceBadge"
import { QUERY_PROSE_CLASS } from "../proseClasses"
import { QuerySectionHeader } from "../QuerySectionHeader"
import { QuerySources } from "../QuerySources"
import { useQueryReportLabels } from "../queryReportLabels"

const COUNTRY_TO_ISO: Record<string, string> = {
	米国: "US",
	日本: "JP",
	英国: "GB",
	韓国: "KR",
	スイス: "CH",
	ドイツ: "DE",
	フランス: "FR",
	中国: "CN",
	台湾: "TW",
	イスラエル: "IL",
	カナダ: "CA",
	オランダ: "NL",
	シンガポール: "SG",
	US: "US",
	USA: "US",
	"United States": "US",
	JP: "JP",
	Japan: "JP",
	UK: "GB",
	"United Kingdom": "GB",
	KR: "KR",
	Korea: "KR",
	"South Korea": "KR",
	CN: "CN",
	China: "CN",
	DE: "DE",
	Germany: "DE",
	FR: "FR",
	France: "FR",
}

function renderCell(c: QueryTableCell, _idx: number, openDoiLabel: string) {
	if (typeof c === "string") return c
	return (
		<a
			href={c.url}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={openDoiLabel}
			className="group inline text-gray-700 hover:text-blue-600 transition-colors duration-200"
		>
			{c.text}
			<span className="inline-flex items-center text-blue-600 align-baseline ml-1 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
				<ArrowUpRight size={14} strokeWidth={2.25} />
			</span>
		</a>
	)
}

export function QuerySection04({
	data,
	isExpanded = false,
}: {
	data: QueryS04
	isExpanded?: boolean
}) {
	const labels = useQueryReportLabels()
	const maxPapers = Math.max(...data.annualData.map((d) => d.papers))
	const maxPatents = Math.max(...data.annualData.map((d) => d.patents))

	return (
		<section id="query-s04" className="scroll-mt-2">
			<QuerySectionHeader num="04" title={labels.section04.title} />

			{/* Intro */}
			{data.intro && (
				<div className="bg-blue-50 rounded-lg p-4 mb-6">
					<p className="font-mono text-[12px] uppercase tracking-widest text-blue-600 mb-2 inline-flex items-center gap-1.5">
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

			{/* Body */}
			<div
				className={`${QUERY_PROSE_CLASS} mb-8`}
				dangerouslySetInnerHTML={{ __html: data.body }}
			/>

			{/* Search keywords */}
			{data.searchKeywords?.length > 0 && (
				<div className="mb-8">
					<p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-2.5">
						{labels.section04.searchKeywords}
					</p>
					<div className="flex flex-wrap gap-1.5">
						{data.searchKeywords.map((k, i) => (
							<span
								key={i}
								className="font-mono text-[11px] bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded"
							>
								{k}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Chart phases */}
			{data.chartPhases?.length > 0 && (
				<>
					<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-3">
						{labels.section04.phases}
					</p>
					<div
						className={`grid gap-4 mb-8 ${isExpanded ? "grid-cols-3" : "grid-cols-1"}`}
					>
						{data.chartPhases.map((p) => (
							<div
								key={p.phase}
								className="bg-white rounded-lg border border-gray-200 p-5"
							>
								<p className="font-mono text-[10px] text-gray-500 mb-2">
									{p.yearRange}
								</p>
								<div className="flex items-center gap-2 mb-1.5">
									<p className="text-[12px] font-bold text-gray-900">
										{p.title}
									</p>
									<span className="ml-auto font-mono text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
										Phase {p.phase}
									</span>
								</div>
								<p className="text-[14px] text-gray-600 leading-relaxed">
									{p.desc}
								</p>
							</div>
						))}
					</div>
				</>
			)}

			{/* Annual data — bar chart */}
			{data.annualData?.length > 0 && (
				<>
					<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-3">
						{labels.section04.annualTrend}
					</p>
					<div className="rounded-lg border border-gray-200 overflow-hidden mb-3 overflow-x-auto">
						<table className="w-full min-w-[520px] text-[14px]">
							<thead>
								<tr className="bg-gray-50 border-b border-gray-200">
									<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
										{labels.section04.year}
									</th>
									<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium min-w-[140px]">
										{labels.section04.papers}
									</th>
									<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium min-w-[140px]">
										{labels.section04.patents}
									</th>
									<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
										{labels.section04.events}
									</th>
								</tr>
							</thead>
							<tbody>
								{data.annualData.map((d, i) => (
									<tr
										key={d.year}
										className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}
									>
										<td className="px-3 py-3 align-middle font-mono text-[12px] text-gray-900">
											{d.year}
										</td>
										<td className="px-3 py-3 align-middle">
											<div className="flex items-center gap-2">
												<div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-20">
													<div
														className="h-full bg-blue-500 rounded-full"
														style={{
															width: `${(d.papers / maxPapers) * 100}%`,
														}}
													/>
												</div>
												<span className="font-mono text-[12px] text-gray-700 tabular-nums w-8">
													{d.papers}
												</span>
												<span
													className={`font-mono text-[10px] ${d.papersDelta.startsWith("+") ? "text-emerald-600" : "text-gray-400"}`}
												>
													{d.papersDelta}
												</span>
											</div>
										</td>
										<td className="px-3 py-3 align-middle">
											<div className="flex items-center gap-2">
												<div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-20">
													<div
														className="h-full bg-teal-400 rounded-full"
														style={{
															width: `${(d.patents / maxPatents) * 100}%`,
														}}
													/>
												</div>
												<span className="font-mono text-[12px] text-gray-700 tabular-nums w-8">
													{d.patents}
												</span>
												<span
													className={`font-mono text-[10px] ${d.patentsDelta.startsWith("+") ? "text-emerald-600" : "text-gray-400"}`}
												>
													{d.patentsDelta}
												</span>
											</div>
										</td>
										<td className="px-3 py-3 align-middle text-[14px] text-gray-700">
											{d.event}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{data.patentLagNote && (
						<p className="text-[11px] text-gray-700 italic bg-gray-50 rounded-lg px-4 py-3 mb-8">
							⚠ {data.patentLagNote}
						</p>
					)}
				</>
			)}

			{/* Timeline of events */}
			{data.events?.length > 0 && (
				<>
					<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-3 mt-8">
						{labels.section04.eventTimeline}
					</p>
					<ol className="relative ml-2 pl-5 border-l-2 border-gray-200 space-y-6 mb-8">
						{data.events.map((e, i) => (
							<li key={i} className="relative">
								<span className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
								<div className="mb-2.5">
									<p className="font-mono text-[12px] text-blue-600 tracking-wider">
										{e.date}
									</p>
								</div>
								<div className="bg-gray-50 rounded-lg px-4 py-3">
									<div className="flex items-center gap-2 mb-1 flex-wrap">
										<p className="text-[12px] font-bold text-gray-900">
											{e.title}
										</p>
										<span className="ml-auto">
											<ConfidenceBadge value={e.confidence} />
										</span>
									</div>
									<p className="text-[14px] text-gray-600 leading-relaxed">
										{e.body}
									</p>
								</div>
							</li>
						))}
					</ol>
				</>
			)}

			{/* Papers table */}
			{data.papersTable?.rows?.length > 0 && (
				<>
					<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
						{labels.section04.keyPapers}
					</p>
					<div className="rounded-lg border border-gray-200 overflow-hidden mb-5 overflow-x-auto">
						<table className="w-full min-w-[640px] text-[14px]">
							<thead>
								<tr className="bg-gray-50 border-b border-gray-200">
									{data.papersTable.headers.map((h, i) => (
										<th
											key={i}
											className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium"
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{data.papersTable.rows.map((row, i) => (
									<tr
										key={i}
										className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}
									>
										{row.map((cell, j) => (
											<td
												key={j}
												className="px-3 py-2.5 align-top text-gray-700 leading-relaxed"
											>
												{renderCell(cell, j, labels.section04.openDoi)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</>
			)}

			{/* Patents — top assignees */}
			{data.patents && (
				<>
					<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
						{labels.section04.topAssignees}
					</p>
					{data.patents.trendNote && (
						<p className="text-[14px] text-gray-600 leading-relaxed mb-3">
							{data.patents.trendNote}
						</p>
					)}
					<div
						className={`grid gap-2 mb-3 ${isExpanded ? "grid-cols-2" : "grid-cols-1"}`}
					>
						{data.patents.topAssignees.map((a, i) => (
							<div
								key={i}
								className="bg-white rounded border border-gray-200 px-3 py-2 flex items-center justify-between gap-2"
							>
								<div className="min-w-0">
									<p className="text-[12px] font-semibold text-gray-900 truncate">
										{a.name}
									</p>
									<p className="font-mono text-[10px] text-gray-400 inline-flex items-center gap-1">
										{COUNTRY_TO_ISO[a.country] && (
											<span
												className="shrink-0 rounded-sm overflow-hidden inline-flex"
												style={{ width: 14, height: "auto" }}
											>
												<ReactCountryFlag
													countryCode={COUNTRY_TO_ISO[a.country]}
													svg
													style={{ width: 14, height: "auto" }}
												/>
											</span>
										)}
										{a.country}
									</p>
								</div>
								<span className="font-mono text-[12px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded shrink-0">
									{a.count}
								</span>
							</div>
						))}
					</div>
					{data.patents.dataSource && (
						<p className="text-[11px] text-gray-400 italic mb-2">
							{labels.section04.dataSource}
							{data.patents.dataSource}
						</p>
					)}
				</>
			)}

			<QuerySources sources={data.sources} />
		</section>
	)
}
