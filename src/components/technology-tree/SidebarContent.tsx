import type { ChatMessage, NodeSuggestion } from "@/types/chat"
import { ChatConversation } from "./ChatConversation"
import { ChatInput } from "./ChatInput"
import { SearchResults } from "./SearchResults"

interface SidebarContentProps {
	sidebarTab: string
	chatMessages: ChatMessage[]
	inputValue: string
	isInteractionEnabled?: boolean
	onInputChange: (value: string) => void
	onSendMessage?: () => void
	onUseNode?: (suggestion: NodeSuggestion) => void
	onEditNode?: (suggestion: NodeSuggestion) => void
	onRefine?: (suggestion: NodeSuggestion) => void
	onCheckResults?: () => void
	selectedNodeTitle?: string | null
	selectedNodeDescription?: string | null
	selectedNodeId?: string | null
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
	activeTab: string
	onTabChange: (value: string) => void
	level?: number
	mode?: "TED" | "FAST"
	onChatToggle?: () => void
	saved_paper_ids: string[]
	saved_case_ids: string[]
	totalPatentsCount?: number
}

export const SidebarContent = ({
	sidebarTab,
	chatMessages,
	inputValue,
	isInteractionEnabled = true,
	onInputChange,
	onSendMessage,
	onUseNode,
	onEditNode,
	onRefine,
	onCheckResults,
	selectedNodeTitle,
	selectedNodeDescription,
	selectedNodeId,

	activeTab,
	onTabChange,
	level,
	mode = "TED",
	onChatToggle,
	saved_paper_ids,
	saved_case_ids,
	totalPatentsCount,
}: SidebarContentProps) => {
	if (sidebarTab === "chat") {
		return (
			<div className="h-full flex flex-col">
				<ChatConversation
					chatMessages={chatMessages}
					onUseNode={onUseNode}
					onEditNode={onEditNode}
					onRefine={onRefine}
					onCheckResults={onCheckResults}
				/>
				<ChatInput
					value={inputValue}
					onChange={onInputChange}
					onSend={onSendMessage}
					isInteractionEnabled={isInteractionEnabled}
				/>
			</div>
		)
	}

	// Always show SearchResults, but pass real data when a node is selected
	return (
		<div className="h-full flex flex-col">
			<SearchResults
				selectedNodeTitle={selectedNodeTitle || undefined}
				selectedNodeDescription={selectedNodeDescription || undefined}
				selectedNodeId={selectedNodeId || undefined}
				activeTab={activeTab}
				onTabChange={onTabChange}
				level={level}
				mode={mode}
				onChatToggle={onChatToggle}
				saved_paper_ids={saved_paper_ids}
				saved_case_ids={saved_case_ids}
				totalPatentsCount={totalPatentsCount}
			/>
		</div>
	)
}
