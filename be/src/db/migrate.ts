import "dotenv/config"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import pg from "pg"
import { logger } from "../logger.js"
import { buildClientConfig } from "./connection.js"

// Migration runner. Designed to be invoked as a one-shot ECS RunTask
// (see infrastructure/{stg,prd}/mlab-{env}-memoryai-migrate-task.json),
// run on its own short-lived container immediately before the BE Service
// rolling deploy.
//
// Why pg.Client (not Pool):
//   1. drizzle-migrator takes a PostgreSQL advisory lock to prevent
//      concurrent runs. With Pool, the lock-acquiring connection and the
//      DDL-executing connection may end up on different sockets, and the
//      lock fails to behave as intended.
//   2. The session-level GUCs we set below (`SET lock_timeout` etc.) only
//      apply to the connection that issued them. A single Client pins
//      everything to one socket, so every migration in this run gets the
//      same safety budget.
//
// IAM token expiry: RDS IAM tokens expire after 15 minutes. The
// `password` field in the config (built by `buildClientConfig`) is a
// function that re-issues a fresh token; pg invokes it lazily right
// before connect, so a one-shot migrate task always uses a fresh token.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsFolder = path.join(__dirname, "migrations")

async function main() {
	const { mode, config } = buildClientConfig()
	logger.info({ mode, migrationsFolder }, "migrate::starting")

	const client = new pg.Client(config)
	await client.connect()
	try {
		// ── Aurora safety belts ─────────────────────────────────────
		// Applied at the session level so every migration in this run
		// inherits them. Individual migration files do NOT need to
		// `SET LOCAL` — that's why the auto-generated SQL stays clean.
		await client.query("SET lock_timeout = '5s'")
		await client.query("SET statement_timeout = '60s'")
		await client.query("SET idle_in_transaction_session_timeout = '60s'")

		const db = drizzle(client)
		await migrate(db, { migrationsFolder })
		logger.info("migrate::done")
	} finally {
		await client.end()
	}
}

// Top-level await with explicit exit-code management.
//
// Why both `process.exitCode = 1` AND `process.exit(1)`:
// We observed that `process.exit(1)` alone could be swallowed in
// production — ECS reported the container exiting with code 0 despite
// the failing path running through `process.exit(1)`. Setting
// `process.exitCode` first biases Node's eventual exit so that even if
// the explicit `process.exit` is delayed/swallowed, the process still
// terminates non-zero once the event loop drains.
//
// `flushLogger` deterministically drains pino's internal buffer to the
// underlying fd before we exit, so the failure log can never be lost
// to a race between `logger.error(...)` and `process.exit`. Applied to
// both the success and failure paths for symmetry.
const flushLogger = () =>
	new Promise<void>((resolve) => logger.flush(() => resolve()))

try {
	await main()
	await flushLogger()
	process.exit(0)
} catch (err) {
	logger.error({ err }, "migrate::failed")
	process.exitCode = 1
	await flushLogger()
	process.exit(1)
}
