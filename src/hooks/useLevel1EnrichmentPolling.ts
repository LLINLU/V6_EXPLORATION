import { useCallback, useRef } from "react"
import { triggerEnrichmentRefresh } from "@/hooks/useEnrichedData"
import { supabase } from "@/integrations/supabase/client"
import { usePolling } from "./usePolling"

interface Level1EnrichmentStatus {
	nodeId: string
	hasStarted: boolean
	hasPapers: boolean
	hasUseCases: boolean
	paperCount: number
	useCaseCount: number
}

interface Level1EnrichmentState {
	loadingNodes: Set<string>
	enrichmentStatus: Map<string, Level1EnrichmentStatus>
	isPolling: boolean
}

// Global state for level 1 enrichment tracking
const level1EnrichmentState: Level1EnrichmentState = {
	loadingNodes: new Set(),
	enrichmentStatus: new Map(),
	isPolling: false,
}

// Functions to check and update loading states
export const isLevel1Loading = (nodeId: string): boolean => {
	return level1EnrichmentState.loadingNodes.has(nodeId)
}

export const isLevel1PapersLoading = (nodeId: string): boolean => {
	const status = level1EnrichmentState.enrichmentStatus.get(nodeId)

	// If no status exists, we need to check if this node should be loading
	// This can happen when TreeNode renders before polling initializes
	if (!status) {
		//console.log(`[LEVEL1_PAPERS_CHECK] Node ${nodeId}: No status found, isPolling=${level1EnrichmentState.isPolling}, defaulting to not loading (will be fixed on next poll)`);
		return false // Will be corrected when polling initializes
	}

	// Show loading if enrichment has started but no papers found yet (paperCount === 0)
	const isLoading = status.hasStarted && status.paperCount === 0

	//console.log(`[LEVEL1_PAPERS_CHECK] Node ${nodeId}: hasStarted=${status.hasStarted}, paperCount=${status.paperCount}, isLoading=${isLoading}`);

	return isLoading
}

export const isLevel1UseCasesLoading = (nodeId: string): boolean => {
	const status = level1EnrichmentState.enrichmentStatus.get(nodeId)

	// If no status exists, we need to check if this node should be loading
	// This can happen when TreeNode renders before polling initializes
	if (!status) {
		//console.log(`[LEVEL1_USECASES_CHECK] Node ${nodeId}: No status found, isPolling=${level1EnrichmentState.isPolling}, defaulting to not loading (will be fixed on next poll)`);
		return false // Will be corrected when polling initializes
	}

	// Show loading if enrichment has started but no use cases found yet (useCaseCount === 0)
	const isLoading = status.hasStarted && status.useCaseCount === 0

	return isLoading
}

// Function to check if a level 1 node has complete enrichment data
export const hasLevel1CompleteData = (nodeId: string): boolean => {
	const status = level1EnrichmentState.enrichmentStatus.get(nodeId)
	return Boolean(status?.hasPapers && status?.hasUseCases)
}

// Debug function to inspect current enrichment state (callable from console)
export const getLevel1EnrichmentState = () => {
	const statusArray = Array.from(
		level1EnrichmentState.enrichmentStatus.entries(),
	).map(([nodeId, status]) => ({
		...status,
		isInLoadingSet: level1EnrichmentState.loadingNodes.has(nodeId),
	}))

	return {
		isPolling: level1EnrichmentState.isPolling,
		loadingNodesCount: level1EnrichmentState.loadingNodes.size,
		statusCount: level1EnrichmentState.enrichmentStatus.size,
		statuses: statusArray,
	}
}

// Expose debug functions to window for console access
if (typeof window !== "undefined") {
	;(window as any).getLevel1EnrichmentState = getLevel1EnrichmentState
	;(window as any).enableLevel1EnrichmentDebug = false
}

