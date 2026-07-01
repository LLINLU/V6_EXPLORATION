/**
 * Frontend Report Display Types
 *
 * These types represent transformed data for UI rendering.
 * Raw API response types (Api* prefixed) are co-located below the frontend types.
 *
 * Mapping: Python API → reportTransformService → these types → UI components
 */

import type { ApiArticle, ApiMarket, ApiPatent } from "./sourcePool"
import type {
	ApiBaseDerivationOutput,
	ApiBaseTableOutput,
	ApiScenario,
} from "./tree"

// ── KPI ──────────────────────────────────────────────
export interface KpiItem {
	label: string
	value: string
	path?: string
	pathLabel?: string
}

// ── Executive Summary ────────────────────────────────
export interface SummaryRow {
	index: number
	label: string
	value: string
	path?: string
	pathLabel?: string
}

/** Derived from TRL + Market + search results (no direct Python equivalent) */
export interface ExecutiveSummaryData {
	narrative: string
	findings: string[]
	marketRows: SummaryRow[]
	researchRows: SummaryRow[]
}

// ── TRL Analysis ─────────────────────────────────────
// Derived from: ApiTRLAnalysisResult, ApiTechnologyWithFeasibility, ApiSourceTRLAssessment

export interface SourceRef {
	title: string
	url?: string
}

/**
 * Frontend view of ApiSourceTRLAssessment.
 * Python: source, trl_score, reasoning, item_count, item_ids
 */
export interface SourceDetail {
	source: "article" | "patent" | "market"
	trl_score: number | null
	reasoning: string
	item_count?: number
	item_ids?: string[]
	bestSourceRefs: SourceRef[]
}

/**
 * Frontend view of ApiTechnologyWithFeasibility.
 * Python field mapping:
 *   classification → category
 *   feasibility_assessment → assessment
 *   integrated_reasoning → integratedReasoning
 *   source_assessments → sourceDetails
 */
export interface TechnologyScore {
	technology_name: string
	category: "bottleneck" | "feasible"
	integrated_trl: number
	article_trl: number | null
	patent_trl: number | null
	market_trl: number | null
	assessment: string
	integratedReasoning: string
	sourceDetails: SourceDetail[]
}

export interface TrlReportSection {
	heading: string
	technologies: { name: string; content: string }[]
	summary?: string
}

export interface TrlDerivation {
	technology_name: string
	integrated_trl: number
	article_trl: number | null
	patent_trl: number | null
	market_trl: number | null
}

export interface TrlData {
	reportSections: TrlReportSection[]
	scores: TechnologyScore[]
	derivations: TrlDerivation[]
}

// ── Market Analysis ──────────────────────────────────
// Derived from: ApiMarketAnalysisData, ApiSegmentEstimation, ApiTAMData, ApiSAMData

/**
 * Frontend view of ApiSegmentEstimation.
 * Python: estimated_size is float; here it's formatted as string for display.
 * Python fields not included: unit, reasoning (available in raw API data).
 */
export interface MarketSegment {
	segment_name: string
	share_percent: number
	estimated_size: string
	description?: string
	unit?: string
	reasoning?: string
}

export interface MarketDerivation {
	tam_source_url?: string
	tam_source_name?: string
	sam_formula?: string
	sam_description?: string
	reference_sources: { url: string; label: string }[]
}

export interface JapanMarketData {
	tamValue: string
	samValue: string
	cagr: string
	marketName: string
	sourceUrl?: string
	derivation?: MarketDerivation
}

export interface MarketValueDescription {
	value: string
	description: string
	sourceUrl?: string
}

/**
 * Frontend view of ApiMarketAnalysisData.
 * Flattened from tam/sam sub-objects for UI convenience.
 */
export interface MarketAnalysisData {
	japanMarket?: JapanMarketData
	globalTam: MarketValueDescription
	globalSam: MarketValueDescription
	globalCagr: MarketValueDescription
	tamNumber: number
	samNumber: number
	segments: MarketSegment[]
	derivation: MarketDerivation
	rawSummary?: string
	targetYear?: number
	targetRegion?: string
}

