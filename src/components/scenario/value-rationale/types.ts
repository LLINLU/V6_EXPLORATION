// Types for Value Rationale feature
// Shows derivation rationale/basis for metric values

import type { CAGRCategoryInfo, ValueRationale } from "@/types/ui"

export type { CAGRCategoryInfo, ValueRationale } from "@/types/ui"

// Props for the wrapper component
export interface ValueWithRationaleProps {
	children: React.ReactNode
	rationale: ValueRationale | null | undefined
	metricName: string
	metricValue: string
	className?: string
	// Optional CAGR category info to show in combined hover card
	cagrInfo?: CAGRCategoryInfo
}

// Props for hover card
export interface RationaleHoverCardProps {
	summary: string
	metricName: string
	onClickDetails: () => void
	// Optional CAGR category info to show above rationale
	cagrInfo?: CAGRCategoryInfo
}

// Props for modal
export interface RationaleModalProps {
	isOpen: boolean
	onClose: () => void
	metricName: string
	metricValue: string
	derivation: string
}
