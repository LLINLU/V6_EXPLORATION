import { useCallback, useEffect } from "react"
import {
	createCompletePathEvent,
	createPathEventDetail,
	createSetPathDirectEvent,
	createUserClickedNodeEvent,
	findCompleteNodePath,
	triggerCardExpansion,
} from "@/utils/technologyTreeNavigation"

interface EventsParams {
	level1Items: any[]
	level2Items: any
	level3Items: any
	level4Items: any
	level5Items: any
	level6Items: any
	level7Items: any
	level8Items: any
	level9Items: any
	level10Items: any
	triggerNodeEnrichment: (
		level: string,
		nodeId: string,
		customPath?: any,
	) => Promise<void>
}

export const useTechnologyTreeEvents = ({
	level1Items,
	level2Items,
	level3Items,
	level4Items,
	level5Items,
	level6Items,
	level7Items,
	level8Items,
	level9Items,
	level10Items,
	triggerNodeEnrichment,
}: EventsParams) => {
	const handleCompletePathSelection = useCallback(
		(event: CustomEvent) => {
			const newPath = event.detail
			const nodeId = event.detail.nodeId
			const level = event.detail.level
			const fromQueue = event.detail.fromQueue

			const pathToSet = {
				level1: newPath.level1,
				level2: newPath.level2,
				level3: newPath.level3,
				level4: newPath.level4,
				level5: newPath.level5,
				level6: newPath.level6,
				level7: newPath.level7,
				level8: newPath.level8,
				level9: newPath.level9,
				level10: newPath.level10,
			}

			const setPathEvent = createSetPathDirectEvent(pathToSet)
			document.dispatchEvent(setPathEvent)

			if (nodeId && level) {
				const setUserClickedNodeEvent = createUserClickedNodeEvent({
					level,
					nodeId,
				})
				document.dispatchEvent(setUserClickedNodeEvent)
			}

			if (nodeId && level) {
				if (!fromQueue) {
					setTimeout(() => {
						triggerNodeEnrichment(level, nodeId)
					}, 100)
				} else if (fromQueue && level.match(/^level[5-9]$|^level10$/)) {
					const truncatedPath = {
						level1: newPath.level1,
						level2: newPath.level2,
						level3: newPath.level3,
						level4: newPath.level4,
						level5: level === "level5" ? nodeId : "",
						level6: level === "level6" ? nodeId : "",
						level7: level === "level7" ? nodeId : "",
						level8: level === "level8" ? nodeId : "",
						level9: level === "level9" ? nodeId : "",
						level10: level === "level10" ? nodeId : "",
					}

					setTimeout(() => {
						triggerNodeEnrichment(level, nodeId, truncatedPath)
					}, 100)
				} else if (fromQueue) {
					console.error("Skipping enrichment for level 1-4 queue navigation")
				}
			}

			const preventOtherEvents = () => {
				console.error(
					"Custom path selection complete - preventing interference",
				)
			}

			setTimeout(preventOtherEvents, 50)
		},
		[triggerNodeEnrichment],
	)

	const handleQueueNodeSelect = useCallback(
		(nodeId: string) => {
			const findNodePath = (targetNodeId: string) => {
				const result = findCompleteNodePath(
					targetNodeId,
					level1Items,
					level2Items,
					level3Items,
					level4Items,
					level5Items,
					level6Items,
					level7Items,
					level8Items,
					level9Items,
					level10Items,
				)

				if (!result) {
					const completePathEvent = createCompletePathEvent(
						createPathEventDetail([targetNodeId], "level1", targetNodeId),
					)
					document.dispatchEvent(completePathEvent)
					return
				}

				const { level, path } = result

				if (level === "level1") {
					triggerCardExpansion(path[0])
					setTimeout(() => {
						const completePathEvent = createCompletePathEvent(
							createPathEventDetail(path, "level1", path[0]),
						)
						document.dispatchEvent(completePathEvent)
					}, 150)
				} else if (level === "level2") {
					triggerCardExpansion(path[0], path[1])
					setTimeout(() => {
						const completePathEvent = createCompletePathEvent(
							createPathEventDetail(path, "level2", path[1]),
						)
						document.dispatchEvent(completePathEvent)
					}, 150)
				} else if (level === "level3") {
					triggerCardExpansion(path[0], path[1], path[2])
					setTimeout(() => {
						const completePathEvent = createCompletePathEvent(
							createPathEventDetail(path, "level3", path[2]),
						)
						document.dispatchEvent(completePathEvent)
					}, 200)
				} else if (level === "level4") {
					triggerCardExpansion(path[0], path[1], path[2])
					setTimeout(() => {
						const completePathEvent = createCompletePathEvent(
							createPathEventDetail(path, "level4", path[3]),
						)
						document.dispatchEvent(completePathEvent)
					}, 250)
				} else if (level === "level5") {
					triggerCardExpansion(path[0], path[1], path[2])
					setTimeout(() => {
						const completePathEvent = createCompletePathEvent(
							createPathEventDetail(
								path,
								"level5",
								path[4] || path[path.length - 1],
							),
						)
						document.dispatchEvent(completePathEvent)
					}, 300)
				} else if (level.startsWith("level")) {
					triggerCardExpansion(path[0], path[1], path[2])
					setTimeout(() => {
						const completePathEvent = createCompletePathEvent(
							createPathEventDetail(path, level, path[path.length - 1]),
						)
						document.dispatchEvent(completePathEvent)
					}, 350)
				}
			}

			findNodePath(nodeId)
		},
		[
			level1Items,
			level2Items,
			level3Items,
			level4Items,
			level5Items,
			level6Items,
			level7Items,
			level8Items,
			level9Items,
			level10Items,
		],
	)

	// Set up event listeners
	useEffect(() => {
		document.addEventListener(
			"set-complete-path",
			handleCompletePathSelection as EventListener,
		)

		return () => {
			document.removeEventListener(
				"set-complete-path",
				handleCompletePathSelection as EventListener,
			)
		}
	}, [handleCompletePathSelection])

	return {
		handleQueueNodeSelect,
	}
}
