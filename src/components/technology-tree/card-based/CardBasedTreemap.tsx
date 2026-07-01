import type React from "react"
import { useEffect, useState } from "react"
import { Breadcrumb } from "../Breadcrumb"
import { CardContainer } from "./CardContainer"
import { useCardExpansion } from "./hooks/useCardExpansion"
import { LayoutToggle } from "./LayoutToggle"

interface LevelItem {
	id: string
	name: string
	info?: string
	isCustom?: boolean
	description?: string
	children_count?: number
}

interface CardBasedTreemapProps {
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
	level1Items: LevelItem[]
	level2Items: Record<string, LevelItem[]>
	level3Items: Record<string, LevelItem[]>
	level4Items: Record<string, LevelItem[]>
	level5Items?: Record<string, LevelItem[]>
	level6Items?: Record<string, LevelItem[]>
	level7Items?: Record<string, LevelItem[]>
	level8Items?: Record<string, LevelItem[]>
	level9Items?: Record<string, LevelItem[]>
	level10Items?: Record<string, LevelItem[]>
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
	// Add scenario props
	searchTheme?: string
	treeMode?: "TED" | "FAST"
	onAddScenario?: (context: string) => Promise<void>
}

type CardLayoutMode = "one-per-row" | "two-per-row" | "three-per-row"

