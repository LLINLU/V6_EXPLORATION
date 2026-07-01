import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import {
	corsHeaders,
	getNodeAnalysisData,
	jsonResponse,
	saveNodeAnalysis,
} from "../_shared/node-analysis.ts"
import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

const DATA_KEY = "analyze_trl" as const

/* ------------------------------------------------------------------ */
/*  Row types (matching actual DB schemas)                             */
/* ------------------------------------------------------------------ */

type TreeNodeRow = {
	id: string
	tree_id: string | null
	parent_id: string | null
	name: string
	description: string | null
	axis: string
	level: number
	node_order: number | null
	children_count: number | null
}

type TechnicalStrengthRow = {
	strength_name: string
	description: string
	potential_applications: string
	ordinal?: number | null
}

// Matches public.node_papers
type NodePaperRow = {
	id: string
	node_id: string
	tree_id: string
	title: string
	authors: string
	journal: string
	tags: unknown // jsonb
	abstract: string
	date: string | null
	citations: number
	region: string
	doi: string | null
	url: string | null
	score: number | null
}

// Matches public.node_patents
type NodePatentRow = {
	id: string
	node_id: string
	family_id: string
	title: string
	abstract: string | null
	earliest_priority_date: string | null
	countries: unknown // json
	ipc_prefixes: unknown // json
	ipc_subclasses: unknown // json
	cpc: unknown // json
	similarity_score: number | null
	assignee: unknown // jsonb
	inventor: unknown // jsonb
}

// Matches public.node_use_cases
type NodeUseCaseRow = {
	id: string
	node_id: string
	tree_id: string
	description: string
	product: string
	company: string[] | null
	press_releases: string[] | null
	year: number | null
}

/* ------------------------------------------------------------------ */
/*  Infra helpers                                                      */
/* ------------------------------------------------------------------ */

function getSearchApiHeaders(): Record<string, string> {
	return {
		"Content-Type": "application/json",
		"User-Agent": "memory-ai-app/1.0",
		Authorization: makeBasicAuthHeader(),
	}
}

function getSupabaseAdminClient() {
	const supabaseUrl = Deno.env.get("SUPABASE_URL")
	const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

	if (!supabaseUrl || !supabaseServiceRoleKey) {
		throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
	}

	return createClient(supabaseUrl, supabaseServiceRoleKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	})
}

/* ------------------------------------------------------------------ */
/*  Casting helpers                                                    */
/* ------------------------------------------------------------------ */

function asString(value: unknown, fallback = ""): string {
	return typeof value === "string" ? value : fallback
}

function asArray<T = unknown>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : []
}

function compactText(
	value: string | null | undefined,
	maxLength: number,
): string {
	const text = value ?? ""
	if (text.length <= maxLength) return text
	return `${text.slice(0, maxLength)}...`
}

/* ------------------------------------------------------------------ */
/*  Payload builders                                                   */
/*  Build the full API payload shape from DB rows + defaults           */
/* ------------------------------------------------------------------ */

function buildScenario(node: TreeNodeRow, strengths: TechnicalStrengthRow[]) {
	return {
		scenario_name: node.name,
		scenario_description: compactText(node.description, 1500),
		tech_strength: strengths.map((item) => ({
			strength_name: item.strength_name,
			description: compactText(item.description, 1000),
			potential_applications: compactText(item.potential_applications, 1000),
		})),
		application_target: "",
		customer_target: [],
		quantitative_notes: "",
	}
}

function buildTechnologies(nodes: TreeNodeRow[]) {
	return nodes
		.sort((a, b) => (a.node_order ?? 0) - (b.node_order ?? 0))
		.map((node) => ({
			tech_name: node.name,
			tech_definition: compactText(node.description, 1000),
		}))
}

function buildArticles(rows: NodePaperRow[]) {
	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		authors: row.authors,
		journal: row.journal,
		tags: asArray<string>(row.tags),
		abstract: compactText(row.abstract, 2500),
		date: row.date ?? "",
		citations: row.citations ?? 0,
		region: row.region,
		doi: row.doi ?? "",
		url: row.url ?? "",
		score: row.score ?? 0,
		// Fields not in DB — filled with defaults for the API
		referenced_works: [],
		fwci: "",
		type: "",
		publisher: "",
		cited_counts_by_year: {},
		openalex_link: "",
		openalex_id: 0,
		paper_id: "",
		queries: [],
		query_hits: [],
	}))
}

