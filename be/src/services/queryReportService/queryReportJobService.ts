import { and, desc, eq, inArray } from "drizzle-orm"
import type { JobStatus } from "../../constants/jobStatus.js"
import { db } from "../../db/client.js"
import { queryReportJobs, queryReportRequests } from "../../db/schema/index.js"
import { logger } from "../../logger.js"

export async function createQueryReportJob(userId: string, queryId: string) {
	const [job] = await db
		.insert(queryReportJobs)
		.values({ userId, queryId })
		.returning()
	logger.info(
		{ jobId: job.id, userId, queryId },
		"queryReportJobService::createQueryReportJob::created",
	)
	return job
}

export async function createQueryReportJobRequest(
	jobId: string,
	inputPayload: Record<string, unknown>,
) {
	await db.insert(queryReportRequests).values({ jobId, inputPayload })
	logger.info(
		{ jobId },
		"queryReportJobService::createQueryReportJobRequest::saved",
	)
}

export async function getInProgressQueryReportJob(
	queryId: string,
	userId: string,
) {
	const [job] = await db
		.select()
		.from(queryReportJobs)
		.where(
			and(
				eq(queryReportJobs.queryId, queryId),
				eq(queryReportJobs.userId, userId),
				inArray(queryReportJobs.status, ["queued", "running"]),
			),
		)
		.orderBy(desc(queryReportJobs.createdAt))
		.limit(1)
	const result = job ?? null
	logger.debug(
		{ queryId, userId, found: !!result, status: result?.status ?? null },
		"queryReportJobService::getInProgressQueryReportJob",
	)
	return result
}

export async function getLastQueryReportJob(queryId: string, userId: string) {
	const [job] = await db
		.select()
		.from(queryReportJobs)
		.where(
			and(
				eq(queryReportJobs.queryId, queryId),
				eq(queryReportJobs.userId, userId),
			),
		)
		.orderBy(desc(queryReportJobs.createdAt))
		.limit(1)
	const result = job ?? null
	logger.debug(
		{ queryId, userId, found: !!result, status: result?.status ?? null },
		"queryReportJobService::getLastQueryReportJob",
	)
	return result
}

export async function updateQueryReportJobStatus(
	jobId: string,
	status: JobStatus,
	progress?: string,
) {
	await db
		.update(queryReportJobs)
		.set({ status, progress: progress ?? null })
		.where(eq(queryReportJobs.id, jobId))
	logger.info(
		{ jobId, status, progress: progress ?? null },
		"queryReportJobService::updateQueryReportJobStatus::updated",
	)
}
