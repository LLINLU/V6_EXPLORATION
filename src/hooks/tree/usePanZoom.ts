import { useCallback, useRef, useState } from "react"

interface PanZoomState {
	zoom: number
	panX: number
	panY: number
}

interface UsePanZoomReturn {
	zoom: number
	panX: number
	panY: number
	isDragging: boolean
	handleWheel: (event: React.WheelEvent) => void
	handleMouseDown: (event: React.MouseEvent) => void
	handleMouseMove: (event: React.MouseEvent) => void
	handleMouseUp: () => void
	handleMouseLeave: () => void
	handleTouchStart: (event: React.TouchEvent) => void
	handleTouchMove: (event: React.TouchEvent) => void
	handleTouchEnd: () => void
	zoomIn: () => void
	zoomOut: () => void
	resetView: () => void
	getCSSTransform: () => string
	getCurrentState: () => PanZoomState
	isMouseOverPanelArea: (mouseX: number) => boolean
}

export const usePanZoom = (
	initialState?: PanZoomState,
	researchPanelRef?: React.RefObject<HTMLDivElement>,
	showResearchPanel?: boolean,
): UsePanZoomReturn => {
	const [state, setState] = useState<PanZoomState>(
		initialState || {
			zoom: 0.6, // Set default zoom to 60%
			panX: 0, // Changed from 200 to 0 to show root node on LEFT side of canvas
			panY: 50, // Keep initial downward offset for better root node positioning
		},
	)

	const [isDragging, setIsDragging] = useState(false)
	const lastMousePos = useRef({ x: 0, y: 0 })
	const lastTouchDistance = useRef<number | null>(null)

	const MIN_ZOOM = 0.1
	const MAX_ZOOM = 3
	const ZOOM_STEP = 0.2

	const handleWheel = useCallback((event: React.WheelEvent) => {
		event.preventDefault()
		event.stopPropagation() // Prevent event from bubbling up to page level

		const rect = event.currentTarget.getBoundingClientRect()
		const centerX = rect.width / 2
		const centerY = rect.height / 2

		// Much gentler zoom factors - 3% base change instead of 10%
		const baseFactor = 0.03

		// Adjust zoom factor based on deltaY magnitude for better trackpad/mouse wheel handling
		const deltaY = Math.abs(event.deltaY)
		let adjustedFactor = baseFactor

		// For larger deltas (mouse wheel), allow slightly more zoom
		if (deltaY > 100) {
			adjustedFactor = baseFactor * 1.5 // 4.5%
		} else if (deltaY > 50) {
			adjustedFactor = baseFactor * 1.2 // 3.6%
		}
		// For small deltas (trackpad), keep the gentle 3%

		const zoomFactor =
			event.deltaY > 0 ? 1 - adjustedFactor : 1 + adjustedFactor

		setState((prev) => {
			const newZoom = Math.max(
				MIN_ZOOM,
				Math.min(MAX_ZOOM, prev.zoom * zoomFactor),
			)

			// Zoom towards center of container
			const zoomChange = newZoom / prev.zoom
			const newPanX = centerX - (centerX - prev.panX) * zoomChange
			const newPanY = centerY - (centerY - prev.panY) * zoomChange

			return {
				zoom: newZoom,
				panX: newPanX,
				panY: newPanY,
			}
		})
	}, [])

	const handleMouseDown = useCallback((event: React.MouseEvent) => {
		if (event.button === 0) {
			// Left mouse button
			setIsDragging(true)
			lastMousePos.current = { x: event.clientX, y: event.clientY }
			event.preventDefault()
		}
	}, [])

	const handleMouseMove = useCallback(
		(event: React.MouseEvent) => {
			if (!isDragging) return

			const deltaX = event.clientX - lastMousePos.current.x
			const deltaY = event.clientY - lastMousePos.current.y

			setState((prev) => ({
				...prev,
				panX: prev.panX + deltaX,
				panY: prev.panY + deltaY,
			}))

			lastMousePos.current = { x: event.clientX, y: event.clientY }
		},
		[isDragging],
	)

	const handleMouseUp = useCallback(() => {
		setIsDragging(false)
	}, [])

	const handleMouseLeave = useCallback(() => {
		setIsDragging(false)
	}, [])

	// Touch event handlers for mobile/tablet support
	const handleTouchStart = useCallback((event: React.TouchEvent) => {
		// Always prevent default to stop browser scrolling
		event.preventDefault()

		if (event.touches.length === 1) {
			// Single touch - start dragging
			setIsDragging(true)
			const touch = event.touches[0]
			lastMousePos.current = { x: touch.clientX, y: touch.clientY }
		} else if (event.touches.length === 2) {
			// Two touches - prepare for pinch zoom
			const touch1 = event.touches[0]
			const touch2 = event.touches[1]
			const distance = Math.hypot(
				touch2.clientX - touch1.clientX,
				touch2.clientY - touch1.clientY,
			)
			lastTouchDistance.current = distance
		}
	}, [])

	const handleTouchMove = useCallback(
		(event: React.TouchEvent) => {
			// Always prevent default to stop browser scrolling
			event.preventDefault()

			if (event.touches.length === 1 && isDragging) {
				// Single touch - pan
				const touch = event.touches[0]
				const deltaX = touch.clientX - lastMousePos.current.x
				const deltaY = touch.clientY - lastMousePos.current.y

				setState((prev) => ({
					...prev,
					panX: prev.panX + deltaX,
					panY: prev.panY + deltaY,
				}))

				lastMousePos.current = { x: touch.clientX, y: touch.clientY }
			} else if (event.touches.length === 2) {
				// Two touches - pinch zoom
				const touch1 = event.touches[0]
				const touch2 = event.touches[1]
				const distance = Math.hypot(
					touch2.clientX - touch1.clientX,
					touch2.clientY - touch1.clientY,
				)

				if (lastTouchDistance.current !== null) {
					const rect = event.currentTarget.getBoundingClientRect()
					const centerX = rect.width / 2
					const centerY = rect.height / 2

					// Calculate zoom factor from distance change
					const distanceChange = distance - lastTouchDistance.current
					const zoomFactor = 1 + distanceChange * 0.01

					setState((prev) => {
						const newZoom = Math.max(
							MIN_ZOOM,
							Math.min(MAX_ZOOM, prev.zoom * zoomFactor),
						)

						// Zoom towards center of container
						const zoomChange = newZoom / prev.zoom
						const newPanX = centerX - (centerX - prev.panX) * zoomChange
						const newPanY = centerY - (centerY - prev.panY) * zoomChange

						return {
							zoom: newZoom,
							panX: newPanX,
							panY: newPanY,
						}
					})
				}

				lastTouchDistance.current = distance
			}
		},
		[isDragging],
	)

	const handleTouchEnd = useCallback(() => {
		setIsDragging(false)
		lastTouchDistance.current = null
	}, [])

	const zoomIn = useCallback(() => {
		setState((prev) => ({
			...prev,
			zoom: Math.min(MAX_ZOOM, prev.zoom + ZOOM_STEP),
		}))
	}, [])

	const zoomOut = useCallback(() => {
		setState((prev) => ({
			...prev,
			zoom: Math.max(MIN_ZOOM, prev.zoom - ZOOM_STEP),
		}))
	}, [])

	const resetView = useCallback(() => {
		setState({
			zoom: 0.6, // Reset to 60% zoom instead of 100%
			panX: 0, // Reset to 0 to show root node on LEFT side when resetting
			panY: 50, // Keep the improved initial Y offset when resetting
		})
	}, [])

	const getCSSTransform = useCallback(() => {
		return `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`
	}, [state])

	const getCurrentState = useCallback(() => {
		return { ...state }
	}, [state])

	// Helper function to check if mouse is over panel area using refs
	const isMouseOverPanelArea = useCallback(
		(mouseX: number) => {
			const windowWidth = window.innerWidth

			// Get actual panel widths from refs
			const researchPanelWidth = researchPanelRef?.current?.offsetWidth || 0

			if (showResearchPanel && researchPanelWidth) {
				// Research panel open at right-0
				return mouseX >= windowWidth - researchPanelWidth
			}

			return false
		},
		[researchPanelRef, showResearchPanel],
	)

	return {
		zoom: state.zoom,
		panX: state.panX,
		panY: state.panY,
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
	}
}
