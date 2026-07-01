/**
 * Scenario Card Component
 * Individual card displaying scenario information with metrics
 */

import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { Scenario } from "@/types/scenario"
import { DifficultyBadge } from "./DifficultyBadge"
import { TAMIndicator } from "./TAMIndicator"
import { TimeToMarketBadge } from "./TimeToMarketBadge"
import { TRLIndicator } from "./TRLIndicator"

interface ScenarioCardProps {
	scenario: Scenario
	isSelected: boolean
	onToggle: () => void
}

export const ScenarioCard = ({
	scenario,
	isSelected,
	onToggle,
}: ScenarioCardProps) => {
	const { t } = useTranslation()
	return (
		<div className="border border-gray-200 rounded-lg p-4 bg-white hover:border-[#5f98ff] transition-colors">
			<div className="flex items-start gap-3">
				{/* Checkbox */}
				<Checkbox
					checked={isSelected}
					onCheckedChange={onToggle}
					className="mt-1"
				/>

				<div className="flex-1 space-y-3">
					{/* Scenario Name */}
					<h3 className="font-semibold text-base text-gray-900">
						{scenario.name}
					</h3>

					{/* Description */}
					{scenario.description && (
						<p className="text-sm text-gray-600 leading-relaxed">
							{scenario.description}
						</p>
					)}

					{/* Metrics Row */}
					<div className="flex flex-wrap items-center gap-3 text-sm">
						{/* TAM */}
						<div className="flex items-center gap-1.5">
							<span className="text-gray-500">TAM:</span>
							<span className="text-gray-900" style={{ fontWeight: 400 }}>
								${scenario.metrics.tam}B
							</span>
							<TAMIndicator category={scenario.metrics.tamCategory} />
						</div>

						{/* TRL */}
						<div className="flex items-center gap-1.5">
							<span className="text-gray-500">TRL:</span>
							<span className="text-gray-900" style={{ fontWeight: 400 }}>
								{scenario.metrics.trl}
							</span>
							<TRLIndicator level={scenario.metrics.trl} />
						</div>

						{/* Growth */}
						<div className="flex items-center gap-1.5">
							<span className="text-gray-500">
								{t("scenario.card.growth_rate")}:
							</span>
							<span className="text-gray-900" style={{ fontWeight: 400 }}>
								{scenario.metrics.marketGrowthRate}%
							</span>
						</div>

						{/* Difficulty */}
						<DifficultyBadge
							level={scenario.metrics.implementationDifficulty}
						/>

						{/* Time to Market */}
						<TimeToMarketBadge time={scenario.metrics.timeToMarket} />
					</div>

					{/* Technology Tags */}
					{scenario.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{scenario.tags.map((tag) => (
								<Badge key={tag} variant="secondary" className="text-xs">
									{tag}
								</Badge>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
