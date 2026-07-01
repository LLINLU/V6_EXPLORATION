import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { teams } from "./teams.js"
import { technologyTrees } from "./trees.js"
import { treeNodes } from "./nodes.js"
import { nodePapers } from "./papers.js"
import { nodeUseCases } from "./usecases.js"

export const savedPapers = pgTable(
	"saved_papers",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		paperId: text("paper_id")
			.notNull()
			.references(() => nodePapers.id, { onDelete: "cascade" }),
		treeId: uuid("tree_id")
			.notNull()
			.references(() => technologyTrees.id, { onDelete: "cascade" }),
		nodeId: text("node_id")
			.notNull()
			.references(() => treeNodes.id, { onDelete: "cascade" }),
		userId: uuid("user_id").notNull(),
		teamId: uuid("team_id").references(() => teams.id),
		notes: text("notes"),
		isActive: boolean("is_active").notNull().default(true),
		savedAt: timestamp("saved_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("idx_saved_papers_user_id").on(table.userId),
		index("idx_saved_papers_tree_id").on(table.treeId),
	],
)

export const savedUseCases = pgTable(
	"saved_use_cases",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		useCaseId: uuid("use_case_id")
			.notNull()
			.references(() => nodeUseCases.id, { onDelete: "cascade" }),
		treeId: uuid("tree_id")
			.notNull()
			.references(() => technologyTrees.id, { onDelete: "cascade" }),
		nodeId: text("node_id")
			.notNull()
			.references(() => treeNodes.id, { onDelete: "cascade" }),
		userId: uuid("user_id").notNull(),
		teamId: uuid("team_id").references(() => teams.id),
		notes: text("notes"),
		isActive: boolean("is_active").notNull().default(true),
		savedAt: timestamp("saved_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("idx_saved_usecases_user_id").on(table.userId),
		index("idx_saved_usecases_tree_id").on(table.treeId),
	],
)

export type SavedPaper = typeof savedPapers.$inferSelect
export type NewSavedPaper = typeof savedPapers.$inferInsert
export type SavedUseCase = typeof savedUseCases.$inferSelect
export type NewSavedUseCase = typeof savedUseCases.$inferInsert
