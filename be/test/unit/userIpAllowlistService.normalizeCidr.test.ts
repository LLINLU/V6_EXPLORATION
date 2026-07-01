import { describe, expect, it } from "vitest"
import {
	InvalidCidrError,
	normalizeCidr,
} from "../../src/services/userIpAllowlistService.js"

describe("normalizeCidr — IPv4", () => {
	it("normalizes a bare IPv4 host to /32", () => {
		expect(normalizeCidr("203.0.113.10")).toBe("203.0.113.10/32")
	})

	it("preserves a full IPv4 CIDR", () => {
		expect(normalizeCidr("203.0.113.0/24")).toBe("203.0.113.0/24")
	})

	it("trims surrounding whitespace", () => {
		expect(normalizeCidr("  10.0.0.1/8  ")).toBe("10.0.0.1/8")
	})

	it("accepts /0 (full-range)", () => {
		expect(normalizeCidr("0.0.0.0/0")).toBe("0.0.0.0/0")
	})

	it("accepts /32 (single host) when explicit", () => {
		expect(normalizeCidr("127.0.0.1/32")).toBe("127.0.0.1/32")
	})

	it("rejects prefix length above 32 for IPv4", () => {
		expect(() => normalizeCidr("10.0.0.1/33")).toThrow(InvalidCidrError)
	})

	it("rejects negative-looking prefix length", () => {
		// "10.0.0.1/-1" splits to ["10.0.0.1", "-1"]; the digit check refuses "-1"
		expect(() => normalizeCidr("10.0.0.1/-1")).toThrow(InvalidCidrError)
	})

	it("rejects non-numeric prefix length", () => {
		expect(() => normalizeCidr("10.0.0.1/abc")).toThrow(InvalidCidrError)
	})

	it("rejects trailing slash with no mask", () => {
		expect(() => normalizeCidr("10.0.0.1/")).toThrow(InvalidCidrError)
	})

	it("rejects multiple slashes", () => {
		expect(() => normalizeCidr("10.0.0.1/24/8")).toThrow(InvalidCidrError)
	})

	it("rejects garbage", () => {
		expect(() => normalizeCidr("abc.def.ghi.jkl")).toThrow(InvalidCidrError)
	})

	it("rejects octets above 255", () => {
		expect(() => normalizeCidr("999.999.999.999")).toThrow(InvalidCidrError)
	})

	it("rejects empty input", () => {
		expect(() => normalizeCidr("")).toThrow(InvalidCidrError)
		expect(() => normalizeCidr("   ")).toThrow(InvalidCidrError)
	})
})

describe("normalizeCidr — IPv6", () => {
	it("normalizes a bare IPv6 host to /128", () => {
		expect(normalizeCidr("2001:db8::1")).toBe("2001:db8::1/128")
	})

	it("preserves a full IPv6 CIDR", () => {
		expect(normalizeCidr("2001:db8::/32")).toBe("2001:db8::/32")
	})

	it("accepts /0 (full-range IPv6)", () => {
		expect(normalizeCidr("::/0")).toBe("::/0")
	})

	it("accepts /128 (single host) when explicit", () => {
		expect(normalizeCidr("::1/128")).toBe("::1/128")
	})

	it("accepts common /64 prefix", () => {
		expect(normalizeCidr("fe80::/64")).toBe("fe80::/64")
	})

	it("rejects prefix length above 128 for IPv6", () => {
		expect(() => normalizeCidr("2001:db8::1/129")).toThrow(InvalidCidrError)
	})

	it("rejects malformed IPv6", () => {
		expect(() => normalizeCidr("2001::db8::1")).toThrow(InvalidCidrError)
	})

	it("error reason includes the family for out-of-range IPv6 prefix", () => {
		try {
			normalizeCidr("2001:db8::1/200")
			throw new Error("expected normalizeCidr to throw")
		} catch (err) {
			expect(err).toBeInstanceOf(InvalidCidrError)
			expect((err as InvalidCidrError).reason).toMatch(/IPv6/)
		}
	})
})
