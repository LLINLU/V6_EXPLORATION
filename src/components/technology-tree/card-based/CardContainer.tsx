import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import type React from "react"
import { AddScenarioModal } from "./AddScenarioModal"
import { DraggableCard } from "./DraggableCard"

interface LevelItem {
	id: string
	name: string
	info?: string
	isCustom?: boolean
	description?: string
	children_count?: number
}

type CardLayoutMode = "one-per-row" | "two-per-row" | "three-per-row"

interface CardContainerProps {
	cardLayout: CardLayoutMode
	level1Items: LevelItem[]
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
	level2Items: Record<string, LevelItem[]>
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
	levelNames: {
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
	isScenarioExpanded: (scenarioId: string) => boolean
	isLevelExpanded: (scenarioId: string, levelKey: string) => boolean
	toggleScenarioExpansion: (scenarioId: string) => void
	toggleLevelExpansion: (scenarioId: string, levelKey: string) => void
	expandAll: (scenarioId: string, levelKeys: string[]) => void
	collapseAll: (scenarioId: string) => void
	getAllLevelKeys: (scenarioId: string) => string[]
	onNodeClick: (level: string, nodeId: string) => void
	onEditNode?: (
		level: string,
		nodeId: string,
		updatedNode: { title: string; description: string },
	) => void
	onDeleteNode?: (level: string, nodeId: string) => void
	onCardReorder?: (newOrder: LevelItem[]) => void
	level2LayoutPreferences: Record<string, "vertical" | "horizontal">
	onToggleLevel2Layout: (scenarioId: string) => void
	getLevel2Layout: (scenarioId: string) => "vertical" | "horizontal"
	// Add scenario props
	searchTheme?: string
	treeMode?: "TED" | "FAST"
	onAddScenario?: (context: string) => Promise<void>
}

export const CardContainer: React.FC<CardContainerProps> = ({
	cardLayout,
	level1Items,
	selectedPath,
	level2Items,
	allLevelItems,
	levelNames,
	isScenarioExpanded,
	isLevelExpanded,
	toggleScenarioExpansion,
	toggleLevelExpansion,
	expandAll,
	collapseAll,
	getAllLevelKeys,
	onNodeClick,
	onEditNode,
	onDeleteNode,
	onCardReorder,

	onToggleLevel2Layout,
	getLevel2Layout,
	searchTheme,
	treeMode = "TED",
	onAddScenario,
}) => {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const getLayoutClasses = () => {
		switch (cardLayout) {
			case "one-per-row":
				return "grid grid-cols-1"
			case "two-per-row":
				return "grid grid-cols-2"
			case "three-per-row":
				return "grid grid-cols-3"
			default:
				return "grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
		}
	}

	const getCardClasses = () => {
		return ""
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		if (active.id !== over?.id) {
			const oldIndex = level1Items.findIndex((item) => item.id === active.id)
			const newIndex = level1Items.findIndex((item) => item.id === over?.id)

			const newOrder = arrayMove(level1Items, oldIndex, newIndex)
			onCardReorder?.(newOrder)
		}
	}

	// Enable drag-and-drop for two-per-row and three-per-row layouts
	// Only allow dragging of actual scenario cards, not the add button
	const isDraggable =
		(cardLayout === "two-per-row" || cardLayout === "three-per-row") &&
		level1Items.length > 1

	const renderCards = () => {
		const scenarioCards = level1Items.map((scenario) => {
			const scenarioLevel2Items = level2Items[scenario.id] || []
			const isExpanded = isScenarioExpanded(scenario.id)

			return (
				<div key={scenario.id} className={getCardClasses()}>
					<DraggableCard
						scenario={scenario}
						selectedPath={selectedPath}
						level2Items={scenarioLevel2Items}
						allLevelItems={allLevelItems}
						levelNames={levelNames}
						isExpanded={isExpanded}
						isLevelExpanded={(levelKey) =>
							isLevelExpanded(scenario.id, levelKey)
						}
						onToggleExpansion={() => toggleScenarioExpansion(scenario.id)}
						onToggleLevelExpansion={(levelKey) =>
							toggleLevelExpansion(scenario.id, levelKey)
						}
						onExpandAll={() =>
							expandAll(scenario.id, getAllLevelKeys(scenario.id))
						}
						onCollapseAll={() => collapseAll(scenario.id)}
						onNodeClick={onNodeClick}
						onEditNode={onEditNode}
						onDeleteNode={onDeleteNode}
						isDraggable={isDraggable}
						level2Layout={getLevel2Layout(scenario.id)}
						onToggleLevel2Layout={() => onToggleLevel2Layout(scenario.id)}
					/>
				</div>
			)
		})

		// Add the AddScenarioModal button if we have the required props
		if (searchTheme && onAddScenario) {
			const addScenarioButton = (
				<div key="add-scenario" className={getCardClasses()}>
					<AddScenarioModal
						searchTheme={searchTheme}
						treeMode={treeMode}
						onAddScenario={onAddScenario}
					/>
				</div>
			)

			return [...scenarioCards, addScenarioButton]
		}

		return scenarioCards
	}

	const getContainerClasses = () => {
		const baseClasses = `${getLayoutClasses()} gap-4`
		return baseClasses
	}

	if (isDraggable) {
		return (
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={level1Items.map((item) => item.id)}
					strategy={rectSortingStrategy}
				>
					<div className={getContainerClasses()}>{renderCards()}</div>
				</SortableContext>
			</DndContext>
		)
	}

	return <div className={getContainerClasses()}>{renderCards()}</div>
}
