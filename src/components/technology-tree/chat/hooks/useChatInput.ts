import { useCallback, useState } from "react"
import type { NodeSuggestion } from "@/types/chat"

interface UseChatInputProps {
	onSendMessage: () => void
	onInputChange: (value: string) => void
	isMentionSearching?: boolean
	isLoading: boolean
	isInteractionEnabled: boolean
	// Mention-related props
	showSuggestions: boolean
	availableNodes: NodeSuggestion[]
	selectedSuggestionIndex: number
	setSelectedSuggestionIndex: (index: number) => void
	setShowSuggestions: (show: boolean) => void
	setJustSelectedNode: (value: boolean) => void
	getTextContent: () => string
	clearInput: () => void
	updateHasMentions: () => void
	getCursorPosition: () => number
	checkForMention: () => void
	convertToPlainText: () => string
}

export const useChatInput = ({
	onSendMessage,
	onInputChange,
	isMentionSearching = false,
	isLoading,
	isInteractionEnabled,
	showSuggestions,
	availableNodes,
	selectedSuggestionIndex,
	setSelectedSuggestionIndex,
	setShowSuggestions,
	setJustSelectedNode,
	getTextContent,
	clearInput,
	updateHasMentions,
	getCursorPosition,
	checkForMention,
	convertToPlainText,
}: UseChatInputProps) => {
	const [isComposing, setIsComposing] = useState(false)

	// Helper to count displayed items (for keyboard navigation)
	const getDisplayedItemsCount = useCallback(() => {
		// This should match the logic in MentionDropdown
		return availableNodes.length
	}, [availableNodes])

	// Handle input changes
	const handleInput = useCallback(
		(e: React.FormEvent<HTMLDivElement>) => {
			const plainText = convertToPlainText()

			const target = e.currentTarget
			if (!plainText.trim() && target.innerHTML !== "") {
				target.innerHTML = ""
			}

			updateHasMentions()

			onInputChange(plainText)

			// Clear justSelectedNode flag on any input to prevent double mentions
			setJustSelectedNode(false)

			// Check for mentions
			checkForMention()
		},
		[
			onInputChange,
			convertToPlainText,
			updateHasMentions,
			setJustSelectedNode,
			checkForMention,
		],
	) // Most functions are from refs and should be stable

	// Handle keyboard navigation for suggestions
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (showSuggestions && availableNodes.length > 0) {
				if (e.key === "ArrowDown") {
					e.preventDefault()
					const displayedItems = getDisplayedItemsCount()
					const newIndex =
						selectedSuggestionIndex < displayedItems - 1
							? selectedSuggestionIndex + 1
							: 0
					setSelectedSuggestionIndex(newIndex)
				} else if (e.key === "ArrowUp") {
					e.preventDefault()
					const displayedItems = getDisplayedItemsCount()
					const newIndex =
						selectedSuggestionIndex > 0
							? selectedSuggestionIndex - 1
							: displayedItems - 1
					setSelectedSuggestionIndex(newIndex)
				} else if (e.key === "Enter" || e.key === "Tab") {
					e.preventDefault()
					// The MentionDropdown will handle the selection based on selectedIndex
					const dropdown = document.querySelector(
						`.mention-dropdown-item-${selectedSuggestionIndex}`,
					)
					if (dropdown) {
						;(dropdown as HTMLElement).click()
					}
				} else if (e.key === "Escape") {
					e.preventDefault()
					setShowSuggestions(false)
				}
			} else if (e.key === "Enter") {
				if (e.shiftKey) {
					// Allow Shift+Enter for line breaks, reset justSelectedNode flag
					setJustSelectedNode(false)
				} else {
					// Handle regular Enter for sending message
					e.preventDefault()
					if (!isComposing && !isMentionSearching) {
						const textContent = getTextContent()
						if (textContent.trim()) {
							onSendMessage()
							clearInput()
						}
					} else {
						setJustSelectedNode(false)
					}
				}
			} else if (e.key === "Backspace") {
				// Handle mention deletion with more precise cursor detection
				const selection = window.getSelection()
				if (selection?.rangeCount && selection.isCollapsed) {
					const range = selection.getRangeAt(0)
					const cursorPos = getCursorPosition()

					// Only delete mention if cursor is at the very beginning of the line/text
					// OR if cursor is immediately after a mention with no text between
					if (cursorPos === 0) return // Let browser handle normal deletion

					// Check if we're immediately after a mention
					const container = range.startContainer
					const offset = range.startOffset

					// If cursor is at the beginning of a text node and previous sibling is mention
					if (container.nodeType === Node.TEXT_NODE && offset === 0) {
						const previousSibling = container.previousSibling
						if (
							previousSibling &&
							(previousSibling as HTMLElement).classList?.contains(
								"mention-node",
							)
						) {
							e.preventDefault()
							previousSibling.remove()
							// Trigger a synthetic input event
							const syntheticEvent = new Event("input", { bubbles: true })
							Object.defineProperty(syntheticEvent, "currentTarget", {
								value: e.currentTarget,
								writable: false,
							})
							handleInput(syntheticEvent as any)
							return
						}
					}

					// If cursor is in an empty text node after a mention
					if (
						container.nodeType === Node.TEXT_NODE &&
						container.textContent === "" &&
						container.previousSibling &&
						(container.previousSibling as HTMLElement).classList?.contains(
							"mention-node",
						)
					) {
						e.preventDefault()
						container.previousSibling.remove()
						// Trigger a synthetic input event
						const syntheticEvent = new Event("input", { bubbles: true })
						Object.defineProperty(syntheticEvent, "currentTarget", {
							value: e.currentTarget,
							writable: false,
						})
						handleInput(syntheticEvent as any)
						return
					}

					// If cursor is immediately after a mention element (no text node between)
					if (container.nodeType === Node.ELEMENT_NODE) {
						const childNodes = Array.from(container.childNodes)
						const nodeBeforeCursor = childNodes[offset - 1]

						if (
							nodeBeforeCursor &&
							(nodeBeforeCursor as HTMLElement).classList?.contains(
								"mention-node",
							)
						) {
							// Check if there's no text between cursor and mention
							const textAfterMention = childNodes[offset]
							if (
								!textAfterMention ||
								(textAfterMention.nodeType === Node.TEXT_NODE &&
									textAfterMention.textContent === "")
							) {
								e.preventDefault()
								nodeBeforeCursor.remove()
								// Trigger a synthetic input event
								const syntheticEvent = new Event("input", { bubbles: true })
								Object.defineProperty(syntheticEvent, "currentTarget", {
									value: e.currentTarget,
									writable: false,
								})
								handleInput(syntheticEvent as any)
								return
							}
						}
					}

					// For all other cases, let the browser handle normal backspace
				}
			}
		},
		[
			showSuggestions,
			availableNodes,
			selectedSuggestionIndex,
			getDisplayedItemsCount,
			onSendMessage,
			isComposing,
			isMentionSearching,
			clearInput,
			getCursorPosition,
			getTextContent,
			handleInput,
			setJustSelectedNode,
			setSelectedSuggestionIndex,
			setShowSuggestions,
		],
	) // Removed functions that should be stable from refs

	// Handle form submission
	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			const textContent = getTextContent()
			if (
				!isLoading &&
				!isMentionSearching &&
				textContent.trim() &&
				isInteractionEnabled
			) {
				onSendMessage()
				clearInput()
			}
		},
		[
			isLoading,
			isMentionSearching,
			isInteractionEnabled,
			onSendMessage,
			clearInput,
			getTextContent,
		],
	) // Functions from refs should be stable

	return {
		isComposing,
		setIsComposing,
		handleInput,
		handleKeyDown,
		handleSubmit,
	}
}
