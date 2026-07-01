/**
 * Multi-Axis Keyword System Types
 * Based on algorithms from reference repository
 */

/**
 * Exploration axis (dimension) for multi-angle analysis
 * Example: "Technology", "Economics", "Social Impact"
 */
export interface Axis {
	name: string
	description: string
}

/**
 * Keyword within an axis
 * Example: { keyword: "Deep Learning", description: "Neural networks for medical imaging", axis: "Technology" }
 */
export interface Keyword {
	keyword: string
	description: string
	axis: string
	selected?: boolean
}

/**
 * Grouped keywords by axis
 * Used for passing selected keywords to tree generation
 * Example: { "Technology": ["Deep Learning", "Computer Vision"], "Economics": ["Cost Reduction"] }
 */
export interface GroupedKeywords {
	[axis: string]: string[]
}

/**
 * Complete axis with generated keywords
 */
export interface AxisWithKeywords extends Axis {
	keywords: Keyword[]
	isExpanded?: boolean
	selectedCount?: number
}

/**
 * Technical characteristic for research focus
 * Example: { name: "Scalability", description: "Ability to handle large datasets efficiently" }
 */
export interface TechCharacteristic {
	name: string
	description: string
	selected?: boolean
}

/**
 * Technology strength returned from pipeline/generate API.
 * Matches Python schema: schemas/v5/base/tech_strength.py
 */
export interface TechStrength {
	strength_name: string
	description: string
	potential_applications: string
}

// ---------------------------------------------------------------------------
// Python API v5 Tech Characteristics (schemas/v5/analysis/tech_characteristics/)
// ---------------------------------------------------------------------------

import type { ApiBaseDerivationOutput, ApiBaseTableOutput } from "./tree"

// ── tech_characteristics/models.py ──

export interface ApiCharacteristicReference {
	apa_citation: string
	source_type: string
	relevance: string
}

export type ApiAdvantageDimension =
	| "energy_form"
	| "process_characteristic"
	| "physical_constraint"
	| "selectivity"
	| "other"

export type ApiAbstractionLevel =
	| "physics_phenomenon"
	| "chemical_reaction"
	| "structural_change"
	| "mixed"

export interface ApiTechCharacteristic {
	characteristic_name: string
	overview: string
	advantage: string
	advantage_dimension: ApiAdvantageDimension
	references?: ApiCharacteristicReference[]
	abstraction_level: ApiAbstractionLevel
}

export interface ApiTechCharacteristicsLLMOutput {
	technology_principle_summary: string
	characteristics?: ApiTechCharacteristic[]
	excluded_candidates?: string[]
}

export interface ApiTechnologyCharacteristicsResult {
	tech_name: string
	tech_definition: string
	principle_summary: string
	characteristics?: ApiTechCharacteristic[]
	excluded_candidates?: string[]
	article_count_used?: number
}

export interface ApiTechCharacteristicsAnalysisResult {
	query: string
	technologies?: ApiTechnologyCharacteristicsResult[]
	total_characteristics?: number
}

// ── tech_characteristics/derivation.py ──

export interface ApiTechnologyCharacteristicsDerivation {
	tech_name: string
	characteristic_count?: number
	principle_summary?: string
	excluded_candidates?: string[]
	article_count_used?: number
}

export interface ApiTechCharacteristicsDerivationOutput
	extends ApiBaseDerivationOutput {
	column_name: "Tech Characteristics"
	technology_derivations?: ApiTechnologyCharacteristicsDerivation[]
}

// ── tech_characteristics/table.py ──

export interface ApiTechnologyCharacteristicEntry {
	technology: string
	characteristic_name: string
	overview: string
	advantage: string
	advantage_dimension: string
	abstraction_level: string
}

export interface ApiTechCharacteristicsTableOutput extends ApiBaseTableOutput {
	column_name: "Tech Characteristics"
	column_type: "integer"
	entries?: ApiTechnologyCharacteristicEntry[]
}
