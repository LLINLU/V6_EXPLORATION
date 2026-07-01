import type React from "react"
import type { ChatMessage, NodeSuggestion } from "@/types/chat"
import type { ChatDisplayMode, ContextMode, SelectedNode } from "@/types/tree"
import { ChatConversationBox } from "./ChatConversationBox"
import { ChatHeader } from "./ChatHeader"
import { ChatInputBox } from "./ChatInputBox"
import { ChatLoadingIndicator } from "./ChatLoadingIndicator"

interface ChatPanelProps {
	messages: ChatMessage[]
	isLoading: boolean
	isInteractionEnabled: boolean
	contextMode: ContextMode
	selectedNodes?: SelectedNode[]
	availableNodes: NodeSuggestion[]
	isGuidanceConversation: boolean
	displayMode: ChatDisplayMode
	onToggleOpen: () => void
	onDisplayModeChange: (mode: ChatDisplayMode) => void
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

export const ChatPanel: React.FC<ChatPanelProps> = ({
	messages,
	isLoading,
	isInteractionEnabled,
	contextMode,
	selectedNodes,
	availableNodes,
	isGuidanceConversation,
	displayMode,
	onToggleOpen,
	onDisplayModeChange,
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
	return (
		<div
			className="h-full flex flex-col overflow-hidden"
			style={{ backgroundColor: "#f9fafb" }}
			data-panel
		>
			<ChatHeader
				toggleOpen={onToggleOpen}
				displayMode={displayMode}
				onDisplayModeChange={onDisplayModeChange}
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
	)
}
