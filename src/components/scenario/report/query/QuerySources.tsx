import type { QueryReportSource } from "@/types/query-report"
import { useQueryReportLabels } from "./queryReportLabels"

interface QuerySourcesProps {
	sources: QueryReportSource[]
}

export function QuerySources({ sources }: QuerySourcesProps) {
	const labels = useQueryReportLabels()
	if (!sources?.length) return null
	return (
		<div className="mt-6 pt-4 border-t border-gray-100">
			<p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-2">
				{labels.sources}
			</p>
			<div className="flex flex-wrap gap-1.5">
				{sources.map((s, i) =>
					s.url ? (
						<a
							key={i}
							href={s.url}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
						>
							{s.label}
							<svg
								className="w-2.5 h-2.5 shrink-0"
								viewBox="0 0 12 12"
								fill="none"
							>
								<path
									d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5"
									stroke="currentColor"
									strokeWidth="1.2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</a>
					) : (
						<span
							key={i}
							className="inline-block font-mono text-[11px] text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded"
						>
							{s.label}
						</span>
					),
				)}
			</div>
		</div>
	)
}
