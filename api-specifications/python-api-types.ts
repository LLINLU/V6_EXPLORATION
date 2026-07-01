/**
 * TypeScript Type Definitions for Python API Integration
 * TechTree Data Population with External Python API
 *
 */

// =============================================================================
// INPUT: TREE STRUCTURE TO PYTHON API
// =============================================================================

/**
 * Complete scenario tree structure sent to Python API for processing
 */
export interface ScenarioTreeInput {
	treeId: string // Unique tree identifier
	scenarioNode: TreeNodeInput // Level-1 scenario node with complete subtree
}

/**
 * Individual tree node structure for API input
 */
export interface TreeNodeInput {
	id: string
	title: string
	description?: string
	level: number // 1=Scenario(How1 for Fast), 2=Purpose, 3=Function, 4+=Measure
	children: TreeNodeInput[] // Nested child nodes
	keywords?: string[] // Optional keywords for better matching
	context?: string // Additional context for this node
}

// =============================================================================
// OUTPUT: ENRICHED TREE FROM PYTHON API
// =============================================================================

/**
 * Complete enriched scenario tree response from Python API
 */
export interface EnrichedScenarioResponse {
	treeId: string
	scenarioNode: EnrichedTreeNode // Level-1 scenario with enriched subtree
}

/**
 * Individual enriched tree node with generated data
 */
export interface EnrichedTreeNode {
	id: string
	title: string
	description?: string
	level: number // 1=Scenario, 2=Purpose, 3=Function, 4+=Measure
	children: EnrichedTreeNode[]

	// Generated data for this node
	papers: Paper[] // Generated papers for this node
	useCases?: UseCase[] // Generated use cases for this node (optional until API is ready)
}

// =============================================================================
// ENHANCED DATA STRUCTURES
// =============================================================================

/**
 * Paper object - matches sidebar-data-structure.ts exactly
 */
export interface Paper {
	id: string
	title: string // Paper title
	authors: string // Comma-separated author names
	journal: string // Publication journal/conference name
	tags: string[] // Array of relevant tags for categorization
	abstract: string // Paper abstract/summary
	date: string | null // Publication date (YYYY-MM-DD format) or null if unknown
	citations: number // Number of citations for filtering and sorting
	region: "domestic" | "international" // Geographic origin for filtering
	doi?: string // Optional DOI identifier
	url?: string // Optional direct link to paper
}

/**
 * Use Case object - matches sidebar ImplementationCase structure
 */
export interface UseCase {
	id: string
	title: string // Use case title
	description: string // Detailed description
	releases: number // Number of press releases/updates (for badge generation)
	pressReleases: PressRelease[] // Array of related press releases
}

/**
 * Press Release information - matches sidebar structure exactly
 */
export interface PressRelease {
	title: string // Press release title
	url: string // Link to press release
	date?: string // Optional publication date (YYYY-MM-DD format)
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * API request payload
 */
export interface PythonApiRequest {
	data: ScenarioTreeInput
}

/**
 * API response payload
 */
export interface PythonApiResponse {
	success: boolean
	data?: EnrichedScenarioResponse
	error?: ApiErrorResponse
}

/**
 * API error response
 */
export interface ApiErrorResponse {
	error: string
	code: string
	details: string
	timestamp: string
	treeId?: string
	partialResults?: EnrichedScenarioResponse
}

// =============================================================================
// FRONTEND INTEGRATION TYPES
// =============================================================================

/**
 * Database save payload (for Supabase)
 */
export interface DatabaseSavePayload {
	treeId: string
	nodeId: string
	papers: Paper[]
	useCases: UseCase[]
	metadata: {
		processedAt: string
		apiVersion: string
		confidence: number
	}
}

/**
 * Processing status for frontend UI
 */
export interface ProcessingStatus {
	treeId: string
	status: "pending" | "processing" | "completed" | "error"
	progress: {
		nodesProcessed: number
		totalNodes: number
		currentNode?: string
	}
	startedAt: string
	completedAt?: string
	error?: string
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Python API configuration
 */
export interface PythonApiConfig {
	apiUrl: string
	timeout: number // Request timeout in milliseconds
	retryAttempts: number
	retryDelay: number // Delay between retries in milliseconds
	maxTreeSize: number // Maximum number of nodes to process
	batchSize?: number // If processing in batches
}

/**
 * Content generation preferences
 */
export interface ContentGenerationPreferences {
	language: "ja" | "en" | "both"
	maxPapersPerNode: number
	maxUseCasesPerNode: number
	minConfidenceThreshold: number
	preferRecentPapers: boolean
	includePreprints: boolean
	geographicPreference: "domestic" | "international" | "balanced"
	industryFocus?: string[]
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Tree traversal utilities
 */
export type TreeNodeProcessor<T> = (node: TreeNodeInput, path: string[]) => T
export type TreeNodeMatcher = (node: TreeNodeInput) => boolean

/**
 * Data validation types
 */
export interface ValidationResult {
	isValid: boolean
	errors: string[]
	warnings: string[]
}

/**
 * Export collection for external use
 */
export interface PythonApiTypes {
	// Input types
	ScenarioTreeInput: ScenarioTreeInput
	TreeNodeInput: TreeNodeInput

