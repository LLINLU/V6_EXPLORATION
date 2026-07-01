import {
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { queryReportJobs } from "./queryReportJobs.js"

export const queryReportUsage = pgTable(
	"query_report_usage",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		jobId: uuid("job_id")
			.notNull()
			.references(() => queryReportJobs.id),
		step: text("step").notNull(),
		promptTokens: integer("prompt_tokens").notNull().default(0),
		completionTokens: integer("completion_tokens").notNull().default(0),
		costUsd: numeric("cost_usd", { precision: 10, scale: 6 })
			.notNull()
			.default("0"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index("idx_query_report_usage_job_id").on(table.jobId)],
)

export type QueryReportUsage = typeof queryReportUsage.$inferSelect
export type NewQueryReportUsage = typeof queryReportUsage.$inferInsert
