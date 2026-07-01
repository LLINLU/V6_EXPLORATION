import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import type React from "react"
import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScenarioCard } from "./ScenarioCard"

interface LevelItem {
	id: string
	name: string
	info?: string
	isCustom?: boolean
	description?: string
	children_count?: number
}
interface DraggableCardProps {
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
		updatedNode: {
			title: string
			description: string
		},
	) => void
	onDeleteNode?: (level: string, nodeId: string) => void
	isDraggable: boolean
	level2Layout: "vertical" | "horizontal"
	onToggleLevel2Layout: () => void
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
	scenario,
	selectedPath,
	level2Items,
	allLevelItems,
	levelNames,
	isExpanded,
	isLevelExpanded,
	onToggleExpansion,
	onToggleLevelExpansion,
	onExpandAll,
	onCollapseAll,
	onNodeClick,
	onEditNode,
	onDeleteNode,
	isDraggable,
	level2Layout,
	onToggleLevel2Layout,
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: scenario.id,
		disabled: !isDraggable,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.8 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`relative group ${isDragging ? "z-50" : ""}`}
		>
			{/* Drag Handle - appears on hover in top-left */}
			{isDraggable && (
				<div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
					<TooltipProvider delayDuration={150} skipDelayDuration={300}>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="sm"
									className="h-6 w-6 p-0 bg-white/90 hover:bg-white border border-gray-200 shadow-sm rounded"
									{...attributes}
									{...listeners}
								>
									<GripVertical className="h-2.5 w-2.5 text-gray-600" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>ドラッグして並び替え</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			)}

			<ScenarioCard
				scenario={scenario}
				selectedPath={selectedPath}
				level2Items={level2Items}
				allLevelItems={allLevelItems}
				levelNames={levelNames}
				isExpanded={isExpanded}
				isLevelExpanded={isLevelExpanded}
				onToggleExpansion={onToggleExpansion}
				onToggleLevelExpansion={onToggleLevelExpansion}
				onExpandAll={onExpandAll}
				onCollapseAll={onCollapseAll}
				onNodeClick={onNodeClick}
				onEditNode={onEditNode}
				onDeleteNode={onDeleteNode}
				level2Layout={level2Layout}
				onToggleLevel2Layout={onToggleLevel2Layout}
			/>
		</div>
	)
}
