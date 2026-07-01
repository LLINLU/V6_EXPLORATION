// Queue system for managing paper, patent, use case, and TRL enrichment API calls
// Uses database polling approach instead of retries

import { getOutputLanguage } from "@/lib/outputLanguage"
import {
	ENRICHMENT_STATUS,
	type EnrichmentStatus,
} from "@/services/enrichmentStatus"
import type { QueuedEnrichmentRequest, QueueState } from "@/types/enrichment"

// Re-export types for backward compatibility
export type { EnrichmentStatus, QueuedEnrichmentRequest, QueueState }

export const getQueueListFormatted = () => {
	const displayList = enrichmentQueue.getDisplayQueue()
	return displayList.map((request) => {
		const elapsedSeconds = request.startTime
			? Math.floor((Date.now() - request.startTime) / 1000)
			: 0
		let typeReadable: string
		if (request.type === "papers") {
			typeReadable = "論文検索"
		} else if (request.type === "patents") {
			typeReadable = "特許検索"
		} else if (request.type === "useCases") {
			typeReadable = "事例検索"
		} else if (request.type === "trl") {
			typeReadable = "TRL計算"
		} else {
			typeReadable = request.type
		}
		return {
			nodeId: request.nodeId, // Include nodeId for navigation
			name: request.nodeName,
			type: typeReadable,
			elapsedSeconds,
			status: request.status, // new!
		}
	})
}

class EnrichmentQueueManager {
	private state: QueueState = {
		queue: [],
		processing: new Map(),
		status: new Map(),
		apiHealthy: true,
		lastHealthCheck: 0,
	}

	// Track API call failures to determine health
	private consecutiveFailures = 0
	private readonly MAX_CONSECUTIVE_FAILURES = 5

	// Configuration
	private readonly MAX_CONCURRENT_PAPERS = 10
	private readonly MAX_CONCURRENT_PATENTS = 10
	private readonly MAX_CONCURRENT_USECASES = 15
	private readonly MAX_CONCURRENT_TRL = 5 // Lower priority for TRL
	private readonly POLLING_INTERVAL = 5000 // Poll database every 5 seconds

	private refreshEnrichedData(nodeId: string): void {
		import("@/hooks/useEnrichedData").then(({ triggerEnrichmentRefresh }) => {
			triggerEnrichmentRefresh(nodeId)
		})
	}

	// Event listeners for status updates
	private listeners = new Set<
		(
			nodeId: string,
			type: "papers" | "useCases" | "trl" | "patents",
			status: EnrichmentStatus,
			elapsedTime?: number,
		) => void
	>()

