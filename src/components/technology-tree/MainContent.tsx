import { Download, Plus } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useTreeDataStore } from "@/stores/treeDataStore"
import type { Keyword } from "@/types/axis"
import { exportTreeToCsv } from "@/utils/treeExport"
import { CardBasedTreemap } from "./card-based/CardBasedTreemap"
import { AddNodeDialog } from "./level-selection/AddNodeDialog"
import { MindMapContainer } from "./mindmap/MindMapContainer"
import { PathDisplay } from "./PathDisplay"
import { ScenarioSection } from "./ScenarioSection"

interface MainContentProps {
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
	level1Items: any[]
	level2Items: Record<string, any[]>
	level3Items: Record<string, any[]>
	level4Items: Record<string, any[]>
	level5Items?: Record<string, any[]>
	level6Items?: Record<string, any[]>
	level7Items?: Record<string, any[]>
	level8Items?: Record<string, any[]>
	level9Items?: Record<string, any[]>
	level10Items?: Record<string, any[]>
	showLevel4: boolean
	onNodeClick: (level: string, nodeId: string) => void
	onEditNode?: (
		level: string,
		nodeId: string,
		updatedNode: { title: string; description: string },
	) => void
	onDeleteNode?: (level: string, nodeId: string) => void
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
	query?: string
	hasUserMadeSelection: boolean
	scenario?: string
	initialKeywords?: Keyword[]

