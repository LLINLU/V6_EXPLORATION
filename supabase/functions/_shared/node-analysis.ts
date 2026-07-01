import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getSearchApiBaseUrl, makeBasicAuthHeader } from "./search-api.ts"

type JsonRecord = Record<string, unknown>
type AnalysisKey =
	| "analyze_market"
	| "analyze_social_issue"
	| "analyze_trl"
	| "analyze_market_job"
	| "analyze_social_issue_job"
	| "analyze_trl_job"
	| "preanalyze"
	| "preanalyze_job"
type AnalysisKind =
	| "analyze_market"
	| "analyze_social_issue"
	| "analyze_trl"
	| "preanalyze"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	throw new Error(
		"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable",
	)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
}

export function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			...corsHeaders,
			"Content-Type": "application/json",
		},
	})
}

function getEnvNumber(name: string, fallback: number): number {
	const value = Deno.env.get(name)
	if (!value) return fallback
	const parsed = Number(value)
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function scheduleBackgroundTask(task: Promise<void>): void {
	const runtime = (
		globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<void>) => void } }
	).EdgeRuntime

	if (runtime?.waitUntil) {
		runtime.waitUntil(task)
		return
	}

	task.catch((error) => {
		console.error("[node-analysis] background task failed", error)
	})
}

export async function getNodeAnalysisData(
	nodeId: string | number,
): Promise<JsonRecord | null> {
	const { data: row, error } = await supabase
		.from("node_analysis")
		.select("data")
		.eq("node_id", nodeId)
		.maybeSingle()

	if (error) {
		throw new Error(`Failed to query node_analysis: ${error.message}`)
	}

	if (!row?.data || typeof row.data !== "object") return null
	return row.data as JsonRecord
}

type AnalysisTrackingStatus = "queued" | "running" | "completed" | "failed"

async function findTrackingJobId(
	kind: AnalysisKind,
	backendJobId: string,
): Promise<number | null> {
	const { data, error } = await supabase
		.from("jobs")
		.select("id")
		.contains("body", { kind, backend_job_id: backendJobId })
		.order("id", { ascending: false })
		.limit(1)
		.maybeSingle()

	if (error) {
		throw new Error(`Failed to query jobs table: ${error.message}`)
	}

	return typeof data?.id === "number" ? data.id : null
}

export async function createTrackingJob(
	kind: AnalysisKind,
	nodeId: string | number,
	treeId: string | null,
	payload: unknown,
	backendJob: {
		job_id: string
		status: string
		queue?: string
		created_at?: string
	},
): Promise<number | null> {
	const now = new Date().toISOString()
	const body = {
		source: "supabase_edge_function",
		kind,
		node_id: String(nodeId),
		tree_id: treeId,
		backend_job_id: backendJob.job_id,
		backend_queue: backendJob.queue ?? null,
		backend_created_at: backendJob.created_at ?? null,
		request_payload: payload,
		last_backend_status: backendJob.status,
		updated_at: now,
	}

	const { data, error } = await supabase
		.from("jobs")
		.insert({
			node_id: String(nodeId),
			tree_id: treeId,
			status: "queued",
			body,
			created_at: now,
		})
		.select("id")
		.maybeSingle()

	if (error) {
		throw new Error(`Failed to insert jobs tracking row: ${error.message}`)
	}

	return typeof data?.id === "number" ? data.id : null
}

export async function updateTrackingJob(
	kind: AnalysisKind,
	backendJobId: string,
	status: AnalysisTrackingStatus,
	details: Record<string, unknown>,
	explicitTrackingJobId?: number | null,
): Promise<number | null> {
	const trackingJobId =
		explicitTrackingJobId ?? (await findTrackingJobId(kind, backendJobId))

	if (!trackingJobId) return null

	const { data: existing, error: selectError } = await supabase
		.from("jobs")
		.select("body")
		.eq("id", trackingJobId)
		.maybeSingle()

	if (selectError) {
		throw new Error(`Failed to load jobs tracking row: ${selectError.message}`)
	}

	const mergedBody = {
		...((existing?.body ?? {}) as JsonRecord),
		...Object.fromEntries(
			Object.entries(details).filter(
				([, value]) => value !== null && value !== undefined,
			),
		),
		updated_at: new Date().toISOString(),
	}

	const nextNodeId =
		typeof details.node_id === "string"
			? details.node_id
			: typeof (existing?.body as JsonRecord | undefined)?.node_id === "string"
				? ((existing?.body as JsonRecord).node_id as string)
				: null
	const nextTreeId =
		typeof details.tree_id === "string"
			? details.tree_id
			: typeof (existing?.body as JsonRecord | undefined)?.tree_id === "string"
				? ((existing?.body as JsonRecord).tree_id as string)
				: null

	const { error: updateError } = await supabase
		.from("jobs")
		.update({
			node_id: nextNodeId,
			tree_id: nextTreeId,
			status,
			body: mergedBody,
		})
		.eq("id", trackingJobId)

	if (updateError) {
		throw new Error(
			`Failed to update jobs tracking row: ${updateError.message}`,
		)
	}

	return trackingJobId
}

