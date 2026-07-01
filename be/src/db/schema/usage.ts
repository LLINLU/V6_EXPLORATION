import {
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { jobs } from "./jobs.js"

export const usage = pgTable(
	"usage",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id),
		step: text("step").notNull(),
		promptTokens: integer("prompt_tokens").notNull().default(0),
		completionTokens: integer("completion_tokens").notNull().default(0),
		// numeric(10,6) — pg returns numeric as a string by default to avoid
		// floating-point loss. We follow the default; service layer converts
		// number ↔ string at the boundary.
		costUsd: numeric("cost_usd", { precision: 10, scale: 6 })
			.notNull()
			.default("0"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index("idx_usage_job_id").on(table.jobId)],
)

export type Usage = typeof usage.$inferSelect
export type NewUsage = typeof usage.$inferInsert
