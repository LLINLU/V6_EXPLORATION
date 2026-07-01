import type { PathLevel } from "@/types/tree"
import type { PathState } from "../state/usePathState"

export const findCompletePath = (
	targetLevel: PathLevel,
	targetNodeId: string,
	treeData: any,
	initialPath: PathState,
): PathState => {
	if (!treeData) return initialPath

	// console.log("[FIND_COMPLETE_PATH] Starting path finding for:", {
	// 	targetLevel,
	// 	targetNodeId,
	// 	treeDataKeys: Object.keys(treeData || {}),
	// })

	const newPath: PathState = {
		level1: "",
		level2: "",
		level3: "",
		level4: "",
		level5: "",
		level6: "",
		level7: "",
		level8: "",
		level9: "",
		level10: "",
	}

	const levels: PathLevel[] = [
		"level1",
		"level2",
		"level3",
		"level4",
		"level5",
		"level6",
		"level7",
		"level8",
		"level9",
		"level10",
	]

	const targetLevelIndex = levels.indexOf(targetLevel)

	if (targetLevelIndex === 0) {
		// Level 1 node - just set it directly
		newPath.level1 = targetNodeId
		// console.log("[FIND_COMPLETE_PATH] Level 1 node, returning:", newPath)
		return newPath
	}

	// For level 2+ nodes, we need to traverse up to find parents
	let currentNodeId = targetNodeId
	let currentLevelIndex = targetLevelIndex

	// Set the target level first
	newPath[targetLevel] = targetNodeId

	// Work backwards to find parent nodes
	while (currentLevelIndex > 0) {
		// const _currentLevel = levels[currentLevelIndex]
		const parentLevel = levels[currentLevelIndex - 1]

		// console.log("[FIND_COMPLETE_PATH] Finding parent for:", {
		// 	currentLevel,
		// 	currentNodeId,
		// 	parentLevel,
		// 	currentLevelIndex,
		// })

		// Find the parent of the current node
		let parentNodeId = ""

		if (currentLevelIndex === 1) {
			// For level 2 nodes, find which level 1 node contains this level 2 node
			const level1Items = treeData.level1Items || []
			for (const level1Item of level1Items) {
				const level2Children = treeData.level2Items?.[level1Item.id] || []
				if (level2Children.find((child: any) => child.id === currentNodeId)) {
					parentNodeId = level1Item.id
					break
				}
			}
		} else if (currentLevelIndex === 2) {
			// For level 3 nodes, find which level 2 node contains this level 3 node
			// console.log(
			// 	"[FIND_COMPLETE_PATH] Searching for level3 node parent in level2Items...",
			// )
			for (const [_level1Id, level2Children] of Object.entries(
				treeData.level2Items || {},
			)) {
				if (Array.isArray(level2Children)) {
					for (const level2Child of level2Children) {
						const level3Children = treeData.level3Items?.[level2Child.id] || []
						// console.log("[FIND_COMPLETE_PATH] Checking level2 child:", {
						// 	level2ChildId: level2Child.id,
						// 	level2ChildName: level2Child.name,
						// 	level3ChildrenCount: level3Children.length,
						// 	level3ChildrenIds: level3Children.map((c: any) => c.id),
						// 	searchingFor: currentNodeId,
						// })
						if (
							level3Children.find((child: any) => child.id === currentNodeId)
						) {
							parentNodeId = level2Child.id
							// console.log(
							// 	"[FIND_COMPLETE_PATH] Found parent for level3 node:",
							// 	{
							// 		parentNodeId,
							// 		parentName: level2Child.name,
							// 	},
							// )
							break
						}
					}
					if (parentNodeId) break
				}
			}
		} else if (currentLevelIndex === 3) {
			// For level 4 nodes, find which level 3 node contains this level 4 node
			for (const [_level2Id, level3Children] of Object.entries(
				treeData.level3Items || {},
			)) {
				if (Array.isArray(level3Children)) {
					for (const level3Child of level3Children) {
						const level4Children = treeData.level4Items?.[level3Child.id] || []
						if (
							level4Children.find((child: any) => child.id === currentNodeId)
						) {
							parentNodeId = level3Child.id
							break
						}
					}
					if (parentNodeId) break
				}
			}
		} else if (currentLevelIndex === 4) {
			// For level 5 nodes, find which level 4 node contains this level 5 node
			for (const [_level3Id, level4Children] of Object.entries(
				treeData.level4Items || {},
			)) {
				if (Array.isArray(level4Children)) {
					for (const level4Child of level4Children) {
						const level5Children = treeData.level5Items?.[level4Child.id] || []
						if (
							level5Children.find((child: any) => child.id === currentNodeId)
						) {
							parentNodeId = level4Child.id
							break
						}
					}
					if (parentNodeId) break
				}
			}
		} else {
			// For level 6+ nodes, use the original logic
			const parentLevelKey = `${parentLevel}Items`
			const parentLevelItems = treeData[parentLevelKey] || {}
			for (const [parentId, children] of Object.entries(parentLevelItems)) {
				if (
					Array.isArray(children) &&
					children.find((child: any) => child.id === currentNodeId)
				) {
					parentNodeId = parentId
					break
				}
			}
		}
		if (parentNodeId) {
			newPath[parentLevel] = parentNodeId
			// console.log("[FIND_COMPLETE_PATH] Set parent in path:", {
			// 	parentLevel,
			// 	parentNodeId,
			// 	currentPath: newPath,
			// })
			currentNodeId = parentNodeId
			currentLevelIndex--
		} else {
			// console.warn(
			// `[FIND_COMPLETE_PATH] Could not find parent for ${currentLevel} node ${currentNodeId}`,
			// )
			break
		}
	}

	// console.log("[FIND_COMPLETE_PATH] Final complete path:", newPath)
	return newPath
}

export const clearPathFromLevel = (
	path: PathState,
	level: PathLevel,
): PathState => {
	const clearedPath = { ...path }
	const levels: PathLevel[] = [
		"level1",
		"level2",
		"level3",
		"level4",
		"level5",
		"level6",
		"level7",
		"level8",
		"level9",
		"level10",
	]
	const currentIndex = levels.indexOf(level)
	for (let i = currentIndex; i < levels.length; i++) {
		clearedPath[levels[i]] = ""
	}
	return clearedPath
}

export const autoSelectChildren = (
	path: PathState,
	level: PathLevel,
	nodeId: string,
	treeData: any,
): PathState => {
	const newPath = { ...path }
	const levels: PathLevel[] = [
		"level1",
		"level2",
		"level3",
		"level4",
		"level5",
		"level6",
		"level7",
		"level8",
		"level9",
		"level10",
	]
	const currentIndex = levels.indexOf(level)

	// Auto-select children for treemap view
	if (treeData && currentIndex < levels.length - 1) {
		const nextLevel = levels[currentIndex + 1]
		const nextLevelKey = `${nextLevel}Items`
		const childItems = treeData[nextLevelKey]?.[nodeId]

		if (childItems && childItems.length > 0) {
			newPath[nextLevel] = childItems[0].id

			// Recursively auto-select children
			let currentParentId = childItems[0].id
			for (let i = currentIndex + 2; i < levels.length; i++) {
				const childLevel = levels[i]
				const childLevelKey = `${childLevel}Items`
				const grandChildItems = treeData[childLevelKey]?.[currentParentId]

				if (grandChildItems && grandChildItems.length > 0) {
					newPath[childLevel] = grandChildItems[0].id
					currentParentId = grandChildItems[0].id
				} else {
					break
				}
			}
		}
	}

	return newPath
}
