import { useCallback, useMemo } from "react"
import type { TreeNode } from "@/types/tree"
import { transformToMindMapData } from "@/utils/mindMapDataTransform"
import { useMindMap } from "../MindMapContext"

// Constants
const MAX_SUPPORTED_LEVEL = 10
const MIN_DIRECT_EXPAND_LEVEL = 3

// Types
type LevelDataMap = Record<number, Record<string, TreeNode[]>>

export const useMindMapData = () => {
	const { data, state, actions } = useMindMap()

	// Transform data to mind map format
	const { nodes, connections } = useMemo(() => {
		return transformToMindMapData(
			data.level1Items || [],
			data.level2Items || {},
			data.level3Items || {},
			data.level4Items || {},
			data.level5Items || {},
			data.level6Items || {},
			data.level7Items || {},
			data.level8Items || {},
			data.level9Items || {},
			data.level10Items || {},
			data.levelNames,
			data.selectedPath,
			data.query || "Research Query",
			state.layoutDirection,
			state.expandedNodes,
			state.selectedNodeForHighlight,
		)
	}, [
		data.level1Items,
		data.level2Items,
		data.level3Items,
		data.level4Items,
		data.level5Items,
		data.level6Items,
		data.level7Items,
		data.level8Items,
		data.level9Items,
		data.level10Items,
		data.levelNames,
		data.selectedPath,
		data.query,
		state.layoutDirection,
		state.expandedNodes,
		state.selectedNodeForHighlight,
	])

	// Get all level data as a mapping
	const getAllLevelData = useCallback((): LevelDataMap => {
		const levelDataArray = [
			data.level1Items,
			data.level2Items,
			data.level3Items,
			data.level4Items,
			data.level5Items,
			data.level6Items,
			data.level7Items,
			data.level8Items,
			data.level9Items,
			data.level10Items,
		]

		const levelDataMap: Record<number, Record<string, TreeNode[]>> = {}

		// level1 is an array so special handling
		levelDataMap[1] = { root: data.level1Items || [] }

		// level2 and above are Record<string, TreeNode[]> format
		levelDataArray.slice(1).forEach((levelData, index) => {
			const levelNumber = index + 2 // level2 starts from index 0
			if (
				levelNumber <= MAX_SUPPORTED_LEVEL &&
				levelData &&
				Object.keys(levelData).length > 0
			) {
				levelDataMap[levelNumber as keyof typeof levelDataMap] =
					levelData as Record<string, TreeNode[]>
			}
		})

		return levelDataMap
	}, [data])

	// Get maximum available level dynamically
	const getMaxAvailableLevel = useCallback((): number => {
		const allLevelData = getAllLevelData()
		const availableLevels = Object.keys(allLevelData)
			.map(Number)
			.filter((level) => level > 1) // Exclude level1 (root)

		return Math.max(...availableLevels, 2) // Minimum level2
	}, [getAllLevelData])

	// Expand nodes with children to expanded set
	const expandNodesWithChildren = useCallback(
		(expandedSet: Set<string>, levelData: Record<string, TreeNode[]>) => {
			Object.keys(levelData).forEach((parentNodeId) => {
				const children = levelData[parentNodeId]
				if (children && children.length > 0) {
					expandedSet.add(parentNodeId)
				}
			})
		},
		[],
	)

	// Expand to target level helper
	const expandToTargetLevel = useCallback(
		(expandedSet: Set<string>, targetLevel: number) => {
			const allLevelData = getAllLevelData()

			// Expand root
			expandedSet.add("root")

			// Expand each level up to target level sequentially
			for (let currentLevel = 2; currentLevel <= targetLevel; currentLevel++) {
				const levelData = allLevelData[currentLevel]
				if (levelData) {
					expandNodesWithChildren(expandedSet, levelData)
				}
			}
		},
		[getAllLevelData, expandNodesWithChildren],
	)

	// Collapse target level helper
	const collapseTargetLevel = useCallback(
		(expandedSet: Set<string>, targetLevel: number) => {
			const allLevelData = getAllLevelData()
			const levelData = allLevelData[targetLevel]

			if (levelData) {
				// Collapse parent nodes of target level to hide target level
				Object.keys(levelData).forEach((parentNodeId) => {
					expandedSet.delete(parentNodeId)
				})
			}
		},
		[getAllLevelData],
	)

	// Check level expansion helper
	const checkLevelExpansion = useCallback(
		(level: number): boolean => {
			const allLevelData = getAllLevelData()
			const levelData = allLevelData[level]

			if (!levelData) return false

			// Check if any parent node of target level is expanded
			return Object.keys(levelData).some(
				(parentNodeId) =>
					state.expandedNodes.has(parentNodeId) &&
					levelData[parentNodeId] &&
					levelData[parentNodeId].length > 0,
			)
		},
		[getAllLevelData, state.expandedNodes],
	)

	// Enhanced level expand handler - dynamically handles all levels
	const handleLevelExpand = useCallback(
		(level: number) => {
			actions.setExpandedNodes((prev) => {
				const newSet = new Set(prev)
				const maxLevel = getMaxAvailableLevel()

				if (level < 2 || level > maxLevel) {
					return newSet
				}

				// For any level >= 2, expand all levels from 2 to target level
				expandToTargetLevel(newSet, level)

				return newSet
			})
		},
		[actions, getMaxAvailableLevel, expandToTargetLevel],
	)

	// Enhanced level collapse handler - dynamically handles all levels
	const handleLevelCollapse = useCallback(
		(level: number) => {
			actions.setExpandedNodes((prev) => {
				const newSet = new Set(prev)
				const maxLevel = getMaxAvailableLevel()

				if (level < 2 || level > maxLevel) {
					return newSet
				}

				// Collapse all level 1 nodes (parents of level 2)
				nodes.forEach((node) => {
					if (node.level === 1) {
						newSet.delete(node.id)
					}
				})

				// Collapse all levels from target level to maxLevel
				for (
					let currentLevel = level;
					currentLevel <= maxLevel;
					currentLevel++
				) {
					collapseTargetLevel(newSet, currentLevel)
				}

				return newSet
			})
		},
		[actions, nodes, getMaxAvailableLevel, collapseTargetLevel],
	)

	// Enhanced level expanded checker
	const isLevelExpanded = useCallback(
		(level: number): boolean => {
			const maxLevel = getMaxAvailableLevel()

			if (level === 2) {
				// Level 2: Check expansion state of level1 nodes (traditional way)
				return nodes.some(
					(node) => node.level === 1 && state.expandedNodes.has(node.id),
				)
			} else if (level >= MIN_DIRECT_EXPAND_LEVEL && level <= maxLevel) {
				// Level 3+: Check parent level node expansion state (dynamically support max level)
				return checkLevelExpansion(level)
			}
			return false
		},
		[nodes, state.expandedNodes, getMaxAvailableLevel, checkLevelExpansion],
	)

	// Node dimensions based on layout
	const getNodeWidth = useCallback(
		() => (state.layoutDirection === "horizontal" ? 280 : 260),
		[state.layoutDirection],
	)
	const getNodeHeight = useCallback(
		() => (state.layoutDirection === "horizontal" ? 100 : 60),
		[state.layoutDirection],
	)

	return {
		nodes,
		connections,
		getAllLevelData,
		getMaxAvailableLevel,
		handleLevelExpand,
		handleLevelCollapse,
		isLevelExpanded,
		getNodeWidth,
		getNodeHeight,
	}
}
