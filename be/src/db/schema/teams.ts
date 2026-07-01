import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const teams = pgTable("teams", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
	privacySetting: boolean("privacy_setting").notNull().default(false),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const teamsMembers = pgTable(
	"teams_members",
	{
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		userId: uuid("user_id").notNull(),
		role: text("role").notNull().default("member"),
		joinedAt: timestamp("joined_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("idx_teams_members_user_id").on(table.userId),
	],
)

export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type TeamMember = typeof teamsMembers.$inferSelect
export type NewTeamMember = typeof teamsMembers.$inferInsert
