import { useLocation } from "react-router-dom"
import {
	triggerEnrichmentRefresh,
	triggerEnrichmentStart,
} from "@/hooks/useEnrichedData"
import { useUserDetail } from "@/hooks/useUserDetail"
import {
	// buildParentTitles,
	enrichNodeWithNewStructure,
	// getNodeDetails,
	hasNodeEnrichedData,
	isNodeLoading,
	type StreamingResponse,
} from "@/services/nodeEnrichmentService"
import type { PathLevel } from "@/types/tree"
import type { PathState } from "../state/usePathState"
import {
	autoSelectChildren,
	clearPathFromLevel,
	findCompletePath,
} from "../utils/pathUtils"

export const useNodeClickHandler = (
	disableAutoSelection: boolean,
	treeData: any,
	initialPath: PathState,
	setSelectedPath: (updater: (prev: PathState) => PathState) => void,
	setHasUserMadeSelection: (value: boolean) => void,
	setUserClickedNode: (
		node: { level: PathLevel; nodeId: string } | null,
	) => void,
	handleTreeNodeClick?: (level: string, nodeId: string) => void,
) => {
	const { userDetails } = useUserDetail()
	const location = useLocation()
	const locationState = location.state as {
		treeId?: string
		query?: string
	} | null
	const handleNodeClick = async (level: PathLevel, nodeId: string) => {
		// console.log("[NODE_CLICK_HANDLER] Node clicked:", {
		// 	level,
		// 	nodeId,
		// 	disableAutoSelection,
		// 	viewMode: disableAutoSelection ? "mindmap" : "treemap",
		// })
		setHasUserMadeSelection(true)

		// Track the user's actual click for sidebar display
		setUserClickedNode({ level, nodeId })

		// Check if we should proceed with enrichment
		// Validate treeId is present and not empty string
		if (!locationState?.treeId || locationState.treeId === "") {
			// console.warn(
			// "[NODE_CLICK] Skipping enrichment - no valid treeId available",
			// {
			// treeId: locationState?.treeId,
			// hasUserTeamId: !!userDetails?.team_id,
			// hasTreeData: !!treeData,
			// },
			// )
			// Still update the UI selection but don't call enrichment
		} else if (userDetails?.team_id && treeData) {
			// Check if node is already loading (same logic for all levels)
			const isIndividuallyLoading = isNodeLoading(nodeId)

			// console.log("[NODE_CLICK] Check loading status:", {
			// 	nodeId,
			// 	isIndividuallyLoading,
			// })

			if (isIndividuallyLoading) {
				// console.log("[NODE_CLICK] Node already loading, skipping:", {
				// 	nodeId,
				// 	level,
				// 	isIndividuallyLoading,
				// })
				// Still update the UI selection but don't call API
			} else {
				// console.log(
				// 	"[NODE_CLICK] Starting enrichment process for node:",
				// 	nodeId,
				// )
				// Immediately signal that enrichment might start for this node (for loading UI)
				triggerEnrichmentStart(nodeId)

				// Check if node already has data (same logic for all levels)
				hasNodeEnrichedData(nodeId).then(async (hasData) => {
					if (hasData) {
						// console.log(
						// 	"[NODE_ENRICHMENT] Node already has complete data (both papers and use cases), skipping API call:",
						// 	nodeId,
						// )
						// Just trigger refresh to show existing data (this will turn off loading)
						triggerEnrichmentRefresh(nodeId)
					} else {
						// Start enrichment process in background
						// console.log(
						// 	"[NODE_ENRICHMENT] Starting enrichment for node (may have partial data):",
						// 	nodeId,
						// )

						// Get node details from the tree data
						// const { title: nodeTitle, description: nodeDescription } =
						// 	getNodeDetails(level, nodeId, initialPath, treeData)
						// console.log("[NODE_ENRICHMENT] Extracted node details:", {
						// 	nodeTitle,
						// 	nodeDescription,
						// })

						// Build parent titles array - simplified to empty array for now
						// const parentTitles = buildParentTitles(
						// 	level,
						// 	nodeId,
						// 	initialPath,
						// 	treeData,
						// )
						// console.log("[NODE_ENRICHMENT] Built parent titles:", parentTitles)

						// Build query parameter - use only the user-inputted theme
						const searchTheme = locationState.query || ""
						const query = searchTheme

						// Determine tree type for enrichment
						const treeType = (treeData?.mode || "TED").toLowerCase()

						// Call the new enrichment API with proper structure
						// treeId is guaranteed to be valid at this point due to validation above
						await enrichNodeWithNewStructure(
							nodeId,
							locationState.treeId!, // Non-null assertion safe due to validation above
							level,
							initialPath,
							treeData,
							query,
							treeType,
							(response: StreamingResponse) => {
								// console.log(
								// 	"[NODE_ENRICHMENT_STREAMING] Received response:",
								// 	response,
								// )

								if (response.type === "papers") {
									// console.log(
									// 	"[NODE_ENRICHMENT_STREAMING] Papers received - triggering refresh",
									// )
									triggerEnrichmentRefresh(nodeId)
								} else if (response.type === "useCases") {
									// console.log(
									// 	"[NODE_ENRICHMENT_STREAMING] Use cases received - triggering refresh",
									// )
									triggerEnrichmentRefresh(nodeId)
								} else if (response.type === "trl") {
									// console.log(
									// 	"[NODE_ENRICHMENT_STREAMING] TRL data received - triggering refresh",
									// )
									triggerEnrichmentRefresh(nodeId)
								} else if (response.type === "complete") {
									// console.log("[NODE_ENRICHMENT_STREAMING] Enrichment complete")
									triggerEnrichmentRefresh(nodeId)
								} else if (response.type === "error") {
									// console.warn(
									// "[NODE_ENRICHMENT_STREAMING] Enrichment error:",
									// response.error,
									// )
								}
							},
							userDetails.team_id,
						)
					}
				})
			}
		} else {
			// console.warn(
			// "[NODE_CLICK] Skipping enrichment - missing required context:",
			// {
			// hasTeamId: !!userDetails?.team_id,
			// hasTreeData: !!treeData,
			// },
			// )
		}

		setSelectedPath((prev) => {
			if (prev[level] === nodeId) {
				// Clear the selected level and all subsequent levels
				return clearPathFromLevel(prev, level)
			}

			// MINDMAP MODE: Use findCompletePath to establish correct hierarchy
			if (disableAutoSelection) {
				// console.log("[MINDMAP_PATH] Finding complete path for node:", {
				// 	level,
				// 	nodeId,
				// })
				// console.log("[MINDMAP_PATH] Previous path:", prev)
				// console.log("[MINDMAP_PATH] Tree data available:", !!treeData)

				const completePath = findCompletePath(
					level,
					nodeId,
					treeData,
					initialPath,
				)
				// console.log("[MINDMAP_PATH] Complete path found:", completePath)
				return completePath
			}

			// TREEMAP MODE: Auto-selection enabled
			// console.log("[TREEMAP_PATH] Auto-selection enabled for", level, nodeId)
			const newPath = { ...prev }

			// Clear current and all subsequent levels
			const clearedPath = clearPathFromLevel(newPath, level)

			// Set the selected level
			clearedPath[level] = nodeId

			// Auto-select children
			return autoSelectChildren(clearedPath, level, nodeId, treeData)
		})

		// IMPORTANT: Also call handleTreeNodeClick for chat context handling
		if (handleTreeNodeClick) {
			// console.log(
			// 	"[NODE_CLICK] Calling handleTreeNodeClick for node:",
			// 	nodeId,
			// 	"level:",
			// 	level,
			// )
			handleTreeNodeClick(level, nodeId)
		} else {
			// console.warn("[NODE_CLICK] handleTreeNodeClick not provided")
		}
	}

	return { handleNodeClick }
}
