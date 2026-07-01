// deno-lint-ignore-file no-explicit-any
/**
 * Test helpers and mock data for duplicate-tree tests
 */

// =============================================================================
// MOCK DATA
// =============================================================================

export const mockTree = {
	id: "tree-123",
	name: "Original Tree",
	description: "Test description",
	search_theme: "AI",
	reasoning: "Test reasoning",
	layer_config: {},
	scenario_inputs: {},
	mode: "standard",
	team_id: "team-1",
	user_id: "user-1",
}

export const mockNodes = [
	{
		id: "node-1",
		tree_id: "tree-123",
		parent_id: null,
		name: "Root Node",
		description: "Root",
		level: 0,
		axis: "main",
		node_order: 0,
		path: "0",
		children_count: 1,
		team_id: "team-1",
		user_id: "user-1",
	},
	{
		id: "node-2",
		tree_id: "tree-123",
		parent_id: "node-1",
		name: "Child Node",
		description: "Child",
		level: 1,
		axis: "main",
		node_order: 0,
		path: "0.0",
		children_count: 0,
		team_id: "team-1",
		user_id: "user-1",
	},
]

export const mockPapers = [
	{
		id: "paper-1",
		node_id: "node-1",
		tree_id: "tree-123",
		title: "Test Paper",
		abstract: "Abstract",
		authors: ["Author 1"],
		journal: "Journal",
		date: "2024-01-01",
		doi: "10.1234/test",
		url: "https://example.com",
		citations: 10,
		score: 0.9,
		region: "US",
		tags: ["AI"],
		team_id: "team-1",
		user_id: "user-1",
	},
]

export const mockUseCases = [
	{
		id: "usecase-1",
		node_id: "node-1",
		tree_id: "tree-123",
		product: "Test Product",
		description: "Test Description",
		company: "Test Company",
		press_releases: [],
		team_id: "team-1",
		user_id: "user-1",
	},
]

export const mockMarketInfo = [
	{
		node_id: "node-1",
		tree_id: "tree-123",
		hist_data: {},
		market_trl: 5,
		paper_trl: 4,
		statistics: {},
		team_id: "team-1",
		user_id: "user-1",
	},
]

export const mockPaperSummary = {
	node_id: "node-1",
	tree_id: "tree-123",
	query: "test query",
	summary: "test summary",
	papers_count: 5,
	team_id: "team-1",
	user_id: "user-1",
}

export const mockUseCaseSummary = {
	node_id: "node-1",
	tree_id: "tree-123",
	query: "test query",
	summary: "test summary",
	usecases_count: 3,
	team_id: "team-1",
	user_id: "user-1",
}

// =============================================================================
// MOCK SUPABASE CLIENT
// =============================================================================

export interface MockSupabaseClientOptions {
	tree?: any
	nodes?: any[]
	papers?: any[]
	useCases?: any[]
	marketInfo?: any[]
	paperSummary?: any
	useCaseSummary?: any
	newTree?: any
	insertSuccess?: boolean
	throwError?: boolean
}

/**
 * Creates a mock Supabase client for testing
 */
export function createMockSupabaseClient(
	options: MockSupabaseClientOptions = {},
) {
	const {
		tree = mockTree,
		nodes = mockNodes,
		papers = mockPapers,
		useCases = mockUseCases,
		marketInfo = mockMarketInfo,
		paperSummary = mockPaperSummary,
		useCaseSummary = mockUseCaseSummary,
		newTree = { ...mockTree, id: "tree-456", name: "Original Tree (Copy)" },
		insertSuccess = true,
		throwError = false,
	} = options

	return {
		from: (table: string) => {
			// technology_trees table
			if (table === "technology_trees") {
				return {
					select: () => ({
						eq: () => ({
							single: () => ({
								data: throwError ? null : tree,
								error: throwError ? { message: "Not found" } : null,
							}),
						}),
					}),
					insert: (data: any) => ({
						select: () => ({
							single: () => ({
								data: insertSuccess ? { ...data, id: newTree.id } : null,
								error: insertSuccess ? null : { message: "Insert failed" },
							}),
						}),
					}),
				}
			}

			// tree_nodes table
			if (table === "tree_nodes") {
				return {
					select: () => ({
						eq: () => ({
							order: () => ({
								order: () => ({
									data: nodes,
									error: throwError ? { message: "Fetch failed" } : null,
								}),
							}),
						}),
					}),
					insert: () => ({
						error: null,
					}),
				}
			}

			// node_papers table
			if (table === "node_papers") {
				return {
					select: () => ({
						eq: () => ({
							data: papers,
							error: null,
						}),
					}),
					insert: () => ({
						error: null,
					}),
				}
			}

			// node_use_cases table
			if (table === "node_use_cases") {
				return {
					select: () => ({
						eq: () => ({
							data: useCases,
							error: null,
						}),
					}),
					insert: () => ({
						error: null,
					}),
				}
			}

			// node_marketinfo table
			if (table === "node_marketinfo") {
				return {
					select: () => ({
						eq: () => ({
							data: marketInfo,
							error: null,
						}),
					}),
					insert: () => ({
						error: null,
					}),
				}
			}

			// node_papers_summary table
			if (table === "node_papers_summary") {
				return {
					select: () => ({
						eq: () => ({
							maybeSingle: () => ({
								data: paperSummary,
								error: null,
							}),
						}),
					}),
					insert: () => ({
						error: null,
					}),
				}
			}

			// node_usecases_summary table
			if (table === "node_usecases_summary") {
				return {
					select: () => ({
						eq: () => ({
							maybeSingle: () => ({
								data: useCaseSummary,
								error: null,
							}),
						}),
					}),
					insert: () => ({
						error: null,
					}),
				}
			}

			// Default fallback
			return {
				select: () => ({}),
				insert: () => ({ error: null }),
			}
		},
	}
}
