import { Router } from "express"
import { pool } from "../db/pool.js"
import { logger } from "../logger.js"

export const healthRouter = Router()

// Authentication is enforced at the API Gateway layer (Lambda Authorizer),
// not in the BE. This route therefore responds without auth so that:
//   - the ALB health check (direct, in-VPC) keeps working
//   - API-Gateway-fronted requests still pass through the Authorizer first,
//     which 401s unauthenticated callers before they ever reach the BE
healthRouter.get("/health", async (_req, res) => {
	let dbOk = false
	let queued = 0
	let running = 0

	try {
		await pool.query("SELECT 1")
		dbOk = true

		const { rows } = await pool.query<{ status: string; count: string }>(
			`SELECT status, COUNT(*) AS count
			 FROM jobs
			 WHERE status IN ('queued', 'running')
			 GROUP BY status`,
		)
		for (const row of rows) {
			if (row.status === "queued") queued = Number(row.count)
			if (row.status === "running") running = Number(row.count)
		}
	} catch (err) {
		logger.warn({ err }, "health: DB probe failed")
	}

	const status = dbOk ? "ok" : "degraded"
	res.status(dbOk ? 200 : 503).json({
		status,
		db: dbOk ? "ok" : "unreachable",
		jobs: { queued, running },
	})
})