// Function to initialize enrichment status from database (for page refresh scenarios)
const initializeEnrichmentStatusFromDatabase = async (
	level1NodeIds: string[],
) => {
	try {
		// console.log(
		// 	`[LEVEL1_ENRICHMENT] Initializing enrichment status from database for ${level1NodeIds.length} nodes`,
		// )

		// Check papers and use cases in parallel for all nodes
		const [papersResult, useCasesResult] = await Promise.all([
			supabase
				.from("node_papers")
				.select("node_id")
				.in("node_id", level1NodeIds),
			supabase
				.from("node_use_cases")
				.select("node_id")
				.in("node_id", level1NodeIds),
		])

		// Process results to determine which nodes have data
		const nodesWithPapers = new Set(
			papersResult.data?.map((p) => p.node_id) || [],
		)
		const nodesWithUseCases = new Set(
			useCasesResult.data?.map((u) => u.node_id) || [],
		)

		// Count papers and use cases per node
		const paperCounts = new Map<string, number>()
		const useCaseCounts = new Map<string, number>()

		if (papersResult.data) {
			for (const paper of papersResult.data) {
				paperCounts.set(
					paper.node_id,
					(paperCounts.get(paper.node_id) || 0) + 1,
				)
			}
		}

		if (useCasesResult.data) {
			for (const useCase of useCasesResult.data) {
				useCaseCounts.set(
					useCase.node_id,
					(useCaseCounts.get(useCase.node_id) || 0) + 1,
				)
			}
		}

		// Initialize status for each node based on database state
		level1NodeIds.forEach((nodeId) => {
			const hasPapers = nodesWithPapers.has(nodeId)
			const hasUseCases = nodesWithUseCases.has(nodeId)
			const paperCount = paperCounts.get(nodeId) || 0
			const useCaseCount = useCaseCounts.get(nodeId) || 0

			// Set status based on what we found in the database
			level1EnrichmentState.enrichmentStatus.set(nodeId, {
				nodeId,
				hasStarted: true, // Always mark as started since tree generation has begun
				hasPapers,
				hasUseCases,
				paperCount,
				useCaseCount,
			})

			// For level 1 nodes, assume they're loading if they don't have complete data
			// This ensures loading indicators persist across page refreshes during generation
			if (paperCount === 0 || useCaseCount === 0) {
				level1EnrichmentState.loadingNodes.add(nodeId)
				// console.log(
				// 	`[LEVEL1_ENRICHMENT] Node ${nodeId} added to loading set - papers: ${hasPapers} (${paperCount}), useCases: ${hasUseCases} (${useCaseCount})`,
				// )
				// console.log(
				// 	`[LEVEL1_ENRICHMENT] Loading conditions: paperCount === 0: ${paperCount === 0}, useCaseCount === 0: ${useCaseCount === 0}`,
				// )
			} else {
				// console.log(
				// 	`[LEVEL1_ENRICHMENT] Node ${nodeId} already complete - papers: ${paperCount}, useCases: ${useCaseCount}`,
				// )
			}
		})

		// console.log(
		// 	`[LEVEL1_ENRICHMENT] Initialization complete - ${level1EnrichmentState.loadingNodes.size} nodes still loading`,
		// )
	} catch (error) {
		console.error(
			`[LEVEL1_ENRICHMENT] Error initializing from database:`,
			error,
		)

		// Fallback: initialize all nodes as loading if database check fails
		level1NodeIds.forEach((nodeId) => {
			level1EnrichmentState.loadingNodes.add(nodeId)
			level1EnrichmentState.enrichmentStatus.set(nodeId, {
				nodeId,
				hasStarted: true,
				hasPapers: false,
				hasUseCases: false,
				paperCount: 0,
				useCaseCount: 0,
			})
		})
	}
}

// Function to start tracking level 1 nodes for enrichment
export const startLevel1EnrichmentTracking = async (
	level1NodeIds: string[],
) => {
	// console.log(
	// 	`[LEVEL1_ENRICHMENT] Starting tracking for ${level1NodeIds.length} level 1 nodes`,
	// )

	// Initialize enrichment status from database to handle page refresh scenarios
	await initializeEnrichmentStatusFromDatabase(level1NodeIds)
}

// Function to stop tracking when tree generation completes
export const stopLevel1EnrichmentTracking = () => {
	// console.log(`[LEVEL1_ENRICHMENT] Stopping enrichment tracking`)
	level1EnrichmentState.loadingNodes.clear()
	level1EnrichmentState.enrichmentStatus.clear()
	level1EnrichmentState.isPolling = false
}

