import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { getLevelBadgeStyle } from "../utils/levelColors"
import { ExpandableNode } from "./ExpandableNode"

interface LevelItem {
	id: string
	name: string
	info?: string
	isCustom?: boolean
	description?: string
	children_count?: number
}

interface NestedLevelGroupProps {
	items: LevelItem[]
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
	scenarioId: string
	currentLevel: number
	levelKey: string
	nextLevelItems: Record<string, LevelItem[]>
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
	onNodeClick: (level: string, nodeId: string) => void
	onEditNode?: (
		level: string,
		nodeId: string,
		updatedNode: {
			title: string
			description: string
		},
	) => void
	onDeleteNode?: (level: string, nodeId: string) => void
	isLevelExpanded: (levelKey: string) => boolean
	toggleLevelExpansion: (levelKey: string) => void
	level2Layout?: "vertical" | "horizontal"
	onToggleLevel2Layout?: () => void
}

export const NestedLevelGroup: React.FC<NestedLevelGroupProps> = ({
	items,
	selectedPath,
	scenarioId,
	currentLevel,
	levelKey,
	nextLevelItems,
	allLevelItems,
	levelNames = {
		level1: "シナリオ",
		level2: "目的",
		level3: "機能",
		level4: "手段",
	},
	onNodeClick,
	onEditNode,
	onDeleteNode,
	isLevelExpanded,
	toggleLevelExpansion,
	level2Layout = "vertical",
	onToggleLevel2Layout,
}) => {
	const levelNames2 = {
		2: "level2",
		3: "level3",
		4: "level4",
		5: "level5",
		6: "level6",
		7: "level7",
		8: "level8",
		9: "level9",
		10: "level10",
	} as const

	const getLevelLabel = (level: number): string => {
		switch (level) {
			case 2:
				return `レベル2:${levelNames.level2}`
			case 3:
				return `レベル3:${levelNames.level3}`
			case 4:
				return `レベル4:${levelNames.level4}`
			case 5:
				return `レベル5:${levelNames.level5 || "手段"}`
			case 6:
				return `レベル6:${levelNames.level6 || "技術"}`
			case 7:
				return `レベル7:${levelNames.level7 || "実装"}`
			case 8:
				return `レベル8:${levelNames.level8 || "詳細"}`
			case 9:
				return `レベル9:${levelNames.level9 || "具体"}`
			case 10:
				return `レベル10:${levelNames.level10 || "最終"}`
			default:
				return `レベル${level}`
		}
	}

	const getLevelItems = (level: number): Record<string, LevelItem[]> => {
		switch (level) {
			case 3:
				return allLevelItems.level3Items
			case 4:
				return allLevelItems.level4Items
			case 5:
				return allLevelItems.level5Items
			case 6:
				return allLevelItems.level6Items
			case 7:
				return allLevelItems.level7Items
			case 8:
				return allLevelItems.level8Items
			case 9:
				return allLevelItems.level9Items
			case 10:
				return allLevelItems.level10Items
			default:
				return {}
		}
	}

	// Enhanced children detection function
	const hasChildrenForNode = (item: LevelItem): boolean => {
		// Check if the node has children in the current nextLevelItems
		const directChildren = nextLevelItems[item.id]?.length > 0

		// For level 3 nodes, also check if they have level 4 children in allLevelItems
		if (currentLevel === 3) {
			const level4Children = allLevelItems.level4Items[item.id]?.length > 0
			return directChildren || level4Children
		}

		// For other levels, check the appropriate level items
		if (currentLevel < 10) {
			const nextLevelItemsMap = getLevelItems(currentLevel + 1)
			const nextLevelChildren = nextLevelItemsMap[item.id]?.length > 0
			return directChildren || nextLevelChildren
		}
		return directChildren
	}

	// Enhanced selection validation function
	const isNodeSelected = (item: LevelItem): boolean => {
		const currentLevelKey =
			levelNames2[currentLevel as keyof typeof levelNames2]
		const currentLevelSelection = currentLevelKey
			? selectedPath[currentLevelKey as keyof typeof selectedPath]
			: undefined

		// First check if this node is selected at the current level
		if (currentLevelSelection !== item.id) {
			return false
		}

		// Then validate that the full path is valid by checking parent selections
		// For level 2, must have valid level 1 selection (scenarioId)
		if (currentLevel === 2) {
			return selectedPath.level1 === scenarioId
		}

		// For level 3, must have valid level 1 and level 2 selections
		if (currentLevel === 3) {
			if (selectedPath.level1 !== scenarioId || !selectedPath.level2) {
				return false
			}
			// Check if this level 3 item exists under the selected level 2 item
			const level2Items = allLevelItems.level3Items[selectedPath.level2] || []
			return level2Items.some((l3Item) => l3Item.id === item.id)
		}

		// For level 4, must have valid level 1, 2, and 3 selections
		if (currentLevel === 4) {
			if (
				selectedPath.level1 !== scenarioId ||
				!selectedPath.level2 ||
				!selectedPath.level3
			) {
				return false
			}
			// Check if this level 4 item exists under the selected level 3 item
			const level3Items = allLevelItems.level4Items[selectedPath.level3] || []
			return level3Items.some((l4Item) => l4Item.id === item.id)
		}

		// For higher levels, follow the same pattern
		if (currentLevel >= 5) {
			// Validate all parent levels are selected
			const requiredLevels = ["level1", "level2", "level3", "level4"]
			for (let i = 5; i < currentLevel; i++) {
				requiredLevels.push(`level${i}` as keyof typeof selectedPath)
			}
			for (const level of requiredLevels) {
				if (!selectedPath[level as keyof typeof selectedPath]) {
					return false
				}
			}

			// Check if this item exists under the selected parent
			const parentLevel = currentLevel - 1
			const parentKey = `level${parentLevel}` as keyof typeof selectedPath
			const parentId = selectedPath[parentKey]
			if (!parentId) return false
			const parentLevelItems = getLevelItems(currentLevel)
			const currentLevelItems = parentLevelItems[parentId] || []
			return currentLevelItems.some((item_check) => item_check.id === item.id)
		}
		return false
	}

	// Helper function to find the level 2 parent of a level 3 node
	const findLevel2Parent = (level3NodeId: string): string | null => {
		for (const [level2Id, level3Items] of Object.entries(
			allLevelItems.level3Items,
		)) {
			if (level3Items.some((item) => item.id === level3NodeId)) {
				return level2Id
			}
		}
		return null
	}

	// Helper function to find the level 2 and level 3 parents of a level 4 node
	const findLevel3And2Parents = (
		level4NodeId: string,
	): {
		level2Parent: string | null
		level3Parent: string | null
	} => {
		for (const [level3Id, level4Items] of Object.entries(
			allLevelItems.level4Items,
		)) {
			if (level4Items.some((item) => item.id === level4NodeId)) {
				// Found the level 3 parent, now find its level 2 parent
				const level2Parent = findLevel2Parent(level3Id)
				return {
					level2Parent,
					level3Parent: level3Id,
				}
			}
		}
		return {
			level2Parent: null,
			level3Parent: null,
		}
	}

	const renderNode = (item: LevelItem) => {
		const hasChildren = hasChildrenForNode(item)
		const childLevelKey = `${levelKey}-${item.id}`
		const isSelected = isNodeSelected(item)
		const isExpanded = isLevelExpanded(childLevelKey)

		// Debug logging for selection state
		// console.log(
		// `[NESTED_LEVEL] Level ${currentLevel} node ${item.id} (${item.name}): isSelected=${isSelected}, selectedPath=${JSON.stringify(selectedPath)}`,
		// )

		const handleEditClick = (e: React.MouseEvent) => {
			e.stopPropagation()
			if (onEditNode) {
				onEditNode(
					levelNames2[currentLevel as keyof typeof levelNames2],
					item.id,
					{
						title: item.name,
						description: item.description || "",
					},
				)
			}
		}

		const handleDeleteClick = (e: React.MouseEvent) => {
			e.stopPropagation()
			if (onDeleteNode) {
				onDeleteNode(
					levelNames2[currentLevel as keyof typeof levelNames2],
					item.id,
				)
			}
		}

		// Get the correct children for rendering
		let childrenToRender: LevelItem[] = []
		let nextLevelItemsForChildren: Record<string, LevelItem[]> = {}
		if (hasChildren && isExpanded) {
			// First try to get children from nextLevelItems
			childrenToRender = nextLevelItems[item.id] || []

			// If no direct children but we're at level 3, get from level4Items
			if (childrenToRender.length === 0 && currentLevel === 3) {
				childrenToRender = allLevelItems.level4Items[item.id] || []
				nextLevelItemsForChildren = getLevelItems(5) // level 5 items for level 4 children
			} else {
				nextLevelItemsForChildren = getLevelItems(currentLevel + 2) // next level items for children
			}
		}

		return (
			<ExpandableNode
				key={item.id}
				item={item}
				isSelected={isSelected}
				isExpanded={isExpanded}
				hasChildren={hasChildren}
				onToggleExpansion={() => toggleLevelExpansion(childLevelKey)}
				onNodeClick={() => {
					// When clicking a node in the card view, we need to ensure the full parent path is selected
					// Build the complete path from the scenario down to this node
					const currentLevelName =
						levelNames2[currentLevel as keyof typeof levelNames2]
					// console.log(
					// `[CARD_CLICK] Clicking ${currentLevelName} node ${item.id} in scenario ${scenarioId}`,
					// )
					// console.log(`[CARD_CLICK] Current selectedPath:`, selectedPath)

					// For levels 2-4, use custom path selection to bypass auto-selection entirely
					// This prevents the "blink" issue where the correct selection shows briefly then gets overridden
					if (currentLevel === 2) {
						// Level 2: set complete path with level1 and level2
						// console.log(
						// `[CARD_CLICK] Setting custom path for level 2: ${scenarioId} -> ${item.id}`,
						// )
						const completePathEvent = new CustomEvent("set-complete-path", {
							detail: {
								level1: scenarioId,
								level2: item.id,
								level3: "",
								level4: "",
								level5: "",
								level6: "",
								level7: "",
								level8: "",
								level9: "",
								level10: "",
								nodeId: item.id,
								// Pass the clicked node ID for enrichment
								level: "level2", // Pass the level for enrichment
							},
						})
						document.dispatchEvent(completePathEvent)
						return // Important: return early to prevent normal click handler
					} else if (currentLevel === 3) {
						// Level 3: find level2 parent and set complete path
						const level2Parent = findLevel2Parent(item.id)
						if (level2Parent) {
							// console.log(
							// `[CARD_CLICK] Setting custom path for level 3: ${scenarioId} -> ${level2Parent} -> ${item.id}`,
							// )
							const completePathEvent = new CustomEvent("set-complete-path", {
								detail: {
									level1: scenarioId,
									level2: level2Parent,
									level3: item.id,
									level4: "",
									level5: "",
									level6: "",
									level7: "",
									level8: "",
									level9: "",
									level10: "",
									nodeId: item.id,
									// Pass the clicked node ID for enrichment
									level: "level3", // Pass the level for enrichment
								},
							})
							document.dispatchEvent(completePathEvent)
							return // Important: return early to prevent normal click handler
						}
					} else if (currentLevel === 4) {
						// Level 4: find parents and set complete path
						const { level2Parent, level3Parent } = findLevel3And2Parents(
							item.id,
						)
						if (level2Parent && level3Parent) {
							// console.log(
							// `[CARD_CLICK] Setting custom path for level 4: ${scenarioId} -> ${level2Parent} -> ${level3Parent} -> ${item.id}`,
							// )
							const completePathEvent = new CustomEvent("set-complete-path", {
								detail: {
									level1: scenarioId,
									level2: level2Parent,
									level3: level3Parent,
									level4: item.id,
									level5: "",
									level6: "",
									level7: "",
									level8: "",
									level9: "",
									level10: "",
									nodeId: item.id,
									// Pass the clicked node ID for enrichment
									level: "level4", // Pass the level for enrichment
								},
							})
							document.dispatchEvent(completePathEvent)
							return // Important: return early to prevent normal click handler
						}
					}

					// For level 1 or other levels, or if parent lookup failed, use normal click
					// console.log(
					// `[CARD_CLICK] Using normal click for ${currentLevelName}: ${item.id}`,
					// )
					onNodeClick(currentLevelName, item.id)
				}}
				onEditClick={handleEditClick}
				onDeleteClick={handleDeleteClick}
				level={currentLevel}
			>
				{hasChildren && isExpanded && childrenToRender.length > 0 && (
					<NestedLevelGroup
						items={childrenToRender}
						selectedPath={selectedPath}
						scenarioId={scenarioId}
						currentLevel={currentLevel + 1}
						levelKey={childLevelKey}
						nextLevelItems={nextLevelItemsForChildren}
						allLevelItems={allLevelItems}
						levelNames={levelNames}
						onNodeClick={onNodeClick}
						onEditNode={onEditNode}
						onDeleteNode={onDeleteNode}
						isLevelExpanded={isLevelExpanded}
						toggleLevelExpansion={toggleLevelExpansion}
					/>
				)}
			</ExpandableNode>
		)
	}

	// Determine the container classes for nodes only
	const getNodesContainerClasses = () => {
		if (currentLevel === 2 && level2Layout === "horizontal") {
			return "flex flex-nowrap gap-2 overflow-x-auto"
		}
		return "space-y-2"
	}

	// For Level 2 nodes in horizontal layout, add width constraints
	const getNodeWrapperClasses = () => {
		if (currentLevel === 2 && level2Layout === "horizontal") {
			return "min-w-[200px] max-w-[280px] flex-shrink-0"
		}
		return ""
	}

	return (
		<div>
			{/* Fixed header - wrapped in alignment container to match Level 1 structure */}
			<div className="flex items-center gap-2">
				{/* Add spacing div to match Level 1's chevron button space */}
				<div className="w-7"></div>

				{/* Main content wrapper to match Level 1's flex-1 structure */}
				<div className="flex-1">
					<div className="mb-3 flex items-center gap-2">
						<Badge
							variant="outline"
							className={`text-xs border-0 ${getLevelBadgeStyle(currentLevel)}`}
						>
							{getLevelLabel(currentLevel)}
						</Badge>
						{/* Add layout toggle button for Level 2 only */}
						{currentLevel === 2 && onToggleLevel2Layout && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="sm"
											onClick={onToggleLevel2Layout}
											className="h-6 w-6 p-0 rounded-full border-0 bg-[#f4f7fe] hover:bg-[#e8f0ff] transition-colors duration-200"
										>
											{level2Layout === "horizontal" ? (
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="16"
													height="16"
													fill="currentColor"
													viewBox="0 0 256 256"
													className="h-3 w-3 text-gray-600"
												>
													<path d="M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128ZM100.24,52.24,122,30.49V96a6,6,0,0,0,12,0V30.49l21.76,21.75a6,6,0,0,0,8.48-8.48l-32-32a6,6,0,0,0-8.48,0l-32,32a6,6,0,0,0,8.48,8.48Zm55.52,151.52L134,225.51V160a6,6,0,0,0-12,0v65.51l-21.76-21.75a6,6,0,0,0-8.48,8.48l32,32a6,6,0,0,0,8.48,0l32-32a6,6,0,0,0-8.48-8.48Z"></path>
												</svg>
											) : (
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="16"
													height="16"
													fill="currentColor"
													viewBox="0 0 256 256"
													className="h-3 w-3 text-gray-600"
												>
													<path d="M134,40V216a6,6,0,0,1-12,0V40a6,6,0,0,1,12,0ZM96,122H30.49l21.75-21.76a6,6,0,0,0-8.48-8.48l-32,32a6,6,0,0,0,0,8.48l32,32a6,6,0,0,0,8.48-8.48L30.49,134H96a6,6,0,0,0,0-12Zm148.24,1.76-32-32a6,6,0,0,0-8.48,8.48L225.51,122H160a6,6,0,0,0,0,12h65.51l-21.75,21.76a6,6,0,1,0,8.48,8.48l32-32A6,6,0,0,0,244.24,123.76Z"></path>
												</svg>
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>
											{level2Layout === "horizontal"
												? "縦表示に切り替え"
												: "横表示に切り替え"}
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
				</div>
			</div>

			{/* Nodes container - applies layout-specific styling */}
			<div className={getNodesContainerClasses()}>
				{items.map((item) => (
					<div key={item.id} className={getNodeWrapperClasses()}>
						{renderNode(item)}
					</div>
				))}
			</div>
		</div>
	)
}
