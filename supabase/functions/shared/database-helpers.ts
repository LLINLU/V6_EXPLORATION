// Database helper functions for saving enriched tree data
// Used to save papers and use cases from Python API to database

import type {
	EnrichedTreeNode,
	Paper,
	UseCase,
} from "../../../api-specifications/python-api-types.ts"

/**
 * Save enriched data (papers and use cases) for an entire tree structure
 */
export async function saveEnrichedDataToDB(
	supabaseClient: any,
	enrichedNode: EnrichedTreeNode,
	treeId: string,
	teamId: string | null,
): Promise<void> {
	console.log(`[DB] Saving enriched data for node: ${enrichedNode.title}`)

	// Save papers and use cases for current node
	await saveNodePapers(
		supabaseClient,
		enrichedNode.id,
		treeId,
		enrichedNode.papers,
		teamId,
	)
	await saveNodeUseCases(
		supabaseClient,
		enrichedNode.id,
		treeId,
		enrichedNode.useCases ?? [],
		teamId,
	)

	// Recursively save for children
	for (const child of enrichedNode.children) {
		await saveEnrichedDataToDB(supabaseClient, child, treeId, teamId)
	}
}

/**
 * Save papers for a specific node
 */
export async function saveNodePapers(
	supabaseClient: any,
	nodeId: string,
	treeId: string,
	papers: Paper[],
	teamId: string | null,
): Promise<void> {
	if (papers.length === 0) return

	// First, delete existing papers for this node to avoid duplicates
	// This ensures consistency with individual enrichment behavior
	const { error: deleteError } = await supabaseClient
		.from("node_papers")
		.delete()
		.eq("node_id", nodeId)

	if (deleteError) {
		console.warn(
			`[SAVE_PAPERS] Failed to delete existing papers for node ${nodeId}:`,
			deleteError,
		)
	}

	const papersToInsert = papers.map((paper) => ({
		id: paper.id, // Use API-generated ID directly as primary key
		node_id: nodeId,
		tree_id: treeId,
		title: paper.title,
		authors: paper.authors,
		journal: paper.journal,
		tags: paper.tags,
		abstract: paper.abstract,
		date: paper.date,
		citations: paper.citations,
		region: paper.region,
		doi: paper.doi,
		url: paper.url,
		team_id: teamId,
	}))

	const { error } = await supabaseClient
		.from("node_papers")
		.insert(papersToInsert)

	if (error) {
		throw new Error(
			`Failed to save papers for node ${nodeId}: ${error.message}`,
		)
	}

	console.log(`[DB] Saved ${papers.length} papers for node: ${nodeId}`)
}

/**
 * Save use cases for a specific node
 */
export async function saveNodeUseCases(
	supabaseClient: any,
	nodeId: string,
	treeId: string,
	useCases: UseCase[],
	teamId: string | null,
): Promise<void> {
	if (useCases.length === 0) return

	// First, delete existing use cases for this node to avoid duplicates
	// This ensures consistency with individual enrichment behavior
	const { error: deleteError } = await supabaseClient
		.from("node_use_cases")
		.delete()
		.eq("node_id", nodeId)

	if (deleteError) {
		console.warn(
			`[SAVE_USE_CASES] Failed to delete existing use cases for node ${nodeId}:`,
			deleteError,
		)
	}

	for (const useCase of useCases) {
		// Insert use case using API-generated ID directly
		const { error: useCaseError } = await supabaseClient
			.from("node_use_cases")
			.insert({
				id: useCase.id, // Use API-generated ID directly as primary key
				node_id: nodeId,
				tree_id: treeId,
				title: useCase.title,
				description: useCase.description,
				releases: useCase.releases,
				team_id: teamId,
				year:
					typeof (useCase as any).year === "number"
						? (useCase as any).year
						: null,
			})

		if (useCaseError) {
			throw new Error(
				`Failed to save use case for node ${nodeId}: ${useCaseError.message}`,
			)
		}

		// Insert press releases for this use case
		if (useCase.pressReleases.length > 0) {
			const pressReleasesToInsert = useCase.pressReleases.map((pr) => ({
				use_case_id: useCase.id, // Reference the API-generated use case ID
				title: pr.title,
				url: pr.url,
				date: pr.date,
			}))

			const { error: prError } = await supabaseClient
				.from("use_case_press_releases")
				.insert(pressReleasesToInsert)

			if (prError) {
				throw new Error(
					`Failed to save press releases for use case ${useCase.id}: ${prError.message}`,
				)
			}
		}
	}

	console.log(`[DB] Saved ${useCases.length} use cases for node: ${nodeId}`)
}

/**
 * Find a node by ID in a tree structure (for mapping purposes)
 */
export function findNodeById(node: any, targetId: string): any | null {
	if (node.id === targetId) {
		return node
	}

	for (const child of node.children || []) {
		const found = findNodeById(child, targetId)
		if (found) return found
	}

	return null
}
