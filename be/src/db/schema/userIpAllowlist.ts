import {
	customType,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core"

// PostgreSQL native `cidr` type. drizzle-orm has no first-class column type
// for it (as of 0.45), so we declare it via customType. CIDR containment is
// evaluated server-side using the `>>=` operator — see userIpAllowlistService.
const cidr = customType<{ data: string; driverData: string }>({
	dataType() {
		return "cidr"
	},
})

export const userIpAllowlist = pgTable(
	"user_ip_allowlist",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id").notNull(),
		cidr: cidr("cidr").notNull(),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		// See note in jobs.ts about $onUpdate semantics (application-level only).
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		// Prevents duplicate (user_id, cidr) and doubles as a lookup index on
		// user_id (leading column). No separate single-column index is needed.
		uniqueIndex("user_ip_allowlist_user_id_cidr_idx").on(
			table.userId,
			table.cidr,
		),
	],
)

export type UserIpAllowlist = typeof userIpAllowlist.$inferSelect
export type NewUserIpAllowlist = typeof userIpAllowlist.$inferInsert
