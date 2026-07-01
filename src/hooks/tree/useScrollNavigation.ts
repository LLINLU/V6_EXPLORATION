import { useCallback, useEffect, useRef, useState } from "react"

export const useScrollNavigation = () => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(false)
	const [lastVisibleLevel, setLastVisibleLevel] = useState(3)
	const scrollUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Update scroll button states
	const updateScrollButtons = useCallback(() => {
		if (containerRef.current) {
			const { scrollLeft, scrollWidth, clientWidth } = containerRef.current

			setCanScrollLeft(scrollLeft > 5)

			const maxScrollLeft = scrollWidth - clientWidth
			const canScrollRightValue = scrollLeft < maxScrollLeft - 5
			setCanScrollRight(canScrollRightValue)
		}
	}, [])

	// Throttled version of triggerScrollUpdate to prevent excessive calls during tree generation
	const triggerScrollUpdate = useCallback(() => {
		// Clear existing timeout to prevent multiple rapid calls
		if (scrollUpdateTimeoutRef.current) {
			clearTimeout(scrollUpdateTimeoutRef.current)
		}

		// Set a new timeout with debouncing
		scrollUpdateTimeoutRef.current = setTimeout(() => {
			// Use multiple timeouts to catch different rendering phases, but only once per batch
			updateScrollButtons()
			setTimeout(() => updateScrollButtons(), 200)
			setTimeout(() => updateScrollButtons(), 400)
		}, 100)
	}, [updateScrollButtons])

	// Calculate the last visible level based on available items
	const updateLastVisibleLevel = useCallback(
		(levelItems: {
			level4Items?: any[]
			level5Items?: any[]
			level6Items?: any[]
			level7Items?: any[]
			level8Items?: any[]
			level9Items?: any[]
			level10Items?: any[]
		}) => {
			if (levelItems.level10Items && levelItems.level10Items.length > 0) {
				setLastVisibleLevel(10)
			} else if (levelItems.level9Items && levelItems.level9Items.length > 0) {
				setLastVisibleLevel(9)
			} else if (levelItems.level8Items && levelItems.level8Items.length > 0) {
				setLastVisibleLevel(8)
			} else if (levelItems.level7Items && levelItems.level7Items.length > 0) {
				setLastVisibleLevel(7)
			} else if (levelItems.level6Items && levelItems.level6Items.length > 0) {
				setLastVisibleLevel(6)
			} else if (levelItems.level5Items && levelItems.level5Items.length > 0) {
				setLastVisibleLevel(5)
			} else if (levelItems.level4Items && levelItems.level4Items.length > 0) {
				setLastVisibleLevel(4)
			} else {
				setLastVisibleLevel(3)
			}
		},
		[],
	)

	// Handle scroll to start
	const handleScrollToStart = useCallback(() => {
		if (containerRef.current) {
			containerRef.current.scrollTo({
				left: 0,
				behavior: "smooth",
			})
		}
	}, [])

	// Handle scroll to end
	const handleScrollToEnd = useCallback(() => {
		if (containerRef.current) {
			containerRef.current.scrollTo({
				left: containerRef.current.scrollWidth,
				behavior: "smooth",
			})
		}
	}, [])
	// Set up event listeners
	useEffect(() => {
		const container = containerRef.current
		if (container) {
			updateScrollButtons()
			container.addEventListener("scroll", updateScrollButtons)

			const handlePanelResize = () => {
				setTimeout(updateScrollButtons, 100)
			}

			document.addEventListener("panel-resize", handlePanelResize)
			window.addEventListener("resize", handlePanelResize)

			return () => {
				container.removeEventListener("scroll", updateScrollButtons)
				document.removeEventListener("panel-resize", handlePanelResize)
				window.removeEventListener("resize", handlePanelResize)
				// Clean up any pending scroll update timeouts
				if (scrollUpdateTimeoutRef.current) {
					clearTimeout(scrollUpdateTimeoutRef.current)
				}
			}
		}
	}, [updateScrollButtons])

	return {
		containerRef,
		canScrollLeft,
		canScrollRight,
		lastVisibleLevel,
		handleScrollToStart,
		handleScrollToEnd,
		updateScrollButtons,
		updateLastVisibleLevel,
		triggerScrollUpdate,
	}
}
