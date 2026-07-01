import type { Config } from "drizzle-kit"

// Schema is the TS source of truth (1 file per table). drizzle-kit reads
// these to compute migration diffs and to power `drizzle-kit check`.
//
// `breakpoints: true` makes the migrator honor `--> statement-breakpoint`
// markers in custom migrations — required for `CREATE INDEX CONCURRENTLY`
// and other DDL that must run outside a transaction.
//
// We deliberately do not pass `dbCredentials` here. drizzle-kit `generate`
// and `check` are pure offline operations and never need a live DB.
// Migrations against the real DB run via `src/db/migrate.ts`, which manages
// its own pg.Client (IAM token auth via RDS Signer).
export default {
	schema: "./src/db/schema/index.ts",
	out: "./src/db/migrations",
	dialect: "postgresql",
	breakpoints: true,
} satisfies Config