function buildPatents(rows: NodePatentRow[]) {
	return rows.map((row) => ({
		family_id: row.family_id,
		title: row.title,
		abstract: compactText(row.abstract, 2500),
		earliest_priority_date: row.earliest_priority_date ?? "",
		countries: asArray<string>(row.countries),
		ipc_prefixes: asArray<string>(row.ipc_prefixes),
		ipc_subclasses: asArray<string>(row.ipc_subclasses),
		cpc: asArray<string>(row.cpc),
		similarity_score: row.similarity_score ?? 0,
		assignee: asArray<Record<string, unknown>>(row.assignee),
		inventor: asArray<Record<string, unknown>>(row.inventor),
		// Fields not in DB — filled with defaults for the API
		ipc_prefix: "",
		section: "",
		section_id: 0,
		title_language: "",
		abstract_language: "",
		claims: "",
		claims_language: "",
		description: "",
		description_language: "",
		ipc: [],
		publications: [],
		distance: 0,
		keyword_match_count: 0,
		queries: [],
		query_hits: [],
	}))
}

function buildMarkets(rows: NodeUseCaseRow[]) {
	return rows.map((row) => ({
		id: row.id,
		product: row.product,
		company: row.company ?? [],
		description: compactText(row.description, 2500),
		press_releases: row.press_releases ?? [],
		year: row.year ?? 0,
		// Fields not in DB — filled with defaults for the API
		stage: "commercial",
		queries: [],
		query_hits: [],
	}))
}

/* ------------------------------------------------------------------ */
/*  DB fetch helpers                                                   */
/* ------------------------------------------------------------------ */

async function fetchScenarioSubtreeTechnologyNodes(
	supabase: any,
	treeId: string,
	scenarioId: string,
): Promise<TreeNodeRow[]> {
	const { data: allNodes, error } = await supabase
		.from("tree_nodes")
		.select(
			"id, tree_id, parent_id, name, description, axis, level, node_order, children_count",
		)
		.eq("tree_id", treeId)
		.in("level", [2, 3, 4])
		.order("node_order", { ascending: true })

	if (error) {
		throw new Error(`Failed to load subtree nodes: ${error.message}`)
	}

	const nodes = (allNodes ?? []) as TreeNodeRow[]

	const level2Ids = new Set(
		nodes
			.filter((n) => n.level === 2 && n.parent_id === scenarioId)
			.map((n) => n.id),
	)

	const level3Ids = new Set(
		nodes
			.filter((n) => n.level === 3 && n.parent_id && level2Ids.has(n.parent_id))
			.map((n) => n.id),
	)

	return nodes.filter(
		(n) => n.level === 4 && n.parent_id && level3Ids.has(n.parent_id),
	)
}

/* ------------------------------------------------------------------ */
/*  Main payload builder                                               */
/* ------------------------------------------------------------------ */

