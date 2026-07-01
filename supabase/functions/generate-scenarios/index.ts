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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY =
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error(
		"[generate-scenarios] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
	)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false },
})

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { status: 200, headers: CORS })
	}

	if (req.method !== "POST") {
		return new Response("Method not allowed", { status: 405, headers: CORS })
	}

	try {
		const { tree_id, language } = await req.json()
		const lang = language === "English" ? "English" : "Japanese"
		if (!tree_id) {
			return new Response("Missing tree_id", { status: 400, headers: CORS })
		}

		// Check if technical strengths exist for the tree_id
		const { data: techStrengths, error: techError } = await supabaseAdmin
			.from("technical_strengths")
			.select("*")
			.eq("tree_id", tree_id)
			.order("ordinal", { ascending: true })

		if (techError || !techStrengths || techStrengths.length === 0) {
			return new Response("No technical strengths for this tree", {
				status: 400,
				headers: CORS,
			})
		}

		// Load tree metadata
		const { data: treeMeta, error: treeError } = await supabaseAdmin
			.from("technology_trees")
			.select("*")
			.eq("id", tree_id)
			.single()

		if (treeError || !treeMeta) {
			return new Response("Tree metadata not found", {
				status: 404,
				headers: CORS,
			})
		}

		const user_query = tree_id // Use tree_id as user_query
		const user_context = treeMeta.search_theme || "" // Adjust if another field is more appropriate

		// Call Python API
		const response = await fetch(
			`${getSearchApiBaseUrl("stg")}/v5/generate/scenarios`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: makeBasicAuthHeader(),
				},
				body: JSON.stringify({
					user_query,
					user_context,
					tech_strengths: techStrengths,
					language: lang,
				}),
			},
		)

		// Log raw response for debugging
		console.log("Raw response from Python API:", response)

		if (!response.ok) {
			const errorText = await response.text()
			return new Response(`Python API error: ${errorText}`, {
				status: 500,
				headers: CORS,
			})
		}

		// Handle SSE response
		const reader = response.body?.getReader()
		if (!reader) {
			return new Response("Failed to read response body", {
				status: 500,
				headers: CORS,
			})
		}

		let scenarios: any[] = []
		const decoder = new TextDecoder()
		let done = false

		while (!done) {
			const { value, done: readerDone } = await reader.read()
			done = readerDone

			if (value) {
				const chunk = decoder.decode(value)
				const lines = chunk.split("\n").map((line) => line.trim())
				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const jsonPart = line.slice("data: ".length)
						if (jsonPart === "[DONE]") continue

						try {
							const event = JSON.parse(jsonPart)
							console.log("Parsed SSE event:", event)
							if (event.type === "result" && event.data?.scenarios) {
								scenarios = event.data.scenarios
							}
						} catch (err) {
							console.error("Failed to parse SSE chunk:", err)
						}
					}
				}
			}
		}

		// Log scenarios for debugging
		console.log("Scenarios received:", scenarios)

		if (!Array.isArray(scenarios) || scenarios.length === 0) {
			console.error("No scenarios array in Python API result:", scenarios)
			return new Response("No scenarios received from Python API", {
				status: 500,
				headers: CORS,
			})
		}

		// Validate that each scenario matches the canonical pipeline shape
		const invalidScenario = scenarios.find(
			(s: any) => !s?.scenario_name || !s?.scenario_description,
		)
		if (invalidScenario) {
			console.error(
				"Invalid scenario object received from Python API:",
				invalidScenario,
			)
			return new Response("Invalid scenarios data received from Python API", {
				status: 500,
				headers: CORS,
			})
		}

		// Ensure root node exists
		const { data: rootNode } = await supabaseAdmin
			.from("tree_nodes")
			.select("*")
			.eq("tree_id", tree_id)
			.eq("level", 0)
			.eq("axis", "Root")
			.single()

		let rootNodeId = rootNode?.id
		if (!rootNodeId) {
			const newRootId = crypto.randomUUID()
			const { data: newRootNode, error: insertRootError } = await supabaseAdmin
				.from("tree_nodes")
				.insert({
					id: newRootId,
					tree_id,
					parent_id: null,
					name: treeMeta.search_theme || "Root",
					description: treeMeta.description ?? null,
					axis: "Root" as any,
					level: 0,
					node_order: 0,
					children_count: 0,
				})
				.select("id")
				.single()

			if (insertRootError || !newRootNode) {
				return new Response("Failed to create root node", {
					status: 500,
					headers: CORS,
				})
			}

			rootNodeId = newRootNode.id
		}

		// Insert scenarios as level 1 nodes under the root, using pipeline scenario shape
		const scenarioInserts = scenarios.map((scenario: any, index: number) => ({
			id: crypto.randomUUID(),
			tree_id,
			parent_id: rootNodeId,
			name: scenario.scenario_name,
			description: scenario.scenario_description,
			axis: "Scenario" as any,
			level: 1,
			node_order: index,
			children_count: 0,
		}))

		const { error: insertError } = await supabaseAdmin
			.from("tree_nodes")
			.insert(scenarioInserts)

		if (insertError) {
			console.error("Error inserting scenarios into tree_nodes:", insertError)
			return new Response("Failed to insert scenarios", {
				status: 500,
				headers: CORS,
			})
		}

		// Save technology_strength to node_analysis for each scenario
		const analysisInserts = scenarioInserts
			.map((insert: any, i: number) => {
				const techStrength = scenarios[i]?.technology_strength
				if (!Array.isArray(techStrength) || techStrength.length === 0)
					return null
				return {
					node_id: insert.id,
					data: {
						technology_strength: techStrength,
					},
				}
			})
			.filter(Boolean)

		if (analysisInserts.length > 0) {
			const { error: analysisError } = await supabaseAdmin
				.from("node_analysis")
				.upsert(analysisInserts, { onConflict: "node_id" })

			if (analysisError) {
				console.error(
					"Error saving technology_strength to node_analysis:",
					analysisError,
				)
				// Non-fatal: scenarios are already saved
			}
		}

		return new Response(JSON.stringify({ tree_id, scenarios }), {
			status: 200,
			headers: { ...CORS, "Content-Type": "application/json" },
		})
	} catch (error) {
		console.error("Error processing request", error)
		return new Response("Internal server error", { status: 500, headers: CORS })
	}
})
