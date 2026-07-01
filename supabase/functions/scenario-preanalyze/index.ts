import {
	corsHeaders,
	getNodeAnalysisData,
	jsonResponse,
	saveNodeAnalysis,
	scheduleBackgroundTask,
} from "../_shared/node-analysis.ts"
import { getSearchApiBaseUrl } from "../_shared/search-api.ts"

const DATA_KEY = "preanalyze" as const
const JOB_KEY = "preanalyze_job" as const

function getSearchApiHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"User-Agent": "memory-ai-app/1.0",
	}

	const searchApiUser = Deno.env.get("SEARCH_API_USER")
	const searchApiPass = Deno.env.get("SEARCH_API_PASS")
	if (searchApiUser && searchApiPass) {
		headers.Authorization = `Basic ${btoa(`${searchApiUser}:${searchApiPass}`)}`
	}
	return headers
}

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object"
		? (value as Record<string, unknown>)
		: {}
}

function _asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : []
}

function asString(value: unknown, fallback = ""): string {
	return typeof value === "string" ? value : fallback
}

function normalizeTechStrength(input: unknown): Array<Record<string, unknown>> {
	if (!Array.isArray(input)) return []

	return input
		.map((item) => {
			const row = asRecord(item)
			const strength_name = asString(row.strength_name ?? row.name)
			const description = asString(row.description)
			const potential_applications = asString(row.potential_applications)

			if (!strength_name && !description && !potential_applications) return null

			return {
				strength_name,
				description,
				potential_applications,
			}
		})
		.filter(Boolean) as Array<Record<string, unknown>>
}

function normalizeCustomerTarget(
	input: unknown,
): Array<Record<string, unknown>> {
	if (!Array.isArray(input)) return []

	return input
		.map((item) => {
			const row = asRecord(item)
			const customer_name = asString(row.customer_name ?? row.name)
			const rationale = asString(row.rationale ?? row.reason)

			if (!customer_name && !rationale) return null

			return {
				customer_name,
				rationale,
			}
		})
		.filter(Boolean) as Array<Record<string, unknown>>
}

/** Check if preanalyze result has a valid TAM value */
function hasTamValue(preanalyze: unknown): boolean {
	const data = asRecord(preanalyze)
	const market = asRecord(data.market)
	const tam = asRecord(market.tam)
	return tam.value != null && tam.value !== 0
}

/** Call the preanalyze SSE endpoint and return the final result from `type: "result"` event. */
async function callPreanalyzeSSE(
	payload: unknown,
): Promise<Record<string, unknown>> {
	const baseUrl = getSearchApiBaseUrl("stg")
	const headers = getSearchApiHeaders()

	const response = await fetch(`${baseUrl}/v5/pipeline/preanalyze`, {
		method: "POST",
		headers,
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => "")
		throw new Error(
			`Search API /v5/pipeline/preanalyze failed (${response.status}): ${errorText.slice(0, 1000)}`,
		)
	}

	if (!response.body) {
		throw new Error("Search API returned no body")
	}

	const reader = response.body.getReader()
	const decoder = new TextDecoder()
	let buffer = ""
	let finalResult: Record<string, unknown> | null = null

	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			buffer += decoder.decode(value, { stream: true })

			const lines = buffer.split("\n")
			buffer = lines.pop() ?? ""

			for (const line of lines) {
				const trimmed = line.trim()
				if (!trimmed.startsWith("data: ")) continue

				const jsonStr = trimmed.slice(6)
				try {
					const event = JSON.parse(jsonStr)
					if (event.type === "result" && event.data) {
						finalResult = event.data as Record<string, unknown>
					}
				} catch {
					// ignore malformed lines
				}
			}
		}
	} finally {
		reader.releaseLock()
	}

	if (!finalResult) {
		throw new Error("No result event received from preanalyze SSE stream")
	}

	return finalResult
}