export async function saveNodeAnalysis(
	nodeId: string | number,
	analysisKey: AnalysisKey,
	analysisResponse: unknown,
): Promise<JsonRecord> {
	const { data: existingRow, error: selectError } = await supabase
		.from("node_analysis")
		.select("id, data")
		.eq("node_id", nodeId)
		.maybeSingle()

	if (selectError) {
		throw new Error(`Failed to query node_analysis: ${selectError.message}`)
	}

	const currentData = (existingRow?.data ?? {}) as JsonRecord
	const mergedData: JsonRecord = {
		...currentData,
		[analysisKey]: analysisResponse,
	}

	if (!existingRow) {
		const { error: insertError } = await supabase.from("node_analysis").insert({
			node_id: nodeId,
			data: mergedData,
		})

		if (insertError) {
			throw new Error(`Failed to insert node_analysis: ${insertError.message}`)
		}
	} else {
		const { error: updateError } = await supabase
			.from("node_analysis")
			.update({ data: mergedData })
			.eq("id", existingRow.id)

		if (updateError) {
			throw new Error(`Failed to update node_analysis: ${updateError.message}`)
		}
	}

	return mergedData
}

function getSearchApiHeaders(): Record<string, string> {
	return {
		"Content-Type": "application/json",
		"User-Agent": "memory-ai-app/1.0",
		Authorization: makeBasicAuthHeader(),
	}
}

const ASYNC_ENDPOINTS: Record<
	AnalysisKind,
	{
		enqueuePath: string
		jobPathPrefix: string
		dataKey: AnalysisKey
		jobKey: AnalysisKey
	}
> = {
	analyze_market: {
		enqueuePath: "/v5/analyze_market_async",
		jobPathPrefix: "/v5/analyze_market_async",
		dataKey: "analyze_market",
		jobKey: "analyze_market_job",
	},
	analyze_social_issue: {
		enqueuePath: "/v5/analyze_social_issue_async",
		jobPathPrefix: "/v5/analyze_social_issue_async",
		dataKey: "analyze_social_issue",
		jobKey: "analyze_social_issue_job",
	},
	analyze_trl: {
		enqueuePath: "/v5/analyze_trl_async",
		jobPathPrefix: "/v5/analyze_trl_async",
		dataKey: "analyze_trl",
		jobKey: "analyze_trl_job",
	},
	preanalyze: {
		enqueuePath: "/v5/pipeline/preanalyze",
		jobPathPrefix: "/v5/pipeline/preanalyze",
		dataKey: "preanalyze",
		jobKey: "preanalyze_job",
	},
}

async function fetchJsonOrNull(response: Response): Promise<unknown> {
	return await response.json().catch(() => null)
}

export async function callSearchApiDirect(
	path: string,
	payload: unknown,
): Promise<Record<string, unknown>> {
	const baseUrl = getSearchApiBaseUrl("stg")
	const headers = getSearchApiHeaders()

	const response = await fetch(`${baseUrl}${path}`, {
		method: "POST",
		headers,
		body: JSON.stringify(payload),
	})
	const body = (await fetchJsonOrNull(response)) as Record<
		string,
		unknown
	> | null

	if (!response.ok) {
		throw new Error(
			`Search API ${path} failed (${response.status}): ${JSON.stringify(body)}`,
		)
	}

	return body ?? {}
}

export { scheduleBackgroundTask }

