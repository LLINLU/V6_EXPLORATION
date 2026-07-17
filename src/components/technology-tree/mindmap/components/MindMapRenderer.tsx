import {
	FileText,
	Home,
	LayoutGrid,
	Maximize,
	Minimize,
	Minus,
	ZoomIn,
	ZoomOut,
} from "lucide-react"
// React types and runtime handled via default JSX import below
import React, { useState } from "react"
import { ChatAskAIButton } from "@/components/technology-tree/chat/ChatAskAIButton"
import { AddNodeDialog } from "@/components/technology-tree/level-selection/AddNodeDialog"
import { QueryDisplay } from "@/components/technology-tree/QueryDisplay"
import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTreeDataStore } from "@/stores/treeDataStore"
import { useTreeUIStore } from "@/stores/treeUIStore"
import { useMindMapData } from "../hooks/useMindMapData"
import { useMindMapRendering } from "../hooks/useMindMapRendering"
import { MindMapConnections } from "../MindMapConnections"
import { useMindMap } from "../MindMapContext"
//import { MindMapFullscreenNav } from "../MindMapFullscreenNav"
import { MindMapLegend } from "../MindMapLegend"
import { MindMapNodeComponent } from "../MindMapNode"

interface MindMapRendererProps {
	eventHandlers: {
		handleNodeClick: (nodeId: string, level: number) => void
		handleAiAssist: (nodeId: string, level: number) => void
		handleAddNode: (nodeId: string, level: number) => void
		handleEditNode: (
			level: string,
			nodeId: string,
			updatedNode: { title: string; description: string },
		) => void
		handleDeleteNode: (level: string, nodeId: string) => void
		handleToggleExpand: (nodeId: string, isExpanded: boolean) => void
		handleSearchValueChange: (value: string) => void
		handleSearchModeChange: (mode: "TED" | "FAST") => void
		handleSearchSubmit: (e: React.FormEvent) => void
		handleToggleLayout: () => void
		handleToggleFullscreen: () => void
		handleToggleResearchPanelFromNav: () => void
		handleToggleChatPanelFromNav: () => void
		handleKeyDown: (event: KeyboardEvent) => void
	}
	researchPanelContent?: React.ReactNode
	chatboxContent?: React.ReactNode
	getMindmapPanZoomState?: () => { zoom: number; panX: number; panY: number }
	justSwitchedView?: boolean
	treeMode?: string
	chatBoxOpen?: boolean
	toolbarOrientation?: "vertical" | "horizontal"
	hideTrlToggle?: boolean
}

