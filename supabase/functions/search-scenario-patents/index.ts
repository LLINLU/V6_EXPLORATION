// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

interface NodeEnrichmentRequest {
	nodeId?: string
	node_id?: string
	treeId?: string
	tree_id?: string
	enrichNode?: string
	scenarioName?: string
	scenario_name?: string
	query: string
	parentNodes?: string[]
	team_id?: string | null
	treeType?: string
	language?: string
	flow_mode?: string
	include_desc?: boolean
}

const PATENT_RESULT_LIST_LIMIT = 200
const PATENT_SUMMARY_LIMIT = 10

/* =========================================
 * CORS helpers (inline)
 * ======================================= */ const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Max-Age": "86400",
}
function corsPreflightResponse() {
	return new Response("ok", {
		status: 200,
		headers: CORS_HEADERS,
	})
}
function jsonResponse(payload: any, status = 200) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			...CORS_HEADERS,
			"Content-Type": "application/json",
		},
	})
}
function jsonErrorResponse(message: string, status = 500) {
	return jsonResponse(
		{
			error: message,
		},
		status,
	)
}
/* =========================================
 * Logging
 * ======================================= */ function log(...args: any[]) {
	console.log("[search-patents]", ...args)
}
function logErr(...args: any[]) {
	console.error("[search-patents][ERROR]", ...args)
}
function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error)
}
function extractResponseText(response: any) {
	if (typeof response.output_text === "string") {
		return response.output_text
	}
	const text = response.output
		?.flatMap((item: any) => item.content ?? [])
		?.filter((content: any) => content.type === "output_text")
		?.map((content: any) => content.text)
		?.join("")
	return typeof text === "string" && text.length > 0 ? text : ""
}
/* =========================================
 * Errors
 * ======================================= */ class SearchAPIError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "SearchAPIError"
	}
}
/* =========================================
 * Supabase client (singleton)
 * ======================================= */ let _supabase: any = null
function getSupabaseClient() {
	if (_supabase) return _supabase
	const url = Deno.env.get("SUPABASE_URL")
	const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
	if (!url || !key) {
		throw new Error(
			"Server mis-config (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
		)
	}
	_supabase = createClient(url, key, {
		auth: {
			persistSession: false,
		},
	})
	return _supabase
}
async function existsTreeNode(nodeId: string) {
	const sb = getSupabaseClient()
	const { data, error } = await sb
		.from("tree_nodes")
		.select("id")
		.eq("id", nodeId)
		.maybeSingle()
	return !error && !!data
}
function selectPublicationNumber(publications: any[] | null | undefined) {
	if (!publications?.length) return null
	const priority = ["US", "JP"]
	let selected = null
	for (const country of priority) {
		selected = publications.find((p: any) => p.country === country)
		if (selected) break
	}
	if (!selected) selected = publications[0]
	const pubId = selected?.publication_id
	if (!pubId) return null
	return pubId.replace(/-/g, "")
}
function getNonEmptyString(...values: any[]): string | null {
	for (const value of values) {
		if (typeof value === "string" && value.trim().length > 0) {
			return value.trim()
		}
		if (typeof value === "number" && Number.isFinite(value)) {
			return String(value)
		}
	}
	return null
}

function normalizeNameArray(value: any): Array<Record<string, unknown>> {
	if (!Array.isArray(value)) return []
	return value
		.map((item) => {
			if (typeof item === "string" && item.trim().length > 0) {
				return { name: item.trim() }
			}
			if (item && typeof item === "object") {
				const name = getNonEmptyString(
					item.name,
					item.assignee,
					item.inventor,
					item.value,
				)
				if (!name) return null
				return { ...item, name }
			}
			return null
		})
		.filter((item): item is Record<string, unknown> => item !== null)
}

