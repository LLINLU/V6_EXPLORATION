import { useCallback } from "react"
import {
	triggerEnrichmentRefresh,
	triggerEnrichmentStart,
} from "@/hooks/useEnrichedData"
import { useUserDetail } from "@/hooks/useUserDetail"
import {
	enrichNodeWithNewStructure,
	hasNodeEnrichedData,
	isNodeLoading,
	type StreamingResponse,
} from "@/services/nodeEnrichmentService"

interface EnrichmentParams {
	locationState: any
	databaseTreeData: any
	currentQuery: string
	selectedPath: any
}

export const useTechnologyTreeEnrichment = ({
	locationState,
	databaseTreeData,
	currentQuery,
	selectedPath,
}: EnrichmentParams) => {
	const { userDetails } = useUserDetail()

	const triggerNodeEnrichment = useCallback(
		async (level: string, nodeId: string, customPath?: any) => {
			// Validate treeId is present and not empty string
			if (!locationState?.treeId || locationState.treeId === "") {
				// console.warn(
				// "[TREE_ENRICHMENT] Skipping enrichment - no valid treeId available",
				// {
				// treeId: locationState?.treeId,
				// hasUserTeamId: !!userDetails?.team_id,
				// hasTreeData: !!databaseTreeData,
				// },
				// )
				return
			}

			if (userDetails?.team_id && databaseTreeData) {
				const isIndividuallyLoading = isNodeLoading(nodeId)

				if (isIndividuallyLoading) {
					return
				}

				triggerEnrichmentStart(nodeId)

				const hasData = await hasNodeEnrichedData(nodeId)
				if (hasData) {
					triggerEnrichmentRefresh(nodeId)
					return
				}

				const currentPath = customPath || {
					level1: selectedPath.level1,
					level2: selectedPath.level2,
					level3: selectedPath.level3,
					level4: selectedPath.level4,
					level5: selectedPath.level5,
					level6: selectedPath.level6,
					level7: selectedPath.level7,
					level8: selectedPath.level8,
					level9: selectedPath.level9,
					level10: selectedPath.level10,
				}

				const searchTheme = locationState.query || currentQuery || ""
				const query = searchTheme

				const treeType = (
					databaseTreeData?.mode ||
					locationState?.treeData?.mode ||
					"TED"
				).toLowerCase()

				try {
					// treeId is guaranteed to be valid at this point
					await enrichNodeWithNewStructure(
						nodeId,
						locationState.treeId!, // Non-null assertion safe due to validation above
						level as any,
						currentPath,
						databaseTreeData,
						query,
						treeType,
						(response: StreamingResponse) => {
							if (response.type === "papers") {
								triggerEnrichmentRefresh(nodeId)
							} else if (response.type === "useCases") {
								triggerEnrichmentRefresh(nodeId)
							} else if (response.type === "complete") {
								triggerEnrichmentRefresh(nodeId)
							} else if (response.type === "error") {
								console.error("Enrichment error:", response.error)
							}
						},
						userDetails.team_id,
					)
				} catch (error) {
					console.error("Error during streaming enrichment:", error)
				}
			} else {
				// console.warn(
				// "[TREE_ENRICHMENT] Skipping enrichment - missing required context",
				// {
				// hasUserTeamId: !!userDetails?.team_id,
				// hasTreeData: !!databaseTreeData,
				// },
				// )
			}
		},
		[locationState, userDetails, databaseTreeData, currentQuery, selectedPath],
	)

	return {
		triggerNodeEnrichment,
	}
}
