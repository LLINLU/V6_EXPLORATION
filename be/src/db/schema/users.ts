import {
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const userProfiles = pgTable("user_profiles", {
	id: uuid("id").primaryKey(),
	username: text("username").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const userReleaseViews = pgTable(
	"user_release_views",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id").notNull(),
		releaseId: text("release_id").notNull(),
		viewedAt: timestamp("viewed_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("idx_release_views_user_id").on(table.userId),
	],
)

export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert
export type UserReleaseView = typeof userReleaseViews.$inferSelect
export type NewUserReleaseView = typeof userReleaseViews.$inferInsert
