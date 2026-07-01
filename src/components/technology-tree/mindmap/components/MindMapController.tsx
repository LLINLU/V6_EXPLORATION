import type React from "react"
import { useEffect, useRef } from "react"
import { useMindMapData } from "../hooks/useMindMapData"
import { useMindMapEvents } from "../hooks/useMindMapEvents"
import { useMindMapRendering } from "../hooks/useMindMapRendering"
import { useMindMap } from "../MindMapContext"
import { MindMapRenderer } from "./MindMapRenderer"

interface EventCallbacks {
	onNodeClick: (level: string, nodeId: string) => void
	onEditNode?: (
		level: string,
		nodeId: string,
		updatedNode: {
			title: string
			description: string
		},
	) => void
	onDeleteNode?: (level: string, nodeId: string) => void
	onResearchPanelChange?: (isVisible: boolean, nodeData?: any) => void
	onAiAssist?: (
		nodeId?: string,
		nodeTitle?: string,
		nodeDescription?: string,
		level?: number,
	) => void
	onToggleFullscreen?: () => void
}

interface MindMapControllerProps {
	callbacks: EventCallbacks
	justSwitchedView?: boolean
	getMindmapPanZoomState?: () => { zoom: number; panX: number; panY: number }
	researchPanelContent?: React.ReactNode
	chatboxContent?: React.ReactNode
	toolbarOrientation?: "vertical" | "horizontal"
	treeMode?: string
}

export const MindMapController: React.FC<MindMapControllerProps> = ({
	callbacks,
	justSwitchedView,
	getMindmapPanZoomState,
	researchPanelContent,
	chatboxContent,
	treeMode,
	toolbarOrientation = "vertical",
}) => {
	const { state } = useMindMap()
	const { nodes } = useMindMapData()
	const { getCurrentState, handleLayoutChangeResetView } = useMindMapRendering(
		{},
	)

	// Event handlers from custom hook
	const eventHandlers = useMindMapEvents(callbacks, nodes)

	// Attach a window keydown listener that forwards events to the
	// hook's handleKeyDown. This is the intended runtime behavior so the
	// hook receives global keyboard events (e.g., Cmd+\ to toggle nav).
	useEffect(() => {
		const forward = (e: KeyboardEvent) => {
			if (eventHandlers && typeof eventHandlers.handleKeyDown === "function") {
				eventHandlers.handleKeyDown(e)
			}
		}

		window.addEventListener("keydown", forward)
		return () => window.removeEventListener("keydown", forward)
	}, [eventHandlers.handleKeyDown, eventHandlers])

	// Save state on unmount as fallback - use refs to capture latest values
	const latestExpandedNodesRef = useRef(state.expandedNodes)
	const latestGetCurrentStateRef = useRef(getCurrentState)

	// Update refs with latest values
	latestExpandedNodesRef.current = state.expandedNodes
	latestGetCurrentStateRef.current = getCurrentState

	// Enhanced layout toggle with auto reset view
	const handleToggleLayoutWithReset = () => {
		eventHandlers.handleToggleLayout()
		handleLayoutChangeResetView()
	}

	const rendererEventHandlers = {
		...eventHandlers,
		handleToggleLayout: handleToggleLayoutWithReset,
	}

	return (
		<MindMapRenderer
			eventHandlers={rendererEventHandlers}
			researchPanelContent={researchPanelContent}
			chatboxContent={chatboxContent}
			getMindmapPanZoomState={getMindmapPanZoomState}
			justSwitchedView={justSwitchedView}
			toolbarOrientation={toolbarOrientation}
			treeMode={treeMode}
		/>
	)
}
