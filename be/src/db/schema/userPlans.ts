import { sql } from "drizzle-orm"
import {
	check,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const userPlans = pgTable(
	"user_plans",
	{
		userId: uuid("user_id").primaryKey(),
		plan: text("plan").notNull().default("free"),
		// per-user override; NULL means use plan default (FREE_MONTHLY_REPORT_LIMIT env)
		monthlyReportLimit: integer("monthly_report_limit"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		// See note in jobs.ts about $onUpdate semantics (application-level only).
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		check("user_plans_plan_check", sql`${table.plan} IN ('free', 'unlimited')`),
	],
)

export type UserPlan = typeof userPlans.$inferSelect
export type NewUserPlan = typeof userPlans.$inferInsert
