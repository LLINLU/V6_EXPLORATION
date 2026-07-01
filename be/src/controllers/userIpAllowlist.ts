import type { NextFunction, Request, Response } from "express"
import { Router } from "express"
import { z } from "zod"
import { isAdmin } from "../config/admins.js"
import { isUuid, UUID_RE } from "../lib/uuid.js"
import { logger } from "../logger.js"
import { requireAuth } from "../middleware/auth.js"
import { ipRestriction } from "../middleware/ipRestriction.js"
import {
	bulkCreate,
	bulkDeleteByCidr,
	createEntry,
	deleteEntry,
	DuplicateEntryError,
	getEntriesByUsers,
	getEntryCountsByUser,
	InvalidCidrError,
	listEntries,
} from "../services/userIpAllowlistService.js"

// Upper bound on bulk userIds. Well above realistic team sizes so the FE
// rarely needs to chunk, low enough that a misconfigured or compromised
// admin call can't drag a single transaction to its knees.
const BULK_USER_IDS_MAX = 1000

function requireValidTargetUserId(req: Request, res: Response): boolean {
	const value = String(req.params.userId)
	if (!isUuid(value)) {
		res.status(400).json({ code: "INVALID_USER_ID" })
		return false
	}
	res.locals.targetUserId = value
	return true
}

/**
 * Admin-only access gate. The URL hierarchy is deliberately resource-
 * scoped (`/users/:userId/...`, not `/admin/...`) so the gate can be
 * loosened to also permit a caller whose own `userId` matches the path
 * target without restructuring the routes.
 */
function requireAllowlistAccess(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const callerUserId = res.locals.userId as string
	const targetUserId = res.locals.targetUserId as string | undefined

	if (isAdmin(callerUserId)) {
		next()
		return
	}

	logger.warn(
		{ callerUserId, targetUserId, path: req.path, method: req.method },
		"ip_allowlist.access.forbidden",
	)
	res.status(403).json({ code: "FORBIDDEN" })
}

function requirePerUserAccess(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	if (!requireValidTargetUserId(req, res)) return
	requireAllowlistAccess(req, res, next)
}

// Longest legal CIDR is a fully-expanded IPv6 /128 at 43 chars; 64 leaves
// headroom without admitting arbitrary blobs. 255 keeps `description`
// bounded while still fitting realistic office / VPN labels.
const CIDR_MAX_LENGTH = 64
const DESCRIPTION_MAX_LENGTH = 255

const cidrSchema = z.string().min(1).max(CIDR_MAX_LENGTH)
const descriptionSchema = z
	.string()
	.max(DESCRIPTION_MAX_LENGTH)
	.nullable()
	.optional()

const createBodySchema = z.object({
	cidr: cidrSchema,
	description: descriptionSchema,
})

// Reject duplicate ids up front. The service uses `onConflictDoNothing`, so
// DB integrity is fine even with duplicates — but they would emit doubled
// `ip_allowlist.added` audit lines and double-count outcomes in the
// per-user result array. Guards against admin-curl / scripted callers
// that might submit a non-deduplicated list.
const userIdsSchema = z
	.array(z.string().regex(UUID_RE))
	.min(1)
	.max(BULK_USER_IDS_MAX)
	.refine((arr) => new Set(arr).size === arr.length, {
		message: "userIds must be unique",
	})

const bulkBodySchema = z.object({
	userIds: userIdsSchema,
	cidr: cidrSchema,
	description: descriptionSchema,
})

const bulkDeleteBodySchema = z.object({
	userIds: userIdsSchema,
	cidr: cidrSchema,
})

const byUsersBodySchema = z.object({
	userIds: userIdsSchema,
})

export const userIpAllowlistRouter = Router()

userIpAllowlistRouter.get(
	"/users/:userId/ip-allowlist",
	requireAuth,
	ipRestriction,
	requirePerUserAccess,
	async (_req, res) => {
		const targetUserId = res.locals.targetUserId as string
		const items = await listEntries(targetUserId)
		res.json({
			items: items.map((e) => ({
				id: e.id,
				cidr: e.cidr,
				description: e.description,
				createdAt: e.createdAt,
				updatedAt: e.updatedAt,
			})),
		})
	},
)

