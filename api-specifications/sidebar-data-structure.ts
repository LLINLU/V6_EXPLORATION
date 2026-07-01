/**
 * API Data Structure Specifications for TechTree Sidebar
 * This file defines the exact JSON structures and TypeScript types
 * that the backend team needs to implement for the sidebar data.
 */

// =============================================================================
// PAPER DATA STRUCTURES
// =============================================================================

/**
 * Individual Paper/Research Publication
 */
export interface Paper {
	id: string
	title: string // Paper title
	authors: string // Comma-separated author names
	journal: string // Publication journal/conference name
	tags: string[] // Array of relevant tags for categorization
	abstract: string // Paper abstract/summary
	date: string // Publication date (YYYY-MM-DD format)
	citations: number // Number of citations for filtering and sorting
	region: "domestic" | "international" // Geographic origin for filtering
	doi?: string // Optional DOI identifier
	url?: string // Optional direct link to paper
}

/**
 * Papers Response for a specific tree node
 */
export interface PapersResponse {
	nodeId: string // Tree node ID this data relates to
	nodeTitle: string // Tree node title for context
	papers: Paper[] // Array of related papers
	totalCount: number // Total number of papers available
}

// =============================================================================
// USE CASE DATA STRUCTURES
// =============================================================================

/**
 * Press Release information for use cases
 */
export interface PressRelease {
	title: string // Press release title
	url: string // Link to press release
	date?: string // Optional publication date
}

/**
 * Individual Use Case
 * Note: Badge colors are generated dynamically in the frontend based on the releases count
 */
export interface UseCase {
	id: string
	title: string // Use case title
	description: string // Detailed description
	releases: number // Number of press releases/updates
	pressReleases: PressRelease[] // Array of related press releases
}

/**
 * Use Cases Response for a specific tree node
 */
export interface UseCasesResponse {
	nodeId: string // Tree node ID this data relates to
	nodeTitle: string // Tree node title for context
	cases: UseCase[] // Array of use cases
	totalCount: number // Total number of cases available
}

// =============================================================================
// TREE NODE CONTEXT DATA
// =============================================================================

/**
 * Tree Node Information for Sidebar Context
 */
export interface TreeNodeInfo {
	id: string
	title: string // Node title/name
	description?: string // Optional node description
	level: number // Tree level (1-10)
	path: string[] // Full path from root to this node
}

// =============================================================================
// COMBINED SIDEBAR DATA RESPONSE
// =============================================================================

/**
 * Complete Sidebar Data Response
 * This is the main API response structure for sidebar content
 */
export interface SidebarDataResponse {
	nodeInfo: TreeNodeInfo
	papers: PapersResponse
	useCases: UseCasesResponse
	lastUpdated: string // ISO timestamp of last data update
}

// =============================================================================
// API ENDPOINT SPECIFICATIONS
// =============================================================================

/**
 * API Request Parameters for Sidebar Data
 */
export interface SidebarDataRequest {
	nodeId: string // Required: Tree node ID
	treeId?: string // Optional: Tree ID for context
}

/**
 * Filtering and Search Parameters
 */
export interface SidebarFilterRequest extends SidebarDataRequest {
	searchQuery?: string // Optional: Search within papers/cases
	dateFrom?: string // Optional: Filter papers from date (YYYY-MM-DD)
	dateTo?: string // Optional: Filter papers to date (YYYY-MM-DD)
	timePeriod?: "past-year" | "past-5-years" | "past-10-years" // Optional: Time period filter
	citationsMin?: number // Optional: Minimum number of citations (10, 50, 100)
	region?: "domestic" | "international" | "both" // Optional: Filter by geographic region
	tags?: string[] // Optional: Filter by specific tags
	sortBy?: "date" | "relevance" | "title" | "citations" // Optional: Sort order
	sortOrder?: "asc" | "desc" // Optional: Sort direction
}

// =============================================================================
// EXAMPLE JSON RESPONSES
// =============================================================================

/**
 * Example API Response for GET /api/sidebar-data/{nodeId}
 */
