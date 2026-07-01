import pg from "pg"
import { env } from "../config/env.js"
import { logger } from "../logger.js"
import { buildClientConfig } from "./connection.js"

function buildPool(): pg.Pool {
	const { mode, config } = buildClientConfig()

	if (mode === "iam") {
		logger.info(
			{
				host: env.DB_HOST,
				port: env.DB_PORT,
				database: env.DB_NAME,
				user: env.DB_USER,
				region: env.DB_REGION,
			},
			"pool::buildPool::using IAM token auth (RDS Signer)",
		)
	} else {
		logger.info(
			{
				connectionString: env.DATABASE_URL?.replace(
					/:\/\/.*@/, // strip user:password from URL before logging
					"://<credentials>@",
				),
			},
			"pool::buildPool::using DATABASE_URL (local dev)",
		)
	}

	return new pg.Pool(config)
}

export const pool = buildPool()
