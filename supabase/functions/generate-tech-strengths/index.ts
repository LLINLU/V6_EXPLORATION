// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

/**
 * Purpose
 * - Create technology_trees row (treeId)
 * - Insert ONLY the root node in tree_nodes (saved as the query)
 * - Generate + store technical_strengths (Python v5 SSE)
 * - Return tech strengths + treeId
 * - Console logs: minimal + useful
 */

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY =
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error(
		"[tree+tech-strengths] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
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
			if (evt.type === "result" && evt.data?.tech_strengths)
				lastPayload = evt.data
		} catch {
			// ignore partial chunks
		}
	}

	if (!lastPayload?.tech_strengths) return []
	return lastPayload.tech_strengths as TechStrength[]
}

serve(async (req) => {
	if (req.method === "OPTIONS")
		return new Response("ok", { status: 200, headers: CORS })
	if (req.method !== "POST") {
		return new Response("Method Not Allowed", { status: 405, headers: CORS })
	}

	try {
		const body = await req.json().catch(() => ({}))
		const {
			treeId: rawTreeId = null,
			searchTheme,
			description = "",
			team_id: rawTeamId = null,
			user_id: rawUserId = null,
			language = "English",
			mode: rawMode = "TED",
		} = body as {
			treeId?: string | null
			searchTheme?: string
			description?: string
			team_id?: string | null
			user_id?: string | null
			language?: string
			mode?: string | null
		}

		if (!searchTheme || typeof searchTheme !== "string") {
			return new Response(
				JSON.stringify({ error: "searchTheme is required" }),
				{
					status: 400,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		// Resolve user_id and team_id — prefer values from body, fall back to JWT+DB
		let user_id: string | null = rawUserId || null
		let team_id: string | null = rawTeamId || null
		if (!user_id || !team_id) {
			const authHeader = req.headers.get("authorization")
			if (authHeader?.startsWith("Bearer ")) {
				const token = authHeader.slice(7)
				const {
					data: { user },
				} = await supabaseAdmin.auth.getUser(token)
				if (user && !user_id) user_id = user.id
			}
			if (user_id && !team_id) {
				const { data: ud } = await supabaseAdmin
					.from("v_user_details")
					.select("team_id")
					.eq("user_id", user_id)
					.single()
				if (ud?.team_id) team_id = ud.team_id
			}
			if (!user_id)
				console.warn(
					"[tree+tech-strengths] Could not resolve user_id from body or JWT",
				)
			if (!team_id)
				console.warn(
					"[tree+tech-strengths] Could not resolve team_id for user",
					user_id,
				)
		}

		console.log("[START] searchTheme:", searchTheme)

		const treeMode = rawMode === "REPORT" ? "REPORT" : "TED"

		// 1) Create or update tree
		const treeName = `Search Theme: ${searchTheme}`
		let treeId = rawTreeId || null

		if (treeId) {
			const { error: treeUpdateErr } = await supabaseAdmin
				.from("technology_trees")
				.update({
					description,
					search_theme: searchTheme,
					mode: treeMode,
					...(team_id ? { team_id } : {}),
					...(user_id ? { user_id } : {}),
				})
				.eq("id", treeId)

			if (treeUpdateErr) {
				console.error("[ERROR] Tree update failed:", treeUpdateErr)
				return new Response(
					JSON.stringify({
						error: "Failed to update tree",
						details: treeUpdateErr,
						treeId,
					}),
					{
						status: 500,
						headers: { ...CORS, "Content-Type": "application/json" },
					},
				)
			}
		} else {
			const { data: newTree, error: treeErr } = await supabaseAdmin
				.from("technology_trees")
				.insert({
					name: treeName,
					description,
					search_theme: searchTheme,
					reasoning: `Generated tech strengths for ${searchTheme}`,
					mode: treeMode,
					team_id,
					user_id,
				})
				.select("id")
				.single()

			if (treeErr || !newTree) {
				console.error("[ERROR] Tree creation failed:", treeErr)
				return new Response(
					JSON.stringify({
						error: "Failed to create tree",
						details: treeErr,
					}),
					{
						status: 500,
						headers: { ...CORS, "Content-Type": "application/json" },
					},
				)
			}

			treeId = newTree.id as string
		}

		console.log("[OK] treeId:", treeId)

		const { data: existingRoot, error: rootLookupErr } = await supabaseAdmin
			.from("tree_nodes")
			.select("id")
			.eq("tree_id", treeId)
			.eq("level", 0)
			.maybeSingle()

		if (rootLookupErr) {
			console.error("[ERROR] Root node lookup failed:", rootLookupErr)
			return new Response(
				JSON.stringify({
					error: "Failed to check root node",
					details: rootLookupErr,
					treeId,
				}),
				{
					status: 500,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		let rootNodeId = existingRoot?.id as string | undefined

		if (!existingRoot) {
			// 2) Save the query as the ROOT node (and only root node)
			rootNodeId = crypto.randomUUID()

			const { error: rootErr } = await supabaseAdmin.from("tree_nodes").insert({
				id: rootNodeId,
				tree_id: treeId,
				parent_id: null,
				name: treeName,
				description: description ?? "",
				axis: "Root" as any,
				level: 0,
				children_count: 0,
				team_id,
				user_id,
			})

			if (rootErr) {
				console.error("[ERROR] Root node insert failed:", rootErr)
				return new Response(
					JSON.stringify({
						error: "Failed to create root node",
						details: rootErr,
						treeId,
					}),
					{
						status: 500,
						headers: { ...CORS, "Content-Type": "application/json" },
					},
				)
			}

			console.log("[OK] rootNodeId:", rootNodeId)
		}

		// 3) Call Python SSE for technical strengths
		console.log("[CALL] /v5/generate/technical_strength")

		const pythonResp = await fetch(
			`${getSearchApiBaseUrl("stg")}/v5/generate/technical_strength`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: makeBasicAuthHeader(),
				},
				body: JSON.stringify({
					user_query: searchTheme,
					user_context: description ?? "",
					language,
				}),
			},
		)

		if (!pythonResp.ok) {
			const text = await pythonResp.text().catch(() => "")
			console.error("[ERROR] Python API:", pythonResp.status, text)
			return new Response(
				JSON.stringify({
					error: "Python API call failed",
					status: pythonResp.status,
					body: text,
					treeId,
				}),
				{
					status: 502,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		const sseText = await pythonResp.text()
		const techStrengths = extractTechStrengthsFromSSE(sseText)

		console.log("[OK] strengths parsed:", techStrengths.length)
		console.log(
			"[DEBUG] strength names:",
			techStrengths.map((s) => s.strength_name),
		)

		if (!techStrengths.length) {
			return new Response(
				JSON.stringify({
					error: "No tech_strengths in Python response",
					treeId,
				}),
				{
					status: 500,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		// 4) Replace strengths for this tree
		const { error: deleteErr } = await supabaseAdmin
			.from("technical_strengths")
			.delete()
			.eq("tree_id", treeId)

		if (deleteErr) {
			console.error("[ERROR] delete technical_strengths failed:", deleteErr)
			return new Response(
				JSON.stringify({
					error: "Failed to clear existing technical_strengths",
					details: deleteErr,
					treeId,
				}),
				{
					status: 500,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		const rows = techStrengths.map((s, idx) => ({
			tree_id: treeId,
			ordinal: idx + 1,
			strength_name: s.strength_name,
			description: s.description,
			potential_applications: s.potential_applications,
		}))

		const { error: insertErr } = await supabaseAdmin
			.from("technical_strengths")
			.insert(rows)

		if (insertErr) {
			console.error("[ERROR] insert technical_strengths failed:", insertErr)
			return new Response(
				JSON.stringify({
					error: "Failed to insert technical_strengths",
					details: insertErr,
					treeId,
				}),
				{
					status: 500,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		console.log("[DONE] saved technical_strengths")

		return new Response(
			JSON.stringify({
				success: true,
				treeId,
				rootNodeId,
				tech_strengths: techStrengths,
			}),
			{ status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
		)
	} catch (err: any) {
		console.error("[FATAL]", err)
		return new Response(
			JSON.stringify({
				error: err.message ?? "Internal error",
				details: err.stack ?? null,
			}),
			{ status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
		)
	}
})