export const MindMapRenderer: React.FC<MindMapRendererProps> = ({
	eventHandlers,
	researchPanelContent,
	chatboxContent,
	getMindmapPanZoomState,
	justSwitchedView,
	chatBoxOpen,
	toolbarOrientation = "vertical",
	treeMode,
	hideTrlToggle = false,
}) => {
	const { state, actions, data } = useMindMap()
	const { addCustomNode } = useTreeDataStore()

	// Add node dialog state
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [addNodeTitle, setAddNodeTitle] = useState("")
	const [addNodeDescription, setAddNodeDescription] = useState("")
	const [addNodeParentLevel, setAddNodeParentLevel] = useState<string>("level1")

	const handleOpenAddDialog = (_nodeId: string, level: number) => {
		setAddNodeParentLevel(`level${level}`)
		setAddNodeTitle("")
		setAddNodeDescription("")
		setIsAddDialogOpen(true)
	}

	const handleAddNodeSave = () => {
		if (!addNodeTitle.trim()) return
		addCustomNode(addNodeParentLevel as any, "", {
			title: addNodeTitle.trim(),
			description: addNodeDescription.trim(),
		})
		setIsAddDialogOpen(false)
		setAddNodeTitle("")
		setAddNodeDescription("")
	}

	const handleDirectAddNodeSave = (title: string, description: string) => {
		if (!title.trim()) return
		addCustomNode(addNodeParentLevel as any, "", {
			title: title.trim(),
			description: description.trim(),
		})
		setIsAddDialogOpen(false)
	}

	const uiStore = useTreeUIStore()
	// If a chatBoxOpen prop was passed use it, otherwise fall back to global UI store.
	const effectiveChatBoxOpen =
		typeof chatBoxOpen === "boolean" ? chatBoxOpen : uiStore.chatBoxOpen

	// Prefer the context data query (from the MindMapProvider) and fall back to
	// the internal searchValue state. This ensures the fullscreen top bar shows
	// the correct query even if the renderer wasn't passed a prop.
	const displayQuery = data?.query || state.searchValue || ""
	const {
		nodes,
		connections,
		handleLevelExpand,
		handleLevelCollapse,
		isLevelExpanded,
	} = useMindMapData()

	const {
		containerRef,
		researchPanelRef,
		chatPanelRef,
		containerWidth,
		containerHeight,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleMouseLeave,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		handleContainerWheel,
		zoomIn,
		zoomOut,
		resetView,
		getCSSTransform,
		zoom,
		isDragging,
	} = useMindMapRendering({ getMindmapPanZoomState, justSwitchedView })

	// Container styling based on fullscreen mode (width applied inline where needed)

	const containerContent = (
		<div
			ref={containerRef}
			className="relative w-full h-full mindmap-outer-container" // Simplified classes
			style={{
				cursor: state.cursorStyle,
				touchAction: "none",
				WebkitOverflowScrolling: "auto",
			}}
			onWheel={handleContainerWheel}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseLeave}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			role="application"
			aria-label="操作可能なマインドマップキャンバス"
		>
			{/* Main mindmap content */}
			<div className="relative w-full h-full overflow-hidden">
				<div
					className={`absolute top-0 left-0 mindmap-container relative origin-top-left mindmap-content ${
						!justSwitchedView && !isDragging
							? "transition-transform duration-150 ease-out"
							: ""
					}`}
					style={{
						transform: getCSSTransform(),
						width: `${containerWidth}px`,
						height: `${containerHeight}px`,
						minWidth: "100%",
						minHeight: "100%",
						borderRadius: "8px",
					}}
				>
					<MindMapConnections
						connections={connections}
						layoutDirection={state.layoutDirection}
						selectedNodeId={state.selectedNodeForHighlight || undefined}
					/>

					{nodes.map((node) => (
						<MindMapNodeComponent
							key={node.id}
							node={node}
							layoutDirection={state.layoutDirection}
							onClick={eventHandlers.handleNodeClick}
							onAiAssist={eventHandlers.handleAiAssist}
							onDelete={eventHandlers.handleDeleteNode}
							onToggleExpand={eventHandlers.handleToggleExpand}
						/>
					))}

					{nodes.length === 0 && (
						<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500">
							<p className="text-lg">
								マインドマップ表示に利用できるデータがありません
							</p>
							<p className="text-sm mt-2">
								ツリーが生成済みであることを確認してください
							</p>
						</div>
					)}
				</div>
			</div>

			{/* TRL colour toggle */}
			{!hideTrlToggle && toolbarOrientation !== "horizontal" && (() => {
				const { trlColorMode, toggleTrlColorMode } = uiStore
				return (
					<button
						type="button"
						onClick={toggleTrlColorMode}
						className="absolute top-4 right-4 z-40 inline-flex items-center gap-2 text-xs font-medium text-gray-700"
					>
						TRL カラー
						{/* Track */}
						<span
							className="relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors duration-200"
							style={{ background: trlColorMode ? "#b29dc4" : "#d1d5db" }}
						>
							{/* Thumb */}
							<span
								className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-200 ${
									trlColorMode ? "translate-x-3.5" : "translate-x-0.5"
								}`}
							/>
						</span>
					</button>
				)
			})()}

			{/* Mind Map Controls */}
			<div
				className={`absolute bg-white/90 backdrop-blur-sm rounded-lg border z-40 ${
					toolbarOrientation === "horizontal"
						? "top-2 left-1/2 -translate-x-1/2 flex flex-row gap-1 p-1 shadow-sm"
						: "top-20 right-4 flex flex-col gap-2 p-2 shadow-lg"
				}`}
			>
				<Button
					variant="outline"
					size="sm"
					onClick={zoomIn}
					disabled={zoom >= 3}
					className={
						toolbarOrientation === "horizontal"
							? "w-7 h-7 p-0"
							: "w-10 h-10 p-0"
					}
					title="拡大"
				>
					<ZoomIn
						className={
							toolbarOrientation === "horizontal" ? "h-3 w-3" : "h-4 w-4"
						}
					/>
				</Button>

				<Button
					variant="outline"
					size="sm"
					onClick={zoomOut}
					disabled={zoom <= 0.1}
					className={
						toolbarOrientation === "horizontal"
							? "w-7 h-7 p-0"
							: "w-10 h-10 p-0"
					}
					title="縮小"
				>
					<ZoomOut
						className={
							toolbarOrientation === "horizontal" ? "h-3 w-3" : "h-4 w-4"
						}
					/>
				</Button>

				<Button
					variant="outline"
					size="sm"
					onClick={resetView}
					className={
						toolbarOrientation === "horizontal"
							? "w-7 h-7 p-0"
							: "w-10 h-10 p-0"
					}
					title="表示をリセット"
				>
					<Home
						className={
							toolbarOrientation === "horizontal" ? "h-3 w-3" : "h-4 w-4"
						}
					/>
				</Button>

				{eventHandlers.handleToggleFullscreen && (
					<Button
						variant="outline"
						size="sm"
						onClick={eventHandlers.handleToggleFullscreen}
						className={`${toolbarOrientation === "horizontal" ? "w-7 h-7 p-0" : "w-10 h-10 p-0"} ${state.isFullscreen ? "bg-slate-100" : ""}`}
						title={state.isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
					>
						{state.isFullscreen ? (
							<Minimize
								className={
									toolbarOrientation === "horizontal" ? "h-3 w-3" : "h-4 w-4"
								}
							/>
						) : (
							<Maximize
								className={
									toolbarOrientation === "horizontal" ? "h-3 w-3" : "h-4 w-4"
								}
							/>
						)}
					</Button>
				)}

				{!state.isControlsCollapsed && (
					<Button
						variant="outline"
						size="sm"
						onClick={eventHandlers.handleToggleLayout}
						className={
							toolbarOrientation === "horizontal"
								? "w-7 h-7 p-0"
								: "w-10 h-10 p-0"
						}
						title={`Switch to ${state.layoutDirection === "horizontal" ? "Vertical" : "Horizontal"} Layout`}
					>
						<LayoutGrid
							className={
								toolbarOrientation === "horizontal" ? "h-3 w-3" : "h-4 w-4"
							}
						/>
					</Button>
				)}

				<div
					className={`text-muted-foreground ${
						toolbarOrientation === "horizontal"
							? "flex items-center px-1 text-[10px]"
							: "text-center px-1 text-xs"
					}`}
				>
					{Math.round(zoom * 100)}%
				</div>
			</div>

			{/* Legend */}
			<div className="absolute left-4 bottom-4 z-[50] w-fit">
				<MindMapLegend
					treeMode={treeMode}
					onLevelExpand={handleLevelExpand}
					onLevelCollapse={handleLevelCollapse}
					isLevelExpanded={isLevelExpanded}
					onAddNode={() => handleOpenAddDialog("", 1)}
				/>
			</div>
		</div>
	)

	const addNodeDialog = (
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
	)

	if (state.isFullscreen) {
		return (
			// Apply gray background, p-1 padding, flex COLUMN, and gap-1
			<div className="fixed inset-0 z-50 bg-[#EEEEEE] p-1 flex flex-col gap-0.5">
				{/* === Conditionally Render TOP BAR === */}
				{state.showNavigation && (
					<div className="bg-white rounded-lg px-4 py-2 flex items-center justify-between flex-shrink-0 border-b shadow-sm">
						{/* Centering wrapper */}
						{/* Make the center query area expand more horizontally but constrain with a max width */}
						<div className="flex-1 px-6 flex items-center">
							<div className="w-full max-w-5xl mx-auto">
								<QueryDisplay
									className="mb-0"
									query={displayQuery}
									treeMode={state.searchMode}
								/>
							</div>
						</div>
						{/* Right side icons */}
						<div className="flex items-center gap-2">
							{/* Paper/Research Panel Toggle Button */}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={eventHandlers.handleToggleResearchPanelFromNav}
										className="h-8 w-8"
									>
										<FileText className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									<p>事例と論文を表示</p>
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={actions.toggleNavigation}
										className="h-8 w-8"
									>
										{/* Use Minus Icon */}
										<Minus className="h-4 w-4" />
										<span className="sr-only">
											ナビゲーションバーを切り替え
										</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									<div className="flex flex-col items-center gap-1">
										<div className="flex items-center gap-1">
											{/* Command/Ctrl Key SVG */}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												fill="#595959"
												viewBox="0 0 256 256"
											>
												<path d="M116,116h24v24H116ZM86,72a14,14,0,0,0,0,28h14V86A14,14,0,0,0,86,72Zm98,14a14,14,0,0,0-28,0v14h14A14,14,0,0,0,184,86ZM72,170a14,14,0,0,0,28,0V156H86A14,14,0,0,0,72,170ZM224,48V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48Zm-68,92V116h14a30,30,0,1,0-30-30v14H116V86a30,30,0,1,0-30,30h14v24H86a30,30,0,1,0,30,30V156h24v14a30,30,0,1,0,30-30Zm0,30a14,14,0,1,0,14-14H156Z"></path>
											</svg>
											<span>＋</span>
											{/* Backslash Key SVG */}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												fill="#595959"
												viewBox="0 0 256 256"
											>
												<path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM187.31,187.31a8,8,0,0,1-11.31,0L68.69,80A8,8,0,0,1,80,68.69L187.31,176A8,8,0,0,1,187.31,187.31Z"></path>
											</svg>
										</div>
										{/* Japanese Text */}
										<span>でナビゲーションバーの表示／非表示</span>
									</div>
								</TooltipContent>
							</Tooltip>
							{!effectiveChatBoxOpen && <ChatAskAIButton />}{" "}
							{/* Show if chat isn't open */}
						</div>
					</div>
				)}

				<TooltipProvider>
					<div className="flex-1 flex gap-0.5 h-full overflow-hidden">
						{/* Panel 1: Mind Map Area */}
						<div className="flex-1 bg-white rounded-lg overflow-hidden border shadow-sm relative">
							{containerContent}
						</div>

						{/* Panel 2: Research Panel */}
						{state.showResearchPanel && (
							<div
								ref={researchPanelRef}
								className="w-96 bg-white rounded-lg overflow-hidden border shadow-sm h-full flex-shrink-0"
							>
								{researchPanelContent &&
								React.isValidElement(researchPanelContent)
									? React.cloneElement(
											researchPanelContent as React.ReactElement,
											{
												// Ensure the inner sidebar knows it's in fullscreen and receives
												// an onClose handler that will close the fullscreen research panel.
												isFullscreenMode: true,
												onClose: () => actions.setShowResearchPanel(false),
											},
										)
									: researchPanelContent}
							</div>
						)}

						{/* Panel 3: Chat Panel */}
						{state.fullscreenChatOpen && (
							<div
								ref={chatPanelRef}
								className="w-96 bg-white rounded-lg overflow-hidden border shadow-sm h-full flex-shrink-0"
							>
								{chatboxContent && React.isValidElement(chatboxContent)
									? React.cloneElement(chatboxContent as React.ReactElement, {
											isFullscreenMode: true,
											onClose: () => actions.setFullscreenChatOpen(false),
										})
									: chatboxContent}
							</div>
						)}
					</div>
				</TooltipProvider>
				{addNodeDialog}
			</div>
		)
	}

	return (
		<div className="p-1 h-full">
			<TooltipProvider>{containerContent}</TooltipProvider>
			{addNodeDialog}
		</div>
	)
}
