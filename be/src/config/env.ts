/**
 * Environment variable schema.
 *
 * All required variables are validated at module-load time. Missing variables
 * throw a startup error rather than silently falling back to defaults — this
 * surfaces misconfiguration immediately instead of masking it behind code that
 * appears to work.
 *
 * **This module must remain leaf-level.** Do not import anything from other
 * app modules here (e.g. `logger.ts`, `db/pool.ts`, services). Almost every
 * other module imports `env`, so adding a back-edge would create a circular
 * import that silently breaks load order. If a validation failure needs to be
 * surfaced, throw a plain `Error` — the logger isn't loaded yet and shouldn't
 * be imported here.
 *
 * Categories:
 *   - required:    must be set (and non-empty); throws on miss.
 *   - requiredRaw: must be set (empty string allowed — used for opt-out lists).
 *   - optional:    may be unset (returns undefined; treated as not configured).
 *
 * To add a new variable, add it here AND mirror the change in:
 *   - be/.env.example                           (local dev reference)
 *   - infrastructure/stg/...-task.json          (stg ECS task)
 *   - infrastructure/prd/...-task.json          (prd ECS task)
 */

function required(name: string): string {
	const v = process.env[name]
	if (v === undefined || v === "") {
		throw new Error(`env::required::required env var ${name} is not set`)
	}
	return v
}

function requiredRaw(name: string): string {
	const v = process.env[name]
	if (v === undefined) {
		throw new Error(`env::requiredRaw::required env var ${name} is not set`)
	}
	return v
}

function optional(name: string): string | undefined {
	const v = process.env[name]
	return v === undefined || v === "" ? undefined : v
}

function requiredInt(name: string): number {
	const v = required(name)
	const n = Number(v)
	if (!Number.isFinite(n)) {
		throw new Error(`env::requiredInt::env var ${name} is not a valid number: ${v}`)
	}
	return n
}

function requiredEnum<T extends string>(name: string, allowed: readonly T[]): T {
	const v = required(name)
	if (!(allowed as readonly string[]).includes(v)) {
		throw new Error(
			`env::requiredEnum::env var ${name} must be one of ${allowed.join(", ")}; got: ${v}`,
		)
	}
	return v as T
}

export const APP_ENVS = ["dev", "stg", "prd"] as const
export type AppEnv = (typeof APP_ENVS)[number]

export const env = {
	// ── Server ─────────────────────────────────────
	NODE_ENV: required("NODE_ENV"),
	// Deployment environment (dev / stg / prd). Needed alongside NODE_ENV
	// because stg and prd both run as NODE_ENV=production.
	APP_ENV: requiredEnum<AppEnv>("APP_ENV", APP_ENVS),
	PORT: requiredInt("PORT"),
	LOG_LEVEL: required("LOG_LEVEL"),

	// ── CORS ───────────────────────────────────────
	// CORS_ORIGIN: comma-separated exact-match origins.
	CORS_ORIGIN: required("CORS_ORIGIN"),
	// CORS_ORIGIN_PATTERN: comma-separated regexes (e.g. Amplify preview branches).
	// Optional — set to empty/unset when no pattern matching is needed.
	CORS_ORIGIN_PATTERN: optional("CORS_ORIGIN_PATTERN"),

	// ── DB (one of DATABASE_URL or DB_HOST is required) ──
	// Validated together in db/pool.ts to keep "either-or" logic local.
	DATABASE_URL: optional("DATABASE_URL"),
	DB_HOST: optional("DB_HOST"),
	DB_PORT: optional("DB_PORT"),
	DB_NAME: optional("DB_NAME"),
	DB_USER: optional("DB_USER"),
	DB_REGION: optional("DB_REGION"),

	// ── Anthropic ──────────────────────────────────
	ANTHROPIC_API_KEY: required("ANTHROPIC_API_KEY"),

	// ── SQS / AWS ──────────────────────────────────
	SQS_QUEUE_URL: required("SQS_QUEUE_URL"),
	AWS_REGION: required("AWS_REGION"),
	// `AWS_PROFILE` and other credential vars are read directly by the AWS SDK
	// default credential chain — they don't need to flow through this schema.

	// ── Report limits ──────────────────────────────
	FREE_MONTHLY_REPORT_LIMIT: requiredInt("FREE_MONTHLY_REPORT_LIMIT"),
	// Comma-separated UUIDs that bypass the monthly limit.
	// Empty string is valid and means "no users bypass" — set explicitly.
	UNLIMITED_USER_IDS: requiredRaw("UNLIMITED_USER_IDS"),
} as const
