import { create } from "zustand"
import type { PathLevel, TreeNode } from "@/types/tree"

/**
 * Tree Data Store
 *
 * Manages the detailed content and structure of a single technology tree.
 * This store handles the nodes, levels, selections, and interactions within a tree visualization.
 *
 * Difference from treeListStore:
 * - treeDataStore: Manages content of a single tree (nodes, levels, structure) - used for tree visualization
 * - treeListStore: Manages list of trees (Tree[]) - used for sidebar, tree selection, etc.
 *
 * Use this store when:
 * - Displaying/rendering a technology tree
 * - Managing node selection and navigation
 * - Editing/deleting/adding nodes within a tree
 * - Tracking tree state (selectedPath, levelItems, etc.)
 */

export interface TreeDataState {
	// Core tree data
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
	}
	level1Items: TreeNode[]
	level2Items: Record<string, TreeNode[]>
	level3Items: Record<string, TreeNode[]>
	level4Items: Record<string, TreeNode[]>
	level5Items?: Record<string, TreeNode[]>
	level6Items?: Record<string, TreeNode[]>
	level7Items?: Record<string, TreeNode[]>
	level8Items?: Record<string, TreeNode[]>
	level9Items?: Record<string, TreeNode[]>
	level10Items?: Record<string, TreeNode[]>

	// Tree metadata
	levelNames: {
		level1: string
		level2: string
		level3: string
		level4: string
		level5?: string
		level6?: string
		level7?: string
		level8?: string
		level9?: string
		level10?: string
	}
	hasUserMadeSelection: boolean
	databaseScenario: string | undefined
	treeMode?: string | undefined
	showLevel4: boolean
}

export interface TreeDataActions {
	// Tree data setters (called by hooks)
	setSelectedPath: (path: TreeDataState["selectedPath"]) => void
	setLevelItems: (
		level: number,
		items: TreeNode[] | Record<string, TreeNode[]>,
	) => void
	setLevelNames: (names: TreeDataState["levelNames"]) => void
	setHasUserMadeSelection: (hasSelection: boolean) => void
	setDatabaseScenario: (scenario: string | undefined) => void
	setTreeMode: (mode: string) => void
	setShowLevel4: (show: boolean) => void

	// Tree actions (to be called by components)
	handleNodeClick: (level: PathLevel, nodeId: string) => void
	editNode: (
		level: PathLevel,
		nodeId: string,
		updatedNode: { title: string; description: string },
	) => void
	deleteNode: (level: PathLevel, nodeId: string) => void
	addCustomNode: (
		parentLevel: PathLevel,
		parentId: string,
		nodeData: { title: string; description: string },
	) => void
	handleAddLevel4: () => void
	handleAddScenario: (context: string) => Promise<void>
	handleQueueNodeSelect: (nodeId: string) => void

	// Internal actions
	_setNodeClickHandler: (
		handler: (level: PathLevel, nodeId: string) => void,
	) => void
	_setEditNodeHandler: (
		handler: (
			level: PathLevel,
			nodeId: string,
			updatedNode: { title: string; description: string },
		) => void,
	) => void
	_setDeleteNodeHandler: (
		handler: (level: PathLevel, nodeId: string) => void,
	) => void
	_setAddCustomNodeHandler: (
		handler: (
			parentLevel: PathLevel,
			parentId: string,
			nodeData: { title: string; description: string },
		) => void,
	) => void
	_setAddLevel4Handler: (handler: () => void) => void
	_setAddScenarioHandler: (handler: (context: string) => Promise<void>) => void
	_setQueueNodeSelectHandler: (handler: (nodeId: string) => void) => void
}

// Internal handler storage
let _nodeClickHandler: ((level: PathLevel, nodeId: string) => void) | null =
	null
let _editNodeHandler:
	| ((
			level: PathLevel,
			nodeId: string,
			updatedNode: { title: string; description: string },
	  ) => void)
	| null = null
let _deleteNodeHandler: ((level: PathLevel, nodeId: string) => void) | null =
	null
let _addCustomNodeHandler:
	| ((
			parentLevel: PathLevel,
			parentId: string,
			nodeData: { title: string; description: string },
	  ) => void)
	| null = null
let _addLevel4Handler: (() => void) | null = null
let _addScenarioHandler: ((context: string) => Promise<void>) | null = null
let _queueNodeSelectHandler: ((nodeId: string) => void) | null = null

export const useTreeDataStore = create<TreeDataState & TreeDataActions>(
	(set, _get) => ({
		// Initial state
		selectedPath: {
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
		level1Items: [],
		level2Items: {},
		level3Items: {},
		level4Items: {},
		level5Items: {},
		level6Items: {},
		level7Items: {},
		level8Items: {},
		level9Items: {},
		level10Items: {},
		levelNames: {
			level1: "",
			level2: "",
			level3: "",
			level4: "",
		},
		hasUserMadeSelection: false,
		databaseScenario: undefined,
		treeMode: "",
		showLevel4: false,
		// Data setters
		setSelectedPath: (path) => set({ selectedPath: path }),
		setLevelItems: (level, items) => {
			const key = `level${level}Items` as keyof TreeDataState
			set({ [key]: items })
		},
		setLevelNames: (names) => set({ levelNames: names }),
		setHasUserMadeSelection: (hasSelection) =>
			set({ hasUserMadeSelection: hasSelection }),
		setDatabaseScenario: (scenario) => set({ databaseScenario: scenario }),
		setTreeMode: (mode) => set({ treeMode: mode }),
		setShowLevel4: (show) => set({ showLevel4: show }),

		// Tree actions (delegated to handlers)
		handleNodeClick: (level, nodeId) => {
			if (_nodeClickHandler) {
				_nodeClickHandler(level, nodeId)
			}
		},
		editNode: (level, nodeId, updatedNode) => {
			if (_editNodeHandler) {
				_editNodeHandler(level, nodeId, updatedNode)
			}
		},
		deleteNode: (level, nodeId) => {
			if (_deleteNodeHandler) {
				_deleteNodeHandler(level, nodeId)
			}
		},
		addCustomNode: (parentLevel, parentId, nodeData) => {
			if (_addCustomNodeHandler) {
				_addCustomNodeHandler(parentLevel, parentId, nodeData)
			}
		},
		handleAddLevel4: () => {
			if (_addLevel4Handler) {
				_addLevel4Handler()
			}
		},
		handleAddScenario: async (context) => {
			if (_addScenarioHandler) {
				return await _addScenarioHandler(context)
			}
		},
		handleQueueNodeSelect: (nodeId) => {
			if (_queueNodeSelectHandler) {
				_queueNodeSelectHandler(nodeId)
			}
		},

		// Internal handler setters
		_setNodeClickHandler: (handler) => {
			_nodeClickHandler = handler
		},
		_setEditNodeHandler: (handler) => {
			_editNodeHandler = handler
		},
		_setDeleteNodeHandler: (handler) => {
			_deleteNodeHandler = handler
		},
		_setAddCustomNodeHandler: (handler) => {
			_addCustomNodeHandler = handler
		},
		_setAddLevel4Handler: (handler) => {
			_addLevel4Handler = handler
		},
		_setAddScenarioHandler: (handler) => {
			_addScenarioHandler = handler
		},
		_setQueueNodeSelectHandler: (handler) => {
			_queueNodeSelectHandler = handler
		},
	}),
)
