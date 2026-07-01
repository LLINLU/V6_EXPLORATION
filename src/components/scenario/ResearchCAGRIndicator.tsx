/**
 * Research CAGR Indicator
 * Compact indicator for paper/patent/case growth rates with trend arrows
 */

import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

interface ResearchCAGRIndicatorProps {
	value: number | null | undefined
	label?: string // e.g., "論文", "特許", "事例"
	reasoning?: string
	className?: string
}

const getTrendInfo = (
	value: number | null | undefined,
): { icon: React.ReactNode; color: string; bgColor: string } => {
	if (value === null || value === undefined) {
		return {
			icon: <Minus className="h-3 w-3" />,
			color: "#9ca3af",
			bgColor: "#f3f4f6",
		}
	}

	if (value > 10) {
		// Strong growth
		return {
			icon: <TrendingUp className="h-3 w-3" />,
			color: "#16a34a", // green
			bgColor: "#dcfce7",
		}
	}

	if (value > 0) {
		// Moderate growth
		return {
			icon: <TrendingUp className="h-3 w-3" />,
			color: "#2563eb", // blue
			bgColor: "#dbeafe",
		}
	}

	if (value < -10) {
		// Strong decline
		return {
			icon: <TrendingDown className="h-3 w-3" />,
			color: "#dc2626", // red
			bgColor: "#fee2e2",
		}
	}

	if (value < 0) {
		// Moderate decline
		return {
			icon: <TrendingDown className="h-3 w-3" />,
			color: "#ea580c", // orange
			bgColor: "#ffedd5",
		}
	}

	// Flat (0%)
	return {
		icon: <Minus className="h-3 w-3" />,
		color: "#6b7280",
		bgColor: "#f3f4f6",
	}
}

export const ResearchCAGRIndicator = ({
	value,
	label,
	reasoning,
	className = "",
}: ResearchCAGRIndicatorProps) => {
	const { t } = useTranslation()
	const { icon, color, bgColor } = getTrendInfo(value)

	const displayValue =
		value !== null && value !== undefined
			? `${value > 0 ? "+" : ""}${value}%`
			: "N/A"

	return (
		<TooltipProvider>
			<Tooltip delayDuration={200}>
				<TooltipTrigger asChild>
					<span
						className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-help ${className}`}
						style={{
							color,
							backgroundColor: bgColor,
							fontWeight: 500,
						}}
					>
						{icon}
						{displayValue}
					</span>
				</TooltipTrigger>
				<TooltipContent
					side="top"
					className="max-w-xs p-3 bg-white border border-gray-200 shadow-lg"
				>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span
								className="inline-flex items-center justify-center w-5 h-5 rounded"
								style={{ color, backgroundColor: bgColor }}
							>
								{icon}
							</span>
							<span className="font-medium text-sm text-gray-900">
								{label ? `${label}CAGR` : "CAGR"}: {displayValue}
							</span>
						</div>
						{reasoning && (
							<p className="text-xs text-gray-600 leading-relaxed">
								{reasoning}
							</p>
						)}
						{value !== null && value !== undefined && (
							<div className="pt-1 border-t border-gray-100">
								<span className="text-xs text-gray-500">
									{value > 10
										? t("scenario.research_cagr.strong_growth")
										: value > 0
											? t("scenario.research_cagr.moderate_growth")
											: value < -10
												? t("scenario.research_cagr.strong_decline")
												: value < 0
													? t("scenario.research_cagr.moderate_decline")
													: t("scenario.research_cagr.flat")}
								</span>
							</div>
						)}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
