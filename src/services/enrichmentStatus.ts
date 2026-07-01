/**
 * Enrichment status constants used throughout the application
 */

import { ENRICHMENT_STATUS, type EnrichmentStatus } from "@/types/enrichment"

// Re-export for backward compatibility
export { ENRICHMENT_STATUS }
export type { EnrichmentStatus }

// Helper functions for status checks
export const isWaitingStatus = (status: EnrichmentStatus): boolean =>
	status === ENRICHMENT_STATUS.WAITING

export const isFetchingStatus = (status: EnrichmentStatus): boolean =>
	status === ENRICHMENT_STATUS.FETCHING

export const isDoneStatus = (status: EnrichmentStatus): boolean =>
	status === ENRICHMENT_STATUS.DONE

export const isErrorStatus = (status: EnrichmentStatus): boolean =>
	status === ENRICHMENT_STATUS.ERROR

export const isTimeoutStatus = (status: EnrichmentStatus): boolean =>
	status === ENRICHMENT_STATUS.TIMEOUT

export const isLoadingStatus = (status: EnrichmentStatus): boolean =>
	status === ENRICHMENT_STATUS.FETCHING

export const hasErrorStatus = (status: EnrichmentStatus): boolean =>
	status === ENRICHMENT_STATUS.ERROR || status === ENRICHMENT_STATUS.TIMEOUT

export const isActiveStatus = (status: EnrichmentStatus): boolean =>
	status === ENRICHMENT_STATUS.WAITING || status === ENRICHMENT_STATUS.FETCHING
