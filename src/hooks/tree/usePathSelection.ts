import { useEffect, useMemo } from "react"
import type { NodeSuggestion } from "@/types/chat"
import type { PathLevel } from "@/types/tree"
import { useNodeOperations } from "./useNodeOperations"
import { usePathSelectionState } from "./usePathSelectionState"

export const usePathSelection = (
	initialPath = {
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
	},
	treeData?: {
		level1Items?: any[]
		level2Items?: Record<string, any[]>
		level3Items?: Record<string, any[]>
		level4Items?: Record<string, any[]>
		level5Items?: Record<string, any[]>
		level6Items?: Record<string, any[]>
		level7Items?: Record<string, any[]>
		level8Items?: Record<string, any[]>
		level9Items?: Record<string, any[]>
		level10Items?: Record<string, any[]>
	},
	isMindmapView = false,
	handleTreeNodeClick?: (level: string, nodeId: string) => void,
) => {
	const {
		selectedPath,
		setSelectedPath,
		hasUserMadeSelection,
		handleNodeClick: handlePathNodeClick,
		showLevel4,
		setShowLevel4: _setShowLevel4,
		handleAddLevel4,
		updateTreeData,
		userClickedNode, // NEW: Get the user's actual clicked node
	} = usePathSelectionState(initialPath, isMindmapView, handleTreeNodeClick)

	// Update tree data for auto-selection
	useEffect(() => {
		if (treeData) {
			updateTreeData(treeData)
		}
	}, [treeData, updateTreeData])

	// Memoize empty arrays/objects to prevent infinite loops in useNodeOperations
	const emptyArray = useMemo(() => [], [])
	const emptyObject = useMemo(() => ({}), [])

	// Use only TED-generated data if available, otherwise use stable empty references
	const level1Data = useMemo(
		() => treeData?.level1Items || emptyArray,
		[treeData?.level1Items, emptyArray],
	)
	const level2Data = useMemo(
		() => treeData?.level2Items || emptyObject,
		[treeData?.level2Items, emptyObject],
	)
	const level3Data = useMemo(
		() => treeData?.level3Items || emptyObject,
		[treeData?.level3Items, emptyObject],
	)
	const level4Data = useMemo(
		() => treeData?.level4Items || emptyObject,
		[treeData?.level4Items, emptyObject],
	)
	const level5Data = useMemo(
		() => treeData?.level5Items || emptyObject,
		[treeData?.level5Items, emptyObject],
	)
	const level6Data = useMemo(
		() => treeData?.level6Items || emptyObject,
		[treeData?.level6Items, emptyObject],
	)
	const level7Data = useMemo(
		() => treeData?.level7Items || emptyObject,
		[treeData?.level7Items, emptyObject],
	)
	const level8Data = useMemo(
		() => treeData?.level8Items || emptyObject,
		[treeData?.level8Items, emptyObject],
	)
	const level9Data = useMemo(
		() => treeData?.level9Items || emptyObject,
		[treeData?.level9Items, emptyObject],
	)
	const level10Data = useMemo(
		() => treeData?.level10Items || emptyObject,
		[treeData?.level10Items, emptyObject],
	)

	const {
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
		addCustomNode: addNode,
		editNode,
		deleteNode: removeNode,
	} = useNodeOperations(
		level1Data,
		level2Data,
		level3Data,
		level4Data,
		level5Data,
		level6Data,
		level7Data,
		level8Data,
		level9Data,
		level10Data,
	)

	// FIXED: Only update path in treemap mode, skip auto-selection in mindmap mode
	useEffect(() => {
		// console.log("Path update effect triggered:", {
		// 	isMindmapView,
		// 	hasTreeData: !!treeData?.level1Items,
		// 	currentLevel1: selectedPath.level1,
		// })

		// Skip auto-selection entirely in mindmap mode
		if (isMindmapView) {
			// console.log("Mindmap mode: Skipping auto-selection path update")
			return
		}

		// Only run auto-selection logic in treemap mode
		if (treeData?.level1Items && treeData.level1Items.length > 0) {
			const currentLevel1Exists = treeData.level1Items.find(
				(item) => item.id === selectedPath.level1,
			)
			if (!currentLevel1Exists) {
				// console.log("Treemap mode: Auto-selecting first level1 item")
				setSelectedPath((prev) => ({
					...prev,
					level1: treeData.level1Items?.[0].id,
					level2: "",
					level3: "",
					level4: "",
					level5: "",
					level6: "",
					level7: "",
					level8: "",
					level9: "",
					level10: "",
				}))
			}
		}
	}, [treeData, setSelectedPath, isMindmapView, selectedPath.level1])

	// Wrapper functions to maintain the same API
	const handleNodeClick = (level: PathLevel, nodeId: string) => {
		handlePathNodeClick(level, nodeId)
	}

	const addCustomNode = (level: PathLevel, node: NodeSuggestion) => {
		addNode(level, node, selectedPath, setSelectedPath)
	}

	const deleteNode = (level: PathLevel, nodeId: string) => {
		removeNode(level, nodeId, selectedPath, setSelectedPath)
	}
	return {
		selectedPath,
		hasUserMadeSelection,
		handleNodeClick,
		addCustomNode,
		editNode,
		deleteNode,
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
		showLevel4,
		handleAddLevel4,
		userClickedNode, // NEW: Expose the user's actual clicked node
	}
}
