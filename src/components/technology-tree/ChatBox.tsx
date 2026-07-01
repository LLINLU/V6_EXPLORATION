import React, { useCallback, useMemo, useState } from "react"
import type { ChatMessage, NodeSuggestion } from "@/types/chat"
import type { ChatDisplayMode, ContextMode, SelectedNode } from "@/types/tree"
import { ChatAskAIButton } from "./chat/ChatAskAIButton"
import { ChatOverlay } from "./chat/ChatOverlay"
import { ChatPanel } from "./chat/ChatPanel"
import { useDraggable } from "./chat/hooks/useDraggable"

interface ChatBoxProps {
	messages: ChatMessage[]
	isLoading?: boolean
	isInteractionEnabled?: boolean
	contextMode?: ContextMode
	onInputChange: (value: string) => void
	onSendMessage: () => void
	onQuickMessage: (text: string) => void
	onContextModeChange?: (mode: ContextMode) => void
	onUseNode?: (suggestion: NodeSuggestion) => void
	onEditNode?: (suggestion: NodeSuggestion) => void
	onRefine?: (suggestion: NodeSuggestion) => void
	onCheckResults?: () => void
	isOpen?: boolean
	onToggleOpen?: () => void
	displayMode?: ChatDisplayMode
	onDisplayModeChange?: (mode: ChatDisplayMode) => void
	selectedNodes?: SelectedNode[] // Multiple selected nodes
	availableNodes?: NodeSuggestion[] // Available nodes for @ mention
	onNodeSelect?: (node: NodeSuggestion) => void // Callback when node is selected via @
}

const ChatBoxComponent = ({
	messages = [],
	isLoading = false,
	isInteractionEnabled = true,
	contextMode = "papers",
	onInputChange,
	onSendMessage,
	onQuickMessage,
	onContextModeChange,
	onUseNode,
	onEditNode,
	onRefine,
	onCheckResults,
	isOpen: externalIsOpen,
	onToggleOpen,
	displayMode: externalDisplayMode,
	onDisplayModeChange,
	selectedNodes,
	availableNodes = [],
	onNodeSelect,
}: ChatBoxProps) => {
	const [internalIsOpen, setInternalIsOpen] = useState(false)
	const [internalDisplayMode, setInternalDisplayMode] =
		useState<ChatDisplayMode>("overlay")

	// Use external state if provided, otherwise use internal state
	const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
	const displayMode =
		externalDisplayMode !== undefined
			? externalDisplayMode
			: internalDisplayMode

	// Only log when displayMode is invalid or debugging needed
	if (displayMode !== "overlay" && displayMode !== "panel") {
		// console.log(
		// "[infinity] INVALID ChatBox displayMode - externalDisplayMode:",
		// externalDisplayMode,
		// "internalDisplayMode:",
		// internalDisplayMode,
		// "final displayMode:",
		// displayMode,
		// )
	}

	// Dragging functionality for overlay mode
	const {
		position,
		size,
		isDragging,
		elementRef,
		handleMouseDown,
		handleResizeMouseDown,
	} = useDraggable({
		initialPosition: { x: window.innerWidth - 420, y: 20 },
		initialSize: { width: 400, height: 600 },
		minWidth: 300,
		maxWidth: 800,
		minHeight: 400,
		maxHeight: 800,
	})

	// Check if this is a guidance conversation (contains guidance messages)
	const isGuidanceConversation = useMemo(
		() =>
			messages.some((message: ChatMessage) =>
				message.content?.includes("ツリーマップの使用方法を教えてください"),
			),
		[messages],
	)

	const toggleOpen = useCallback(() => {
		if (onToggleOpen) {
			onToggleOpen()
		} else {
			setInternalIsOpen((prev) => !prev)
		}
	}, [onToggleOpen])

	const handleDisplayModeChange = useCallback(
		(mode: ChatDisplayMode) => {
			if (onDisplayModeChange) {
				onDisplayModeChange(mode)
			} else {
				setInternalDisplayMode(mode)
			}
		},
		[onDisplayModeChange],
	)

	// Panel mode - return panel content directly
	if (displayMode === "panel" && isOpen) {
		return (
			<ChatPanel
				messages={messages}
				isLoading={isLoading}
				isInteractionEnabled={isInteractionEnabled}
				contextMode={contextMode}
				selectedNodes={selectedNodes}
				availableNodes={availableNodes}
				isGuidanceConversation={isGuidanceConversation}
				displayMode={displayMode}
				onToggleOpen={toggleOpen}
				onDisplayModeChange={handleDisplayModeChange}
				onInputChange={onInputChange}
				onSendMessage={onSendMessage}
				onQuickMessage={onQuickMessage}
				onContextModeChange={onContextModeChange}
				onNodeSelect={onNodeSelect}
				onUseNode={onUseNode}
				onEditNode={onEditNode}
				onRefine={onRefine}
				onCheckResults={onCheckResults}
			/>
		)
	}

	// Overlay mode or closed state
	return (
		<div data-chatbox className="z-50">
			{!isOpen ? (
				<ChatAskAIButton />
			) : displayMode === "overlay" ? (
				<ChatOverlay
					messages={messages}
					isLoading={isLoading}
					isInteractionEnabled={isInteractionEnabled}
					contextMode={contextMode}
					selectedNodes={selectedNodes}
					availableNodes={availableNodes}
					isGuidanceConversation={isGuidanceConversation}
					displayMode={displayMode}
					isDragging={isDragging}
					position={position}
					size={size}
					elementRef={elementRef}
					onToggleOpen={toggleOpen}
					onDisplayModeChange={handleDisplayModeChange}
					onMouseDown={handleMouseDown}
					onResizeMouseDown={handleResizeMouseDown}
					onInputChange={onInputChange}
					onSendMessage={onSendMessage}
					onQuickMessage={onQuickMessage}
					onContextModeChange={onContextModeChange}
					onNodeSelect={onNodeSelect}
					onUseNode={onUseNode}
					onEditNode={onEditNode}
					onRefine={onRefine}
					onCheckResults={onCheckResults}
				/>
			) : null}
		</div>
	)
}

// Export with React.memo for performance optimization
export const ChatBox = React.memo(ChatBoxComponent)
