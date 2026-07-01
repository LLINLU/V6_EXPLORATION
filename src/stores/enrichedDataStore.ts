import type { PostgrestError } from "@supabase/supabase-js"
import { create } from "zustand"
import { supabase } from "@/integrations/supabase/client"
import type { Tables } from "@/integrations/supabase/types/database.types"
import { getEnrichmentStatus } from "@/services/enrichmentQueue"
import type { TrlHistogram, TrlStatistics } from "@/types/enrichment"

// Re-export for backward compatibility
export type { TrlHistogram, TrlStatistics }

type NodePapers = Tables<"node_papers">
type NodeUseCases = Tables<"node_use_cases">

export interface NodePatent {
	id: string
	node_id: string
	family_id: string | null
	title: string
	abstract: string | null
	earliest_priority_date: string | null
	countries: string[] | null
	ipc_prefixes: string[] | null
	ipc_subclasses: string[] | null
	ipc_prefix: string | null
	ipc: string[] | null
	cpc: string[] | null
	similarity_score: number | null
	distance: number | null
	keyword_match_count: number | null
	publications: Array<Record<string, unknown>> | null
	publication_number: string | null
	queries: Array<Record<string, unknown>> | null
	query_hits: Array<Record<string, unknown>> | null
	assignee: Array<{
		name: string
		country_code?: string
		name_harmonized?: string
	}> | null
	inventor: Array<{
		name: string
		country_code?: string
		name_harmonized?: string
	}> | null
	created_at: string
}

interface EnrichedNodeData {
	papers: NodePapers[]
	patents: NodePatent[]
	useCases: NodeUseCases[]
	trlData: {
		statistics: TrlStatistics | null
		hist_data: TrlHistogram[] | null
	}
}

interface LoadingStates {
	general: boolean
	papers: boolean
	patents: boolean
	useCases: boolean
	trl: boolean
}

interface EnrichedDataStore {
	// Data state
	data: Record<string, EnrichedNodeData>
	loading: Record<string, LoadingStates>
	error: Record<string, string | null>

	// Reference counting for polling optimization
	subscribers: Record<string, number>
	pollingIntervals: Record<string, NodeJS.Timeout>
	pendingRefresh: Record<string, boolean>

	// Actions
	subscribeToNode: (nodeId: string) => void
	unsubscribeFromNode: (nodeId: string) => void
	loadData: (nodeId: string) => Promise<void>
	refreshData: (nodeId: string) => void
	setLoadingState: (
		nodeId: string,
		type: keyof LoadingStates,
		loading: boolean,
	) => void
	startPolling: (nodeId: string) => void
	stopPolling: (nodeId: string) => void
}

// Default data structures
const DEFAULT_ENRICHED_DATA: EnrichedNodeData = {
	papers: [],
	patents: [],
	useCases: [],
	trlData: { statistics: null, hist_data: null },
}

const DEFAULT_LOADING_STATES: LoadingStates = {
	general: false,
	papers: false,
	patents: false,
	useCases: false,
	trl: false,
}

