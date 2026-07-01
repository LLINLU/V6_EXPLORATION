/**
 * TRL (Technology Readiness Level) Indicator
 * Visual indicator showing technology maturity with hover tooltip
 */

import { useTranslation } from "react-i18next"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

interface TRLIndicatorProps {
	level: number | null
}

// TRL level interpretations - exported for use in TRL modal table
export const getTRLDescription = (
	level: number | null,
	t?: (key: string) => string,
): { title: string; description: string; stage: string } => {
	const tr = t ?? ((k: string) => k)
	if (!level) {
		return {
			title: "TRL Unknown",
			description: tr("scenario.trl.unknown_description"),
			stage: tr("scenario.trl.stage_unknown"),
		}
	}

	const descriptions: Record<
		number,
		{ title: string; description: string; stage: string }
	> = {
		1: {
			title: `TRL 1 - ${tr("scenario.trl.stage_basic_research")}`,
			description: tr("scenario.trl.level_1_description"),
			stage: tr("scenario.trl.stage_basic_research"),
		},
		2: {
			title: `TRL 2 - ${tr("scenario.trl.level_2_title")}`,
			description: tr("scenario.trl.level_2_description"),
			stage: tr("scenario.trl.stage_basic_research"),
		},
		3: {
			title: `TRL 3 - ${tr("scenario.trl.level_3_title")}`,
			description: tr("scenario.trl.level_3_description"),
			stage: tr("scenario.trl.stage_basic_research"),
		},
		4: {
			title: `TRL 4 - ${tr("scenario.trl.level_4_title")}`,
			description: tr("scenario.trl.level_4_description"),
			stage: tr("scenario.trl.stage_applied_research"),
		},
		5: {
			title: `TRL 5 - ${tr("scenario.trl.level_5_title")}`,
			description: tr("scenario.trl.level_5_description"),
			stage: tr("scenario.trl.stage_applied_research"),
		},
		6: {
			title: `TRL 6 - ${tr("scenario.trl.level_6_title")}`,
			description: tr("scenario.trl.level_6_description"),
			stage: tr("scenario.trl.stage_applied_research"),
		},
		7: {
			title: `TRL 7 - ${tr("scenario.trl.level_7_title")}`,
			description: tr("scenario.trl.level_7_description"),
			stage: tr("scenario.trl.stage_development"),
		},
		8: {
			title: `TRL 8 - ${tr("scenario.trl.level_8_title")}`,
			description: tr("scenario.trl.level_8_description"),
			stage: tr("scenario.trl.stage_development"),
		},
		9: {
			title: `TRL 9 - ${tr("scenario.trl.level_9_title")}`,
			description: tr("scenario.trl.level_9_description"),
			stage: tr("scenario.trl.stage_commercialization"),
		},
	}

	return (
		descriptions[level] || {
			title: `TRL ${level}`,
			description: tr("scenario.trl.no_detail"),
			stage:
				level <= 3
					? tr("scenario.trl.stage_basic_research")
					: level <= 6
						? tr("scenario.trl.stage_applied_research")
						: tr("scenario.trl.stage_dev_commercialization"),
		}
	)
}

const getStageColor = (level: number | null): string => {
	if (!level) return "#9ca3af"
	if (level <= 3) return "#93c5fd" // Light blue - Early
	if (level <= 6) return "#60a5fa" // Medium blue - Mid
	return "#3b82f6" // Dark blue - Mature
}

export const TRLIndicator = ({ level }: TRLIndicatorProps) => {
	const { t } = useTranslation()
	const { title, description, stage } = getTRLDescription(level, t)
	const stageColor = getStageColor(level)

	const renderIndicator = () => {
		if (!level || level <= 3) {
			// Early stage - empty circle with light blue border
			return (
				<div
					className="w-4 h-4 rounded-full border-2"
					style={{ borderColor: "#93c5fd" }}
				/>
			)
		}

		if (level <= 6) {
			// Mid stage - half-filled circle with blue
			return (
				<div className="relative w-4 h-4">
					<div
						className="absolute inset-0 rounded-full border-2"
						style={{ borderColor: "#60a5fa" }}
					/>
					<div
						className="absolute inset-y-0 left-0 rounded-l-full"
						style={{ width: "50%", backgroundColor: "#60a5fa" }}
					/>
				</div>
			)
		}

		// Mature stage - filled circle with darker blue
		return (
			<div
				className="w-4 h-4 rounded-full"
				style={{ backgroundColor: "#3b82f6" }}
			/>
		)
	}

	return (
		<TooltipProvider>
			<Tooltip delayDuration={200}>
				<TooltipTrigger asChild>
					<div className="cursor-help">{renderIndicator()}</div>
				</TooltipTrigger>
				<TooltipContent
					side="top"
					className="max-w-xs p-3 bg-white border border-gray-200 shadow-lg"
				>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<div
								className="w-2 h-2 rounded-full"
								style={{ backgroundColor: stageColor }}
							/>
							<span className="font-medium text-sm text-gray-900">{title}</span>
						</div>
						<p className="text-xs text-gray-600 leading-relaxed">
							{description}
						</p>
						<div className="pt-1 border-t border-gray-100">
							<span className="text-xs text-gray-500">
								{t("scenario.trl.stage_label")}:{" "}
								<span className="font-medium" style={{ color: stageColor }}>
									{stage}
								</span>
							</span>
						</div>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
