// Theme Report — TypeScript types matching the 8-section schema.
// See the prompt spec in docs/ for content rules.

export interface ThemeReportSource {
	id?: string
	label: string
	url?: string
	type?: "memlab"
}

// ── S01 背景 ─────────────────────────────────────────
export interface ThemeKpi {
	value: string
	label: string
	color: string
}

export interface ThemePolicy {
	flag: string
	country: string
	text: string
}

export interface ThemeS01 {
	kpis: ThemeKpi[]
	body: string
	policies: ThemePolicy[]
	sources: ThemeReportSource[]
}

// ── S02 定義 ─────────────────────────────────────────
export interface ThemeAdvantage {
	title: string
	desc: string
}

export interface ThemeCustomerLink {
	label: string
	url: string
}

export interface ThemeCustomer {
	label: string
	title: string
	desc: string
	links: ThemeCustomerLink[]
}

export interface ThemeS02 {
	definition: string
	advantages: ThemeAdvantage[]
	customers: ThemeCustomer[]
	sources: ThemeReportSource[]
}

// ── S03 市場規模 ─────────────────────────────────────
export interface ThemeForecast {
	org: string
	orgUrl: string
	sub: string
	current: string
	future: string
	pctFill: number
	year: string
	cagr: string
	reportUrl: string
}

export interface ThemeSamFactorSource {
	name: string
	value: string
	note?: string
	url?: string
}

export interface ThemeSamFactor {
	id: number
	name: string
	value: string
	dataType: string
	sources: ThemeSamFactorSource[]
}

export interface ThemeS03 {
	tam: ThemeKpi
	tamCards: ThemeKpi[]
	forecasts: ThemeForecast[]
	sam: { value: string; label: string; note?: string }
	samRationale: string
	samFormula: string
	samFactors: ThemeSamFactor[]
	samCaveat?: string
	sources: ThemeReportSource[]
}

// ── S04 規制・制度 ───────────────────────────────────
export interface ThemeRegIssue {
	title: string
	category: string
	desc: string
	references: { label: string; url: string }[]
}

export interface ThemeS04 {
	intro: string
	issues: ThemeRegIssue[]
	sources: ThemeReportSource[]
}

// ── S05 現状アプローチ ───────────────────────────────
export interface ThemeApproach {
	title: string
	desc: string
}

export interface ThemeS05Issue {
	approach: string
	limitation: string
	barrierType: string
}

export interface ThemeS05 {
	approaches: ThemeApproach[]
	issues: ThemeS05Issue[]
	structuralBarriers: string
	sources: ThemeReportSource[]
}

// ── S06 技術の優位性 ─────────────────────────────────
export interface ThemeComparison {
	issue: string
	currentLimit: string
	solution: string
}

export interface ThemeS06 {
	intro: string
	comparison: ThemeComparison[]
	sources: ThemeReportSource[]
}

// ── S07 技術の成熟度 ─────────────────────────────────
export interface ThemeTrlDef {
	level: number
	title: string
	desc: string
}

export interface ThemePaper {
	year: string
	title: string
	authors: string
	journal: string
	doi: string
	summary: string
	url: string
}

export interface ThemeTechnology {
	name: string
	nameEn: string
	desc: string
	trlAvg: number
	trlSd: number
	trlDist: number[]
	reviewPapers: ThemePaper[]
	keyPapers: ThemePaper[]
	patents: ThemePaper[]
}

export interface ThemeS07 {
	intro: string
	technologies: ThemeTechnology[]
	sources: ThemeReportSource[]
}

// ── S08 プレイヤー分析 ───────────────────────────────
export interface ThemeTable {
	headers: string[]
	rows: string[][]
}

export interface ThemeS08 {
	competitors: ThemeTable
	collaborators: ThemeTable
	researchers: ThemeTable
	sources: ThemeReportSource[]
}

// ── Top-level ─────────────────────────────────────────
export interface ThemeReportData {
	theme: string
	scenario: string
	summary: string
	s01: ThemeS01
	s02: ThemeS02
	s03: ThemeS03
	s04: ThemeS04
	s05: ThemeS05
	s06: ThemeS06
	s07: ThemeS07
	s08: ThemeS08
}
