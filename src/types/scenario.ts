/**
 * Scenario Types
 * Type definitions for scenario selection with filtering metrics
 */

// Market structure types
export type MarketStructure = "monopoly" | "oligopoly" | "fragmented" | null // 独占/寡占/分散

// Market data with reasoning
export interface MarketData {
	value: number | null
	reasoning?: string // 導出ロジック
}

// Domestic and Global market sizing
export interface MarketSizing {
	domestic: {
		tam: MarketData // Total Addressable Market (国内TAM)
		sam: MarketData // Serviceable Addressable Market (国内SAM)
		som: MarketData // Serviceable Obtainable Market (国内SOM)
	}
	global: {
		tam: MarketData // Total Addressable Market (世界TAM)
		sam: MarketData // Serviceable Addressable Market (世界SAM)
		som: MarketData // Serviceable Obtainable Market (世界SOM)
	}
	cagr: MarketData // Market CAGR (国内外マーケット成長率)
	structure: {
		value: MarketStructure
		reasoning?: string
	}
	marketStructure?: string | null
}

// Research signal data with CAGR
export interface ResearchSignal {
	count: number | null
	cagr: number | null // Growth rate percentage
	reasoning?: string
	cagrMeta?: {
		startYear: number | null
		endYear: number | null
		startValue: number | null
		endValue: number | null
		yearCounts: Record<number, number>
	}
}

// TRL breakdown showing paper vs patent contribution
export interface TRLBreakdown {
	total: number | null // 1-9
	paperContribution: number | null
	patentContribution: number | null
	reasoning?: string
}

export interface TRLDetails {
	trl_score: number | null
	feasibility?: "feasible" | "bottleneck" | null
	best_source_ids: string[] // IDs of sources that contributed to the TRL score
	best_srouce_reasons?: string[] // Explanation of why each source contributed to the TRL score
	alternative_source_ids?: string[] // IDs of sources that were considered but not selected as best sources
	alternative_source_reasons?: string[] // Explanation of why each alternative source was not selected as a best source
	reasoning?: string
}
// Per-technology TRL (scenario can have multiple technologies to realize it)
export interface TechnologyTRL {
	name: string
	description: string
	trl: TRLDetails
}

export interface ScenarioMetrics {
	// Legacy fields for backwards compatibility
	tam: number | null // Total Addressable Market (in billions USD)
	tamCategory: "small" | "medium" | "large" | "very-large" | null // <$1B, $1-10B, $10-50B, >$50B
	trl: number | null // Technology Readiness Level (1-9)
	trlCategory: "early" | "mid" | "mature" | null // 1-3, 4-6, 7-9
	cagr: number | null // Compound Annual Growth Rate (percentage)
	cagrCategory: "low" | "medium" | "high" | "very-high" | null // <5%, 5-15%, 15-30%, >30%
	marketGrowthRate: number | null // Percentage growth rate
	competitiveness: number | null // Score 1-10
	implementationDifficulty: "low" | "medium" | "high" | null
	timeToMarket: "short" | "medium" | "long" | null // <1yr, 1-3yr, >3yr
	paperCount: number | null
	patentCount: number | null
	implementationCount: number | null

	// New expanded market data
	marketSizing?: MarketSizing

	// Research signals with CAGR
	papers?: ResearchSignal // 論文数 + 論文CAGR
	patents?: ResearchSignal // 特許数 + 特許CAGR
	useCases?: ResearchSignal // 事例数 + 事例CAGR

	// TRL with breakdown
	trlBreakdown?: TRLBreakdown

	// Per-technology TRL (multiple technologies to realize the scenario)
	technologiesTrl?: TechnologyTRL[]

	// Internal: fetch-in-progress flags (not persisted)
	_fetchingPapers?: boolean
	_fetchingPatents?: boolean
	_fetchingUseCases?: boolean
}

export interface Scenario {
	analysisData?: any
	id: string
	name: string
	description?: string // Summary
	level: number

	// Customer segment (顧客セグメント)
	customerSegment?: {
		name: string // Short segment name
		description?: string // Explanation
	}

	// Filterable metrics
	metrics: ScenarioMetrics

