/**
 * Market Structure Indicator
 * Shows market structure (独占/寡占/分散) with tooltip
 */

import { useTranslation } from "react-i18next"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { MarketStructure } from "@/types/scenario"

interface MarketStructureIndicatorProps {
	value: MarketStructure
	reasoning?: string
	className?: string
}

const getStructureInfo = (
	value: MarketStructure,
	t: (key: string) => string,
): { label: string; description: string; color: string; bgColor: string } => {
	switch (value) {
		case "monopoly":
			return {
				label: t("scenario.market_structure.monopoly_label"),
				description: t("scenario.market_structure.monopoly_description"),
				color: "#dc2626",
				bgColor: "#fee2e2",
			}
		case "oligopoly":
			return {
				label: t("scenario.market_structure.oligopoly_label"),
				description: t("scenario.market_structure.oligopoly_description"),
				color: "#ea580c",
				bgColor: "#ffedd5",
			}
		case "fragmented":
			return {
				label: t("scenario.market_structure.fragmented_label"),
				description: t("scenario.market_structure.fragmented_description"),
				color: "#16a34a",
				bgColor: "#dcfce7",
			}
		default:
			return {
				label: t("scenario.market_structure.unknown_label"),
				description: t("scenario.market_structure.unknown_description"),
				color: "#9ca3af",
				bgColor: "#f3f4f6",
			}
	}
}

export const MarketStructureIndicator = ({
	value,
	reasoning,
	className = "",
}: MarketStructureIndicatorProps) => {
	const { t } = useTranslation()
	const { label, description, color, bgColor } = getStructureInfo(value, t)

	return (
		<TooltipProvider>
			<Tooltip delayDuration={200}>
				<TooltipTrigger asChild>
					<span
						className={`inline-flex items-center px-2 py-0.5 rounded text-xs cursor-help ${className}`}
						style={{
							color,
							backgroundColor: bgColor,
							fontWeight: 500,
						}}
					>
						{label}
					</span>
				</TooltipTrigger>
				<TooltipContent
					side="top"
					className="max-w-xs p-3 bg-white border border-gray-200 shadow-lg"
				>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span
								className="inline-flex items-center px-2 py-0.5 rounded text-xs"
								style={{ color, backgroundColor: bgColor, fontWeight: 500 }}
							>
								{label}
							</span>
							<span className="font-medium text-sm text-gray-900">
								{t("scenario.market_structure.title")}
							</span>
						</div>
						<p className="text-xs text-gray-600 leading-relaxed">
							{description}
						</p>
						{reasoning && (
							<div className="pt-1 border-t border-gray-100">
								<p className="text-xs text-gray-500">{reasoning}</p>
							</div>
						)}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
