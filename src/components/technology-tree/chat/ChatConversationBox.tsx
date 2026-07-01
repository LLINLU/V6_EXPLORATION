import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { ChatMessage, NodeSuggestion } from "@/types/chat"
import type { SelectedNode } from "@/types/tree"
import { MessagesList } from "./MessagesList"
import { useMessageGrouping } from "./useMessageGrouping"
import { WelcomeMessage } from "./WelcomeMessage"

interface ChatConversationBoxProps {
	messages: ChatMessage[]
	onQuickMessage: (text: string) => void
	onUseNode?: (suggestion: NodeSuggestion) => void
	onEditNode?: (suggestion: NodeSuggestion) => void
	onRefine?: (suggestion: NodeSuggestion) => void
	onCheckResults?: () => void
	scrollToTop?: boolean
	selectedNodes?: SelectedNode[]
}

export const ChatConversationBox = ({
	messages,
	onQuickMessage,
	onUseNode,
	onEditNode,
	onRefine,
	onCheckResults,
	scrollToTop = false,
	selectedNodes,
}: ChatConversationBoxProps) => {
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const navigate = useNavigate()
	const [isAtBottom, setIsAtBottom] = useState(true)
	const [hasScrolledManually, setHasScrolledManually] = useState(false)

	// Custom hooks
	const { filteredMessages } = useMessageGrouping(messages, false)

	// Function to check if user is at bottom
	const checkIfAtBottom = () => {
		if (!scrollContainerRef.current) return true

		const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
		const threshold = 100 // pixels from bottom
		return scrollHeight - scrollTop - clientHeight < threshold
	}

	// Function to scroll to bottom
	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
		setIsAtBottom(true)
	}, [])

	// Function to scroll to top
	const scrollToTopFn = useCallback(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" })
			setIsAtBottom(false)
		}
	}, [])

	// Handle scroll events with throttling for better performance
	const handleScroll = useRef<(() => void) | null>(null)

	if (!handleScroll.current) {
		handleScroll.current = () => {
			requestAnimationFrame(() => {
				const atBottom = checkIfAtBottom()
				setIsAtBottom(atBottom)

				// Mark that user has manually scrolled if they're not at bottom
				if (!atBottom) {
					setHasScrolledManually(true)
				}
			})
		}
	}

	// Initial scroll behavior and scroll on new messages
	useEffect(() => {
		// For initial load with guidance messages
		if (scrollToTop && !hasScrolledManually && messages.length > 0) {
			setTimeout(() => scrollToTopFn(), 100)
			return
		}

		// Only auto-scroll to bottom if user is at bottom or hasn't scrolled manually
		if (isAtBottom || !hasScrolledManually) {
			setTimeout(() => scrollToBottom(), 100)
		}
	}, [
		hasScrolledManually,
		isAtBottom,
		messages,
		scrollToTop,
		scrollToBottom,
		scrollToTopFn,
	])

	// Add scroll event listener
	useEffect(() => {
		const container = scrollContainerRef.current
		if (container && handleScroll.current) {
			container.addEventListener("scroll", handleScroll.current)
			return () => {
				if (handleScroll.current) {
					container.removeEventListener("scroll", handleScroll.current)
				}
			}
		}
	}, [])

	// Handle button click to navigate to technology tree or call the provided handler
	const handleCheckResults = () => {
		if (onCheckResults) {
			onCheckResults()
		} else {
			// If no handler provided, navigate directly
			navigate("/technology-tree")
		}
	}

	return (
		<div
			className="flex-1 overflow-y-auto bg-white relative"
			ref={scrollContainerRef}
		>
			<WelcomeMessage
				onQuickMessage={onQuickMessage}
				selectedNodes={selectedNodes}
			/>

			{/* Display all filtered messages */}
			<MessagesList
				messages={filteredMessages}
				onUseNode={onUseNode}
				onEditNode={onEditNode}
				onRefine={onRefine}
				handleCheckResults={handleCheckResults}
			/>

			{/* Invisible div to scroll to */}
			<div ref={messagesEndRef} />
		</div>
	)
}