async function buildAnalyzeTrlPayload(
	supabase: any,
	nodeId: string,
	treeId: string,
	language = "Japanese",
) {
	const { data: node, error: nodeError } = await supabase
		.from("tree_nodes")
		.select(
			"id, tree_id, parent_id, name, description, axis, level, node_order, children_count",
		)
		.eq("id", nodeId)
		.single()

	if (nodeError || !node) {
		throw new Error(
			`Failed to load tree node: ${nodeError?.message ?? "not found"}`,
		)
	}

	const scenarioNode = node as TreeNodeRow

	if (scenarioNode.level !== 1) {
		throw new Error("scenario-analyze-trl expects a level 1 scenario node")
	}

	// Fetch search_theme from the tree as user_query
	const { data: treeRow } = await supabase
		.from("technology_trees")
		.select("search_theme")
		.eq("id", treeId)
		.single()

	const userQuery = asString(
		(treeRow as Record<string, unknown> | null)?.search_theme,
	)

	const [
		strengthsResult,
		papersResult,
		patentsResult,
		useCasesResult,
		technologyNodes,
	] = await Promise.all([
		supabase
			.from("technical_strengths")
			.select("strength_name, description, potential_applications, ordinal")
			.eq("tree_id", treeId)
			.order("ordinal", { ascending: true }),

		// Only select columns that exist in public.node_papers
		supabase
			.from("node_papers")
			.select(
				"id, node_id, tree_id, title, authors, journal, tags, abstract, date, citations, region, doi, url, score",
			)
			.eq("node_id", nodeId),

		// Only select columns that exist in public.node_patents
		supabase
			.from("node_patents")
			.select(
				"id, node_id, family_id, title, abstract, earliest_priority_date, countries, ipc_prefixes, ipc_subclasses, cpc, similarity_score, assignee, inventor",
			)
			.eq("node_id", nodeId),

		// Only select columns that exist in public.node_use_cases
		supabase
			.from("node_use_cases")
			.select(
				"id, node_id, tree_id, description, product, company, press_releases, year",
			)
			.eq("node_id", nodeId),

		fetchScenarioSubtreeTechnologyNodes(supabase, treeId, nodeId),
	])

	if (strengthsResult.error) {
		throw new Error(
			`Failed to load technical_strengths: ${strengthsResult.error.message}`,
		)
	}
	if (papersResult.error) {
		throw new Error(`Failed to load node_papers: ${papersResult.error.message}`)
	}
	if (patentsResult.error) {
		throw new Error(
			`Failed to load node_patents: ${patentsResult.error.message}`,
		)
	}
	if (useCasesResult.error) {
		throw new Error(
			`Failed to load node_use_cases: ${useCasesResult.error.message}`,
		)
	}

	const MAX_ITEMS = 10

	const papers = ((papersResult.data ?? []) as NodePaperRow[]).slice(
		0,
		MAX_ITEMS,
	)
	const patents = ((patentsResult.data ?? []) as NodePatentRow[]).slice(
		0,
		MAX_ITEMS,
	)
	const useCases = ((useCasesResult.data ?? []) as NodeUseCaseRow[]).slice(
		0,
		MAX_ITEMS,
	)

	console.log(
		`[scenario-analyze-trl] nodeId=${nodeId} treeId=${treeId} | ` +
			`articles=${papers.length} patents=${patents.length} markets=${useCases.length} ` +
			`technologies=${technologyNodes.length} strengths=${(strengthsResult.data ?? []).length}`,
	)

	// Require both papers and patents to proceed
	if (papers.length === 0 || patents.length === 0) {
		console.warn(
			`[scenario-analyze-trl] SKIPPED nodeId=${nodeId} — articles=${papers.length} patents=${patents.length} (both must be > 0)`,
		)
		// Return a retriable sentinel instead of throwing — enrichment may still be in flight
		return null
	}

	const payload = {
		user_query: userQuery,
		scenario: buildScenario(
			scenarioNode,
			(strengthsResult.data ?? []) as TechnicalStrengthRow[],
		),
		technologies: buildTechnologies(technologyNodes),
		articles: buildArticles(papers),
		patents: buildPatents(patents),
		markets: buildMarkets(useCases),
		language,
	}

	console.log(
		`[scenario-analyze-trl] Payload ready for nodeId=${nodeId} | ` +
			`user_query="${userQuery}" scenario="${scenarioNode.name}" ` +
			`articles=${payload.articles.length} patents=${payload.patents.length} ` +
			`markets=${payload.markets.length} technologies=${payload.technologies.length}`,
	)

	return payload
}

/* ------------------------------------------------------------------ */
/*  SSE caller                                                         */
/* ------------------------------------------------------------------ */

