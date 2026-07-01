import { pgView, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const vUserDetails = pgView("v_user_details", {
	userId: uuid("user_id"),
	email: text("email"),
	username: text("username"),
	teamId: uuid("team_id"),
	teamName: text("team_name"),
	role: text("role"),
	createdAt: timestamp("created_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}).existing()
