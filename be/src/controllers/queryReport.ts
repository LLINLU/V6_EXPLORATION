import { Router } from "express"
import { z } from "zod"
import { logger } from "../logger.js"
import { requireAuth } from "../middleware/auth.js"
import { ipRestriction } from "../middleware/ipRestriction.js"
import {
	createQueryReportJob,
	createQueryReportJobRequest,
	getInProgressQueryReportJob,
	getLastQueryReportJob,
} from "../services/queryReportService/queryReportJobService.js"
import { checkQueryReportLimit } from "../services/queryReportService/queryReportLimitService.js"
import { getQueryReportResult } from "../services/queryReportService/queryReportResultService.js"
import { verifyTreeOwnership } from "../services/queryReportService/queryTechnicalAdvantageService.js"
import { enqueueQueryReportJob } from "../queue/index.js"

const createSchema = z.object({
	query_id: z.string().uuid(),
	query: z.string().min(1),
	language: z.string().min(1),
	technicalAdvantages: z
		.array(
			z.object({
				strengthName: z.string().nullable(),
				description: z.string().nullable(),
				potentialApplications: z.string().nullable(),
			}),
		)
		.optional(),
})

const queryIdParamSchema = z.string().uuid()
const QUERY_REPORT_FAILED_MESSAGE = "Report generation failed. Please try again."

export const queryReportRouter = Router()

function secondsSince(
	timestamp: Date | string | null | undefined,
): number | null {
	if (!timestamp) return null
	const ms = Date.now() - new Date(timestamp).getTime()
	return Math.max(0, Math.floor(ms / 1000))
}

function isUniqueConstraintViolation(err: unknown): boolean {
	if (!err || typeof err !== "object") return false
	if ("code" in err && (err as { code?: unknown }).code === "23505") {
		return true
	}
	if ("cause" in err) {
		return isUniqueConstraintViolation((err as { cause?: unknown }).cause)
	}
	return false
}

queryReportRouter.post("/query-report", requireAuth, ipRestriction, async (req, res) => {
	const userId = res.locals.userId as string

	const parsed = createSchema.safeParse(req.body)
	if (!parsed.success) {
		logger.warn(
			{ userId, errors: parsed.error.errors },
			"queryReport::POST::invalid request body",
		)
		res
			.status(400)
			.json({ error: "Invalid request", details: parsed.error.errors })
		return
	}
	const body = parsed.data

	logger.info(
		{
			userId,
			queryId: body.query_id,
			query: body.query,
			language: body.language,
			technicalAdvantages: body.technicalAdvantages?.length ?? 0,
		},
		"queryReport::POST::received",
	)

	try {
		const limit = await checkQueryReportLimit(userId)
		logger.info(
			{ userId, used: limit.used, limit: limit.limit, allowed: limit.allowed },
			"queryReport::POST::limit check",
		)

		if (!limit.allowed) {
			logger.warn(
				{ userId, used: limit.used, limit: limit.limit },
				"queryReport::POST::limit exceeded",
			)
			res.status(429).json({
				error: "Monthly report limit reached",
				used: limit.used,
				limit: limit.limit,
			})
			return
		}

		const ownsTree = await verifyTreeOwnership(body.query_id, userId)
		if (!ownsTree) {
			logger.warn(
				{ userId, queryId: body.query_id },
				"queryReport::POST::tree ownership check failed",
			)
			return res.status(403).json({ error: "Forbidden" })
		}

		const activeJob = await getInProgressQueryReportJob(body.query_id, userId)
		if (activeJob) {
			logger.info(
				{
					userId,
					queryId: body.query_id,
					jobId: activeJob.id,
					status: activeJob.status,
				},
				"queryReport::POST::active job exists, returning 409",
			)
			return res.status(409).json({
				job_id: activeJob.id,
				status: activeJob.status,
				error: "A report is already being generated for this query.",
			})
		}

		let job: Awaited<ReturnType<typeof createQueryReportJob>>
		try {
			job = await createQueryReportJob(userId, body.query_id)
		} catch (err) {
			if (!isUniqueConstraintViolation(err)) {
				throw err
			}

			const activeJobAfterRace = await getInProgressQueryReportJob(
				body.query_id,
				userId,
			)
			logger.info(
				{
					userId,
					queryId: body.query_id,
					jobId: activeJobAfterRace?.id ?? null,
				},
				"queryReport::POST::active job unique index conflict, returning 409",
			)
			return res.status(409).json({
				job_id: activeJobAfterRace?.id ?? null,
				status: activeJobAfterRace?.status ?? "queued",
				error: "A report is already being generated for this query.",
			})
		}
		logger.info(
			{ userId, queryId: body.query_id, jobId: job.id },
			"queryReport::POST::job created",
		)

		await createQueryReportJobRequest(job.id, body)
		logger.info({ jobId: job.id }, "queryReport::POST::job request saved")

		await enqueueQueryReportJob({
			jobId: job.id,
			queryId: body.query_id,
			query: body.query,
			language: body.language,
			userId,
		})
		logger.info(
			{ jobId: job.id, queryId: body.query_id },
			"queryReport::POST::job enqueued → 201",
		)

		return res.status(201).json({ job_id: job.id, status: "queued" })
	} catch (err) {
		logger.error(
			{ err, userId, queryId: body.query_id },
			"queryReport::POST::unhandled error",
		)
		res.status(500).json({ error: "Internal server error" })
	}
})

