import { Router } from "express"
import { logger } from "../logger.js"
import { requireAuth } from "../middleware/auth.js"
import { ipRestriction } from "../middleware/ipRestriction.js"

export const meRouter = Router()

/**
 * Bootstraps FE session state and triggers per-user IP allowlist enforcement
 * at app load. `res.locals.sourceIp` is populated by `ipRestriction`.
 */
meRouter.get("/me", requireAuth, ipRestriction, (_req, res) => {
	const userId = res.locals.userId as string
	const sourceIp = res.locals.sourceIp as string

	logger.info({ userId, sourceIp }, "me.checked")

	res.json({ userId, sourceIp })
})
