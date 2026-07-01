import { and, desc, eq } from "drizzle-orm"
import { db } from "../../db/client.js"
import { queryReportJobs, queryReportResults } from "../../db/schema/index.js"

export async function saveQueryReportResult(
	jobId: string,
	queryId: string,
	resultJson: Record<string, unknown>,
) {
	await db.insert(queryReportResults).values({ jobId, queryId, resultJson })
}

export async function getQueryReportResult(queryId: string, userId: string) {
	const [row] = await db
		.select({ result: queryReportResults })
		.from(queryReportResults)
		.innerJoin(
			queryReportJobs,
			eq(queryReportResults.jobId, queryReportJobs.id),
		)
		.where(
			and(
				eq(queryReportResults.queryId, queryId),
				eq(queryReportJobs.userId, userId),
			),
		)
		.orderBy(desc(queryReportResults.validatedAt))
		.limit(1)
	return row?.result ?? null
}