export const useEnrichedDataStore = create<EnrichedDataStore>((set, get) => ({
	// Initial state
	data: {},
	loading: {},
	error: {},
	subscribers: {},
	pollingIntervals: {},
	pendingRefresh: {},

	// Subscribe to a node (with reference counting)
	subscribeToNode: (nodeId: string) => {
		const state = get()
		const currentCount = state.subscribers[nodeId] || 0
		const newCount = currentCount + 1

		set({
			subscribers: { ...state.subscribers, [nodeId]: newCount },
		})

		// Initialize data and loading states if first subscriber
		if (currentCount === 0) {
			const existingData = state.data[nodeId] || DEFAULT_ENRICHED_DATA
			set({
				data: { ...state.data, [nodeId]: existingData },
				loading: { ...state.loading, [nodeId]: DEFAULT_LOADING_STATES },
				error: { ...state.error, [nodeId]: null },
			})

			// Start polling for this node
			get().startPolling(nodeId)

			// Load initial data
			get().loadData(nodeId)
		}
	},

	// Unsubscribe from a node (with reference counting)
	unsubscribeFromNode: (nodeId: string) => {
		const state = get()
		const currentCount = state.subscribers[nodeId] || 0
		const newCount = Math.max(0, currentCount - 1)

		if (newCount === 0) {
			// Last subscriber - stop polling and cleanup
			get().stopPolling(nodeId)

			const { [nodeId]: __, ...remainingLoading } = state.loading
			const { [nodeId]: ___, ...remainingError } = state.error
			const { [nodeId]: ____, ...remainingSubs } = state.subscribers
			const { [nodeId]: _____, ...remainingPendingRefresh } =
				state.pendingRefresh

			set({
				loading: remainingLoading,
				error: remainingError,
				subscribers: remainingSubs,
				pendingRefresh: remainingPendingRefresh,
			})
		} else {
			set({
				subscribers: { ...state.subscribers, [nodeId]: newCount },
			})
		}
	},

	// Start polling for queue status
	startPolling: (nodeId: string) => {
		const state = get()

		// Clear existing interval if any
		if (state.pollingIntervals[nodeId]) {
			clearInterval(state.pollingIntervals[nodeId])
		}

		const checkQueueStatus = () => {
			const papersStatus = getEnrichmentStatus(nodeId, "papers")
			const patentsStatus = getEnrichmentStatus(nodeId, "patents")
			const useCasesStatus = getEnrichmentStatus(nodeId, "useCases")
			const trlStatus = getEnrichmentStatus(nodeId, "trl")

			const isPapersLoading =
				papersStatus === "waiting" || papersStatus === "fetching"
			const isPatentsLoading =
				patentsStatus === "waiting" || patentsStatus === "fetching"
			const isUseCasesLoading =
				useCasesStatus === "waiting" || useCasesStatus === "fetching"
			const isTrlLoading = trlStatus === "waiting" || trlStatus === "fetching"

			const currentState = get()
			const currentLoading =
				currentState.loading[nodeId] || DEFAULT_LOADING_STATES
			const nextLoading = {
				papers: isPapersLoading,
				patents: isPatentsLoading,
				useCases: isUseCasesLoading,
				trl: isTrlLoading,
			}

			// Only update if states changed to prevent unnecessary re-renders
			if (
				currentLoading.papers !== nextLoading.papers ||
				currentLoading.patents !== nextLoading.patents ||
				currentLoading.useCases !== nextLoading.useCases ||
				currentLoading.trl !== nextLoading.trl
			) {
				set({
					loading: {
						...currentState.loading,
						[nodeId]: {
							...currentLoading,
							...nextLoading,
						},
					},
				})
			}
		}

		// Check immediately
		checkQueueStatus()

		// Set up interval
		const interval = setInterval(checkQueueStatus, 1000)

		set({
			pollingIntervals: { ...state.pollingIntervals, [nodeId]: interval },
		})
	},

	// Stop polling for a node
	stopPolling: (nodeId: string) => {
		const state = get()
		const interval = state.pollingIntervals[nodeId]

		if (interval) {
			clearInterval(interval)
			const { [nodeId]: _, ...remaining } = state.pollingIntervals
			set({ pollingIntervals: remaining })
		}
	},

	// Load data for a node
	loadData: async (nodeId: string) => {
		const state = get()

		// Skip if already loading
		if (state.loading[nodeId]?.general) {
			set({
				pendingRefresh: { ...state.pendingRefresh, [nodeId]: true },
			})
			return
		}

		// Set loading state
		set({
			loading: {
				...state.loading,
				[nodeId]: { ...state.loading[nodeId], general: true },
			},
			error: { ...state.error, [nodeId]: null },
		})

		try {
			// Load papers, patents, use cases, and TRL data concurrently
			const [papersResult, patentsResult, useCasesResult, trlResult] =
				await Promise.allSettled([
					supabase.from("node_papers").select("*").eq("node_id", nodeId),
					supabase.from("node_patents").select("*").eq("node_id", nodeId),
					supabase.from("node_use_cases").select("*").eq("node_id", nodeId),
					supabase
						.from("node_marketinfo")
						.select("statistics, hist_data")
						.eq("node_id", nodeId)
						.maybeSingle(),
				])

			const currentState = get()
			const currentData = currentState.data[nodeId] || DEFAULT_ENRICHED_DATA
			const newData = { ...currentData }

			// Handle papers result
			if (papersResult.status === "fulfilled") {
				const { data: papersData, error: papersError } =
					papersResult.value as unknown as {
						data: NodePapers[]
						error: PostgrestError
					}

				if (!papersError && papersData) {
					newData.papers = papersData
				}
			}

			// Handle patents result
			if (patentsResult.status === "fulfilled") {
				const { data: patentsData, error: patentsError } =
					patentsResult.value as unknown as {
						data: NodePatent[]
						error: PostgrestError
					}

				if (!patentsError && patentsData) {
					newData.patents = patentsData
				}
			}

			// Handle use cases result
			if (useCasesResult.status === "fulfilled") {
				const { data: useCasesData, error: useCasesError } =
					useCasesResult.value as unknown as {
						data: NodeUseCases[]
						error: PostgrestError
					}

				if (!useCasesError && useCasesData) {
					newData.useCases = useCasesData
				}
			}

			// Handle TRL result
			if (trlResult.status === "fulfilled") {
				const { data: trlData, error: trlError } = trlResult.value

				if (!trlError && trlData) {
					newData.trlData = {
						statistics: trlData.statistics as unknown as TrlStatistics,
						hist_data: trlData.hist_data as unknown as TrlHistogram[],
					}
				} else if (trlError && trlError.code !== "PGRST116") {
					console.error(`TRL data load error for ${nodeId}:`, trlError.message)
				}
			}

			// Update data
			set({
				data: { ...currentState.data, [nodeId]: newData },
			})
		} catch (err) {
			console.error(
				`[EnrichedDataStore] Error loading data for ${nodeId}:`,
				err,
			)
			set({
				error: {
					...get().error,
					[nodeId]: err instanceof Error ? err.message : "Unknown error",
				},
			})
		} finally {
			// Clear general loading state
			const finalState = get()
			const shouldReload = !!finalState.pendingRefresh[nodeId]
			const { [nodeId]: _, ...remainingPendingRefresh } =
				finalState.pendingRefresh
			set({
				loading: {
					...finalState.loading,
					[nodeId]: { ...finalState.loading[nodeId], general: false },
				},
				pendingRefresh: remainingPendingRefresh,
			})
			if (shouldReload && get().subscribers[nodeId] > 0) {
				queueMicrotask(() => get().loadData(nodeId))
			}
		}
	},

	// Refresh data for a node
	refreshData: (nodeId: string) => {
		get().loadData(nodeId)
	},

	// Set specific loading state
	setLoadingState: (
		nodeId: string,
		type: keyof LoadingStates,
		loading: boolean,
	) => {
		const state = get()
		const currentLoading = state.loading[nodeId] || DEFAULT_LOADING_STATES

		set({
			loading: {
				...state.loading,
				[nodeId]: { ...currentLoading, [type]: loading },
			},
		})
	},
}))