	// Output types
	EnrichedScenarioResponse: EnrichedScenarioResponse
	EnrichedTreeNode: EnrichedTreeNode
	Paper: Paper
	UseCase: UseCase

	// API types
	PythonApiRequest: PythonApiRequest
	PythonApiResponse: PythonApiResponse
	ApiErrorResponse: ApiErrorResponse

	// Utility types
	ProcessingStatus: ProcessingStatus
}

// =============================================================================
// EXAMPLE DATA FOR TESTING
// =============================================================================

/**
 * Example scenario tree structure for testing
 */
export const EXAMPLE_SCENARIO_INPUT: ScenarioTreeInput = {
	treeId: "climate-tech-2024-001",
	scenarioNode: {
		id: "renewable-storage-scenario",
		title: "Renewable Energy Storage Solutions",
		description: "Advanced storage technologies for renewable energy systems",
		level: 1,
		keywords: ["renewable energy", "energy storage", "grid storage"],
		children: [
			{
				id: "battery-storage",
				title: "Battery Storage Systems",
				description: "Large-scale battery storage for grid applications",
				level: 2,
				keywords: ["battery", "grid storage", "lithium-ion"],
				children: [
					{
						id: "lithium-ion-grid",
						title: "Grid-Scale Lithium-Ion Storage",
						description:
							"Large-scale lithium-ion battery systems for utility grid energy storage applications",
						level: 3,
						children: [],
						keywords: ["lithium-ion", "grid storage", "utility scale"],
					},
				],
			},
		],
	},
}

/**
 * Example enriched response for testing
 */
export const EXAMPLE_ENRICHED_RESPONSE: EnrichedScenarioResponse = {
	treeId: "climate-tech-2024-001",
	scenarioNode: {
		id: "renewable-storage-scenario",
		title: "Renewable Energy Storage Solutions",
		description: "Advanced storage technologies for renewable energy systems",
		level: 1,
		papers: [
			{
				id: "paper-generated-001",
				title:
					"Grid-Scale Energy Storage: Current Technologies and Future Prospects",
				authors: "Zhang, L., Schmidt, M., Tanaka, H.",
				journal: "Renewable Energy Systems Journal",
				tags: ["energy storage", "grid scale", "renewable energy"],
				abstract:
					"This review examines current grid-scale energy storage technologies and their potential for supporting renewable energy integration...",
				date: "2024-03-15",
				citations: 45,
				region: "international",
				doi: "10.1016/j.resys.2024.03.015",
				url: "https://doi.org/10.1016/j.resys.2024.03.015",
			},
		],
		useCases: [
			{
				id: "usecase-generated-001",
				title: "Tesla Megapack Grid Storage Deployment",
				description:
					"Large-scale deployment of Tesla Megapack systems for grid stabilization in California, representing one of the world's largest battery storage installations.",
				releases: 12,
				pressReleases: [
					{
						title: "Tesla Completes World's Largest Battery Storage Project",
						url: "https://tesla.com/news/megapack-deployment-2024",
						date: "2024-02-15",
					},
				],
			},
		],
		children: [], //.. Additional child nodes will be added here
	},
}
