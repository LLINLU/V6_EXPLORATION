import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { teams } from "./teams.js"
import { technologyTrees } from "./trees.js"
import { treeNodes } from "./nodes.js"

export const nodeMarketinfo = pgTable(
	"node_marketinfo",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		nodeId: text("node_id")
			.notNull()
			.references(() => treeNodes.id, { onDelete: "cascade" }),
		treeId: uuid("tree_id")
			.notNull()
			.references(() => technologyTrees.id, { onDelete: "cascade" }),
		marketTrl: jsonb("market_trl"),
		paperTrl: jsonb("paper_trl"),
		histData: jsonb("hist_data"),
		statistics: jsonb("statistics"),
		teamId: uuid("team_id").references(() => teams.id),
		userId: uuid("user_id"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("idx_marketinfo_node_id").on(table.nodeId),
		index("idx_marketinfo_tree_id").on(table.treeId),
	],
)

export type NodeMarketinfo = typeof nodeMarketinfo.$inferSelect
export type NewNodeMarketinfo = typeof nodeMarketinfo.$inferInsert
