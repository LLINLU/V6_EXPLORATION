// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY =
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error(
		"[generate-tree-from-v5] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
	)
}
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false },
})

async function callTreesEndpoint(payload: any): Promise<any> {
	const response = await fetch(
		`${getSearchApiBaseUrl("stg")}/v5/generate/trees`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: makeBasicAuthHeader(),
			},
			body: JSON.stringify(payload),
		},
	)

	if (!response.ok) {
		const errorText = await response.text()
		throw new Error(`Python /v5/generate/trees error: ${errorText}`)
	}

	const reader = response.body?.getReader()
	if (!reader) {
		throw new Error("Failed to read SSE response body")
	}

	const decoder = new TextDecoder()
	let done = false
	let treeResult: any = null
	let buffer = ""

	while (!done) {
		const { value, done: readerDone } = await reader.read()
		done = readerDone

		if (value) {
			buffer += decoder.decode(value, { stream: true })

			const lines = buffer.split("\n")
			buffer = lines.pop() ?? "" // keep last partial line (if any)

			for (const rawLine of lines) {
				const line = rawLine.trim()
				if (!line.startsWith("data: ")) continue

				const jsonPart = line.slice("data: ".length)
				if (!jsonPart || jsonPart === "[DONE]") continue

				try {
					const event = JSON.parse(jsonPart)
					console.log("[generate-tree-from-v5] SSE event:", event.type)
					if (event.type === "result" && event.data?.tree) {
						treeResult = event.data.tree
					}
				} catch (err) {
					// If parsing fails, prepend back to buffer to allow completion with next chunk
					buffer = `${rawLine}\n${buffer}`
					console.error(
						"[generate-tree-from-v5] Failed to parse SSE chunk (will retry with more data):",
						err,
					)
				}
			}
		}
	}

	if (!treeResult) {
		throw new Error("No tree result received from /v5/generate/trees")
	}

	return treeResult
}

/**
 * Process a single scenario: call Python API, parse response, insert nodes into DB.
 * This runs in the background after the HTTP response has been sent.
 */
