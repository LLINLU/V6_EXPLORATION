// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

/* ====== CORS ====== */ const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Max-Age": "86400",
}
/* ====== logging ====== */ function log(...args: unknown[]) {
	console.log("[search-scenario-articles]", ...args)
}
function logErr(...args: unknown[]) {
	console.error("[search-scenario-articles][ERROR]", ...args)
}
/* ====== helpers ====== */
type Paper = Record<string, any>
const PAPER_SUMMARY_LIMIT = 5

function normalizeLanguage(language: unknown) {
	const value = String(language ?? "").toLowerCase()
	return value.startsWith("en") ? "English" : "Japanese"
}

async function callSearchArticleAPI(query: string, language: string) {
	const params = new URLSearchParams({
		query,
		language: normalizeLanguage(language),
	})
	const url = `${getSearchApiBaseUrl("stg")}/v5/search_article?${params.toString()}`
	const res = await fetch(url, {
		method: "GET",
		headers: {
			Authorization: makeBasicAuthHeader(),
			Accept: "text/event-stream",
		},
	})
	if (!res.ok) {
		const text = await res.text().catch(() => "")
		logErr("search_article failed", {
			status: res.status,
			url,
			body_preview: text.slice(0, 500),
		})
		throw new Error(`search_article API ${res.status}: ${text}`)
	}
	const reader = res.body?.getReader()
	if (!reader) throw new Error("No response body from search API")
	const decoder = new TextDecoder()
	let buffer = ""
	let articles: Paper[] = []
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
				articles = parsed.data?.articles ?? parsed.data?.papers ?? []
			} else if (parsed.type === "error") {
				throw new Error(
					parsed.message_en ?? parsed.message_ja ?? "Search API error",
				)
			}
		}
	}
	return {
		papers: articles,
		total_count: articles.length,
	}
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
 * Generate a cited paper summary for scenario selection enrichment.
 */ async function generatePaperSummaryOrNull(
	papers: Paper[],
	query: string,
	language = "Japanese",
) {
	const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
	if (!openaiApiKey || papers.length === 0) return null

	const outputLanguage = normalizeLanguage(language)
	const isEnglish = outputLanguage === "English"
	const topPapers = [...papers]
		.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
		.slice(0, PAPER_SUMMARY_LIMIT)
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
				`Authors: ${paper.authors ?? "N/A"}`,
				`Journal: ${paper.journal ?? "N/A"}`,
				`Date: ${paper.date ?? "N/A"}`,
				`Citations: ${paper.citations ?? "N/A"}`,
				`Abstract: ${paper.abstract ?? "N/A"}`,
			].join("\n"),
		)
		.join("\n\n")

	const systemContent = isEnglish
		? "You are a research analyst specializing in academic paper summarization. Write evidence-grounded Markdown summaries in English. Inline citations like [1] are required in body paragraphs. Always end with a Sources section using the provided source list. Simple <div> section wrappers are allowed; other HTML tags are not allowed."
		: "あなたは学術論文の要約を専門とする研究アナリストです。Markdownを中心に、根拠に基づく日本語サマリーを作成してください。本文中の引用 [1] を必須とし、最後に提供された出典一覧を使って「出典」セクションを付けてください。主要セクションを単純な<div>...</div>で囲むことは許可しますが、それ以外のHTMLタグは使用しないでください。"

	const prompt = isEnglish
		? `### Output Requirements
1. Start directly with the summary.
2. Use #### headings for research themes, methods, findings, and implications.
3. Every paragraph and important claim must include inline paper citations using Citation IDs such as [1] or [2].
4. Use Markdown formatting. You may wrap major sections in simple <div>...</div> blocks, but do not use any other HTML tags.
5. Always end with a final section titled "#### Sources" and list the Source List numbers and names exactly as provided. Put each source name on the line after its [1], [2], etc. number.
6. Write about 500-700 words in English and do not cite sources outside the provided papers.

Query: ${query}

Papers:
${papersText}

Source List:
${sourceListText}`
		: `### 出力要件
1. 最初から内容に入り、解説的な前置きは書かない。
2. #### 見出しを使って、研究テーマ・方法論・主要知見・示唆を構造化する。
3. 本文中の各段落・重要な主張には、根拠となる論文の Citation ID を [1]、[2] のように文中引用として必ず付ける。
4. Markdownを中心に使用すること。主要セクションを単純な<div>...</div>で囲むことは許可するが、それ以外のHTMLタグは使用しない。
5. 出力末尾に必ず「#### 出典」セクションを付け、下記 Source List の番号と名称をそのまま列挙する。形式は [1] の次行に出典名、[2] の次行に出典名、という形にする。
6. 日本語で600字程度。提供された論文以外は出典として使わない。

Query: ${query}

Papers:
${papersText}

Source List:
${sourceListText}`

	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${openaiApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "gpt-4o",
			messages: [
				{ role: "system", content: systemContent },
				{ role: "user", content: prompt },
			],
			max_tokens: 1400,
			temperature: 0.3,
		}),
	})

	if (!response.ok) {
		logErr("OpenAI paper summary failed", { status: response.status })
		return null
	}
	const result = await response.json()
	return result.choices?.[0]?.message?.content?.trim() || null
}
/**
 * Save papers (scoped delete by node_id + tree_id)
 */ async function saveNodePapers(
	sb: any,
	nodeId: string,
	treeId: string,
	papers: Paper[],
	teamId: string | null,
	queryForSummary: string,
	language: string,
) {
	// delete existing for this node+tree
	const del1 = await sb
		.from("node_papers")
		.delete()
		.eq("node_id", nodeId)
		.eq("tree_id", treeId)
	if (del1.error)
		throw new Error(`Delete node_papers failed: ${del1.error.message}`)
	const del2 = await sb
		.from("node_papers_summary")
		.delete()
		.eq("node_id", nodeId)
		.eq("tree_id", treeId)
	if (del2.error)
		throw new Error(`Delete node_papers_summary failed: ${del2.error.message}`)
	// verify node exists (optional but helpful)
	const { data: nodeExists, error: nodeErr } = await sb
		.from("tree_nodes")
		.select("id")
		.eq("id", nodeId)
		.maybeSingle()
	if (nodeErr || !nodeExists) {
		throw new Error(`Node ${nodeId} does not exist in tree_nodes`)
	}
	if (!papers.length) return
	const rows = papers.map((p: Paper) => ({
		id: p.id ?? crypto.randomUUID(),
		node_id: nodeId,
		tree_id: treeId,
		title: p.title,
		authors: p.authors,
		journal: p.journal,
		tags: p.tags,
		abstract: p.abstract,
		date: p.date,
		citations: p.citations,
		region: p.region === "domestic" ? "domestic" : "international",
		doi: p.doi,
		url: p.url,
		team_id: teamId,
		score: p.score,
	}))
	const { error: insErr } = await sb.from("node_papers").insert(rows)
	if (insErr) throw new Error(`Failed to insert node_papers: ${insErr.message}`)
	const summary = await generatePaperSummaryOrNull(
		papers,
		queryForSummary,
		language,
	)
	if (summary) {
		const up = await sb.from("node_papers_summary").upsert({
			node_id: nodeId,
			tree_id: treeId,
			user_id: null,
			team_id: teamId,
			summary,
			query: queryForSummary,
			papers_count: Math.min(papers.length, PAPER_SUMMARY_LIMIT),
		})
		if (up.error)
			throw new Error(
				`Failed to upsert node_papers_summary: ${up.error.message}`,
			)
	}
}
/* ====== handler ====== */ serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", {
			status: 200,
			headers: CORS,
		})
	}
	if (req.method !== "POST") {
		return new Response(
			JSON.stringify({
				error: "Method Not Allowed",
			}),
			{
				status: 405,
				headers: {
					...CORS,
					"Content-Type": "application/json",
				},
			},
		)
	}
	log("request", {
		method: req.method,
		hasAuth: !!req.headers.get("Authorization"),
		url: req.url,
	})
	try {
		const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
		const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
		if (!SUPABASE_URL || !SERVICE_ROLE)
			throw new Error("Missing Supabase env vars")
		const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
			auth: {
				persistSession: false,
			},
		})
		const bodyRaw = await req.text()
		let body
		try {
			body = JSON.parse(bodyRaw)
		} catch {
			return new Response(
				JSON.stringify({
					error: "Invalid JSON body",
				}),
				{
					status: 400,
					headers: {
						...CORS,
						"Content-Type": "application/json",
					},
				},
			)
		}
		log("payload", {
			treeId: body?.treeId ?? body?.tree_id,
			nodeId: body?.nodeId ?? body?.node_id,
			scenarioName: (body?.scenarioName ?? body?.scenario_name ?? "").slice(
				0,
				80,
			),
			query: (body?.query ?? "").slice(0, 120),
			treeType: body?.treeType,
			team_id: body?.team_id ?? null,
			language: body?.language ?? null,
		})
		const treeId = body.treeId ?? body.tree_id
		const nodeId = body.nodeId ?? body.node_id
		const scenarioName = body.scenarioName ?? body.scenario_name ?? ""
		const language = normalizeLanguage(body.language ?? "Japanese")
		log("normalized language", { language })
		if (!treeId || !nodeId || !body.query) {
			return new Response(
				JSON.stringify({
					error: "Missing required parameters",
				}),
				{
					status: 400,
					headers: {
						...CORS,
						"Content-Type": "application/json",
					},
				},
			)
		}
		// build query (same behavior you had)
		const searchQuery = `${body.query} ${scenarioName}`.trim()
		// fetch papers
		const paperRes = await callSearchArticleAPI(searchQuery, language)
		const papers = paperRes.papers ?? []
		// write to DB (even if empty, we already deleted old rows)
		await saveNodePapers(
			sb,
			nodeId,
			treeId,
			papers,
			body.team_id ?? null,
			searchQuery,
			language,
		)
		const topTitles = papers
			.slice(0, 3)
			.map((p) => p?.title)
			.filter((t) => typeof t === "string" && t.length > 0)
		return new Response(
			JSON.stringify({
				paperCount: papers.length,
				topTitles,
				data: papers,
			}),
			{
				status: 200,
				headers: {
					...CORS,
					"Content-Type": "application/json",
				},
			},
		)
	} catch (err: any) {
		logErr("handler error", {
			error: err?.message ?? String(err),
		})
		return new Response(
			JSON.stringify({
				error: err?.message ?? "unknown",
			}),
			{
				status: 500,
				headers: {
					...CORS,
					"Content-Type": "application/json",
				},
			},
		)
	}
})
