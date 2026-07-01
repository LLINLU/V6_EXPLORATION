import type { ThemeS06 } from "@/types/theme-report"
import { ReportFoldableCard, ReportInfoCallout } from "../../primitives"
import { ThemeMemlabBadges } from "../ThemeMemlabBadges"
import { ThemeSectionHeader } from "../ThemeSectionHeader"

export function ThemeSection06({
	data,
	isExpanded: _isExpanded = false,
	title,
	labels,
}: {
	data: ThemeS06
	isExpanded?: boolean
	title: string
	labels: {
		currentLimit: string
		solution: string
	}
}) {
	return (
		<section id="theme-s06" className="scroll-mt-2">
			<ThemeSectionHeader num="06" title={title} />
			<ThemeMemlabBadges sources={data.sources} />

			<p className="text-[14px] text-gray-700 leading-relaxed mb-4">
				{data.intro}
			</p>

			<div className="space-y-3 mb-2">
				{data.comparison.map((item, i) => (
					<ReportFoldableCard
						key={i}
						badge={String(i + 1).padStart(2, "0")}
						title={item.issue}
					>
						<ReportInfoCallout label={labels.currentLimit} labelTone="red">
							{item.currentLimit}
						</ReportInfoCallout>

						<div className="flex justify-center py-1">
							<svg
								className="w-4 h-4 text-gray-300"
								viewBox="0 0 16 16"
								fill="none"
							>
								<path
									d="M8 3v10M8 13l-3-3M8 13l3-3"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</div>

						<ReportInfoCallout label={labels.solution} labelTone="emerald">
							{item.solution}
						</ReportInfoCallout>
					</ReportFoldableCard>
				))}
			</div>
		</section>
	)
}
