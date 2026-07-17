import type { Tables } from "@/integrations/supabase/types"
import type { Keyword, TechCharacteristic } from "./axis"

export interface TreeNode {
	id: string
	name: string
	info?: string
	description?: string
	isCustom?: boolean
	level?: number
	children_count?: number // Number of children nodes, 0 indicates generation in progress
	trl?: number // TRL 1–9
}
export interface SelectedNode {
	id: string
	title: string
	papers?: Tables<"node_papers">[]
	useCases?: Tables<"node_use_cases">[]
}

// Define path levels for better type safety
export type PathLevel =
	| "level1"
	| "level2"
	| "level3"
	| "level4"
	| "level5"
	| "level6"
	| "level7"
	| "level8"
	| "level9"
	| "level10"

// Additional tree-related interfaces
export interface LevelItems {
	[key: string]: TreeNode[]
}

export interface PaperData {
	title: string
	authors: string
	journal: string
	abstract: string
	date: string
	citations?: number
	doi: string
	tags: string[]
}

export interface NodeContext {
	selectedNodes?: SelectedNode[]
	contextText?: string
	contextMode?: ContextMode
	currentNode?: TreeNode
}

export interface ResearchPanelNodeData {
	id: string
	title: string
	description?: string
	level: number
}

export interface SelectedNodeInfo {
	nodeId: string | null
	title: string | null
	description?: string
	level?: number
}

// ---------------------------------------------------------------------------
// TED Generation types (matches evaluate-ted-layer Edge Function response)
// ---------------------------------------------------------------------------

export interface TedNode {
	id: string
	name: string
	description: string
	parent_id: string | null
}

export interface TedLayer {
	layer: "purpose" | "function" | "measure"
	nodes: TedNode[]
	generation_metadata: {
		total_nodes: number
		abstraction_level: string
		coverage_note: string
	}
}

export interface TedEvaluation {
	total_score: number
	passing_grade: number
	needs_regeneration: boolean
	evaluated_layer: string
	overall_feedback: string
	regeneration_priority: "high" | "medium" | "low"
}

export type TedLayerName = "purpose" | "function" | "measure"

export interface TedLayerResult {
	layer: TedLayer
	evaluation: TedEvaluation
}

export interface GenerationProgress {
	current_layer: TedLayerName | "complete"
	current_step: "generating" | "evaluating" | "regenerating" | "complete"
	attempt_count: number
	layer_results: Partial<Record<TedLayerName, TedLayerResult>>
}

// ---------------------------------------------------------------------------
// Navigation / Location state
// ---------------------------------------------------------------------------

export interface LocationState {
	query?: string
	scenario?: string
	searchMode?: string
	treeId?: string
	treeData?: Record<string, unknown>
	fromDatabase?: boolean
	fromPreset?: boolean
	isDemo?: boolean
	tedResults?: GenerationProgress["layer_results"]
	treeStructure?: Record<string, unknown>
	researchAnswers?: Record<string, unknown>
	conversationHistory?: Record<string, unknown>[]
	selectedKeywords?: Keyword[]
	selectedTechCharacteristics?: TechCharacteristic[]
}

// ---------------------------------------------------------------------------
// Tree generation Edge Function types
// ---------------------------------------------------------------------------

/**
 * Tree node shape returned from the generation Edge Function.
 * Different from TreeNode (which is the DB/UI representation).
 */
export interface GenerationTreeNode {
	id: string
	content: string
	level: number
	children: GenerationTreeNode[]
}

/**
 * Result from tree generation Edge Function call
 */
export interface TreeGenerationResult {
	success: boolean
	treeId: string
	treeStructure: {
		root: GenerationTreeNode
		reasoning?: string
		layer_config?: Record<string, unknown>
		scenario_inputs?: Record<string, unknown>
	}
	mode?: string
	status?: string
}

// ---------------------------------------------------------------------------
// Python API v5 schema types (matches references/memory_ai_dev/schemas/v5/base/)
// ---------------------------------------------------------------------------

