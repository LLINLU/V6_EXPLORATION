export interface AcademicPaper {
	title: string
	authors: string[]
	year: number
	link: string
	abstract?: string
}

export interface Patent {
	year: number
	title: string
	link: string
}

export interface MarketImplementation {
	year: number
	name: string
	summary: string
	link: string
}

export interface QuantitativeData {
	papers: AcademicPaper[]
	patents: Patent[]
	implementations: MarketImplementation[]
	paperCount: number
	patentCount: number
	implementationCount: number
}

// ---------------------------------------------------------------------------
// Python API v5 source schemas (schemas/v5/source/)
// ---------------------------------------------------------------------------

import type { ApiQueryHit, ApiQueryTag } from "./tree"

// ── source/article.py ──

export interface ApiArticle {
	id: string
	title: string
	authors: string
	journal: string
	tags: string[]
	abstract: string
	date: string
	citations: number
	region: string
	referenced_works: string[]
	fwci?: string | null
	doi?: string | null
	url?: string | null
	score: number
	type?: string | null
	publisher?: string | null
	cited_counts_by_year?: Record<number, number>
	openalex_link?: string | null
	openalex_id?: number
	paper_id?: string
	queries?: ApiQueryTag[]
	query_hits?: ApiQueryHit[]
}

// ── source/patent.py ──

export interface ApiAssignee {
	name: string
	name_harmonized?: string | null
	country_code?: string | null
}

export interface ApiInventor {
	name: string
	name_harmonized?: string | null
	country_code?: string | null
}

export interface ApiPatent {
	family_id: string
	ipc_prefix?: string | null
	section?: string | null
	section_id?: number | null
	title?: string | null
	title_language?: string | null
	abstract?: string | null
	abstract_language?: string | null
	claims?: string | null
	claims_language?: string | null
	description?: string | null
	description_language?: string | null
	ipc_prefixes?: string[] | null
	ipc_subclasses?: string[] | null
	cpc?: string[] | null
	ipc?: string[] | null
	publications?: Record<string, unknown>[] | null
	countries?: string[] | null
	assignee?: ApiAssignee[] | null
	inventor?: ApiInventor[] | null
	earliest_priority_date?: string | null
	similarity_score?: number | null
	distance?: number | null
	keyword_match_count?: number | null
	queries?: ApiQueryTag[]
	query_hits?: ApiQueryHit[]
}

// ── source/market.py ──

export type ApiMarketStage = "commercial" | "rnd"

export interface ApiMarket {
	id: string
	product: string
	company: string[]
	description: string
	press_releases?: string[]
	stage?: ApiMarketStage
	queries?: ApiQueryTag[]
	query_hits?: ApiQueryHit[]
}
