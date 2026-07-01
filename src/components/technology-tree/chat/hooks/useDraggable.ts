import { useCallback, useEffect, useRef, useState } from "react"

interface Position {
	x: number
	y: number
}

interface Size {
	width: number
	height: number
}

interface UseDraggableOptions {
	initialPosition?: Position
	initialSize?: Size
	minWidth?: number
	maxWidth?: number
	minHeight?: number
	maxHeight?: number
	constrainToViewport?: boolean
}

export const useDraggable = ({
	initialPosition = { x: 0, y: 0 },
	initialSize = { width: 400, height: 600 },
	minWidth = 300,
	maxWidth = 800,
	minHeight = 400,
	maxHeight = 800,
	constrainToViewport = true,
}: UseDraggableOptions = {}) => {
	const [position, setPosition] = useState<Position>(initialPosition)
	const [size, setSize] = useState<Size>(initialSize)
	const [isDragging, setIsDragging] = useState(false)
	const [isResizing, setIsResizing] = useState(false)
	const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 })
	const [resizeStart, setResizeStart] = useState<{
		position: Position
		size: Size
	}>({
		position: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	})

	const elementRef = useRef<HTMLDivElement>(null)

	// Constrain position to viewport
	const constrainPosition = useCallback(
		(pos: Position, currentSize: Size): Position => {
			if (!constrainToViewport) return pos

			const maxX = window.innerWidth - currentSize.width
			const maxY = window.innerHeight - currentSize.height

			return {
				x: Math.max(0, Math.min(pos.x, maxX)),
				y: Math.max(0, Math.min(pos.y, maxY)),
			}
		},
		[constrainToViewport],
	)

	// Constrain size
	const constrainSize = useCallback(
		(newSize: Size): Size => {
			return {
				width: Math.max(minWidth, Math.min(newSize.width, maxWidth)),
				height: Math.max(minHeight, Math.min(newSize.height, maxHeight)),
			}
		},
		[minWidth, maxWidth, minHeight, maxHeight],
	)

	// Mouse move handler
	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (isDragging) {
				// Use requestAnimationFrame for smoother updates
				requestAnimationFrame(() => {
					const newPosition = {
						x: e.clientX - dragStart.x,
						y: e.clientY - dragStart.y,
					}
					setPosition(constrainPosition(newPosition, size))
				})
			}

			if (isResizing) {
				requestAnimationFrame(() => {
					const deltaX = e.clientX - resizeStart.position.x
					const deltaY = e.clientY - resizeStart.position.y

					const newSize = constrainSize({
						width: resizeStart.size.width + deltaX,
						height: resizeStart.size.height + deltaY,
					})

					setSize(newSize)

					// Adjust position if constraining to viewport
					if (constrainToViewport) {
						setPosition(constrainPosition(position, newSize))
					}
				})
			}
		},
		[
			isDragging,
			isResizing,
			dragStart,
			resizeStart,
			constrainPosition,
			constrainSize,
			size,
			position,
			constrainToViewport,
		],
	)

	// Mouse up handler
	const handleMouseUp = useCallback(() => {
		setIsDragging(false)
		setIsResizing(false)
	}, [])

	// Add global event listeners
	useEffect(() => {
		if (isDragging || isResizing) {
			document.addEventListener("mousemove", handleMouseMove)
			document.addEventListener("mouseup", handleMouseUp)
			document.body.style.userSelect = "none"
			document.body.style.cursor = isDragging ? "move" : "nw-resize"

			return () => {
				document.removeEventListener("mousemove", handleMouseMove)
				document.removeEventListener("mouseup", handleMouseUp)
				document.body.style.userSelect = ""
				document.body.style.cursor = ""
			}
		}
	}, [isDragging, isResizing, handleMouseMove, handleMouseUp])

	// Start dragging
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			// Allow dragging from the header or any element with drag-handle class
			const target = e.target as HTMLElement
			const isDragHandle =
				target.classList.contains("drag-handle") ||
				target.closest(".drag-handle") !== null ||
				e.target === e.currentTarget

			if (isDragHandle) {
				e.preventDefault()
				e.stopPropagation()
				setIsDragging(true)
				setDragStart({
					x: e.clientX - position.x,
					y: e.clientY - position.y,
				})
			}
		},
		[position],
	)

	// Start resizing
	const handleResizeMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()
			setIsResizing(true)
			setResizeStart({
				position: { x: e.clientX, y: e.clientY },
				size: { ...size },
			})
		},
		[size],
	)

	// Center the element
	const centerElement = useCallback(() => {
		const newPosition = {
			x: (window.innerWidth - size.width) / 2,
			y: (window.innerHeight - size.height) / 2,
		}
		setPosition(constrainPosition(newPosition, size))
	}, [size, constrainPosition])

	// Reset to initial state
	const reset = useCallback(() => {
		setPosition(initialPosition)
		setSize(initialSize)
	}, [initialPosition, initialSize])

	return {
		position,
		size,
		isDragging,
		isResizing,
		elementRef,
		handleMouseDown,
		handleResizeMouseDown,
		centerElement,
		reset,
		setPosition: (pos: Position) => setPosition(constrainPosition(pos, size)),
		setSize: (newSize: Size) => setSize(constrainSize(newSize)),
	}
}
