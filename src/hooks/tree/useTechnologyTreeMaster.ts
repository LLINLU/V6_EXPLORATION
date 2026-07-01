/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import { useCallback, useEffect, useMemo } from "react"
import { useTechnologyTree } from "@/hooks/useTechnologyTree"
import { supabase } from "@/integrations/supabase/client"
import { freshFrom } from "@/integrations/supabase/writes"
import { getOutputLanguage } from "@/lib/outputLanguage"
import { useChatStore } from "@/stores/chatStore"
import { useTreeDataStore } from "@/stores/treeDataStore"
import { useTreeUIStore } from "@/stores/treeUIStore"
import type {
	ContextMode,
	LocationState,
	TreeMode,
	TreeNode,
	ViewMode,
} from "@/types/tree"
import { useUserDetail } from "../useUserDetail"
import { useChatContext } from "./useChatContext"
import { useNodeEnrichment } from "./useNodeEnrichment"
import { useNodeSelection } from "./useNodeSelection"
import { useTechnologyTreeEnrichment } from "./useTechnologyTreeEnrichment"

interface DatabaseTreeData {
	mode?: TreeMode
	[key: string]: any
}

interface MasterParams {
	databaseTreeData: DatabaseTreeData | null
	viewModeHook: {
		viewMode: ViewMode
		toggleView: () => void
		justSwitchedView: boolean
		clearViewSwitchFlag: () => void
		setMindmapExpansionState: (state: Set<string>) => void
		getMindmapExpansionState: () => Set<string>
		saveMindmapPanZoomState: (state: {
			zoom: number
			panX: number
			panY: number
		}) => void
		getMindmapPanZoomState: () => { zoom: number; panX: number; panY: number }
	}
	locationState: LocationState | null
	currentQuery: string
	contextMode: ContextMode
	searchMode: string
}

