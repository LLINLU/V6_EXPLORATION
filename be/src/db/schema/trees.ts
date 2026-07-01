import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { teams } from "./teams.js"

export const technologyTrees = pgTable(
	"technology_trees",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		description: text("description"),
		searchTheme: text("search_theme").notNull(),
		mode: text("mode"),
		reasoning: text("reasoning"),
		scenarioInputs: jsonb("scenario_inputs"),
		layerConfig: jsonb("layer_config"),
		teamId: uuid("team_id").references(() => teams.id),
		userId: uuid("user_id"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
	},
	(table) => [
		index("idx_trees_team_id").on(table.teamId),
		index("idx_trees_user_id").on(table.userId),
	],
)

export type TechnologyTree = typeof technologyTrees.$inferSelect
export type NewTechnologyTree = typeof technologyTrees.$inferInsert