export const CardBasedTreemap: React.FC<CardBasedTreemapProps> = ({
	selectedPath,
	level1Items,
	level2Items,
	level3Items,
	level4Items,
	level5Items = {},
	level6Items = {},
	level7Items = {},
	level8Items = {},
	level9Items = {},
	level10Items = {},
	levelNames = {
		level1: "シナリオ",
		level2: "目的",
		level3: "機能",
		level4: "手段",
	},
	onNodeClick,
	onEditNode,
	onDeleteNode,
	searchTheme,
	treeMode,
	onAddScenario,
}) => {
	const [cardLayout, setCardLayout] = useState<CardLayoutMode>("three-per-row")

	// Add state to track Level 2 layout preferences per scenario
	const [level2LayoutPreferences, setLevel2LayoutPreferences] = useState<
		Record<string, "vertical" | "horizontal">
	>({})

	// Add state to track reordered items
	const [reorderedItems, setReorderedItems] = useState<LevelItem[]>([])

	// Update reordered items when level1Items prop changes
	useEffect(() => {
		setReorderedItems(level1Items || [])
	}, [level1Items])

	// Function to toggle Level 2 layout for a specific scenario
	const toggleLevel2Layout = (scenarioId: string) => {
		setLevel2LayoutPreferences((prev) => ({
			...prev,
			[scenarioId]:
				prev[scenarioId] === "horizontal" ? "vertical" : "horizontal",
		}))
	}

	// Function to get Level 2 layout for a specific scenario
	const getLevel2Layout = (scenarioId: string): "vertical" | "horizontal" => {
		return level2LayoutPreferences[scenarioId] || "vertical"
	}

	// Calculate total node count across all levels
	const calculateTotalNodeCount = () => {
		const countItemsInRecord = (
			items: Record<string, LevelItem[]> | undefined,
		) => {
			if (!items) return 0
			return Object.values(items).reduce(
				(total, itemArray) => total + itemArray.length,
				0,
			)
		}

		return (
			(reorderedItems?.length || 0) +
			countItemsInRecord(level2Items) +
			countItemsInRecord(level3Items) +
			countItemsInRecord(level4Items) +
			countItemsInRecord(level5Items) +
			countItemsInRecord(level6Items) +
			countItemsInRecord(level7Items) +
			countItemsInRecord(level8Items) +
			countItemsInRecord(level9Items) +
			countItemsInRecord(level10Items)
		)
	}

	const scenarioCount = reorderedItems?.length || 0
	const totalNodeCount = calculateTotalNodeCount()

	// Debug logging for selectedPath changes
	useEffect(() => {
		// console.log("[CARD_VIEW] selectedPath changed:", selectedPath)
	}, [])

	const {
		toggleScenarioExpansion,
		toggleLevelExpansion,
		expandAll,
		collapseAll,
		isScenarioExpanded,
		isLevelExpanded,
		expandScenario,
		expandLevel,
	} = useCardExpansion()

	// Add event listeners for queue navigation expansion
	useEffect(() => {
		const handleExpandScenario = (event: CustomEvent) => {
			const { scenarioId } = event.detail
			// console.log(
			// "[CARD_EXPANSION] Expanding scenario from queue navigation:",
			// scenarioId,
			// )
			expandScenario(scenarioId)
		}

		const handleExpandLevel = (event: CustomEvent) => {
			const { scenarioId, levelKey } = event.detail
			// console.log("[CARD_EXPANSION] Expanding level from queue navigation:", {
			// scenarioId,
			// levelKey,
			// })
			expandLevel(scenarioId, levelKey)
		}

		document.addEventListener(
			"expand-scenario-card",
			handleExpandScenario as EventListener,
		)
		document.addEventListener(
			"expand-level-card",
			handleExpandLevel as EventListener,
		)

		return () => {
			document.removeEventListener(
				"expand-scenario-card",
				handleExpandScenario as EventListener,
			)
			document.removeEventListener(
				"expand-level-card",
				handleExpandLevel as EventListener,
			)
		}
	}, [expandScenario, expandLevel])

	// Handle card reordering
	const handleCardReorder = (newOrder: LevelItem[]) => {
		// console.log("[CARD_REORDER] New card order:", newOrder)
		setReorderedItems(newOrder)
	}

	const allLevelItems = {
		level3Items,
		level4Items,
		level5Items,
		level6Items,
		level7Items,
		level8Items,
		level9Items,
		level10Items,
	}

	const getAllLevelKeys = (scenarioId: string): string[] => {
		const keys: string[] = []
		const addKeysRecursively = (
			items: LevelItem[],
			prefix: string,
			level: number,
		) => {
			items.forEach((item) => {
				const key = `${prefix}-${item.id}`
				keys.push(key)
				const nextLevelItems =
					level === 2
						? level3Items[item.id]
						: level === 3
							? level4Items[item.id]
							: level === 4
								? level5Items[item.id]
								: level === 5
									? level6Items[item.id]
									: level === 6
										? level7Items[item.id]
										: level === 7
											? level8Items[item.id]
											: level === 8
												? level9Items[item.id]
												: level === 9
													? level10Items[item.id]
													: []
				if (nextLevelItems?.length > 0) {
					addKeysRecursively(nextLevelItems, key, level + 1)
				}
			})
		}
		const scenarioLevel2Items = level2Items[scenarioId] || []
		addKeysRecursively(scenarioLevel2Items, scenarioId, 2)
		return keys
	}

	return (
		<div className="h-full flex flex-col">
			{/* Fixed Layout Toggle at top */}
			<div className="flex-shrink-0 p-4 pb-0 py-0">
				<LayoutToggle
					cardLayout={cardLayout}
					onLayoutChange={setCardLayout}
					scenarioCount={scenarioCount}
					totalNodeCount={totalNodeCount}
				/>

				{/* Breadcrumb below the layout toggle */}
				<Breadcrumb
					selectedPath={selectedPath}
					level1Items={level1Items}
					level2Items={level2Items}
					level3Items={level3Items}
					level4Items={level4Items}
					level5Items={level5Items}
					level6Items={level6Items}
					level7Items={level7Items}
					level8Items={level8Items}
					level9Items={level9Items}
					level10Items={level10Items}
				/>
			</div>

			{/* Scrollable Cards Container */}
			<div className="flex-1 min-h-0 treemap-scroll-container overflow-y-auto overflow-x-hidden">
				<div className="p-4 pt-2">
					<CardContainer
						key={
							selectedPath
								? `${selectedPath.level1}-${selectedPath.level2}-${selectedPath.level3}-${selectedPath.level4}`
								: "default-key"
						}
						cardLayout={cardLayout}
						level1Items={reorderedItems || []}
						selectedPath={selectedPath}
						level2Items={level2Items}
						allLevelItems={allLevelItems}
						levelNames={levelNames}
						isScenarioExpanded={isScenarioExpanded}
						isLevelExpanded={isLevelExpanded}
						toggleScenarioExpansion={toggleScenarioExpansion}
						toggleLevelExpansion={toggleLevelExpansion}
						expandAll={expandAll}
						collapseAll={collapseAll}
						getAllLevelKeys={getAllLevelKeys}
						onNodeClick={onNodeClick}
						onEditNode={onEditNode}
						onDeleteNode={onDeleteNode}
						onCardReorder={handleCardReorder}
						level2LayoutPreferences={level2LayoutPreferences}
						onToggleLevel2Layout={toggleLevel2Layout}
						getLevel2Layout={getLevel2Layout}
						searchTheme={searchTheme}
						treeMode={treeMode}
						onAddScenario={onAddScenario}
					/>
				</div>
			</div>
		</div>
	)
}