async function processScenario(
	scenarioNode: any,
	tree_id: string,
	treeMeta: any,
	techStrengths: any[],
	lang: string,
): Promise<void> {
	const scenarioPayload = {
		user_query: treeMeta.search_theme,
		user_context: treeMeta.description ?? "",
		scenario_name: scenarioNode.name,
		scenario_description: scenarioNode.description ?? "",
	}

	const payload = {
		user_query: treeMeta.search_theme,
		user_context: treeMeta.description ?? "",
		tech_strengths: techStrengths,
		scenario: [scenarioPayload],
		target: ["Scenario", "Purpose", "Function", "Technology"],
		language: lang,
	}

	console.log(
		"[generate-tree-from-v5] Calling /v5/generate/trees for scenario",
		scenarioNode.id,
	)

	const treeResult = await callTreesEndpoint(payload)
	console.log(
		"[generate-tree-from-v5] API response keys for scenario",
		scenarioNode.id,
		JSON.stringify(Object.keys(treeResult)),
	)
	const scenarios = treeResult.scenarios || []
	const firstScenario = scenarios[0]
	if (!firstScenario) {
		console.warn(
			"[generate-tree-from-v5] No scenario block in tree result for",
			scenarioNode.id,
		)
		console.warn(
			"[generate-tree-from-v5] Full treeResult:",
			JSON.stringify(treeResult, null, 2),
		)
		return
	}

	console.log(
		"[generate-tree-from-v5] firstScenario keys:",
		JSON.stringify(Object.keys(firstScenario)),
	)

	// Handle API response formats:
	// Format A: { purpose: { purpose_name, purpose_description }, functions: [...] }
	// Format B: { purposes: [{ purpose: { purpose_name, ... }, functions: [...] }] }
	// Format C: { purposes: [{ purpose_name, purpose_description, functions: [...] }] }
	const purposeEntry =
		firstScenario.purpose || firstScenario.purposes?.[0] || {}
	// purposes[0] may wrap the actual data under a nested .purpose key
	const purposeData = purposeEntry.purpose || purposeEntry
	const functions =
		firstScenario.functions ||
		purposeEntry.functions ||
		purposeData.functions ||
		[]

	const nodesToInsert: any[] = []

	// Purpose node (level 2)
	const purposeId = crypto.randomUUID()
	const purposeName =
		purposeData.purpose_name ||
		purposeData.name ||
		purposeData.title ||
		"Purpose"
	const purposeDescription =
		purposeData.purpose_description || purposeData.description || null

	if (purposeName === "Purpose") {
		console.warn(
			"[generate-tree-from-v5] Purpose name fell back to default. purpose object:",
			JSON.stringify(purposeEntry),
		)
	}

	nodesToInsert.push({
		id: purposeId,
		tree_id,
		parent_id: scenarioNode.id,
		name: purposeName,
		description: purposeDescription,
		axis: "Purpose" as any,
		level: 2,
		node_order: 0,
		children_count: functions.length,
	})

	// Function and Technology nodes
	functions.forEach((fn: any, fnIndex: number) => {
		const fnInfo = fn.function || fn || {}
		const technologies = fn.technologies || fnInfo.technologies || []
		const functionId = crypto.randomUUID()

		nodesToInsert.push({
			id: functionId,
			tree_id,
			parent_id: purposeId,
			name:
				fnInfo.function_name ||
				fnInfo.name ||
				fnInfo.title ||
				`Function ${fnIndex + 1}`,
			description: fnInfo.function_description || fnInfo.description || null,
			axis: "Function" as any,
			level: 3,
			node_order: fnIndex,
			children_count: technologies.length,
		})

		technologies.forEach((tech: any, techIndex: number) => {
			nodesToInsert.push({
				id: crypto.randomUUID(),
				tree_id,
				parent_id: functionId,
				name:
					tech.tech_name ||
					tech.name ||
					tech.title ||
					`Technology ${techIndex + 1}`,
				description:
					tech.tech_definition ??
					tech.tech_description ??
					tech.description ??
					null,
				axis: "Technology" as any,
				level: 4,
				node_order: techIndex,
				children_count: 0,
			})
		})
	})

	if (nodesToInsert.length > 0) {
		const { error: insertError } = await supabaseAdmin
			.from("tree_nodes")
			.insert(nodesToInsert)

		if (insertError) {
			console.error(
				"[generate-tree-from-v5] Failed to insert tree nodes for scenario",
				scenarioNode.id,
				insertError,
			)
			return
		}

		// Update scenario node children_count to reflect the new purpose child
		const { error: updateScenarioError } = await supabaseAdmin
			.from("tree_nodes")
			.update({ children_count: 1 })
			.eq("id", scenarioNode.id)

		if (updateScenarioError) {
			console.error(
				"[generate-tree-from-v5] Failed to update scenario children_count",
				updateScenarioError,
			)
		}

		console.log(
			"[generate-tree-from-v5] Successfully processed scenario",
			scenarioNode.id,
			`(${nodesToInsert.length} nodes inserted)`,
		)
	}
}

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { status: 200, headers: CORS })
	}

	if (req.method !== "POST") {
		return new Response("Method not allowed", {
			status: 405,
			headers: CORS,
		})
	}

	try {
		const { tree_id, scenario_ids, language } = await req.json()
		if (!tree_id) {
			return new Response("Missing tree_id", { status: 400, headers: CORS })
		}

		const lang = language === "English" ? "English" : "Japanese"
		// Optional array of scenario node IDs to limit expansion
		const targetScenarioIds: string[] | null =
			Array.isArray(scenario_ids) && scenario_ids.length > 0
				? scenario_ids
				: null

		if (targetScenarioIds) {
			console.log(
				"[generate-tree-from-v5] Limiting expansion to",
				targetScenarioIds.length,
				"scenarios",
			)
		}

		// Load tree metadata
		const { data: treeMeta, error: treeError } = await supabaseAdmin
			.from("technology_trees")
			.select("id, search_theme, description")
			.eq("id", tree_id)
			.single()

		if (treeError || !treeMeta) {
			console.error(
				"[generate-tree-from-v5] Tree metadata not found",
				treeError,
			)
			return new Response("Tree metadata not found", {
				status: 404,
				headers: CORS,
			})
		}

		// Load technical strengths for payload
		const { data: techStrengths, error: techError } = await supabaseAdmin
			.from("technical_strengths")
			.select("strength_name, description, potential_applications")
			.eq("tree_id", tree_id)
			.order("ordinal", { ascending: true })

		if (techError || !techStrengths || techStrengths.length === 0) {
			console.error(
				"[generate-tree-from-v5] No technical strengths for this tree",
				techError,
			)
			return new Response("No technical strengths for this tree", {
				status: 400,
				headers: CORS,
			})
		}

		// Load existing Scenario nodes (level 1) for this tree
		// If scenario_ids is provided, only load those specific scenarios
		let scenarioQuery = supabaseAdmin
			.from("tree_nodes")
			.select("id, name, description, children_count")
			.eq("tree_id", tree_id)
			.eq("axis", "Scenario")
			.eq("level", 1)
			.order("node_order", { ascending: true })

		if (targetScenarioIds) {
			scenarioQuery = scenarioQuery.in("id", targetScenarioIds)
		}

		const { data: scenarioNodes, error: scenarioError } = await scenarioQuery

		if (scenarioError) {
			console.error(
				"[generate-tree-from-v5] Error loading scenario nodes",
				scenarioError,
			)
			return new Response("Failed to load scenario nodes", {
				status: 500,
				headers: CORS,
			})
		}

		if (!scenarioNodes || scenarioNodes.length === 0) {
			return new Response("No Scenario nodes found for this tree", {
				status: 400,
				headers: CORS,
			})
		}

		// Filter to only scenarios that need generation (no existing children)
		const scenariosToGenerate = scenarioNodes.filter(
			(n) => !n.children_count || n.children_count === 0,
		)

		console.log(
			"[generate-tree-from-v5] Scenarios to generate:",
			scenariosToGenerate.length,
			"of",
			scenarioNodes.length,
			"total",
		)

		// ─── Fire-and-forget: return 200 immediately, process in background ───
		// The frontend polls children_count via useTreeStructurePolling to detect
		// when each scenario's subtree is ready. No need to wait for completion.

		// Process each scenario in the background (parallel)
		for (const scenarioNode of scenariosToGenerate) {
			// Use EdgeRuntime.waitUntil if available (Supabase Deno runtime),
			// otherwise fall back to fire-and-forget promise
			const task = processScenario(
				scenarioNode,
				tree_id,
				treeMeta,
				techStrengths,
				lang,
			).catch((error) => {
				console.error(
					"[generate-tree-from-v5] Background processing failed for scenario",
					scenarioNode.id,
					error,
				)
			})

			// @ts-expect-error — EdgeRuntime.waitUntil keeps the worker alive after response
			if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
				// @ts-expect-error — EdgeRuntime global not typed
				EdgeRuntime.waitUntil(task)
			}
		}

		// Return immediately — frontend uses polling to detect completion
		return new Response(
			JSON.stringify({
				tree_id,
				status: "processing",
				scenarios_queued: scenariosToGenerate.map((n) => n.id),
				scenarios_skipped: scenarioNodes
					.filter((n) => n.children_count && n.children_count > 0)
					.map((n) => n.id),
			}),
			{
				status: 200,
				headers: { ...CORS, "Content-Type": "application/json" },
			},
		)
	} catch (error) {
		console.error("[generate-tree-from-v5] Internal server error", error)
		return new Response("Internal server error", {
			status: 500,
			headers: CORS,
		})
	}
})
