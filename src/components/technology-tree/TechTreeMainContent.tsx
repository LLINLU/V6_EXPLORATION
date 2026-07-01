import { memo } from "react"
import type { Keyword } from "@/types/axis"
import type { ChatMessage } from "@/types/chat"
import type { PathLevel, TreeNode } from "@/types/tree"
import { MainContent } from "./MainContent"

interface TechTreeMainContentProps {
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
	level1Items: TreeNode[]
	level2Items: Record<string, TreeNode[]>
	level3Items: Record<string, TreeNode[]>
	level4Items: Record<string, TreeNode[]>
	level5Items?: Record<string, TreeNode[]>
	level6Items?: Record<string, TreeNode[]>
	level7Items?: Record<string, TreeNode[]>
	level8Items?: Record<string, TreeNode[]>
	level9Items?: Record<string, TreeNode[]>
	level10Items?: Record<string, TreeNode[]>
	showLevel4: boolean
	handleNodeClick: (level: PathLevel, nodeId: string) => void
	editNode: (
		level: PathLevel,
		nodeId: string,
		updatedNode: { title: string; description: string },
	) => void
	deleteNode: (level: PathLevel, nodeId: string) => void
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
	hasUserMadeSelection: boolean
	scenario?: string
	initialKeywords?: Keyword[]

	conversationHistory?: ChatMessage[]
	handleAddLevel4?: () => void
	searchMode?: string
	onGuidanceClick?: (type: string) => void
	query?: string
	treeMode?: string
	// Navigation control props
	onScrollToStart?: () => void
	onScrollToEnd?: () => void
	canScrollLeft?: boolean
	canScrollRight?: boolean
	lastVisibleLevel?: number
	containerRef?: React.RefObject<HTMLDivElement>
	// View mode props
	viewMode: "treemap" | "mindmap"
	onToggleView: () => void
	// Add scenario props
	onAddScenario?: (context: string) => Promise<void>
	// Mind map expansion state props
	setMindmapExpansionState?: (expandedNodes: Set<string>) => void
	getMindmapExpansionState?: () => Set<string>
	justSwitchedView?: boolean
	clearViewSwitchFlag?: () => void
	saveMindmapPanZoomState?: (panZoomState: {
		zoom: number
		panX: number
		panY: number
	}) => void
	getMindmapPanZoomState?: () => { zoom: number; panX: number; panY: number }
	// Research panel callback for normal mode
	onResearchPanelChange?: (
		isVisible: boolean,
		nodeData?: {
			id: string
			title: string
			description?: string
			level: number
		},
	) => void
	onAiAssist?: () => void
	// Chat state management props

	// Fullscreen state props
	isFullscreen?: boolean
	onToggleFullscreen?: () => void
	// Panel content for fullscreen mode
	researchPanelContent?: React.ReactNode
	chatboxContent?: React.ReactNode
}

export const TechTreeMainContent = memo(
	({
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
		showLevel4,
		handleNodeClick,
		editNode,
		deleteNode,
		levelNames,
		hasUserMadeSelection,
		scenario,
		initialKeywords,

		conversationHistory,
		handleAddLevel4,
		searchMode,
		onGuidanceClick,
		query,
		treeMode,
		onScrollToStart,
		onScrollToEnd,
		canScrollLeft,
		canScrollRight,
		lastVisibleLevel,
		containerRef,
		viewMode,
		onToggleView,
		onAddScenario,
		setMindmapExpansionState,
		getMindmapExpansionState,
		justSwitchedView,
		clearViewSwitchFlag,
		saveMindmapPanZoomState,
		getMindmapPanZoomState,
		onResearchPanelChange,
		onAiAssist,

		isFullscreen,
		onToggleFullscreen,
		researchPanelContent,
		chatboxContent,
	}: TechTreeMainContentProps) => {
		// Note: triggerScrollUpdate is now handled by TechnologyTree.tsx to avoid duplicates

		return (
			<MainContent
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
				showLevel4={showLevel4}
				onNodeClick={(level, nodeId) => handleNodeClick(level as any, nodeId)}
				onEditNode={(level, nodeId, updatedNode) =>
					editNode(level as any, nodeId, updatedNode)
				}
				onDeleteNode={(level, nodeId) => deleteNode(level as any, nodeId)}
				levelNames={levelNames}
				hasUserMadeSelection={hasUserMadeSelection}
				scenario={scenario}
				initialKeywords={initialKeywords}
				conversationHistory={conversationHistory}
				onAddLevel4={handleAddLevel4}
				searchMode={searchMode}
				onGuidanceClick={onGuidanceClick}
				query={query}
				treeMode={treeMode}
				onScrollToStart={onScrollToStart}
				onScrollToEnd={onScrollToEnd}
				canScrollLeft={canScrollLeft}
				canScrollRight={canScrollRight}
				lastVisibleLevel={lastVisibleLevel}
				containerRef={containerRef}
				viewMode={viewMode}
				onToggleView={onToggleView}
				onAddScenario={onAddScenario}
				setMindmapExpansionState={setMindmapExpansionState}
				getMindmapExpansionState={getMindmapExpansionState}
				justSwitchedView={justSwitchedView}
				clearViewSwitchFlag={clearViewSwitchFlag}
				saveMindmapPanZoomState={saveMindmapPanZoomState}
				getMindmapPanZoomState={getMindmapPanZoomState}
				onResearchPanelChange={onResearchPanelChange}
				onAiAssist={onAiAssist}
				isFullscreen={isFullscreen}
				onToggleFullscreen={onToggleFullscreen}
				researchPanelContent={researchPanelContent}
				chatboxContent={chatboxContent}
			/>
		)
	},
)

TechTreeMainContent.displayName = "TechTreeMainContent"
