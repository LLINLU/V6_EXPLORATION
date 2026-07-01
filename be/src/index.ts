import "dotenv/config"
import cors from "cors"
import express from "express"
import swaggerUi from "swagger-ui-express"
import { env } from "./config/env.js"
import { healthRouter } from "./controllers/health.js"
import { meRouter } from "./controllers/me.js"
import { queryReportRouter } from "./controllers/queryReport.js"
import { scenarioReportRouter } from "./controllers/scenarioReport.js"
import { userIpAllowlistRouter } from "./controllers/userIpAllowlist.js"
import { pool } from "./db/pool.js"
import swaggerDoc from "./docs/openapi.js"
import { logger } from "./logger.js"
import { startWorker } from "./queue/index.js"

const corsOrigins = new Set(
	env.CORS_ORIGIN.split(",")
		.map((s) => s.trim())
		.filter(Boolean),
)

const corsPatterns: RegExp[] = (env.CORS_ORIGIN_PATTERN ?? "")
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean)
	.map((p) => new RegExp(p))

function isAllowedOrigin(origin: string): boolean {
	if (corsOrigins.has(origin)) return true
	return corsPatterns.some((re) => re.test(origin))
}

async function main() {
	logger.info(
		{ port: env.PORT, corsOrigins: [...corsOrigins] },
		"index::main::starting server",
	)

	const app = express()
	app.use(
		cors({
			origin: (origin, callback) => {
				if (!origin || isAllowedOrigin(origin)) return callback(null, true)
				logger.warn({ origin }, "index::cors::blocked origin")
				callback(new Error(`CORS: origin not allowed — ${origin}`))
			},
			// `X-User-Id` and `X-Source-IP` are infrastructure-trusted headers that
			// API Gateway injects from verified context — they MUST NOT be sendable
			// from the browser in production (preflight would otherwise allow a
			// forged header alongside Authorization). Allowed only in non-production
			// for direct-to-BE access during local development (curl, or the FE
			// with NEXT_PUBLIC_DEV_SOURCE_IP set).
			allowedHeaders:
				env.NODE_ENV === "production"
					? ["Content-Type", "Authorization"]
					: ["Content-Type", "Authorization", "X-User-Id", "X-Source-IP"],
		}),
	)
	app.use(express.json())

	app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc))
	app.use(healthRouter)
	app.use(scenarioReportRouter)
	app.use(meRouter)
	app.use(userIpAllowlistRouter)
	app.use(queryReportRouter)

	await startWorker()

	app.listen(env.PORT, () => {
		logger.info({ port: env.PORT }, "index::main::server listening")
	})

	const shutdown = async () => {
		logger.info("index::shutdown::shutting down")
		await pool.end()
		process.exit(0)
	}
	process.on("SIGINT", shutdown)
	process.on("SIGTERM", shutdown)
}

main().catch((err) => {
	logger.fatal({ err }, "index::main::fatal error during startup")
	process.exit(1)
})
