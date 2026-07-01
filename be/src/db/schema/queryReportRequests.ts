import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"
import { queryReportJobs } from "./queryReportJobs.js"

export const queryReportRequests = pgTable(
	"query_report_requests",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		jobId: uuid("job_id")
			.notNull()
			.references(() => queryReportJobs.id),
		inputPayload: jsonb("input_payload")
			.$type<Record<string, unknown>>()
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index("idx_query_report_requests_job_id").on(table.jobId)],
)

export type QueryReportRequest = typeof queryReportRequests.$inferSelect
export type NewQueryReportRequest = typeof queryReportRequests.$inferInsert
