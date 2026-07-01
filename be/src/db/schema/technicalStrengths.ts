import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { technologyTrees } from "./trees.js"

export const technicalStrengths = pgTable(
	"technical_strengths",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		treeId: uuid("tree_id")
			.notNull()
			.references(() => technologyTrees.id, { onDelete: "cascade" }),
		ordinal: integer("ordinal"),
		strengthName: text("strength_name"),
		strengthNameT: text("strength_name_t"),
		description: text("description"),
		descriptionT: text("description_t"),
		potentialApplications: text("potential_applications"),
		potentialApplicationsT: text("potential_applications_t"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("idx_technical_strengths_tree_id").on(table.treeId),
	],
)

export type TechnicalStrength = typeof technicalStrengths.$inferSelect
export type NewTechnicalStrength = typeof technicalStrengths.$inferInsert
