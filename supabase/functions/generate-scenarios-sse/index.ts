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

const SSE_HEADERS = {
	...CORS,
	"Content-Type": "text/event-stream",
	"Cache-Control": "no-cache, no-transform",
	Connection: "keep-alive",
	"X-Accel-Buffering": "no",
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

function sseEvent(event: string, data: unknown): string {
	return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function sseComment(comment: string): string {
	return `: ${comment}\n\n`
}

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { status: 200, headers: CORS })
	}

	if (req.method !== "POST") {
		return new Response("Method not allowed", { status: 405, headers: CORS })
	}

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const encoder = new TextEncoder()

			let closed = false
			let heartbeatId: number | undefined
			let pythonReader: ReadableStreamDefaultReader<Uint8Array> | undefined

			const close = () => {
				if (closed) return
				closed = true

				if (heartbeatId !== undefined) {
					clearInterval(heartbeatId)
					heartbeatId = undefined
				}

				try {
					controller.close()
				} catch {
					// ignore
				}
			}

			const send = (chunk: string) => {
				if (closed) return false
				try {
					controller.enqueue(encoder.encode(chunk))
					return true
				} catch {
					closed = true
					if (heartbeatId !== undefined) {
						clearInterval(heartbeatId)
						heartbeatId = undefined
					}
					return false
				}
			}

			const fail = (message: string, detail: unknown = null) => {
				send(sseEvent("error", { message, detail }))
				close()
			}

			const abortHandler = async () => {
				closed = true

				if (heartbeatId !== undefined) {
					clearInterval(heartbeatId)
					heartbeatId = undefined
				}

				try {
					await pythonReader?.cancel()
				} catch {
					// ignore
				}
			}

			req.signal.addEventListener("abort", abortHandler, { once: true })

			try {
				heartbeatId = setInterval(() => {
					send(sseComment("heartbeat"))
				}, 15000)

				send(sseEvent("status", { step: "started" }))

				const { tree_id, language } = await req.json()
				const lang = language === "English" ? "English" : "Japanese"
				if (!tree_id) {
					fail("Missing tree_id")
					return
				}

				send(sseEvent("status", { step: "checking_technical_strengths" }))

				const { data: techStrengths, error: techError } = await supabaseAdmin
					.from("technical_strengths")
					.select("*")
					.eq("tree_id", tree_id)
					.order("ordinal", { ascending: true })

				if (techError || !techStrengths || techStrengths.length === 0) {
					fail(
						"No technical strengths for this tree",
						techError?.message ?? null,
					)
					return
				}

				send(sseEvent("status", { step: "loading_tree_metadata" }))

				const { data: treeMeta, error: treeError } = await supabaseAdmin
					.from("technology_trees")
					.select("*")
					.eq("id", tree_id)
					.single()

				if (treeError || !treeMeta) {
					fail("Tree metadata not found", treeError?.message ?? null)
					return
				}

				const user_query = tree_id
				const user_context = treeMeta.search_theme || ""

				send(sseEvent("status", { step: "calling_python_api" }))

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
						signal: req.signal,
					},
				)

				if (!response.ok) {
					const errorText = await response.text()
					fail("Python API error", errorText)
					return
				}

				pythonReader = response.body?.getReader()
				if (!pythonReader) {
					fail("Failed to read response body")
					return
				}

				let scenarios: any[] = []
				const decoder = new TextDecoder()
				let buffer = ""

				send(sseEvent("status", { step: "waiting_for_python_stream" }))

				while (!closed) {
					const { value, done } = await pythonReader.read()
					if (done) break
					if (!value) continue

					buffer += decoder.decode(value, { stream: true })
					const lines = buffer.split("\n")
					buffer = lines.pop() ?? ""

					for (const rawLine of lines) {
						const line = rawLine.trim()
						if (!line.startsWith("data: ")) continue

						const jsonPart = line.slice("data: ".length)
						if (jsonPart === "[DONE]") continue

						try {
							const event = JSON.parse(jsonPart)
							send(sseEvent("python_event", event))

							if (event.type === "result" && event.data?.scenarios) {
								scenarios = event.data.scenarios
							}
						} catch (err) {
							console.error("Failed to parse SSE chunk:", err)
						}
					}
				}

				if (closed) return

				send(
					sseEvent("status", {
						step: "python_done",
						scenario_count: Array.isArray(scenarios) ? scenarios.length : 0,
					}),
				)

				if (!Array.isArray(scenarios) || scenarios.length === 0) {
					fail("No scenarios received from Python API")
					return
				}

				const invalidScenario = scenarios.find(
					(s: any) => !s?.scenario_name || !s?.scenario_description,
				)

				if (invalidScenario) {
					fail(
						"Invalid scenarios data received from Python API",
						invalidScenario,
					)
					return
				}

				send(sseEvent("status", { step: "ensuring_root_node" }))

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
					const { data: newRootNode, error: insertRootError } =
						await supabaseAdmin
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
						fail("Failed to create root node", insertRootError?.message ?? null)
						return
					}

					rootNodeId = newRootNode.id
				}

				send(sseEvent("status", { step: "inserting_scenarios" }))

				const scenarioInserts = scenarios.map(
					(scenario: any, index: number) => ({
						id: crypto.randomUUID(),
						tree_id,
						parent_id: rootNodeId,
						name: scenario.scenario_name,
						description: scenario.scenario_description,
						axis: "Scenario" as any,
						level: 1,
						node_order: index,
						children_count: 0,
					}),
				)

				const { error: insertError } = await supabaseAdmin
					.from("tree_nodes")
					.insert(scenarioInserts)

				if (insertError) {
					fail("Failed to insert scenarios", insertError.message)
					return
				}

				send(sseEvent("status", { step: "saving_scenario_analysis" }))

				const analysisInserts = scenarioInserts
					.map((insert: any, i: number) => {
						const scenario = scenarios[i]
						if (!scenario) return null

						const data: Record<string, any> = {}

						const technologyStrength = Array.isArray(
							scenario.technology_strength,
						)
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
							scenario.technological_advantage ??
							scenario.technological_advantages
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

						if (scenario.preanalyze_job) {
							data.preanalyze_job = scenario.preanalyze_job
						}

						if (scenario.preanalyze) {
							data.preanalyze = scenario.preanalyze
						}

						if (scenario.analyze_market) {
							data.analyze_market = scenario.analyze_market
						}

						if (scenario.analyze_trl) {
							data.analyze_trl = scenario.analyze_trl
						}

						if (scenario.analyze_social_issue) {
							data.analyze_social_issue = scenario.analyze_social_issue
						}

						if (Object.keys(data).length === 0) return null

						return {
							node_id: insert.id,
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
							"[generate-scenarios] Error saving to node_analysis:",
							analysisError,
						)
						send(
							sseEvent("warning", {
								message:
									"Scenarios saved but analysis metadata partially failed",
								detail: analysisError.message,
							}),
						)
					} else {
						console.log(
							`[generate-scenarios] Saved ${analysisInserts.length} analysis records`,
						)
					}
				}

				send(
					sseEvent("done", {
						tree_id,
						scenario_count: scenarios.length,
						analysis_count: analysisInserts.length,
						scenarios,
					}),
				)

				close()
			} catch (error) {
				console.error("Error processing request", error)

				if (!closed) {
					send(
						sseEvent("error", {
							message: "Internal server error",
							detail: error instanceof Error ? error.message : String(error),
						}),
					)
				}

				close()
			} finally {
				req.signal.removeEventListener("abort", abortHandler)
				close()
			}
		},
	})

	return new Response(stream, {
		status: 200,
		headers: SSE_HEADERS,
	})
})
