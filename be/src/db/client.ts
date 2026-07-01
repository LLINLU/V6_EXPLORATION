import { drizzle } from "drizzle-orm/node-postgres"
import { pool } from "./pool.js"
import * as schema from "./schema/index.js"

// Long-lived drizzle instance backed by the BE Service `pg.Pool`. Service
// layer code imports `db` from here and uses Drizzle's query builder.
//
// The migration runner (`migrate.ts`) does NOT use this — it builds its
// own short-lived `pg.Client` to keep the migrator's advisory lock and
// session settings on a single connection. See connection.ts.
export const db = drizzle(pool, { schema })
export type DB = typeof db
