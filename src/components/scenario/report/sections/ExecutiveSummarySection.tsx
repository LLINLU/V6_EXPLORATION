import type { SummaryRow } from "@/types/report"
import { SummaryTablePair } from "./SummaryTablePair"

interface ExecutiveSummarySectionProps {
	narrative: string
	findings: string[]
	marketRows: SummaryRow[]
	researchRows: SummaryRow[]
}

export function ExecutiveSummarySection({
	narrative,
	findings,
	marketRows,
	researchRows,
}: ExecutiveSummarySectionProps) {
	return (
		<section id="report-executive-summary" className="scroll-mt-4">
			<h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
				<span className="text-blue-600">1.</span> エグゼクティブサマリー
			</h2>

			{/* Narrative + Findings */}
			<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
				<p className="text-sm text-gray-700 leading-relaxed">{narrative}</p>
				{findings.length > 0 && (
					<ul className="mt-3 space-y-1">
						{findings.map((f, i) => (
							<li key={i} className="text-sm text-gray-700 flex gap-2">
								<span className="text-blue-500 font-bold shrink-0">•</span>
								<span>{f}</span>
							</li>
						))}
					</ul>
				)}
			</div>

			<SummaryTablePair marketRows={marketRows} researchRows={researchRows} />

			{/* Warning note */}
			<div className="flex items-start gap-2 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded mt-4">
				<span className="text-yellow-600 shrink-0">⚠</span>
				<p className="text-xs text-gray-600">
					<strong>注記:</strong>{" "}
					論文/特許のCAGR（2020-2024）は2024年データの不完全性により負値となる場合があります。
				</p>
			</div>
		</section>
	)
}
