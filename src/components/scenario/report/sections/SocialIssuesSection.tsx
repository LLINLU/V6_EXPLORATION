import type { SocialIssueSolution } from "@/types/report"
import { SolutionCard } from "./SolutionCard"

interface SocialIssuesSectionProps {
	overallSummary: string
	solutions: SocialIssueSolution[]
}

export function SocialIssuesSection({
	overallSummary,
	solutions,
}: SocialIssuesSectionProps) {
	return (
		<section id="report-social-issues" className="scroll-mt-4">
			<h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
				<span className="text-blue-600">6.</span> 社会課題
			</h2>

			<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
				<p className="text-sm text-gray-700 leading-relaxed">
					{overallSummary}
				</p>
			</div>

			<div className="space-y-3">
				{solutions.map((sol, i) => (
					<SolutionCard
						key={i}
						title={sol.title}
						text={sol.text}
						sources={sol.sources}
					/>
				))}
			</div>
		</section>
	)
}
