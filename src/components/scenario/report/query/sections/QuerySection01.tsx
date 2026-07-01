import ReactCountryFlag from "react-country-flag"
import type { QueryS01 } from "@/types/query-report"
import { ConfidenceBadge } from "../ConfidenceBadge"
import { QUERY_PROSE_CLASS } from "../proseClasses"
import { QuerySectionHeader } from "../QuerySectionHeader"
import { QuerySources } from "../QuerySources"
import { useQueryReportLabels } from "../queryReportLabels"

function flagEmojiToCode(flag: string): string {
	return [...flag]
		.map((c) => String.fromCharCode((c.codePointAt(0) ?? 0) - 0x1f1e6 + 65))
		.join("")
}

export function QuerySection01({
	data,
	isExpanded = false,
}: {
	data: QueryS01
	isExpanded?: boolean
}) {
	const labels = useQueryReportLabels()
	return (
		<section id="query-s01" className="scroll-mt-2">
			<QuerySectionHeader num="01" title={labels.sections[0].labelFull} />

			{/* KPI cards */}
			{data.kpis?.length > 0 && (
				<div
					className={`grid gap-3 mb-5 ${isExpanded ? "grid-cols-3" : "grid-cols-1"}`}
				>
					{data.kpis.map((kpi, i) => (
						<div
							key={i}
							className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col justify-between gap-3"
						>
							<p className="text-[12px] text-gray-400 leading-snug">
								{kpi.label}
							</p>
							<p className="text-[18px] font-bold leading-none text-[#4f5fe0]">
								{kpi.value}
							</p>
						</div>
					))}
				</div>
			)}

			{/* Body HTML with inline <cite> styling */}
			<div
				className={`${QUERY_PROSE_CLASS} space-y-3 mb-6`}
				dangerouslySetInnerHTML={{ __html: data.body }}
			/>

			{/* Country policy cards */}
			{data.policies?.length > 0 && (
				<>
					<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
						{labels.section01.policyTrends}
					</p>
					<div className="space-y-2 mb-2">
						{data.policies.map((p, i) => (
							<div
								key={i}
								className="p-3 bg-gray-50 rounded-lg border border-gray-100"
							>
								<div className="flex items-center gap-2 mb-1.5 flex-wrap">
									<span
										className="shrink-0 rounded-sm overflow-hidden"
										style={{
											width: 20,
											height: "auto",
											display: "inline-flex",
										}}
									>
										<ReactCountryFlag
											countryCode={flagEmojiToCode(p.flag)}
											svg
											style={{ width: 20, height: "auto" }}
										/>
									</span>
									<p className="text-xs font-semibold text-gray-900">
										{p.country}
									</p>
									<ConfidenceBadge value={p.confidence} />
									{p.sourceUrl && (
										<a
											href={p.sourceUrl}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={labels.section01.openSource}
											title={labels.section01.openSource}
											className="ml-auto inline-flex items-center justify-center text-blue-600 hover:text-blue-700 transition-[transform,color] duration-200 ease-out hover:-translate-y-0.5 hover:translate-x-0.5"
										>
											<svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
												<path
													d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5"
													stroke="currentColor"
													strokeWidth="1.4"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</a>
									)}
								</div>
								<p className="text-[14px] text-gray-600 leading-relaxed">
									{p.text}
								</p>
							</div>
						))}
					</div>
				</>
			)}

			<QuerySources sources={data.sources} />
		</section>
	)
}
