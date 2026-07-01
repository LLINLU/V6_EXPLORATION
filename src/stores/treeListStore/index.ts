import { create } from "zustand"
import * as actions from "./actions"
import type { TreeListActions, TreeListGetters, TreeListState } from "./types"

/**
 * Tree List Store
 *
 * Manages the list of trees (metadata) for display in sidebars and tree selection UIs.
 * This store handles the collection of trees, not the detailed content of individual trees.
 *
 * Difference from treeDataStore:
 * - treeListStore: Manages list of trees (Tree[]) - used for sidebar, tree selection, etc.
 * - treeDataStore: Manages content of a single tree (nodes, levels, structure) - used for tree visualization
 *
 * Use this store when:
 * - Displaying a list of available trees
 * - Fetching/refreshing tree metadata
 * - Adding/removing trees from the list
 * - Updating tree metadata (last_viewed_at, etc.)
 * - Searching through trees
 */

export const useTreeListStore = create<
	TreeListState & TreeListActions & TreeListGetters
>((set, get) => ({
	// Initial state
	trees: [],
	searchResults: [],
	treesLoading: false,
	pollingTreeId: null,
	searchQuery: "",

	// State setters
	setTrees: (trees) => set({ trees }),
	setTreesLoading: (loading) => set({ treesLoading: loading }),
	setPollingTreeId: (treeId) => set({ pollingTreeId: treeId }),
	setSearchQuery: (query) => set({ searchQuery: query }),
	setSearchResults: (results) => set({ searchResults: results }),

	// Async actions
	fetchTrees: async () => actions.fetchTrees(get, set),
	fetchTreesByProject: async (projectId) =>
		actions.fetchTreesByProject(get, set, projectId),
	fetchTreesBySearchQuery: async (searchQuery: string) =>
		actions.fetchTreesBySearchQuery(get, set, searchQuery),

	// Helper actions
	addTree: (tree) => actions.addTree(get, set, tree),
	updateTree: (treeId, updates) =>
		actions.updateTree(get, set, treeId, updates),
	removeTree: (treeId) => actions.removeTree(get, set, treeId),

	// Search actions
	clearSearch: () => set({ searchQuery: "", searchResults: [] }),

	// Search getters
	filteredTrees: () => {
		const { trees, searchResults, searchQuery } = get()

		if (!searchQuery.trim()) {
			return trees
		}

		const normalizedQuery = searchQuery.toLowerCase().trim()

		return searchResults.length
			? searchResults
			: trees.filter((tree) => {
					const normalizedName = tree.name.toLowerCase()
					return normalizedName.includes(normalizedQuery)
				})
	},

	hasResults: () => {
		const filteredTrees = get().filteredTrees()
		return filteredTrees.length > 0
	},

	isSearching: () => {
		const { searchQuery } = get()
		return searchQuery.trim().length > 0
	},
}))

// Re-export types
export type { TreeListActions, TreeListGetters, TreeListState } from "./types"
