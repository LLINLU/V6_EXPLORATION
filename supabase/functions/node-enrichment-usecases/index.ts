// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

interface NodeEnrichmentRequest {
	nodeId: string
	treeId: string
	enrichNode: string
	query: string
	parentNodes: string[]
	team_id?: string | null
	treeType: string
	language?: string
}

interface UseCase {
	id: string
	product: string
	company: string[]
	description: string
	press_releases: string[]
	year?: number | null
}

interface SearchMarketImplRequest {
	query: string
	language?: string
}

interface SearchMarketImplResponse {
	use_cases: UseCase[]
	total_count: number
}

// =============================================================================
// SUMMARY GENERATION FUNCTIONS
// =============================================================================

function normalizeLanguage(language: unknown) {
	const value = String(language ?? "").toLowerCase()
	return value.startsWith("en") ? "English" : "Japanese"
}

/**
 * Generate use case summary using GPT-4o with the specified prompt
 */
async function generateUseCaseSummary(
	useCases: UseCase[],
	query: string,
	openaiApiKey: string,
	language = "Japanese",
): Promise<string> {
	const outputLanguage = normalizeLanguage(language)
	const isEnglish = outputLanguage === "English"

	if (useCases.length === 0) {
		return isEnglish
			? "No use cases found for this search."
			: "この検索条件に該当するユースケースは見つかりませんでした。"
	}

	const useCasesText = useCases
		.map((useCase) => {
			const pressReleases =
				Array.isArray(useCase.press_releases) &&
				useCase.press_releases.length > 0
					? useCase.press_releases
							.map((pr) => `<a href="${pr}" target="_blank">${pr}</a>`)
							.join(", ")
					: "N/A"
			return `Product: ${useCase.product}\nCompany: ${
				Array.isArray(useCase.company)
					? useCase.company.join(", ")
					: useCase.company
			}\nDescription: ${useCase.description}\nPress Releases: ${pressReleases}`
		})
		.join("\n\n")

	const systemContent = isEnglish
		? "You are a specialized research analyst who integrates and analyzes large volumes of product and technology information. Write detailed summaries using Markdown. You may wrap major sections in simple <div>...</div> blocks, but do not use any other HTML tags."
		: "あなたは大量の製品・技術情報を統合して分析する専門のリサーチアナリストです。Markdownを中心に日本語の詳細サマリーを作成してください。主要セクションを単純な<div>...</div>で囲むことは許可しますが、それ以外のHTMLタグは使用しないでください。"

	const prompt = isEnglish
		? `### User Persona
- You are a researcher, analyst, or strategist
- You want to organize large amounts of use case information to identify common trends and challenges
- Your goal is to develop business strategies or research directions

### Assistant Persona
- You are a specialized research analyst who integrates and analyzes product and technology information
- You can analyze technologies across multiple domains (healthcare, IT, manufacturing, energy, consumer goods)
- You provide deep insights for strategic decision-making and research planning

### Output Requirements
1. Start with content directly — no preamble
2. Use #### headings for each category/domain section
3. Always bold company names and product names using **name** syntax — e.g. **IBM**, **IBM Quantum**
4. When linking to a source, use descriptive Markdown link text — e.g. [IBM Quantum Official Site](url) — never use generic text like "here" or "click here"
5. Use Markdown formatting. You may wrap major sections in simple <div>...</div> blocks, but do not use any other HTML tags such as <a>, <strong>, scripts, styles, or inline event handlers.
6. When enumerating challenges, features, or trends (3 or more items), use a Markdown bullet list (- item) instead of comma-separated sentences
7. Include specific product names, company names, features, use cases, and adoption context
8. Include common trends, challenges per category, and overall implications
9. Write approximately 1000 words in English

### Input:
Query: ${query}

Usecases:

${useCasesText}

### Output:
- Detailed English summary (~1000 words) in Markdown, with optional simple <div> wrappers around major sections
- Organized by category with clear paragraph structure
- Deep-dive into each product's features and value; include cross-domain trends
- #### headings for each category
- **Bold** all company and product names
- Descriptive link text for all citations — never "こちら", "here", or raw URLs as link text`
		: `### ユーザーのペルソナ (User Persona)
- あなたは研究者、アナリスト、戦略立案担当者のいずれかであり、
- 製品・技術に関する大量のユースケース情報を整理し、共通するトレンドや課題を把握したい。
- 全体像を深く理解して、ビジネス戦略や研究の方向性に活かすことを目的としている。

### アシスタントのペルソナ (Assistant Persona)
- あなたは大量の製品・技術情報を統合して分析する専門のリサーチアナリスト。
- 多分野（医療、IT、製造、エネルギー、消費財など）にわたる技術・製品を分析し、
特徴・用途・価値・動向・課題を論理的かつ網羅的に整理することができる。
- ユーザーが戦略的意思決定や研究計画立案に使える深いインサイトを提供する。

### 出力要件
1. 最初から内容に入り、解説的な前置きは書かない。
2. カテゴリ・分野ごとに #### 見出し を使って構造化する。
3. 企業名・製品名は必ず **名前** のようにMarkdownの太字で記載する — 例：**IBM**、**IBM Quantum**
4. リンクを記載する場合は、必ず説明的なリンクテキストを使用すること — 例：[IBM Quantum公式サイト](url) — 「こちら」「詳細はこちら」などの汎用テキストや生のURLをリンクテキストとして使わない。
5. Markdownを中心に使用すること。主要セクションを単純な<div>...</div>で囲むことは許可するが、<a>、<strong>、script、style、イベント属性など、div以外のHTMLタグは使用しない。
6. 課題・特徴・トレンドを3つ以上列挙する場合は、読点区切りの文章ではなくMarkdownの箇条書き（- 項目）を使うこと。
7. 各製品や技術の名称、企業名、特徴、用途、導入背景を具体的に織り込みながらまとめる。
8. 各カテゴリの共通する動向や課題、全体に共通するトレンド・今後の示唆を必ず含める。
9. 出力は日本語で **1000字程度** の長文にし、論理性と読みやすさを意識して構成する。

### 入力:
Query: ${query}

Usecases:

${useCasesText}

### 出力:
- 日本語の詳細サマリー（1000字）。Markdownを中心に使用し、必要に応じて主要セクションを単純な<div>...</div>で囲む
- カテゴリごとに #### 見出し で整理、段落構成を明確に
- 各製品の特徴や価値を深掘り、分野間の関係性や全体のトレンドも含める
- 全ての企業名・製品名を **太字** で記載
- リンクテキストは必ず説明的に — 「こちら」「詳細」や生URLをテキストとして使わない`

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
			max_tokens: 2000,
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
		// TED generation query format for use cases
		const queryParts = [`We want to find Implementation in ${query}`]

		if (hierarchyLength >= 1) {
			queryParts.push(`tackling ${fullHierarchy[0]}`) // Scenario
		}
		if (hierarchyLength >= 2) {
			queryParts.push(`that aims for ${fullHierarchy[1]}`) // Purpose
		}
		if (hierarchyLength >= 3) {
			queryParts.push(`by using ${fullHierarchy[2]}`) // Function
		}
		if (hierarchyLength >= 4) {
			queryParts.push(`such as ${fullHierarchy[3]}`) // Measure
		}
		if (hierarchyLength >= 5) {
			queryParts.push(`especially ${fullHierarchy[4]}`) // Measure2/3/4/5
		}

		return queryParts.join(" / ")
	} else if (treeType.toLowerCase() === "fast") {
		// Fast generation query format for use cases
		const queryParts = [
			`We want to find Market Implementation by breaking down the ${query}`,
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

async function fetchSearchMarketImplStream(
	request: SearchMarketImplRequest,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
	const baseUrl = getSearchApiBaseUrl("stg")
	const endpoints = ["/v5/search_market_impl", "/v5/search_market_impls"]
	let lastError = ""

	for (const endpoint of endpoints) {
		const params = new URLSearchParams({ query: request.query })
		if (request.language)
			params.set("language", normalizeLanguage(request.language))
		const url = `${baseUrl}${endpoint}?${params.toString()}`

		console.log(
			`[USECASES_ONLY] Trying ${endpoint} with query: ${request.query}`,
		)
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
			`[USECASES_ONLY] ${endpoint} failed with status ${res.status}:`,
			text.slice(0, 500),
		)

		if (res.status !== 404 && res.status !== 405) break
	}

	throw new Error(lastError || "search market implementation API failed")
}

// Call search_market_impls/search_market_impl API for use cases
async function callSearchMarketImplAPI(
	request: SearchMarketImplRequest,
): Promise<SearchMarketImplResponse> {
	console.log(
		`[USECASES_ONLY] Calling search_market_impls API with query: ${request.query}`,
	)

	const reader = await fetchSearchMarketImplStream(request)
	const decoder = new TextDecoder()
	let buffer = ""
	let useCases: UseCase[] = []

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
				useCases = parsed.data?.markets ?? parsed.data?.use_cases ?? []
			} else if (parsed.type === "error") {
				throw new Error(
					parsed.message_en ?? parsed.message_ja ?? "Search API error",
				)
			}
		}
	}

	console.log(`[USECASES_ONLY] Received ${useCases.length} use cases`)
	return { use_cases: useCases, total_count: useCases.length }
}