/**
 * Matches Python: schemas/v5/base/scenario.py
 */
export interface ApiScenario {
	user_query: string
	user_context: string
	scenario_name: string
	scenario_description: string
}

/**
 * Matches Python: schemas/v5/base/purpose.py
 */
export interface ApiPurpose {
	purpose_name: string
	purpose_description: string
}

/**
 * Matches Python: schemas/v5/base/function.py
 */
export interface ApiFunction {
	function_name: string
	function_description: string
}

/**
 * Matches Python: schemas/v5/base/technology.py
 */
export interface ApiTechnology {
	tech_name: string
	tech_definition: string
}

/**
 * Matches Python: schemas/v5/base/tree.py - FunctionNode
 */
export interface ApiFunctionNode {
	function: ApiFunction
	technologies?: ApiTechnology[]
}

/**
 * Matches Python: schemas/v5/base/tree.py - ScenarioNode
 */
export interface ApiScenarioNode {
	scenario: ApiScenario
	purpose?: ApiPurpose
	functions?: ApiFunctionNode[]
}

// ---------------------------------------------------------------------------
// Python API v5 base schemas (schemas/v5/base/)
// ---------------------------------------------------------------------------

// ── base/query_tag.py ──

export interface ApiQueryTag {
	query: string
	query_definition?: string | null
	is_scenario?: boolean
}

// ── base/query_hit.py ──

export interface ApiQueryHit {
	query_tag: ApiQueryTag
	score?: number | null
}

// ── base/derivation_output.py ──

export type ApiSourceType =
	| "web_page"
	| "academic_paper"
	| "patent"
	| "database"
	| "llm_generated"

export interface ApiSourceReference {
	source_type: ApiSourceType
	url?: string
	title?: string
	excerpt?: string
}

export interface ApiReasoningStep {
	step_name: string
	input_summary?: string
	output_summary?: string
	model_used?: string
	reasoning_text?: string
}

export interface ApiCalculationStep {
	description: string
	formula?: string
	variables?: Record<string, string>
	result?: string
}

export interface ApiAttemptRecord {
	attempt_number: number
	succeeded: boolean
	failure_reason?: string
	improvement_applied?: string
}

export interface ApiConfidenceMetrics {
	overall_confidence: number
	metrics?: Record<string, number>
}

export interface ApiBaseDerivationOutput {
	scenario: ApiScenario
	column_name: string
	sources?: ApiSourceReference[]
	reasoning_steps?: ApiReasoningStep[]
	calculation_steps?: ApiCalculationStep[]
	confidence?: ApiConfidenceMetrics
	attempts?: ApiAttemptRecord[]
}

// ── base/table_output.py ──

export type ApiTableValueType =
	| "string"
	| "integer"
	| "float"
	| "boolean"
	| "datetime"

export interface ApiBaseTableOutput {
	scenario: ApiScenario
	column_name: string
	column_type: ApiTableValueType
	value: string | number | boolean | null
}

// ---------------------------------------------------------------------------
// Python API v5 source tree schemas (schemas/v5/source/tree.py)
// ---------------------------------------------------------------------------

export interface ApiScenarioNodeInput {
	id: string
	title: string
	description: string
	level: number
	children?: ApiScenarioNodeInput[]
	keywords?: string[] | null
	context?: string | null
}

export interface ApiScenarioNodeWithArticles extends ApiScenarioNodeInput {
	children?: ApiScenarioNodeWithArticles[]
	papers?: import("./sourcePool").ApiArticle[]
}

export interface ApiScenarioNodeWithUseCases extends ApiScenarioNodeInput {
	children?: ApiScenarioNodeWithUseCases[]
	use_cases?: import("./sourcePool").ApiMarket[]
}

export interface ApiTreeRequest {
	tree_id: string
	query: string
	scenario_node: ApiScenarioNodeInput
}

export type TreeMode = "TED" | "FAST"
export type ViewMode = "mindmap" | "treemap"
export type ChatDisplayMode = "overlay" | "panel"
export type ContextMode = "papers" | "cases" | "both"
