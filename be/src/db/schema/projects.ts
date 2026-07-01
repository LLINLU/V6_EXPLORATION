import {
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { teams } from "./teams.js"
import { technologyTrees } from "./trees.js"

export const projects = pgTable(
	"projects",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		description: text("description"),
		creatorId: uuid("creator_id").notNull(),
		visibility: text("visibility").notNull(),
		teamId: uuid("team_id").references(() => teams.id),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("idx_projects_team_id").on(table.teamId),
		index("idx_projects_creator_id").on(table.creatorId),
	],
)

export const projectTrees = pgTable(
	"project_trees",
	{
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		treeId: uuid("tree_id")
			.notNull()
			.references(() => technologyTrees.id, { onDelete: "cascade" }),
		position: integer("position").notNull().default(0),
	},
	(table) => [
		primaryKey({ columns: [table.projectId, table.treeId] }),
	],
)

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectTree = typeof projectTrees.$inferSelect
export type NewProjectTree = typeof projectTrees.$inferInsert
