import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Signer } from "@aws-sdk/rds-signer"
import type pg from "pg"
import { env } from "../config/env.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Amazon RDS root CA bundle. Node.js's default trust store does NOT include
// the AWS RDS root CAs, so SSL verification fails unless we pass this
// explicitly. Resolved relative to this file: `dist/db/connection.js` →
// `dist/../../global-bundle.pem` → `be/global-bundle.pem` (also works for
// `src/db/connection.ts` under tsx via the same relative offset).
//
// Source: https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
const RDS_CA_BUNDLE_PATH = path.join(__dirname, "../../global-bundle.pem")

function loadRdsCaBundle(): string {
	try {
		return fs.readFileSync(RDS_CA_BUNDLE_PATH, "utf-8")
	} catch (err) {
		throw new Error(
			`Failed to read RDS CA bundle at ${RDS_CA_BUNDLE_PATH}. ` +
				`Make sure global-bundle.pem is shipped with the build (see Dockerfile). ` +
				`Cause: ${(err as Error).message}`,
		)
	}
}

/**
 * Build a `pg.ClientConfig` describing how to connect to the DB.
 *
 * Used by:
 *   - `pool.ts` — long-lived `pg.Pool` for the BE Service runtime.
 *   - `migrate.ts` — short-lived `pg.Client` for one-shot migrations.
 *
 * Exactly one of `DB_HOST` (production: IAM auth) or `DATABASE_URL` (local
 * dev) must be set. If `DB_HOST` is set, the companion DB_* vars must all
 * be set together — no fallbacks. The validation logic is intentionally
 * eager (throws at first build call) so misconfiguration surfaces at
 * startup rather than masquerading as a connection error later.
 *
 * `password` is returned as a function that re-issues an RDS IAM token on
 * each invocation. `pg` calls this lazily before each new connection, so
 * the 15-minute token TTL never expires mid-flight.
 */
export type DbConnectionMode = "iam" | "connection-string"

export interface BuildClientConfigResult {
	mode: DbConnectionMode
	config: pg.ClientConfig
}

export function buildClientConfig(): BuildClientConfigResult {
	if (env.DB_HOST) {
		const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_REGION } = env
		const missing: string[] = []
		if (DB_PORT === undefined) missing.push("DB_PORT")
		if (DB_NAME === undefined) missing.push("DB_NAME")
		if (DB_USER === undefined) missing.push("DB_USER")
		if (DB_REGION === undefined) missing.push("DB_REGION")
		if (missing.length > 0) {
			throw new Error(
				`DB_HOST is set but the following are missing: ${missing.join(", ")}`,
			)
		}
		// TypeScript's control-flow analysis narrows these to `string` after the
		// `missing.length > 0` early-return above.
		if (
			DB_PORT === undefined ||
			DB_NAME === undefined ||
			DB_USER === undefined ||
			DB_REGION === undefined
		) {
			throw new Error("unreachable")
		}

		const port = Number(DB_PORT)
		if (!Number.isFinite(port)) {
			throw new Error(`DB_PORT is not a valid number: ${DB_PORT}`)
		}

		const caBundle = loadRdsCaBundle()
		const signer = new Signer({
			hostname: DB_HOST,
			port,
			region: DB_REGION,
			username: DB_USER,
		})

		return {
			mode: "iam",
			config: {
				host: DB_HOST,
				port,
				database: DB_NAME,
				user: DB_USER,
				password: () => signer.getAuthToken(),
				ssl: {
					ca: caBundle,
					rejectUnauthorized: true,
				},
			},
		}
	}

	if (env.DATABASE_URL) {
		return {
			mode: "connection-string",
			config: { connectionString: env.DATABASE_URL },
		}
	}

	throw new Error(
		"Neither DATABASE_URL nor DB_HOST is set — DB cannot be initialized",
	)
}
