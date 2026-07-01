/**
 * TAM (Total Addressable Market) Indicator
 * Visual indicator showing market size category with hover tooltip
 */

import { useTranslation } from "react-i18next"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ScenarioMetrics } from "@/types/scenario"

interface TAMIndicatorProps {
	category: ScenarioMetrics["tamCategory"]
	value?: number | null
}

// TAM category interpretations
const getTAMDescription = (
	category: ScenarioMetrics["tamCategory"],
	_value?: number | null,
	t?: (key: string) => string,
): { title: string; description: string; range: string } => {
	const tr = t ?? ((k: string) => k)
	const descriptions: Record<
		string,
		{ title: string; description: string; range: string }
	> = {
		small: {
			title: tr("scenario.tam.small_title"),
			description: tr("scenario.tam.small_description"),
			range: "< $1B",
		},
		medium: {
			title: tr("scenario.tam.medium_title"),
			description: tr("scenario.tam.medium_description"),
			range: "$1B - $10B",
		},
		large: {
			title: tr("scenario.tam.large_title"),
			description: tr("scenario.tam.large_description"),
			range: "$10B - $50B",
		},
		"very-large": {
			title: tr("scenario.tam.very_large_title"),
			description: tr("scenario.tam.very_large_description"),
			range: "> $50B",
		},
	}

	const defaultDesc = {
		title: tr("scenario.tam.unknown_title"),
		description: tr("scenario.tam.unknown_description"),
		range: "N/A",
	}

	return descriptions[category || ""] || defaultDesc
}

const getColorStyle = (category: ScenarioMetrics["tamCategory"]) => {
	switch (category) {
		case "small":
			return { backgroundColor: "#bfdbfe", color: "#1e40af" } // very light blue
		case "medium":
			return { backgroundColor: "#60a5fa", color: "#1e3a8a" } // medium-light blue
		case "large":
			return { backgroundColor: "#3b82f6", color: "#1e3a8a" } // medium blue
		case "very-large":
			return { backgroundColor: "#1e3a8a", color: "#dbeafe" } // very dark blue
		default:
			return { backgroundColor: "#dbeafe", color: "#1e40af" } // very light blue
	}
}

export const TAMIndicator = ({ category, value }: TAMIndicatorProps) => {
	const { t } = useTranslation()
	const { title, description, range } = getTAMDescription(category, value, t)
	const colorStyle = getColorStyle(category)

	return (
		<TooltipProvider>
			<Tooltip delayDuration={200}>
				<TooltipTrigger asChild>
					<div
						className="w-2 h-2 rounded-full cursor-help"
						style={{ backgroundColor: colorStyle.backgroundColor }}
					/>
				</TooltipTrigger>
				<TooltipContent
					side="top"
					className="max-w-xs p-3 bg-white border border-gray-200 shadow-lg"
				>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<div
								className="w-2 h-2 rounded-full"
								style={{ backgroundColor: colorStyle.backgroundColor }}
							/>
							<span className="font-medium text-sm text-gray-900">{title}</span>
						</div>
						<p className="text-xs text-gray-600 leading-relaxed">
							{description}
						</p>
						<div className="pt-1 border-t border-gray-100 flex justify-between items-center">
							<span className="text-xs text-gray-500">
								{t("scenario.tam.range_label")}:{" "}
								<span
									className="font-medium"
									style={{ color: colorStyle.backgroundColor }}
								>
									{range}
								</span>
							</span>
							{value !== null && value !== undefined && (
								<span className="text-xs font-medium text-blue-600">
									${value.toFixed(1)}B
								</span>
							)}
						</div>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
