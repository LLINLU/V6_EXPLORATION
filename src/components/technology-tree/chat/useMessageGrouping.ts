import { useMemo } from "react"

export const useMessageGrouping = (
	messages: any[],
	isNodeCreation: boolean,
) => {
	// Group consecutive system messages from the same user
	const groupedMessages = useMemo(() => {
		return messages.reduce((acc: any[], message: any, index: number) => {
			// If it's the first message or user changes, create a new group
			if (index === 0 || messages[index - 1].isUser !== message.isUser) {
				acc.push({ ...message, isGroup: true })
			} else {
				// Otherwise concatenate to the content of the last message
				const lastMessage = acc[acc.length - 1]
				lastMessage.content = Array.isArray(lastMessage.content)
					? `${lastMessage.content.join("\n\n")}\n\n${message.content}`
					: `${lastMessage.content}\n\n${message.content}`
			}
			return acc
		}, [])
	}, [messages])

	// Filter out node suggestion messages if not in node creation mode
	const filteredMessages = useMemo(() => {
		return isNodeCreation
			? groupedMessages
			: groupedMessages.filter(
					(message) =>
						!(
							message.content?.includes(
								"了解しました — あなたの考えに合ったノードを一緒に作成しましょう",
							) || message.suggestion
						),
				)
	}, [groupedMessages, isNodeCreation])

	// Check if there are any substantive messages (excluding welcome messages)
	const hasSubstantiveMessages = useMemo(() => {
		return messages.some((m) => {
			if (!m.content) return false

			const isWelcomeMessage = m.content.includes(
				"何かお手伝いできることはありますか",
			)
			const isErrorMessage = m.content.includes(
				"申し訳ございませんが、現在応答を生成できません",
			)

			return (
				!m.isUser &&
				!isWelcomeMessage &&
				!isErrorMessage &&
				m.content.trim().length > 0
			)
		})
	}, [messages])

	return { filteredMessages, hasSubstantiveMessages }
}
