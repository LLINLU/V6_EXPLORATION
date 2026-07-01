import { useCallback, useEffect, useMemo, useRef } from "react"
import { usePanZoom } from "@/hooks/tree/usePanZoom"
import { useMindMap } from "../MindMapContext"

interface PanZoomState {
	zoom: number
	panX: number
	panY: number
}

interface RenderingOptions {
	getMindmapPanZoomState?: () => PanZoomState
	justSwitchedView?: boolean
}

export const useMindMapRendering = (options: RenderingOptions = {}) => {
	const { state, actions } = useMindMap()
	const containerRef = useRef<HTMLDivElement>(null)
	const researchPanelRef = useRef<HTMLDivElement>(null)
	const chatPanelRef = useRef<HTMLDivElement>(null)

	// Calculate container dimensions
	const calculateContainerWidth = useCallback(() => {
		// In normal mode, always use 100% width - TechTreeLayout handles the layout
		if (!state.isFullscreen) {
			return window.innerWidth // Full width in normal mode
		}

		// In fullscreen mode, calculate based on active panels
		const baseWidth = window.innerWidth
		let reduction = 0

		// Count active panels (only in fullscreen mode)
		const activePanels =
			(state.showResearchPanel ? 1 : 0) + (state.fullscreenChatOpen ? 1 : 0)
		reduction = activePanels * 384 // Each panel is 384px

		return baseWidth - reduction
	}, [state.isFullscreen, state.showResearchPanel, state.fullscreenChatOpen])

	// Get node dimensions based on layout
	const getNodeWidth = useCallback(
		() => (state.layoutDirection === "horizontal" ? 280 : 260),
		[state.layoutDirection],
	)
	const getNodeHeight = useCallback(
		() => (state.layoutDirection === "horizontal" ? 100 : 60),
		[state.layoutDirection],
	)

	// Container dimensions
	const baseContainerWidth = calculateContainerWidth()
	const baseContainerHeight = state.isFullscreen
		? state.showNavigation
			? window.innerHeight - 56
			: window.innerHeight
		: 600

	const containerWidth = useMemo(() => baseContainerWidth, [baseContainerWidth])

	const containerHeight = useMemo(
		() => baseContainerHeight,
		[baseContainerHeight],
	)

	// Calculate mindmap container width for styling
	const mindmapContainerWidth = state.isFullscreen
		? `${baseContainerWidth}px`
		: "100%"

	// Get preserved pan/zoom state when switching back to mind map
	const preservedPanZoomState =
		options.justSwitchedView && options.getMindmapPanZoomState
			? options.getMindmapPanZoomState()
			: undefined

	// Efficient panel area detection using actual DOM elements
	const isMouseOverAnyPanel = useCallback(
		(mouseX: number, mouseY: number) => {
			if (!state.isFullscreen) return false

			// Check active panel elements using their actual DOM bounds
			const panelElements = [
				state.fullscreenChatOpen && chatPanelRef.current,
				state.showResearchPanel && researchPanelRef.current,
			].filter(Boolean)

			return panelElements.some((element) => {
				if (!element) return false
				const rect = element.getBoundingClientRect()
				return (
					mouseX >= rect.left &&
					mouseX <= rect.right &&
					mouseY >= rect.top &&
					mouseY <= rect.bottom
				)
			})
		},
		[state.isFullscreen, state.fullscreenChatOpen, state.showResearchPanel],
	)

	// Pan and zoom functionality
	const {
		zoom,
		isDragging,
		handleWheel,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleMouseLeave,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		zoomIn,
		zoomOut,
		resetView,
		getCSSTransform,
		getCurrentState,
		isMouseOverPanelArea,
	} = usePanZoom(
		preservedPanZoomState,
		researchPanelRef,
		state.showResearchPanel,
	)

	// Container wheel handler
	const handleContainerWheel = useCallback(
		(e: React.WheelEvent) => {
			// If mouse is over panel area, don't handle wheel event for mindmap
			if (
				isMouseOverPanelArea(e.clientX) ||
				isMouseOverAnyPanel(e.clientX, e.clientY)
			) {
				return
			}

			e.stopPropagation()
			e.preventDefault()
			if (e.nativeEvent?.stopImmediatePropagation) {
				e.nativeEvent.stopImmediatePropagation()
			}
			handleWheel(e)
		},
		[handleWheel, isMouseOverPanelArea, isMouseOverAnyPanel],
	)

	// Auto reset view after layout change
	const handleLayoutChangeResetView = useCallback(() => {
		setTimeout(() => {
			resetView()
		}, 100) // Small delay to ensure layout change has completed
	}, [resetView])

	// Update cursor when dragging state changes
	useEffect(() => {
		if (isDragging) {
			actions.setCursorStyle("grabbing")
		} else {
			actions.setCursorStyle("grab")
		}
	}, [isDragging, actions])

	// Add wheel event listener with passive: false to prevent default
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const handleWheelPassive = (event: WheelEvent) => {
			// If mouse is over panel area, don't handle wheel event for mindmap
			if (
				isMouseOverPanelArea(event.clientX) ||
				isMouseOverAnyPanel(event.clientX, event.clientY)
			) {
				return
			}

			event.preventDefault()
			event.stopPropagation()
			// Create a React.WheelEvent-like object from the native WheelEvent
			handleContainerWheel(event as unknown as React.WheelEvent<HTMLDivElement>)
		}

		container.addEventListener("wheel", handleWheelPassive, { passive: false })

		return () => {
			container.removeEventListener("wheel", handleWheelPassive)
		}
	}, [handleContainerWheel, isMouseOverPanelArea, isMouseOverAnyPanel])

	return {
		// Refs
		containerRef,
		researchPanelRef,
		chatPanelRef,

		// Dimensions
		containerWidth,
		containerHeight,
		baseContainerWidth,
		baseContainerHeight,
		mindmapContainerWidth,

		// Pan/Zoom state and handlers
		zoom,
		isDragging,
		handleWheel,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleMouseLeave,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		zoomIn,
		zoomOut,
		resetView,
		getCSSTransform,
		getCurrentState,

		// Event handlers
		handleContainerWheel,
		handleLayoutChangeResetView,

		// Utilities
		isMouseOverPanelArea,
		isMouseOverAnyPanel,
		getNodeWidth,
		getNodeHeight,
	}
}
