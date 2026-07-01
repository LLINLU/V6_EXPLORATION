// Shared types and helpers for the IP allowlist admin UI.
//
// `IpAllowlistPanel` re-exports `IpAllowlistTarget` and the
// `IP_ALLOWLIST_CHANGED_EVENT` constant so callers outside
// `components/admin/` don't need to import from this file directly.

import type { TFunction } from "i18next"
import { ApiError } from "@/lib/apiClient"
import { ipInCidr, isIP } from "@/lib/ip"

export interface IpAllowlistMember {
	userId: string
	/** Display label, typically `username (email)`. */
	label: string
}

export type IpAllowlistTarget =
	| { kind: "user"; userId: string; label: string }
	| {
			kind: "team"
			teamId: string
			teamName: string
			members: IpAllowlistMember[]
	  }

export interface AllowlistEntry {
	id: string
	cidr: string
	description: string | null
	createdAt: string
	updatedAt: string
}

/**
 * Window CustomEvent fired whenever the panel mutates entries (add / delete /
 * bulk). Listeners (e.g. UserManagementTab) can refresh aggregated count
 * badges without a prop-drilled callback through the page layout.
 */
export const IP_ALLOWLIST_CHANGED_EVENT = "memorylab:ip-allowlist-changed"

export function notifyAllowlistChanged(): void {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent(IP_ALLOWLIST_CHANGED_EVENT))
	}
}

/**
 * Postgres `cidr` normalizes hosts on read — a bare "203.0.113.10" comes back
 * as "203.0.113.10/32" (and IPv6 hosts as "/128"). Strip those trailing
 * full-host suffixes so the FE comparison between admin-typed and API-returned
 * values agrees. IPv6 hex digits are also lowercased: Postgres returns
 * lowercase, so "2001:DB8::1" typed by an admin would otherwise fail to dedupe
 * against an API-returned "2001:db8::1/128" in the team-aggregate table.
 * Anything else is returned as-is (Postgres has already canonicalized the
 * value on write).
 */
export function canonicalCidr(s: string): string {
	const trimmed = s.trim()
	const slashIndex = trimmed.indexOf("/")
	const host = slashIndex < 0 ? trimmed : trimmed.slice(0, slashIndex)
	const mask = slashIndex < 0 ? null : trimmed.slice(slashIndex + 1)
	const family = isIP(host)
	if (family === 6) {
		const lcHost = host.toLowerCase()
		if (mask === null || mask === "128") return lcHost
		return `${lcHost}/${mask}`
	}
	if (family === 4) {
		if (mask === null || mask === "32") return host
		return `${host}/${mask}`
	}
	return trimmed
}

/**
 * Translate an `ApiError` (from `apiClient`) into a human-readable string in
 * the active locale. Falls back to a generic HTTP-status message when the
 * server's `code` is unrecognized — keeps the UI honest about unexpected
 * states.
 */
export function describeApiError(t: TFunction, err: ApiError): string {
	const body = err.body as Record<string, unknown> | null | undefined
	const code = typeof body?.code === "string" ? body.code : undefined
	const reason = typeof body?.reason === "string" ? body.reason : undefined

	switch (code) {
		case "CONFLICT":
			return t("admin.ipAllowlist.errorConflict")
		case "INVALID_CIDR":
			return t("admin.ipAllowlist.errorCidr", {
				suffix: reason
					? t("admin.ipAllowlist.errorCidrReason", { reason })
					: "",
			})
		case "INVALID_USER_ID":
			return t("admin.ipAllowlist.errorInvalidUserId")
		case "INVALID_BODY":
			return t("admin.ipAllowlist.errorInvalidBody")
		case "FORBIDDEN":
			return t("admin.ipAllowlist.errorForbidden")
		case "IP_RESTRICTED":
			return t("admin.ipAllowlist.errorIpRestricted")
		case "NOT_FOUND":
			return t("admin.ipAllowlist.errorNotFound")
		case "INTERNAL_ERROR":
			return t("admin.ipAllowlist.errorInternal")
	}

	const fallbackError = typeof body?.error === "string" ? body.error : undefined
	const detail = code ?? fallbackError ?? ""
	const reasonSuffix = reason ? ` (${reason})` : ""
	return `HTTP ${err.status}${detail ? ` ${detail}` : ""}${reasonSuffix}`
}

export function reportApiError(
	t: TFunction,
	action: string,
	err: unknown,
): string {
	if (err instanceof ApiError) {
		return t("admin.ipAllowlist.errorPrefix", {
			action,
			detail: describeApiError(t, err),
		})
	}
	if (err instanceof Error) {
		return t("admin.ipAllowlist.errorPrefix", { action, detail: err.message })
	}
	return t("admin.ipAllowlist.errorPrefix", { action, detail: String(err) })
}

export interface BulkRowResult {
	userId: string
	outcome: "added" | "skipped" | "deleted" | "not_found" | "failed"
	reason?: string
}

export interface BulkSummary {
	action: "add" | "delete"
	cidr: string
	successCount: number
	skipped: { userId: string }[]
	failed: { userId: string; reason: string }[]
}

// ─── Self-lockout detection ──────────────────────────────────────────────
//
// Warn admins before they commit a change that strands their own current IP
// outside the allowlist. The checks below are precise, not conservative —
// they only fire when the change actually removes the caller's coverage:
//
//   - ADD: caller is editing their own row, the new CIDR doesn't cover the
//          caller's current IP, AND the caller has no other covering entry.
//   - DELETE: caller is editing their own row, the entry being deleted
//          covers the caller's IP, AND no other remaining entry covers it.
//
// Callers pass `null` for `sourceIp` if it's not yet known — the helpers
// return `false` in that case (we can't determine, so don't show a warning).

/**
 * True iff adding `cidr` would strand `sourceIp` outside any covering entry.
 * Existing entries are checked first; if any already covers the caller, the
 * add is safe regardless of whether the new CIDR covers them.
 */
export function wouldLockOutOnAdd(args: {
	sourceIp: string | null
	cidr: string
	existingEntries: { cidr: string }[]
}): boolean {
	const { sourceIp, cidr, existingEntries } = args
	if (!sourceIp) return false
	const family = isIP(sourceIp)
	if (family === 0) return false
	if (ipInCidr(sourceIp, cidr)) return false
	return !existingEntries.some((e) => ipInCidr(sourceIp, e.cidr))
}

/**
 * True iff deleting `target` would remove the caller's last covering entry.
 * Other entries that already don't cover the caller are irrelevant — the
 * caller was protected by `target` alone.
 */
export function wouldLockOutOnDelete(args: {
	sourceIp: string | null
	target: { cidr: string }
	otherEntries: { cidr: string }[]
}): boolean {
	const { sourceIp, target, otherEntries } = args
	if (!sourceIp) return false
	const family = isIP(sourceIp)
	if (family === 0) return false
	if (!ipInCidr(sourceIp, target.cidr)) return false
	return !otherEntries.some((e) => ipInCidr(sourceIp, e.cidr))
}
