import type { QueryS02 } from "@/types/query-report"
import { QUERY_PROSE_CLASS } from "../proseClasses"
import { QuerySectionHeader } from "../QuerySectionHeader"
import { QuerySources } from "../QuerySources"
import { useQueryReportLabels } from "../queryReportLabels"

export function QuerySection02({
	data,
	isExpanded = false,
}: {
	data: QueryS02
	isExpanded?: boolean
}) {
	const labels = useQueryReportLabels()
	return (
		<section id="query-s02" className="scroll-mt-2">
			<QuerySectionHeader num="02" title={labels.sections[1].labelFull} />

			{/* Definition block */}
			<div className="bg-blue-50 rounded-lg p-4 mb-5 border border-blue-100">
				<p className="font-mono text-[10px] uppercase tracking-widest text-blue-600 mb-2">
					{labels.section02.definition}
				</p>
				{data.definitionTitle && (
					<p className="text-[15px] font-bold text-gray-900 leading-snug mb-2">
						{data.definitionTitle}
					</p>
				)}
				<div
					className={`${QUERY_PROSE_CLASS}`}
					dangerouslySetInnerHTML={{ __html: data.definition }}
				/>
			</div>

			{/* Advantages */}
			{data.advantages?.length > 0 && (
				<>
					<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
						{labels.section02.advantages}
					</p>
					<div
						className={`grid gap-3 mb-2 ${isExpanded ? "grid-cols-2" : "grid-cols-1"}`}
					>
						{data.advantages.map((adv, i) => (
							<div
								key={i}
								className="bg-white rounded-lg border border-gray-200 px-5 py-4"
							>
								<p className="font-mono text-[11px] font-bold text-blue-600 mb-1.5 tracking-wider">
									{adv.label.replace(/^Strength\s+/i, "")}
								</p>
								<p className="text-[12px] font-bold text-gray-900 mb-1.5 leading-snug">
									{adv.title}
								</p>
								<div
									className={QUERY_PROSE_CLASS}
									dangerouslySetInnerHTML={{ __html: adv.body }}
								/>
								{adv.sourceStrength && (
									<p className="font-mono text-[10px] text-gray-400 mt-2 italic">
										{labels.section02.sourceStrength}
										{adv.sourceStrength}
									</p>
								)}
							</div>
						))}
					</div>
				</>
			)}

			<QuerySources sources={data.sources} />
		</section>
	)
}
