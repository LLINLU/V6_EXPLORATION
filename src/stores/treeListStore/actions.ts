import { cleanupName } from "@/hooks/tree/utils/stringCleaner"
import type { Tree } from "@/infrastructure/supabaseRepository"
import { projectService } from "@/services/projectService"
import { treeService } from "@/services/treeService"
import { useProjectStore } from "@/stores/projectStore"
import type { TreeListState } from "./types"

/**
 * Process trees with cleanup and defaults
 */
function processTrees(trees: Tree[]): Tree[] {
	return trees.map((tree: Tree) => ({
		...tree,
		mode: tree.mode ?? "",
		name: cleanupName(tree.name ?? ""),
		updated_at: tree.updated_at ?? "",
		last_viewed_at: tree.last_viewed_at ?? "",
	}))
}

/**
 * Fetch trees by team ID with optional project filtering
 */
export async function fetchTrees(
	get: () => TreeListState & import("./types").TreeListActions,
	set: (state: Partial<TreeListState>) => void,
): Promise<Tree[]> {
	const { treesLoading, setTrees } = get()

	// Prevent multiple simultaneous calls
	if (treesLoading) {
		return get().trees
	}

	try {
		set({ treesLoading: true })
		let data: Tree[]
		const { selectedProjectId } = useProjectStore.getState()
		if (selectedProjectId) {
			data = await projectService.fetchTreesByProject(selectedProjectId)
		} else {
			data = await treeService.fetchTrees()
		}
		const result = data || []
		const processedTrees = processTrees(result)

		setTrees(processedTrees)
		return processedTrees
	} catch (error) {
		console.error("Failed to fetch trees:", error)
		setTrees([])
		return []
	} finally {
		set({ treesLoading: false })
	}
}

/**
 * Fetch trees for a specific project
 */
export async function fetchTreesByProject(
	get: () => TreeListState & import("./types").TreeListActions,
	set: (state: Partial<TreeListState>) => void,
	projectId: string,
): Promise<Tree[]> {
	const { treesLoading, setTrees } = get()

	// Prevent multiple simultaneous calls
	if (treesLoading) {
		return get().trees
	}

	try {
		set({ treesLoading: true })

		const data = await projectService.fetchTreesByProject(projectId)
		const result = data || []
		const processedTrees = processTrees(result)

		setTrees(processedTrees)
		return processedTrees
	} catch (error) {
		console.error("Failed to fetch trees by project:", error)
		setTrees([])
		return []
	} finally {
		set({ treesLoading: false })
	}
}

/**
 * Fetch trees based on a specific searchQuery
 */
export async function fetchTreesBySearchQuery(
	get: () => TreeListState & import("./types").TreeListActions,
	set: (state: Partial<TreeListState>) => void,
	searchQuery: string,
): Promise<Tree[]> {
	const { treesLoading, setSearchResults } = get()

	// Prevent multiple simultaneous calls
	if (treesLoading) {
		return get().searchResults
	}
	try {
		set({ treesLoading: true })

		const data = await treeService.fetchTreesBySearchQuery(searchQuery)
		const result = data || []
		const processedTrees = processTrees(result)

		setSearchResults(processedTrees)
		return processedTrees
	} catch (error) {
		console.error("Failed to fetch trees by search query:", error)
		setSearchResults([])
		return []
	} finally {
		set({ treesLoading: false })
	}
}

/**
 * Add a tree to the beginning of the list
 */
export function addTree(
	get: () => TreeListState,
	set: (state: Partial<TreeListState>) => void,
	tree: Tree,
): void {
	const { trees } = get()
	set({ trees: [tree, ...trees] })
}

/**
 * Update a tree by ID
 */
export function updateTree(
	get: () => TreeListState,
	set: (state: Partial<TreeListState>) => void,
	treeId: string,
	updates: Partial<Tree>,
): void {
	const { trees } = get()
	set({
		trees: trees.map((tree) =>
			tree.id === treeId ? { ...tree, ...updates } : tree,
		),
	})
}

/**
 * Remove a tree by ID
 */
export function removeTree(
	get: () => TreeListState,
	set: (state: Partial<TreeListState>) => void,
	treeId: string,
): void {
	const { trees } = get()
	set({ trees: trees.filter((tree) => tree.id !== treeId) })
}
