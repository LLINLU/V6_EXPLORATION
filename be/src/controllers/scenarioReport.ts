import type { Request, Response } from "express"
import { Router } from "express"
import { z } from "zod"
import { logger } from "../logger.js"
import { requireAuth } from "../middleware/auth.js"
import { ipRestriction } from "../middleware/ipRestriction.js"
import { enqueueReportJob } from "../queue/index.js"
import {
	createScenarioReportJob,
	createScenarioReportJobRequest,
	getInProgressScenarioReportJob,
	getLastScenarioReportJob,
} from "../services/scenarioReportService/scenarioReportJobService.js"
import { checkScenarioReportLimit } from "../services/scenarioReportService/scenarioReportLimitService.js"
import { getScenarioResult } from "../services/scenarioReportService/scenarioReportResultService.js"

const createSchema = z.object({
	theme: z.string().min(1),
	scenario_title: z.string().min(1),
	scenario_description: z.string().min(1),
	scenario_id: z.string().uuid(),
	language: z.string().min(1),
})

export const scenarioReportRouter = Router()

/** Returns how many whole seconds have elapsed since the given timestamp. */
function secondsSince(
	timestamp: Date | string | null | undefined,
): number | null {
	if (!timestamp) return null
	const ms = Date.now() - new Date(timestamp).getTime()
	return Math.max(0, Math.floor(ms / 1000))
}

async function handlePostScenarioReport(req: Request, res: Response) {
	const userId = res.locals.userId as string

	const parsed = createSchema.safeParse(req.body)
	if (!parsed.success) {
		logger.warn(
			{ userId, errors: parsed.error.errors },
			"scenarioReport::POST::invalid request body",
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
			scenarioId: body.scenario_id,
			theme: body.theme,
			language: body.language,
		},
		"scenarioReport::POST::received",
	)

	try {
		const limit = await checkScenarioReportLimit(userId)
		logger.info(
			{ userId, used: limit.used, limit: limit.limit, allowed: limit.allowed },
			"scenarioReport::POST::limit check",
		)

		if (!limit.allowed) {
			logger.warn(
				{ userId, used: limit.used, limit: limit.limit },
				"scenarioReport::POST::limit exceeded",
			)
			res.status(429).json({
				error: "Monthly report limit reached",
				used: limit.used,
				limit: limit.limit,
			})
			return
		}

		const activeJob = await getInProgressScenarioReportJob(
			body.scenario_id,
			userId,
		)
		if (activeJob) {
			logger.info(
				{
					userId,
					scenarioId: body.scenario_id,
					jobId: activeJob.id,
					status: activeJob.status,
				},
				"scenarioReport::POST::active job exists, returning 409",
			)
			return res.status(409).json({
				job_id: activeJob.id,
				status: activeJob.status,
				error: "A report is already being generated for this scenario.",
			})
		}

		const job = await createScenarioReportJob(userId, body.scenario_id)
		logger.info(
			{ userId, scenarioId: body.scenario_id, jobId: job.id },
			"scenarioReport::POST::job created",
		)

		await createScenarioReportJobRequest(job.id, body)
		logger.info({ jobId: job.id }, "scenarioReport::POST::job request saved")

		await enqueueReportJob({
			jobId: job.id,
			theme: body.theme,
			scenarioTitle: body.scenario_title,
			scenarioDescription: body.scenario_description,
			scenarioId: body.scenario_id,
			language: body.language,
			userId,
		})
		logger.info(
			{ jobId: job.id, scenarioId: body.scenario_id },
			"scenarioReport::POST::job enqueued → 201",
		)

		return res.status(201).json({ job_id: job.id, status: "queued" })
	} catch (err) {
		logger.error(
			{ err, userId, scenarioId: body.scenario_id },
			"scenarioReport::POST::unhandled error",
		)
		res.status(500).json({ error: "Internal server error" })
	}
}

async function handleGetScenarioReport(req: Request, res: Response) {
	const reqStart = Date.now()
	const scenarioId = String(req.params.id)
	const userId = res.locals.userId as string
	const elapsed = () => `${Date.now() - reqStart}ms`

	logger.info({ scenarioId, userId }, "scenarioReport::GET::start")

	try {
		const result = await getScenarioResult(scenarioId, userId)
		logger.info(
			{ scenarioId, hit: !!result, elapsed: elapsed() },
			"scenarioReport::GET::getScenarioResult",
		)

		if (result) {
			logger.info(
				{ scenarioId, jobId: result.jobId },
				"scenarioReport::GET::status=done → returning result",
			)
			return res.json({
				scenario_id: result.scenarioId,
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

		const activeJob = await getInProgressScenarioReportJob(scenarioId, userId)
		logger.info(
			{ scenarioId, status: activeJob?.status ?? "none", elapsed: elapsed() },
			"scenarioReport::GET::getInProgressScenarioReportJob",
		)

		if (activeJob) {
			const status = activeJob.status === "running" ? "running" : "queued"
			logger.info(
				{
					scenarioId,
					jobId: activeJob.id,
					status,
					progress: activeJob.progress,
				},
				"scenarioReport::GET::returning active job status",
			)
			return res.json({
				scenario_id: scenarioId,
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

		const lastJob = await getLastScenarioReportJob(scenarioId, userId)
		logger.info(
			{
				scenarioId,
				status: lastJob ? `failed(${lastJob.status})` : "none",
				elapsed: elapsed(),
			},
			"scenarioReport::GET::getLastScenarioReportJob",
		)

		if (!lastJob) {
			logger.info({ scenarioId }, "scenarioReport::GET::status=not_found")
			return res.json({
				scenario_id: scenarioId,
				job_id: null,
				status: "not_found",
				progress: null,
				job_created_at: null,
				job_updated_at: null,
				job_elapsed_sec: null,
				data: {},
				message: "No report or job found for this scenario",
			})
		}

		logger.info(
			{ scenarioId, jobId: lastJob.id, progress: lastJob.progress },
			"scenarioReport::GET::status=failed",
		)
		return res.json({
			scenario_id: scenarioId,
			job_id: lastJob.id,
			status: "failed",
			progress: lastJob.progress ?? null,
			job_created_at: lastJob.createdAt ?? null,
			job_updated_at: lastJob.updatedAt ?? null,
			job_elapsed_sec: secondsSince(lastJob.updatedAt),
			data: {},
			message: lastJob.progress ?? "Report generation failed for this scenario",
		})
	} catch (err) {
		logger.error(
			{ err, scenarioId, userId, elapsed: elapsed() },
			`scenarioReport::GET::unhandled error ${String(err)}`,
		)
		return res.status(500).json({ error: "Internal server error" })
	}
}

scenarioReportRouter.post(
	"/scenario-report",
	requireAuth,
	ipRestriction,
	handlePostScenarioReport,
)

scenarioReportRouter.get(
	"/scenario-report/:id",
	requireAuth,
	ipRestriction,
	handleGetScenarioReport,
)
