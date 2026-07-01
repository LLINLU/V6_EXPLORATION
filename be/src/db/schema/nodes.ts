import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { axisType } from "./enums.js"
import { teams } from "./teams.js"
import { technologyTrees } from "./trees.js"

export const treeNodes = pgTable(
	"tree_nodes",
	{
		id: text("id").primaryKey(),
		treeId: uuid("tree_id").references(() => technologyTrees.id, {
			onDelete: "cascade",
		}),
		parentId: text("parent_id"),
		name: text("name").notNull(),
		description: text("description"),
		level: integer("level").notNull(),
		axis: axisType("axis").notNull(),
		path: text("path"),
		nodeOrder: integer("node_order"),
		childrenCount: integer("children_count"),
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
		index("idx_nodes_tree_id").on(table.treeId),
		index("idx_nodes_parent_id").on(table.parentId),
		index("idx_nodes_tree_level").on(table.treeId, table.level),
	],
)

export type TreeNode = typeof treeNodes.$inferSelect
export type NewTreeNode = typeof treeNodes.$inferInsert
