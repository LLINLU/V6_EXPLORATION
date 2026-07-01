import { sql } from "drizzle-orm"
import {
	check,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core"

export const queryReportJobs = pgTable(
	"query_report_jobs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		status: text("status").notNull().default("queued"),
		progress: text("progress"),
		retryCount: integer("retry_count").notNull().default(0),
		userId: uuid("user_id").notNull(),
		queryId: uuid("query_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		check(
			"query_report_jobs_status_check",
			sql`${table.status} IN ('queued', 'running', 'done', 'failed')`,
		),
		index("idx_query_report_jobs_query_id").on(table.queryId),
		index("idx_query_report_jobs_status").on(table.status),
		index("idx_query_report_jobs_user_created").on(table.userId, table.createdAt),
		uniqueIndex("uniq_query_report_active_job")
			.on(table.queryId, table.userId)
			.where(sql`${table.status} IN ('queued', 'running')`),
	],
)

export type QueryReportJob = typeof queryReportJobs.$inferSelect
export type NewQueryReportJob = typeof queryReportJobs.$inferInsert
