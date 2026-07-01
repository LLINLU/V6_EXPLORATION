// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

interface DuplicateTreeRequest {
	tree_id: string
	new_name?: string
}

interface DuplicateTreeResponse {
	success: boolean
	new_tree_id?: string
	error?: string
	stats?: DuplicationStats
}

interface DuplicationStats {
	nodes_copied: number
	papers_copied: number
	use_cases_copied: number
	marketinfo_copied: number
	papers_summary_copied: number
	usecases_summary_copied: number
}

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
}

// =============================================================================
// TREE OPERATIONS
// =============================================================================

/**
 * Fetch the original tree to be duplicated
 */
export async function fetchOriginalTree(supabaseClient: any, treeId: string) {
	const { data: tree, error } = await supabaseClient
		.from("technology_trees")
		.select("*")
		.eq("id", treeId)
		.single()

	if (error || !tree) {
		console.error(`[DUPLICATE] Tree not found:`, error)
		throw new Error(`Tree not found: ${treeId}`)
	}

	console.log(`[DUPLICATE] Original tree:`, tree.name)
	return tree
}

/**
 * Create a new tree record based on the original
 */
export async function createNewTree(
	supabaseClient: any,
	originalTree: any,
	newName?: string,
	userId?: string,
) {
	const treeName = newName || `${originalTree.name} (Copy)`

	const { data: newTree, error } = await supabaseClient
		.from("technology_trees")
		.insert({
			name: treeName,
			description: originalTree.description,
			search_theme: originalTree.search_theme,
			reasoning: originalTree.reasoning,
			layer_config: originalTree.layer_config,
			scenario_inputs: originalTree.scenario_inputs,
			mode: originalTree.mode,
			team_id: originalTree.team_id,
			user_id: userId || originalTree.user_id,
		})
		.select()
		.single()

	if (error || !newTree) {
		console.error(`[DUPLICATE] Failed to create new tree:`, error)
		throw new Error(`Failed to create new tree: ${error?.message}`)
	}

	console.log(`[DUPLICATE] Created new tree: ${newTree.id}`)
	return newTree
}

// =============================================================================
// NODE OPERATIONS
// =============================================================================

/**
 * Fetch all nodes for a tree, ordered by level
 */
export async function fetchTreeNodes(supabaseClient: any, treeId: string) {
	const { data: nodes, error } = await supabaseClient
		.from("tree_nodes")
		.select("*")
		.eq("tree_id", treeId)
		.order("level", { ascending: true })
		.order("node_order", { ascending: true })

	if (error) {
		console.error(`[DUPLICATE] Failed to fetch nodes:`, error)
		throw new Error(`Failed to fetch nodes: ${error.message}`)
	}

	console.log(`[DUPLICATE] Found ${nodes?.length || 0} nodes to copy`)
	return nodes || []
}

/**
 * Duplicate all nodes and create ID mapping
 */
export async function duplicateNodes(
	supabaseClient: any,
	originalNodes: any[],
	newTreeId: string,
	userId?: string,
): Promise<{ nodeIdMap: Map<string, string>; nodesCopied: number }> {
	const nodeIdMap = new Map<string, string>()
	let nodesCopied = 0

	for (const node of originalNodes) {
		const newNodeId = crypto.randomUUID()
		nodeIdMap.set(node.id, newNodeId)

		const newParentId = node.parent_id ? nodeIdMap.get(node.parent_id) : null

		const { error } = await supabaseClient.from("tree_nodes").insert({
			id: newNodeId,
			tree_id: newTreeId,
			parent_id: newParentId,
			name: node.name,
			description: node.description,
			level: node.level,
			axis: node.axis,
			node_order: node.node_order,
			path: node.path,
			children_count: node.children_count,
			team_id: node.team_id,
			user_id: userId || node.user_id,
		})

		if (error) {
			console.error(`[DUPLICATE] Failed to insert node ${node.id}:`, error)
			throw new Error(`Failed to insert node: ${error.message}`)
		}

		nodesCopied++
	}

	console.log(`[DUPLICATE] Copied ${nodesCopied} nodes`)
	return { nodeIdMap, nodesCopied }
}

// =============================================================================
// NODE DATA DUPLICATION
// =============================================================================

/**
 * Duplicate market info for a node
 */
