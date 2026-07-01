import { isIP } from "node:net"
import { and, eq, inArray, sql } from "drizzle-orm"
import { db } from "../db/client.js"
import {
	type UserIpAllowlist,
	userIpAllowlist,
} from "../db/schema/userIpAllowlist.js"

export class InvalidCidrError extends Error {
	constructor(public readonly reason: string) {
		super(`userIpAllowlistService::normalizeCidr::invalid CIDR: ${reason}`)
		this.name = "InvalidCidrError"
	}
}

export class DuplicateEntryError extends Error {
	constructor() {
		super(
			"userIpAllowlistService::createEntry::duplicate (user_id, cidr) allowlist entry",
		)
		this.name = "DuplicateEntryError"
	}
}

const MAX_PREFIX_BY_FAMILY = { 4: 32, 6: 128 } as const

/**
 * Accepts a bare host ("1.2.3.4" → "1.2.3.4/32", "2001:db8::1" →
 * "2001:db8::1/128") or full CIDR notation. Throws InvalidCidrError on any
 * malformed input.
 */
export function normalizeCidr(input: string): string {
	const trimmed = input.trim()
	if (!trimmed) {
		throw new InvalidCidrError("empty")
	}
	const parts = trimmed.split("/")
	if (parts.length > 2) {
		throw new InvalidCidrError("multiple slashes")
	}
	const host = parts[0]
	const maskStr = parts[1]
	const family = isIP(host)
	if (family !== 4 && family !== 6) {
		throw new InvalidCidrError("not a valid IPv4 or IPv6 address")
	}
	const maxMask: number = MAX_PREFIX_BY_FAMILY[family]
	let mask: number = maxMask
	if (maskStr !== undefined) {
		if (!/^\d+$/.test(maskStr)) {
			throw new InvalidCidrError("prefix length must be a non-negative integer")
		}
		const n = Number(maskStr)
		if (n < 0 || n > maxMask) {
			throw new InvalidCidrError(
				`prefix length out of range (0–${maxMask} for IPv${family})`,
			)
		}
		mask = n
	}
	return `${host}/${mask}`
}

export type AccessCheckStatus = "no_entries" | "match" | "no_match"

export interface AccessCheckResult {
	status: AccessCheckStatus
}

/**
 * Returns one of three states:
 *   - "no_entries" — user has no allowlist entries (opt-in default: allowed)
 *   - "match"      — an entry's CIDR contains the source IP
 *   - "no_match"   — entries exist but none contain the source IP
 *
 * Two separate queries (rather than one EXISTS) so the middleware can log
 * "restricted but missed" distinctly from "unrestricted".
 */
export async function checkAccess(
	userId: string,
	sourceIp: string,
): Promise<AccessCheckResult> {
	const [hasEntries] = await db
		.select({ one: sql<number>`1` })
		.from(userIpAllowlist)
		.where(eq(userIpAllowlist.userId, userId))
		.limit(1)
	if (!hasEntries) {
		return { status: "no_entries" }
	}

	const [match] = await db
		.select({ one: sql<number>`1` })
		.from(userIpAllowlist)
		.where(
			and(
				eq(userIpAllowlist.userId, userId),
				sql`${userIpAllowlist.cidr} >>= ${sourceIp}::inet`,
			),
		)
		.limit(1)

	return { status: match ? "match" : "no_match" }
}

export async function listEntries(userId: string): Promise<UserIpAllowlist[]> {
	return db
		.select()
		.from(userIpAllowlist)
		.where(eq(userIpAllowlist.userId, userId))
}

/**
 * Fetch entries for many users in one query. Users with no entries are
 * absent from the result; callers treat absent as 0.
 */
export async function getEntriesByUsers(
	userIds: string[],
): Promise<UserIpAllowlist[]> {
	if (userIds.length === 0) return []
	return db
		.select()
		.from(userIpAllowlist)
		.where(inArray(userIpAllowlist.userId, userIds))
}

export async function createEntry(args: {
	userId: string
	cidr: string
	description?: string | null
}): Promise<UserIpAllowlist> {
	const normalized = normalizeCidr(args.cidr)
	// `onConflictDoNothing` + missing RETURNING row → translate to a typed
	// DuplicateEntryError. Avoids relying on Postgres SQLSTATE detection,
	// which gets brittle when wrappers reshape errors.
	const [entry] = await db
		.insert(userIpAllowlist)
		.values({
			userId: args.userId,
			cidr: normalized,
			description: args.description ?? null,
		})
		.onConflictDoNothing()
		.returning()
	if (!entry) {
		throw new DuplicateEntryError()
	}
	return entry
}

/**
 * Returns the deleted row, or null if no row matches both id AND userId.
 * The userId scoping keeps the `/users/{userId}/ip-allowlist/{id}` hierarchy
 * honest — an admin can't delete an entry across users by id alone.
 */
export async function deleteEntry(
	id: string,
	userId: string,
): Promise<UserIpAllowlist | null> {
	const [deleted] = await db
		.delete(userIpAllowlist)
		.where(
			and(eq(userIpAllowlist.id, id), eq(userIpAllowlist.userId, userId)),
		)
		.returning()
	return deleted ?? null
}

/**
 * Per-user entry counts for the admin overview badges. Users with zero
 * entries are absent from the result — callers treat absent as 0.
 */
export async function getEntryCountsByUser(): Promise<
	{ userId: string; count: number }[]
> {
	const rows = await db
		.select({
			userId: userIpAllowlist.userId,
			count: sql<number>`count(*)::int`,
		})
		.from(userIpAllowlist)
		.groupBy(userIpAllowlist.userId)
	return rows
}

export type BulkAddOutcome = "added" | "skipped"
export type BulkDeleteOutcome = "deleted" | "not_found"

/**
 * Existing (user_id, cidr) rows resolve to "skipped" via onConflictDoNothing,
 * so the FE can report partial outcomes without per-user 409 detection.
 */
export async function bulkCreate(args: {
	userIds: string[]
	cidr: string
	description?: string | null
}): Promise<{ userId: string; outcome: BulkAddOutcome }[]> {
	if (args.userIds.length === 0) return []
	const normalized = normalizeCidr(args.cidr)
	const rows = args.userIds.map((userId) => ({
		userId,
		cidr: normalized,
		description: args.description ?? null,
	}))
	const inserted = await db
		.insert(userIpAllowlist)
		.values(rows)
		.onConflictDoNothing()
		.returning({ userId: userIpAllowlist.userId })
	const addedSet = new Set(inserted.map((r) => r.userId))
	return args.userIds.map((userId) => ({
		userId,
		outcome: addedSet.has(userId) ? "added" : "skipped",
	}))
}

/**
 * Matches by normalized CIDR so callers don't need to look up entry ids
 * first. Missing rows are reported as "not_found".
 */
export async function bulkDeleteByCidr(args: {
	userIds: string[]
	cidr: string
}): Promise<{ userId: string; outcome: BulkDeleteOutcome }[]> {
	if (args.userIds.length === 0) return []
	const normalized = normalizeCidr(args.cidr)
	const deleted = await db
		.delete(userIpAllowlist)
		.where(
			and(
				inArray(userIpAllowlist.userId, args.userIds),
				sql`${userIpAllowlist.cidr} = ${normalized}::cidr`,
			),
		)
		.returning({ userId: userIpAllowlist.userId })
	const deletedSet = new Set(deleted.map((r) => r.userId))
	return args.userIds.map((userId) => ({
		userId,
		outcome: deletedSet.has(userId) ? "deleted" : "not_found",
	}))
}
