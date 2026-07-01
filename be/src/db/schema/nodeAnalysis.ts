import {
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const nodeAnalysis = pgTable("node_analysis", {
	id: uuid("id").primaryKey().defaultRandom(),
	nodeId: text("node_id").notNull().unique(),
	data: jsonb("data").notNull().default({}),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export type NodeAnalysis = typeof nodeAnalysis.$inferSelect
export type NewNodeAnalysis = typeof nodeAnalysis.$inferInsert
