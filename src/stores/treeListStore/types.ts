import type { Tree } from "@/infrastructure/supabaseRepository"

export interface TreeListState {
	// Tree list data
	trees: Tree[]
	treesLoading: boolean
	pollingTreeId: string | null
	searchResults: Tree[]
	// Search state
	searchQuery: string
}

export interface TreeListActions {
	// State setters
	setTrees: (trees: Tree[]) => void
	setTreesLoading: (loading: boolean) => void
	setPollingTreeId: (treeId: string | null) => void
	setSearchQuery: (query: string) => void
	setSearchResults: (results: Tree[]) => void

	// Async actions
	fetchTrees: () => Promise<Tree[]>
	fetchTreesByProject: (projectId: string) => Promise<Tree[]>
	fetchTreesBySearchQuery: (searchQuery: string) => Promise<Tree[]>

	// Helper actions
	addTree: (tree: Tree) => void
	updateTree: (treeId: string, updates: Partial<Tree>) => void
	removeTree: (treeId: string) => void

	// Search actions
	clearSearch: () => void
}

export interface TreeListGetters {
	// Search getters
	filteredTrees: () => Tree[]
	hasResults: () => boolean
	isSearching: () => boolean
}
