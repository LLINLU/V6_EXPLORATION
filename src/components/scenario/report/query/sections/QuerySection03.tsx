import type { QueryForecast, QueryS03 } from "@/types/query-report"
import { QuerySectionHeader } from "../QuerySectionHeader"
import { QuerySources } from "../QuerySources"
import { useQueryReportLabels } from "../queryReportLabels"

const SCENARIO_LABEL: Record<string, { text: string; cls: string }> = {
	"base-case": {
		text: "ベース",
		cls: "bg-blue-50 text-blue-700",
	},
	optimistic: {
		text: "強気",
		cls: "bg-green-50 text-green-600",
	},
	conservative: {
		text: "保守",
		cls: "bg-gray-100 text-gray-600",
	},
}

function ForecastRow({
	f,
	alt,
	scenarioLabels,
}: {
	f: QueryForecast
	alt: boolean
	scenarioLabels: Record<string, string>
}) {
	const sc = f.scenario ? SCENARIO_LABEL[f.scenario] : undefined
	return (
		<tr className={alt ? "bg-gray-50" : "bg-white"}>
			<td className="px-3 py-2.5 align-top">
				<a
					href={f.reportUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="group inline-flex items-center text-[14px] font-semibold text-gray-900 hover:text-blue-600 transition-colors"
				>
					{f.org}
					<svg
						className="inline-block w-3 h-3 ml-1 text-blue-600 group-hover:text-blue-700 transition-[transform,color] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
						viewBox="0 0 12 12"
						fill="none"
					>
						<path
							d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5"
							stroke="currentColor"
							strokeWidth="1.4"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</a>
				<p className="text-[12px] text-gray-400 mt-0.5">{f.sub}</p>
				{sc && (
					<span
						className={`inline-block mt-1 font-mono text-[10px] px-1.5 py-0.5 rounded-lg ${sc.cls}`}
					>
						{scenarioLabels[f.scenario ?? ""] ?? sc.text}
					</span>
				)}
			</td>
			<td className="px-3 py-2.5 align-middle">
				<div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
					<div
						className="h-full bg-blue-500 rounded-full"
						style={{ width: `${f.pctFill}%` }}
					/>
				</div>
				<p className="text-[14px] text-gray-600">
					{f.current} → {f.future}
				</p>
			</td>
			<td className="px-3 py-2.5 align-middle text-[14px] text-gray-700 whitespace-nowrap">
				{f.year}
			</td>
			<td className="px-3 py-2.5 align-middle text-[14px] text-gray-900">
				{f.cagr}
			</td>
		</tr>
	)
}

export function QuerySection03({
	data,
	isExpanded = false,
}: {
	data: QueryS03
	isExpanded?: boolean
}) {
	const labels = useQueryReportLabels()
	return (
		<section id="query-s03" className="scroll-mt-2">
			<QuerySectionHeader num="03" title={labels.section03.title} />

			{/* TAM hero — full-width row */}
			<div className="bg-white rounded-lg border border-gray-200 p-5 mb-3">
				<div className="flex items-start justify-between gap-2 mb-2">
					<p className="font-mono text-[12px] uppercase tracking-widest text-gray-400">
						{labels.section03.tam}
					</p>
					<a
						href={data.tam.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="group inline-flex items-center gap-1 font-mono text-[10px] bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded hover:bg-gray-100 transition-colors shrink-0"
					>
						{data.tam.sourceOrg}（{data.tam.sourceYear}）
						<svg
							className="w-2.5 h-2.5 text-blue-600 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
							viewBox="0 0 12 12"
							fill="none"
						>
							<path
								d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</a>
				</div>
				<p className="text-[26px] font-mono font-bold leading-none mb-2 text-[#4f5fe0]">
					{data.tam.value}
				</p>
				<p className="text-[14px] text-gray-600 leading-relaxed">
					{data.tam.label}
				</p>
			</div>

			{/* Sub metric cards — one row */}
			{data.tamCards && data.tamCards.length > 0 && (
				<div
					className={`grid gap-3 mb-5 ${isExpanded ? "grid-cols-3" : "grid-cols-1"}`}
				>
					{data.tamCards.map((c, i) => (
						<div
							key={i}
							className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2"
						>
							<p className="text-[12px] text-gray-400 leading-snug">
								{c.label}
							</p>
							<p className="text-[20px] font-mono font-bold leading-none text-[#4f5fe0]">
								{c.value}
							</p>
						</div>
					))}
				</div>
			)}

			{/* Forecast comparison table */}
			<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
				{labels.section03.forecastComparison}
			</p>
			<div className="rounded-lg border border-gray-200 overflow-hidden mb-2 overflow-x-auto">
				<table className="w-full min-w-[560px]">
					<thead>
						<tr className="bg-gray-50 border-b border-gray-200">
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
								{labels.section03.org}
							</th>
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium min-w-[180px]">
								{labels.section03.marketForecast}
							</th>
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">
								{labels.section03.forecastYear}
							</th>
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
								CAGR
							</th>
						</tr>
					</thead>
					<tbody>
						{data.forecasts.map((f, i) => (
							<ForecastRow
								key={i}
								f={f}
								alt={i % 2 === 1}
								scenarioLabels={labels.section03.scenario}
							/>
						))}
					</tbody>
				</table>
			</div>

			<QuerySources sources={data.sources} />
		</section>
	)
}