function normalizePatentForInsert(patent: any, index: number) {
	const publicationNumber =
		getNonEmptyString(
			patent.publication_number,
			patent.publication_id,
			patent.patent_number,
			patent.application_number,
		) ?? selectPublicationNumber(patent.publications)
	const familyId = getNonEmptyString(patent.family_id, patent.familyId)

	const title =
		getNonEmptyString(
			patent.title,
			patent.invention_title,
			publicationNumber,
			familyId,
		) ??
		(patent.abstract && typeof patent.abstract === "string"
			? truncateText(patent.abstract, 120)
			: null) ??
		`Patent result ${index + 1}`

	return {
		familyId,
		title,
		publicationNumber,
		assignee: normalizeNameArray(patent.assignee),
		inventor: normalizeNameArray(patent.inventor),
	}
}
const PATENT_PROVENANCE_COLUMNS = new Set([
	"ipc_prefix",
	"ipc",
	"distance",
	"keyword_match_count",
	"publications",
	"queries",
	"query_hits",
])
function stripPatentProvenanceColumns(row: Record<string, any>) {
	return Object.fromEntries(
		Object.entries(row).filter(([key]) => !PATENT_PROVENANCE_COLUMNS.has(key)),
	)
}
function isMissingPatentColumnError(error: any) {
	const message = String(error?.message ?? "")
	return error?.code === "PGRST204" || message.includes("Could not find")
}
function formatNameList(value: any) {
	if (!Array.isArray(value)) return "N/A"
	return (
		value
			.map((item) => {
				if (typeof item === "string") return item
				if (item && typeof item === "object") {
					return item.name || item.assignee || item.inventor || item.value || ""
				}
				return ""
			})
			.filter(Boolean)
			.slice(0, 3)
			.join(", ") || "N/A"
	)
}
function truncateText(value: any, maxLength: number) {
	const text = typeof value === "string" ? value.trim() : ""
	if (text.length <= maxLength) return text
	return `${text.slice(0, maxLength)}...`
}
function getPublicationIdForCitation(patent: any) {
	const publicationNumber =
		typeof patent?.publication_number === "string"
			? patent.publication_number.trim()
			: ""
	if (publicationNumber) return publicationNumber
	if (!Array.isArray(patent?.publications)) return ""
	const publication = patent.publications.find(
		(item: any) =>
			typeof item?.publication_id === "string" &&
			item.publication_id.trim().length > 0,
	)
	return publication?.publication_id?.trim() ?? ""
}
function getPatentSourceName(patent: any) {
	const assignee = formatNameList(patent?.assignee)
	if (assignee !== "N/A") return assignee
	const inventor = formatNameList(patent?.inventor)
	if (inventor !== "N/A") return inventor
	const publicationId = getPublicationIdForCitation(patent)
	if (publicationId) return publicationId
	const familyId =
		typeof patent?.family_id === "string" ? patent.family_id.trim() : ""
	if (familyId) return familyId
	const title = typeof patent?.title === "string" ? patent.title.trim() : ""
	if (title) return title
	return "Unknown source"
}
async function generatePatentSummary(
	patents: any[],
	query: string,
	openaiApiKey: string,
	language: string,
): Promise<string> {
	const isJapanese = String(language).toLowerCase().startsWith("ja")
	if (!patents?.length) {
		return isJapanese
			? "この検索条件に該当する特許は見つかりませんでした。"
			: "No patents found for this search."
	}

	const patentsForSummary = patents.slice(0, PATENT_SUMMARY_LIMIT)
	const sourceListText = patentsForSummary
		.map((patent: any, index: number) => {
			return `[${index + 1}]\n${getPatentSourceName(patent)}`
		})
		.join("\n")

	const patentsText = patentsForSummary
		.map((patent: any, index: number) =>
			[
				`#${index + 1}`,
				`Citation ID: [${index + 1}]`,
				`Source: ${getPatentSourceName(patent)}`,
				`Title: ${patent.title ?? "N/A"}`,
				`Assignee: ${formatNameList(patent.assignee)}`,
				`Inventor: ${formatNameList(patent.inventor)}`,
				`Publication: ${getPublicationIdForCitation(patent) || "N/A"}`,
				`Priority date: ${patent.earliest_priority_date ?? "N/A"}`,
				`Countries: ${Array.isArray(patent.countries) ? patent.countries.join(", ") : "N/A"}`,
				`IPC: ${Array.isArray(patent.ipc_subclasses) ? patent.ipc_subclasses.join(", ") : "N/A"}`,
				`Abstract: ${truncateText(patent.abstract, 900) || "N/A"}`,
			].join("\n"),
		)
		.join("\n\n")

	const prompt = isJapanese
		? `### ユーザーのペルソナ
- あなたは研究者、アナリスト、知財・事業戦略担当者のいずれかであり、
- 大量の特許情報を整理し、技術焦点、主要出願人、実装アプローチ、成熟度、事業上の示唆を把握したい。

### アシスタントのペルソナ
- あなたは特許ランドスケープ分析に強い専門リサーチアナリスト。
- 特許メタデータから技術クラスタ、出願人動向、用途・実装の方向性、研究開発・事業化の含意を具体的に整理できる。

### 出力要件
1. 最初から内容に入り、解説的な前置きは書かない。
2. #### 見出しを使って「主要出願人・技術焦点・実装アプローチ・成熟度/地域/分類・示唆」などの観点で構造化する。
3. 企業名、技術名、重要な分類・用途は **太字** で記載する。
4. Markdownを中心に使用すること。主要セクションを単純な<div>...</div>で囲むことは許可するが、<a>、<strong>、script、style、イベント属性など、div以外のHTMLタグは使用しない。
5. 課題・特徴・トレンドを3つ以上列挙する場合はMarkdownの箇条書き（- 項目）を使うこと。
6. 本文中の各段落・重要な主張には、根拠となる特許の Citation ID を [1]、[2] のように文中引用として必ず付ける。存在しない番号は使わない。
7. 出力末尾に必ず「#### 出典」セクションを付け、下記 Source List の番号と名称をそのまま列挙する。形式は [1] の次行に出典名、[2] の次行に出典名、という形にする。MarkdownリンクやHTMLリンクにはしない。
8. 出力は日本語で600〜900字程度。入力された上位特許だけに基づき、推測しすぎない。

### 入力
Query: ${query}

Patents:

${patentsText}

Source List:
${sourceListText}`
		: `### User Persona
- You are a researcher, analyst, IP strategist, or business strategist.
- You want to organize patent information to understand technical focus, major assignees, implementation approaches, maturity signals, and business implications.

### Assistant Persona
- You are a specialized patent landscape analyst.
- You synthesize patent metadata into concrete insights about technology clusters, assignee trends, applications, implementation direction, and commercialization implications.

### Output Requirements
1. Start with content directly — no preamble.
2. Use #### headings to organize sections such as major assignees, technical focus, implementation approaches, maturity/region/classification signals, and implications.
3. Bold company names, technologies, important classifications, and applications using **name** syntax.
4. Use Markdown formatting. You may wrap major sections in simple <div>...</div> blocks, but do not use any other HTML tags such as <a>, <strong>, scripts, styles, or inline event handlers.
5. When enumerating challenges, features, or trends (3 or more items), use a Markdown bullet list (- item).
6. Every paragraph and important claim must include inline patent citations using the provided Citation IDs, such as [1] or [2]. Do not cite IDs that are not listed.
7. Always end with a final section titled "#### 出典" and list the Source List numbers and names exactly as provided. Put each source name on the line after its [1], [2], etc. number. Do not use Markdown links or HTML links.
8. Write 500-800 words in English. Base the summary only on the provided top patents and avoid over-claiming.

### Input
Query: ${query}

Patents:

${patentsText}

Source List:
${sourceListText}`

	try {
		const response = await fetch("https://api.openai.com/v1/responses", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${openaiApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4.1-mini",
				max_output_tokens: 1600,
				temperature: 0.4,
				instructions:
					"You are a patent landscape analyst. Produce evidence-grounded summaries from patent metadata using Markdown. Inline citations like [1] are required in body paragraphs. Always end with a 出典 section using the provided source list. Simple <div> section wrappers are allowed; other HTML tags are not allowed.",
				input: prompt,
			}),
		})
		if (!response.ok) {
			logErr("OpenAI patent summary failed", {
				status: response.status,
				body: (await response.text().catch(() => "")).slice(0, 500),
			})
			return isJapanese
				? "要約の生成中にエラーが発生しました。"
				: "An error occurred while generating the summary."
		}
		const result = await response.json()
		return extractResponseText(result).trim()
	} catch (error) {
		logErr("Patent summary generation failed", {
			error: getErrorMessage(error),
		})
		return isJapanese
			? "要約の生成中にエラーが発生しました。"
			: "An error occurred while generating the summary."
	}
}
async function savePatentSummary(
	sb: any,
	nodeId: string,
	summary: string,
	patentsCount: number,
	patentsSavedCount: number,
	patentsSummaryCount: number,
): Promise<boolean> {
	if (!summary) return false
	return await updatePatentAnalysisData(sb, nodeId, {
		patent_summary: summary,
		patents_count: patentsCount,
		patents_saved_count: patentsSavedCount,
		patent_summary_count: patentsSummaryCount,
	})
}