queryReportRouter.get("/query-report/:id", requireAuth, ipRestriction, async (req, res) => {
	const reqStart = Date.now()
	const parsedQueryId = queryIdParamSchema.safeParse(req.params.id)
	const userId = res.locals.userId as string
	const elapsed = () => `${Date.now() - reqStart}ms`

	if (!parsedQueryId.success) {
		logger.warn(
			{ userId, queryId: req.params.id, errors: parsedQueryId.error.errors },
			"queryReport::GET::invalid query id",
		)
		return res.status(400).json({ error: "Invalid query report id" })
	}

	const queryId = parsedQueryId.data

	logger.info({ queryId, userId }, "queryReport::GET::start")

	try {
		const result = await getQueryReportResult(queryId, userId)
		logger.info(
			{ queryId, hit: !!result, elapsed: elapsed() },
			"queryReport::GET::getQueryReportResult",
		)

		if (result) {
			logger.info(
				{ queryId, jobId: result.jobId },
				"queryReport::GET::status=done → returning result",
			)
			return res.json({
				query_id: result.queryId,
				job_id: result.jobId,
				status: "done",
				progress: null,
				job_created_at: null,
				job_updated_at: null,
				job_elapsed_sec: null,
				data: result.resultJson,
				message: "Report is ready",
			})
		}

		const activeJob = await getInProgressQueryReportJob(queryId, userId)
		logger.info(
			{ queryId, status: activeJob?.status ?? "none", elapsed: elapsed() },
			"queryReport::GET::getInProgressQueryReportJob",
		)

		if (activeJob) {
			const status = activeJob.status === "running" ? "running" : "queued"
			logger.info(
				{
					queryId,
					jobId: activeJob.id,
					status,
					progress: activeJob.progress,
				},
				"queryReport::GET::returning active job status",
			)
			return res.json({
				query_id: queryId,
				job_id: activeJob.id,
				status,
				progress: activeJob.progress ?? null,
				job_created_at: activeJob.createdAt ?? null,
				job_updated_at: activeJob.updatedAt ?? null,
				job_elapsed_sec: secondsSince(activeJob.createdAt),
				data: {},
				message:
					status === "running"
						? "Report generation is in progress"
						: "Report generation is queued",
			})
		}

		const lastJob = await getLastQueryReportJob(queryId, userId)
		logger.info(
			{
				queryId,
				status: lastJob ? `failed(${lastJob.status})` : "none",
				elapsed: elapsed(),
			},
			"queryReport::GET::getLastQueryReportJob",
		)

		if (!lastJob) {
			logger.info({ queryId }, "queryReport::GET::status=not_found")
			return res.json({
				query_id: queryId,
				job_id: null,
				status: "not_found",
				progress: null,
				job_created_at: null,
				job_updated_at: null,
				job_elapsed_sec: null,
				data: {},
				message: "No report or job found for this query",
			})
		}

		logger.info(
			{ queryId, jobId: lastJob.id, progress: lastJob.progress },
			"queryReport::GET::status=failed",
		)
		return res.json({
			query_id: queryId,
			job_id: lastJob.id,
			status: "failed",
			progress: QUERY_REPORT_FAILED_MESSAGE,
			job_created_at: lastJob.createdAt ?? null,
			job_updated_at: lastJob.updatedAt ?? null,
			job_elapsed_sec: secondsSince(lastJob.updatedAt),
			data: {},
			message: QUERY_REPORT_FAILED_MESSAGE,
		})
	} catch (err) {
		logger.error(
			{ err, queryId, userId, elapsed: elapsed() },
			"queryReport::GET::unhandled error",
		)
		return res.status(500).json({ error: "Internal server error" })
	}
})