	// Keyword tags for filtering
	tags: string[]

	// Manually added scenario fields
	isManuallyAdded?: boolean // Flag to identify user-added scenarios
	userInput?: {
		// Original user input for manually added scenarios
		name?: string // User-provided scenario name
		summary?: string // User-provided summary/description
		context?: string // Additional context provided
	}

	// AI-generated scenario fields (added via modal)
	isAIGenerated?: boolean // Flag to identify AI-generated scenarios added via modal
	aiGenerationInput?: {
		context?: string // Context provided by user for AI generation
	}

	// Technology characteristics from API's technology_strength
	techCharacteristics?: Array<TechnologyCharacteristics> | null

	// Technological advantage evaluation from scenario generation prompt
	technologicalAdvantage?: TechnologicalAdvantage | null
}
export interface TechnologyCharacteristics {
	name?: string
	label?: string
	description?: string
	potential_applications?: string
}
export interface TechnologicalAdvantage {
	rating: "高" | "中" | "低"
	explanation: string // Japanese, ≤200 chars
}
export interface ScenarioGenerationResult {
	treeId: string
	scenarios: Scenario[]
	investigationAim?: string
	mode: "TED" | "FAST"
	status: "scenarios_ready"
}

// TAM category options
export type TamCategoryOption = "small" | "medium" | "large" | "very-large"
export const TAM_OPTIONS: { value: TamCategoryOption; label: string }[] = [
	{ value: "small", label: "小 (<$1B)" },
	{ value: "medium", label: "中 ($1-10B)" },
	{ value: "large", label: "大 ($10-50B)" },
	{ value: "very-large", label: "特大 (>$50B)" },
]

// TRL category options
export type TrlCategoryOption = "early" | "mid" | "mature"
export const TRL_OPTIONS: { value: TrlCategoryOption; label: string }[] = [
	{ value: "early", label: "初期 (1-3)" },
	{ value: "mid", label: "中期 (4-6)" },
	{ value: "mature", label: "成熟 (7-9)" },
]

// CAGR category options
export type CagrCategoryOption = "low" | "medium" | "high" | "very-high"
export const CAGR_OPTIONS: { value: CagrCategoryOption; label: string }[] = [
	{ value: "low", label: "低 (<5%)" },
	{ value: "medium", label: "中 (5-15%)" },
	{ value: "high", label: "高 (15-30%)" },
	{ value: "very-high", label: "特高 (>30%)" },
]

export interface FilterState {
	// Multi-select filters (array means multiple selections, empty array = all)
	tamCategories: TamCategoryOption[]
	trlCategories: TrlCategoryOption[]
	cagrCategories: CagrCategoryOption[]

	// Legacy single-select (kept for compatibility)
	tamCategory: "all" | "small" | "medium" | "large" | "very-large"
	trlCategory: "all" | "early" | "mid" | "mature"
	cagrCategory?: "all" | "low" | "medium" | "high" | "very-high"

	// Additional filters
	implementationDifficulty?: "all" | "low" | "medium" | "high"
	timeToMarket?: "all" | "short" | "medium" | "long"
	minPaperCount?: number
	maxPaperCount?: number
	minPatentCount?: number
	maxPatentCount?: number
	minImplementationCount?: number
	maxImplementationCount?: number
	minCompetitiveness?: number
	maxCompetitiveness?: number

	// Selected tags
	selectedTags: string[]
}

// All options selected by default (empty array means "all")
export const DEFAULT_FILTERS: FilterState = {
	tamCategories: [], // Empty = all selected
	trlCategories: [], // Empty = all selected
	cagrCategories: [], // Empty = all selected
	tamCategory: "all",
	trlCategory: "all",
	cagrCategory: "all",
	implementationDifficulty: "all",
	timeToMarket: "all",
	minPaperCount: 0,
	maxPaperCount: undefined,
	minPatentCount: 0,
	maxPatentCount: undefined,
	minImplementationCount: 0,
	maxImplementationCount: undefined,
	minCompetitiveness: 0,
	maxCompetitiveness: 10,
	selectedTags: [],
}
