// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

function mapV5ResultToTrlResponse(result) {
	const techScores = result.table?.technology_scores ?? []
	const paper_trl = techScores
		.filter((t) => t.article_trl != null)
		.map((t) => ({
			technology_name: t.technology,
			TRL_score: t.article_trl,
			reason: "",
			source: "article",
		}))
	const market_trl = techScores
		.filter((t) => t.market_trl != null)
		.map((t) => ({
			technology_name: t.technology,
			TRL_score: t.market_trl,
			reason: "",
			source: "market",
		}))
	const allScores = [...paper_trl, ...market_trl]
		.map((t) => t.TRL_score)
		.filter((score) => score >= 1 && score <= 9)
	const histMap = {}
	for (const score of allScores) {
		histMap[score] = (histMap[score] ?? 0) + 1
	}
	const hist_data = Object.entries(histMap).map(([trl, count]) => ({
		trl: Number(trl),
		count,
	}))
	const count = allScores.length
	const average_trl =
		count > 0 ? allScores.reduce((a, b) => a + b, 0) / count : 0
	const std_dev =
		count > 1
			? Math.sqrt(
					allScores.reduce((sum, score) => {
						return sum + (score - average_trl) ** 2
					}, 0) / count,
				)
			: 0
	return {
		paper_trl,
		market_trl,
		hist_data,
		statistics: {
			average_trl,
			std_dev,
			count,
		},
	}
}
function emptyTrlResponse() {
	return {
		paper_trl: [],
		market_trl: [],
		hist_data: [],
		statistics: {
			average_trl: 0,
			std_dev: 0,
			count: 0,
		},
	}
}
async function fetchNodeEnrichmentData(sb, nodeId, treeId) {
	const [nodeRes, treeRes, papersRes, patentsRes, useCasesRes] =
		await Promise.all([
			sb
				.from("tree_nodes")
				.select("id, name, description, level")
				.eq("id", nodeId)
				.single(),
			sb
				.from("technology_trees")
				.select("search_theme")
				.eq("id", treeId)
				.single(),
			sb
				.from("node_papers")
				.select(
					"id, node_id, tree_id, title, authors, journal, tags, abstract, date, citations, region, doi, url, score",
				)
				.eq("node_id", nodeId)
				.limit(10),
			sb
				.from("node_patents")
				.select(
					"id, node_id, family_id, title, abstract, earliest_priority_date, countries, ipc_prefixes, ipc_subclasses, cpc, similarity_score, assignee, inventor",
				)
				.eq("node_id", nodeId)
				.limit(10),
			sb
				.from("node_use_cases")
				.select(
					"id, node_id, tree_id, description, product, company, press_releases, year",
				)
				.eq("node_id", nodeId)
				.limit(10),
		])
	if (nodeRes.error || !nodeRes.data) {
		throw new Error(
			`Failed to load node: ${nodeRes.error?.message ?? "not found"}`,
		)
	}
	if (treeRes.error) {
		throw new Error(`Failed to load tree: ${treeRes.error.message}`)
	}
	if (papersRes.error) {
		throw new Error(`Failed to load papers: ${papersRes.error.message}`)
	}
	if (patentsRes.error) {
		throw new Error(`Failed to load patents: ${patentsRes.error.message}`)
	}
	if (useCasesRes.error) {
		throw new Error(`Failed to load use cases: ${useCasesRes.error.message}`)
	}
	return {
		node: nodeRes.data,
		userQuery: treeRes.data?.search_theme ?? "",
		papers: papersRes.data ?? [],
		patents: patentsRes.data ?? [],
		useCases: useCasesRes.data ?? [],
	}
}
async function callAnalyzeTrlAPI(sb, nodeId, treeId, language = "Japanese") {
	console.log(`[TRL] Fetching enrichment data for node: ${nodeId}`)
	const { node, userQuery, papers, patents, useCases } =
		await fetchNodeEnrichmentData(sb, nodeId, treeId)
	console.log(
		`[TRL] articles=${papers.length} patents=${patents.length} markets=${useCases.length}`,
	)
	if (papers.length === 0 && patents.length === 0 && useCases.length === 0) {
		console.warn(
			`[TRL] Skipping analyze_trl for node ${nodeId}: no papers, patents, or use cases are available yet`,
		)
		return emptyTrlResponse()
	}
	const payload = {
		user_query: userQuery || node.name,
		scenario: {
			scenario_name: node.name,
			scenario_description: node.description ?? "",
			tech_strength: [],
			application_target: "",
			customer_target: [],
			quantitative_notes: "",
		},
		technologies: [],
		articles: papers.map((paper) => ({
			id: paper.id,
			title: paper.title,
			authors: paper.authors,
			journal: paper.journal,
			tags: Array.isArray(paper.tags) ? paper.tags : [],
			abstract: paper.abstract,
			date: paper.date ?? "",
			citations: paper.citations ?? 0,
			region: paper.region,
			doi: paper.doi ?? "",
			url: paper.url ?? "",
			score: paper.score ?? 0,
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
		})),
		patents: patents.map((patent) => ({
			family_id: patent.family_id,
			title: patent.title,
			abstract: patent.abstract ?? "",
			earliest_priority_date: patent.earliest_priority_date ?? "",
			countries: Array.isArray(patent.countries) ? patent.countries : [],
			ipc_prefixes: Array.isArray(patent.ipc_prefixes)
				? patent.ipc_prefixes
				: [],
			ipc_subclasses: Array.isArray(patent.ipc_subclasses)
				? patent.ipc_subclasses
				: [],
			cpc: Array.isArray(patent.cpc) ? patent.cpc : [],
			similarity_score: patent.similarity_score ?? 0,
			assignee: Array.isArray(patent.assignee) ? patent.assignee : [],
			inventor: Array.isArray(patent.inventor) ? patent.inventor : [],
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
		})),
		markets: useCases.map((useCase) => ({
			id: useCase.id,
			product: useCase.product,
			company: useCase.company ?? [],
			description: useCase.description,
			press_releases: useCase.press_releases ?? [],
			year: useCase.year ?? 0,
			stage: "commercial",
			queries: [],
			query_hits: [],
		})),
		language,
	}
	console.log(`[TRL] Calling v5/analyze_trl API for node: ${nodeId}`)
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), 240000)
	try {
		const res = await fetch(`${getSearchApiBaseUrl("stg")}/v5/analyze_trl`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: makeBasicAuthHeader(),
			},
			body: JSON.stringify(payload),
			signal: controller.signal,
		})
		clearTimeout(timeoutId)
		if (!res.ok) {
			const text = await res.text().catch(() => "")
			console.error(
				`[TRL] API call failed with status ${res.status}:`,
				text.slice(0, 500),
			)
			throw new Error(`analyze_trl API ${res.status}: ${text}`)
		}
		const reader = res.body?.getReader()
		if (!reader) throw new Error("No response body from TRL API")
		const decoder = new TextDecoder()
		let buffer = ""
		let finalResult = null
		while (true) {
			const { done, value } = await reader.read()
			if (done) break
			buffer += decoder.decode(value, {
				stream: true,
			})
			const lines = buffer.split("\n")
			buffer = lines.pop() ?? ""
			for (const line of lines) {
				const trimmed = line.trim()
				if (!trimmed.startsWith("data:")) continue
				const jsonStr = trimmed.slice(5).trim()
				if (!jsonStr) continue
				let parsed
				try {
					parsed = JSON.parse(jsonStr)
				} catch {
					continue
				}
				if (parsed.type === "result" && parsed.data) {
					finalResult = parsed.data
				}
			}
		}
		if (!finalResult) {
			throw new Error("No result event received from analyze_trl SSE stream")
		}
		console.log("[TRL] v5/analyze_trl response received successfully")
		return mapV5ResultToTrlResponse(finalResult)
	} catch (error) {
		clearTimeout(timeoutId)
		if (error.name === "AbortError") {
			throw new Error("TRL API call timed out after 4 minutes")
		}
		throw error
	}
}
async function saveNodeMarketInfo(
	supabaseClient,
	nodeId,
	treeId,
	trlData,
	teamId,
	userId,
) {
	const marketInfoToInsert = {
		node_id: nodeId,
		tree_id: treeId,
		paper_trl: trlData.paper_trl || [],
		market_trl: trlData.market_trl || [],
		hist_data: trlData.hist_data || [],
		statistics: trlData.statistics || {},
		team_id: teamId,
		user_id: userId,
	}
	console.log(
		"[TRL] Saving to database:",
		JSON.stringify(marketInfoToInsert, null, 2),
	)
	const { error } = await supabaseClient
		.from("node_marketinfo")
		.upsert(marketInfoToInsert, {
			onConflict: "node_id",
		})
	if (error) {
		console.error("[TRL] Database save error:", error)
		throw new Error(`Failed to save TRL data: ${error.message}`)
	}
	console.log(`[TRL] Successfully saved TRL data for node: ${nodeId}`)
}
async function checkExistingTrlData(supabaseClient, nodeId) {
	const { data, error } = await supabaseClient
		.from("node_marketinfo")
		.select("id")
		.eq("node_id", nodeId)
		.single()
	if (error && error.code !== "PGRST116") {
		console.error("[TRL] Error checking existing TRL data:", error)
	}
	return !!data
}
const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
}
addEventListener("beforeunload", (ev) => {
	console.log("[EDGE] beforeunload - reason:", ev?.detail?.reason ?? "unknown")
})
Deno.serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", {
			status: 200,
			headers: CORS,
		})
	}
	try {
		const requestBody = await req.json()
		console.log("[TRL] ====== START TRL CALCULATION ======")
		console.log("[TRL] Received request:", JSON.stringify(requestBody, null, 2))
		const {
			nodeId,
			treeId,
			enrichNode,
			query,
			parentNodes,
			team_id,
			user_id,
			treeType,
			language,
		} = requestBody
		if (
			!nodeId ||
			!treeId ||
			!enrichNode ||
			!query ||
			parentNodes === undefined ||
			!treeType
		) {
			console.error("[TRL] Missing required parameters")
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
					headers: {
						...CORS,
						"Content-Type": "application/json",
					},
				},
			)
		}
		const supabaseUrl = Deno.env.get("SUPABASE_URL")
		const supabaseRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
		if (!supabaseUrl || !supabaseRoleKey) {
			console.error("[TRL] Missing Supabase environment variables")
			throw new Error("Server mis-config (Supabase env vars)")
		}
		const sb = createClient(supabaseUrl, supabaseRoleKey)
		const jobId = crypto.randomUUID()
		EdgeRuntime.waitUntil(
			(async () => {
				try {
					console.log(`[TRL/bg] start job=${jobId} node=${nodeId}`)
					console.log(
						`[TRL/bg] Checking for existing TRL data for node: ${nodeId}`,
					)
					const hasExistingData = await checkExistingTrlData(sb, nodeId)
					if (hasExistingData) {
						console.log(
							`[TRL/bg] TRL data already exists for node: ${nodeId}, will update...`,
						)
					}
					console.log(`[TRL/bg] Calling external TRL API for node: ${nodeId}`)
					const trlResult = await callAnalyzeTrlAPI(
						sb,
						nodeId,
						treeId,
						language ?? "Japanese",
					)
					const hasTrlData =
						(trlResult.paper_trl && trlResult.paper_trl.length > 0) ||
						(trlResult.market_trl && trlResult.market_trl.length > 0) ||
						(trlResult.hist_data && trlResult.hist_data.length > 0) ||
						trlResult.statistics.count > 0
					if (!hasTrlData) {
						console.warn(`[TRL/bg] No TRL data returned for node: ${nodeId}`)
						return
					}
					console.log(
						`[TRL/bg] Saving TRL data to database for node: ${nodeId}`,
					)
					await saveNodeMarketInfo(
						sb,
						nodeId,
						treeId,
						trlResult,
						team_id || null,
						user_id || null,
					)
					console.log(`[TRL/bg] done job=${jobId} node=${nodeId}`)
				} catch (error) {
					console.error(
						`[TRL/bg] failed job=${jobId} node=${nodeId}:`,
						error?.message ?? error,
					)
				}
			})(),
		)
		const response = {
			accepted: true,
			status: "processing",
			jobId,
			nodeId,
			hint: "results will be saved to node_marketinfo when ready",
			timestamp: new Date().toISOString(),
		}
		console.log(`[TRL] Background job queued - jobId=${jobId}, node=${nodeId}`)
		return new Response(JSON.stringify(response), {
			status: 202,
			headers: {
				...CORS,
				"Content-Type": "application/json",
			},
		})
	} catch (err) {
		console.error("[TRL] ====== TRL CALCULATION ERROR ======")
		console.error("[TRL] Error details:", {
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
				headers: {
					...CORS,
					"Content-Type": "application/json",
				},
			},
		)
	}
})