async function updatePatentAnalysisData(
	sb: any,
	nodeId: string,
	patch: Record<string, any>,
): Promise<boolean> {
	const { data: existing, error: selectError } = await sb
		.from("node_analysis")
		.select("id, data")
		.eq("node_id", nodeId)
		.maybeSingle()
	if (selectError) {
		throw new Error(`Failed to query node_analysis: ${selectError.message}`)
	}
	const data =
		existing?.data && typeof existing.data === "object" ? existing.data : {}
	const mergedData = {
		...data,
		...patch,
	}
	if (existing?.id) {
		const { error } = await sb
			.from("node_analysis")
			.update({
				data: mergedData,
				updated_at: new Date().toISOString(),
			})
			.eq("id", existing.id)
		if (error)
			throw new Error(`Failed to update patent summary: ${error.message}`)
		return true
	}
	const { error } = await sb.from("node_analysis").insert({
		node_id: nodeId,
		data: mergedData,
	})
	if (error)
		throw new Error(`Failed to insert patent summary: ${error.message}`)
	return true
}
function buildEnrichmentQuery(
	enrichNode: string,
	query: string,
	parentNodes: string[],
	treeType: string,
): string {
	const fullHierarchy = [...parentNodes, enrichNode]
	const hierarchyLength = fullHierarchy.length

	if (treeType.toLowerCase() === "ted") {
		const queryParts = [`We want to find Patents in [${query}]`]
		if (hierarchyLength >= 1) queryParts.push(`tackling [${fullHierarchy[0]}]`)
		if (hierarchyLength >= 2)
			queryParts.push(`that aims for [${fullHierarchy[1]}]`)
		if (hierarchyLength >= 3) queryParts.push(`by using [${fullHierarchy[2]}]`)
		if (hierarchyLength >= 4) queryParts.push(`such as [${fullHierarchy[3]}]`)
		if (hierarchyLength >= 5)
			queryParts.push(`especially [${fullHierarchy[4]}]`)
		return queryParts.join(" / ")
	}

	if (treeType.toLowerCase() === "fast") {
		const queryParts = [`We want to find Patents by breaking down ${query}`]
		if (hierarchyLength >= 1) queryParts.push(`into ${fullHierarchy[0]}`)
		if (hierarchyLength >= 2) queryParts.push(`focusing on ${fullHierarchy[1]}`)
		if (hierarchyLength >= 3)
			queryParts.push(`especially in ${fullHierarchy[2]}`)
		if (hierarchyLength >= 4)
			queryParts.push(`especially in ${fullHierarchy[3]}`)
		if (hierarchyLength >= 5)
			queryParts.push(`especially in ${fullHierarchy[4]}`)
		return queryParts.join(" / ")
	}

	return `${query} ${parentNodes.join(" ")} ${enrichNode}`
}
async function saveNodePatentsWithSummary(
	sb: any,
	nodeId: string,
	patents: any[],
	totalPatentsCount: number,
	_teamId: string | null,
	query: string,
	language = "Japanese",
	annualTrend: Record<string, number> | null = null,
): Promise<{
	savedCount: number
	summary: string | null
	summaryGenerated: boolean
}> {
	log("Starting save process for node:", nodeId)

	const del = await sb.from("node_patents").delete().eq("node_id", nodeId)
	if (del.error) {
		throw new Error(
			`Failed to delete existing patents for node ${nodeId}: ${del.error.message}`,
		)
	}
	if (patents.length === 0) {
		await updatePatentAnalysisData(sb, nodeId, {
			patents_count: totalPatentsCount,
			patents_saved_count: 0,
			patent_summary_count: 0,
			patent_annual_trend: annualTrend,
		})
		return { savedCount: 0, summary: null, summaryGenerated: false }
	}

	const { data: nodeExists, error: nodeCheckError } = await sb
		.from("tree_nodes")
		.select("id")
		.eq("id", nodeId)
		.single()

	if (nodeCheckError || !nodeExists) {
		throw new Error(`Node ${nodeId} does not exist in tree_nodes table`)
	}

	const now = new Date().toISOString()
	const patentsToInsert = patents.map((p: any, index: number) => {
		const normalized = normalizePatentForInsert(p, index)
		return {
			node_id: nodeId,
			family_id: normalized.familyId,
			title: normalized.title,
			abstract: p.abstract ?? null,
			earliest_priority_date: p.earliest_priority_date ?? null,
			countries: Array.isArray(p.countries) ? p.countries : null,
			ipc_prefixes: Array.isArray(p.ipc_prefixes) ? p.ipc_prefixes : null,
			ipc_subclasses: Array.isArray(p.ipc_subclasses) ? p.ipc_subclasses : null,
			ipc_prefix: p.ipc_prefix ?? null,
			ipc: Array.isArray(p.ipc) ? p.ipc : null,
			cpc: Array.isArray(p.cpc) ? p.cpc : null,
			similarity_score: p.similarity_score ?? null,
			distance: p.distance ?? null,
			keyword_match_count: Number.isFinite(p.keyword_match_count)
				? p.keyword_match_count
				: null,
			assignee: normalized.assignee,
			inventor: normalized.inventor,
			publications: Array.isArray(p.publications) ? p.publications : null,
			publication_number: normalized.publicationNumber,
			queries: Array.isArray(p.queries) ? p.queries : null,
			query_hits: Array.isArray(p.query_hits) ? p.query_hits : null,
			created_at: now,
		}
	})
	if (!patentsToInsert.length) {
		await updatePatentAnalysisData(sb, nodeId, {
			patents_count: totalPatentsCount,
			patents_saved_count: 0,
			patent_summary_count: 0,
		})
		return {
			savedCount: 0,
			summary: null,
			summaryGenerated: false,
		}
	}
	let ins = await sb.from("node_patents").insert(patentsToInsert).select()
	if (ins.error && isMissingPatentColumnError(ins.error)) {
		logErr(
			"node_patents provenance columns are not available; retrying core patent insert",
			{ error: ins.error.message },
		)
		const corePatentRows = patentsToInsert.map((row: any) =>
			stripPatentProvenanceColumns(row),
		)
		ins = await sb.from("node_patents").insert(corePatentRows).select()
	}
	if (ins.error) {
		throw new Error(
			`Failed to save patents for node ${nodeId}: ${ins.error.message}`,
		)
	}

	const savedCount = ins.data?.length ?? 0
	await updatePatentAnalysisData(sb, nodeId, {
		patents_count: totalPatentsCount,
		patents_saved_count: savedCount,
		patent_summary_count: Math.min(patents.length, PATENT_SUMMARY_LIMIT),
		patent_annual_trend: annualTrend,
	})

	let patentSummary: string | null = null
	let summaryGenerated = false
	const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
	if (openaiApiKey) {
		try {
			log("[SUMMARY] Generating patent summary for node:", nodeId)
			patentSummary = await generatePatentSummary(
				patents.slice(0, PATENT_SUMMARY_LIMIT),
				query,
				openaiApiKey,
				language,
			)
			summaryGenerated = await savePatentSummary(
				sb,
				nodeId,
				patentSummary,
				totalPatentsCount,
				savedCount,
				Math.min(patents.length, PATENT_SUMMARY_LIMIT),
			)
			log("[SUMMARY] Saved patent summary for node:", nodeId)
		} catch (summaryError) {
			logErr("[SUMMARY] Error generating patent summary", {
				nodeId,
				error: getErrorMessage(summaryError),
			})
		}
	} else {
		logErr(
			"[SUMMARY] OpenAI API key not found, skipping patent summary generation",
		)
	}

	return {
		savedCount,
		summary: patentSummary,
		summaryGenerated,
	}
}
/* =========================================
 * Upstream (still SSE), but we DO NOT stream to client
 * - We just consume SSE and return the final result payload.
 * ======================================= */