async function callAnalyzeTrlSSE(
	payload: unknown,
): Promise<Record<string, unknown>> {
	const baseUrl = getSearchApiBaseUrl("stg")
	const headers = getSearchApiHeaders()
	const body = JSON.stringify(payload)
	console.log(
		`[scenario-analyze-trl] Sending /v5/analyze_trl payload_bytes=${body.length}`,
	)

	const response = await fetch(`${baseUrl}/v5/analyze_trl`, {
		method: "POST",
		headers,
		body,
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => "")
		throw new Error(
			`Search API /v5/analyze_trl failed (${response.status}): ${errorText.slice(0, 500)}`,
		)
	}

	if (!response.body) {
		throw new Error("Search API returned no body")
	}

	const reader = response.body.getReader()
	const decoder = new TextDecoder()
	let buffer = ""
	let finalResult: Record<string, unknown> | null = null
	let lastProgress: Record<string, unknown> | null = null

	const processLine = (line: string) => {
		const trimmed = line.trim()
		if (!trimmed.startsWith("data: ")) return

		const jsonStr = trimmed.slice(6)
		try {
			const event = JSON.parse(jsonStr)
			if (event.type === "result" && event.data) {
				finalResult = event.data as Record<string, unknown>
			} else if (event.type === "progress") {
				lastProgress = event as Record<string, unknown>
			}
		} catch {
			// ignore malformed SSE lines
		}
	}

	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			buffer += decoder.decode(value, { stream: true })
			const lines = buffer.split("\n")
			buffer = lines.pop() ?? ""

			for (const line of lines) {
				processLine(line)
			}
		}

		if (buffer.trim()) {
			processLine(buffer)
		}
	} finally {
		reader.releaseLock()
	}

	if (!finalResult) {
		throw new Error(
			`No result event received from analyze_trl SSE stream${
				lastProgress
					? ` (last progress: ${JSON.stringify(lastProgress).slice(0, 200)})`
					: ""
			}`,
		)
	}

	return finalResult
}

/* ------------------------------------------------------------------ */
/*  HTTP handler                                                       */
/* ------------------------------------------------------------------ */

Deno.serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders })
	}

	if (req.method !== "POST") {
		return jsonResponse({ error: "Method not allowed" }, 405)
	}

	try {
		const body = await req.json()
		const bodyObj =
			body && typeof body === "object" ? (body as Record<string, unknown>) : {}

		// Only accept node_id and tree_id
		const nodeId =
			typeof bodyObj.nodeId === "string"
				? bodyObj.nodeId
				: typeof bodyObj.node_id === "string"
					? bodyObj.node_id
					: null

		const treeId =
			typeof bodyObj.treeId === "string"
				? bodyObj.treeId
				: typeof bodyObj.tree_id === "string"
					? bodyObj.tree_id
					: null

		const language =
			typeof bodyObj.language === "string" ? bodyObj.language : "Japanese"

		if (!nodeId) {
			return jsonResponse({ error: "node_id is required" }, 400)
		}

		if (!treeId) {
			return jsonResponse({ error: "tree_id is required" }, 400)
		}

		// Return cached result if it already exists
		const existingData = await getNodeAnalysisData(nodeId)
		const existingTrl = existingData?.[DATA_KEY] as
			| Record<string, unknown>
			| undefined

		if (
			existingTrl &&
			typeof existingTrl === "object" &&
			Object.keys(existingTrl).length > 0 &&
			existingTrl.status !== "not_available"
		) {
			return jsonResponse({
				node_id: nodeId,
				tree_id: treeId,
				status: "already_exists",
				[DATA_KEY]: existingTrl,
			})
		}

		// Build payload from DB (will throw if no papers AND no patents)
		const supabase = getSupabaseAdminClient()
		const searchPayload = await buildAnalyzeTrlPayload(
			supabase,
			nodeId,
			treeId,
			language,
		)

		// Papers or patents not ready yet — tell the client to retry later
		if (!searchPayload) {
			return jsonResponse({
				node_id: nodeId,
				tree_id: treeId,
				status: "data_not_ready",
			})
		}

		// Call search API synchronously and wait for result
		console.log(
			`[scenario-analyze-trl] Calling /v5/analyze_trl for nodeId=${nodeId}...`,
		)
		const result = await callAnalyzeTrlSSE(searchPayload)
		console.log(
			`[scenario-analyze-trl] Result received for nodeId=${nodeId} — keys: ${Object.keys(result).join(", ")}`,
		)

		// Save result
		await saveNodeAnalysis(nodeId, DATA_KEY, result)

		return jsonResponse({
			node_id: nodeId,
			tree_id: treeId,
			status: "completed",
			[DATA_KEY]: result,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unexpected error"
		console.error("[scenario-analyze-trl] error:", message)
		return jsonResponse({ error: message }, 500)
	}
})
