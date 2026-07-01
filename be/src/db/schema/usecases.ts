import { sql } from "drizzle-orm"
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { teams } from "./teams.js"
import { technologyTrees } from "./trees.js"
import { treeNodes } from "./nodes.js"

export const nodeUseCases = pgTable(
	"node_use_cases",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		nodeId: text("node_id")
			.notNull()
			.references(() => treeNodes.id, { onDelete: "cascade" }),
		treeId: uuid("tree_id")
			.notNull()
			.references(() => technologyTrees.id, { onDelete: "cascade" }),
		product: text("product").notNull(),
		description: text("description").notNull(),
		company: text("company")
			.array()
			.notNull()
			.default(sql`'{}'::text[]`),
		pressReleases: text("press_releases")
			.array()
			.notNull()
			.default(sql`'{}'::text[]`),
		year: integer("year"),
		teamId: uuid("team_id").references(() => teams.id),
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
		index("idx_usecases_node_id").on(table.nodeId),
		index("idx_usecases_tree_id").on(table.treeId),
	],
)

export const nodeUsecasesSummary = pgTable(
	"node_usecases_summary",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		nodeId: text("node_id")
			.notNull()
			.references(() => treeNodes.id, { onDelete: "cascade" }),
		treeId: uuid("tree_id")
			.notNull()
			.references(() => technologyTrees.id, { onDelete: "cascade" }),
		query: text("query").notNull(),
		summary: text("summary").notNull(),
		usecasesCount: integer("usecases_count").notNull().default(0),
		teamId: uuid("team_id").references(() => teams.id),
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
		index("idx_usecases_summary_node_id").on(table.nodeId),
		index("idx_usecases_summary_tree_id").on(table.treeId),
	],
)

export type NodeUseCase = typeof nodeUseCases.$inferSelect
export type NewNodeUseCase = typeof nodeUseCases.$inferInsert
export type NodeUsecasesSummary = typeof nodeUsecasesSummary.$inferSelect
export type NewNodeUsecasesSummary = typeof nodeUsecasesSummary.$inferInsert
