import { ChevronDown, ChevronRight, Maximize, Minimize } from "lucide-react"
import type React from "react"
import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { TreeNode } from "../level-selection/TreeNode"
import { getLevelBadgeStyle } from "../utils/levelColors"
import { NestedLevelGroup } from "./NestedLevelGroup"

interface LevelItem {
	id: string
	name: string
	info?: string
	isCustom?: boolean
	description?: string
	children_count?: number
}

interface ScenarioCardProps {
	scenario: LevelItem
	selectedPath: {
		level1: string
		level2: string
		level3: string
		level4?: string
		level5?: string
		level6?: string
		level7?: string
		level8?: string
		level9?: string
		level10?: string
	}
	level2Items: LevelItem[]
	allLevelItems: {
		level3Items: Record<string, LevelItem[]>
		level4Items: Record<string, LevelItem[]>
		level5Items: Record<string, LevelItem[]>
		level6Items: Record<string, LevelItem[]>
		level7Items: Record<string, LevelItem[]>
		level8Items: Record<string, LevelItem[]>
		level9Items: Record<string, LevelItem[]>
		level10Items: Record<string, LevelItem[]>
	}
	levelNames?: {
		level1: string
		level2: string
		level3: string
		level4: string
		level5?: string
		level6?: string
		level7?: string
		level8?: string
		level9?: string
		level10?: string
	}
	isExpanded: boolean
	isLevelExpanded: (levelKey: string) => boolean
	onToggleExpansion: () => void
	onToggleLevelExpansion: (levelKey: string) => void
	onExpandAll: () => void
	onCollapseAll: () => void
	onNodeClick: (level: string, nodeId: string) => void
	onEditNode?: (
		level: string,
		nodeId: string,
		updatedNode: { title: string; description: string },
	) => void
	onDeleteNode?: (level: string, nodeId: string) => void
	shouldTakeFullWidth?: boolean
	level2Layout: "vertical" | "horizontal"
	onToggleLevel2Layout: () => void
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
	scenario,
	selectedPath,
	level2Items,
	allLevelItems,
	levelNames = {
		level1: "シナリオ",
		level2: "目的",
		level3: "機能",
		level4: "手段",
	},
	isExpanded,
	isLevelExpanded,
	onToggleExpansion,
	onToggleLevelExpansion,
	onExpandAll,
	onCollapseAll,
	onNodeClick,
	onEditNode,
	onDeleteNode,
	shouldTakeFullWidth = false,
	level2Layout,
	onToggleLevel2Layout,
}) => {
	const isSelected = selectedPath.level1 === scenario.id
	const hasChildren = level2Items.length > 0

	// Debug logging for selection state
	useEffect(() => {
		// console.log(
		// `[SCENARIO_CARD] ${scenario.id} (${scenario.name}): isSelected=${isSelected}, selectedPath.level1=${selectedPath.level1}`,
		// )
	}, [])

	const handleScenarioClick = () => {
		// console.log(
		// `[SCENARIO_CLICK] Clicking scenario ${scenario.id} (${scenario.name})`,
		// )

		// Use custom event for level 1 as well to ensure consistency
		const completePathEvent = new CustomEvent("set-complete-path", {
			detail: {
				level1: scenario.id,
				level2: "",
				level3: "",
				level4: "",
				level5: "",
				level6: "",
				level7: "",
				level8: "",
				level9: "",
				level10: "",
				nodeId: scenario.id, // Pass the clicked node ID for enrichment
				level: "level1", // Pass the level for enrichment
			},
		})
		document.dispatchEvent(completePathEvent)
	}

	const handleEditClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (onEditNode) {
			onEditNode("level1", scenario.id, {
				title: scenario.name,
				description: scenario.description || "",
			})
		}
	}

	const handleDeleteClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (onDeleteNode) {
			onDeleteNode("level1", scenario.id)
		}
	}

	const handleAddClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		// TODO: Implement add functionality for scenario card
	}

	const handleAiAssistClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		// TODO: Implement AI assist functionality for scenario card
	}

	return (
		<Card
			className={`w-full relative ${
				shouldTakeFullWidth ? "col-span-full" : ""
			}`}
		>
			<CardHeader className="pb-3">
				{/* Top row: Expand/Collapse button positioned at top-right */}
				{hasChildren && (
					<div className="absolute top-4 right-4 z-10">
						<TooltipProvider delayDuration={200} skipDelayDuration={100}>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										onClick={isExpanded ? onCollapseAll : onExpandAll}
										className="h-8 w-8 p-0"
									>
										{isExpanded ? (
											<Minimize className="h-4 w-4" />
										) : (
											<Maximize className="h-4 w-4" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>すべて展開</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}

				{/* Main content row */}
				<div className="flex items-center gap-2">
					{hasChildren && (
						<button
							onClick={onToggleExpansion}
							className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
						>
							{isExpanded ? (
								<ChevronDown className="h-5 w-5 text-gray-600" />
							) : (
								<ChevronRight className="h-5 w-5 text-gray-600" />
							)}
						</button>
					)}
					<div className="flex-1">
						<div className="mb-2">
							<Badge
								variant="outline"
								className={`text-xs border-0 ${getLevelBadgeStyle(1)}`}
							>
								レベル1:{levelNames.level1}
							</Badge>
						</div>
						<TreeNode
							item={scenario}
							isSelected={isSelected}
							onClick={handleScenarioClick}
							onEditClick={handleEditClick}
							onDeleteClick={handleDeleteClick}
							onAddClick={handleAddClick}
							onAiAssistClick={handleAiAssistClick}
							level={1}
							showDescription={true}
						/>
					</div>
				</div>
			</CardHeader>

			{isExpanded && hasChildren && (
				<CardContent className="pt-0">
					<NestedLevelGroup
						items={level2Items}
						selectedPath={selectedPath}
						scenarioId={scenario.id}
						currentLevel={2}
						levelKey={scenario.id}
						nextLevelItems={allLevelItems.level3Items}
						allLevelItems={allLevelItems}
						levelNames={levelNames}
						onNodeClick={onNodeClick}
						onEditNode={onEditNode}
						onDeleteNode={onDeleteNode}
						isLevelExpanded={isLevelExpanded}
						toggleLevelExpansion={onToggleLevelExpansion}
						level2Layout={level2Layout}
						onToggleLevel2Layout={onToggleLevel2Layout}
					/>
				</CardContent>
			)}
		</Card>
	)
}
