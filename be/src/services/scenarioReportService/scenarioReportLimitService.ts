import { and, eq, gte, ne, sql } from "drizzle-orm"
import { env } from "../../config/env.js"
import { db } from "../../db/client.js"
import { jobs, userPlans } from "../../db/schema/index.js"
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
	// `plan` is text + check constraint at the DB level, so the value is
	// guaranteed to be one of the two literals. Cast for the public type.
	return {
		plan: row.plan as "free" | "unlimited",
		monthlyReportLimit: row.monthlyReportLimit,
	}
}

async function countMonthlyScenarioReports(userId: string): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`COUNT(*)::int` })
		.from(jobs)
		.where(
			and(
				eq(jobs.userId, userId),
				gte(jobs.createdAt, sql`date_trunc('month', now())`),
				ne(jobs.status, "failed"),
			),
		)
	return row?.count ?? 0
}

const UNLIMITED_USER_IDS = new Set(
	env.UNLIMITED_USER_IDS.split(",")
		.map((s) => s.trim())
		.filter(Boolean),
)

export interface ScenarioReportLimitCheck {
	allowed: boolean
	used: number
	limit: number | null
}

export async function checkScenarioReportLimit(
	userId: string,
): Promise<ScenarioReportLimitCheck> {
	if (UNLIMITED_USER_IDS.has(userId)) {
		logger.info(
			{ userId },
			"scenarioReportLimitService::checkScenarioReportLimit::unlimited user bypass",
		)
		return { allowed: true, used: 0, limit: null }
	}

	const [planRow, used] = await Promise.all([
		getUserPlan(userId).catch((err) => {
			logger.warn(
				{ err, userId },
				"scenarioReportLimitService::checkScenarioReportLimit::getUserPlan failed, defaulting to free",
			)
			return null
		}),
		countMonthlyScenarioReports(userId),
	])

	const plan = planRow?.plan ?? "free"

	if (plan === "unlimited") {
		logger.info(
			{ userId, plan, used },
			"scenarioReportLimitService::checkScenarioReportLimit::unlimited plan",
		)
		return { allowed: true, used, limit: null }
	}

	// Per-user override takes precedence over the plan default
	const limit = planRow?.monthlyReportLimit ?? FREE_MONTHLY_LIMIT

	logger.info(
		{
			userId,
			plan,
			used,
			limit,
			perUserOverride: planRow?.monthlyReportLimit ?? null,
		},
		"scenarioReportLimitService::checkScenarioReportLimit::result",
	)

	return {
		allowed: used < limit,
		used,
		limit,
	}
}