export async function duplicateMarketInfo(
	supabaseClient: any,
	oldNodeId: string,
	newNodeId: string,
	newTreeId: string,
	userId?: string,
): Promise<number> {
	const { data: marketInfo, error } = await supabaseClient
		.from("node_marketinfo")
		.select("*")
		.eq("node_id", oldNodeId)

	if (error) {
		console.warn(`[DUPLICATE] Failed to fetch marketinfo:`, error)
		return 0
	}

	let copied = 0
	if (marketInfo && marketInfo.length > 0) {
		for (const info of marketInfo) {
			const { error: insertError } = await supabaseClient
				.from("node_marketinfo")
				.insert({
					node_id: newNodeId,
					tree_id: newTreeId,
					hist_data: info.hist_data,
					market_trl: info.market_trl,
					paper_trl: info.paper_trl,
					statistics: info.statistics,
					team_id: info.team_id,
					user_id: userId || info.user_id,
				})

			if (!insertError) copied++
		}
	}

	return copied
}

/**
 * Duplicate papers for a node
 */
export async function duplicatePapers(
	supabaseClient: any,
	oldNodeId: string,
	newNodeId: string,
	newTreeId: string,
	userId?: string,
): Promise<number> {
	const { data: papers, error } = await supabaseClient
		.from("node_papers")
		.select("*")
		.eq("node_id", oldNodeId)

	if (error) {
		console.warn(`[DUPLICATE] Failed to fetch papers:`, error)
		return 0
	}

	let copied = 0
	if (papers && papers.length > 0) {
		for (const paper of papers) {
			const { error: insertError } = await supabaseClient
				.from("node_papers")
				.insert({
					id: crypto.randomUUID(),
					node_id: newNodeId,
					tree_id: newTreeId,
					title: paper.title,
					abstract: paper.abstract,
					authors: paper.authors,
					journal: paper.journal,
					date: paper.date,
					doi: paper.doi,
					url: paper.url,
					citations: paper.citations,
					score: paper.score,
					region: paper.region,
					tags: paper.tags,
					team_id: paper.team_id,
					user_id: userId || paper.user_id,
				})

			if (!insertError) copied++
		}
	}

	return copied
}

/**
 * Duplicate paper summary for a node
 */
export async function duplicatePaperSummary(
	supabaseClient: any,
	oldNodeId: string,
	newNodeId: string,
	newTreeId: string,
	userId?: string,
): Promise<number> {
	const { data: summary, error } = await supabaseClient
		.from("node_papers_summary")
		.select("*")
		.eq("node_id", oldNodeId)
		.maybeSingle()

	if (error || !summary) return 0

	const { error: insertError } = await supabaseClient
		.from("node_papers_summary")
		.insert({
			node_id: newNodeId,
			tree_id: newTreeId,
			query: summary.query,
			summary: summary.summary,
			papers_count: summary.papers_count,
			team_id: summary.team_id,
			user_id: userId || summary.user_id,
		})

	return insertError ? 0 : 1
}

/**
 * Duplicate use cases for a node
 */
export async function duplicateUseCases(
	supabaseClient: any,
	oldNodeId: string,
	newNodeId: string,
	newTreeId: string,
	userId?: string,
): Promise<number> {
	const { data: useCases, error } = await supabaseClient
		.from("node_use_cases")
		.select("*")
		.eq("node_id", oldNodeId)

	if (error) {
		console.warn(`[DUPLICATE] Failed to fetch use cases:`, error)
		return 0
	}

	let copied = 0
	if (useCases && useCases.length > 0) {
		for (const useCase of useCases) {
			const { error: insertError } = await supabaseClient
				.from("node_use_cases")
				.insert({
					id: crypto.randomUUID(),
					node_id: newNodeId,
					tree_id: newTreeId,
					product: useCase.product,
					description: useCase.description,
					company: useCase.company,
					press_releases: useCase.press_releases,
					team_id: useCase.team_id,
					user_id: userId || useCase.user_id,
				})

			if (!insertError) copied++
		}
	}

	return copied
}

/**
 * Duplicate use case summary for a node
 */
export async function duplicateUseCaseSummary(
	supabaseClient: any,
	oldNodeId: string,
	newNodeId: string,
	newTreeId: string,
	userId?: string,
): Promise<number> {
	const { data: summary, error } = await supabaseClient
		.from("node_usecases_summary")
		.select("*")
		.eq("node_id", oldNodeId)
		.maybeSingle()

	if (error || !summary) return 0

	const { error: insertError } = await supabaseClient
		.from("node_usecases_summary")
		.insert({
			node_id: newNodeId,
			tree_id: newTreeId,
			query: summary.query,
			summary: summary.summary,
			usecases_count: summary.usecases_count,
			team_id: summary.team_id,
			user_id: userId || summary.user_id,
		})

	return insertError ? 0 : 1
}

