import { sql } from "drizzle-orm"
import {
	check,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core"

export const scenarioReports = pgTable(
	"scenario_reports",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		scenarioId: text("scenario_id").notNull(),
		treeId: uuid("tree_id").notNull(),
		scenarioName: text("scenario_name").notNull(),
		scenarioDescription: text("scenario_description"),
		userQuery: text("user_query").notNull(),
		userContext: text("user_context"),
		status: text("status").notNull().default("pending"),
		errorMessage: text("error_message"),
		searchStatus: text("search_status").notNull().default("pending"),
		articles: jsonb("articles").notNull().default([]),
		patents: jsonb("patents").notNull().default([]),
		markets: jsonb("markets").notNull().default([]),
		technologies: jsonb("technologies").notNull().default([]),
		teamId: uuid("team_id"),
		userId: uuid("user_id"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("idx_scenario_reports_tree_scenario").on(
			table.treeId,
			table.scenarioId,
		),
		check(
			"scenario_reports_status_check",
			sql`${table.status} IN ('pending','searching','search_done','analyzing','done','error')`,
		),
		check(
			"scenario_reports_search_status_check",
			sql`${table.searchStatus} IN ('pending','running','done','error')`,
		),
		uniqueIndex("idx_scenario_reports_unique_active")
			.on(table.treeId, table.scenarioId)
			.where(sql`${table.status} != 'error'`),
	],
)

export const scenarioReportSections = pgTable(
	"scenario_report_sections",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		reportId: uuid("report_id")
			.notNull()
			.references(() => scenarioReports.id, { onDelete: "cascade" }),
		sectionType: text("section_type").notNull(),
		status: text("status").notNull().default("pending"),
		errorMessage: text("error_message"),
		progress: integer("progress").default(0),
		rawData: jsonb("raw_data"),
		transformedData: jsonb("transformed_data"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("idx_report_sections_report_id").on(table.reportId),
		unique("scenario_report_sections_report_section_unique").on(
			table.reportId,
			table.sectionType,
		),
		check(
			"scenario_report_sections_type_check",
			sql`${table.sectionType} IN ('trl','market','social_issue','technical_competitors','executive_summary','research_landscape','market_implementations')`,
		),
		check(
			"scenario_report_sections_status_check",
			sql`${table.status} IN ('pending','running','done','error')`,
		),
	],
)

export type ScenarioReport = typeof scenarioReports.$inferSelect
export type NewScenarioReport = typeof scenarioReports.$inferInsert
export type ScenarioReportSection = typeof scenarioReportSections.$inferSelect
export type NewScenarioReportSection =
	typeof scenarioReportSections.$inferInsert