// Global event bus integration
export const enrichmentEventBus = {
	listeners: new Set<(nodeId: string) => void>(),

	subscribe(listener: (nodeId: string) => void) {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	},

	emit(nodeId: string) {
		this.listeners.forEach((listener) => listener(nodeId))
	},
}

// Connect event bus to store
enrichmentEventBus.subscribe((nodeId: string) => {
	const store = useEnrichedDataStore.getState()
	if (store.subscribers[nodeId] > 0) {
		store.refreshData(nodeId)
	}
})

// Export trigger functions for backward compatibility
export const triggerEnrichmentRefresh = (nodeId: string) => {
	enrichmentEventBus.emit(nodeId)
}

export const triggerPapersStart = (nodeId: string) => {
	const store = useEnrichedDataStore.getState()
	store.setLoadingState(nodeId, "papers", true)
}

export const triggerPatentsStart = (nodeId: string) => {
	const store = useEnrichedDataStore.getState()
	store.setLoadingState(nodeId, "patents", true)
}

export const triggerUseCasesStart = (nodeId: string) => {
	const store = useEnrichedDataStore.getState()
	store.setLoadingState(nodeId, "useCases", true)
}

export const triggerTrlStart = (nodeId: string) => {
	const store = useEnrichedDataStore.getState()
	store.setLoadingState(nodeId, "trl", true)
}
