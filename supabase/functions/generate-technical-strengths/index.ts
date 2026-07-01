// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Env vars:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - SEARCH_API_STG_URL / SEARCH_API_PROD_URL
// - SEARCH_API_USER / SEARCH_API_PASS
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY =
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error(
		"[tech-strengths] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
	)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false },
})

type TechStrength = {
	strength_name: string
	description: string
	potential_applications: string
}

function extractTechStrengthsFromSSE(sseText: string): TechStrength[] {
	const lines = sseText
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.startsWith("data: "))

	let lastPayload: any = null

	for (const line of lines) {
		const jsonPart = line.slice("data: ".length)
		if (!jsonPart || jsonPart === "[DONE]") continue

		try {
			const evt = JSON.parse(jsonPart)
			// FastAPI v5: { "type": "result", "data": { "tech_strengths": [...] } }
			if (evt.type === "result" && evt.data?.tech_strengths) {
				lastPayload = evt.data
			}
		} catch {
			// ignore partial chunks
		}
	}

	if (!lastPayload || !Array.isArray(lastPayload.tech_strengths)) {
		return []
	}
	return lastPayload.tech_strengths as TechStrength[]
}

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { status: 200, headers: CORS })
	}

	if (req.method !== "POST") {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: CORS,
		})
	}

	try {
		const body = await req.json().catch(() => ({}))
		const { treeId, language = "English" } = body as {
			treeId?: string
			language?: string
		}

		if (!treeId) {
			return new Response(JSON.stringify({ error: "treeId is required" }), {
				status: 400,
				headers: { ...CORS, "Content-Type": "application/json" },
			})
		}

		// 1) Load tree metadata (to get user_query & user_context)
		const { data: tree, error: treeError } = await supabaseAdmin
			.from("technology_trees")
			.select("id, search_theme, description")
			.eq("id", treeId)
			.single()

		if (treeError || !tree) {
			console.error("[tech-strengths] Tree not found:", treeError)
			return new Response(
				JSON.stringify({ error: "Tree not found", details: treeError }),
				{
					status: 404,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		const userQuery = tree.search_theme as string
		const userContext = (tree.description ?? "") as string

		// 2) Call Python v5 /v5/generate/technical_strength (SSE)
		const pythonResp = await fetch(
			`${getSearchApiBaseUrl("stg")}/v5/generate/technical_strength`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: makeBasicAuthHeader(),
				},
				body: JSON.stringify({
					user_query: userQuery,
					user_context: userContext,
					language,
				}),
			},
		)

		if (!pythonResp.ok) {
			const text = await pythonResp.text().catch(() => "")
			console.error(
				"[tech-strengths] Python API error:",
				pythonResp.status,
				text,
			)
			return new Response(
				JSON.stringify({
					error: "Python API call failed",
					status: pythonResp.status,
					body: text,
				}),
				{
					status: 502,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		const sseText = await pythonResp.text()
		const techStrengths = extractTechStrengthsFromSSE(sseText)

		if (!techStrengths.length) {
			console.error("[tech-strengths] No tech_strengths parsed from SSE")
			return new Response(
				JSON.stringify({ error: "No tech_strengths in Python response" }),
				{
					status: 500,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		// 3) Clear existing strengths for this tree
		const { error: deleteError } = await supabaseAdmin
			.from("technical_strengths")
			.delete()
			.eq("tree_id", treeId)

		if (deleteError) {
			console.error("[tech-strengths] Failed to delete old rows:", deleteError)
			return new Response(
				JSON.stringify({
					error: "Failed to clear existing technical_strengths",
					details: deleteError,
				}),
				{
					status: 500,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		// 4) Insert fresh strengths
		const rows = techStrengths.map((s, index) => ({
			tree_id: treeId,
			ordinal: index + 1,
			strength_name: s.strength_name,
			description: s.description,
			potential_applications: s.potential_applications,
			// *_t translation columns can be filled later by another step
		}))

		const { data: inserted, error: insertError } = await supabaseAdmin
			.from("technical_strengths")
			.insert(rows)
			.select("*")
			.order("ordinal", { ascending: true })

		if (insertError) {
			console.error("[tech-strengths] Failed to insert rows:", insertError)
			return new Response(
				JSON.stringify({
					error: "Failed to insert technical_strengths",
					details: insertError,
				}),
				{
					status: 500,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		return new Response(
			JSON.stringify({
				success: true,
				treeId,
				count: inserted?.length ?? 0,
				strengths: inserted,
			}),
			{
				status: 200,
				headers: { ...CORS, "Content-Type": "application/json" },
			},
		)
	} catch (err: any) {
		console.error("[tech-strengths] Unhandled error:", err)
		return new Response(
			JSON.stringify({
				error: err.message ?? "Internal error",
				details: err.stack ?? null,
			}),
			{
				status: 500,
				headers: { ...CORS, "Content-Type": "application/json" },
			},
		)
	}
})
