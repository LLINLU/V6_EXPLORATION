import React, { useCallback, useEffect, useState } from "react"
import { useDraggable } from "@/components/technology-tree/chat/hooks/useDraggable"
import type { ScenarioChatDisplayMode } from "./ScenarioChatHeader"
import { ScenarioChatOverlay } from "./ScenarioChatOverlay"
import { ScenarioChatPanel } from "./ScenarioChatPanel"

interface ScenarioChatBoxProps {
	isOpen: boolean
	onToggleOpen: () => void
	displayMode?: ScenarioChatDisplayMode
	onDisplayModeChange?: (mode: ScenarioChatDisplayMode) => void
	children?: React.ReactNode
}

const ScenarioChatBoxComponent = ({
	isOpen,
	onToggleOpen,
	displayMode: externalDisplayMode,
	onDisplayModeChange,
	children,
}: ScenarioChatBoxProps) => {
	const [internalDisplayMode, setInternalDisplayMode] =
		useState<ScenarioChatDisplayMode>("panel")
	const [isClient, setIsClient] = useState(false)

	// Handle SSR - only render on client
	useEffect(() => {
		setIsClient(true)
	}, [])

	// Use external state if provided, otherwise use internal state
	const displayMode =
		externalDisplayMode !== undefined
			? externalDisplayMode
			: internalDisplayMode

	// Dragging functionality for overlay mode
	const {
		position,
		size,
		isDragging,
		elementRef,
		handleMouseDown,
		handleResizeMouseDown,
	} = useDraggable({
		initialPosition: {
			x: typeof window !== "undefined" ? window.innerWidth - 420 : 0,
			y: 80,
		},
		initialSize: { width: 400, height: 500 },
		minWidth: 300,
		maxWidth: 800,
		minHeight: 400,
		maxHeight: 800,
	})

	const handleDisplayModeChange = useCallback(
		(mode: ScenarioChatDisplayMode) => {
			if (onDisplayModeChange) {
				onDisplayModeChange(mode)
			} else {
				setInternalDisplayMode(mode)
			}
		},
		[onDisplayModeChange],
	)

	// Don't render if not open or not on client
	if (!isOpen || !isClient) {
		return null
	}

	// Panel mode - return panel content directly
	if (displayMode === "panel") {
		return (
			<ScenarioChatPanel
				displayMode={displayMode}
				onToggleOpen={onToggleOpen}
				onDisplayModeChange={handleDisplayModeChange}
			>
				{children}
			</ScenarioChatPanel>
		)
	}

	// Overlay mode
	return (
		<div data-scenario-chatbox className="z-50">
			<ScenarioChatOverlay
				displayMode={displayMode}
				isDragging={isDragging}
				position={position}
				size={size}
				elementRef={elementRef as React.RefObject<HTMLDivElement>}
				onToggleOpen={onToggleOpen}
				onDisplayModeChange={handleDisplayModeChange}
				onMouseDown={handleMouseDown}
				onResizeMouseDown={handleResizeMouseDown}
			>
				{children}
			</ScenarioChatOverlay>
		</div>
	)
}

// Export with React.memo for performance optimization
export const ScenarioChatBox = React.memo(ScenarioChatBoxComponent)
