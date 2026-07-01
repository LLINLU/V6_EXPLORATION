import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"
import { jobs } from "./jobs.js"

export const results = pgTable(
	"results",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id),
		scenarioId: uuid("scenario_id").notNull(),
		resultJson: jsonb("result_json").$type<Record<string, unknown>>().notNull(),
		validatedAt: timestamp("validated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("idx_results_job_id").on(table.jobId),
		// Non-unique: a scenario can be re-generated, producing multiple results
		// over time. The read query in scenarioReportResultService.getScenarioResult selects
		// the latest by validated_at — that is the source of truth for "current
		// result", not a UNIQUE constraint here.
		index("idx_results_scenario_id").on(table.scenarioId),
	],
)

export type Result = typeof results.$inferSelect
export type NewResult = typeof results.$inferInsert
