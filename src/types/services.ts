/**
 * Service Layer Shared Types
 *
 * Types for saved items, research context,
 * multiaxis, and other service-layer data models.
 */

// ── Saved Items ─────────────────────────────────────

export interface MemoNotes {
	tags: string[]
	memo: string
}

export interface SavedPaperWithDetails {
	id: string
	paper_id: string
	saved_at: string
	notes: string | null
	tree_id: string
	node_id: string
	paper: {
		id: string
		title: string
		authors: string
		journal: string
		abstract: string
		date: string | null
		citations: number
		doi: string | null
		url: string | null
		tags: unknown
		region: string
	}
}

export interface SavedUseCaseWithDetails {
	id: string
	use_case_id: string
	saved_at: string
	notes: string | null
	tree_id: string
	node_id: string
	use_case: {
		id: string
		product: string
		description: string
		company: string[]
		press_releases: string[]
	}
}

// ── Multi-Axis ──────────────────────────────────────

export interface QuerySummary {
	tldr: string
	summary: string
}

// ── Research Context ────────────────────────────────

export interface ResearchContextData {
	userAnswers?: {
		focus?: string
		purpose?: string[]
		targetField?: Record<string, string[]>
		additionalContext?: string
	}
}

export interface ExtractedResearchContext {
	purpose?: string
	domain?: string
	mechanism?: string
	context?: string
}

// ── Chat ────────────────────────────────────────────

/** Unified ChatGPT message type (resolves duplicate in chatGptService/contextChatService) */
export interface ChatGPTMessage {
	role: "system" | "user" | "assistant"
	content: string
}

// ── Node Context ────────────────────────────────────

export interface NodeContextData {
	selectedNode?: string
	contextText?: string
}

// ── Insights ────────────────────────────────────────

export interface MetricsData {
	nodeId: string
	tam: {
		value: number
		currency: string
		period: string
	}
	cagr: {
		value: number
		period: string
	}
	trl?: {
		level: number
		description: string
	}
}

// ── Polling ─────────────────────────────────────────

export interface PollingOptions<T> {
	pollFn: () => Promise<T | null>
	shouldStop: (data: T | null) => boolean
	interval?: number
	maxAttempts?: number
	onPoll?: (data: T | null, isInitial: boolean) => void
	onSuccess?: (data: T) => void
	onTimeout?: () => void
	onError?: (error: Error) => void
}

export interface PollingState<T> {
	isPolling: boolean
	data: T | null
	attempt: number
	error: Error | null
}

export interface PollingControls<T> {
	startPolling: () => Promise<T | null>
	stopPolling: () => void
	reset: () => void
	state: PollingState<T>
}

// ── Scenario Report Hook ────────────────────────────

export type OverallStatus =
	| "idle"
	| "pending"
	| "searching"
	| "search_done"
	| "analyzing"
	| "done"
	| "error"

export interface SectionState {
	status: "pending" | "running" | "done" | "error"
	progress?: number
	errorMessage?: string
}
