import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"
import { queryReportJobs } from "./queryReportJobs.js"

export const queryReportResults = pgTable(
	"query_report_results",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		jobId: uuid("job_id")
			.notNull()
			.references(() => queryReportJobs.id),
		queryId: uuid("query_id").notNull(),
		resultJson: jsonb("result_json").$type<Record<string, unknown>>().notNull(),
		validatedAt: timestamp("validated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("idx_query_report_results_job_id").on(table.jobId),
		index("idx_query_report_results_query_id").on(table.queryId),
	],
)

export type QueryReportResult = typeof queryReportResults.$inferSelect
export type NewQueryReportResult = typeof queryReportResults.$inferInsert
