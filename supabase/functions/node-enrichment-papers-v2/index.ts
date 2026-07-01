// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

export interface NodeEnrichmentRequest {
	nodeId: string
	treeId: string
	enrichNode: string
	query: string
	parentNodes: string[]
	team_id?: string | null
	treeType: string
	language?: string
}

interface Paper {
	id: string
	title: string
	authors: string
	journal: string
	tags: string[]
	abstract: string
	date: string | null
	citations: number
	region: string
	referenced_works: string[]
	fwci: string
	doi: string
	url: string
	score: number
	type: string
	publisher: string
	cited_counts_by_year: Record<string, number>
	openalex_link: string
}

interface SearchArticleRequest {
	query: string
	language?: string
}
interface SearchArticleResponse {
	papers: Paper[]
	total_count: number
}

const PAPER_SUMMARY_LIMIT = 5

// =============================================================================
// SUMMARY GENERATION FUNCTIONS
// =============================================================================

function normalizeLanguage(language: unknown) {
	const value = String(language ?? "").toLowerCase()
	return value.startsWith("en") ? "English" : "Japanese"
}

function formatPaperSourceName(paper: Paper) {
	const journal = typeof paper.journal === "string" ? paper.journal.trim() : ""
	if (journal) return journal
	const authors = typeof paper.authors === "string" ? paper.authors.trim() : ""
	if (authors) return authors
	const publisher =
		typeof paper.publisher === "string" ? paper.publisher.trim() : ""
	if (publisher) return publisher
	const doi = typeof paper.doi === "string" ? paper.doi.trim() : ""
	if (doi) return doi
	const url = typeof paper.url === "string" ? paper.url.trim() : ""
	if (url) return url
	const title = typeof paper.title === "string" ? paper.title.trim() : ""
	if (title) return title
	return "Unknown source"
}

/**
 * Generate paper summary using GPT-4o
 */
