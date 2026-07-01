import { type RefObject, useCallback, useEffect, useState } from "react"

interface ConnectionLine {
	x1: number
	y1: number
	x2: number
	y2: number
}

export const useConnectionLines = (
	containerRef: RefObject<HTMLDivElement>,
	selectedPath: {
		level1: string
		level2: string
		level3: string
		level4?: string
		level5?: string
		level6?: string
		level7?: string
		level8?: string
		level9?: string
		level10?: string
	},
	setLevel1to2Line?: (line: ConnectionLine | null) => void,
	setLevel2to3Line?: (line: ConnectionLine | null) => void,
	setLevel3to4Line?: (line: ConnectionLine | null) => void,
	setLevel4to5Line?: (line: ConnectionLine | null) => void,
	setLevel5to6Line?: (line: ConnectionLine | null) => void,
	setLevel6to7Line?: (line: ConnectionLine | null) => void,
	setLevel7to8Line?: (line: ConnectionLine | null) => void,
	setLevel8to9Line?: (line: ConnectionLine | null) => void,
	setLevel9to10Line?: (line: ConnectionLine | null) => void,
) => {
	const [level1to2Line, setInternalLevel1to2Line] =
		useState<ConnectionLine | null>(null)
	const [level2to3Line, setInternalLevel2to3Line] =
		useState<ConnectionLine | null>(null)
	const [level3to4Line, setInternalLevel3to4Line] =
		useState<ConnectionLine | null>(null)
	const [level4to5Line, setInternalLevel4to5Line] =
		useState<ConnectionLine | null>(null)
	const [level5to6Line, setInternalLevel5to6Line] =
		useState<ConnectionLine | null>(null)
	const [level6to7Line, setInternalLevel6to7Line] =
		useState<ConnectionLine | null>(null)
	const [level7to8Line, setInternalLevel7to8Line] =
		useState<ConnectionLine | null>(null)
	const [level8to9Line, setInternalLevel8to9Line] =
		useState<ConnectionLine | null>(null)
	const [level9to10Line, setInternalLevel9to10Line] =
		useState<ConnectionLine | null>(null)

	// Use the provided setters if available, otherwise use internal state
	const updateLevel1to2Line = setLevel1to2Line || setInternalLevel1to2Line
	const updateLevel2to3Line = setLevel2to3Line || setInternalLevel2to3Line
	const updateLevel3to4Line = setLevel3to4Line || setInternalLevel3to4Line
	const updateLevel4to5Line = setLevel4to5Line || setInternalLevel4to5Line
	const updateLevel5to6Line = setLevel5to6Line || setInternalLevel5to6Line
	const updateLevel6to7Line = setLevel6to7Line || setInternalLevel6to7Line
	const updateLevel7to8Line = setLevel7to8Line || setInternalLevel7to8Line
	const updateLevel8to9Line = setLevel8to9Line || setInternalLevel8to9Line
	const updateLevel9to10Line = setLevel9to10Line || setInternalLevel9to10Line

	const createConnectionLine = useCallback(
		(fromLevel: string, toLevel: string, fromId: string, toId: string) => {
			if (!containerRef.current) return null

			const containerRect = containerRef.current.getBoundingClientRect()
			const fromNode = document.getElementById(`${fromLevel}-${fromId}`)
			const toNode = document.getElementById(`${toLevel}-${toId}`)

			if (fromNode && toNode) {
				const fromRect = fromNode.getBoundingClientRect()
				const toRect = toNode.getBoundingClientRect()

				return {
					x1: fromRect.right - containerRect.left,
					y1: fromRect.top + fromRect.height / 2 - containerRect.top,
					x2: toRect.left - containerRect.left,
					y2: toRect.top + toRect.height / 2 - containerRect.top,
				}
			}

			return null
		},
		[containerRef],
	)

	const updateConnectionLines = useCallback(() => {
		if (containerRef.current) {
			// Level 1 to Level 2
			if (selectedPath.level1 && selectedPath.level2) {
				updateLevel1to2Line(
					createConnectionLine(
						"level1",
						"level2",
						selectedPath.level1,
						selectedPath.level2,
					),
				)
			} else {
				updateLevel1to2Line(null)
			}

			// Level 2 to Level 3
			if (selectedPath.level2 && selectedPath.level3) {
				updateLevel2to3Line(
					createConnectionLine(
						"level2",
						"level3",
						selectedPath.level2,
						selectedPath.level3,
					),
				)
			} else {
				updateLevel2to3Line(null)
			}

			// Level 3 to Level 4
			if (selectedPath.level3 && selectedPath.level4) {
				updateLevel3to4Line(
					createConnectionLine(
						"level3",
						"level4",
						selectedPath.level3,
						selectedPath.level4,
					),
				)
			} else {
				updateLevel3to4Line(null)
			}

			// Level 4 to Level 5
			if (selectedPath.level4 && selectedPath.level5) {
				updateLevel4to5Line(
					createConnectionLine(
						"level4",
						"level5",
						selectedPath.level4,
						selectedPath.level5,
					),
				)
			} else {
				updateLevel4to5Line(null)
			}

			// Level 5 to Level 6
			if (selectedPath.level5 && selectedPath.level6) {
				updateLevel5to6Line(
					createConnectionLine(
						"level5",
						"level6",
						selectedPath.level5,
						selectedPath.level6,
					),
				)
			} else {
				updateLevel5to6Line(null)
			}

			// Level 6 to Level 7
			if (selectedPath.level6 && selectedPath.level7) {
				updateLevel6to7Line(
					createConnectionLine(
						"level6",
						"level7",
						selectedPath.level6,
						selectedPath.level7,
					),
				)
			} else {
				updateLevel6to7Line(null)
			}

			// Level 7 to Level 8
			if (selectedPath.level7 && selectedPath.level8) {
				updateLevel7to8Line(
					createConnectionLine(
						"level7",
						"level8",
						selectedPath.level7,
						selectedPath.level8,
					),
				)
			} else {
				updateLevel7to8Line(null)
			}

			// Level 8 to Level 9
			if (selectedPath.level8 && selectedPath.level9) {
				updateLevel8to9Line(
					createConnectionLine(
						"level8",
						"level9",
						selectedPath.level8,
						selectedPath.level9,
					),
				)
			} else {
				updateLevel8to9Line(null)
			}

			// Level 9 to Level 10
			if (selectedPath.level9 && selectedPath.level10) {
				updateLevel9to10Line(
					createConnectionLine(
						"level9",
						"level10",
						selectedPath.level9,
						selectedPath.level10,
					),
				)
			} else {
				updateLevel9to10Line(null)
			}
		}
	}, [
		containerRef,
		selectedPath,
		updateLevel1to2Line,
		updateLevel2to3Line,
		updateLevel3to4Line,
		updateLevel4to5Line,
		updateLevel5to6Line,
		updateLevel6to7Line,
		updateLevel7to8Line,
		updateLevel8to9Line,
		updateLevel9to10Line,
		createConnectionLine,
	])

	useEffect(() => {
		updateConnectionLines()

		const handleResize = () => {
			requestAnimationFrame(updateConnectionLines)
		}

		window.addEventListener("resize", handleResize)

		const resizeObserver = new ResizeObserver(() => {
			requestAnimationFrame(updateConnectionLines)
		})

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current)
		}

		document.addEventListener("panel-resize", handleResize)

		return () => {
			window.removeEventListener("resize", handleResize)
			document.removeEventListener("panel-resize", handleResize)
			resizeObserver.disconnect()
		}
	}, [containerRef.current, updateConnectionLines])

	useEffect(() => {
		updateConnectionLines()
		const timeoutId = setTimeout(updateConnectionLines, 100)
		return () => clearTimeout(timeoutId)
	}, [updateConnectionLines])

	return {
		level1to2Line: setLevel1to2Line ? null : level1to2Line,
		level2to3Line: setLevel2to3Line ? null : level2to3Line,
		level3to4Line: setLevel3to4Line ? null : level3to4Line,
		level4to5Line: setLevel4to5Line ? null : level4to5Line,
		level5to6Line: setLevel5to6Line ? null : level5to6Line,
		level6to7Line: setLevel6to7Line ? null : level6to7Line,
		level7to8Line: setLevel7to8Line ? null : level7to8Line,
		level8to9Line: setLevel8to9Line ? null : level8to9Line,
		level9to10Line: setLevel9to10Line ? null : level9to10Line,
		updateConnectionLines,
	}
}
