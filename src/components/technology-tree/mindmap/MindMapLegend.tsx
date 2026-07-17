import { ChevronDown, ChevronUp, Expand, Plus, Shrink } from "lucide-react"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { getLegendColor } from "@/components/technology-tree/utils/levelColors"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTreeUIStore } from "@/stores/treeUIStore"

const TRL_LEGEND = [
	{ trl: "1–5", label: "基礎研究",   bg: "#feeeee" },
	{ trl: "6–7", label: "実証段階",   bg: "#feffec" },
	{ trl: "8–9", label: "商業化済み", bg: "#f1f7ff" },
]

interface MindMapLegendProps {
	treeMode?: string
	onLevelExpand?: (level: number) => void
	onLevelCollapse?: (level: number) => void
	isLevelExpanded?: (level: number) => boolean
	onAddNode?: () => void
}

const MindMapLegendComponent: React.FC<MindMapLegendProps> = ({
	treeMode,
	onLevelExpand,
	onLevelCollapse,
	isLevelExpanded,
	onAddNode,
}) => {
	const { t } = useTranslation()
	const [isOpen, setIsOpen] = useState(true)
	const trlColorMode = useTreeUIStore((s) => s.trlColorMode)

	const getLegendLabels = () => {
		if (treeMode === "FAST") {
			return [
				{ level: 1, label: t("mindmap.legend.fast.level1") },
				{ level: 2, label: t("mindmap.legend.fast.level2") },
				{ level: 3, label: t("mindmap.legend.fast.level3") },
				{ level: 4, label: t("mindmap.legend.fast.level4") },
				{ level: 5, label: t("mindmap.legend.fast.level5") },
			]
		} else {
			return [
				{ level: 1, label: t("scenario.level_names.scenario") },
				{ level: 2, label: t("scenario.level_names.objective") },
				{ level: 3, label: t("scenario.level_names.function") },
				{ level: 4, label: t("scenario.level_names.means") },
				{ level: 5, label: t("mindmap.legend.ted.level5") },
			]
		}
	}

	const legendItems = getLegendLabels()

	const handleLevelToggle = (level: number) => {
		if (!onLevelExpand || !onLevelCollapse || !isLevelExpanded) return

		if (isLevelExpanded(level)) {
			onLevelCollapse(level)
		} else {
			onLevelExpand(level)
		}
	}

	return (
		treeMode && (
			<div className="z-[50] w-fit">
				<Collapsible open={isOpen} onOpenChange={setIsOpen}>
					<div className="bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
						<CollapsibleTrigger asChild>
							<button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
								<span className="text-xs font-normal text-gray-500 uppercase tracking-wide">
									Legend
								</span>
								{isOpen ? (
									<ChevronUp className="h-3 w-3 text-gray-500" />
								) : (
									<ChevronDown className="h-3 w-3 text-gray-500" />
								)}
							</button>
						</CollapsibleTrigger>

						<CollapsibleContent>
							{trlColorMode ? (
								<div className="px-3 pb-3 pt-0 space-y-1.5 min-w-[160px]">
									{/* Expand/collapse buttons — no dots, no level labels */}
									<TooltipProvider>
										{legendItems.map(({ level, label }) => {
											const levelIsExpanded = isLevelExpanded ? isLevelExpanded(level) : false
											const showToggleButton = onLevelExpand && onLevelCollapse && isLevelExpanded && level > 1
											const showAddButton = treeMode === "FAST" && level === 1 && onAddNode
											if (!showToggleButton && !showAddButton) return null
											return (
												<div key={level} className="flex items-center gap-1.5 text-sm">
													<span className="font-normal text-sm text-gray-500 flex-1">
														{t("mindmap.legend.level_label", { level })}: {label}
													</span>
													{showAddButton && (
														<Tooltip>
															<TooltipTrigger asChild>
																<button onClick={onAddNode}
																	className="p-1 bg-[#EBF3FF] hover:bg-[#D6E6FF] rounded-sm transition-colors flex-shrink-0">
																	<Plus className="h-3 w-3 text-[#4A7DFC]" />
																</button>
															</TooltipTrigger>
															<TooltipContent side="right" className="text-xs">{t("mindmap.legend.add_element")}</TooltipContent>
														</Tooltip>
													)}
													{showToggleButton && (
														<button onClick={() => handleLevelToggle(level)}
															className="p-1 hover:bg-gray-100 rounded-sm transition-colors flex-shrink-0"
															title={levelIsExpanded ? `Collapse Level ${level}` : `Expand Level ${level}`}>
															{levelIsExpanded ? <Shrink className="h-3 w-3 text-gray-500" /> : <Expand className="h-3 w-3 text-gray-500" />}
														</button>
													)}
												</div>
											)
										})}
									</TooltipProvider>

									{/* Divider */}
									<div className="border-t border-gray-100 my-1" />

									{/* TRL color legend */}
									{TRL_LEGEND.map(({ trl, label, bg }) => (
										<div key={trl} className="flex items-center gap-2 text-sm">
											<div
												className="w-3 h-3 rounded-full flex-shrink-0"
												style={{ background: bg, border: "0.5px solid rgba(0,0,0,0.12)" }}
											/>
											<span className="font-normal text-sm text-gray-500 flex-1">
												TRL {trl} · {label}
											</span>
										</div>
									))}
								</div>
							) : (
								<div className="px-3 pb-3 pt-0 space-y-2 min-w-[200px]">
									<TooltipProvider>
										{legendItems.map(({ level, label }) => {
											const { bg, border } = getLegendColor(level)
											const levelIsExpanded = isLevelExpanded
												? isLevelExpanded(level)
												: false
											const showToggleButton =
												onLevelExpand &&
												onLevelCollapse &&
												isLevelExpanded &&
												level > 1
											const showAddButton =
												treeMode === "FAST" && level === 1 && onAddNode

											return (
												<div key={level} className="flex items-center gap-2 text-sm">
													<div
														className={`w-3 h-3 rounded-full ${bg} ${border} flex-shrink-0`}
														style={{ borderWidth: "0.6px" }}
													/>
													<span className="font-normal text-sm text-gray-500 flex-1">
														{t("mindmap.legend.level_label", { level })}: {label}
													</span>
													{showAddButton && (
														<Tooltip>
															<TooltipTrigger asChild>
																<button
																	onClick={onAddNode}
																	className="p-1 bg-[#EBF3FF] hover:bg-[#D6E6FF] rounded-sm transition-colors flex-shrink-0"
																>
																	<Plus className="h-3 w-3 text-[#4A7DFC]" />
																</button>
															</TooltipTrigger>
															<TooltipContent side="right" className="text-xs">
																{t("mindmap.legend.add_element")}
															</TooltipContent>
														</Tooltip>
													)}
													{showToggleButton && (
														<button
															onClick={() => handleLevelToggle(level)}
															className="p-1 hover:bg-gray-100 rounded-sm transition-colors flex-shrink-0"
															title={
																levelIsExpanded
																	? `Collapse Level ${level}`
																	: `Expand Level ${level}`
															}
														>
															{levelIsExpanded ? (
																<Shrink className="h-3 w-3 text-gray-500" />
															) : (
																<Expand className="h-3 w-3 text-gray-500" />
															)}
														</button>
													)}
												</div>
											)
										})}
									</TooltipProvider>
								</div>
							)}
						</CollapsibleContent>
					</div>
				</Collapsible>
			</div>
		)
	)
}

// Memoize the component to prevent unnecessary re-renders
export const MindMapLegend = React.memo(MindMapLegendComponent)
