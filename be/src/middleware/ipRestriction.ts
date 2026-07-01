import type { NextFunction, Request, Response } from "express"
import { logger } from "../logger.js"
import { checkAccess } from "../services/userIpAllowlistService.js"

type SourceIpReadResult =
	| { kind: "ok"; value: string }
	| { kind: "missing" }
	| { kind: "malformed"; raw: string }

/**
 * API Gateway injects `X-Source-IP` from `$context.identity.sourceIp` in the
 * Integration Request mapping, overwriting any client-supplied value — so the
 * header is treated as verified here. "malformed" (comma in value) gets its
 * own kind so the operator can tell "infra never injected" from "duplicate
 * header collapsed upstream".
 */
function readSourceIpHeader(req: Request): SourceIpReadResult {
	const raw = req.headers["x-source-ip"]
	// String/array dual form — see requireAuth for the rationale.
	const value = typeof raw === "string" ? raw : (raw?.[0] ?? null)
	if (!value || !value.trim()) return { kind: "missing" }
	if (value.includes(",")) return { kind: "malformed", raw: value }
	return { kind: "ok", value: value.trim() }
}

/**
 * Per-user IP allowlist enforcement.
 *
 * Must run AFTER `requireAuth`, which populates `res.locals.userId`. Also
 * populates `res.locals.sourceIp` for downstream handlers (see me.ts) so
 * the header parsing lives in exactly one place.
 *
 * Behaviour:
 *   - allowlist for user is empty            → next()  (opt-in: no restriction)
 *   - allowlist exists and sourceIp matches  → next()
 *   - allowlist exists and sourceIp misses   → 403 { code: "IP_RESTRICTED" }
 *   - X-Source-IP header missing             → 500 (infra misconfig; fail-closed)
 */
export async function ipRestriction(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	// Every response past this point carries per-user data (id, source IP,
	// allowlist entries, /me payload). A 200 served from a stale intermediary
	// cache could leak one user's identity to another, so set `no-store` up
	// front for all branches (200 / 403 / 500) and downstream handlers.
	res.setHeader("Cache-Control", "no-store")

	const userId = res.locals.userId as string | undefined
	if (!userId) {
		logger.error(
			{ path: req.path, method: req.method },
			"ipRestriction::ipRestriction::missing user id",
		)
		res.status(500).json({ code: "INTERNAL_ERROR" })
		return
	}

	const header = readSourceIpHeader(req)
	if (header.kind === "missing") {
		logger.error(
			{ userId, path: req.path, method: req.method },
			"ipRestriction::ipRestriction::missing source ip header",
		)
		res.status(500).json({ code: "INTERNAL_ERROR" })
		return
	}
	if (header.kind === "malformed") {
		logger.error(
			{ userId, path: req.path, method: req.method, raw: header.raw },
			"ipRestriction::ipRestriction::malformed source ip header",
		)
		res.status(500).json({ code: "INTERNAL_ERROR" })
		return
	}
	const sourceIp = header.value
	res.locals.sourceIp = sourceIp

	try {
		const result = await checkAccess(userId, sourceIp)

		if (result.status === "no_entries") {
			// Opt-in default: a user with no entries is unrestricted.
			next()
			return
		}
		if (result.status === "match") {
			logger.debug(
				{ userId, sourceIp, path: req.path },
				"ipRestriction::ipRestriction::allowed",
			)
			next()
			return
		}
		logger.info(
			{ userId, sourceIp, path: req.path, method: req.method },
			"ipRestriction::ipRestriction::blocked",
		)
		res.status(403).json({ code: "IP_RESTRICTED" })
	} catch (err) {
		logger.error(
			{ err, userId, sourceIp, path: req.path },
			"ipRestriction::ipRestriction::access check error",
		)
		res.status(500).json({ code: "INTERNAL_ERROR" })
	}
}
