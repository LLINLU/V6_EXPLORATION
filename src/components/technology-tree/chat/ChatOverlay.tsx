import type React from "react"
import { useTranslation } from "react-i18next"
import type { ChatMessage, NodeSuggestion } from "@/types/chat"
import type { ChatDisplayMode, ContextMode, SelectedNode } from "@/types/tree"
import { ChatConversationBox } from "./ChatConversationBox"
import { ChatHeader } from "./ChatHeader"
import { ChatInputBox } from "./ChatInputBox"
import { ChatLoadingIndicator } from "./ChatLoadingIndicator"

interface ChatOverlayProps {
	messages: ChatMessage[]
	isLoading: boolean
	isInteractionEnabled: boolean
	contextMode: ContextMode
	selectedNodes?: SelectedNode[]
	availableNodes: NodeSuggestion[]
	isGuidanceConversation: boolean
	displayMode: ChatDisplayMode
	isDragging: boolean
	position: { x: number; y: number }
	size: { width: number; height: number }
	elementRef: React.RefObject<HTMLDivElement>
	onToggleOpen: () => void
	onDisplayModeChange: (mode: ChatDisplayMode) => void
	onMouseDown: (e: React.MouseEvent) => void
	onResizeMouseDown: (e: React.MouseEvent) => void
	onInputChange: (value: string) => void
	onSendMessage: () => void
	onQuickMessage: (text: string) => void
	onContextModeChange?: (mode: ContextMode) => void
	onNodeSelect?: (node: NodeSuggestion) => void
	onUseNode?: (suggestion: NodeSuggestion) => void
	onEditNode?: (suggestion: NodeSuggestion) => void
	onRefine?: (suggestion: NodeSuggestion) => void
	onCheckResults?: () => void
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
	messages,
	isLoading,
	isInteractionEnabled,
	contextMode,
	selectedNodes,
	availableNodes,
	isGuidanceConversation,
	displayMode,
	isDragging,
	position,
	size,
	elementRef,
	onToggleOpen,
	onDisplayModeChange,
	onMouseDown,
	onResizeMouseDown,
	onInputChange,
	onSendMessage,
	onQuickMessage,
	onContextModeChange,
	onNodeSelect,
	onUseNode,
	onEditNode,
	onRefine,
	onCheckResults,
}) => {
	const { t } = useTranslation()
	return (
		<div
			ref={elementRef}
			className={`fixed bg-white border flex flex-col z-50 overflow-hidden ${
				isDragging
					? "shadow-2xl border-blue-300 rounded-lg select-none"
					: "shadow-xl border-gray-200 rounded-lg"
			}`}
			style={{
				left: position.x,
				top: position.y,
				width: size.width,
				height: size.height,
				minWidth: 300,
				minHeight: 400,
				transition: isDragging ? "none" : undefined,
			}}
		>
			<ChatHeader
				toggleOpen={onToggleOpen}
				displayMode={displayMode}
				onDisplayModeChange={onDisplayModeChange}
				onMouseDown={onMouseDown}
				isDragging={isDragging}
			/>

			<div className="flex flex-col flex-1 min-h-0">
				<ChatConversationBox
					messages={messages}
					onQuickMessage={onQuickMessage}
					onUseNode={onUseNode}
					onEditNode={onEditNode}
					onRefine={onRefine}
					onCheckResults={onCheckResults}
					scrollToTop={isGuidanceConversation}
					selectedNodes={selectedNodes}
				/>

				<ChatLoadingIndicator isLoading={isLoading} />

				<div className="select-text">
					<ChatInputBox
						onInputChange={onInputChange}
						onSendMessage={onSendMessage}
						isLoading={isLoading}
						isInteractionEnabled={isInteractionEnabled}
						contextMode={contextMode}
						onContextModeChange={onContextModeChange}
						availableNodes={availableNodes}
						onNodeSelect={onNodeSelect}
					/>
				</div>
			</div>

			{/* Resize handle */}
			<div
				className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize bg-gray-300 hover:bg-gray-400 transition-colors"
				style={{
					clipPath: "polygon(100% 0%, 0% 100%, 100% 100%)",
				}}
				onMouseDown={onResizeMouseDown}
				title={t("tech.drag_to_resize")}
			/>
		</div>
	)
}
