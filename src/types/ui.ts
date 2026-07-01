/**
 * UI Shared Types
 *
 * Types for UI state, navigation, visualization, and component interactions.
 */

// ── Path State (resolved duplicate from useNodeOperations/usePathState) ──

export interface PathState {
	level1: string
	level2: string
	level3: string
	level4?: string
	level5?: string
	level6?: string
	level7?: string
	level8?: string
	level9?: string
	level10?: string
}

// ── MindMap ─────────────────────────────────────────

export interface MindMapNode {
	id: string
	name: string
	description: string
	level: number
	levelName: string
	x: number
	y: number
	parentId?: string
	isSelected?: boolean
	isCustom?: boolean
	children_count?: number
	isExpanded?: boolean
	hasChildren?: boolean
	hasChildrenInOriginalData?: boolean
	totalChildrenCount?: number
}

export interface MindMapConnection {
	id: string
	sourceId: string
	targetId: string
	sourceX: number
	sourceY: number
	targetX: number
	targetY: number
}

// ── Node Navigation ─────────────────────────────────

export interface NodePath {
	level: string
	path: string[]
}

// ── Technology Tree State ───────────────────────────

export interface TechnologyTreeState {
	selectedPath: PathState
	selectedView: string
	sidebarTab: string
	showSidebar: boolean
	collapsedSidebar: boolean
	inputValue: string
	query?: string
	hasUserMadeSelection: boolean
	showLevel4?: boolean
	searchMode?: string
}

// ── Scenario Chat ───────────────────────────────────

export type ScenarioChatDisplayMode = "overlay" | "panel"

// ── Scenario Enrichment ─────────────────────────────

export interface AvailableEnrichment {
	key: string
	label: string
	labelKey?: string
	description?: string
	descriptionKey?: string
	category?: string
	isAvailable?: boolean
	comingSoon?: boolean
	filterType?: "select" | "range" | "none"
	selectOptions?: { value: string; label: string; labelKey?: string }[]
	rangeConfig?: { min?: number; max?: number; unit?: string }
}

export interface MetricCategory {
	id: string
	label: string
	labelKey?: string
	metrics: AvailableEnrichment[]
}

// ── Custom View ─────────────────────────────────────

export interface AvailableColumn {
	key: string
	label: string
	category?: string
}

// ── Value Rationale ─────────────────────────────────

export interface ValueRationale {
	summary: string
	derivation: string
}

export interface CAGRCategoryInfo {
	title: string
	description: string
	category: string
	color: string
	value: number | null | undefined
}

// ── Add Scenario ────────────────────────────────────

export interface ManualScenarioInput {
	name: string
	summary: string
}

export interface AIGenerationInput {
	context: string
}
