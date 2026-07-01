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

export const keywordAxes = pgTable(
	"keyword_axes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		treeId: uuid("tree_id").references(() => technologyTrees.id, {
			onDelete: "cascade",
		}),
		userId: uuid("user_id").notNull(),
		teamId: uuid("team_id").references(() => teams.id),
		query: text("query").notNull(),
		axes: jsonb("axes").notNull().default([]),
		selectedKeywords: jsonb("selected_keywords").notNull().default([]),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("idx_keyword_axes_tree_id").on(table.treeId),
		index("idx_keyword_axes_user_id").on(table.userId),
		index("idx_keyword_axes_team_id").on(table.teamId),
		index("idx_keyword_axes_query").on(table.query),
	],
)

export type KeywordAxis = typeof keywordAxes.$inferSelect
export type NewKeywordAxis = typeof keywordAxes.$inferInsert
