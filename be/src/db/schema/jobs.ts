import { sql } from "drizzle-orm"
import {
	check,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const jobs = pgTable(
	"jobs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		status: text("status").notNull().default("queued"),
		progress: text("progress"),
		retryCount: integer("retry_count").notNull().default(0),
		userId: uuid("user_id").notNull(),
		scenarioId: uuid("scenario_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		// `.$onUpdate` makes Drizzle auto-set updated_at on every UPDATE issued
		// through the query builder. This is application-level only — raw SQL
		// or psql edits will NOT trigger it. If the team ever needs DB-level
		// guarantee (e.g. for triggers), promote this to a Postgres trigger
		// in a custom migration.
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		check(
			"jobs_status_check",
			sql`${table.status} IN ('queued', 'running', 'done', 'failed')`,
		),
		index("idx_jobs_scenario_id").on(table.scenarioId),
		index("idx_jobs_status").on(table.status),
		index("idx_jobs_user_created").on(table.userId, table.createdAt),
	],
)

export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert
