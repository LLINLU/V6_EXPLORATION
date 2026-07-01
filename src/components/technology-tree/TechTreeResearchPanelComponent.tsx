import type React from "react"
import { TechTreeSidebar } from "@/components/technology-tree/TechTreeSidebar"
import { useChatStore } from "@/stores/chatStore"
import { useTreeUIStore } from "@/stores/treeUIStore"
import type { NodeSuggestion } from "@/types/chat"
import type { ResearchPanelNodeData, SelectedNodeInfo } from "@/types/tree"

interface TechTreeResearchPanelComponentProps {
	// Essential props that cannot be obtained from stores
	onSendMessage: () => void
	onUseNode: (suggestion: NodeSuggestion) => void
	onEditNode?: (suggestion: NodeSuggestion) => void
	onRefine?: (suggestion: NodeSuggestion) => void
	onCheckResults?: () => void
	onChatToggle?: () => void
	researchPanelNodeData: ResearchPanelNodeData | null
	selectedNodeInfo: SelectedNodeInfo
	selectedPath?: {
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
	// Fullscreen mode props
	isFullscreenMode?: boolean
	onClose?: () => void
}

export const TechTreeResearchPanelComponent: React.FC<
	TechTreeResearchPanelComponentProps
> = ({
	onSendMessage,
	onUseNode,
	onEditNode,
	onRefine,
	onCheckResults,
	onChatToggle,
	researchPanelNodeData,
	selectedNodeInfo,
	selectedPath,
	isFullscreenMode = false,
	onClose,
}) => {
	// Get UI state from store
	const { sidebarTab, setSidebarTab, toggleSidebar, isExpanded, toggleExpand } =
		useTreeUIStore()

	// Get chat data from store
	const { chatMessages, inputValue, handleInputChange } = useChatStore()

	return (
		<TechTreeSidebar
			sidebarTab={sidebarTab}
			setSidebarTab={setSidebarTab}
			toggleSidebar={isFullscreenMode && onClose ? onClose : toggleSidebar}
			isExpanded={isExpanded}
			toggleExpand={toggleExpand}
			chatMessages={chatMessages}
			inputValue={inputValue}
			onInputChange={handleInputChange}
			onSendMessage={onSendMessage}
			onUseNode={onUseNode}
			onEditNode={onEditNode}
			onRefine={onRefine}
			onCheckResults={onCheckResults}
			onChatToggle={onChatToggle}
			selectedNodeTitle={researchPanelNodeData?.title || selectedNodeInfo.title}
			selectedNodeDescription={
				researchPanelNodeData?.description || selectedNodeInfo.description
			}
			selectedNodeId={researchPanelNodeData?.id || selectedNodeInfo.nodeId}
			selectedPath={selectedPath}
			isInteractionEnabled={
				!!(researchPanelNodeData?.id || selectedNodeInfo.nodeId)
			}
			isFullscreenMode={isFullscreenMode}
		/>
	)
}
