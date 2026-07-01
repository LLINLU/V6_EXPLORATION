import type { NextFunction, Request, Response } from "express"
import { isUuid } from "../lib/uuid.js"
import { logger } from "../logger.js"

/**
 * `X-User-Id` is injected by API Gateway from the Lambda Authorizer's
 * verified `context.authorizer.userId`. The ALB sits in an internal SG and
 * is only reachable via VPC Link, so this header is treated as a verified
 * identity at this boundary.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const raw = req.headers["x-user-id"]
	// `req.headers[name]` is typed as string | string[]; the array branch is
	// a defensive fallback (Node joins duplicate non-cookie headers into one
	// comma-separated string before it reaches here).
	const userId = typeof raw === "string" ? raw : (raw?.[0] ?? null)
	if (!userId || !userId.trim()) {
		logger.warn(
			{ method: req.method, path: req.path },
			"auth::requireAuth::missing X-User-Id (API Gateway should inject this) → 401",
		)
		res.status(401).json({ error: "Unauthorized" })
		return
	}
	// A comma here means the header was duplicated upstream or spoofed. The
	// UUID check below would also reject the joined form, but an explicit
	// branch keeps the failure cause distinguishable in CloudWatch and
	// mirrors the malformed-source-ip branch in ipRestriction.
	if (userId.includes(",")) {
		logger.warn(
			{ method: req.method, path: req.path, raw: userId },
			"auth::requireAuth::X-User-Id contains comma (duplicate header collapsed) → 401",
		)
		res.status(401).json({ error: "Unauthorized" })
		return
	}
	if (!isUuid(userId)) {
		logger.warn(
			{ method: req.method, path: req.path },
			"auth::requireAuth::X-User-Id is not a UUID → 401",
		)
		res.status(401).json({ error: "Unauthorized" })
		return
	}
	res.locals.userId = userId
	next()
}
