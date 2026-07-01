import {
	index,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const nodePatents = pgTable(
	"node_patents",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		nodeId: text("node_id").notNull(),
		familyId: text("family_id"),
		title: text("title").notNull(),
		abstract: text("abstract"),
		earliestPriorityDate: text("earliest_priority_date"),
		countries: jsonb("countries"),
		ipcPrefixes: jsonb("ipc_prefixes"),
		ipcSubclasses: jsonb("ipc_subclasses"),
		cpc: jsonb("cpc"),
		similarityScore: numeric("similarity_score"),
		assignee: jsonb("assignee"),
		inventor: jsonb("inventor"),
		publicationNumber: text("publication_number"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("idx_node_patents_node_id").on(table.nodeId),
	],
)

export type NodePatent = typeof nodePatents.$inferSelect
export type NewNodePatent = typeof nodePatents.$inferInsert
