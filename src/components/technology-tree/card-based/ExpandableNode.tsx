import { ChevronDown, ChevronRight } from "lucide-react"
import type React from "react"
import { TreeNode } from "../level-selection/TreeNode"

interface LevelItem {
	id: string
	name: string
	info?: string
	isCustom?: boolean
	description?: string
	children_count?: number
}

interface ExpandableNodeProps {
	item: LevelItem
	isSelected: boolean
	isExpanded: boolean
	hasChildren: boolean
	onToggleExpansion: () => void
	onNodeClick: () => void
	onEditClick: (e: React.MouseEvent) => void
	onDeleteClick: (e: React.MouseEvent) => void
	level: number
	children?: React.ReactNode
}

export const ExpandableNode: React.FC<ExpandableNodeProps> = ({
	item,
	isSelected,
	isExpanded,
	hasChildren,
	onToggleExpansion,
	onNodeClick,
	onEditClick,
	onDeleteClick,
	level,
	children,
}) => {
	const handleExpansionClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		onToggleExpansion()
	}

	const handleAddClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		// TODO: Implement add functionality for card-based view
	}

	const handleAiAssistClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		// TODO: Implement AI assist functionality for card-based view
	}

	return (
		<div className="w-full">
			<div className="flex items-center gap-2">
				{hasChildren && (
					<button
						onClick={handleExpansionClick}
						className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
					>
						{isExpanded ? (
							<ChevronDown className="h-4 w-4 text-gray-600" />
						) : (
							<ChevronRight className="h-4 w-4 text-gray-600" />
						)}
					</button>
				)}
				{!hasChildren && <div className="w-6" />}

				<div className="flex-1">
					<TreeNode
						item={item}
						isSelected={isSelected}
						onClick={onNodeClick}
						onEditClick={onEditClick}
						onDeleteClick={onDeleteClick}
						onAddClick={handleAddClick}
						onAiAssistClick={handleAiAssistClick}
						level={level}
						showDescription={true}
					/>
				</div>
			</div>

			{isExpanded && children && (
				<div className="ml-8 mt-2 space-y-2">{children}</div>
			)}
		</div>
	)
}
