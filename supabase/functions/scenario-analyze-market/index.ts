import {
	corsHeaders,
	createTrackingJob,
	enqueueAnalysisJob,
	getAnalysisDataKey,
	getAnalysisJobKey,
	getAnalysisJobStatus,
	jsonResponse,
	saveNodeAnalysis,
	trackAnalysisJobUntilDone,
	updateTrackingJob,
} from "../_shared/node-analysis.ts"

type PollQuery = {
	nodeId: string | null
	jobId: string | null
	edgeJobId: number | null
	treeId: string | null
}

function parsePollQuery(url: URL): PollQuery {
	const nodeIdParam = url.searchParams.get("node_id")
	const jobId = url.searchParams.get("job_id")
	const edgeJobRaw = url.searchParams.get("edge_job_id")
	const treeId = url.searchParams.get("tree_id")

	return {
		nodeId: nodeIdParam,
		jobId,
		edgeJobId: edgeJobRaw ? Number(edgeJobRaw) : null,
		treeId,
	}
}

async function handlePoll(
	nodeId: string,
	jobId: string,
	edgeJobId: number | null,
	treeId: string | null,
): Promise<Response> {
	const kind = "analyze_market" as const
	const dataKey = getAnalysisDataKey(kind)
	const jobKey = getAnalysisJobKey(kind)

	const jobStatus = await getAnalysisJobStatus(kind, jobId)
	const status =
		typeof jobStatus.status === "string" ? jobStatus.status : "unknown"
	const trackingId = await updateTrackingJob(
		kind,
		jobId,
		status === "completed" || status === "failed" ? status : "running",
		{ job_status: jobStatus, node_id: nodeId, tree_id: treeId },
		edgeJobId,
	)

	await saveNodeAnalysis(nodeId, jobKey, jobStatus)

	if (status !== "completed") {
		return jsonResponse(
			{
				node_id: nodeId,
				job: jobStatus,
				status,
				edge_job_id: trackingId,
			},
			202,
		)
	}

	const result = jobStatus.result
	const savedData = await saveNodeAnalysis(nodeId, dataKey, result)
	await updateTrackingJob(
		kind,
		jobId,
		"completed",
		{
			node_id: nodeId,
			tree_id: treeId,
			job_status: jobStatus,
			node_analysis_synced: true,
			node_analysis_key: dataKey,
		},
		trackingId,
	)

	return jsonResponse({
		node_id: nodeId,
		data: savedData,
		analyze_market: result,
		job: jobStatus,
		edge_job_id: trackingId,
	})
}

Deno.serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders })
	}

	const kind = "analyze_market" as const
	const jobKey = getAnalysisJobKey(kind)

	try {
		if (req.method === "GET") {
			const { nodeId, jobId, edgeJobId, treeId } = parsePollQuery(
				new URL(req.url),
			)
			if (!nodeId || !jobId) {
				return jsonResponse({ error: "node_id and job_id are required" }, 400)
			}

			return await handlePoll(nodeId, jobId, edgeJobId, treeId)
		}

		if (req.method !== "POST") {
			return jsonResponse({ error: "Method not allowed" }, 405)
		}

		const body = await req.json()
		const bodyObj =
			body && typeof body === "object" ? (body as Record<string, unknown>) : {}

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

		// Check if there's already a job_id to poll
		const pollJobId = typeof bodyObj.job_id === "string" ? bodyObj.job_id : null
		const pollEdgeJobId =
			typeof bodyObj.edge_job_id === "number" ? bodyObj.edge_job_id : null

		if (pollJobId) {
			return await handlePoll(nodeId, pollJobId, pollEdgeJobId, treeId)
		}

		// Build Search API payload
		const scenario =
			bodyObj.scenario && typeof bodyObj.scenario === "object"
				? (bodyObj.scenario as Record<string, unknown>)
				: {}

		const searchPayload = {
			scenario: {
				...scenario,
				target_year: bodyObj.target_year ?? scenario.target_year ?? 2024,
				target_region:
					bodyObj.target_region ?? scenario.target_region ?? "Global",
				segments: Array.isArray(bodyObj.segments)
					? bodyObj.segments
					: Array.isArray(scenario.segments)
						? scenario.segments
						: [],
				use_self_refinement:
					bodyObj.use_self_refinement ?? scenario.use_self_refinement ?? true,
			},
			...(bodyObj.language ? { language: bodyObj.language } : {}),
		}

		const enqueued = await enqueueAnalysisJob(kind, searchPayload)
		const trackingId = await createTrackingJob(
			kind,
			nodeId,
			treeId,
			searchPayload,
			enqueued,
		)

		await saveNodeAnalysis(nodeId, jobKey, enqueued)
		trackAnalysisJobUntilDone(kind, nodeId, treeId, enqueued.job_id, trackingId)

		return jsonResponse(
			{
				node_id: nodeId,
				job: enqueued,
				edge_job_id: trackingId,
				status: "queued",
			},
			202,
		)
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unexpected error"
		console.error("[scenario-analyze-market] error:", message)
		return jsonResponse({ error: message }, 500)
	}
})