userIpAllowlistRouter.post(
	"/users/:userId/ip-allowlist",
	requireAuth,
	ipRestriction,
	requirePerUserAccess,
	async (req, res) => {
		const callerUserId = res.locals.userId as string
		const targetUserId = res.locals.targetUserId as string

		const parsed = createBodySchema.safeParse(req.body)
		if (!parsed.success) {
			res.status(400).json({
				code: "INVALID_BODY",
				details: parsed.error.errors,
			})
			return
		}

		try {
			const entry = await createEntry({
				userId: targetUserId,
				cidr: parsed.data.cidr,
				description: parsed.data.description ?? null,
			})
			logger.info(
				{
					adminUserId: callerUserId,
					targetUserId,
					cidr: entry.cidr,
					description: entry.description,
				},
				"ip_allowlist.added",
			)
			res.status(201).json({
				id: entry.id,
				cidr: entry.cidr,
				description: entry.description,
				createdAt: entry.createdAt,
				updatedAt: entry.updatedAt,
			})
		} catch (err) {
			if (err instanceof InvalidCidrError) {
				res.status(400).json({ code: "INVALID_CIDR", reason: err.reason })
				return
			}
			if (err instanceof DuplicateEntryError) {
				res.status(409).json({ code: "CONFLICT" })
				return
			}
			logger.error(
				{ err, callerUserId, targetUserId },
				"ip_allowlist.add.error",
			)
			res.status(500).json({ code: "INTERNAL_ERROR" })
		}
	},
)

/**
 * The userId in the path must match the entry's user_id (otherwise 404):
 * an entry id alone is never enough to delete without also knowing the
 * owner. Keeps the URL hierarchy honest as the access gate evolves.
 */
userIpAllowlistRouter.delete(
	"/users/:userId/ip-allowlist/:id",
	requireAuth,
	ipRestriction,
	requirePerUserAccess,
	async (req, res) => {
		const callerUserId = res.locals.userId as string
		const targetUserId = res.locals.targetUserId as string
		const id = String(req.params.id)

		if (!isUuid(id)) {
			res.status(400).json({ code: "INVALID_ID" })
			return
		}

		const deleted = await deleteEntry(id, targetUserId)
		if (!deleted) {
			// Either the id does not exist, or it belongs to a different user.
			// Both cases collapse to 404 — do not leak the existence of cross-user ids.
			res.status(404).json({ code: "NOT_FOUND" })
			return
		}
		logger.info(
			{
				adminUserId: callerUserId,
				targetUserId: deleted.userId,
				cidr: deleted.cidr,
				description: deleted.description,
			},
			"ip_allowlist.removed",
		)
		res.status(204).send()
	},
)

/**
 * Bulk-add the same CIDR to many users. `outcome: "skipped"` means the row
 * already existed (not an error) — the FE renders partial outcomes without
 * needing per-user 409 detection.
 */
userIpAllowlistRouter.post(
	"/ip-allowlist/bulk",
	requireAuth,
	ipRestriction,
	async (req, res) => {
		const callerUserId = res.locals.userId as string
		if (!isAdmin(callerUserId)) {
			res.status(403).json({ code: "FORBIDDEN" })
			return
		}

		const parsed = bulkBodySchema.safeParse(req.body)
		if (!parsed.success) {
			res
				.status(400)
				.json({ code: "INVALID_BODY", details: parsed.error.errors })
			return
		}

		try {
			const results = await bulkCreate({
				userIds: parsed.data.userIds,
				cidr: parsed.data.cidr,
				description: parsed.data.description ?? null,
			})
			const addedCount = results.filter((r) => r.outcome === "added").length
			// Per-user audit lines so CloudWatch can reconstruct "who changed
			// what for whom" — a single rolled-up summary can't answer that for
			// a 1000-user bulk action. Reuses the single-user POST's event name
			// (`ip_allowlist.added`) so audit queries filter on one event.
			for (const r of results) {
				if (r.outcome !== "added") continue
				logger.info(
					{
						adminUserId: callerUserId,
						targetUserId: r.userId,
						cidr: parsed.data.cidr,
						description: parsed.data.description ?? null,
						source: "bulk",
					},
					"ip_allowlist.added",
				)
			}
			logger.info(
				{
					adminUserId: callerUserId,
					cidr: parsed.data.cidr,
					targets: parsed.data.userIds.length,
					addedCount,
				},
				"ip_allowlist.bulk_added",
			)
			res.json({ results })
		} catch (err) {
			if (err instanceof InvalidCidrError) {
				res.status(400).json({ code: "INVALID_CIDR", reason: err.reason })
				return
			}
			logger.error({ err, callerUserId }, "ip_allowlist.bulk_add.error")
			res.status(500).json({ code: "INTERNAL_ERROR" })
		}
	},
)

