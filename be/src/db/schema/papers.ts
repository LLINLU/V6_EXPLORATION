import {
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { teams } from "./teams.js"
import { technologyTrees } from "./trees.js"
import { treeNodes } from "./nodes.js"

export const nodePapers = pgTable(
	"node_papers",
	{
		id: text("id").primaryKey(),
		nodeId: text("node_id")
			.notNull()
			.references(() => treeNodes.id, { onDelete: "cascade" }),
		treeId: uuid("tree_id")
			.notNull()
			.references(() => technologyTrees.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		authors: text("authors").notNull(),
		abstract: text("abstract").notNull(),
		journal: text("journal").notNull(),
		date: text("date"),
		citations: integer("citations").notNull().default(0),
		doi: text("doi"),
		url: text("url"),
		region: text("region").notNull(),
		score: numeric("score"),
		tags: jsonb("tags").notNull().default([]),
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
		index("idx_papers_node_id").on(table.nodeId),
		index("idx_papers_tree_id").on(table.treeId),
	],
)

export const nodePapersSummary = pgTable(
	"node_papers_summary",
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
		papersCount: integer("papers_count").notNull().default(0),
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
		index("idx_papers_summary_node_id").on(table.nodeId),
		index("idx_papers_summary_tree_id").on(table.treeId),
	],
)

export type NodePaper = typeof nodePapers.$inferSelect
export type NewNodePaper = typeof nodePapers.$inferInsert
export type NodePapersSummary = typeof nodePapersSummary.$inferSelect
export type NewNodePapersSummary = typeof nodePapersSummary.$inferInsert