/**
 * Duplicate all related data for nodes
 */
export async function duplicateNodeRelatedData(
	supabaseClient: any,
	nodeIdMap: Map<string, string>,
	newTreeId: string,
	userId?: string,
): Promise<Omit<DuplicationStats, "nodes_copied">> {
	const stats = {
		papers_copied: 0,
		use_cases_copied: 0,
		marketinfo_copied: 0,
		papers_summary_copied: 0,
		usecases_summary_copied: 0,
	}

	for (const [oldNodeId, newNodeId] of nodeIdMap.entries()) {
		stats.marketinfo_copied += await duplicateMarketInfo(
			supabaseClient,
			oldNodeId,
			newNodeId,
			newTreeId,
			userId,
		)

		stats.papers_copied += await duplicatePapers(
			supabaseClient,
			oldNodeId,
			newNodeId,
			newTreeId,
			userId,
		)

		stats.papers_summary_copied += await duplicatePaperSummary(
			supabaseClient,
			oldNodeId,
			newNodeId,
			newTreeId,
			userId,
		)

		stats.use_cases_copied += await duplicateUseCases(
			supabaseClient,
			oldNodeId,
			newNodeId,
			newTreeId,
			userId,
		)

		stats.usecases_summary_copied += await duplicateUseCaseSummary(
			supabaseClient,
			oldNodeId,
			newNodeId,
			newTreeId,
			userId,
		)
	}

	return stats
}

// =============================================================================
// MAIN DUPLICATION FUNCTION
// =============================================================================

/**
 * Orchestrate the complete tree duplication process
 */
export async function duplicateTree(
	supabaseClient: any,
	treeId: string,
	newName?: string,
	userId?: string,
): Promise<DuplicateTreeResponse> {
	console.log(`[DUPLICATE] Starting duplication for tree: ${treeId}`)

	// Step 1: Fetch original tree
	const originalTree = await fetchOriginalTree(supabaseClient, treeId)

	// Step 2: Create new tree
	const newTree = await createNewTree(
		supabaseClient,
		originalTree,
		newName,
		userId,
	)

	// Step 3: Fetch and duplicate nodes
	const originalNodes = await fetchTreeNodes(supabaseClient, treeId)

	if (originalNodes.length === 0) {
		return {
			success: true,
			new_tree_id: newTree.id,
			stats: {
				nodes_copied: 0,
				papers_copied: 0,
				use_cases_copied: 0,
				marketinfo_copied: 0,
				papers_summary_copied: 0,
				usecases_summary_copied: 0,
			},
		}
	}

	const { nodeIdMap, nodesCopied } = await duplicateNodes(
		supabaseClient,
		originalNodes,
		newTree.id,
		userId,
	)

	// Step 4: Duplicate related data
	const relatedStats = await duplicateNodeRelatedData(
		supabaseClient,
		nodeIdMap,
		newTree.id,
		userId,
	)

	const stats: DuplicationStats = {
		nodes_copied: nodesCopied,
		...relatedStats,
	}

	console.log(`[DUPLICATE] Duplication complete. Stats:`, stats)

	return {
		success: true,
		new_tree_id: newTree.id,
		stats,
	}
}

// Only start the server if this file is run directly (not imported in tests)
if (import.meta.main) {
	serve(async (req) => {
		if (req.method === "OPTIONS") {
			return new Response("ok", { status: 200, headers: CORS })
		}

		try {
			const requestBody: DuplicateTreeRequest = await req.json()
			console.log(`[DUPLICATE] Received request:`, requestBody)

			const { tree_id, new_name } = requestBody

			// Validate required parameters
			if (!tree_id) {
				return new Response(
					JSON.stringify({
						error: "Missing required parameter: tree_id",
					}),
					{
						status: 400,
						headers: { ...CORS, "Content-Type": "application/json" },
					},
				)
			}

			// Initialize Supabase client with service role key
			const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
			const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

			if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
				throw new Error("Server mis-config (Supabase env vars)")
			}

			const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

			// Perform duplication (user_id will be copied from original tree)
			const result = await duplicateTree(supabaseClient, tree_id, new_name)

			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { ...CORS, "Content-Type": "application/json" },
			})
		} catch (err: any) {
			console.error("=== DUPLICATE TREE ERROR ===")
			console.error("Error details:", {
				message: err.message,
				name: err.name,
				stack: err.stack,
			})

			return new Response(
				JSON.stringify({
					success: false,
					error: err.message ?? "Unknown error occurred",
					details: err.stack ?? "No stack trace available",
				}),
				{
					status: 500,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}
	})
}