/**
 * POST (not DELETE) because some proxies strip request bodies from DELETE.
 */
userIpAllowlistRouter.post(
	"/ip-allowlist/bulk-delete",
	requireAuth,
	ipRestriction,
	async (req, res) => {
		const callerUserId = res.locals.userId as string
		if (!isAdmin(callerUserId)) {
			res.status(403).json({ code: "FORBIDDEN" })
			return
		}

		const parsed = bulkDeleteBodySchema.safeParse(req.body)
		if (!parsed.success) {
			res
				.status(400)
				.json({ code: "INVALID_BODY", details: parsed.error.errors })
			return
		}

		try {
			const results = await bulkDeleteByCidr({
				userIds: parsed.data.userIds,
				cidr: parsed.data.cidr,
			})
			const deletedCount = results.filter((r) => r.outcome === "deleted").length
			// Per-user audit lines, same rationale as the bulk-add path. Unlike
			// the single-row DELETE endpoint, `description` is not emitted here —
			// surfacing it would require an extra SELECT before the DELETE.
			for (const r of results) {
				if (r.outcome !== "deleted") continue
				logger.info(
					{
						adminUserId: callerUserId,
						targetUserId: r.userId,
						cidr: parsed.data.cidr,
						source: "bulk",
					},
					"ip_allowlist.removed",
				)
			}
			logger.info(
				{
					adminUserId: callerUserId,
					cidr: parsed.data.cidr,
					targets: parsed.data.userIds.length,
					deletedCount,
				},
				"ip_allowlist.bulk_removed",
			)
			res.json({ results })
		} catch (err) {
			if (err instanceof InvalidCidrError) {
				res.status(400).json({ code: "INVALID_CIDR", reason: err.reason })
				return
			}
			logger.error({ err, callerUserId }, "ip_allowlist.bulk_delete.error")
			res.status(500).json({ code: "INTERNAL_ERROR" })
		}
	},
)

/**
 * Fetch allowlist entries for many users in a single request. Every
 * requested userId appears in the response as `[]` when they have no
 * entries, so callers don't need to special-case "absent vs empty".
 *
 * POST (not GET-with-querystring) because team rosters can push past URL
 * length limits, and a body-bearing GET is poorly supported by proxies.
 */
userIpAllowlistRouter.post(
	"/ip-allowlist/by-users",
	requireAuth,
	ipRestriction,
	async (req, res) => {
		const callerUserId = res.locals.userId as string
		if (!isAdmin(callerUserId)) {
			res.status(403).json({ code: "FORBIDDEN" })
			return
		}

		const parsed = byUsersBodySchema.safeParse(req.body)
		if (!parsed.success) {
			res
				.status(400)
				.json({ code: "INVALID_BODY", details: parsed.error.errors })
			return
		}

		try {
			const rows = await getEntriesByUsers(parsed.data.userIds)
			// Seed empty buckets for every requested id so the response never
			// has "user missing" — only "user has zero entries".
			const entriesByUser: Record<
				string,
				{
					id: string
					cidr: string
					description: string | null
					createdAt: Date
					updatedAt: Date
				}[]
			> = {}
			for (const id of parsed.data.userIds) entriesByUser[id] = []
			for (const r of rows) {
				const bucket = entriesByUser[r.userId]
				if (!bucket) continue
				bucket.push({
					id: r.id,
					cidr: r.cidr,
					description: r.description,
					createdAt: r.createdAt,
					updatedAt: r.updatedAt,
				})
			}
			res.json({ entriesByUser })
		} catch (err) {
			logger.error({ err, callerUserId }, "ip_allowlist.by_users.error")
			res.status(500).json({ code: "INTERNAL_ERROR" })
		}
	},
)

/**
 * Per-user entry counts for the admin overview badges. Users with zero
 * entries are omitted; callers treat absent ids as 0.
 */
userIpAllowlistRouter.get(
	"/ip-allowlist/summary",
	requireAuth,
	ipRestriction,
	async (_req, res) => {
		const callerUserId = res.locals.userId as string
		if (!isAdmin(callerUserId)) {
			res.status(403).json({ code: "FORBIDDEN" })
			return
		}

		const rows = await getEntryCountsByUser()
		const counts: Record<string, number> = {}
		for (const r of rows) counts[r.userId] = r.count
		res.json({ counts })
	},
)
