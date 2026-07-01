import { useCallback, useEffect, useState } from "react"
import { useChatStore } from "@/stores/chatStore"
import { useTreeUIStore } from "@/stores/treeUIStore"

export const useFullscreenHandlers = () => {
	const [isFullscreenMode, setIsFullscreenMode] = useState(false)
	const { setClickedNode } = useChatStore()
	const { chatBoxOpen, toggleChatBoxOpen } = useTreeUIStore()

	const toggleFullscreenMode = useCallback(() => {
		setIsFullscreenMode((prev) => !prev)
	}, [])

	const exitFullscreenMode = useCallback(() => {
		if (isFullscreenMode) {
			setIsFullscreenMode(false)
		}
	}, [isFullscreenMode])

	const handleChatToggle = useCallback(() => {
		// Allow chat to toggle in fullscreen mode without exiting
		toggleChatBoxOpen()
	}, [toggleChatBoxOpen])

	// Side-effect: when entering fullscreen mode, if the (layout) chat box is
	// currently open we should close it. Use useEffect so this store update
	// happens after the render phase, avoiding React's warning about
	// setState during render.
	useEffect(() => {
		if (isFullscreenMode && chatBoxOpen) {
			// Close the layout chat when we enter fullscreen
			toggleChatBoxOpen()
		}
	}, [isFullscreenMode, chatBoxOpen, toggleChatBoxOpen])

	const onAiAssist = useCallback(
		(nodeId?: string, nodeTitle?: string) => {
			// Don't exit fullscreen mode - allow chat to work in fullscreen

			if (nodeId && nodeTitle) {
				setClickedNode(nodeId, nodeTitle)
			}

			// MindMapContainer already handles opening the chat, so don't interfere here
		},
		[setClickedNode],
	)

	return {
		isFullscreenMode,
		toggleFullscreenMode,
		exitFullscreenMode,
		handleChatToggle,
		onAiAssist,
	}
}