async function generatePaperSummary(
	papers: Paper[],
	query: string,
	openaiApiKey: string,
	language = "Japanese",
): Promise<string> {
	// Use top 5 papers by score
	const topPapers = [...papers]
		.sort((a, b) => b.score - a.score)
		.slice(0, PAPER_SUMMARY_LIMIT)
	const outputLanguage = normalizeLanguage(language)
	const isEnglish = outputLanguage === "English"

	if (topPapers.length === 0) {
		return isEnglish
			? "No papers found for this search."
			: "この検索条件に該当する論文は見つかりませんでした。"
	}

	const sourceListText = topPapers
		.map((paper, index) => `[${index + 1}]\n${formatPaperSourceName(paper)}`)
		.join("\n")
	const papersText = topPapers
		.map((paper, index) =>
			[
				`#${index + 1}`,
				`Citation ID: [${index + 1}]`,
				`Source: ${formatPaperSourceName(paper)}`,
				`Title: ${paper.title ?? "N/A"}`,
				`Date: ${paper.date || "N/A"}`,
				`Author: ${paper.authors ?? "N/A"}`,
				`Journal: ${paper.journal ?? "N/A"}`,
				`Citations: ${paper.citations ?? "N/A"}`,
				`Abstract: ${paper.abstract ?? "N/A"}`,
			].join("\n"),
		)
		.join("\n\n")

	const systemContent = isEnglish
		? "You are a research analyst specializing in academic paper summarization. Write evidence-grounded Markdown summaries. Inline citations like [1] are required in body paragraphs. Always end with a 出典 section using the provided source list. Simple <div> section wrappers are allowed; other HTML tags are not allowed."
		: "あなたは学術論文の要約を専門とする研究アナリストです。Markdownを中心に、根拠に基づく日本語サマリーを作成してください。本文中の引用 [1] を必須とし、最後に提供された出典一覧を使って「出典」セクションを付けてください。主要セクションを単純な<div>...</div>で囲むことは許可しますが、それ以外のHTMLタグは使用しないでください。"

	const prompt = isEnglish
		? `### **User Persona**
* Needs to quickly grasp multiple papers and organize the research background and big picture.
* Wants to understand research direction and gaps through an integrated ~600-word summary.

---
### **Assistant Persona**
* You are a research analyst specializing in academic paper summarization.
* You can analyze each paper and clearly extract **Main Findings**, **Methodologies**, and **Implications**.
* Write concise but academically rigorous summaries in English.

---
### **Output Requirements:**

1. Start directly with the summary.
2. Use #### headings for research themes, methods, findings, and implications.
3. Every paragraph and important claim must include inline paper citations using Citation IDs such as [1] or [2].
4. Use Markdown formatting. You may wrap major sections in simple <div>...</div> blocks, but do not use any other HTML tags.
5. Always end with a final section titled "#### 出典" and list the Source List numbers and names exactly as provided. Put each source name on the line after its [1], [2], etc. number.
6. Write about 500-700 words in English and do not cite sources outside the provided papers.

---
### **Input:**

\`\`\`
Query: ${query}

Papers:
${papersText}

Source List:
${sourceListText}
\`\`\`
---
### **Output format:**

* ~600-word academic summary in English with inline citations and a final #### 出典 section`
		: `### **ユーザーのペルソナ (User Persona)**
* 複数の論文を短時間で把握し、研究背景や全体像を整理することを目的としている。
* 300字前後の統合要約を用いて、研究の方向性や空白領域を把握したい。

---
### **AIのペルソナ (Assistant Persona)**
* あなたは学術論文の要約を専門とする研究アナリスト。
* 各論文を分析し、**主要な知見 (Main Findings)**、**方法論 (Methodologies)**、**研究の意義 (Implications)** を明確に抽出できる。
* 簡潔だが学術的な日本語で要約を作成する。

---
### **出力要件:**

1. 最初から内容に入り、解説的な前置きは書かない。
2. #### 見出しを使って、研究テーマ・方法論・主要知見・示唆を構造化する。
3. 本文中の各段落・重要な主張には、根拠となる論文の Citation ID を [1]、[2] のように文中引用として必ず付ける。
4. Markdownを中心に使用すること。主要セクションを単純な<div>...</div>で囲むことは許可するが、それ以外のHTMLタグは使用しない。
5. 出力末尾に必ず「#### 出典」セクションを付け、下記 Source List の番号と名称をそのまま列挙する。形式は [1] の次行に出典名、[2] の次行に出典名、という形にする。
6. 日本語で600字程度。提供された論文以外は出典として使わない。

---
### **入力形式:**

\`\`\`
Query: ${query}

Papers:
${papersText}

Source List:
${sourceListText}
\`\`\`
---
### **出力形式:**

* 日本語で600字程度の学術的要約
* 本文中に [1] の形式で引用し、最後に #### 出典 を付ける`

	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${openaiApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: systemContent,
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 1000,
			temperature: 0.3,
		}),
	})

	if (!response.ok) {
		console.error(`[SUMMARY] OpenAI API error: ${response.status}`)
		return isEnglish
			? "An error occurred while generating the summary."
			: "要約の生成中にエラーが発生しました。"
	}

	const result = await response.json()
	return result.choices[0].message.content.trim()
}

// Build sophisticated query based on tree type and parent nodes
function buildEnrichmentQuery(
	enrichNode: string,
	query: string,
	parentNodes: string[],
	treeType: string,
): string {
	// Create the full hierarchy by adding enrichNode to the end of parentNodes
	const fullHierarchy = [...parentNodes, enrichNode]
	const hierarchyLength = fullHierarchy.length

	if (treeType.toLowerCase() === "ted") {
		// TED generation query format
		const queryParts = [`We want to find Research in [${query}]`]

		if (hierarchyLength >= 1) {
			queryParts.push(`tackling [${fullHierarchy[0]}]`) // Scenario
		}
		if (hierarchyLength >= 2) {
			queryParts.push(`that aims for [${fullHierarchy[1]}]`) // Purpose
		}
		if (hierarchyLength >= 3) {
			queryParts.push(`by using [${fullHierarchy[2]}]`) // Function
		}
		if (hierarchyLength >= 4) {
			queryParts.push(`such as [${fullHierarchy[3]}]`) // Measure
		}
		if (hierarchyLength >= 5) {
			queryParts.push(`especially [${fullHierarchy[4]}]`) // Measure2/3/4/5
		}

		return queryParts.join(" / ")
	} else if (treeType.toLowerCase() === "fast") {
		// Fast generation query format
		const queryParts = [
			`We want to find Research Papers by breaking down ${query}`,
		]

		if (hierarchyLength >= 1) {
			queryParts.push(`into ${fullHierarchy[0]}`) // How1
		}
		if (hierarchyLength >= 2) {
			queryParts.push(`focusing on ${fullHierarchy[1]}`) // How2
		}
		if (hierarchyLength >= 3) {
			queryParts.push(`especially in ${fullHierarchy[2]}`) // How3
		}
		if (hierarchyLength >= 4) {
			queryParts.push(`especially in ${fullHierarchy[3]}`) // How4
		}
		if (hierarchyLength >= 5) {
			queryParts.push(`especially in ${fullHierarchy[4]}`) // How5
		}

		return queryParts.join(" / ")
	}

	// Fallback to simple query if tree type is not recognized
	return `${query} ${parentNodes.join(" ")} ${enrichNode}`
}

