// Query Report — TypeScript types for RDE-424 7-section schema.
// Mirrors the prompt schema (s01 背景 → s07 公的支援) and is rendered by
// `src/components/scenario/report/query/QueryReportView.tsx`.

export interface QueryReportSource {
	label: string
	url?: string
	type?: "memlab"
}

// ── S01 要請背景 ─────────────────────────────────────
export interface QueryKpi {
	value: string
	label: string
	color?: string
}

export interface QueryPolicy {
	flag: string
	country: string
	text: string
	confidence?: "high" | "medium" | "low"
	sourceUrl?: string
}

export interface QueryS01 {
	kpis: QueryKpi[]
	body: string
	policies: QueryPolicy[]
	sources: QueryReportSource[]
}

// ── S02 定義・役割 ───────────────────────────────────
export interface QueryAdvantage {
	label: string
	title: string
	body: string
	sourceStrength?: string
}

export interface QueryS02 {
	definitionTitle: string
	definition: string
	advantages: QueryAdvantage[]
	sources: QueryReportSource[]
}

// ── S03 市場規模 ─────────────────────────────────────
export interface QueryTam {
	value: string
	label: string
	color?: string
	sourceOrg: string
	sourceUrl: string
	sourceYear: string
}

export interface QueryForecast {
	org: string
	orgUrl: string
	sub: string
	current: string
	future: string
	pctFill: number
	year: string
	cagr: string
	reportUrl: string
	currencyBasis?: string
	scope?: string
	scenario?: "base-case" | "optimistic" | "conservative"
	dataVintage?: string
	confidence?: "high" | "medium" | "low"
}

export interface QueryS03 {
	tam: QueryTam
	tamCards: QueryKpi[]
	forecasts: QueryForecast[]
	sources: QueryReportSource[]
}

// ── S04 技術史年表 ───────────────────────────────────
export interface QueryAnnualDataPoint {
	year: number
	papers: number
	papersDelta: string
	patents: number
	patentsDelta: string
	event: string
}

export interface QueryChartPhase {
	phase: number
	yearRange: string
	title: string
	desc: string
}

export interface QueryEvent {
	date: string
	title: string
	body: string
	confidence?: "high" | "medium" | "low"
}

export type QueryTableCell = string | { text: string; url: string }

export interface QueryPapersTable {
	headers: string[]
	rows: QueryTableCell[][]
}

export interface QueryTopAssignee {
	name: string
	country: string
	count: string
}

export interface QueryPatents {
	trendNote: string
	topAssignees: QueryTopAssignee[]
	dataSource: string
	confidence?: "high" | "medium" | "low"
}

export interface QueryS04 {
	intro: string
	searchKeywords: string[]
	body: string
	annualData: QueryAnnualDataPoint[]
	patentLagNote: string
	chartPhases: QueryChartPhase[]
	events: QueryEvent[]
	papersTable: QueryPapersTable
	patents: QueryPatents
	sources: QueryReportSource[]
}

// ── S05 技術構造 ─────────────────────────────────────
export interface QueryScopeExcluded {
	name: string
	reason: string
}

export interface QueryScopeDeclaration {
	broadDef: string
	narrowDef: string
	adoptedScope: string
	excluded: QueryScopeExcluded[]
}

export interface QuerySubprocess {
	name: string
	description: string
	isEssential: boolean
	keyVariables: string[]
}

export interface QuerySubprocesses {
	centralMechanism: string
	items: QuerySubprocess[]
	sufficiencyNote?: string
}

export interface QueryPrincipleAxis {
	axisId: string
	name: string
	nameEn: string
	linkedSubprocess: string
	values: string[]
	independenceNote: string
}

export type QueryClassification = "A" | "B" | "C" | "D" | "E"

export interface QueryPrincipleCombination {
	id: string
	axisValues: { axisId: string; value: string }[]
	methodName: string
	classification: QueryClassification
	classificationNote: string
	confidence?: "high" | "medium" | "low"
}

export interface QueryPrincipleMap {
	totalCombinations: number
	axesSummary: string
	combinations: QueryPrincipleCombination[]
}

export interface QueryTrlDef {
	level: number
	title: string
	desc: string
}

export interface QueryTechnology {
	name: string
	nameEn: string
	desc: string
	principleMapRef: string
	subcategoryCount: number
	trlAvg: number
	trlSd: number
	trlN: number
	trlDist: number[]
	trlVerdict: string
	trlColor: "green" | "amber" | "blue"
	confidence?: "high" | "medium" | "low"
	sourceNote?: string
}

export interface QueryS05 {
	scopeDeclaration: QueryScopeDeclaration
	subprocesses: QuerySubprocesses
	principleAxes: QueryPrincipleAxis[]
	principleMap: QueryPrincipleMap
	trlIntro: string
	trlDefs: QueryTrlDef[]
	technologies: QueryTechnology[]
	sources: QueryReportSource[]
}

// ── S06 課題 ─────────────────────────────────────────
export type QueryRiskType =
	| "tech"
	| "economic"
	| "regulatory"
	| "social"
	| "geopolitical"

export interface QueryChallenge {
	title: string
	riskType: QueryRiskType
	barrier: string
	body: string
	confidence?: "high" | "medium" | "low"
}

export interface QueryS06 {
	intro: string
	body: string
	challenges: QueryChallenge[]
	sources: QueryReportSource[]
}

// ── S07 公的支援 ─────────────────────────────────────
export type QuerySubsidyStatus = "募集中" | "終了" | "定期公募" | "要確認"

export interface QueryProgramTable {
	headers: string[]
	rows: QueryTableCell[][]
}

export interface QueryS07 {
	intro: string
	programTable: QueryProgramTable
	sources: QueryReportSource[]
}

// ── Top-level ────────────────────────────────────────
export interface QueryReportData {
	theme: string
	scenario: string
	summary: string
	s01: QueryS01
	s02: QueryS02
	s03: QueryS03
	s04: QueryS04
	s05: QueryS05
	s06: QueryS06
	s07: QueryS07
}
