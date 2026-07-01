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
		"[add-scenarios-v5] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
	)
}
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false },
})

async function callAddScenariosEndpoint(payload: any): Promise<any> {
	const response = await fetch(
		`${getSearchApiBaseUrl("stg")}/v5/pipeline/generate/add`,
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
		throw new Error(`Python /v5/pipeline/generate/add error: ${errorText}`)
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

		if (!value) continue

		buffer += decoder.decode(value, { stream: true })
		const lines = buffer.split("\n")
		buffer = lines.pop() ?? ""

		for (const rawLine of lines) {
			const line = rawLine.trim()
			if (!line.startsWith("data: ")) continue

			const jsonPart = line.slice("data: ".length)
			if (!jsonPart || jsonPart === "[DONE]") continue

			try {
				const event = JSON.parse(jsonPart)
				if (event.type === "result" && event.data?.tree) {
					treeResult = event.data.tree
				}
			} catch (error) {
				buffer = `${rawLine}\n${buffer}`
				console.error(
					"[add-scenarios-v5] Failed to parse SSE chunk (will retry with more data):",
					error,
				)
			}
		}
	}

	if (!treeResult) {
		throw new Error("No tree result received from /v5/pipeline/generate/add")
	}

	return treeResult
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
		const { tree_id, n, language, context } = await req.json()
		if (!tree_id) {
			return new Response("Missing tree_id", { status: 400, headers: CORS })
		}

		const addCount = Number.isFinite(n) ? Number(n) : 20
		const lang = language || "Japanese"

		const [
			{ data: treeMeta, error: treeError },
			{ data: techStrengths, error: techError },
			{ data: scenarioRows, error: scenariosError },
		] = await Promise.all([
			supabaseAdmin
				.from("technology_trees")
				.select("id, search_theme, description")
				.eq("id", tree_id)
				.single(),
			supabaseAdmin
				.from("technical_strengths")
				.select("strength_name, description, potential_applications")
				.eq("tree_id", tree_id)
				.order("ordinal", { ascending: true }),
			supabaseAdmin
				.from("tree_nodes")
				.select("id, name, description, node_order")
				.eq("tree_id", tree_id)
				.eq("level", 1)
				.order("node_order", { ascending: true }),
		])

		if (treeError || !treeMeta) {
			return new Response("Tree metadata not found", {
				status: 404,
				headers: CORS,
			})
		}

		if (techError) {
			console.error(
				"[add-scenarios-v5] technical_strengths fetch failed:",
				techError,
			)
			return new Response("Failed to load technical strengths", {
				status: 500,
				headers: CORS,
			})
		}

		if (scenariosError) {
			console.error(
				"[add-scenarios-v5] scenario rows fetch failed:",
				scenariosError,
			)
			return new Response("Failed to load existing scenarios", {
				status: 500,
				headers: CORS,
			})
		}

		const searchTheme = treeMeta.search_theme || tree_id
		const userContext = context || treeMeta.description || ""
		const existingScenarioRows = scenarioRows ?? []
		const existingScenarioKeys = new Set(
			existingScenarioRows.map(
				(row) => `${row.name || ""}::${row.description || ""}`,
			),
		)

		const treePayload = {
			user_query: searchTheme,
			user_context: userContext,
			tech_strengths: (techStrengths ?? []).map((strength) => ({
				strength_name: strength.strength_name ?? "",
				description: strength.description ?? "",
				potential_applications: strength.potential_applications ?? "",
			})),
			scenarios: existingScenarioRows.map((row) => ({
				scenario: {
					user_query: searchTheme,
					user_context: userContext,
					scenario_name: row.name || "",
					scenario_description: row.description || "",
				},
			})),
		}

		const resultTree = await callAddScenariosEndpoint({
			tree: treePayload,
			add_layer: "Scenario",
			items: [],
			n: addCount,
			mode: "context",
			target: ["Scenario"],
			language: lang,
		})

		const resultScenarios = Array.isArray(resultTree?.scenarios)
			? resultTree.scenarios
			: []

		const newScenarioItems = resultScenarios
			.filter((item: any) => {
				const name = item?.scenario?.scenario_name || ""
				const description = item?.scenario?.scenario_description || ""
				return !existingScenarioKeys.has(`${name}::${description}`)
			})
			.slice(0, addCount)

		if (newScenarioItems.length === 0) {
			return new Response(JSON.stringify({ scenarios: [] }), {
				status: 200,
				headers: { ...CORS, "Content-Type": "application/json" },
			})
		}

		const { data: rootNode, error: rootError } = await supabaseAdmin
			.from("tree_nodes")
			.select("id")
			.eq("tree_id", tree_id)
			.eq("level", 0)
			.eq("axis", "Root")
			.single()

		let rootNodeId = rootNode?.id

		if (!rootNodeId) {
			if (rootError) {
				console.error("[add-scenarios-v5] root node fetch failed:", rootError)
			}

			const newRootId = crypto.randomUUID()
			const { data: newRootNode, error: insertRootError } = await supabaseAdmin
				.from("tree_nodes")
				.insert({
					id: newRootId,
					tree_id,
					parent_id: null,
					name: searchTheme,
					description: userContext || null,
					axis: "Root" as any,
					level: 0,
					node_order: 0,
					children_count: 0,
				})
				.select("id")
				.single()

			if (insertRootError || !newRootNode) {
				console.error(
					"[add-scenarios-v5] failed to create root node:",
					insertRootError,
				)
				return new Response("Failed to create root node", {
					status: 500,
					headers: CORS,
				})
			}

			rootNodeId = newRootNode.id
		}

		const startOrder = existingScenarioRows.length
		const scenarioInserts = newScenarioItems.map(
			(item: any, index: number) => ({
				id: crypto.randomUUID(),
				tree_id,
				parent_id: rootNodeId,
				name: item?.scenario?.scenario_name || "",
				description: item?.scenario?.scenario_description || "",
				axis: "Scenario" as any,
				level: 1,
				node_order: startOrder + index,
				children_count: 0,
			}),
		)

		const { data: insertedRows, error: insertError } = await supabaseAdmin
			.from("tree_nodes")
			.insert(scenarioInserts)
			.select("id, name, description, level")

		if (insertError) {
			console.error("[add-scenarios-v5] scenario insert failed:", insertError)
			return new Response("Failed to insert new scenarios", {
				status: 500,
				headers: CORS,
			})
		}

		const analysisInserts = (insertedRows ?? [])
			.map((insertedRow: any, i: number) => {
				const scenario = newScenarioItems[i]?.scenario
				if (!scenario) return null

				const data: Record<string, any> = {}

				const technologyStrength = Array.isArray(scenario.technology_strength)
					? scenario.technology_strength
					: []
				const techStrength = Array.isArray(scenario.tech_strength)
					? scenario.tech_strength
					: technologyStrength
				if (techStrength.length > 0) {
					data.tech_strength = techStrength
					data.technology_strength = techStrength
				}

				if (scenario.application_target) {
					data.application_target = scenario.application_target
				}

				if (
					Array.isArray(scenario.customer_target) &&
					scenario.customer_target.length > 0
				) {
					data.customer_target = scenario.customer_target
				}

				if (scenario.quantitative_notes) {
					data.quantitative_notes = scenario.quantitative_notes
				}

				// Python API returns "technological_advantages" (with s) for English — normalize to singular object
				const rawAdvantage =
					scenario.technological_advantage ?? scenario.technological_advantages
				const techAdvantage = Array.isArray(rawAdvantage)
					? rawAdvantage[0]
					: rawAdvantage
				if (
					techAdvantage &&
					typeof techAdvantage === "object" &&
					techAdvantage.rating
				) {
					data.technological_advantage = techAdvantage
				}

				if (Object.keys(data).length === 0) return null

				return {
					node_id: insertedRow.id,
					data,
					updated_at: new Date().toISOString(),
				}
			})
			.filter(Boolean)

		if (analysisInserts.length > 0) {
			const { error: analysisError } = await supabaseAdmin
				.from("node_analysis")
				.upsert(analysisInserts, { onConflict: "node_id" })

			if (analysisError) {
				console.error(
					"[add-scenarios-v5] Error saving to node_analysis:",
					analysisError,
				)
			}
		}

		return new Response(JSON.stringify({ scenarios: insertedRows ?? [] }), {
			status: 200,
			headers: { ...CORS, "Content-Type": "application/json" },
		})
	} catch (error) {
		console.error("[add-scenarios-v5] unexpected error:", error)
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { ...CORS, "Content-Type": "application/json" },
			},
		)
	}
})