	conversationHistory?: any[]
	onAddLevel4?: () => void
	searchMode?: string
	onGuidanceClick?: (type: string) => void
	treeMode?: string
	// Navigation control props
	onScrollToStart?: () => void
	onScrollToEnd?: () => void
	canScrollLeft?: boolean
	canScrollRight?: boolean
	lastVisibleLevel?: number
	containerRef?: React.RefObject<HTMLDivElement>
	// View mode props - passed from parent
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

export const MainContent = ({
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
	onNodeClick,
	onEditNode,
	onDeleteNode,
	levelNames,
	query,
	scenario,
	initialKeywords: _initialKeywords,
	onGuidanceClick,
	treeMode,
	onScrollToStart,
	onScrollToEnd,
	canScrollLeft,
	canScrollRight,
	lastVisibleLevel,
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
	onToggleFullscreen,
	researchPanelContent,
	chatboxContent,
	isFullscreen = false,
}: MainContentProps) => {
	const isTreemapView = viewMode === "treemap"
	const isMindmapView = viewMode === "mindmap"
	const { addCustomNode } = useTreeDataStore()
	const { t } = useTranslation()

	// Add node dialog state
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [addNodeTitle, setAddNodeTitle] = useState("")
	const [addNodeDescription, setAddNodeDescription] = useState("")

	const handleAddNodeSave = () => {
		if (!addNodeTitle.trim()) return
		addCustomNode("level1" as any, "", {
			title: addNodeTitle.trim(),
			description: addNodeDescription.trim(),
		})
		setIsAddDialogOpen(false)
		setAddNodeTitle("")
		setAddNodeDescription("")
	}

	const handleDirectAddNodeSave = (title: string, description: string) => {
		if (!title.trim()) return
		addCustomNode("level1" as any, "", {
			title: title.trim(),
			description: description.trim(),
		})
		setIsAddDialogOpen(false)
	}

	const _handleViewModeChange = (value: string) => {
		if (value && value !== viewMode) {
			onToggleView()
		}
	}

	return (
		<div
			className={`h-full flex flex-col ${isMindmapView ? "overflow-hidden" : ""}`}
		>
			<div className="flex-shrink-0">
				{/* Title and Guidance Section */}
				<div className="bg-white overflow-hidden rounded-lg p-4">
					<div className="mb-0" style={{ paddingTop: "0rem" }}>
						<div className="flex justify-between items-center mb-1">
							<h3
								className="text-gray-800"
								style={{ fontSize: "16px", fontWeight: 600 }}
							>
								この技術を分解した結果
							</h3>

							<div className="flex items-center gap-2">
								{/* How1 Add Button - FAST mode only */}
								{treeMode === "FAST" && (
									<button
										type="button"
										onClick={() => {
											setAddNodeTitle("")
											setAddNodeDescription("")
											setIsAddDialogOpen(true)
										}}
										className="inline-flex items-center justify-center gap-1 rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white text-gray-800 hover:bg-[#e8f1ff] hover:border-[#90aff7] px-2 py-1 h-7"
									>
										<Plus className="h-3 w-3" />
										実現手法追加
									</button>
								)}

								{/* CSV download button - visible when tree has data */}
								{level1Items.length > 0 && (
									<button
										type="button"
										onClick={() =>
											exportTreeToCsv(
												query ?? "",
												level1Items,
												level2Items,
												level3Items,
												level4Items,
												level5Items ?? {},
												{
													query: t("mindmap.legend.csv_query"),
													techElement: (n) =>
														t("mindmap.legend.csv_tech_element", { n }),
													description: t("mindmap.legend.csv_description"),
												},
											)
										}
										className="inline-flex items-center justify-center gap-1 rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white text-gray-800 hover:bg-[#e8f1ff] hover:border-[#90aff7] px-2 py-1 h-7"
									>
										<Download className="h-3 w-3" />
										{t("mindmap.legend.csv_download")}
									</button>
								)}
							</div>
						</div>

						{/* Scenario Section - now appears before PathDisplay */}
						<ScenarioSection scenario={scenario} treeMode={treeMode} />

						{/* Path Display - now appears after ScenarioSection */}
						<PathDisplay
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
							showLevel4={true}
							onGuidanceClick={onGuidanceClick}
							onScrollToStart={onScrollToStart}
							onScrollToEnd={onScrollToEnd}
							canScrollLeft={canScrollLeft}
							canScrollRight={canScrollRight}
							lastVisibleLevel={lastVisibleLevel}
							viewMode={viewMode}
						/>
					</div>
				</div>
			</div>

			{/* Main content area - keep both components mounted but show/hide based on view */}
			<div className="flex-1 min-h-0 overflow-hidden mt-1 bg-white rounded-lg">
				<div className={`${isTreemapView ? "block" : "hidden"} h-full`}>
					<CardBasedTreemap
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
						levelNames={levelNames}
						onNodeClick={onNodeClick}
						onEditNode={onEditNode}
						onDeleteNode={onDeleteNode}
						searchTheme={query}
						treeMode={treeMode as "TED" | "FAST"}
						onAddScenario={onAddScenario}
					/>
				</div>
				<div className={`${isMindmapView ? "block" : "hidden"} h-full`}>
					<MindMapContainer
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
						levelNames={levelNames}
						query={query}
						onNodeClick={onNodeClick}
						onEditNode={onEditNode}
						onDeleteNode={onDeleteNode}
						treeMode={treeMode}
						justSwitchedView={justSwitchedView}
						onViewSwitchHandled={clearViewSwitchFlag}
						setMindmapExpansionState={setMindmapExpansionState}
						getMindmapExpansionState={getMindmapExpansionState}
						saveMindmapPanZoomState={saveMindmapPanZoomState}
						getMindmapPanZoomState={getMindmapPanZoomState}
						onResearchPanelChange={onResearchPanelChange}
						onAiAssist={onAiAssist}
						isFullscreen={isFullscreen}
						onToggleFullscreen={onToggleFullscreen}
						researchPanelContent={researchPanelContent}
						chatboxContent={chatboxContent}
					/>
				</div>
			</div>

			{/* Add Node Dialog */}
			<AddNodeDialog
				isOpen={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
				title={addNodeTitle}
				description={addNodeDescription}
				onTitleChange={setAddNodeTitle}
				onDescriptionChange={setAddNodeDescription}
				onSave={handleAddNodeSave}
				onDirectSave={handleDirectAddNodeSave}
			/>
		</div>
	)
}
