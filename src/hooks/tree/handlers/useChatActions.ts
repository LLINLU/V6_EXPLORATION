import { useCallback } from "react"
import { useChatStore } from "@/stores/chatStore"
import type { NodeContext } from "@/types/tree"
// Removed unused import
import { callContextChat } from "../services/contextChatService"

export const useChatActions = (nodeContext?: NodeContext) => {
	const {
		addChatMessage,
		setIsLoading,
		mentionedNodes,
		clickedNode,
		resetSelectedNodesToCurrentNode,
	} = useChatStore()

	const handleButtonClick = useCallback(
		async (action: string, levelNumber?: string) => {
			setIsLoading(true)

			try {
				let userMessage = ""
				let systemMessage = ""

				if (action === "send-message") {
					userMessage = levelNumber || ""
					systemMessage = userMessage
				}

				// Add user message first
				if (userMessage) {
					addChatMessage({
						content: userMessage,
						isUser: true,
						type: "text",
					})
				}
				const response = await callContextChat(systemMessage, nodeContext, [])

				// Add AI response
				addChatMessage({
					type: "text",
					content: response,
					isUser: false,
					// Use mentioned nodes if available, otherwise use clicked node title
					nodeTitle: mentionedNodes.length > 0 ? undefined : clickedNode?.title,
					selectedNodes:
						mentionedNodes.length > 0
							? mentionedNodes
							: clickedNode
								? [clickedNode]
								: undefined,
				})

				// Reset selected nodes after message is sent - keeps current node for next message if no mentions
				resetSelectedNodesToCurrentNode()
			} finally {
				setIsLoading(false)
			}
		},
		[
			addChatMessage,
			setIsLoading,
			nodeContext,
			mentionedNodes,
			clickedNode,
			resetSelectedNodesToCurrentNode,
		],
	)

	return {
		handleButtonClick,
	}
}
