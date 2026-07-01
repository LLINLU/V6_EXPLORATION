import type { TechnicalCompetitorData } from "@/types/report"
import { CompetitorBlock } from "./CompetitorBlock"

interface TechnicalCompetitorsSectionProps {
	technologies: TechnicalCompetitorData[]
}

export function TechnicalCompetitorsSection({
	technologies,
}: TechnicalCompetitorsSectionProps) {
	return (
		<section id="report-technical-competitors" className="scroll-mt-4">
			<h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
				<span className="text-blue-600">7.</span> 技術競合
			</h2>

			<div className="space-y-4">
				{technologies.map((tech, i) => (
					<CompetitorBlock key={tech.technology_name} data={tech} index={i} />
				))}
			</div>
		</section>
	)
}
