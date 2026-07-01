/**
 * CAGR (Compound Annual Growth Rate) Indicator
 * Text display with hover tooltip for interpretation
 */

import { useTranslation } from "react-i18next"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

interface CAGRIndicatorProps {
	value: number | null | undefined
	className?: string
	disableTooltip?: boolean
}

// CAGR category interpretations - exported for use in combined hover cards
export const getCAGRDescription = (
	value: number | null | undefined,
	t?: (key: string) => string,
): { title: string; description: string; category: string; color: string } => {
	const tr = t ?? ((k: string) => k)
	if (value === null || value === undefined) {
		return {
			title: tr("scenario.cagr.unknown_title"),
			description: tr("scenario.cagr.unknown_description"),
			category: tr("scenario.cagr.unknown_title"),
			color: "#9ca3af",
		}
	}

	if (value < 5) {
		return {
			title: tr("scenario.cagr.low_title"),
			description: tr("scenario.cagr.low_description"),
			category: tr("scenario.cagr.low_category"),
			color: "#9ca3af",
		}
	}

	if (value < 15) {
		return {
			title: tr("scenario.cagr.medium_title"),
			description: tr("scenario.cagr.medium_description"),
			category: tr("scenario.cagr.medium_category"),
			color: "#60a5fa",
		}
	}

	if (value < 30) {
		return {
			title: tr("scenario.cagr.high_title"),
			description: tr("scenario.cagr.high_description"),
			category: tr("scenario.cagr.high_category"),
			color: "#3b82f6",
		}
	}

	return {
		title: tr("scenario.cagr.very_high_title"),
		description: tr("scenario.cagr.very_high_description"),
		category: tr("scenario.cagr.very_high_category"),
		color: "#1e3a8a",
	}
}

export const CAGRIndicator = ({
	value,
	className = "",
	disableTooltip = false,
}: CAGRIndicatorProps) => {
	const { t } = useTranslation()
	const { title, description, category, color } = getCAGRDescription(value, t)

	const displayValue =
		value !== null && value !== undefined ? `${value}%` : "N/A"

	// When tooltip is disabled (e.g., wrapped by ValueWithRationale), just render the value
	if (disableTooltip) {
		return (
			<span
				className={`text-sm text-gray-900 ${className}`}
				style={{ fontWeight: 400 }}
			>
				{displayValue}
			</span>
		)
	}

	return (
		<TooltipProvider>
			<Tooltip delayDuration={200}>
				<TooltipTrigger asChild>
					<span
						className={`text-sm text-gray-900 cursor-help ${className}`}
						style={{ fontWeight: 400 }}
					>
						{displayValue}
					</span>
				</TooltipTrigger>
				<TooltipContent
					side="top"
					className="max-w-xs p-3 bg-white border border-gray-200 shadow-lg"
				>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<div
								className="w-2 h-2 rounded-full"
								style={{ backgroundColor: color }}
							/>
							<span className="font-medium text-sm text-gray-900">{title}</span>
						</div>
						<p className="text-xs text-gray-600 leading-relaxed">
							{description}
						</p>
						<div className="pt-1 border-t border-gray-100 flex justify-between items-center">
							<span className="text-xs text-gray-500">
								{t("scenario.cagr.category_label")}:{" "}
								<span className="font-medium" style={{ color }}>
									{category}
								</span>
							</span>
							{value !== null && value !== undefined && (
								<span className="text-xs font-medium" style={{ color }}>
									CAGR: {value}%
								</span>
							)}
						</div>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
