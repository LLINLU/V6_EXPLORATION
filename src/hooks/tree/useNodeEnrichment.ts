import { useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import type { Tables } from "@/integrations/supabase/types/database.types"
import {
	buildParentInfo,
	enrichNodeWithNewStructure,
	hasNodeEnrichedData,
	type StreamingResponse,
} from "@/services/nodeEnrichmentService"
import { useChatStore } from "@/stores/chatStore"
import type { LocationState, PathLevel } from "@/types/tree"

type NodePapers = Tables<"node_papers">
type NodeUseCases = Tables<"node_use_cases">

interface DatabaseTreeData {
	mode?: string
	[key: string]: any
}

interface SelectedPath {
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

interface EnrichmentParams {
	locationState: LocationState | null
	databaseTreeData: DatabaseTreeData | null
	currentQuery: string
	selectedPath: SelectedPath
	treeMode: string
	searchMode: string
}

/**
 * Hook for managing node enrichment with papers and use cases data
 * Handles database fetching and background enrichment processes
 */
export const useNodeEnrichment = ({
	locationState,
	databaseTreeData,
	currentQuery,
	selectedPath,
	treeMode,
	searchMode,
}: EnrichmentParams) => {
	const { setNodePapers, setNodeUseCases } = useChatStore()

	// Fetch enriched data from database and update store
	const fetchAndSetNodeContext = useCallback(
		async (nodeIds: string[]) => {
			try {
				// console.log(
				// 	"[NODE_CLICK] fetchAndSetNodeContext called for nodes:",
				// 	nodeIds,
				// )

				if (nodeIds.length === 0) {
					// console.log("[NODE_CLICK] No nodeIds provided, returning empty")
					return { papers: [], useCases: [] }
				}

				// Fetch papers and use cases from database for all selected nodes
				const [papersResult, useCasesResult] = await Promise.all([
					supabase.from("node_papers").select("*").in("node_id", nodeIds),
					supabase.from("node_use_cases").select("*").in("node_id", nodeIds),
				])

				// console.log(
				// 	"[NODE_CLICK] Database results - papers:",
				// 	papersResult.data?.length || 0,
				// 	"useCases:",
				// 	useCasesResult.data?.length || 0,
				// )

				const allPapers = (papersResult.data as NodePapers[]) || []
				const allUseCases = (useCasesResult.data as NodeUseCases[]) || []

				// Group papers and use cases by node_id and store them in each node
				for (const nodeId of nodeIds) {
					const nodePapers = allPapers.filter(
						(paper) => paper.node_id === nodeId,
					)
					const nodeUseCases = allUseCases.filter(
						(useCase) => useCase.node_id === nodeId,
					)

					// console.log(
					// 	"[NODE_CLICK] Setting context for node:",
					// 	nodeId,
					// 	"papers:",
					// 	nodePapers.length,
					// 	"useCases:",
					// 	nodeUseCases.length,
					// )

					setNodePapers(nodeId, nodePapers)
					setNodeUseCases(nodeId, nodeUseCases)
				}

				return { papers: allPapers, useCases: allUseCases }
			} catch (error) {
				console.error("[NODE_CLICK] Failed to fetch enriched data:", error)
				return { papers: [], useCases: [] }
			}
		},
		[setNodePapers, setNodeUseCases],
	)

	// Trigger enrichment for a specific node
	const enrichNode = useCallback(
		async (
			nodeId: string,
			nodeLevel: number,
			onComplete?: () => void,
			overrideTitle?: string,
			team_id?: string | null,
		) => {
			try {
				// console.log(
				// 	"[NODE_CLICK] enrichNode called for node:",
				// 	nodeId,
				// 	"level:",
				// 	nodeLevel,
				// )

				// Validate treeId is present and not empty string
				if (!locationState?.treeId || locationState.treeId === "") {
					// console.warn(
					// "[NODE_CLICK] Skipping enrichment - no valid treeId available",
					// { treeId: locationState?.treeId },
					// )
					onComplete?.()
					return
				}

				const hasEnrichedData = await hasNodeEnrichedData(nodeId)
				// console.log(
				// 	"[NODE_CLICK] hasEnrichedData:",
				// 	hasEnrichedData,
				// 	"for node:",
				// 	nodeId,
				// )

				if (!hasEnrichedData) {
					const currentPath = buildParentInfo(
						treeMode,
						`level${nodeLevel}`,
						nodeId,
						selectedPath,
						databaseTreeData,
					)
					const treeType = (treeMode || searchMode || "TED").toLowerCase()

					// treeId is guaranteed to be valid at this point
					await enrichNodeWithNewStructure(
						nodeId,
						locationState.treeId!, // Non-null assertion safe due to validation above
						`level${nodeLevel}` as PathLevel,
						currentPath,
						databaseTreeData,
						currentQuery || locationState?.query || "",
						treeType,
						async (response: StreamingResponse) => {
							if (response.type === "complete") {
								// console.log(
								// 	"[NODE_CLICK] Enrichment complete for node:",
								// 	nodeId,
								// 	"calling onComplete",
								// )
								onComplete?.()
							}
						},
						team_id,
						overrideTitle,
					)
				} else {
					// console.log(
					// 	"[NODE_CLICK] Node already enriched, calling onComplete immediately for node:",
					// 	nodeId,
					// )
					await fetchAndSetNodeContext([nodeId])
					onComplete?.()
				}
			} catch (error) {
				console.error("[NODE_CLICK] Failed to enrich node:", error)
			}
		},
		[
			treeMode,
			searchMode,
			selectedPath,
			databaseTreeData,
			currentQuery,
			locationState,
			fetchAndSetNodeContext,
		],
	)

	return {
		fetchAndSetNodeContext,
		enrichNode,
	}
}