async function fetchSearchArticleStream(
	request: SearchArticleRequest,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
	const baseUrl = getSearchApiBaseUrl("stg")
	const endpoints = ["/v5/search_article", "/v5/search_articles"]
	let lastError = ""

	for (const endpoint of endpoints) {
		const params = new URLSearchParams({ query: request.query })
		if (request.language)
			params.set("language", normalizeLanguage(request.language))
		const url = `${baseUrl}${endpoint}?${params.toString()}`

		console.log(`[PAPERS_ONLY] Trying ${endpoint} with query: ${request.query}`)
		const res = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: makeBasicAuthHeader(),
				Accept: "text/event-stream",
			},
		})

		if (res.ok) {
			const reader = res.body?.getReader()
			if (!reader) throw new Error("No response body from search API")
			return reader
		}

		const text = await res.text().catch(() => "")
		lastError = `${endpoint} API ${res.status}: ${text}`
		console.error(
			`[PAPERS_ONLY] ${endpoint} failed with status ${res.status}:`,
			text.slice(0, 500),
		)

		if (res.status !== 404 && res.status !== 405) break
	}

	throw new Error(lastError || "search article API failed")
}

// Call search_articles/search_article API for papers
async function callSearchArticleAPI(
	request: SearchArticleRequest,
): Promise<SearchArticleResponse> {
	console.log(
		`[PAPERS_ONLY] Calling search_articles API with query: ${request.query}`,
	)

	const reader = await fetchSearchArticleStream(request)
	const decoder = new TextDecoder()
	let buffer = ""
	let papers: Paper[] = []

	while (true) {
		const { done, value } = await reader.read()
		if (done) break

		buffer += decoder.decode(value, { stream: true })
		const lines = buffer.split("\n")
		buffer = lines.pop() ?? ""

		for (const line of lines) {
			const trimmed = line.trim()
			if (!trimmed.startsWith("data:")) continue

			const jsonStr = trimmed.slice(5).trim()
			if (!jsonStr) continue

			let parsed: any
			try {
				parsed = JSON.parse(jsonStr)
			} catch {
				continue
			}

			if (parsed.type === "result") {
				papers = parsed.data?.articles ?? parsed.data?.papers ?? []
			} else if (parsed.type === "error") {
				throw new Error(
					parsed.message_en ?? parsed.message_ja ?? "Search API error",
				)
			}
		}
	}

	console.log(`[PAPERS_ONLY] Received ${papers.length} papers`)
	return { papers, total_count: papers.length }
}

