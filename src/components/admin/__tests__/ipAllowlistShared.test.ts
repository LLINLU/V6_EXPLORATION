import { ApiError } from "@/lib/apiClient"
import {
	canonicalCidr,
	describeApiError,
	wouldLockOutOnAdd,
	wouldLockOutOnDelete,
} from "../ipAllowlistShared"

describe("canonicalCidr", () => {
	it("strips /32 from a bare IPv4 host", () => {
		expect(canonicalCidr("203.0.113.10/32")).toBe("203.0.113.10")
	})

	it("strips /128 from a bare IPv6 host", () => {
		expect(canonicalCidr("2001:db8::1/128")).toBe("2001:db8::1")
	})

	it("preserves non-host IPv4 CIDR", () => {
		expect(canonicalCidr("203.0.113.0/24")).toBe("203.0.113.0/24")
	})

	it("preserves non-host IPv6 CIDR", () => {
		expect(canonicalCidr("2001:db8::/32")).toBe("2001:db8::/32")
	})

	it("does NOT strip /32 from non-IPv4 input", () => {
		// "/32" only collapses when the host parses as IPv4. Anything else stays.
		expect(canonicalCidr("not-an-ip/32")).toBe("not-an-ip/32")
	})

	it("does NOT strip /128 from non-IPv6 input", () => {
		expect(canonicalCidr("203.0.113.10/128")).toBe("203.0.113.10/128")
	})

	it("returns trimmed bare host unchanged", () => {
		expect(canonicalCidr("  203.0.113.10  ")).toBe("203.0.113.10")
		expect(canonicalCidr("2001:db8::1")).toBe("2001:db8::1")
	})

	it("lowercases IPv6 hex digits (Postgres-side normalization parity)", () => {
		// Postgres `cidr` returns lowercase, so the FE must match. Otherwise
		// "2001:DB8::1" (admin typed) and "2001:db8::1/128" (DB-returned)
		// would split into two rows in the team-aggregate map.
		expect(canonicalCidr("2001:DB8::1/128")).toBe("2001:db8::1")
		expect(canonicalCidr("2001:DB8::1")).toBe("2001:db8::1")
		expect(canonicalCidr("2001:DB8::/32")).toBe("2001:db8::/32")
	})
})

describe("describeApiError", () => {
	const tStub = ((key: string, opts?: Record<string, unknown>) => {
		if (opts && Object.keys(opts).length > 0) {
			return `${key}:${JSON.stringify(opts)}`
		}
		return key
	}) as unknown as Parameters<typeof describeApiError>[0]

	it("maps CONFLICT to the conflict message key", () => {
		const err = new ApiError(409, "x", { code: "CONFLICT" })
		expect(describeApiError(tStub, err)).toBe("admin.ipAllowlist.errorConflict")
	})

	it("maps INVALID_CIDR and forwards the reason as a suffix", () => {
		const err = new ApiError(400, "x", {
			code: "INVALID_CIDR",
			reason: "prefix length out of range",
		})
		const result = describeApiError(tStub, err)
		expect(result).toContain("admin.ipAllowlist.errorCidr")
		expect(result).toContain("prefix length out of range")
	})

	it("maps IP_RESTRICTED to its own key (caller is on a blocked IP)", () => {
		const err = new ApiError(403, "x", { code: "IP_RESTRICTED" })
		expect(describeApiError(tStub, err)).toBe(
			"admin.ipAllowlist.errorIpRestricted",
		)
	})

	it("falls back to generic HTTP message on unknown codes", () => {
		const err = new ApiError(500, "x", { code: "WAT" })
		const result = describeApiError(tStub, err)
		expect(result).toContain("HTTP 500")
		expect(result).toContain("WAT")
	})
})

describe("wouldLockOutOnAdd", () => {
	it("returns false when sourceIp is null (cannot determine)", () => {
		expect(
			wouldLockOutOnAdd({
				sourceIp: null,
				cidr: "203.0.113.0/24",
				existingEntries: [],
			}),
		).toBe(false)
	})

	it("returns true when adding the first non-covering CIDR locks out the caller", () => {
		expect(
			wouldLockOutOnAdd({
				sourceIp: "198.51.100.10",
				cidr: "203.0.113.0/24",
				existingEntries: [],
			}),
		).toBe(true)
	})

	it("returns false when the new CIDR covers the caller's IP", () => {
		expect(
			wouldLockOutOnAdd({
				sourceIp: "203.0.113.10",
				cidr: "203.0.113.0/24",
				existingEntries: [],
			}),
		).toBe(false)
	})

	it("returns false when an existing entry already covers the caller", () => {
		expect(
			wouldLockOutOnAdd({
				sourceIp: "198.51.100.10",
				cidr: "203.0.113.0/24",
				existingEntries: [{ cidr: "198.51.100.0/24" }],
			}),
		).toBe(false)
	})

	it("returns true when existing entries exist but none cover the caller", () => {
		expect(
			wouldLockOutOnAdd({
				sourceIp: "198.51.100.10",
				cidr: "203.0.113.0/24",
				existingEntries: [{ cidr: "10.0.0.0/8" }],
			}),
		).toBe(true)
	})

	it("handles IPv6 source IPs", () => {
		expect(
			wouldLockOutOnAdd({
				sourceIp: "2001:db8::1",
				cidr: "2001:db9::/32",
				existingEntries: [],
			}),
		).toBe(true)
		expect(
			wouldLockOutOnAdd({
				sourceIp: "2001:db8::1",
				cidr: "2001:db8::/32",
				existingEntries: [],
			}),
		).toBe(false)
	})
})

describe("wouldLockOutOnDelete", () => {
	it("returns false when sourceIp is null", () => {
		expect(
			wouldLockOutOnDelete({
				sourceIp: null,
				target: { cidr: "203.0.113.0/24" },
				otherEntries: [],
			}),
		).toBe(false)
	})

	it("returns false when the deletion target does not cover the caller anyway", () => {
		expect(
			wouldLockOutOnDelete({
				sourceIp: "198.51.100.10",
				target: { cidr: "203.0.113.0/24" },
				otherEntries: [],
			}),
		).toBe(false)
	})

	it("returns true when target is the last covering entry", () => {
		expect(
			wouldLockOutOnDelete({
				sourceIp: "203.0.113.10",
				target: { cidr: "203.0.113.0/24" },
				otherEntries: [{ cidr: "10.0.0.0/8" }],
			}),
		).toBe(true)
	})

	it("returns false when another entry still covers the caller", () => {
		expect(
			wouldLockOutOnDelete({
				sourceIp: "203.0.113.10",
				target: { cidr: "203.0.113.0/24" },
				otherEntries: [{ cidr: "203.0.113.10/32" }],
			}),
		).toBe(false)
	})

	it("handles IPv6 source IPs", () => {
		expect(
			wouldLockOutOnDelete({
				sourceIp: "2001:db8::1",
				target: { cidr: "2001:db8::/32" },
				otherEntries: [],
			}),
		).toBe(true)
	})
})
