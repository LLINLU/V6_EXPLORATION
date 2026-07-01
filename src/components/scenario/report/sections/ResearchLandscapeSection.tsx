import type { JournalEntry, YearlyCount } from "@/types/report"
import { CHART_COLORS } from "../charts/chartConfig"
import { TopJournalsList } from "./TopJournalsList"
import { YearlyBarChart } from "./YearlyBarChart"

interface ResearchLandscapeSectionProps {
	articleCommentary: string
	articleYearlyData: YearlyCount[]
	patentCommentary: string
	patentYearlyData: YearlyCount[]
	topJournals: JournalEntry[]
}

export function ResearchLandscapeSection({
	articleCommentary,
	articleYearlyData,
	patentCommentary,
	patentYearlyData,
	topJournals,
}: ResearchLandscapeSectionProps) {
	return (
		<section id="report-research-landscape" className="scroll-mt-4">
			<h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
				<span className="text-blue-600">4.</span> 研究動向
			</h2>

			{/* Article Trend */}
			<div className="mb-4">
				<h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
					論文動向
				</h4>
				<div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-3">
					<p className="text-xs text-gray-700">{articleCommentary}</p>
				</div>
				<YearlyBarChart
					yearlyData={articleYearlyData}
					color={CHART_COLORS.article}
					borderColor={CHART_COLORS.articleBorder}
					label="論文数"
				/>
			</div>

			{/* Patent Trend */}
			<div className="mb-4">
				<h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
					特許動向
				</h4>
				<div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-3">
					<p className="text-xs text-gray-700">{patentCommentary}</p>
				</div>
				<YearlyBarChart
					yearlyData={patentYearlyData}
					color={CHART_COLORS.patent}
					borderColor={CHART_COLORS.patentBorder}
					label="特許数"
				/>
			</div>

			{/* Warning */}
			<div className="flex items-start gap-2 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded mb-4">
				<span className="text-yellow-600 shrink-0">⚠</span>
				<p className="text-xs text-gray-600">
					2024年データはインデックス登録の遅延により不完全な場合があります。
				</p>
			</div>

			<TopJournalsList journals={topJournals} />
		</section>
	)
}