// Hook for components to use level 1 enrichment polling
// Component should call startPolling() to initiate polling
export const useLevel1EnrichmentPolling = () => {
	const nodeIdsRef = useRef<string[]>([])
	const lastCheckedCounts = useRef<
		Map<string, { papers: number; useCases: number }>
	>(new Map())

	// Configuration
	const POLLING_INTERVAL = 5000 // 5 seconds
	const POLLING_TIMEOUT = 8 * 60 * 1000 // 8 minutes maximum polling
	const MAX_ATTEMPTS = Math.floor(POLLING_TIMEOUT / POLLING_INTERVAL)

	// Fetch enrichment data for polling
	const fetchEnrichmentData = useCallback(async () => {
		const nodeIds = nodeIdsRef.current

		if (nodeIds.length === 0) {
			return null
		}

		try {
			// console.log(
			// 	`[LEVEL1_ENRICHMENT] Checking enrichment status for ${nodeIds.length} nodes`,
			// )

			// Check papers and use cases in parallel for all nodes
			const [papersResult, useCasesResult] = await Promise.all([
				supabase.from("node_papers").select("node_id").in("node_id", nodeIds),
				supabase
					.from("node_use_cases")
					.select("node_id")
					.in("node_id", nodeIds),
			])

			// Process papers data
			const nodesWithPapers = new Set(
				papersResult.data?.map((p) => p.node_id) || [],
			)
			const paperCounts = new Map<string, number>()

			if (papersResult.data) {
				for (const paper of papersResult.data) {
					paperCounts.set(
						paper.node_id,
						(paperCounts.get(paper.node_id) || 0) + 1,
					)
				}
			}

			// Process use cases data
			const nodesWithUseCases = new Set(
				useCasesResult.data?.map((u) => u.node_id) || [],
			)
			const useCaseCounts = new Map<string, number>()

			if (useCasesResult.data) {
				for (const useCase of useCasesResult.data) {
					useCaseCounts.set(
						useCase.node_id,
						(useCaseCounts.get(useCase.node_id) || 0) + 1,
					)
				}
			}

			// Return structured data for polling
			return {
				nodeIds,
				nodesWithPapers,
				nodesWithUseCases,
				paperCounts,
				useCaseCounts,
			}
		} catch (error) {
			console.error(
				`[LEVEL1_ENRICHMENT] Error checking enrichment status:`,
				error,
			)
			return null
		}
	}, [])

	// Process polled data and update state
	const handlePollData = useCallback(
		(
			data: {
				nodeIds: string[]
				nodesWithPapers: Set<string>
				nodesWithUseCases: Set<string>
				paperCounts: Map<string, number>
				useCaseCounts: Map<string, number>
			} | null,
			_isInitial: boolean,
		) => {
			if (!data) return

			const {
				nodeIds,
				nodesWithPapers,
				nodesWithUseCases,
				paperCounts,
				useCaseCounts,
			} = data

			// Update status for each node
			for (const nodeId of nodeIds) {
				const currentStatus = level1EnrichmentState.enrichmentStatus.get(nodeId)
				if (!currentStatus) continue

				const hasPapers = nodesWithPapers.has(nodeId)
				const hasUseCases = nodesWithUseCases.has(nodeId)
				const paperCount = paperCounts.get(nodeId) || 0
				const useCaseCount = useCaseCounts.get(nodeId) || 0

				// Check if this is a new completion
				const papersJustCompleted = !currentStatus.hasPapers && hasPapers
				const useCasesJustCompleted = !currentStatus.hasUseCases && hasUseCases

				// Update the status
				const newStatus: Level1EnrichmentStatus = {
					...currentStatus,
					hasPapers,
					hasUseCases,
					paperCount,
					useCaseCount,
				}

				level1EnrichmentState.enrichmentStatus.set(nodeId, newStatus)

				// Update last checked counts
				lastCheckedCounts.current.set(nodeId, {
					papers: paperCount,
					useCases: useCaseCount,
				})

				// Check for any status changes and trigger updates accordingly
				let statusChanged = false

				// Check if papers status changed
				if (papersJustCompleted) {
					// console.log(
					// `[LEVEL1_ENRICHMENT] Node ${nodeId} papers completed! (${paperCount} papers)`,
					// )
					statusChanged = true
				}

				// Check if use cases status changed
				if (useCasesJustCompleted) {
					// console.log(
					// `[LEVEL1_ENRICHMENT] Node ${nodeId} use cases completed! (${useCaseCount} use cases)`,
					// )
					statusChanged = true
				}

				// If any status changed, trigger UI update and sidebar refresh
				if (statusChanged) {
					triggerEnrichmentRefresh(nodeId)
					// console.log(
					// `[LEVEL1_ENRICHMENT] Node ${nodeId} status update - papers: ${hasPapers}, useCases: ${hasUseCases}`,
					// )
				}

				// If both are complete, remove from loading set
				if (hasPapers && hasUseCases) {
					level1EnrichmentState.loadingNodes.delete(nodeId)
					// console.log(
					// `[LEVEL1_ENRICHMENT] Node ${nodeId} fully enriched - removed from loading set`,
					// )
				}
			}

			// Log progress
			// const _completeNodes = nodeIds.filter((nodeId) => {
			// 	const status = level1EnrichmentState.enrichmentStatus.get(nodeId)
			// 	return status?.hasPapers && status?.hasUseCases
			// })

			// const _pendingNodes = nodeIds.filter((nodeId) => {
			// 	const status = level1EnrichmentState.enrichmentStatus.get(nodeId)
			// 	return !status?.hasPapers || !status?.hasUseCases
			// })
		},
		[],
	)

	// Check if polling should stop
	const shouldStopPolling = useCallback(
		(
			data: {
				nodeIds: string[]
				nodesWithPapers: Set<string>
				nodesWithUseCases: Set<string>
				paperCounts: Map<string, number>
				useCaseCounts: Map<string, number>
			} | null,
		): boolean => {
			if (!data) return false

			const { nodeIds } = data

			// Check if all nodes are complete (both papers AND use cases)
			const completeNodes = nodeIds.filter((nodeId) => {
				const status = level1EnrichmentState.enrichmentStatus.get(nodeId)
				return status?.hasPapers && status?.hasUseCases
			})

			const allComplete =
				completeNodes.length === nodeIds.length && nodeIds.length > 0

			if (allComplete) {
				// console.log(
				// `[LEVEL1_ENRICHMENT] All level 1 nodes enrichment completed, stopping polling`,
				// )
			}

			return allComplete
		},
		[],
	)

	// Handle successful completion
	const handleSuccess = useCallback(() => {
		stopLevel1EnrichmentTracking()
	}, [])

	// Handle timeout
	const handleTimeout = useCallback(() => {
		// console.warn(
		// `[LEVEL1_ENRICHMENT] Polling timed out after ${POLLING_TIMEOUT / 1000} seconds, stopping...`,
		// )
		stopLevel1EnrichmentTracking()

		// Mark remaining nodes as completed to stop showing loading indicators
		const nodeIds = nodeIdsRef.current
		nodeIds.forEach((nodeId) => {
			const status = level1EnrichmentState.enrichmentStatus.get(nodeId)
			if (status && (!status.hasPapers || !status.hasUseCases)) {
				// console.log(
				// `[LEVEL1_ENRICHMENT] Timeout: Marking ${nodeId} as completed (papers: ${status.hasPapers}, useCases: ${status.hasUseCases})`,
				// )
				level1EnrichmentState.loadingNodes.delete(nodeId)
			}
		})
	}, [])

	// Handle error
	const handleError = useCallback((error: Error) => {
		console.error(
			`[LEVEL1_ENRICHMENT] Error checking enrichment status:`,
			error,
		)
	}, [])

	// Create the polling hook instance
	const { startPolling: pollingStart, stopPolling: pollingStop } = usePolling({
		pollFn: fetchEnrichmentData,
		shouldStop: shouldStopPolling,
		interval: POLLING_INTERVAL,
		maxAttempts: MAX_ATTEMPTS,
		onPoll: handlePollData,
		onSuccess: handleSuccess,
		onTimeout: handleTimeout,
		onError: handleError,
	})

	// Start polling function - can be called externally
	const startPolling = useCallback(
		async (currentTreeId: string, nodeIds: string[]) => {
			if (!currentTreeId || nodeIds.length === 0) {
				return
			}

			// If we're already polling, stop first
			if (level1EnrichmentState.isPolling) {
				// console.log(`[LEVEL1_ENRICHMENT] Stopping previous polling session`)
				stopLevel1EnrichmentTracking()
				pollingStop()
			}

			// console.log(
			// `[LEVEL1_ENRICHMENT] Starting polling for tree ${currentTreeId} with ${nodeIds.length} level 1 nodes`,
			// )

			// Update refs
			nodeIdsRef.current = nodeIds

			// Initialize tracking
			level1EnrichmentState.isPolling = true
			await startLevel1EnrichmentTracking(nodeIds)

			// Start polling
			pollingStart()
		},
		[pollingStart, pollingStop],
	)

	// Cleanup function to be called by component on unmount
	const cleanup = useCallback(() => {
		pollingStop()
		stopLevel1EnrichmentTracking()
	}, [pollingStop])

	return {
		isLevel1Loading,
		isLevel1PapersLoading,
		isLevel1UseCasesLoading,
		startPolling,
		cleanup,
	}
}