interface PatentSearchResult {
	patents: any[]
	totalPatentsCounts: number | null
	annualTrend: Record<string, number> | null
	sawResult: boolean
}

function normalizeTotalPatentsCount(value: any, query: string): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value
	}

	if (!value || typeof value !== "object") {
		return null
	}

	const queryTotal = value[query]
	if (typeof queryTotal === "number" && Number.isFinite(queryTotal)) {
		return queryTotal
	}

	const firstNumericTotal = Object.values(value).find(
		(count) => typeof count === "number" && Number.isFinite(count),
	)
	return typeof firstNumericTotal === "number" ? firstNumericTotal : null
}

async function consumeSSEStreamForResult(
	reader: ReadableStreamDefaultReader<Uint8Array>,
	query: string,
): Promise<PatentSearchResult> {
	const decoder = new TextDecoder()
	let buffer = ""
	let patents: any[] = []
	let totalPatentsCounts: number | null = null
	let annualTrend: Record<string, number> | null = null
	let sawResult = false
	const processLine = (line: string) => {
		const trimmed = line.trim()
		if (!trimmed.startsWith("data:")) return
		const jsonStr = trimmed.slice(5).trim()
		if (!jsonStr) return
		let parsed
		try {
			parsed = JSON.parse(jsonStr)
		} catch {
			return
		}
		if (parsed.type === "result") {
			const data = parsed.data ?? {}
			patents = Array.isArray(data.patents) ? data.patents : []
			totalPatentsCounts = normalizeTotalPatentsCount(
				data.total_patents_counts,
				query,
			)
			annualTrend =
				data.annual_trend && typeof data.annual_trend === "object"
					? (data.annual_trend as Record<string, number>)
					: null
			sawResult = true
		} else if (parsed.type === "error") {
			throw new SearchAPIError(
				parsed.message_en ?? parsed.message_ja ?? "Search API error",
			)
		} else {
			// progress -> ignore (no downstream streaming)
		}
	}

	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		buffer += decoder.decode(value, {
			stream: true,
		})
		const lines = buffer.split("\n")
		buffer = lines.pop() ?? ""
		for (const line of lines) {
			processLine(line)
		}
	}
	if (buffer.trim()) processLine(buffer)
	if (!sawResult) {
		throw new SearchAPIError("No result event received from search API")
	}
	return {
		patents,
		totalPatentsCounts,
		annualTrend,
		sawResult,
	}
}
async function searchPatentsOnce(
	query: string,
	language: string,
	flowMode: string,
	includeDesc: boolean,
): Promise<PatentSearchResult> {
	const url =
		`${getSearchApiBaseUrl("stg")}/search_patent` +
		`?query=${encodeURIComponent(query)}` +
		`&flow_mode=${encodeURIComponent(flowMode)}` +
		`&include_desc=${includeDesc ? "true" : "false"}` +
		`&language=${encodeURIComponent(language)}`
	const res = await fetch(url, {
		method: "GET",
		headers: {
			Authorization: makeBasicAuthHeader(),
			Accept: "text/event-stream",
		},
	})
	if (!res.ok) {
		const text = await res.text().catch(() => "")
		throw new SearchAPIError(`search_patent API ${res.status}: ${text}`)
	}
	const reader = res.body?.getReader()
	if (!reader) throw new SearchAPIError("No response body from search API")
	return await consumeSSEStreamForResult(reader, query)
}
function resolveTotalPatentCount(
	totalPatentsCount: number | null,
	patentsLength: number,
) {
	if (
		typeof totalPatentsCount === "number" &&
		Number.isFinite(totalPatentsCount)
	) {
		return totalPatentsCount
	}

	return patentsLength
}
/* =========================================
 * HTTP handler (NO streaming response)
 * ======================================= */ serve(async (req) => {
	if (req.method === "OPTIONS") return corsPreflightResponse()
	if (req.method !== "POST") {
		return jsonErrorResponse("Method Not Allowed", 405)
	}
	try {
		const bodyRaw = await req.text()
		let body: NodeEnrichmentRequest
		try {
			body = JSON.parse(bodyRaw)
		} catch {
			return jsonErrorResponse("Invalid JSON body", 400)
		}
		if (!body.query || !body.query.trim()) {
			return jsonErrorResponse("Missing required parameter: query", 400)
		}
		const nodeId = (body.node_id || body.nodeId || "").trim()
		if (!nodeId) {
			return jsonErrorResponse("Missing required parameter: node_id", 400)
		}
		const validFlowModes = ["both", "llm", "keyword_only", "seed_only"]
		if (
			body.flow_mode !== undefined &&
			!validFlowModes.includes(body.flow_mode)
		) {
			return jsonErrorResponse(
				`Invalid flow_mode: "${body.flow_mode}". Must be one of: ${validFlowModes.join(
					", ",
				)}`,
				400,
			)
		}
		if (
			body.include_desc !== undefined &&
			typeof body.include_desc !== "boolean"
		) {
			return jsonErrorResponse(
				`Invalid include_desc: expected boolean, got ${typeof body.include_desc}`,
				400,
			)
		}
		const baseQuery = body.query.trim()
		const enrichNode =
			body.enrichNode || body.scenarioName || body.scenario_name || ""
		const parentNodes = Array.isArray(body.parentNodes) ? body.parentNodes : []
		const treeType = body.treeType || ""
		const query =
			enrichNode && treeType
				? buildEnrichmentQuery(enrichNode, baseQuery, parentNodes, treeType)
				: baseQuery
		const flowMode = body.flow_mode ?? "both"
		const includeDesc = body.include_desc ?? false
		const language = body.language ?? "English"
		log("payload", {
			nodeId,
			query: query.slice(0, 120),
			flowMode,
			includeDesc,
			language,
		})
		if (!(await existsTreeNode(nodeId))) {
			return jsonErrorResponse(
				`Node "${nodeId}" does not exist in tree_nodes table`,
				400,
			)
		}
		const searchResult = await searchPatentsOnce(
			query,
			language,
			flowMode,
			includeDesc,
		)
		const patents = searchResult.patents
		const totalPatentCount = resolveTotalPatentCount(
			searchResult.totalPatentsCounts,
			patents.length,
		)
		const patentsForList = patents.slice(0, PATENT_RESULT_LIST_LIMIT)
		const sb = getSupabaseClient()
		const { savedCount, summary, summaryGenerated } =
			await saveNodePatentsWithSummary(
				sb,
				nodeId,
				patentsForList,
				totalPatentCount,
				body.team_id ?? null,
				query,
				language,
				searchResult.annualTrend,
			)
		const topTitles = patentsForList
			.slice(0, 3)
			.map((p: any) => p?.title)
			.filter((t: any) => typeof t === "string" && t.length > 0)
		return jsonResponse({
			fetchedCount: totalPatentCount,
			displayedCount: patentsForList.length,
			savedCount,
			summaryGenerated,
			summary: summary ?? undefined,
			success: true,
			hasResults: patentsForList.length > 0,
			nodeId,
			enrichNode,
			results: {
				patents: {
					count: totalPatentCount,
					displayed: patentsForList.length,
					saved: savedCount > 0,
				},
			},
			topTitles,
			timestamp: new Date().toISOString(),
		})
	} catch (err) {
		logErr("handler error", {
			error: getErrorMessage(err),
		})
		return jsonErrorResponse(getErrorMessage(err), 500)
	}
})
