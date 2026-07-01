import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"
import { jobs } from "./jobs.js"

// `requests` is an audit log for the request payload that triggered each
// job. It is currently write-only — no service code reads from it. Keep it
// minimal: user_id and scenario_id are intentionally NOT denormalized here
// because they can be reached via the job FK and were never used at read
// time. If audit queries land later that filter by user_id, prefer JOIN to
// jobs over re-introducing the denorm.
export const requests = pgTable(
	"requests",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id),
		inputPayload: jsonb("input_payload")
			.$type<Record<string, unknown>>()
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index("idx_requests_job_id").on(table.jobId)],
)

export type Request = typeof requests.$inferSelect
export type NewRequest = typeof requests.$inferInsert
