import { useCallback, useRef } from "react"
import { treeService } from "@/services/treeService"
import { usePolling } from "./usePolling"

/**
 * Hook to poll for tree structure updates (children_count changes)
 * This detects when level 2+ nodes are generated in the background
 *
 * Architecture:
 * - Uses generic usePolling hook for polling mechanics
 * - Uses treeService (business logic layer)
 * - treeService uses supabaseRepository (data access layer)
 * - Follows dependency injection pattern for testability
 * - Component should call startPolling() to initiate polling
 * - Component should provide callbacks via getCallbacks() parameter in startPolling
 */

export interface TreeStructurePollingCallbacks {
	/** Called when ANY individual node gets children */
	onStructureUpdate?: () => void
	/** Called when ALL level 1 nodes have children */
	onAllComplete?: () => void
}

interface NodeChildrenCountData {
	id: string
	name: string
	children_count: number | null
}

export const useTreeStructurePolling = () => {
	const lastCheckedCounts = useRef<Map<string, number>>(new Map())
	const completionTriggered = useRef<boolean>(false)
	const currentTreeIdRef = useRef<string | null>(null)
	const callbacksRef = useRef<TreeStructurePollingCallbacks>({})
	const nodeIdsRef = useRef<string[]>([])

	// Configuration
	const POLLING_INTERVAL = 3000 // 3 seconds
	const POLLING_TIMEOUT = 8 * 60 * 1000 // 8 minutes maximum polling
	const MAX_ATTEMPTS = Math.floor(POLLING_TIMEOUT / POLLING_INTERVAL)

	// Process polled data and detect changes
	const handlePollData = useCallback(
		(data: NodeChildrenCountData[] | null, isInitial: boolean) => {
			if (!data || data.length === 0) {
				return
			}

			// console.log(
			// 	`[TREE_STRUCTURE_POLLING] Checking structure for ${data.length} level 1 nodes (initial=${isInitial})`,
			// )

			// Check for updates
			let hasUpdates = false
			const nodesWithChildren: string[] = []
			const pendingNodes: string[] = []

			for (const node of data) {
				const currentCount = node.children_count || 0
				const lastCount = lastCheckedCounts.current.get(node.id)

				// console.log(
				// 	`[TREE_STRUCTURE_POLLING] Node ${node.name} - current: ${currentCount}, last: ${lastCount}, isInitial: ${isInitial}`,
				// )

				// Check if this node just got children (only if we have a previous count to compare)
				// On initial check, we set the baseline but don't trigger updates
				if (!isInitial && currentCount > 0 && lastCount === 0) {
					// console.log(
					// 	`[TREE_STRUCTURE_POLLING] Node ${node.name} (${node.id}) got children: ${currentCount} children added`,
					// )
					hasUpdates = true
					nodesWithChildren.push(node.name)
				}

				// Update tracking AFTER checking for changes
				lastCheckedCounts.current.set(node.id, currentCount)

				if (currentCount === 0) {
					pendingNodes.push(node.name)
				}
			}

			// const _completeCount = data.filter(
			// 	(n) => (n.children_count || 0) > 0,
			// ).length
			// const _totalCount = data.length

			// console.log(
			// 	`[TREE_STRUCTURE_POLLING] Progress: ${completeCount}/${totalCount} nodes have children`,
			// )

			if (pendingNodes.length > 0) {
				// console.log(
				// 	`[TREE_STRUCTURE_POLLING] Pending nodes: ${pendingNodes.join(", ")}`,
				// )
			}

			// If we detected updates, trigger callback
			if (hasUpdates && callbacksRef.current.onStructureUpdate) {
				// console.log(
				// 	`[TREE_STRUCTURE_POLLING] Triggering structure update callback for nodes: ${nodesWithChildren.join(", ")}`,
				// )
				callbacksRef.current.onStructureUpdate()
			}
		},
		[],
	)

	// Check if polling should stop (all nodes complete)
	const shouldStopPolling = useCallback(
		(data: NodeChildrenCountData[] | null): boolean => {
			if (!data || data.length === 0) {
				return false
			}

			const completeCount = data.filter(
				(n) => (n.children_count || 0) > 0,
			).length
			const totalCount = data.length
			const allComplete = completeCount === totalCount && totalCount > 0

			if (allComplete) {
				// console.log(
				// 	`[TREE_STRUCTURE_POLLING] All level 1 nodes have children, stopping polling`,
				// )
			}

			return allComplete
		},
		[],
	)

	// Handle successful completion
	const handleSuccess = useCallback((_data: NodeChildrenCountData[]) => {
		// Only trigger completion callback once and only if not already triggered
		if (callbacksRef.current.onAllComplete && !completionTriggered.current) {
			// console.log(
			// 	`[TREE_STRUCTURE_POLLING] Triggering completion callback (first time only)`,
			// )
			completionTriggered.current = true
			callbacksRef.current.onAllComplete()
		}
	}, [])

	// Handle timeout
	const handleTimeout = useCallback(() => {
		// console.warn(
		// `[TREE_STRUCTURE_POLLING] Polling timed out after ${POLLING_TIMEOUT / 1000} seconds, stopping...`,
		// )
	}, [])

	// Handle error
	const handleError = useCallback((error: Error) => {
		console.error(`[TREE_STRUCTURE_POLLING] Error in structure check:`, error)
	}, [])

	// Create the polling hook instance
	const { startPolling: pollingStart, stopPolling: pollingStop } = usePolling<
		NodeChildrenCountData[]
	>({
		pollFn: useCallback(
			() => treeService.fetchNodeChildrenCounts(nodeIdsRef.current),
			[],
		),
		shouldStop: shouldStopPolling,
		interval: POLLING_INTERVAL,
		maxAttempts: MAX_ATTEMPTS,
		onPoll: handlePollData,
		onSuccess: handleSuccess,
		onTimeout: handleTimeout,
		onError: handleError,
	})

	const startPolling = useCallback(
		(
			currentTreeId: string,
			nodeIds: string[],
			callbacks: TreeStructurePollingCallbacks,
		) => {
			if (!currentTreeId || nodeIds.length === 0) {
				return
			}

			// Stop any existing polling
			pollingStop()

			// console.log(
			// 	`[TREE_STRUCTURE_POLLING] Starting polling for tree ${currentTreeId} with ${nodeIds.length} level 1 nodes`,
			// )

			// Update refs
			nodeIdsRef.current = nodeIds
			callbacksRef.current = callbacks

			// Clear previous tracking data
			lastCheckedCounts.current.clear()

			// Only reset completionTriggered if this is a different tree
			if (currentTreeIdRef.current !== currentTreeId) {
				// console.log(
				// 	`[TREE_STRUCTURE_POLLING] New tree detected (${currentTreeIdRef.current} -> ${currentTreeId}), resetting completion flag`,
				// )
				completionTriggered.current = false
				currentTreeIdRef.current = currentTreeId
			} else {
				// console.log(
				// 	`[TREE_STRUCTURE_POLLING] Same tree (${currentTreeId}), keeping completion flag: ${completionTriggered.current}`,
				// )
			}

			// Start polling
			pollingStart()
		},
		[pollingStart, pollingStop],
	)

	return {
		startPolling,
		stopPolling: pollingStop,
	}
}
