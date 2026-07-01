import { useCallback } from "react"
import { useChatStore } from "@/stores/chatStore"
import type { ChatMessage } from "@/types/chat"
import type { NodeContext } from "@/types/tree"
import { callContextChat } from "../services/contextChatService"

export const useMessageHandlers = (nodeContext?: NodeContext) => {
	const {
		addChatMessage,
		setIsLoading,
		inputValue,
		setInputValue,
		mentionedNodes,
		clickedNode,
		resetSelectedNodesToCurrentNode,
	} = useChatStore()

	const handleGuidanceClick = useCallback((_type: string) => {
		// console.log("Guidance click:", type)
	}, [])

	const handleSendMessage = useCallback(async () => {
		const trimmedInput = inputValue.trim()
		if (!trimmedInput) {
			return
		}

		const userMessage: ChatMessage = {
			content: trimmedInput,
			isUser: true,
		}

		addChatMessage(userMessage)
		setInputValue("")

		setIsLoading(true)
		try {
			const aiResponseContent = await callContextChat(
				trimmedInput,
				nodeContext,
				[],
			)

			const aiResponse: ChatMessage = {
				content: aiResponseContent,
				isUser: false,
				type: "text",
				// Use mentioned nodes if available, otherwise use clicked node title
				nodeTitle: mentionedNodes.length > 0 ? undefined : clickedNode?.title,
				selectedNodes:
					mentionedNodes.length > 0
						? mentionedNodes
						: clickedNode
							? [clickedNode]
							: undefined,
			}

			addChatMessage(aiResponse)

			// Reset selected nodes after message is sent - keeps current node for next message if no mentions
			resetSelectedNodesToCurrentNode()
		} catch (error) {
			console.error("Failed to get AI response:", error)
		} finally {
			setIsLoading(false)
		}
	}, [
		inputValue,
		addChatMessage,
		setInputValue,
		setIsLoading,
		nodeContext,
		mentionedNodes,
		clickedNode,
		resetSelectedNodesToCurrentNode,
	])

	const handleSendQuickMessage = useCallback(
		async (text: string) => {
			const trimmedText = text.trim()
			if (!trimmedText) {
				return
			}

			const userMessage: ChatMessage = {
				content: trimmedText,
				isUser: true,
			}

			addChatMessage(userMessage)

			setIsLoading(true)
			try {
				const aiResponseContent = await callContextChat(
					trimmedText,
					nodeContext,
					[],
				)

				const aiResponse: ChatMessage = {
					content: aiResponseContent,
					isUser: false,
					type: "text",
					// Use mentioned nodes if available, otherwise use clicked node title
					nodeTitle: mentionedNodes.length > 0 ? undefined : clickedNode?.title,
					selectedNodes:
						mentionedNodes.length > 0
							? mentionedNodes
							: clickedNode
								? [clickedNode]
								: undefined,
				}

				addChatMessage(aiResponse)

				// Reset selected nodes after message is sent - keeps current node for next message if no mentions
				resetSelectedNodesToCurrentNode()
			} catch (error) {
				console.error("Failed to get AI response:", error)
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
		handleSendMessage,
		handleSendQuickMessage,
		handleGuidanceClick,
		handleSwitchToChat: () => {},
		initializeChat: () => {},
	}
}