export const EXAMPLE_SIDEBAR_RESPONSE: SidebarDataResponse = {
	nodeInfo: {
		id: "adaptive-optics-astronomy",
		title: "Adaptive Optics for Astronomy",
		description:
			"Advanced optical systems that correct atmospheric disturbances for clearer astronomical observations",
		level: 2,
		path: ["astronomy", "adaptive-optics-astronomy"],
	},
	papers: {
		nodeId: "adaptive-optics-astronomy",
		nodeTitle: "Adaptive Optics for Astronomy",
		papers: [
			{
				id: "paper-001",
				title: "Advances in Adaptive Optics for Astronomical Observations",
				authors: "M. Johnson, K. Suzuki, L. Martinez",
				journal: "Journal of Astronomical Instrumentation",
				tags: ["Laser Guide Star", "Astronomy", "Atmospheric Compensation"],
				abstract:
					"This paper reviews recent developments in laser guide star technology for adaptive optics in ground-based telescopes, highlighting improvements in sodium layer excitation efficiency and Rayleigh scattering techniques.",
				date: "2024-04-15",
				citations: 127,
				region: "international",
				doi: "10.1142/S2251171724000012",
				url: "https://example.com/paper-001",
			},
			{
				id: "paper-002",
				title: "High-Resolution Imaging with Deformable Mirrors",
				authors: "S. Williams, R. Chen, T. Nakamura",
				journal: "Optics Express",
				tags: ["Deformable Mirrors", "Image Quality", "Wavefront Correction"],
				abstract:
					"This study presents novel deformable mirror designs that achieve unprecedented correction accuracy for astronomical adaptive optics systems.",
				date: "2024-03-28",
				citations: 89,
				region: "international",
				doi: "10.1364/OE.489234",
			},
		],
		totalCount: 45,
	},
	useCases: {
		nodeId: "adaptive-optics-astronomy",
		nodeTitle: "Adaptive Optics for Astronomy",
		cases: [
			{
				id: "impl-001",
				title: "Extremely Large Telescope (ELT) Adaptive Optics",
				description:
					"The world's largest ground-based telescope implementing advanced adaptive optics systems for unprecedented astronomical observations. Features cutting-edge deformable mirrors and laser guide star technology.",
				releases: 8,
				pressReleases: [
					{
						title: "ELT First Light Adaptive Optics System Milestone",
						url: "https://eso.org/news/elt-ao-milestone",
						date: "2024-01-15",
					},
					{
						title: "Revolutionary Mirror Technology Breakthrough",
						url: "https://eso.org/news/mirror-tech",
						date: "2023-11-20",
					},
				],
			},
			{
				id: "impl-002",
				title: "James Webb Space Telescope Mirror Control",
				description:
					"Precision mirror segment control system enabling perfect optical alignment in space. Demonstrates advanced adaptive optics principles for space-based astronomy.",
				releases: 12,
				pressReleases: [
					{
						title: "JWST Mirror Alignment Complete",
						url: "https://nasa.gov/news/jwst-mirrors",
						date: "2022-04-28",
					},
					{
						title: "Perfect Mirror Segments Achievement",
						url: "https://nasa.gov/news/mirror-perfection",
						date: "2022-03-11",
					},
				],
			},
		],
		totalCount: 15,
	},
	lastUpdated: "2024-04-20T10:30:00Z",
}

// =============================================================================
// API ENDPOINT URLS
// =============================================================================

/**
 * example API Endpoints
 */
export const API_ENDPOINTS = {
	// Get complete sidebar data for a node
	getSidebarData: "/api/sidebar-data/{nodeId}",

	// Search papers across all nodes
	searchPapers: "/api/papers/search",
	// Search use cases across all nodes
	searchUseCases: "/api/use-cases/search",
} as const

// =============================================================================
// ERROR RESPONSE STRUCTURE
// =============================================================================

/**
 * Standard Error Response
 */
export interface ApiErrorResponse {
	error: string // Error message
	code: string // Error code (e.g., 'NODE_NOT_FOUND', 'INVALID_PARAMS')
	details?: string // Optional detailed error information
	timestamp: string // ISO timestamp of error
}

/**
 * Example Error Response
 */
export const EXAMPLE_ERROR_RESPONSE: ApiErrorResponse = {
	error: "Tree node not found",
	code: "NODE_NOT_FOUND",
	details: "No papers or use cases found for node ID: invalid-node-123",
	timestamp: "2024-04-20T10:30:00Z",
}
