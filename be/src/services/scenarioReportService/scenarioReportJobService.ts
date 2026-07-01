import { and, desc, eq, inArray } from "drizzle-orm"
import type { JobStatus } from "../../constants/jobStatus.js"
import { db } from "../../db/client.js"
import { jobs, requests } from "../../db/schema/index.js"
import { logger } from "../../logger.js"

export async function createScenarioReportJob(
	userId: string,
	scenarioId: string,
) {
	const [job] = await db.insert(jobs).values({ userId, scenarioId }).returning()
	logger.info(
		{ jobId: job.id, userId, scenarioId },
		"scenarioReportJobService::createScenarioReportJob::created",
	)
	return job
}

export async function createScenarioReportJobRequest(
	jobId: string,
	inputPayload: Record<string, unknown>,
) {
	await db.insert(requests).values({ jobId, inputPayload })
	logger.info(
		{ jobId },
		"scenarioReportJobService::createScenarioReportJobRequest::saved",
	)
}

export async function getInProgressScenarioReportJob(
	scenarioId: string,
	userId: string,
) {
	const [job] = await db
		.select()
		.from(jobs)
		.where(
			and(
				eq(jobs.scenarioId, scenarioId),
				eq(jobs.userId, userId),
				inArray(jobs.status, ["queued", "running"]),
			),
		)
		.orderBy(desc(jobs.createdAt))
		.limit(1)
	const result = job ?? null
	logger.debug(
		{ scenarioId, userId, found: !!result, status: result?.status ?? null },
		"scenarioReportJobService::getInProgressScenarioReportJob",
	)
	return result
}

export async function getLastScenarioReportJob(
	scenarioId: string,
	userId: string,
) {
	const [job] = await db
		.select()
		.from(jobs)
		.where(and(eq(jobs.scenarioId, scenarioId), eq(jobs.userId, userId)))
		.orderBy(desc(jobs.createdAt))
		.limit(1)
	const result = job ?? null
	logger.debug(
		{ scenarioId, userId, found: !!result, status: result?.status ?? null },
		"scenarioReportJobService::getLastScenarioReportJob",
	)
	return result
}

export async function updateScenarioReportJobStatus(
	jobId: string,
	status: JobStatus,
	progress?: string,
) {
	// `updatedAt` is auto-set by Drizzle's $onUpdate hook (see schema/jobs.ts).
	// No need to set it explicitly here.
	await db
		.update(jobs)
		.set({ status, progress: progress ?? null })
		.where(eq(jobs.id, jobId))
	logger.info(
		{ jobId, status, progress: progress ?? null },
		"scenarioReportJobService::updateScenarioReportJobStatus::updated",
	)
}