export const useTechnologyTreeMaster = ({
	databaseTreeData,
	viewModeHook,
	locationState,
	currentQuery,
	contextMode,
	searchMode,
}: MasterParams) => {
	// Get tree data store
	const treeDataStore = useTreeDataStore()
	const { initializeUI } = useTreeUIStore()
	const userDetails = useUserDetail()

	// Node enrichment logic (needs to be before useTechnologyTree)
	const treeMode =
		databaseTreeData?.mode ||
		(locationState?.treeData as DatabaseTreeData)?.mode ||
		"TED"

	// Core technology tree state
	const {
		selectedPath,
		userClickedNode,
		sidebarTab,
		showSidebar,
		collapsedSidebar,
		setSidebarTab,
		setShowSidebar,
		handleNodeClick,
		toggleSidebar,
		hasUserMadeSelection,
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
		scenario: databaseScenario,
	} = useTechnologyTree(databaseTreeData, viewModeHook, () => {})

	// Available nodes for @ mention functionality
	const availableNodes = useMemo(() => {
		const nodes: Array<{
			id: string
			title: string
			level: number
			description?: string
		}> = []

		// Define level items mapping for dynamic processing
		const levelItemsMap = [
			{ items: level1Items, level: 1 },
			{ items: level2Items, level: 2 },
			{ items: level3Items, level: 3 },
			{ items: level4Items, level: 4 },
			{ items: level5Items, level: 5 },
			{ items: level6Items, level: 6 },
			{ items: level7Items, level: 7 },
			{ items: level8Items, level: 8 },
			{ items: level9Items, level: 9 },
			{ items: level10Items, level: 10 },
		]

		levelItemsMap.forEach(({ items, level }) => {
			if (!items) return

			// Handle level 1 items (array) vs higher level items (object)
			let itemsArray: TreeNode[]
			if (level === 1) {
				// level1Items is an array
				itemsArray = Array.isArray(items) ? items : []
			} else {
				// Higher level items are objects with arrays as values
				itemsArray =
					typeof items === "object" && !Array.isArray(items)
						? Object.values(items).flat()
						: []
			}

			itemsArray.forEach((node: TreeNode) => {
				if (node?.id && node?.name) {
					nodes.push({
						id: node.id,
						title: node.name,
						level,
						description: node.description,
					})
				}
			})
		})

		return nodes
	}, [
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
	])

	// Node enrichment logic (after we have selectedPath)
	const { fetchAndSetNodeContext, enrichNode } = useNodeEnrichment({
		locationState,
		databaseTreeData,
		currentQuery,
		selectedPath,
		treeMode,
		searchMode,
	})

	// Node selection management
	const {
		handleTreeNodeClick,
		handleMentionNodeSelect,
		handleQueueNodeSelect: handleQueueNodeSelection,
	} = useNodeSelection({
		onTreeNodeClick: handleNodeClick,
		onEnrichNode: enrichNode,
		onFetchAndSetContext: fetchAndSetNodeContext,
		availableNodes,
	})

	// Sync tree data to store when it changes
	// biome-ignore lint/correctness/useExhaustiveDependencies:treeDataStore should not be included in the dependency array
	const syncTreeDataToStore = useCallback(() => {
		// Update tree data in store
		treeDataStore.setSelectedPath(selectedPath)
		treeDataStore.setLevelItems(1, level1Items)
		treeDataStore.setLevelItems(2, level2Items)
		treeDataStore.setLevelItems(3, level3Items)
		treeDataStore.setLevelItems(4, level4Items)
		if (level5Items) treeDataStore.setLevelItems(5, level5Items)
		if (level6Items) treeDataStore.setLevelItems(6, level6Items)
		if (level7Items) treeDataStore.setLevelItems(7, level7Items)
		if (level8Items) treeDataStore.setLevelItems(8, level8Items)
		if (level9Items) treeDataStore.setLevelItems(9, level9Items)
		if (level10Items) treeDataStore.setLevelItems(10, level10Items)
		treeDataStore.setShowLevel4(showLevel4)
		treeDataStore.setHasUserMadeSelection(hasUserMadeSelection)
		treeDataStore.setDatabaseScenario(databaseScenario)

		// Set tree mode
		const treeMode =
			databaseTreeData?.mode ||
			(locationState?.treeData as DatabaseTreeData)?.mode
		if (treeMode) {
			treeDataStore.setTreeMode(treeMode)
		}
	}, [
		selectedPath,
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
		hasUserMadeSelection,
		databaseScenario,
		databaseTreeData,
		locationState,
		// treeDataStore intentionally omitted - Zustand store methods are stable
	])

	// Helper: get axis_type for a given level and tree mode
	const getAxisType = useCallback(
		(levelStr: string): string => {
			const levelNum = Number.parseInt(levelStr.replace("level", ""), 10)
			if (treeMode === "FAST") {
				const fastAxisMap: Record<number, string> = {
					0: "Root",
					1: "How1",
					2: "How2",
					3: "How3",
					4: "How4",
					5: "How5",
					6: "How6",
				}
				return fastAxisMap[levelNum] || `How${levelNum}`
			}
			// TED mode
			const tedAxisMap: Record<number, string> = {
				0: "Root",
				1: "Scenario",
				2: "Purpose",
				3: "Function",
				4: "Technology",
				5: "Measure",
			}
			return tedAxisMap[levelNum] || "Measure"
		},
		[treeMode],
	)

	// DB-persisted delete handler
	const deleteNodeWithPersistence = useCallback(
		(level: string, nodeId: string) => {
			const _isCurrentSelection =
				selectedPath[
					`level${level.replace("level", "")}` as keyof typeof selectedPath
				] === nodeId

			// Persist to database
			const treeId = locationState?.treeId
			if (treeId) {
				supabase
					.from("tree_nodes")
					.delete()
					.eq("id", nodeId)
					.then(({ error }) => {
						if (error) {
							console.error(
								"[useTechnologyTreeMaster] Failed to delete node from DB:",
								error,
							)
						} else {
							deleteNode(level as any, nodeId)
							setShowSidebar(false)
							treeDataStore.setSelectedPath({
								...selectedPath,
								[`level${level.replace("level", "")}`]: null,
							})
						}
					})
			} else {
				console.error("Couldn't delete node")
			}
		},
		[
			deleteNode,
			locationState?.treeId,
			selectedPath,
			treeDataStore,
			setShowSidebar,
		],
	)

	// DB-persisted add handler
	const addNodeWithPersistence = useCallback(
		async (
			level: string,
			parentId: string,
			nodeData: { title: string; description: string },
		) => {
			const nodeId = crypto.randomUUID()
			const treeId = locationState?.treeId

			const team_id = userDetails?.userDetails?.team_id
			const user_id = userDetails?.userDetails?.user_id

			if (!treeId) {
				throw new Error("Missing treeId: Cannot persist node.")
			}

			if (!team_id) {
				throw new Error("Missing team_id: Cannot persist node.")
			}

			const levelNum = Number.parseInt(level.replace("level", ""), 10)
			const axisType = getAxisType(level)
			const isFastLevel1 = treeMode === "FAST" && levelNum === 1

			try {
				// 1. Resolve the parent ID first
				let resolvedParentId = parentId || null

				if (levelNum === 1) {
					const { data: rootNodes, error: fetchError } = await supabase
						.from("tree_nodes")
						.select("id")
						.eq("tree_id", treeId)
						.eq("level", 0)
						.single() // Using .single() assuming one root

					if (fetchError) throw fetchError
					resolvedParentId = rootNodes?.id || null
				}

				// 2. Insert into Database
				// FAST level-1 nodes get children_count: 0 to mark them as pending subtree generation.
				// All other nodes use null (leaf nodes with no planned children).
				const { error } = await (await freshFrom("tree_nodes")).insert({
					id: nodeId,
					tree_id: treeId,
					team_id: team_id,
					user_id: user_id,
					parent_id: resolvedParentId,
					name: nodeData.title,
					description: nodeData.description || null,
					axis: axisType as any,
					level: levelNum,
					children_count: isFastLevel1 ? 0 : null,
					node_order: 999,
				})

				if (error) throw error

				// 3. Update UI only after DB success
				addCustomNode(level as any, {
					id: nodeId,
					title: nodeData.title,
					level: 0, // Keeping your original level logic for the UI call
					description: nodeData.description,
				})

				enrichNode(nodeId, levelNum, undefined, nodeData.title, team_id)

				// 4. For FAST level-1 nodes, trigger subtree generation (How2/How3/How4)
				if (isFastLevel1 && currentQuery) {
					supabase.functions
						.invoke("generate-tree-fast-v3", {
							body: {
								treeId,
								searchTheme: currentQuery,
								team_id,
								user_id,
								language: getOutputLanguage(),
								specificImplementation: {
									id: nodeId,
									name: nodeData.title,
									description: nodeData.description || "",
								},
							},
						})
						.catch((err: unknown) => {
							console.error(
								"[useTechnologyTreeMaster] Failed to trigger subtree generation:",
								err,
							)
						})
				}
			} catch (error) {
				console.error("[useTechnologyTreeMaster] Action failed:", error)
				// Re-throw or handle the error so the UI can notify the user
				throw error
			}
		},
		[
			addCustomNode,
			enrichNode,
			locationState?.treeId,
			getAxisType,
			treeMode,
			currentQuery,
			userDetails,
		],
	)

	// Set handler functions in store
	useEffect(() => {
		treeDataStore._setNodeClickHandler(handleTreeNodeClick)
		treeDataStore._setEditNodeHandler(editNode)
		treeDataStore._setDeleteNodeHandler(deleteNodeWithPersistence)
		treeDataStore._setAddCustomNodeHandler(addNodeWithPersistence)
		treeDataStore._setAddLevel4Handler(handleAddLevel4)
		// treeDataStore intentionally omitted - Zustand store methods are stable
		// biome-ignore lint/correctness/useExhaustiveDependencies:treeDataStore should not be included in the dependency array
	}, [
		handleTreeNodeClick,
		editNode,
		deleteNodeWithPersistence,
		addNodeWithPersistence,
		handleAddLevel4,
	])

	// Node enrichment logic
	const { triggerNodeEnrichment } = useTechnologyTreeEnrichment({
		locationState,
		databaseTreeData,
		currentQuery,
		selectedPath,
	})

	// Chat context creation
	const { nodeContext } = useChatContext({ contextMode })
	const chatStore = useChatStore()

	// Initialize UI on mount (from useTreeEffects)
	useEffect(() => {
		initializeUI()
	}, [initializeUI])

	// Set availableNodes in chatStore whenever they change
	// Note: nodeContext is NOT set here to avoid infinite loop.
	// Components should get nodeContext directly from useChatContext hook.
	useEffect(() => {
		chatStore.setAvailableNodes(availableNodes)
		// chatStore intentionally omitted - Zustand store methods are stable
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [availableNodes])

	return {
		// Core tree state (essential)
		selectedPath,
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
		hasUserMadeSelection,
		databaseScenario,
		treeMode,

		// UI state management
		sidebarTab,
		showSidebar,
		collapsedSidebar,
		setSidebarTab,
		setShowSidebar,
		toggleSidebar,

		// Node interaction handlers - BACKWARD COMPATIBLE
		handleNodeClick: handleTreeNodeClick,
		handleNodeSelect: handleMentionNodeSelect,
		handleQueueNodeSelect: handleQueueNodeSelection,

		// Chat context handlers (NEW)
		handleTreeNodeClick,

		// Node modification
		addCustomNode,
		editNode,
		deleteNode,
		handleAddLevel4,

		// Context and available nodes
		nodeContext,
		availableNodes,

		// Legacy exports (to be deprecated)
		userClickedNode,
		triggerNodeEnrichment,

		syncTreeDataToStore,
	}
}
