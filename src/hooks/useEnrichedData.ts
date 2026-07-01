// Re-export types and utilities from the store for backward compatibility
export {
	enrichmentEventBus,
	type TrlHistogram,
	type TrlStatistics,
	triggerEnrichmentRefresh,
	triggerPapersStart,
	triggerPatentsStart,
	triggerTrlStart,
	triggerUseCasesStart,
	useEnrichedDataStore,
} from "@/stores/enrichedDataStore"

import { triggerEnrichmentRefresh } from "@/stores/enrichedDataStore"

// Backward compatibility - export missing functions
export const triggerEnrichmentStart = (nodeId: string) => {
	// For backward compatibility, we'll treat this as a general refresh
	triggerEnrichmentRefresh(nodeId)
}

import { useCallback, useEffect } from "react"
import type { Tables } from "@/integrations/supabase/types/database.types"
import type { TrlHistogram, TrlStatistics } from "@/stores/enrichedDataStore"
import { useEnrichedDataStore } from "@/stores/enrichedDataStore"

type NodePapers = Tables<"node_papers">
type NodeUseCases = Tables<"node_use_cases">

import type { NodePatent } from "@/stores/enrichedDataStore"

interface EnrichedData {
	papers: NodePapers[]
	patents: NodePatent[]
	useCases: NodeUseCases[]
	trlData: {
		statistics: TrlStatistics | null
		hist_data: TrlHistogram[] | null
	}
	loading: boolean
	loadingPapers: boolean
	loadingPatents: boolean
	loadingUseCases: boolean
	loadingTrl: boolean
	error: string | null
	refresh: () => void
	subscribe: () => void
	unsubscribe: () => void
}

// Default data for null nodeId
const DEFAULT_DATA: EnrichedData = {
	papers: [],
	patents: [],
	useCases: [],
	trlData: { statistics: null, hist_data: null },
	loading: false,
	loadingPapers: false,
	loadingPatents: false,
	loadingUseCases: false,
	loadingTrl: false,
	error: null,
	refresh: () => {},
	subscribe: () => {},
	unsubscribe: () => {},
}

/**
 * Lightweight wrapper hook that uses the global enriched data store
 * Maintains backward compatibility with existing API
 */
export const useEnrichedData = (nodeId: string | null): EnrichedData => {
	// Always call hooks first (React Hooks rules)

	// Use Zustand selector to get data reactively - always called
	const nodeData = useEnrichedDataStore((state) =>
		nodeId ? state.data[nodeId] : null,
	)
	const nodeLoading = useEnrichedDataStore((state) =>
		nodeId ? state.loading[nodeId] : null,
	)
	const nodeError = useEnrichedDataStore((state) =>
		nodeId ? state.error[nodeId] : null,
	)

	// Create stable refresh function with useCallback - always called
	const refresh = useCallback(() => {
		if (!nodeId) return
		const store = useEnrichedDataStore.getState()
		store.refreshData(nodeId)
	}, [nodeId])

	// Create stable subscribe function
	const subscribe = useCallback(() => {
		if (!nodeId) return
		const store = useEnrichedDataStore.getState()
		store.subscribeToNode(nodeId)
	}, [nodeId])

	// Create stable unsubscribe function
	const unsubscribe = useCallback(() => {
		if (!nodeId) return
		const store = useEnrichedDataStore.getState()
		store.unsubscribeFromNode(nodeId)
	}, [nodeId])

	useEffect(() => {
		if (!nodeId) return
		const store = useEnrichedDataStore.getState()
		store.subscribeToNode(nodeId)
		return () => {
			store.unsubscribeFromNode(nodeId)
		}
	}, [nodeId])

	// Return default data if no nodeId (after all hooks)
	if (!nodeId) {
		return DEFAULT_DATA
	}

	return {
		papers: nodeData?.papers || [],
		patents: nodeData?.patents || [],
		useCases: nodeData?.useCases || [],
		trlData: nodeData?.trlData || { statistics: null, hist_data: null },
		loading: nodeLoading?.general || false,
		loadingPapers: nodeLoading?.papers || false,
		loadingPatents: nodeLoading?.patents || false,
		loadingUseCases: nodeLoading?.useCases || false,
		loadingTrl: nodeLoading?.trl || false,
		error: nodeError || null,
		refresh,
		subscribe,
		unsubscribe,
	}
}
