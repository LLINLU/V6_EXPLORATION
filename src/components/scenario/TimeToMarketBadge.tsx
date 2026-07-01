/**
 * Time to Market Badge
 * Badge showing estimated time to market
 */

import type { ScenarioMetrics } from "@/types/scenario"

interface TimeToMarketBadgeProps {
	time: ScenarioMetrics["timeToMarket"]
}

export const TimeToMarketBadge = ({ time }: TimeToMarketBadgeProps) => {
	const getLabel = () => {
		switch (time) {
			case "short":
				return "⏱️ <1yr"
			case "medium":
				return "⏱️ 1-3yr"
			case "long":
				return "⏱️ >3yr"
			default:
				return "⏱️ N/A"
		}
	}

	return (
		<span
			className="px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-700 border border-gray-200"
			style={{ fontWeight: 400 }}
		>
			{getLabel()}
		</span>
	)
}
