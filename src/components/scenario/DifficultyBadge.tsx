/**
 * Difficulty Badge
 * Badge showing implementation difficulty level
 */

import type { ScenarioMetrics } from "@/types/scenario"

interface DifficultyBadgeProps {
	level: ScenarioMetrics["implementationDifficulty"]
}

export const DifficultyBadge = ({ level }: DifficultyBadgeProps) => {
	const getColorClass = () => {
		switch (level) {
			case "low":
				return "bg-green-50 text-green-700 border-green-200"
			case "medium":
				return "bg-yellow-50 text-yellow-700 border-yellow-200"
			case "high":
				return "bg-red-50 text-red-700 border-red-200"
			default:
				return "bg-gray-50 text-gray-700 border-gray-200"
		}
	}

	const getLabel = () => {
		if (!level) return "N/A"
		return level.charAt(0).toUpperCase() + level.slice(1)
	}

	return (
		<span
			className={`px-2 py-0.5 rounded-full text-xs border ${getColorClass()}`}
			style={{ fontWeight: 400 }}
		>
			{getLabel()}
		</span>
	)
}