Deno.serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders })
	}

	if (req.method !== "POST") {
		return jsonResponse({ error: "Method not allowed" }, 405)
	}

	try {
		const body = await req.json()
		const bodyObj = asRecord(body)

		const nodeId =
			typeof bodyObj.nodeId === "string"
				? bodyObj.nodeId
				: typeof bodyObj.node_id === "string"
					? bodyObj.node_id
					: null

		if (!nodeId) {
			return jsonResponse({ error: "nodeId is required" }, 400)
		}

		const treeId =
			typeof bodyObj.treeId === "string"
				? bodyObj.treeId
				: typeof bodyObj.tree_id === "string"
					? bodyObj.tree_id
					: null

		// force=true bypasses the "already_exists" check for retries
		const force = bodyObj.force === true

		const existingData = await getNodeAnalysisData(nodeId)

		const existingPreanalyze = existingData?.[DATA_KEY]
		if (
			!force &&
			existingPreanalyze &&
			typeof existingPreanalyze === "object" &&
			Object.keys(existingPreanalyze as Record<string, unknown>).length > 0
		) {
			// If result exists but has no TAM, allow re-run anyway
			if (hasTamValue(existingPreanalyze)) {
				return jsonResponse({
					node_id: nodeId,
					status: "already_exists",
					[DATA_KEY]: existingPreanalyze,
				})
			}
			// No TAM → fall through to re-run
			console.log(
				`[scenario-preanalyze] existing result has no TAM for node ${nodeId}, re-running`,
			)
		}

		const jobInfo = existingData?.[JOB_KEY] as
			| Record<string, unknown>
			| undefined
		if (
			!force &&
			(jobInfo?.status === "running" || jobInfo?.status === "queued")
		) {
			return jsonResponse(
				{
					node_id: nodeId,
					status: "running",
				},
				202,
			)
		}

		const scenario = asRecord(bodyObj.scenario)

		const normalizedTechStrength = normalizeTechStrength(
			scenario.tech_strength ??
				scenario.technology_strength ??
				existingData?.tech_strength ??
				existingData?.technology_strength,
		)

		const normalizedCustomerTarget = normalizeCustomerTarget(
			scenario.customer_target ?? existingData?.customer_target,
		)

		const normalizedApplicationTarget = asString(
			scenario.application_target ?? existingData?.application_target,
			"",
		)

		const normalizedQuantitativeNotes = asString(
			scenario.quantitative_notes ?? existingData?.quantitative_notes,
			"",
		)

		const searchPayload = {
			user_query: asString(scenario.user_query ?? ""),
			scenario: {
				scenario_name: asString(
					scenario.scenario_name ??
						bodyObj.scenarioName ??
						existingData?.scenario_name,
					"",
				),
				scenario_description: asString(
					scenario.scenario_description ??
						bodyObj.scenarioDescription ??
						existingData?.scenario_description,
					"",
				),
				tech_strength: normalizedTechStrength,
				application_target: normalizedApplicationTarget,
				customer_target: normalizedCustomerTarget,
				quantitative_notes: normalizedQuantitativeNotes,
			},
			target_year:
				typeof bodyObj.target_year === "number" ? bodyObj.target_year : 2025,
			target_region:
				typeof bodyObj.target_region === "string"
					? bodyObj.target_region
					: "Global",
			language:
				typeof bodyObj.language === "string" ? bodyObj.language : "Japanese",
		}

		if (!searchPayload.scenario.scenario_name) {
			searchPayload.scenario.scenario_name = asString(
				bodyObj.scenarioName,
				"Untitled Scenario",
			)
		}

		if (!searchPayload.scenario.scenario_description) {
			searchPayload.scenario.scenario_description = asString(
				bodyObj.scenarioDescription,
				asString(bodyObj.user_query, ""),
			)
		}

		if (searchPayload.scenario.tech_strength.length === 0) {
			searchPayload.scenario.tech_strength = [
				{
					strength_name:
						searchPayload.scenario.scenario_name || "Core technology",
					description:
						searchPayload.scenario.scenario_description ||
						"Auto-filled fallback because tech_strength was missing",
					potential_applications:
						searchPayload.scenario.application_target || "",
				},
			]
			console.warn(
				"[scenario-preanalyze] tech_strength missing; using fallback",
				nodeId,
			)
		}

		if (searchPayload.scenario.customer_target.length === 0) {
			searchPayload.scenario.customer_target = [
				{
					customer_name: "General market",
					rationale: "Auto-filled fallback because customer_target was missing",
				},
			]
			console.warn(
				"[scenario-preanalyze] customer_target missing; using fallback",
				nodeId,
			)
		}

		await saveNodeAnalysis(nodeId, JOB_KEY, {
			status: "running",
			started_at: new Date().toISOString(),
			is_retry: force || existingPreanalyze != null,
		})

		const task = (async () => {
			try {
				console.log(
					"[scenario-preanalyze] request payload for node:",
					nodeId,
					force ? "(RETRY)" : "",
					JSON.stringify(searchPayload).slice(0, 3000),
				)

				const result = await callPreanalyzeSSE(searchPayload)

				console.log(
					"[scenario-preanalyze] result for node:",
					nodeId,
					JSON.stringify(result).slice(0, 1000),
				)

				await saveNodeAnalysis(nodeId, DATA_KEY, result)
				await saveNodeAnalysis(nodeId, JOB_KEY, {
					status: "completed",
					completed_at: new Date().toISOString(),
					is_retry: force || existingPreanalyze != null,
					has_tam: hasTamValue(result),
				})

				console.log(
					"[scenario-preanalyze] completed for node:",
					nodeId,
					"has_tam:",
					hasTamValue(result),
				)
			} catch (error) {
				const message = error instanceof Error ? error.message : "Unknown error"
				console.error("[scenario-preanalyze] background task failed:", message)

				await saveNodeAnalysis(nodeId, JOB_KEY, {
					status: "failed",
					error: message,
					failed_at: new Date().toISOString(),
				}).catch((e) =>
					console.error(
						"[scenario-preanalyze] failed to save error status:",
						e,
					),
				)
			}
		})()

		scheduleBackgroundTask(task)

		return jsonResponse(
			{
				node_id: nodeId,
				tree_id: treeId,
				status: "queued",
				is_retry: force || existingPreanalyze != null,
				request_payload: searchPayload,
			},
			202,
		)
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unexpected error"
		console.error("[scenario-preanalyze] error:", message)
		return jsonResponse({ error: message }, 500)
	}
})
