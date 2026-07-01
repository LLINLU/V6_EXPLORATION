import { useCallback, useState } from "react"
import { useChatStore } from "@/stores/chatStore"
import type { ChatMessage, NodeSuggestion } from "@/types/chat"
import type { PathLevel } from "@/types/tree"

export const useTechTreeSidebarActions = (
	addCustomNode: (level: PathLevel, suggestion: NodeSuggestion) => void,
	setSidebarTab: (tab: string) => void,
) => {
	const { addChatMessage } = useChatStore()
	const [isExpanded, setIsExpanded] = useState(false)

	const toggleExpand = () => {
		setIsExpanded(!isExpanded)
	}

	const handleCheckResults = useCallback(() => {
		// console.log("Check Results button clicked, switching to result tab")
		setSidebarTab("result")

		// Also trigger a refresh of the papers
		const refreshEvent = new CustomEvent("refresh-papers", {
			detail: { source: "checkResults", timestamp: Date.now() },
		})
		document.dispatchEvent(refreshEvent)
	}, [setSidebarTab])

	const handleUseNode = useCallback(
		(suggestion: NodeSuggestion) => {
			if (!suggestion) return

			const findLevel = (messages: ChatMessage[]): PathLevel => {
				// Try to find a message that mentions a level
				for (const message of messages) {
					const levelMatch = message.content?.match(/Level (\d+)/i)
					if (levelMatch) {
						const levelNum = levelMatch[1]
						return `level${levelNum}` as PathLevel
					}
				}
				return "level2" // Default to level2 if no specific level found
			}

			const { chatMessages } = useChatStore.getState()
			const level = findLevel(chatMessages)
			// console.log(`Adding custom node to ${level}:`, suggestion)
			addCustomNode(level, suggestion)

			addChatMessage({
				content: "ノードが追加されました 😊",
				isUser: false,
				showCheckResults: true,
			})
		},
		[addChatMessage, addCustomNode],
	) // TEMPORARY: Empty to fix infinite loop

	const findLevel = useCallback((messages: ChatMessage[]): PathLevel => {
		// Try to find a message that mentions a level
		for (const message of messages) {
			const levelMatch = message.content?.match(/Level (\d+)/i)
			if (levelMatch) {
				const levelNum = levelMatch[1]
				return `level${levelNum}` as PathLevel
			}
		}
		return "level2" // Default to level2 if no specific level found
	}, [])

	const handleEditNodeFromChat = useCallback(
		(suggestion: NodeSuggestion) => {
			if (!suggestion) return

			const { chatMessages } = useChatStore.getState()
			const level = findLevel(chatMessages)
			addCustomNode(level, suggestion)
		},
		[addCustomNode, findLevel],
	) // TEMPORARY: Empty to fix infinite loop

	const handleRefineNode = useCallback(
		(suggestion: NodeSuggestion) => {
			if (!suggestion) return

			// Add more detailed prompt for refinement
			addChatMessage({
				content: `このノードをさらに改良するのをお手伝いします。「${suggestion.title}」についてどの側面をより詳しく説明したいですか？`,
				isUser: false,
			})
		},
		[
			// Add more detailed prompt for refinement
			addChatMessage,
		],
	) // handleRefineNode doesn't need dependencies as it only appends to messages

	return {
		isExpanded,
		toggleExpand,
		handleCheckResults,
		handleUseNode,
		handleEditNodeFromChat,
		handleRefineNode,
	}
}