// Save use cases for a specific node, THEN generate summary
async function saveNodeUseCasesWithSummary(
	supabaseClient: any,
	nodeId: string,
	treeId: string,
	useCases: UseCase[],
	teamId: string | null,
	query: string,
	language = "Japanese",
): Promise<void> {
	if (useCases.length === 0) return

	console.log(`[USECASES_ONLY] Starting save process for node: ${nodeId}`)

	// Delete existing use cases and summaries for this node FIRST
	const { error: deleteError } = await supabaseClient
		.from("node_use_cases")
		.delete()
		.eq("node_id", nodeId)

	if (deleteError) {
		console.warn(
			`[USECASES_ONLY] Failed to delete existing use cases for node ${nodeId}:`,
			deleteError,
		)
	}

	// Also delete existing summary
	const { error: deleteSummaryError } = await supabaseClient
		.from("node_usecases_summary")
		.delete()
		.eq("node_id", nodeId)

	if (deleteSummaryError) {
		console.warn(
			`[USECASES_ONLY] Failed to delete existing use case summary for node ${nodeId}:`,
			deleteSummaryError,
		)
	}

	// Save use cases to database
	console.log(
		`[DEBUG] About to insert ${useCases.length} use cases for node: ${nodeId}`,
	)
	console.log(
		`[DEBUG] nodeId exists check: ${nodeId}, treeId: ${treeId}, teamId: ${teamId}`,
	)

	// Verify node exists before inserting
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

	for (let i = 0; i < useCases.length; i++) {
		const useCase = useCases[i]
		console.log(`[DEBUG] Inserting use case ${i + 1}/${useCases.length}:`, {
			id: useCase.id,
			node_id: nodeId,
			tree_id: treeId,
			product: useCase.product?.substring(0, 50),
			company_type: Array.isArray(useCase.company),
			company_length: useCase.company?.length,
			press_releases_type: Array.isArray(useCase.press_releases),
			press_releases_length: useCase.press_releases?.length,
			team_id: teamId,
		})

		const { data: insertedData, error: useCaseError } = await supabaseClient
			.from("node_use_cases")
			.insert({
				id: useCase.id,
				node_id: nodeId,
				tree_id: treeId,
				product: useCase.product,
				description: useCase.description,
				company: useCase.company || [],
				press_releases: useCase.press_releases || [],
				team_id: teamId,
				year: typeof useCase.year === "number" ? useCase.year : null,
			})
			.select()

		if (useCaseError) {
			console.error(`[USECASES_ONLY] Failed to save use case ${i + 1}:`, {
				error: useCaseError,
				message: useCaseError.message,
				details: useCaseError.details,
				hint: useCaseError.hint,
				code: useCaseError.code,
			})
			throw new Error(
				`Failed to save use case for node ${nodeId}: ${useCaseError.message}`,
			)
		}

		console.log(
			`[DEBUG] Successfully inserted use case ${i + 1}:`,
			insertedData,
		)
	}

	// Verify inserts by counting
	const { count: verifyCount, error: verifyError } = await supabaseClient
		.from("node_use_cases")
		.select("id", { count: "exact", head: true })
		.eq("node_id", nodeId)

	console.log(
		`[DEBUG] Verification count for node ${nodeId}: ${verifyCount} use cases`,
		{
			verifyError: verifyError?.message,
		},
	)

	console.log(
		`[USECASES_ONLY] Successfully saved ${useCases.length} use cases for node: ${nodeId}`,
	)

	// NOW generate summary AFTER data is saved
	// If this times out, at least the use case data is already in the database
	let useCaseSummary: string | null = null
	const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")

	if (OPENAI_API_KEY) {
		try {
			console.log(`[SUMMARY] Generating use case summary for node: ${nodeId}`)
			useCaseSummary = await generateUseCaseSummary(
				useCases,
				query,
				OPENAI_API_KEY,
				language,
			)
			console.log(
				`[SUMMARY] Successfully generated use case summary for node: ${nodeId}`,
			)

			// Save summary to database
			const { error: useCaseSummaryError } = await supabaseClient
				.from("node_usecases_summary")
				.upsert({
					node_id: nodeId,
					tree_id: treeId,
					user_id: null,
					team_id: teamId,
					summary: useCaseSummary,
					query: query,
					usecases_count: useCases.length,
				})

			if (useCaseSummaryError) {
				console.error(
					`[SUMMARY] Failed to save use case summary for node ${nodeId}:`,
					useCaseSummaryError,
				)
			} else {
				console.log(`[SUMMARY] Saved use case summary for node: ${nodeId}`)
			}
		} catch (summaryError) {
			console.error(
				`[SUMMARY] Error generating use case summary for node ${nodeId}:`,
				summaryError,
			)
			// Continue - use case data is already saved even if summary fails
		}
	} else {
		console.warn(
			`[SUMMARY] OpenAI API key not found, skipping use case summary generation`,
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
	// Always handle CORS first
	if (req.method === "OPTIONS") {
		return new Response("ok", { status: 200, headers: CORS })
	}

	try {
		console.log(`[USECASES_ONLY] Function started, method: ${req.method}`)

		const requestBody = await req.json()
		console.log(`[USECASES_ONLY] Received request for use cases enrichment`)

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

		// Validate required parameters
		if (
			!nodeId ||
			!treeId ||
			!enrichNode ||
			!query ||
			parentNodes === undefined ||
			!treeType
		) {
			console.error(`[USECASES_ONLY] Missing required parameters:`, {
				hasNodeId: !!nodeId,
				hasTreeId: !!treeId,
				hasEnrichNode: !!enrichNode,
				hasQuery: !!query,
				hasParentNodes: parentNodes !== undefined,
				hasTreeType: !!treeType,
			})
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
			console.error(`[USECASES_ONLY] Missing Supabase environment variables`)
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

		console.log(`[USECASES_ONLY] Built query: ${searchQuery}`)

		// Call API with timeout protection (130 seconds max to leave time for DB save)
		const marketImplRequest: SearchMarketImplRequest = {
			query: searchQuery,
			language: language ?? "Japanese",
		}
		let useCaseResult: SearchMarketImplResponse

		// API timeout in milliseconds, configurable via environment variable API_TIMEOUT_MS
		const API_TIMEOUT = Number(Deno.env.get("API_TIMEOUT_MS")) || 130000 // 130 seconds (leaving 20 seconds for DB operations)

		try {
			console.log(
				`[USECASES_ONLY] Calling API with ${API_TIMEOUT / 1000}s timeout`,
			)

			const apiCallPromise = callSearchMarketImplAPI(marketImplRequest)
			let timeoutId: number | undefined
			const timeoutPromise = new Promise<never>((_, reject) => {
				timeoutId = setTimeout(
					() => reject(new Error("API call timeout")),
					API_TIMEOUT,
				)
			})

			useCaseResult = await Promise.race([apiCallPromise, timeoutPromise])
			// Clear the timeout if the API call wins the race
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId)
			}

			console.log(`[USECASES_ONLY] API call succeeded within timeout`)
		} catch (error: any) {
			console.error(
				"[USECASES_ONLY] Use cases API failed or timed out:",
				error.message,
			)

			// Return 202 to indicate we accepted the request but it's taking too long
			return new Response(
				JSON.stringify({
					status: "timeout",
					message:
						"External API call is taking too long. Please try again or check the API performance.",
					nodeId,
					enrichNode,
					error: error.message,
					timestamp: new Date().toISOString(),
				}),
				{
					status: 202,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		const useCases = useCaseResult.use_cases || []
		console.log(
			`[USECASES_ONLY] Got ${useCases.length} use cases, saving to database`,
		)

		// Save use cases to database (we have ~20 seconds left)
		await saveNodeUseCasesWithSummary(
			sb,
			nodeId,
			treeId,
			useCases,
			team_id || null,
			searchQuery,
			language ?? "Japanese",
		)

		const response = {
			success: true,
			nodeId,
			enrichNode,
			results: {
				useCases: {
					count: useCases.length,
					saved: true,
				},
			},
			timestamp: new Date().toISOString(),
		}

		console.log(
			`[USECASES_ONLY] Completed use cases enrichment for node: ${enrichNode}`,
			response,
		)

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { ...CORS, "Content-Type": "application/json" },
		})
	} catch (err: any) {
		console.error("=== USE CASES ENRICHMENT ERROR ===")
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
