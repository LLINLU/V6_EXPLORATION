import type React from "react"
import type { TreeNode } from "@/types/tree"
import { MindMapController } from "./components/MindMapController"
import { type MindMapData, MindMapProvider } from "./MindMapContext"

// Re-export types for backward compatibility
interface SelectedPath {
	level1?: string
	level2?: string
	level3?: string
	level4?: string
	level5?: string
	level6?: string
	level7?: string
	level8?: string
	level9?: string
	level10?: string
}

interface SelectedNodeForResearch {
	id: string
	title: string
	description?: string
	level: number
}

interface MindMapContainerProps {
	selectedPath: SelectedPath
	level1Items: TreeNode[]
	level2Items: Record<string, TreeNode[]>
	level3Items: Record<string, TreeNode[]>
	level4Items: Record<string, TreeNode[]>
	level5Items: Record<string, TreeNode[]>
	level6Items: Record<string, TreeNode[]>
	level7Items: Record<string, TreeNode[]>
	level8Items: Record<string, TreeNode[]>
	level9Items: Record<string, TreeNode[]>
	level10Items: Record<string, TreeNode[]>
	levelNames: Record<string, string>
	query?: string
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
	treeMode?: string
	justSwitchedView?: boolean
	onViewSwitchHandled?: () => void
	setMindmapExpansionState?: (expandedNodes: Set<string>) => void
	getMindmapExpansionState?: () => Set<string>
	saveMindmapPanZoomState?: (panZoomState: {
		zoom: number
		panX: number
		panY: number
	}) => void
	getMindmapPanZoomState?: () => { zoom: number; panX: number; panY: number }
	onResearchPanelChange?: (
		isVisible: boolean,
		nodeData?: SelectedNodeForResearch,
	) => void
	onAiAssist?: (
		nodeId?: string,
		nodeTitle?: string,
		nodeDescription?: string,
		level?: number,
	) => void
	// Fullscreen state props
	isFullscreen?: boolean
	onToggleFullscreen?: () => void
	// Panel content for fullscreen mode
	researchPanelContent?: React.ReactNode
	chatboxContent?: React.ReactNode
	// Toolbar orientation
	toolbarOrientation?: "vertical" | "horizontal"
	hideTrlToggle?: boolean
}

const MindMapContainer: React.FC<MindMapContainerProps> = ({
	selectedPath,
	level1Items,
	level2Items,
	level3Items,
	level4Items,
	level5Items,
	level6Items,
	level7Items,
	level8Items,
	level9Items,
	level10Items,
	levelNames,
	query,
	onNodeClick,
	onEditNode,
	onDeleteNode,
	justSwitchedView,
	getMindmapPanZoomState,
	onResearchPanelChange,
	onAiAssist,
	isFullscreen = false,
	onToggleFullscreen,
	researchPanelContent,
	chatboxContent,
	treeMode,
	toolbarOrientation = "vertical",
	hideTrlToggle = false,
}) => {
	// Prepare data for context
	const mindMapData: MindMapData = {
		level1Items,
		level2Items,
		level3Items,
		level4Items,
		level5Items,
		level6Items,
		level7Items,
		level8Items,
		level9Items,
		level10Items,
		levelNames,
		query,
		selectedPath,
	}

	// Prepare callbacks for controller
	const callbacks = {
		onNodeClick,
		onEditNode,
		onDeleteNode,
		onResearchPanelChange,
		onAiAssist,
		onToggleFullscreen,
	}
	return (
		<MindMapProvider data={mindMapData} initialFullscreen={isFullscreen}>
			<MindMapController
				callbacks={callbacks}
				justSwitchedView={justSwitchedView}
				getMindmapPanZoomState={getMindmapPanZoomState}
				researchPanelContent={researchPanelContent}
				chatboxContent={chatboxContent}
				toolbarOrientation={toolbarOrientation}
				treeMode={treeMode}
				hideTrlToggle={hideTrlToggle}
			/>
		</MindMapProvider>
	)
}

export { MindMapContainer }
export default MindMapContainer
export type { MindMapContainerProps, SelectedPath, SelectedNodeForResearch }