	/**
	 * Add a subscription for status updates
	 */
	subscribe(
		listener: (
			nodeId: string,
			type: "papers" | "useCases" | "trl" | "patents",
			status: EnrichmentStatus,
			elapsedTime?: number,
		) => void,
	) {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	/**
	 * Get current status for a specific node and type
	 */
	getStatus(
		nodeId: string,
		type: "papers" | "useCases" | "trl" | "patents",
	): EnrichmentStatus {
		const key = `${nodeId}:${type}`
		return this.state.status.get(key) || ENRICHMENT_STATUS.DONE
	}

	/**
	 * Get elapsed time for a currently processing request
	 */
	getElapsedTime(
		nodeId: string,
		type: "papers" | "useCases" | "trl" | "patents",
	): number | null {
		const key = `${nodeId}:${type}`
		const request = this.state.processing.get(key)
		if (request?.startTime) {
			return Date.now() - request.startTime
		}
		return null
	}

	/**
	 * Add a request to the queue
	 */
	enqueue(request: Omit<QueuedEnrichmentRequest, "timestamp">): void {
		const key = `${request.nodeId}:${request.type}`

		// Check if already processing or done
		const currentStatus = this.state.status.get(key)
		if (
			currentStatus === ENRICHMENT_STATUS.FETCHING ||
			currentStatus === ENRICHMENT_STATUS.DONE
		) {
			request.callback({
				type: request.type,
				data: {
					count: 0,
					saved: currentStatus === ENRICHMENT_STATUS.DONE,
					skipped: true,
					status: currentStatus,
				},
				nodeId: request.nodeId,
				timestamp: new Date().toISOString(),
			})
			if (currentStatus === ENRICHMENT_STATUS.DONE) {
				this.refreshEnrichedData(request.nodeId)
			}
			return
		}

		// Remove any existing request for the same node+type
		this.state.queue = this.state.queue.filter(
			(q) => `${q.nodeId}:${q.type}` !== key,
		)

		const queuedRequest: QueuedEnrichmentRequest = {
			...request,
			timestamp: Date.now(),
			apiCallStarted: false,
		}

		this.state.queue.push(queuedRequest)
		this.updateStatus(request.nodeId, request.type, ENRICHMENT_STATUS.WAITING)

		// Try to process immediately (don't await to avoid blocking)
		this.processNext()
	}

	/**
	 * Cancel a specific request
	 */
	cancel(
		nodeId: string,
		type: "papers" | "useCases" | "trl" | "patents",
	): void {
		const key = `${nodeId}:${type}`

		// Remove from queue
		this.state.queue = this.state.queue.filter(
			(q) => `${q.nodeId}:${q.type}` !== key,
		)

		// Remove from processing
		this.state.processing.delete(key)

		// Update status
		this.updateStatus(nodeId, type, ENRICHMENT_STATUS.DONE)
	}

	/**
	 * Get queue status for debugging
	 */
	getQueueStatus() {
		const paperRequests = Array.from(this.state.processing.values()).filter(
			(r) => r.type === "papers",
		)
		const patentRequests = Array.from(this.state.processing.values()).filter(
			(r) => r.type === "patents",
		)
		const useCaseRequests = Array.from(this.state.processing.values()).filter(
			(r) => r.type === "useCases",
		)
		const trlRequests = Array.from(this.state.processing.values()).filter(
			(r) => r.type === "trl",
		)
		const pollingRequests = Array.from(this.state.processing.values()).filter(
			(r) => r.apiCallStarted,
		).length

		return {
			queueLength: this.state.queue.length,
			processing: {
				papers: paperRequests.length,
				patents: patentRequests.length,
				useCases: useCaseRequests.length,
				trl: trlRequests.length,
			},
			maxConcurrent: {
				papers: this.MAX_CONCURRENT_PAPERS,
				patents: this.MAX_CONCURRENT_PATENTS,
				useCases: this.MAX_CONCURRENT_USECASES,
				trl: this.MAX_CONCURRENT_TRL,
			},
			apiHealthy: this.state.apiHealthy,
			lastHealthCheck: this.state.lastHealthCheck,
			polling: pollingRequests,
			consecutiveFailures: this.consecutiveFailures,
		}
	}

	/**
	 * Process the next request in the queue if capacity allows
	 */
	private async processNext(): Promise<void> {
		if (this.state.queue.length === 0) {
			return
		}

		// Check API health only when we're about to process new requests
		if (!this.state.apiHealthy) {
			const healthy = await this.checkAPIHealth()
			this.state.apiHealthy = healthy
			this.state.lastHealthCheck = Date.now()

			if (!healthy) {
				return
			} else {
				this.consecutiveFailures = 0
			}
		}

		// Count current processing requests by type
		const processingRequests = Array.from(this.state.processing.values())
		const paperRequests = processingRequests.filter((r) => r.type === "papers")
		const patentRequests = processingRequests.filter(
			(r) => r.type === "patents",
		)
		const useCaseRequests = processingRequests.filter(
			(r) => r.type === "useCases",
		)
		const trlRequests = processingRequests.filter((r) => r.type === "trl")

		// Find next processable request - prioritize papers and useCases over TRL
		for (let i = 0; i < this.state.queue.length; i++) {
			const request = this.state.queue[i]
			const canProcess =
				(request.type === "papers" &&
					paperRequests.length < this.MAX_CONCURRENT_PAPERS) ||
				(request.type === "patents" &&
					patentRequests.length < this.MAX_CONCURRENT_PATENTS) ||
				(request.type === "useCases" &&
					useCaseRequests.length < this.MAX_CONCURRENT_USECASES) ||
				(request.type === "trl" && trlRequests.length < this.MAX_CONCURRENT_TRL)

			if (canProcess) {
				// Remove from queue and start processing
				const [removedRequest] = this.state.queue.splice(i, 1)

				this.startProcessing(removedRequest)

				// Try to process more requests (don't await to avoid blocking)
				this.processNext()
				break
			}
		}
	}

	/**
	 * Start processing a request with database polling approach
	 */
	private async startProcessing(
		request: QueuedEnrichmentRequest,
	): Promise<void> {
		const key = `${request.nodeId}:${request.type}`

		// Add to processing map
		request.startTime = Date.now()
		this.state.processing.set(key, request)
		this.updateStatus(request.nodeId, request.type, ENRICHMENT_STATUS.FETCHING)

		try {
			// Call the API once
			const apiResult = await this.callEnrichmentAPI(request)

			// Patents edge function returns results synchronously —
			// complete immediately instead of polling, then refresh the store.
			if (request.type === "patents" && apiResult) {
				const patentCount =
					apiResult.fetchedCount ??
					apiResult.results?.patents?.count ??
					apiResult.displayedCount ??
					apiResult.savedCount ??
					0
				const patentsSaved =
					apiResult.results?.patents?.saved ?? (apiResult.savedCount ?? 0) > 0
				request.callback({
					type: "patents",
					data: {
						count: patentCount,
						saved: patentsSaved,
						hasResults: apiResult.hasResults ?? patentCount > 0,
						displayedCount:
							apiResult.displayedCount ?? apiResult.results?.patents?.displayed,
						savedCount: apiResult.savedCount,
						fetchedCount: apiResult.fetchedCount,
						response: apiResult,
					},
					nodeId: request.nodeId,
					timestamp: new Date().toISOString(),
				})
				this.completeProcessing(key, ENRICHMENT_STATUS.DONE)

				// Refresh the enriched data store so the UI picks up the new patents
				this.refreshEnrichedData(request.nodeId)
				return
			}

			// For other types, fire-and-forget and poll the database for the result row.
			request.apiCallStarted = true

			// Start polling database for results
			this.startDatabasePolling(request)
		} catch (error) {
			console.error(`[ENRICHMENT_QUEUE] Failed to start API call for ${key}:`, {
				error: error instanceof Error ? error.message : String(error),
				errorType:
					error instanceof Error ? error.constructor.name : typeof error,
			})

			// Call callback with error for this specific node only
			request.callback({
				type: "error",
				error:
					error instanceof Error
						? error.message
						: "Failed to start enrichment API call",
				nodeId: request.nodeId,
				timestamp: new Date().toISOString(),
			})

			// Mark as error and continue processing other requests
			this.completeProcessing(key, ENRICHMENT_STATUS.ERROR)
		}
	}

	private async startDatabasePolling(
		request: QueuedEnrichmentRequest,
		maxHops: number = 7,
	): Promise<void> {
		const key = `${request.nodeId}:${request.type}`
		let currentHops = 0

		const pollDatabase = async (): Promise<void> => {
			// 1. Keep the "active" check
			if (!this.state.processing.has(key)) return

			// 2. Increment and Check Hops
			currentHops++

			try {
				const hasData = await this.checkDatabaseForResults(
					request.nodeId,
					request.type,
				)

				if (hasData) {
					// Standard Success Path
					request.callback({
						type: request.type,
						data: { count: hasData.count || 0, saved: true },
						nodeId: request.nodeId,
						timestamp: new Date().toISOString(),
					})
					this.completeProcessing(key, ENRICHMENT_STATUS.DONE)
					this.refreshEnrichedData(request.nodeId)
					return
				}

				// 3. Handle "Max Hops Reached" without throwing an error
				if (currentHops >= maxHops) {
					request.callback({
						type: request.type,
						data: {
							count: 0,
							saved: false,
							message: "Max attempts reached - results may be delayed",
						},
						nodeId: request.nodeId,
						timestamp: new Date().toISOString(),
					})

					// Mark as finished so the queue doesn't hang
					this.completeProcessing(key, ENRICHMENT_STATUS.TIMEOUT)
					this.refreshEnrichedData(request.nodeId)
					return
				}

				const delay = this.POLLING_INTERVAL * 1.5 ** currentHops
				// 4. Continue polling if hops remain
				setTimeout(pollDatabase, delay)
			} catch (error) {
				console.error(`Error during polling:`, error)
				// Even on error, we count it as a hop and continue
				const delay = this.POLLING_INTERVAL * 1.5 ** currentHops
				setTimeout(pollDatabase, delay)
			}
		}

		pollDatabase()
	}

	/**
	 * Check database for enrichment results
	 */
	private async checkDatabaseForResults(
		nodeId: string,
		type: "papers" | "useCases" | "trl" | "patents",
	): Promise<{ count: number } | null> {
		const { supabase } = await import("@/integrations/supabase/client")

		try {
			let tableName: string
			if (type === "papers") {
				tableName = "node_papers"
			} else if (type === "patents") {
				tableName = "node_patents"
			} else if (type === "useCases") {
				tableName = "node_use_cases"
			} else if (type === "trl") {
				tableName = "node_marketinfo"
			} else {
				return null
			}

			const { count, error } = await supabase
				.from(tableName as any)
				.select("id", { count: "exact", head: true })
				.eq("node_id", nodeId)

			if (error) {
				return null
			}

			if ((count ?? 0) > 0) {
				return { count: count ?? 0 }
			}

			return null
		} catch (error) {
			console.error(`[ENRICHMENT_QUEUE] Database polling error:`, error)
			return null
		}
	}

	/**
	 * Complete processing a request (isolated per node+type)
	 */
	private completeProcessing(key: string, status: EnrichmentStatus): void {
		const request = this.state.processing.get(key)
		if (request) {
			// If done, keep in recentlyCompleted for display
			if (status === ENRICHMENT_STATUS.DONE) {
				this.recentlyCompleted.push({
					nodeId: request.nodeId,
					type: request.type,
					nodeName: request.nodeName,
					doneAt: Date.now(),
					startTime: request.startTime,
				})

				// Auto-cleanup completed items after display period
				setTimeout(() => {
					this.cleanupCompletedItems()
				}, this.COMPLETED_DISPLAY_TIME)
			}
			// Remove only this specific request from processing
			this.state.processing.delete(key)
			this.updateStatus(request.nodeId, request.type, status)

			// Remove old completed
			const now = Date.now()
			this.recentlyCompleted = this.recentlyCompleted.filter(
				(item) => now - item.doneAt < this.COMPLETED_DISPLAY_TIME,
			)

			// Process next request (this should not affect existing in-flight requests)
			this.processNext()
		}
	}

	/**
	 * Clean up old completed items from display
	 */
	private cleanupCompletedItems(): void {
		const now = Date.now()
		this.recentlyCompleted = this.recentlyCompleted.filter(
			(item) => now - item.doneAt < this.COMPLETED_DISPLAY_TIME,
		)
	}

	/**
	 * Update status and notify listeners
	 */
	private updateStatus(
		nodeId: string,
		type: "papers" | "useCases" | "trl" | "patents",
		status: EnrichmentStatus,
	): void {
		const key = `${nodeId}:${type}`
		this.state.status.set(key, status)

		// Calculate elapsed time if currently processing
		const elapsedTime = this.getElapsedTime(nodeId, type)

		// Notify listeners
		this.listeners.forEach((listener) => {
			try {
				listener(nodeId, type, status, elapsedTime || undefined)
			} catch (error) {
				console.error("[ENRICHMENT_QUEUE] Error in status listener:", error)
			}
		})
	}

	/**
	 * Call the actual enrichment API and wait for initial response
	 * This allows us to catch validation errors (400) immediately
	 */
	private async callEnrichmentAPI(
		request: QueuedEnrichmentRequest,
	): Promise<any> {
		const { supabase } = await import("@/integrations/supabase/client")

		try {
			let functionName: string
			let body: any = request.params

			if (request.type === "papers") {
				functionName = "node-enrichment-papers-v2"
				body = { ...request.params, language: getOutputLanguage() }
			} else if (request.type === "patents") {
				functionName = "search-scenario-patents"
				body = {
					...request.params,
					node_id: request.params.nodeId || request.nodeId,
					tree_id: request.params.treeId,
					treeId: request.params.treeId,
					nodeId: request.params.nodeId || request.nodeId,
					team_id: request.params.team_id ?? null,
					language: getOutputLanguage(),
					flow_mode: "both",
					include_desc: false,
				}
			} else if (request.type === "useCases") {
				functionName = "node-enrichment-usecases"
				body = { ...request.params, language: getOutputLanguage() }
			} else if (request.type === "trl") {
				functionName = "node-trl-calculation"
			} else {
				throw new Error(`Unknown enrichment type: ${request.type}`)
			}

			// Await the initial response to catch validation errors
			const { data, error } = await supabase.functions.invoke(functionName, {
				body,
			})

			// Check for immediate errors (validation errors, missing params, etc.)
			if (error) {
				console.error(
					`[ENRICHMENT_QUEUE] ${request.type} API returned error:`,
					error.message,
					error,
				)
				throw new Error(error.message || "API call failed")
			}

			// Check if response contains an error field (from edge function)
			if (data && typeof data === "object" && "error" in data) {
				console.error(
					`[ENRICHMENT_QUEUE] ${request.type} API returned error in response:`,
					data,
				)
				throw new Error((data as any).error || "Edge function returned error")
			}

			// Success! API call was initiated
			this.consecutiveFailures = 0
			if (!this.state.apiHealthy) {
				this.state.apiHealthy = true
			}

			return data
		} catch (error) {
			// Track the failure for this specific request only
			console.error(
				`[ENRICHMENT_QUEUE] API call failed for ${request.nodeId}:${request.type}:`,
				{
					error: error instanceof Error ? error.message : String(error),
					errorType:
						error instanceof Error ? error.constructor.name : typeof error,
					fullError: error,
				},
			)

			// Only track true system-level failures
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			const isSystemFailure =
				errorMessage.includes("Failed to invoke") ||
				errorMessage.includes("ECONNREFUSED") ||
				errorMessage.includes("ENOTFOUND") ||
				errorMessage.includes("ERR_NETWORK")

			if (isSystemFailure) {
				this.consecutiveFailures++

				if (
					this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES &&
					this.state.apiHealthy
				) {
					console.error(
						"[ENRICHMENT_QUEUE] Too many consecutive system failures - marking API as unhealthy",
					)
					this.state.apiHealthy = false
				}
			} else {
				if (this.consecutiveFailures > 0) {
					this.consecutiveFailures = 0
				}
			}

			throw error
		}
	}

	/**
	 * Check if the API is healthy using Supabase Edge Function proxy
	 */
	private async checkAPIHealth(): Promise<boolean> {
		try {
			const { supabase } = await import("@/integrations/supabase/client")

			const { data, error } = await supabase.functions.invoke(
				"api-health-check",
				{
					body: {},
				},
			)

			if (error) {
				console.error(
					"[ENRICHMENT_QUEUE] Health check proxy failed:",
					error.message,
				)
				return false
			}

			const isHealthy = data?.healthy === true
			return isHealthy
		} catch (error) {
			console.error("[ENRICHMENT_QUEUE] Health check failed:", error)
			return false
		}
	}

	private recentlyCompleted: {
		nodeId: string
		type: "papers" | "useCases" | "trl" | "patents"
		nodeName: string
		doneAt: number
		startTime?: number
	}[] = []
	private readonly COMPLETED_DISPLAY_TIME = 30000 // 30 seconds

	getDisplayQueue() {
		// Get queue (waiting), processing (fetching), and recentlyCompleted (done)
		const waiting = this.state.queue.map((request) => ({
			...request,
			status: ENRICHMENT_STATUS.WAITING,
		}))
		const processing = Array.from(this.state.processing.values()).map(
			(request) => ({
				...request,
				status: ENRICHMENT_STATUS.FETCHING,
			}),
		)
		const done = this.recentlyCompleted.map((request) => ({
			...request,
			status: ENRICHMENT_STATUS.DONE,
		}))
		// Combine and sort
		return [...processing, ...waiting, ...done]
	}
}

// Singleton instance
export const enrichmentQueue = new EnrichmentQueueManager()

// Export utility functions for React components
export const getEnrichmentStatus = (
	nodeId: string,
	type: "papers" | "useCases" | "trl" | "patents",
): EnrichmentStatus => {
	return enrichmentQueue.getStatus(nodeId, type)
}

export const getEnrichmentElapsedTime = (
	nodeId: string,
	type: "papers" | "useCases" | "trl" | "patents",
): number | null => {
	return enrichmentQueue.getElapsedTime(nodeId, type)
}

export const subscribeToEnrichmentStatus = (
	listener: (
		nodeId: string,
		type: "papers" | "useCases" | "trl" | "patents",
		status: EnrichmentStatus,
		elapsedTime?: number,
	) => void,
) => {
	return enrichmentQueue.subscribe(listener)
}

export const getQueueStatus = () => {
	return enrichmentQueue.getQueueStatus()
}

export const isQueueTrulyIdle = () => {
	const status = enrichmentQueue.getQueueStatus()
	const displayQueue = enrichmentQueue.getDisplayQueue()
	return (
		status.queueLength === 0 &&
		status.processing.papers === 0 &&
		status.processing.patents === 0 &&
		status.processing.useCases === 0 &&
		status.processing.trl === 0 &&
		displayQueue.filter((item) => item.status === ENRICHMENT_STATUS.DONE)
			.length === 0
	)
}

export const cancelEnrichment = (
	nodeId: string,
	type: "papers" | "useCases" | "trl" | "patents",
) => {
	enrichmentQueue.cancel(nodeId, type)
}

export const enqueueEnrichment = (
	nodeId: string,
	nodeName: string,
	type: "papers" | "useCases" | "trl" | "patents",
	params: any,
	callback: (response: any) => void,
) => {
	enrichmentQueue.enqueue({
		nodeId,
		nodeName,
		type,
		params,
		callback,
	})
}
