import { useEffect, useRef, useState } from "react"
import { toast } from "@/hooks/use-toast"
import type { NodeSuggestion } from "@/types/chat"
import type { PathLevel, TreeNode } from "@/types/tree"
import type { PathState } from "@/types/ui"
import {
	createNodeFromSuggestion,
	generateChildNode,
} from "./utils/nodeGenerationUtils"

export type { PathState } from "@/types/ui"

export const useNodeOperations = (
	initialLevel1Items: TreeNode[],
	initialLevel2Items: Record<string, TreeNode[]>,
	initialLevel3Items: Record<string, TreeNode[]>,
	initialLevel4Items: Record<string, TreeNode[]> = {},
	initialLevel5Items: Record<string, TreeNode[]> = {},
	initialLevel6Items: Record<string, TreeNode[]> = {},
	initialLevel7Items: Record<string, TreeNode[]> = {},
	initialLevel8Items: Record<string, TreeNode[]> = {},
	initialLevel9Items: Record<string, TreeNode[]> = {},
	initialLevel10Items: Record<string, TreeNode[]> = {},
) => {
	const [level1Items, setLevel1Items] = useState(initialLevel1Items)
	const [level2Items, setLevel2Items] = useState(initialLevel2Items)
	const [level3Items, setLevel3Items] = useState(initialLevel3Items)
	const [level4Items, setLevel4Items] =
		useState<Record<string, TreeNode[]>>(initialLevel4Items)
	const [level5Items, setLevel5Items] =
		useState<Record<string, TreeNode[]>>(initialLevel5Items)
	const [level6Items, setLevel6Items] =
		useState<Record<string, TreeNode[]>>(initialLevel6Items)
	const [level7Items, setLevel7Items] =
		useState<Record<string, TreeNode[]>>(initialLevel7Items)
	const [level8Items, setLevel8Items] =
		useState<Record<string, TreeNode[]>>(initialLevel8Items)
	const [level9Items, setLevel9Items] =
		useState<Record<string, TreeNode[]>>(initialLevel9Items)
	const [level10Items, setLevel10Items] =
		useState<Record<string, TreeNode[]>>(initialLevel10Items)

	// Track previous values to prevent infinite loops
	const prevInitialDataRef = useRef({
		level1Items: initialLevel1Items,
		level2Items: initialLevel2Items,
		level3Items: initialLevel3Items,
		level4Items: initialLevel4Items,
		level5Items: initialLevel5Items,
		level6Items: initialLevel6Items,
		level7Items: initialLevel7Items,
		level8Items: initialLevel8Items,
		level9Items: initialLevel9Items,
		level10Items: initialLevel10Items,
	})

	// Update state when initial data changes (e.g., when database data is loaded)
	useEffect(() => {
		const prevData = prevInitialDataRef.current

		// console.log("🔍 [NODE_OPERATIONS] useEffect triggered", {
		// 	level1Changed: prevData.level1Items !== initialLevel1Items,
		// 	level2Changed: prevData.level2Items !== initialLevel2Items,
		// 	level3Changed: prevData.level3Items !== initialLevel3Items,
		// 	level4Changed: prevData.level4Items !== initialLevel4Items,
		// 	level1Length: initialLevel1Items?.length || 0,
		// 	level2Keys: Object.keys(initialLevel2Items || {}),
		// 	level1Ref: initialLevel1Items,
		// 	level2Ref: initialLevel2Items,
		// })

		// Only update if references actually changed
		if (prevData.level1Items !== initialLevel1Items) {
			// console.log("🔍 [NODE_OPERATIONS] Updating level1Items")
			setLevel1Items(initialLevel1Items)
		}
		if (prevData.level2Items !== initialLevel2Items) {
			// console.log("🔍 [NODE_OPERATIONS] Updating level2Items")
			setLevel2Items(initialLevel2Items)
		}
		if (prevData.level3Items !== initialLevel3Items) {
			// console.log("🔍 [NODE_OPERATIONS] Updating level3Items")
			setLevel3Items(initialLevel3Items)
		}
		if (prevData.level4Items !== initialLevel4Items) {
			// console.log("🔍 [NODE_OPERATIONS] Updating level4Items")
			setLevel4Items(initialLevel4Items)
		}
		if (prevData.level5Items !== initialLevel5Items) {
			// console.log("🔍 [NODE_OPERATIONS] Updating level5Items")
			setLevel5Items(initialLevel5Items)
		}
		if (prevData.level6Items !== initialLevel6Items) {
			// console.log("🔍 [NODE_OPERATIONS] Updating level6Items")
			setLevel6Items(initialLevel6Items)
		}
		if (prevData.level7Items !== initialLevel7Items) {
			// console.log("🔍 [NODE_OPERATIONS] Updating level7Items")
			setLevel7Items(initialLevel7Items)
		}
		if (prevData.level8Items !== initialLevel8Items) {
			// console.log("🔍 [NODE_OPERATIONS] Updating level8Items")
			setLevel8Items(initialLevel8Items)
		}
		if (prevData.level9Items !== initialLevel9Items) {
			// console.log("🔍 [NODE_OPERATIONS] Updating level9Items")
			setLevel9Items(initialLevel9Items)
		}
		if (prevData.level10Items !== initialLevel10Items) {
			// console.log("🔍 [NODE_OPERATIONS] Updating level10Items")
			setLevel10Items(initialLevel10Items)
		}

		// Update refs for next comparison
		prevInitialDataRef.current = {
			level1Items: initialLevel1Items,
			level2Items: initialLevel2Items,
			level3Items: initialLevel3Items,
			level4Items: initialLevel4Items,
			level5Items: initialLevel5Items,
			level6Items: initialLevel6Items,
			level7Items: initialLevel7Items,
			level8Items: initialLevel8Items,
			level9Items: initialLevel9Items,
			level10Items: initialLevel10Items,
		}
	}, [
		initialLevel1Items,
		initialLevel2Items,
		initialLevel3Items,
		initialLevel4Items,
		initialLevel5Items,
		initialLevel6Items,
		initialLevel7Items,
		initialLevel8Items,
		initialLevel9Items,
		initialLevel10Items,
	])
	const addCustomNode = (
		level: PathLevel,
		node: NodeSuggestion,
		selectedPath: PathState,
		setSelectedPath: (updater: (prev: PathState) => PathState) => void,
	) => {
		const newNode = createNodeFromSuggestion(node)
		const nodeId = newNode.id

		if (level === "level1") {
			newNode.level = 1
			setLevel1Items((prev) => [...prev, newNode])

			const childNode = generateChildNode(node.title, 2)
			const childId = childNode.title.toLowerCase().replace(/\s+/g, "-")
			const childTreeNode = {
				id: childId,
				name: childNode.title,
				info: "18論文 • 4事例",
				isCustom: true,
				description: childNode.description,
				level: 2,
			}

			setLevel2Items((prev) => ({
				...prev,
				[nodeId]: [childTreeNode],
			}))

			setSelectedPath((prev) => ({
				...prev,
				level1: nodeId,
				level2: "",
				level3: "",
				level4: "",
			}))
		} else if (level === "level2") {
			newNode.level = 2
			const currentLevel1 = selectedPath.level1
			const currentItems = level2Items[currentLevel1] || []

			setLevel2Items((prev) => ({
				...prev,
				[currentLevel1]: [...currentItems, newNode],
			}))

			const childNode = generateChildNode(node.title, 3)
			const childId = childNode.title.toLowerCase().replace(/\s+/g, "-")
			const childTreeNode = {
				id: childId,
				name: childNode.title,
				info: "18論文 • 4事例",
				isCustom: true,
				description: childNode.description,
				level: 3,
			}

			setLevel3Items((prev) => ({
				...prev,
				[nodeId]: [childTreeNode],
			}))

			setSelectedPath((prev) => ({
				...prev,
				level2: nodeId,
				level3: "",
				level4: "",
			}))
		} else if (level === "level3") {
			newNode.level = 3
			const currentLevel2 = selectedPath.level2
			const currentItems = level3Items[currentLevel2] || []

			setLevel3Items((prev) => ({
				...prev,
				[currentLevel2]: [...currentItems, newNode],
			}))

			setSelectedPath((prev) => ({ ...prev, level3: nodeId, level4: "" }))
		} else if (level === "level4") {
			newNode.level = 4
			const currentLevel3 = selectedPath.level3
			const currentItems = level4Items[currentLevel3] || []

			setLevel4Items((prev) => ({
				...prev,
				[currentLevel3]: [...currentItems, newNode],
			}))

			setSelectedPath((prev) => ({ ...prev, level4: nodeId }))
		}

		toast({
			title: "ノードが追加されました",
			description: `「${node.title}」をレベル ${level.charAt(5)}に追加しました`,
			duration: 2000,
		})
	}

	const editNode = (
		level: string,
		nodeId: string,
		updatedNode: { title: string; description: string },
	) => {
		if (level === "level1") {
			setLevel1Items((prev) =>
				prev.map((item) =>
					item.id === nodeId
						? {
								...item,
								name: updatedNode.title,
								description: updatedNode.description,
							}
						: item,
				),
			)
		} else if (level === "level2") {
			setLevel2Items((prev) => {
				const updatedItems = { ...prev }
				Object.keys(updatedItems).forEach((key) => {
					updatedItems[key] = updatedItems[key].map((item) =>
						item.id === nodeId
							? {
									...item,
									name: updatedNode.title,
									description: updatedNode.description,
								}
							: item,
					)
				})
				return updatedItems
			})
		} else if (level === "level3") {
			setLevel3Items((prev) => {
				const updatedItems = { ...prev }
				Object.keys(updatedItems).forEach((key) => {
					updatedItems[key] = updatedItems[key].map((item) =>
						item.id === nodeId
							? {
									...item,
									name: updatedNode.title,
									description: updatedNode.description,
								}
							: item,
					)
				})
				return updatedItems
			})
		} else if (level === "level4") {
			setLevel4Items((prev) => {
				const updatedItems = { ...prev }
				Object.keys(updatedItems).forEach((key) => {
					updatedItems[key] = updatedItems[key].map((item) =>
						item.id === nodeId
							? {
									...item,
									name: updatedNode.title,
									description: updatedNode.description,
								}
							: item,
					)
				})
				return updatedItems
			})
		}

		toast({
			title: "Node updated",
			description: `Updated description for "${updatedNode.title}"`,
			duration: 2000,
		})
	}

	const deleteNode = (
		level: PathLevel,
		nodeId: string,
		_selectedPath: PathState,
		setSelectedPath: (updater: (prev: PathState) => PathState) => void,
	) => {
		// Clear the selection if the deleted node is currently selected
		setSelectedPath((prev) => {
			if (level === "level1" && prev.level1 === nodeId) {
				return { ...prev, level1: "", level2: "", level3: "", level4: "" }
			} else if (level === "level2" && prev.level2 === nodeId) {
				return { ...prev, level2: "", level3: "", level4: "" }
			} else if (level === "level3" && prev.level3 === nodeId) {
				return { ...prev, level3: "", level4: "" }
			} else if (level === "level4" && prev.level4 === nodeId) {
				return { ...prev, level4: "" }
			}
			return prev
		})

		// Remove the node from state
		if (level === "level1") {
			setLevel1Items((prev) => prev.filter((item) => item.id !== nodeId))

			// Also remove its children from level2Items
			setLevel2Items((prev) => {
				const newLevel2Items = { ...prev }
				delete newLevel2Items[nodeId]
				return newLevel2Items
			})
		} else if (level === "level2") {
			setLevel2Items((prev) => {
				const updatedItems = { ...prev }
				Object.keys(updatedItems).forEach((key) => {
					updatedItems[key] = updatedItems[key].filter(
						(item) => item.id !== nodeId,
					)
				})
				return updatedItems
			})

			// Also remove its children from level3Items
			setLevel3Items((prev) => {
				const newLevel3Items = { ...prev }
				delete newLevel3Items[nodeId]
				return newLevel3Items
			})
		} else if (level === "level3") {
			setLevel3Items((prev) => {
				const updatedItems = { ...prev }
				Object.keys(updatedItems).forEach((key) => {
					updatedItems[key] = updatedItems[key].filter(
						(item) => item.id !== nodeId,
					)
				})
				return updatedItems
			})

			// Also remove its children from level4Items
			setLevel4Items((prev) => {
				const newLevel4Items = { ...prev }
				delete newLevel4Items[nodeId]
				return newLevel4Items
			})
		} else if (level === "level4") {
			setLevel4Items((prev) => {
				const updatedItems = { ...prev }
				Object.keys(updatedItems).forEach((key) => {
					updatedItems[key] = updatedItems[key].filter(
						(item) => item.id !== nodeId,
					)
				})
				return updatedItems
			})
		}
	}
	return {
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
		addCustomNode,
		editNode,
		deleteNode,
	}
}
