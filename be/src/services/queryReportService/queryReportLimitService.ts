import { and, eq, gte, sql } from "drizzle-orm"
import { env } from "../../config/env.js"
import { db } from "../../db/client.js"
import { queryReportJobs, userPlans } from "../../db/schema/index.js"
import { logger } from "../../logger.js"

const FREE_MONTHLY_LIMIT = env.FREE_MONTHLY_REPORT_LIMIT

async function getUserPlan(userId: string): Promise<{
	plan: "free" | "unlimited"
	monthlyReportLimit: number | null
} | null> {
	const [row] = await db
		.select({
			plan: userPlans.plan,
			monthlyReportLimit: userPlans.monthlyReportLimit,
		})
		.from(userPlans)
		.where(eq(userPlans.userId, userId))
	if (!row) return null
	return {
		plan: row.plan as "free" | "unlimited",
		monthlyReportLimit: row.monthlyReportLimit,
	}
}

async function countMonthlyQueryReports(userId: string): Promise<number> {
	// Query reports consume quota only after a report is produced. Active jobs are
	// controlled separately by uniq_query_report_active_job and failed jobs are retryable.
	const [row] = await db
		.select({ count: sql<number>`COUNT(*)::int` })
		.from(queryReportJobs)
		.where(
			and(
				eq(queryReportJobs.userId, userId),
				gte(queryReportJobs.createdAt, sql`date_trunc('month', now())`),
				eq(queryReportJobs.status, "done"),
			),
		)
	return row?.count ?? 0
}

const UNLIMITED_USER_IDS = new Set(
	env.UNLIMITED_USER_IDS.split(",")
		.map((s) => s.trim())
		.filter(Boolean),
)

export interface QueryReportLimitCheck {
	allowed: boolean
	used: number
	limit: number | null
}

export async function checkQueryReportLimit(
	userId: string,
): Promise<QueryReportLimitCheck> {
	if (UNLIMITED_USER_IDS.has(userId)) {
		logger.info(
			{ userId },
			"queryReportLimitService::checkQueryReportLimit::unlimited user bypass",
		)
		return { allowed: true, used: 0, limit: null }
	}

	const [planRow, used] = await Promise.all([
		getUserPlan(userId).catch((err) => {
			logger.warn(
				{ err, userId },
				"queryReportLimitService::checkQueryReportLimit::getUserPlan failed, defaulting to free",
			)
			return null
		}),
		countMonthlyQueryReports(userId),
	])

	const plan = planRow?.plan ?? "free"

	if (plan === "unlimited") {
		logger.info(
			{ userId, plan, used },
			"queryReportLimitService::checkQueryReportLimit::unlimited plan",
		)
		return { allowed: true, used, limit: null }
	}

	const limit = planRow?.monthlyReportLimit ?? FREE_MONTHLY_LIMIT

	logger.info(
		{
			userId,
			plan,
			used,
			limit,
			perUserOverride: planRow?.monthlyReportLimit ?? null,
		},
		"queryReportLimitService::checkQueryReportLimit::result",
	)

	return {
		allowed: used < limit,
		used,
		limit,
	}
}