export async function enqueueAnalysisJob(
	kind: AnalysisKind,
	payload: unknown,
): Promise<{
	job_id: string
	status: string
	queue?: string
	created_at?: string
}> {
	const baseUrl = getSearchApiBaseUrl("stg")
	const headers = getSearchApiHeaders()
	const endpoint = ASYNC_ENDPOINTS[kind].enqueuePath

	const response = await fetch(`${baseUrl}${endpoint}`, {
		method: "POST",
		headers,
		body: JSON.stringify(payload),
	})
	const body = (await fetchJsonOrNull(response)) as Record<
		string,
		unknown
	> | null

	if (!response.ok) {
		throw new Error(
			`Failed to enqueue ${kind} job (${response.status}): ${JSON.stringify(body)}`,
		)
	}

	const jobId = typeof body?.job_id === "string" ? body.job_id : null
	if (!jobId) {
		throw new Error(
			`Enqueue ${kind} returned no job_id: ${JSON.stringify(body)}`,
		)
	}

	return {
		job_id: jobId,
		status: typeof body?.status === "string" ? body.status : "queued",
		queue: typeof body?.queue === "string" ? body.queue : undefined,
		created_at:
			typeof body?.created_at === "string" ? body.created_at : undefined,
	}
}

export async function getAnalysisJobStatus(
	kind: AnalysisKind,
	jobId: string,
): Promise<Record<string, unknown>> {
	const baseUrl = getSearchApiBaseUrl("stg")
	const headers = getSearchApiHeaders()
	const endpoint = `${ASYNC_ENDPOINTS[kind].jobPathPrefix}/${jobId}`

	const response = await fetch(`${baseUrl}${endpoint}`, {
		method: "GET",
		headers,
	})
	const body = (await fetchJsonOrNull(response)) as Record<
		string,
		unknown
	> | null

	if (!response.ok) {
		throw new Error(
			`Failed to get ${kind} job status (${response.status}): ${JSON.stringify(body)}`,
		)
	}

	return body ?? {}
}

export function getAnalysisDataKey(kind: AnalysisKind): AnalysisKey {
	return ASYNC_ENDPOINTS[kind].dataKey
}

export function getAnalysisJobKey(kind: AnalysisKind): AnalysisKey {
	return ASYNC_ENDPOINTS[kind].jobKey
}

export function trackAnalysisJobUntilDone(
	kind: AnalysisKind,
	nodeId: string,
	treeId: string | null,
	backendJobId: string,
	explicitTrackingJobId?: number | null,
): void {
	const task = (async () => {
		const maxWaitMs = getEnvNumber("ANALYSIS_JOB_TRACK_MAX_MS", 10 * 60 * 1000)
		const pollIntervalMs = getEnvNumber("ANALYSIS_JOB_TRACK_POLL_MS", 3000)
		const startedAt = Date.now()
		const dataKey = getAnalysisDataKey(kind)
		const jobKey = getAnalysisJobKey(kind)

		while (Date.now() - startedAt <= maxWaitMs) {
			const jobStatus = await getAnalysisJobStatus(kind, backendJobId)
			const status =
				typeof jobStatus.status === "string" ? jobStatus.status : "unknown"

			await saveNodeAnalysis(nodeId, jobKey, jobStatus)
			await updateTrackingJob(
				kind,
				backendJobId,
				status === "completed" || status === "failed" ? status : "running",
				{ job_status: jobStatus, node_id: nodeId, tree_id: treeId },
				explicitTrackingJobId,
			)

			if (status === "completed") {
				const result = jobStatus.result
				await saveNodeAnalysis(nodeId, dataKey, result)
				await updateTrackingJob(
					kind,
					backendJobId,
					"completed",
					{
						node_id: nodeId,
						tree_id: treeId,
						job_status: jobStatus,
						node_analysis_synced: true,
						node_analysis_key: dataKey,
					},
					explicitTrackingJobId,
				)
				return
			}

			if (status === "failed") {
				await updateTrackingJob(
					kind,
					backendJobId,
					"failed",
					{
						node_id: nodeId,
						tree_id: treeId,
						job_status: jobStatus,
					},
					explicitTrackingJobId,
				)
				return
			}

			await sleep(pollIntervalMs)
		}

		await updateTrackingJob(
			kind,
			backendJobId,
			"running",
			{
				node_id: nodeId,
				tree_id: treeId,
				tracking_timeout: true,
			},
			explicitTrackingJobId,
		)
	})()

	scheduleBackgroundTask(task)
}
