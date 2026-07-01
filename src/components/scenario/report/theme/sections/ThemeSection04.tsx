import type { ThemeS04 } from "@/types/theme-report"
import { ThemeMemlabBadges } from "../ThemeMemlabBadges"
import { ThemeSectionHeader } from "../ThemeSectionHeader"

const CATEGORY_PILL = "bg-gray-100 text-gray-600"

export function ThemeSection04({
	data,
	isExpanded: _isExpanded = false,
	title,
}: {
	data: ThemeS04
	isExpanded?: boolean
	title: string
}) {
	return (
		<section id="theme-s04" className="scroll-mt-2">
			<ThemeSectionHeader num="04" title={title} />
			<ThemeMemlabBadges sources={data.sources} />

			<p className="text-[14px] text-gray-700 leading-relaxed mb-4">
				{data.intro}
			</p>

			<div className="space-y-2 mb-2">
				{data.issues.map((issue, i) => {
					return (
						<div
							key={i}
							className="bg-white rounded-lg border border-gray-200 px-5 py-4"
						>
							<div className="flex items-start justify-between gap-2 mb-2">
								<p className="text-[14px] font-semibold text-gray-900 leading-snug min-w-0">
									{issue.title}
								</p>
								<span
									className={`font-mono text-[12px] px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${CATEGORY_PILL}`}
								>
									{issue.category}
								</span>
							</div>
							<p className="text-[14px] text-gray-600 leading-relaxed mb-2">
								{issue.desc}
							</p>
							{issue.references?.length > 0 && (
								<div className="flex flex-wrap gap-1.5">
									{issue.references.map((ref, ri) => (
										<a
											key={ri}
											href={ref.url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
										>
											{ref.label}
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
									))}
								</div>
							)}
						</div>
					)
				})}
			</div>
		</section>
	)
}
