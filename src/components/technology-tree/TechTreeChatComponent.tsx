import type React from "react"
import { ChatBox } from "@/components/technology-tree/ChatBox"
import { useChatContext } from "@/hooks/tree/useChatContext"
import { useChatStore } from "@/stores/chatStore"
import { useTreeUIStore } from "@/stores/treeUIStore"
import type { NodeSuggestion } from "@/types/chat"
import type { ResearchPanelNodeData, SelectedNodeInfo } from "@/types/tree"

interface TechTreeChatComponentProps {
	onSendMessage: () => void
	onQuickMessage: (text: string) => void
	onUseNode: (suggestion: NodeSuggestion) => void
	onEditNode: (suggestion: NodeSuggestion) => void
	onRefine: (suggestion: NodeSuggestion) => void
	onNodeSelect: (node: {
		id: string
		title: string
		level: number
	}) => Promise<void>
	researchPanelNodeData: ResearchPanelNodeData | null
	selectedNodeInfo: SelectedNodeInfo
	isFullscreenMode?: boolean
	onClose?: () => void
}

const TechTreeChatComponent: React.FC<TechTreeChatComponentProps> = ({
	onSendMessage,
	onQuickMessage,
	onUseNode,
	onEditNode,
	onRefine,
	onNodeSelect,
	researchPanelNodeData,
	selectedNodeInfo,
	isFullscreenMode = false,
	onClose,
}) => {
	// Get chat data from store
	const chatStore = useChatStore()
	const { chatBoxOpen, toggleChatBoxOpen } = useTreeUIStore()
	const {
		chatMessages,
		isLoading,
		contextMode,
		chatDisplayMode,
		availableNodes,
		setContextMode,
		setChatDisplayMode,
	} = chatStore

	// Get nodeContext directly from useChatContext to avoid infinite loop
	const { nodeContext } = useChatContext({ contextMode })

	// In fullscreen mode, always show open (controlled by parent container)
	// In normal mode, use chatBoxOpen state
	const isChatPanelOpen = isFullscreenMode ? true : chatBoxOpen

	return (
		<ChatBox
			messages={chatMessages}
			isLoading={isLoading}
			onInputChange={chatStore.handleInputChange}
			onSendMessage={onSendMessage}
			onQuickMessage={onQuickMessage}
			onUseNode={onUseNode}
			onEditNode={onEditNode}
			onRefine={onRefine}
			isOpen={isChatPanelOpen}
			availableNodes={availableNodes}
			onNodeSelect={onNodeSelect}
			onToggleOpen={isFullscreenMode && onClose ? onClose : toggleChatBoxOpen}
			isInteractionEnabled={
				!!(researchPanelNodeData?.id || selectedNodeInfo.nodeId)
			}
			contextMode={contextMode}
			onContextModeChange={setContextMode}
			displayMode={isFullscreenMode ? "panel" : chatDisplayMode}
			onDisplayModeChange={setChatDisplayMode}
			selectedNodes={nodeContext?.selectedNodes || []}
		/>
	)
}

TechTreeChatComponent.displayName = "TechTreeChatComponent"

export { TechTreeChatComponent }
