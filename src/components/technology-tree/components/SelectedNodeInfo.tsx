import { ChevronDown, ChevronUp, Copy } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { getLevelColor } from "@/components/technology-tree/utils/levelColors"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useEnrichedData } from "@/hooks/useEnrichedData"
import { generateInsightsData } from "@/utils/insightsDataGenerator"
import { getLevelNames } from "@/utils/technologyTreeUtils"
import { TrlHistogram } from "./TrlHistogram"

interface SelectedNodeInfoProps {
	title?: string
	description?: string
	level?: number
	mode?: "TED" | "FAST"
	nodeId?: string
	onChatToggle?: () => void
}
export const SelectedNodeInfo = ({
	title,
	description,
	level,
	mode = "TED",
	nodeId,
	onChatToggle,
}: SelectedNodeInfoProps) => {
	const { toast } = useToast()
	const { t } = useTranslation()
	const [isExpanded, setIsExpanded] = useState(true)
	const { trlData } = useEnrichedData(nodeId || null)
	const { statistics: trlStats, hist_data: trlHistData } = trlData

	if (!title && !description) {
		return null
	}

	const handleCopyTitle = async (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!title) return

		try {
			await navigator.clipboard.writeText(title)
			toast({
				title: "Copied to clipboard",
				description: `"${title}" has been copied to your clipboard.`,
			})
		} catch (_err) {
			toast({
				title: "Failed to copy",
				description: "Unable to copy to clipboard. Please try again.",
			})
		}
	}

	// Get the level name based on the level number and mode
	const getLevelName = () => {
		if (!level) return null
		const levelNames = getLevelNames(mode)
		if (mode === "FAST") {
			// For FAST mode, use How1, How2, etc.
			const levelKey = `level${level}` as keyof typeof levelNames
			return levelNames[levelKey]
		} else {
			// For TED mode
			switch (level) {
				case 1:
					return levelNames.level1
				// シナリオ
				case 2:
					return levelNames.level2
				// 目的
				case 3:
					return levelNames.level3
				// 機能
				case 4:
					return levelNames.level4
				// 手段
				default:
					return null
			}
		}
	}
	const levelName = getLevelName()

	// Get dynamic colors based on level
	const getBadgeColors = () => {
		if (!level) return "bg-white border-gray-300 text-gray-600"
		const colors = getLevelColor(level)
		return `${colors.bg} ${colors.border} ${colors.text}`
	}

	// Generate metrics data when we have all required info
	const metricsData =
		nodeId && title && level ? generateInsightsData(nodeId, title, level) : null
	return (
		<TooltipProvider>
			<div className="mx-4 bg-[#f6f6f6] rounded-lg border-0 mb-4 mt-3">
				<div className="px-6 pt-4 pb-4">
					{/* Top row: Level badge and control buttons */}
					<div className="flex items-center justify-between mb-3">
						{/* Level badge on the left */}
						<div className="flex items-center">
							{levelName && (
								<Badge
									variant="outline"
									className={`text-xs px-2 py-1 font-normal whitespace-nowrap ${getBadgeColors()}`}
								>
									{levelName}
								</Badge>
							)}
						</div>

						{/* Control buttons on the right */}
						{title && (
							<div className="flex items-center gap-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-1 border hover-scale hover:bg-gray-200 transition-colors duration-200"
											style={{ backgroundColor: "#f8f8f8" }}
											onClick={handleCopyTitle}
										>
											<Copy className="h-3 w-3" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{t("node_info.copy_title")}</p>
									</TooltipContent>
								</Tooltip>
								{isExpanded ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-1 border hover-scale hover:bg-gray-200 transition-colors duration-200"
												style={{ backgroundColor: "#f8f8f8" }}
												onClick={() => setIsExpanded(!isExpanded)}
											>
												<ChevronUp className="h-3 w-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>{t("node_info.collapse")}</p>
										</TooltipContent>
									</Tooltip>
								) : (
									<HoverCard openDelay={200}>
										<HoverCardTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-1 border hover-scale hover:bg-gray-200 transition-colors duration-200"
												style={{ backgroundColor: "#f8f8f8" }}
												onClick={() => setIsExpanded(!isExpanded)}
											>
												<ChevronDown className="h-3 w-3" />
											</Button>
										</HoverCardTrigger>
										{metricsData && (
											<HoverCardContent
												className="max-w-xs bg-gray-50 border border-gray-200 shadow-lg"
												side="right"
											>
												<div>
													{/* Description */}
													{description && (
														<p className="text-sm text-gray-700 mb-4 leading-relaxed">
															{description}
														</p>
													)}

													{/* Metrics */}
													<div className="flex flex-wrap gap-4 text-xs text-gray-600">
														{/*
							<div>
                              <span>
                                TAM:{" "}
                                <span className="text-blue-600 text-base font-semibold">
                                  {metricsData.tam.currency}
                                  {(metricsData.tam.value / 1000000000).toFixed(
                                    1
                                  )}
                                  B
                                </span>{" "}
                                {metricsData.tam.period}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>
                                CAGR:{" "}
                                <span className="text-blue-600 text-base font-semibold">
                                  {metricsData.cagr.value}%
                                </span>
                              </span>
                              <TrendingUp className="h-3 w-3" />
                              <span>({metricsData.cagr.period})</span>
                            </div>
							*/}
														{trlStats && trlStats.average_trl !== undefined && (
															<div>
																<span>
																	TRL:{" "}
																	<span className="text-blue-600 text-base font-semibold">
																		{trlStats.average_trl.toFixed(1)}/9
																	</span>{" "}
																	{t("node_info.std_dev", {
																		value: trlStats.std_dev.toFixed(2),
																	})}
																</span>
															</div>
														)}
													</div>

													{/* TRL Histogram in hover card */}
													{trlHistData && trlHistData.length > 0 && (
														<div className="mt-3">
															<TrlHistogram
																data={trlHistData}
																className="max-w-xs"
															/>
														</div>
													)}
												</div>
											</HoverCardContent>
										)}
									</HoverCard>
								)}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-1 border hover-scale hover:bg-gray-200 transition-colors duration-200"
											style={{ backgroundColor: "#f8f8f8" }}
											onClick={onChatToggle}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="12"
												height="12"
												fill="#404040"
												viewBox="0 0 256 256"
											>
												<path d="M232.07,186.76a80,80,0,0,0-62.5-114.17A80,80,0,1,0,23.93,138.76l-7.27,24.71a16,16,0,0,0,19.87,19.87l24.71-7.27a80.39,80.39,0,0,0,25.18,7.35,80,80,0,0,0,108.34,40.65l24.71,7.27a16,16,0,0,0,19.87-19.86ZM62,159.5a8.28,8.28,0,0,0-2.26.32L32,168l8.17-27.76a8,8,0,0,0-.63-6,64,64,0,1,1,26.26,26.26A8,8,0,0,0,62,159.5Zm153.79,28.73L224,216l-27.76-8.17a8,8,0,0,0-6,.63,64.05,64.05,0,0,1-85.87-24.88A79.93,79.93,0,0,0,174.7,89.71a64,64,0,0,1,41.75,92.48A8,8,0,0,0,215.82,188.23Z"></path>
											</svg>
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{t("node_info.ask_ai")}</p>
									</TooltipContent>
								</Tooltip>
							</div>
						)}
					</div>

					{/* Title row */}
					{title && (
						<h3 className="text-base font-semibold text-[#181818] leading-[1.3rem] mb-2">
							{title}
						</h3>
					)}

					{isExpanded && (
						<>
							{description && (
								<p className="text-sm text-gray-700 mb-3 mt-2">{description}</p>
							)}

							{/* Metrics Section */}
							{metricsData && (
								<div className="flex flex-wrap gap-4 text-xs text-gray-600">
									{/*
					<div>
						<span>
							TAM:{" "}
							<span className="text-blue-600 text-base font-semibold">
								{metricsData.tam.currency}
								{(metricsData.tam.value / 1000000000).toFixed(1)}B
							</span>{" "}
							{metricsData.tam.period}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<span>
							CAGR:{" "}
							<span className="text-blue-600 text-base font-semibold">
								{metricsData.cagr.value}%
							</span>
						</span>
						<TrendingUp className="h-3 w-3" />
						<span>({metricsData.cagr.period})</span>
					</div>
					*/}
									{trlStats && trlStats.average_trl !== undefined && (
										<div>
											<span>
												TRL:{" "}
												<span className="text-blue-600 text-base font-semibold">
													{trlStats.average_trl.toFixed(1)}/9
												</span>{" "}
												{t("node_info.std_dev", {
													value: trlStats.std_dev.toFixed(2),
												})}
											</span>
										</div>
									)}
								</div>
							)}

							{/* TRL Histogram */}
							{trlHistData && trlHistData.length > 0 && (
								<div className="mt-4">
									<TrlHistogram data={trlHistData} className="max-w-xs" />
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</TooltipProvider>
	)
}
