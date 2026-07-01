import { and, desc, eq } from "drizzle-orm"
import { db } from "../../db/client.js"
import { jobs, results } from "../../db/schema/index.js"

export async function saveScenarioReportResult(
	jobId: string,
	scenarioId: string,
	resultJson: Record<string, unknown>,
) {
	await db.insert(results).values({ jobId, scenarioId, resultJson })
}

export async function getScenarioResult(scenarioId: string, userId: string) {
	// `results` has no user_id column, so ownership is enforced via the
	// joined job. The latest validated_at wins — we explicitly do NOT use
	// a UNIQUE constraint on (scenario_id) so that re-generations append
	// new rows over time (see comment in schema/results.ts).
	const [row] = await db
		.select({ result: results })
		.from(results)
		.innerJoin(jobs, eq(results.jobId, jobs.id))
		.where(and(eq(results.scenarioId, scenarioId), eq(jobs.userId, userId)))
		.orderBy(desc(results.validatedAt))
		.limit(1)
	return row?.result ?? null
}
