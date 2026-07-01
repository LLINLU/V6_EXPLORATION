import { useCallback, useRef, useState } from "react"
import type { NodeSuggestion } from "@/types/chat"

interface UseMentionLogicProps {
	availableNodes: NodeSuggestion[]
	onNodeSelect?: (node: NodeSuggestion) => void
	onInputChange: (value: string) => void
}

export const useMentionLogic = ({
	availableNodes,
	onNodeSelect,
	onInputChange,
}: UseMentionLogicProps) => {
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
	const [mentionQuery, setMentionQuery] = useState("")
	const [mentionStartPos, setMentionStartPos] = useState(-1)
	const [justSelectedNode, setJustSelectedNode] = useState(false)

	const [hasMentions, setHasMentions] = useState(false)

	const editableRef = useRef<HTMLDivElement>(null)

	// Get plain text content from contentEditable
	const getTextContent = useCallback(() => {
		if (!editableRef.current) return ""
		return editableRef.current.textContent || ""
	}, [])

	// Get current cursor position
	const getCursorPosition = useCallback(() => {
		const selection = window.getSelection()
		if (!selection?.rangeCount || !editableRef.current) return 0

		const range = selection.getRangeAt(0)
		const preCaretRange = range.cloneRange()
		preCaretRange.selectNodeContents(editableRef.current)
		preCaretRange.setEnd(range.endContainer, range.endOffset)
		return preCaretRange.toString().length
	}, [])

	// Check if cursor is next to a mention element
	const isCursorNextToMention = useCallback(() => {
		const selection = window.getSelection()
		if (!selection?.rangeCount || !editableRef.current) return false

		const range = selection.getRangeAt(0)
		const container = range.startContainer
		const offset = range.startOffset

		// Check if cursor is immediately after a mention
		if (container.nodeType === Node.ELEMENT_NODE) {
			const childNodes = Array.from(container.childNodes)
			const nodeBefore = childNodes[offset - 1]
			if (
				nodeBefore &&
				(nodeBefore as HTMLElement).classList?.contains("mention-node")
			) {
				return true
			}
		}

		// Check if cursor is at the beginning of text node that follows a mention
		if (container.nodeType === Node.TEXT_NODE && offset === 0) {
			const previousSibling = container.previousSibling
			if (
				previousSibling &&
				(previousSibling as HTMLElement).classList?.contains("mention-node")
			) {
				return true
			}
		}

		// Check if cursor is inside or immediately after a mention element
		if (
			container.parentNode &&
			(container.parentNode as HTMLElement).classList?.contains("mention-node")
		) {
			return true
		}

		return false
	}, [])

	// Check for mention trigger
	const checkForMention = useCallback(() => {
		if (justSelectedNode) {
			return
		}

		// Don't trigger mention if cursor is next to existing mention
		if (isCursorNextToMention()) {
			setShowSuggestions(false)
			return
		}

		const textContent = getTextContent()
		const cursorPos = getCursorPosition()
		const textBeforeCursor = textContent.substring(0, cursorPos)
		const lastAtIndex = textBeforeCursor.lastIndexOf("@")

		if (lastAtIndex !== -1) {
			const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)

			if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
				setMentionStartPos(lastAtIndex)
				setMentionQuery(textAfterAt)

				// Show suggestions if nodes are available
				setShowSuggestions(availableNodes.length > 0)
				setSelectedSuggestionIndex(0)
			} else {
				setShowSuggestions(false)
			}
		} else {
			setShowSuggestions(false)
		}
	}, [
		getTextContent,
		getCursorPosition,
		availableNodes,
		justSelectedNode,
		isCursorNextToMention,
	])

	// Convert HTML content to plain text for external consumption
	const convertToPlainText = useCallback(() => {
		if (!editableRef.current) return ""

		let text = ""
		const nodes = Array.from(editableRef.current.childNodes)

		nodes.forEach((node, index) => {
			if (node.nodeType === Node.TEXT_NODE) {
				text += node.textContent
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const element = node as HTMLElement
				if (element.classList.contains("mention-node")) {
					text += element.textContent // Already includes the @

					// Add space after mention if the next node is not a text node starting with space
					// or if this is the last node
					const nextNode = nodes[index + 1]
					if (
						!nextNode ||
						(nextNode.nodeType === Node.TEXT_NODE &&
							!nextNode.textContent?.startsWith(" ")) ||
						nextNode.nodeType !== Node.TEXT_NODE
					) {
						text += " "
					}
				} else {
					text += element.textContent
				}
			}
		})

		return text.trim() // Remove trailing space if it's at the end
	}, [])

	// Handle node selection
	const handleNodeSelect = useCallback(
		(node: NodeSuggestion) => {
			if (!editableRef.current || mentionStartPos === -1) {
				return
			}

			const selection = window.getSelection()
			const range = document.createRange()

			// Find the text node containing the mention
			const walker = document.createTreeWalker(
				editableRef.current,
				NodeFilter.SHOW_TEXT,
				null,
			)

			let currentPos = 0
			let textNode: Text | null = null
			let nodeStartPos = 0

			textNode = walker.nextNode() as Text
			while (textNode) {
				const nodeLength = textNode.textContent?.length || 0
				if (
					currentPos <= mentionStartPos &&
					mentionStartPos < currentPos + nodeLength
				) {
					nodeStartPos = currentPos
					break
				}
				currentPos += nodeLength
				textNode = walker.nextNode() as Text
			}

			if (textNode) {
				// Calculate positions within the text node
				const startInNode = mentionStartPos - nodeStartPos
				const endInNode = startInNode + mentionQuery.length + 1 // +1 for the '@'

				// Create mention element
				const mentionElement = document.createElement("span")
				mentionElement.className = "mention-node mention-highlight"
				mentionElement.contentEditable = "false"
				mentionElement.setAttribute("data-node-id", node.id)
				mentionElement.textContent = `@${node.title}`

				// Split text node and insert mention
				const beforeText = textNode.textContent?.substring(0, startInNode) || ""
				const afterText = textNode.textContent?.substring(endInNode) || ""

				const beforeTextNode = document.createTextNode(beforeText)
				// Add space after mention for easier typing
				const spaceAfterMention = document.createTextNode(" ")
				const afterTextNode = document.createTextNode(afterText)

				// Replace the text node with new structure
				const parent = textNode.parentNode!
				parent.insertBefore(beforeTextNode, textNode)
				parent.insertBefore(mentionElement, textNode)
				parent.insertBefore(spaceAfterMention, textNode)
				parent.insertBefore(afterTextNode, textNode)
				parent.removeChild(textNode)

				// Position cursor after the space following the mention
				range.setStart(spaceAfterMention, 1)
				range.setEnd(spaceAfterMention, 1)
				selection?.removeAllRanges()
				selection?.addRange(range)
			}

			// Call the node select callback
			if (onNodeSelect) {
				onNodeSelect(node)
			}

			setShowSuggestions(false)
			setJustSelectedNode(true)

			// Update parent component
			setTimeout(() => {
				const plainText = convertToPlainText()
				onInputChange(plainText)
			}, 0)
		},
		[
			mentionStartPos,
			mentionQuery,
			onNodeSelect,
			onInputChange,
			convertToPlainText,
		],
	)

	// Clear input content
	const clearInput = useCallback(() => {
		if (editableRef.current) {
			editableRef.current.innerHTML = ""
			setHasMentions(false)

			// Clear node selection when input is cleared
			// Note: onNodeSelect expects a valid node object, so we skip calling it with null

			// Update parent component
			onInputChange("")
		}
	}, [onInputChange])

	// Update has mentions state
	const updateHasMentions = useCallback(() => {
		const currentMentions =
			editableRef.current?.querySelectorAll(".mention-node") || []
		const containsMentions = currentMentions.length > 0
		setHasMentions(containsMentions)

		// If all mentions were removed, notify parent to clear selection
		if (!containsMentions && hasMentions && onNodeSelect) {
			// Clear the node selection by calling with null
			onNodeSelect(null as any)
		}
	}, [hasMentions, onNodeSelect])

	return {
		// State
		showSuggestions,
		selectedSuggestionIndex,
		mentionQuery,
		hasMentions,

		// Refs
		editableRef,

		// Methods
		getTextContent,
		getCursorPosition,
		checkForMention,
		convertToPlainText,
		handleNodeSelect,
		clearInput,
		updateHasMentions,

		// Setters
		setShowSuggestions,
		setSelectedSuggestionIndex,
		setJustSelectedNode,
	}
}
