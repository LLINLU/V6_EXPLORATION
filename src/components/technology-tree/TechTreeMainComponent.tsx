import type React from "react"
import { FallbackAlert } from "@/components/technology-tree/FallbackAlert"
import { TechTreeMainContent } from "@/components/technology-tree/TechTreeMainContent"
import { useTreeDataStore } from "@/stores/treeDataStore"
import { useTreeUIStore } from "@/stores/treeUIStore"
import type { ChatMessage } from "@/types/chat"
import type { LocationState, ViewMode } from "@/types/tree"

interface TechTreeMainComponentProps {
	// Essential props that cannot be obtained from stores
	locationState: LocationState | null
	savedConversationHistory: ChatMessage[]
	scenario: string
	searchMode: string
	currentQuery: string
	containerRef: React.RefObject<HTMLDivElement>
	canScrollLeft: boolean
	canScrollRight: boolean
	lastVisibleLevel: number
	handleScrollToStart: () => void
	handleScrollToEnd: () => void
	handleGuidanceClick: (text: string) => void
	handleAddScenario: (context: string) => Promise<void>
	isGenerating?: boolean
	handleResearchPanelChange: (isVisible: boolean, nodeData?: any) => void
	onAiAssist: (nodeId?: string, nodeTitle?: string) => void

	// View mode props (will be moved to store later)
	viewMode: ViewMode
	toggleView: () => void
	setMindmapExpansionState: (state: Set<string>) => void
	getMindmapExpansionState: () => Set<string>
	justSwitchedView: boolean
	clearViewSwitchFlag: () => void
	saveMindmapPanZoomState: (state: {
		zoom: number
		panX: number
		panY: number
	}) => void
	getMindmapPanZoomState: () => { zoom: number; panX: number; panY: number }
	isFullscreenMode: boolean
	toggleFullscreenMode: () => void
	// Panel content for fullscreen mode
	researchPanelContent?: React.ReactNode
	chatboxContent?: React.ReactNode
}

export const TechTreeMainComponent: React.FC<TechTreeMainComponentProps> = ({
	locationState,
	savedConversationHistory,
	scenario,
	searchMode,
	currentQuery,
	containerRef,
	canScrollLeft,
	canScrollRight,
	lastVisibleLevel,
	handleScrollToStart,
	handleScrollToEnd,
	handleGuidanceClick,
	handleAddScenario,
	isGenerating,
	handleResearchPanelChange,
	onAiAssist,
	viewMode,
	toggleView,
	setMindmapExpansionState,
	getMindmapExpansionState,
	justSwitchedView,
	clearViewSwitchFlag,
	saveMindmapPanZoomState,
	getMindmapPanZoomState,
	isFullscreenMode,
	toggleFullscreenMode,
	researchPanelContent,
	chatboxContent,
}) => {
	// Get UI state from store
	const { showFallbackAlert, setShowFallbackAlert } = useTreeUIStore()

	// Get tree data from store
	const {
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
		showLevel4,
		hasUserMadeSelection,
		databaseScenario,
		treeMode,
		handleNodeClick,
		editNode,
		deleteNode,
		handleAddLevel4,
		levelNames,
	} = useTreeDataStore()

	return (
		<div className="h-full flex flex-col">
			<div className="p-0 pb-0 flex-shrink-0">
				<FallbackAlert
					isVisible={showFallbackAlert}
					onDismiss={() => setShowFallbackAlert(false)}
				/>
			</div>
			<div className="flex-1 min-h-0">
				<TechTreeMainContent
					// Tree data from Zustand store
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
					handleNodeClick={handleNodeClick}
					editNode={editNode}
					deleteNode={deleteNode}
					levelNames={levelNames}
					hasUserMadeSelection={hasUserMadeSelection}
					handleAddLevel4={handleAddLevel4}
					treeMode={treeMode}
					// Other props
					scenario={databaseScenario || scenario}
					initialKeywords={locationState?.selectedKeywords}
					conversationHistory={savedConversationHistory}
					searchMode={searchMode}
					onGuidanceClick={handleGuidanceClick}
					query={currentQuery || locationState?.query}
					onScrollToStart={handleScrollToStart}
					onScrollToEnd={handleScrollToEnd}
					canScrollLeft={canScrollLeft}
					canScrollRight={canScrollRight}
					lastVisibleLevel={lastVisibleLevel}
					containerRef={containerRef}
					viewMode={viewMode}
					onToggleView={toggleView}
					onAddScenario={isGenerating ? undefined : handleAddScenario}
					setMindmapExpansionState={setMindmapExpansionState}
					getMindmapExpansionState={getMindmapExpansionState}
					justSwitchedView={justSwitchedView}
					clearViewSwitchFlag={clearViewSwitchFlag}
					saveMindmapPanZoomState={saveMindmapPanZoomState}
					getMindmapPanZoomState={getMindmapPanZoomState}
					onResearchPanelChange={handleResearchPanelChange}
					onAiAssist={onAiAssist}
					isFullscreen={isFullscreenMode}
					onToggleFullscreen={toggleFullscreenMode}
					researchPanelContent={researchPanelContent}
					chatboxContent={chatboxContent}
				/>
			</div>
		</div>
	)
}