// Save papers for a specific node, THEN generate summary
async function saveNodePapersWithSummary(
	supabaseClient: any,
	nodeId: string,
	treeId: string,
	papers: Paper[],
	teamId: string | null,
	query: string,
	language = "Japanese",
): Promise<void> {
	if (papers.length === 0) return

	console.log(`[PAPERS_ONLY] Starting save process for node: ${nodeId}`)

	// Delete existing papers and summaries for this node FIRST
	const { error: deleteError } = await supabaseClient
		.from("node_papers")
		.delete()
		.eq("node_id", nodeId)

	if (deleteError) {
		console.warn(
			`[PAPERS_ONLY] Failed to delete existing papers for node ${nodeId}:`,
			deleteError,
		)
	}

	// Also delete existing summary
	const { error: deleteSummaryError } = await supabaseClient
		.from("node_papers_summary")
		.delete()
		.eq("node_id", nodeId)

	if (deleteSummaryError) {
		console.warn(
			`[PAPERS_ONLY] Failed to delete existing paper summary for node ${nodeId}:`,
			deleteSummaryError,
		)
	}

	// Verify node exists before inserting
	console.log(
		`[DEBUG] About to insert ${papers.length} papers for node: ${nodeId}`,
	)
	console.log(`[DEBUG] nodeId: ${nodeId}, treeId: ${treeId}, teamId: ${teamId}`)

	const { data: nodeExists, error: nodeCheckError } = await supabaseClient
		.from("tree_nodes")
		.select("id")
		.eq("id", nodeId)
		.single()

	if (nodeCheckError || !nodeExists) {
		console.error(`[DEBUG] Node does not exist in tree_nodes table!`, {
			nodeId,
			nodeCheckError: nodeCheckError?.message,
			nodeExists,
		})
		throw new Error(`Node ${nodeId} does not exist in tree_nodes table`)
	}
	console.log(`[DEBUG] Node exists in tree_nodes: ${nodeExists.id}`)

	// Prepare papers data
	const papersToInsert = papers.map((paper) => ({
		id: paper.id,
		node_id: nodeId,
		tree_id: treeId,
		title: paper.title,
		authors: paper.authors,
		journal: paper.journal,
		tags: paper.tags,
		abstract: paper.abstract,
		date: paper.date,
		citations: paper.citations,
		region: paper.region === "domestic" ? "domestic" : "international",
		doi: paper.doi,
		url: paper.url,
		team_id: teamId,
		score: paper.score,
	}))

	if (papersToInsert.length > 0) {
		console.log(`[DEBUG] First paper to insert:`, {
			id: papersToInsert[0]?.id,
			node_id: papersToInsert[0]?.node_id,
			tree_id: papersToInsert[0]?.tree_id,
			title: papersToInsert[0]?.title?.substring(0, 50),
			team_id: papersToInsert[0]?.team_id,
			date: papersToInsert[0]?.date,
			region: papersToInsert[0]?.region,
		})
	} else {
		console.log(`[DEBUG] No papers to insert.`)
	}

	// Save papers to database
	const { data: insertedData, error } = await supabaseClient
		.from("node_papers")
		.insert(papersToInsert)
		.select()

	if (error) {
		console.error(`[PAPERS_ONLY] Failed to insert papers:`, {
			error,
			message: error.message,
			details: error.details,
			hint: error.hint,
			code: error.code,
		})
		throw new Error(
			`Failed to save papers for node ${nodeId}: ${error.message}`,
		)
	}

	console.log(
		`[DEBUG] Successfully inserted ${insertedData?.length || 0} papers`,
	)

	// Verify inserts by counting
	const { count: verifyCount, error: verifyError } = await supabaseClient
		.from("node_papers")
		.select("id", { count: "exact", head: true })
		.eq("node_id", nodeId)

	console.log(
		`[DEBUG] Verification count for node ${nodeId}: ${verifyCount} papers`,
		{
			verifyError: verifyError?.message,
		},
	)

	console.log(
		`[PAPERS_ONLY] Successfully saved ${papers.length} papers for node: ${nodeId}`,
	)

	// NOW generate summary AFTER data is saved
	// If this times out, at least the paper data is already in the database
	let paperSummary: string | null = null
	const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")

	if (OPENAI_API_KEY) {
		try {
			console.log(`[SUMMARY] Generating paper summary for node: ${nodeId}`)
			paperSummary = await generatePaperSummary(
				papers,
				query,
				OPENAI_API_KEY,
				language,
			)
			console.log(
				`[SUMMARY] Successfully generated paper summary for node: ${nodeId}`,
			)

			// Save summary to database
			const { error: paperSummaryError } = await supabaseClient
				.from("node_papers_summary")
				.upsert({
					node_id: nodeId,
					tree_id: treeId,
					user_id: null,
					team_id: teamId,
					summary: paperSummary,
					query: query,
					papers_count: Math.min(papers.length, 5),
				})

			if (paperSummaryError) {
				console.error(
					`[SUMMARY] Failed to save paper summary for node ${nodeId}:`,
					paperSummaryError,
				)
			} else {
				console.log(`[SUMMARY] Saved paper summary for node: ${nodeId}`)
			}
		} catch (summaryError) {
			console.error(
				`[SUMMARY] Error generating paper summary for node ${nodeId}:`,
				summaryError,
			)
			// Continue - paper data is already saved even if summary fails
		}
	} else {
		console.warn(
			`[SUMMARY] OpenAI API key not found, skipping paper summary generation`,
		)
	}
}

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { status: 200, headers: CORS })
	}

	try {
		const requestBody = await req.json()
		console.log(
			`[PAPERS_ONLY] Received request for node enrichment:`,
			requestBody.enrichNode,
		)

		const {
			nodeId,
			treeId,
			enrichNode,
			query,
			parentNodes,
			team_id,
			treeType,
			language,
		} = requestBody as NodeEnrichmentRequest

		console.log(`[PAPERS_ONLY] Parsed parameters:`, {
			nodeId,
			treeId,
			enrichNode,
			query,
			parentNodes,
			team_id,
			treeType,
			language,
		})

		// Validate required parameters
		if (
			!nodeId ||
			!treeId ||
			!enrichNode ||
			!query ||
			parentNodes === undefined ||
			!treeType
		) {
			return new Response(
				JSON.stringify({
					error: "Missing required parameters",
					required: [
						"nodeId",
						"treeId",
						"enrichNode",
						"query",
						"parentNodes",
						"treeType",
					],
				}),
				{
					status: 400,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		// Initialize Supabase client
		const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
		const SUPABASE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

		if (!SUPABASE_URL || !SUPABASE_ROLE_KEY) {
			throw new Error("Server mis-config (Supabase env vars)")
		}

		const sb = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY)

		// Build sophisticated search query based on tree type and parent nodes
		const searchQuery = buildEnrichmentQuery(
			enrichNode,
			query,
			parentNodes,
			treeType,
		)

		console.log(`[PAPERS_ONLY] Built query: ${searchQuery}`) // Frontend ensures we only get called when papers don't exist, so fetch and save directly
		const articleRequest: SearchArticleRequest = {
			query: searchQuery,
			language: language ?? "Japanese",
		}
		let paperResult: SearchArticleResponse | null

		try {
			paperResult = await callSearchArticleAPI(articleRequest)
		} catch (error: any) {
			console.error("[PAPERS_ONLY] Papers API failed:", error.message)
			throw new Error(`Papers API failed: ${error.message}`)
		}

		const papers = paperResult?.papers || []
		console.log(`[PAPERS_ONLY] Got ${papers.length} papers, saving to database`)

		// Save papers to database (frontend ensures this won't conflict with existing data)
		if (papers.length) {
			await saveNodePapersWithSummary(
				sb,
				nodeId,
				treeId,
				papers,
				team_id || null,
				searchQuery,
				language ?? "Japanese",
			)
		}

		const response = {
			success: !!papers.length,
			nodeId,
			enrichNode,
			results: {
				papers: {
					count: papers.length,
					saved: !!papers.length,
				},
			},
			timestamp: new Date().toISOString(),
		}

		console.log(
			`[PAPERS_ONLY] Completed papers enrichment for node: ${enrichNode}`,
			response,
		)

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { ...CORS, "Content-Type": "application/json" },
		})
	} catch (err: any) {
		console.error("=== PAPERS ENRICHMENT ERROR ===")
		console.error("Error details:", {
			message: err.message,
			name: err.name,
			stack: err.stack,
		})

		return new Response(
			JSON.stringify({
				error: err.message ?? "unknown",
				details: err.stack ?? "No stack trace available",
			}),
			{
				status: 500,
				headers: { ...CORS, "Content-Type": "application/json" },
			},
		)
	}
})
