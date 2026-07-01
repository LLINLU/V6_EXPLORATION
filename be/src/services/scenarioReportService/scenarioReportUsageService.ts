import { db } from "../../db/client.js"
import { usage } from "../../db/schema/index.js"
import { logger } from "../../logger.js"

export async function recordScenarioReportUsage(
	jobId: string,
	step: string,
	promptTokens: number,
	completionTokens: number,
	costUsd: number,
) {
	// `cost_usd` is `numeric(10, 6)`. Drizzle / pg expose numeric as string
	// to avoid float precision loss, so we convert at the boundary here
	// while keeping the public function signature `number`-typed.
	await db.insert(usage).values({
		jobId,
		step,
		promptTokens,
		completionTokens,
		costUsd: costUsd.toString(),
	})
	logger.info(
		{ jobId, step, promptTokens, completionTokens, costUsd },
		"scenarioReportUsageService::recordScenarioReportUsage::recorded",
	)
}