// ── Research Landscape ───────────────────────────────
// Derived from article/patent search results (no direct Python analysis schema)

export interface YearlyCount {
	year: number
	count: number
}

export interface JournalEntry {
	name: string
	count: number
}

export interface ResearchLandscapeData {
	articleCommentary: string
	articleYearlyData: YearlyCount[]
	patentCommentary: string
	patentYearlyData: YearlyCount[]
	topJournals: JournalEntry[]
}

// ── Market Implementations ───────────────────────────
// Derived from ApiMarket source data

export interface MarketImpl {
	product: string
	company: string
	stage: "commercial" | "rnd"
	description: string
	press_releases?: string[]
	urls?: string[]
	year?: number
}

// ── Social Issues ────────────────────────────────────
// Derived from: ApiSocialIssueAnalysisResult, ApiSocialIssueSolution

/**
 * Frontend view of ApiSocialIssueCitedSource.
 * Python: url, title, contribution
 */
export interface CitedSource {
	index: number
	url: string
	title?: string
	contribution?: string
}

/**
 * Frontend view of ApiSocialIssueSolution.
 * Python field mapping: issue_name → title, reason_annotated → text, cited_sources → sources
 */
export interface SocialIssueSolution {
	title: string
	text: string
	sources: CitedSource[]
}

// ── Technical Competitors ────────────────────────────
// Derived from: ApiTechnicalCompetitorResponse, ApiCompanyReport

/**
 * Frontend view of ApiCompanyReport.
 * Python has additional fields: recency_score, similarity_score, total_score,
 * market_strategy, technical_expertise, time_trend, scenario_positioning
 */
export interface CompetitorEntry {
	rank: number
	company_name: string
	country: string
	patent_count: number
	recency_score?: number
	similarity_score?: number
	total_score?: number
}

export interface TechnicalCompetitorData {
	technology_name: string
	technology_name_ja?: string
	unique_companies: number
	analyzed_companies: number
	competitors: CompetitorEntry[]
}

// ── Section State ────────────────────────────────────
export type SectionStatus = "idle" | "loading" | "done" | "error"

export interface ReportSectionState<T> {
	status: SectionStatus
	data: T | null
}

// ── Unified Report Data ──────────────────────────────
export interface ScenarioReportData {
	title: string
	subtitle: string
	kpiItems: KpiItem[]

	executiveSummary: ExecutiveSummaryData
	trl: TrlData
	market: MarketAnalysisData
	research: ResearchLandscapeData
	marketImplementations: MarketImpl[]
	socialIssues: {
		overallSummary: string
		solutions: SocialIssueSolution[]
		totalIssues: number
		totalReferences: number
	}
	technicalCompetitors: TechnicalCompetitorData[]
}

// ═══════════════════════════════════════════════════════════════════════════
// ARTIFACT SCHEMAS (schemas/v5/artifacts/)
// ═══════════════════════════════════════════════════════════════════════════

export type ApiArtifactType =
	| "graph_bar"
	| "graph_line"
	| "graph_pie"
	| "graph_hist"
	| "graph_scatter"
	| "graph_pareto"
	| "graph_heatmap"
	| "text"
	| "block"
	| "code_block"
	| "image"
	| "table"
	| "metric"

// ── artifacts/text.py ──

export interface ApiTextArtifact {
	artifact_name: string
	artifact_type: "text"
	text: string
}

// ── artifacts/table.py ──

export interface ApiTableArtifact {
	artifact_name: string
	artifact_type: "table"
	headers: string[]
	rows: (string | number | null)[][]
}

// ── artifacts/metric.py ──

export interface ApiMetricArtifact {
	artifact_name: string
	artifact_type: "metric"
	value: string
	label: string
	unit?: string
	subtitle?: string
	delta?: string
	color?: string
}

// ── artifacts/block.py ──

export interface ApiBlockArtifact {
	artifact_name: string
	artifact_type: "block"
	children: ApiArtifact[]
}

// ── artifacts/code_block.py ──

