import { useEffect, useRef, useState } from "react"
import {
	getEnrichmentElapsedTime,
	getEnrichmentStatus,
	subscribeToEnrichmentStatus,
} from "@/services/enrichmentQueue"
import {
	ENRICHMENT_STATUS,
	hasErrorStatus,
	isFetchingStatus,
	isWaitingStatus,
} from "@/services/enrichmentStatus"
import type { EnrichmentQueueState } from "@/types/enrichment"

// Re-export for backward compatibility
export type { EnrichmentQueueState }

/**
 * Hook to track enrichment queue status for a specific node
 */
export const useEnrichmentQueue = (nodeId: string | null) => {
	const [state, setState] = useState<EnrichmentQueueState>({
		papersStatus: ENRICHMENT_STATUS.DONE,
		useCasesStatus: ENRICHMENT_STATUS.DONE,
		trlStatus: ENRICHMENT_STATUS.DONE,
		papersElapsedTime: null,
		useCasesElapsedTime: null,
		trlElapsedTime: null,
	})

	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		if (!nodeId) {
			setState({
				papersStatus: ENRICHMENT_STATUS.DONE,
				useCasesStatus: ENRICHMENT_STATUS.DONE,
				trlStatus: ENRICHMENT_STATUS.DONE,
				papersElapsedTime: null,
				useCasesElapsedTime: null,
				trlElapsedTime: null,
			})
			return
		}

		// Initialize state
		const updateState = () => {
			setState({
				papersStatus: getEnrichmentStatus(nodeId, "papers"),
				useCasesStatus: getEnrichmentStatus(nodeId, "useCases"),
				trlStatus: getEnrichmentStatus(nodeId, "trl"),
				papersElapsedTime: getEnrichmentElapsedTime(nodeId, "papers"),
				useCasesElapsedTime: getEnrichmentElapsedTime(nodeId, "useCases"),
				trlElapsedTime: getEnrichmentElapsedTime(nodeId, "trl"),
			})
		}

		updateState()

		// Subscribe to status changes
		const unsubscribe = subscribeToEnrichmentStatus(
			(statusNodeId, type, status, elapsedTime) => {
				if (statusNodeId === nodeId) {
					setState((prev) => ({
						...prev,
						[`${type}Status`]: status,
						[`${type}ElapsedTime`]: elapsedTime || null,
					}))
				}
			},
		)

		// Update elapsed time every second for active requests
		intervalRef.current = setInterval(() => {
			const papersStatus = getEnrichmentStatus(nodeId, "papers")
			const useCasesStatus = getEnrichmentStatus(nodeId, "useCases")
			const trlStatus = getEnrichmentStatus(nodeId, "trl")

			if (
				isFetchingStatus(papersStatus) ||
				isFetchingStatus(useCasesStatus) ||
				isFetchingStatus(trlStatus)
			) {
				setState((prev) => ({
					...prev,
					papersElapsedTime: getEnrichmentElapsedTime(nodeId, "papers"),
					useCasesElapsedTime: getEnrichmentElapsedTime(nodeId, "useCases"),
					trlElapsedTime: getEnrichmentElapsedTime(nodeId, "trl"),
				}))
			}
		}, 1000)

		return () => {
			unsubscribe()
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [nodeId])

	// Helper functions
	const isLoading =
		isFetchingStatus(state.papersStatus) ||
		isFetchingStatus(state.useCasesStatus) ||
		isFetchingStatus(state.trlStatus)
	const isWaiting =
		isWaitingStatus(state.papersStatus) ||
		isWaitingStatus(state.useCasesStatus) ||
		isWaitingStatus(state.trlStatus)
	const hasError =
		hasErrorStatus(state.papersStatus) ||
		hasErrorStatus(state.useCasesStatus) ||
		hasErrorStatus(state.trlStatus)

	const formatElapsedTime = (elapsedTime: number | null): string => {
		if (!elapsedTime) return ""

		const seconds = Math.floor(elapsedTime / 1000)
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60

		if (minutes > 0) {
			return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
		}
		return `${seconds}s`
	}

	return {
		...state,
		isLoading,
		isWaiting,
		hasError,
		formatElapsedTime,
		isPapersLoading: isFetchingStatus(state.papersStatus),
		isUseCasesLoading: isFetchingStatus(state.useCasesStatus),
		isTrlLoading: isFetchingStatus(state.trlStatus),
		isPapersWaiting: isWaitingStatus(state.papersStatus),
		isUseCasesWaiting: isWaitingStatus(state.useCasesStatus),
		isTrlWaiting: isWaitingStatus(state.trlStatus),
		hasPapersError: hasErrorStatus(state.papersStatus),
		hasUseCasesError: hasErrorStatus(state.useCasesStatus),
		hasTrlError: hasErrorStatus(state.trlStatus),
	}
}
