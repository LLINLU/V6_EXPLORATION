/**
 * Enrichment System Types
 *
 * Types for the node enrichment pipeline: queue management,
 * streaming responses, status tracking, and TRL data.
 */

// ── Enrichment Status ───────────────────────────────

export const ENRICHMENT_STATUS = {
	WAITING: "waiting" as const,
	FETCHING: "fetching" as const,
	DONE: "done" as const,
	ERROR: "error" as const,
	TIMEOUT: "timeout" as const,
} as const

export type EnrichmentStatus =
	(typeof ENRICHMENT_STATUS)[keyof typeof ENRICHMENT_STATUS]

// ── Node Enrichment Request/Response ────────────────

export interface NodeInfo {
	name: string
	description: string
	level: string
}

export interface NodeEnrichmentRequest {
	nodeId: string
	treeId: string
	enrichNode: string
	query: string
	parentNodes: NodeInfo[]
	treeType: string
	team_id?: string | null
}

export interface NodeEnrichmentResponse {
	success: boolean
	message?: string
	enrichedData?: {
		papers: unknown[]
		useCases: unknown[]
	}
}

// ── Streaming ───────────────────────────────────────

export interface StreamingResponse {
	type: "papers" | "useCases" | "trl" | "patents" | "complete" | "error"
	data?: unknown
	error?: string
	nodeId: string
	timestamp: string
}

export type StreamingCallback = (response: StreamingResponse) => void

export type EnrichmentRefreshCallback = {
	type: "enrichment-refresh"
	handler: (response: StreamingResponse) => void
	description: "Triggers UI refresh on enrichment updates"
}

export type EnrichmentCompleteCallback = {
	type: "enrichment-complete"
	handler: (response: StreamingResponse) => Promise<void> | void
	description: "Handles completion of enrichment process"
}

export type NodeClickEnrichmentCallback = {
	type: "node-click-enrichment"
	handler: (response: StreamingResponse) => void
	description: "Handles enrichment during node click with detailed logging"
}

export type TypedStreamingCallback =
	| EnrichmentRefreshCallback
	| EnrichmentCompleteCallback
	| NodeClickEnrichmentCallback

// ── Queue ───────────────────────────────────────────

export interface QueuedEnrichmentRequest {
	nodeId: string
	nodeName: string
	type: "papers" | "useCases" | "trl" | "patents"
	// biome-ignore lint/suspicious/noExplicitAny: params are passed directly to supabase.functions.invoke body
	params: any
	// biome-ignore lint/suspicious/noExplicitAny: callback response shape varies by enrichment type
	callback: (response: any) => void
	timestamp: number
	startTime?: number
	apiCallStarted?: boolean
}

export interface QueueState {
	queue: QueuedEnrichmentRequest[]
	processing: Map<string, QueuedEnrichmentRequest>
	status: Map<string, EnrichmentStatus>
	apiHealthy: boolean
	lastHealthCheck: number
}

export interface EnrichmentQueueState {
	papersStatus: EnrichmentStatus
	useCasesStatus: EnrichmentStatus
	trlStatus: EnrichmentStatus
	papersElapsedTime: number | null
	useCasesElapsedTime: number | null
	trlElapsedTime: number | null
}

// ── TRL Statistics ──────────────────────────────────

export interface TrlHistogram {
	trl: number
	count: number
}

export interface TrlStatistics {
	average_trl: number
	std_dev: number
	count: number
}
