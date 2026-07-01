import { db } from "../../db/client.js"
import { queryReportUsage } from "../../db/schema/index.js"
import { logger } from "../../logger.js"

export async function recordQueryReportUsage(
	jobId: string,
	step: string,
	promptTokens: number,
	completionTokens: number,
	costUsd: number,
) {
	await db.insert(queryReportUsage).values({
		jobId,
		step,
		promptTokens,
		completionTokens,
		costUsd: costUsd.toString(),
	})
	logger.info(
		{ jobId, step, promptTokens, completionTokens, costUsd },
		"queryReportUsageService::recordQueryReportUsage::recorded",
	)
}