export interface ApiCodeBlockArtifact {
	artifact_name: string
	artifact_type: "code_block"
	code: string
	language?: string
	style?: Record<string, string>
}

// ── artifacts/image.py ──

export interface ApiImageArtifact {
	artifact_name: string
	artifact_type: "image"
	url?: string | null
	base64_data?: string | null
	alt_text?: string
}

// ── artifacts/graph/ ──

export interface ApiGraphArtifact {
	artifact_name: string
	artifact_type:
		| "graph_bar"
		| "graph_line"
		| "graph_pie"
		| "graph_hist"
		| "graph_scatter"
		| "graph_pareto"
		| "graph_heatmap"
	data: Record<string, unknown[]>
	x_axis_label?: string
	y_axis_label?: string
	show_percentage?: boolean
}

/** Union of all artifact types */
export type ApiArtifact =
	| ApiTextArtifact
	| ApiTableArtifact
	| ApiMetricArtifact
	| ApiBlockArtifact
	| ApiCodeBlockArtifact
	| ApiImageArtifact
	| ApiGraphArtifact

// ── base/report_output.py ──

export interface ApiBaseReportOutput {
	scenario: ApiScenario
	column_name: string
	content: ApiArtifact[]
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS: TRL (schemas/v5/analysis/trl/)
// ═══════════════════════════════════════════════════════════════════════════

// ── trl/models.py ──

export interface ApiEnvironmentDefinition {
	target_environment: string
	required_components: string[]
	expected_conditions: string[]
	reasoning: string
}

export interface ApiSourceWithReason {
	source_id: string
	reason: string
}

export interface ApiSourceSelection {
	best_sources?: ApiSourceWithReason[]
	alternative_sources?: ApiSourceWithReason[]
}

export interface ApiTRLJudgmentResponse {
	trl_score?: number | null
	feasibility?: "feasible" | "bottleneck" | null
	reasoning?: string
}

export interface ApiSourceTRLJudgment {
	trl_score?: number | null
	feasibility?: "feasible" | "bottleneck" | null
	reasoning?: string
	best_source_ids?: string[]
	best_source_reasons?: string[]
	alternative_source_ids?: string[]
	alternative_source_reasons?: string[]
}

export interface ApiTechnologyTRLResult {
	tech_name: string
	tech_definition: string
	article_trl?: ApiSourceTRLJudgment | null
	patent_trl?: ApiSourceTRLJudgment | null
	market_trl?: ApiSourceTRLJudgment | null
}

export interface ApiSourceTRLAssessment {
	source: "article" | "patent" | "market"
	trl_score?: number | null
	reasoning?: string
	item_count?: number
	item_ids?: string[]
}

export interface ApiTechnologyWithFeasibility {
	tech_name: string
	tech_definition: string
	classification: "feasible" | "bottleneck"
	integrated_trl?: number | null
	integrated_reasoning?: string
	source_assessments?: ApiSourceTRLAssessment[]
	feasibility_assessment: string
}

export interface ApiFinalReport {
	tech_relationship_summary?: string
	technologies?: ApiTechnologyWithFeasibility[]
	final_summary?: string
}

export interface ApiTRLLevelDefinition {
	level: number
	description: string
}

export interface ApiEnvironmentMatchLevel {
	level: string
	description: string
}

export interface ApiTerminologyDefinitions {
	trl_levels: ApiTRLLevelDefinition[]
	trl_source: string
	trl_source_url: string
	trl_note: string
	environment_match_levels: ApiEnvironmentMatchLevel[]
	environment_match_note: string
	bottleneck_definition: string
}

export interface ApiTRLAnalysisResult {
	query: string
	environment_definition?: ApiEnvironmentDefinition | null
	terminology?: ApiTerminologyDefinitions | null
	technology_results?: ApiTechnologyTRLResult[]
	report?: ApiFinalReport
}

// ── trl/derivation.py ──

export interface ApiSourceTRLDerivationDetail {
	source: string
	trl_score?: number | null
	reasoning?: string
	item_count?: number
	best_source_ids?: string[]
	alternative_source_ids?: string[]
}

export interface ApiTechnologyTRLDerivation {
	tech_name: string
	integrated_trl?: number | null
	integrated_reasoning?: string
	source_derivations?: ApiSourceTRLDerivationDetail[]
}

export interface ApiTRLDerivationOutput extends ApiBaseDerivationOutput {
	column_name: "TRL"
	technology_derivations?: ApiTechnologyTRLDerivation[]
}

// ── trl/table.py ──

export interface ApiTRLTechnologyScore {
	technology: string
	trl_score?: number | null
	article_trl?: number | null
	patent_trl?: number | null
	market_trl?: number | null
	best_tech_name?: string
	classification?: string
}

export interface ApiTRLTableOutput extends ApiBaseTableOutput {
	column_name: "TRL"
	column_type: "integer"
	technology_scores?: ApiTRLTechnologyScore[]
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS: MARKET (schemas/v5/analysis/market/)
// ═══════════════════════════════════════════════════════════════════════════

// ── market/models.py ──

export interface ApiSegmentEstimation {
	segment_name: string
	description: string
	share_percent: number
	estimated_size: number
	unit: string
	reasoning: string
}

export interface ApiMarketProjection {
	base_year: number
	base_value: number
	tam_year: number
	tam_value: number
	cagr_percent: number
	projections: Record<number, number>
	unit: string
}

export interface ApiMarketAnalysisResult {
	query: string
	scenario: string
	target_year: number
	target_region: string
	tam: ApiMarketCAGRAnalysisResult
	sam: ApiEstimationResult
	segments?: ApiSegmentEstimation[]
	projection?: ApiMarketProjection | null
}

// ── market/data.py ──

export interface ApiTAMData {
	market_name: string
	market_definition: string
	market_size: string
	value?: number | null
	year: number
	cagr: string
	cagr_start_year: number
	cagr_end_year: number
	source_url: string
	region: string
}

export interface ApiSAMVariableSummary {
	name: string
	value: string
	value_numeric?: number | null
	unit?: string
	source?: string
	source_url?: string
	confidence?: number
	source_type?: string
}

export interface ApiSAMData {
	success: boolean
	value?: number | null
	formatted?: string
	unit?: string
	equation_template?: string
	selected_variables?: string[]
	unit_analysis?: string
	calculation_steps?: string[]
	variables?: ApiSAMVariableSummary[]
	elapsed_time?: number
	search_count?: number
	error_message?: string | null
}

/** Top-level data payload for /analyze_market response */
export interface ApiMarketAnalysisData {
	query: string
	scenario: string
	target_year: number
	target_region: string
	tam: ApiTAMData
	sam: ApiSAMData
	segments?: ApiSegmentEstimation[]
	projection?: ApiMarketProjection | null
	summary?: string
}

// ── market/size_models.py ──

export type ApiSourceTag = "realdata" | "llm_estimation"

export type ApiVariableType = "count" | "rate" | "price" | "frequency" | "ratio"

export interface ApiVariableCandidate {
	name: string
	query: string
	variable_type?: ApiVariableType | null
	expected_unit?: string
	definition?: string
}

export interface ApiDiscoveredVariable {
	name: string
	value: string
	value_numeric?: number | null
	unit?: string
	unit_tag?: string
	region?: string
	source?: string
	source_url?: string
	confidence?: number
	source_type?: ApiSourceTag
	llm_reasoning?: string
	intended_definition?: string
	definition?: string
	note?: string
}

export interface ApiEquationStructure {
	selected_variables: string[]
	equation_template: string
	unit_analysis?: string
	reasoning?: string
	llm_estimated_variables?: ApiDiscoveredVariable[]
}

export interface ApiExecutionResult {
	value: number
	unit: string
	formatted: string
	calculation_steps?: string[]
}

export interface ApiVerificationResult {
	is_valid: boolean
	expected_unit?: string
	actual_unit?: string
	message?: string
	retry_hint?: string
}

export interface ApiEstimationResult {
	success: boolean
	problem: string
	candidates?: ApiVariableCandidate[]
	discovered_variables?: ApiDiscoveredVariable[]
	equation?: ApiEquationStructure | null
	result?: ApiExecutionResult | null
	elapsed_time?: number
	search_count?: number
	error_message?: string | null
}

export interface ApiEstimationContext {
	problem: string
	scenario?: string
	candidates?: ApiVariableCandidate[]
	discovered_variables?: ApiDiscoveredVariable[]
	synthesis_variables?: ApiDiscoveredVariable[]
	equation_hint?: string
	tam_context?: string
}

// ── market/cagr_models.py ──

export interface ApiMarketCAGRInput {
	query: string
	scenario: string
	context?: string | null
	year: number
	country?: string
}

export interface ApiMarketIdentification {
	market_name: string
	market_definition: string
	reasoning: string
	search_queries: string[]
}

export interface ApiSourceAnnotation {
	url: string
	title?: string
}

export interface ApiMarketSearchResult {
	market_name: string
	market_definition: string
	source_url: string
	source_raw_text: string
	year: number
	market_size_tam: string
	cagr: string
	cagr_start_year: number
	cagr_end_year: number
	annotations: ApiSourceAnnotation[]
}

export interface ApiMarketValidationResult {
	is_valid: boolean
	source_reliability_score: number
	cagr_consistency_score: number
	failure_reason?: string | null
	improvement_suggestions?: string | null
}

export interface ApiFailureRecord {
	attempt_number: number
	market_name: string
	failure_reason: string
	improvement_suggestions: string
}

export interface ApiRetryContext {
	attempt?: number
	previous_failures?: ApiFailureRecord[]
}

export interface ApiMarketCAGROutput {
	market_name: string
	market_definition: string
	country: string
	source_url: string
	source_raw_text: string
	year: number
	market_size_tam: string
	cagr: string
	cagr_start_year: number
	cagr_end_year: number
}

export interface ApiMarketCAGRAnalysisResult {
	output: ApiMarketCAGROutput
	identification?: ApiMarketIdentification | null
	search_result?: ApiMarketSearchResult | null
	validation?: ApiMarketValidationResult | null
	retry_context?: ApiRetryContext | null
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS: SOCIAL ISSUE (schemas/v5/analysis/social_issue/)
// ═══════════════════════════════════════════════════════════════════════════

// ── social_issue/models.py ──

export interface ApiSocialIssueCitedSource {
	url: string
	title?: string
	contribution?: string
}

export interface ApiSocialIssueSolution {
	issue_name: string
	reason_annotated: string
	cited_sources: ApiSocialIssueCitedSource[]
}

export interface ApiSocialIssueAnalysisResult {
	solutions: ApiSocialIssueSolution[]
}

// ── social_issue/derivation.py ──

export interface ApiSolutionDerivation {
	issue_name: string
	source_urls?: string[]
}

export interface ApiSocialIssueDerivationOutput
	extends ApiBaseDerivationOutput {
	column_name: "social_issue"
	solution_derivations?: ApiSolutionDerivation[]
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS: TECHNICAL COMPETITORS (schemas/v5/analysis/technical_competitors/)
// ═══════════════════════════════════════════════════════════════════════════

// ── technical_competitors/models.py ──

export interface ApiAssigneeStatistics {
	name: string
	name_harmonized?: string | null
	country_code?: string | null
	patent_count: number
}

export interface ApiCompanyStatistics {
	company_name: string
	country_code?: string | null
	patent_count: number
}

export interface ApiCompanyReport {
	company_name: string
	country_code?: string | null
	search_result_patent_count: number
	recency_score: number
	similarity_score: number
	total_score: number
	market_strategy: string
	technical_expertise: string
	time_trend: string
	scenario_positioning: string
}

export interface ApiTechnicalCompetitorResponse {
	technology_name: string
	total_unique_companies: number
	analyzed_companies: number
	reports: ApiCompanyReport[]
}

// ── technical_competitors/derivation.py ──

export interface ApiCompanyReportDerivation {
	company_name: string
	country_code?: string | null
	recency_score?: number
	similarity_score?: number
	total_score?: number
}

export interface ApiTechnicalCompetitorsDerivationOutput
	extends ApiBaseDerivationOutput {
	column_name: "technical_competitors"
	total_unique_companies?: number
	analyzed_companies?: number
	company_derivations?: ApiCompanyReportDerivation[]
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS: CITATION (schemas/v5/analysis/citation/)
// ═══════════════════════════════════════════════════════════════════════════

// ── citation/models.py ──

export interface ApiCitationPaperData {
	paper_id: string
	title: string
	abstract: string
	authors?: string[]
	year?: string
	doi?: string | null
	url?: string | null
}

export interface ApiPaperMetadata {
	title: string
	authors: string[]
	year: number
	venue: string
	doi?: string | null
	url?: string | null
	type?: "study" | "review" | "meta" | "preprint"
}

export interface ApiPaperRaw {
	pdf_bytes_b64?: string | null
	text?: string | null
}

export interface ApiCitationPaper {
	paper_id: string
	metadata: ApiPaperMetadata
	raw: ApiPaperRaw
	abstract?: string | null
}

export interface ApiCitationInput {
	question: string
	papers: ApiCitationPaper[]
}

export interface ApiSentence {
	sent_id: string
	paper_id: string
	section: string
	page?: number | null
	para: number
	sent_no: number
	text: string
	neighbors?: string[]
	meta?: Record<string, unknown>
}

export interface ApiDirectionEvidence {
	direction: "+" | "0" | "-" | "conditional"
	sent_ids: string[]
	reason: string
	confidence: number
}

export interface ApiPositionCard {
	thesis: string
	stance_type: "support" | "null" | "counter" | "conditional" | "uncertain"
	scope_limits: string[]
	rationale_top_evidence: string[]
	alt_positions: string[]
	evidence_balance_score: number
}

export interface ApiEvidenceItem {
	sent_id: string
	text: string
	paper_id: string
	section?: string
	para?: number
	sent_no?: number
	weight: number
}

export interface ApiEvidencePack {
	question: string
	position_card: ApiPositionCard
	evidence: {
		support: ApiEvidenceItem[]
		counter: ApiEvidenceItem[]
	}
	policy: Record<string, unknown>
}

export interface ApiClaimEvidenceMap {
	claim_id: string
	claim_text?: string
	support: string[]
	counter: string[]
}

export interface ApiCitationReference {
	paper_id: string
	formatted: string
	used_sent_ids: string[]
}

export interface ApiVerificationReport {
	nli_pass_rate: number
	numeric_match_rate: number
	coverage_rate: number
	counter_evidence_rate: number
}

export interface ApiAuditData {
	claim_to_evidence_map: ApiClaimEvidenceMap[]
	verification_report: ApiVerificationReport
	processing_steps?: string[]
	intermediate_outputs?: Record<string, unknown>
}

export interface ApiCitationOutput {
	position_card: ApiPositionCard
	final_summary: string
	references: ApiCitationReference[]
	audit: ApiAuditData
}

export interface ApiSearchResult {
	sentence: ApiSentence
	paper_score: number
	sentence_score: number
	combined_score: number
	relevance_reason?: string | null
}

// ── citation/derivation.py ──

export interface ApiClaimDerivation {
	claim_id: string
	claim_text?: string
	support_sentence_ids?: string[]
	counter_sentence_ids?: string[]
}

export interface ApiCitationDerivationOutput extends ApiBaseDerivationOutput {
	column_name: "citation"
	nli_pass_rate?: number
	numeric_match_rate?: number
	coverage_rate?: number
	counter_evidence_rate?: number
	position_thesis?: string
	stance_type?: string
	claim_derivations?: ApiClaimDerivation[]
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS: CONFERENCE (schemas/v5/analysis/conference/)
// ═══════════════════════════════════════════════════════════════════════════

// ── conference/models.py ──

export interface ApiConference {
	canonical_name: string
	url?: string | null
	edition_year?: number | null
	location?: string | null
	start_date?: string | null
	end_date?: string | null
	submission_deadline?: string | null
	description?: string | null
	tags?: string[] | null
	source_authority?: string
	dedup_key?: string | null
	final_score?: number
	search_rank?: number
}

export interface ApiConferenceSearchResult {
	title: string
	url: string
	snippet: string
	search_engine: string
	rank: number
}

// ── conference/derivation.py ──

export interface ApiConferenceScoreDerivation {
	canonical_name: string
	url?: string
	final_score?: number
	search_rank?: number
	source_authority?: string
	tags?: string[]
}

export interface ApiConferenceDerivationOutput extends ApiBaseDerivationOutput {
	column_name: "conference"
	conference_count?: number
	search_results_count?: number
	conference_derivations?: ApiConferenceScoreDerivation[]
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS: CENTRAL RESEARCHER (schemas/v5/analysis/central_researcher/)
// ═══════════════════════════════════════════════════════════════════════════

// ── central_researcher/models.py ──

export type ApiAuthorPosition = "first" | "middle" | "last"

export interface ApiInputPaper {
	doi?: string | null
	openalex_id?: string | null
	pmid?: string | null
	title?: string | null
}

export interface ApiAuthorship {
	author_id?: string | null
	orcid?: string | null
	raw_name?: string
	author_position?: ApiAuthorPosition | null
	is_corresponding?: boolean
	institution_ids?: string[]
}

export interface ApiTopic {
	topic_id: string
	display_name?: string
	score?: number
}

export interface ApiWorkRaw {
	work_id: string
	doi?: string | null
	title?: string
	year?: number | null
	cited_by_count?: number
	referenced_work_ids?: string[]
	authorships?: ApiAuthorship[]
	topics?: ApiTopic[]
	primary_topic?: ApiTopic | null
	is_authors_truncated?: boolean
}

export interface ApiSummaryStats {
	h_index?: number | null
	i10_index?: number | null
	two_yr_mean_citedness?: number | null
}

export interface ApiInstitutionMaster {
	institution_id: string
	display_name?: string
	country_code?: string | null
	type?: string | null
	ror?: string | null
	homepage_url?: string | null
	works_count?: number
}

export interface ApiAuthorMaster {
	author_id: string
	display_name?: string
	orcid?: string | null
	summary_stats?: ApiSummaryStats | null
	works_count?: number
	last_known_institution_ids?: string[]
}

export interface ApiGraphEdge {
	src_author_id: string
	dst_author_id: string
	w_freq?: number
	w_recency?: number
	w_role?: number
	w_total?: number
}

export interface ApiAuthorFeatures {
	author_id: string
	n_in_corpus_works?: number
	leadership_rate?: number
	deg_w?: number
	pagerank?: number
	betweenness?: number
	kcore?: number
	h_index_global?: number | null
	h_index_local?: number
	h_index_local_inclusive?: number
	h_index_local_exclusive?: number
	i10_index_global?: number | null
	mean_2yr_citedness?: number | null
	centrality_score?: number
	citation_score?: number
	leadership_score?: number
	crs_raw?: number
	crs_final?: number
}

export interface ApiResearcherRanking {
	rank: number
	author_display_name: string
	author_id: string
	orcid?: string | null
	crs_final?: number
	crs_raw?: number
	centrality_deg?: number
	centrality_pagerank?: number
	centrality_betweenness?: number
	h_index_global?: number | null
	h_index_local?: number
	h_index_local_inclusive?: number
	h_index_local_exclusive?: number
	leadership_rate?: number
	n_in_corpus_works?: number
}

export interface ApiLocalCitations {
	work_citations?: Record<string, number>
}

export interface ApiEdgeContribution {
	collaborator_id: string
	collaborator_name: string
	edge_weight: number
	shared_papers_count: number
	collaboration_strength: "weak" | "moderate" | "strong"
	contribution_to_centrality: number
	top_shared_papers: string[]
}

export interface ApiPaperContribution {
	work_id: string
	title: string
	year?: number | null
	author_role: "first" | "middle" | "last" | "corresponding"
	coauthor_count: number
	time_decay_factor: number
	topic_similarity_score: number
	consortium_factor: number
	alphabetical_detected: boolean
	contribution_to_leadership: number
	contribution_to_centrality: number
	total_contribution: number
}

export interface ApiCRSDecomposition {
	author_id: string
	author_name: string
	crs_final: number
	crs_raw: number
	centrality_score: number
	citation_score: number
	leadership_score: number
	pagerank_contribution: number
	degree_contribution: number
	betweenness_contribution: number
	h_global_contribution: number
	h_local_contribution: number
	leadership_rate_contribution: number
	kcore_contribution: number
	sample_size_factor: number
}

export interface ApiNetworkBuilderConfig {
	decay_lambda?: number
	first_last_bonus?: number
	corr_author_bonus?: number
	current_year?: number | null
	topic_similarity_enabled?: boolean
	topic_similarity_threshold?: number
	consortium_suppression_enabled?: boolean
	consortium_threshold?: number
	alphabetical_detection_enabled?: boolean
	alphabetical_threshold?: number
	simmelian_strengthening_enabled?: boolean
}

// ── central_researcher/derivation.py ──

export interface ApiResearcherScoreDerivation {
	author_name: string
	crs_final?: number
	centrality_score?: number
	citation_score?: number
	leadership_score?: number
	pagerank?: number
	degree?: number
	betweenness?: number
}

export interface ApiCentralResearcherDerivationOutput
	extends ApiBaseDerivationOutput {
	column_name: "central_researcher"
	researcher_count?: number
	corpus_paper_count?: number
	researcher_derivations?: ApiResearcherScoreDerivation[]
}

// ── Report DB Records (scenario_reports / scenario_report_sections tables) ──

export type ReportStatus =
	| "pending"
	| "searching"
	| "search_done"
	| "analyzing"
	| "done"
	| "error"
export type SectionProcessStatus = "pending" | "running" | "done" | "error"

export interface ReportGenerationRequest {
	scenarioId: string
	treeId: string
	scenarioName: string
	scenarioDescription?: string
	userQuery: string
	userContext?: string
	technologies?: { tech_name: string; tech_definition: string }[]
	team_id?: string | null
	user_id?: string | null
}

export interface ReportRecord {
	id: string
	scenario_id: string
	tree_id: string
	scenario_name: string
	status: ReportStatus
	error_message: string | null
	search_status: string
	articles: ApiArticle[]
	patents: ApiPatent[]
	markets: ApiMarket[]
	created_at: string
	updated_at: string
}

export interface ReportSectionRecord {
	id: string
	report_id: string
	section_type: string
	status: SectionProcessStatus
	error_message: string | null
	progress: number
	raw_data: unknown | null
	transformed_data: unknown | null
	created_at: string
	updated_at: string
}

export interface ReportStatusResponse {
	report: ReportRecord
	sections: ReportSectionRecord[]
}

// ── Report Section IDs (for outline navigation) ─────
export const REPORT_SECTION_IDS = [
	"executive-summary",
	"trl-analysis",
	"market-analysis",
	"research-landscape",
	"market-implementations",
	"social-issues",
	"technical-competitors",
] as const

export type ReportSectionId = (typeof REPORT_SECTION_IDS)[number]

export interface ReportSectionMeta {
	id: ReportSectionId
	number: number
	title: string
}

export const REPORT_SECTIONS: ReportSectionMeta[] = [
	{ id: "executive-summary", number: 1, title: "エグゼクティブサマリー" },
	{ id: "trl-analysis", number: 2, title: "TRL分析" },
	{ id: "market-analysis", number: 3, title: "市場分析" },
	{ id: "research-landscape", number: 4, title: "研究動向" },
	{ id: "market-implementations", number: 5, title: "市場実装事例" },
	{ id: "social-issues", number: 6, title: "社会課題" },
	{ id: "technical-competitors", number: 7, title: "技術競合" },
]
