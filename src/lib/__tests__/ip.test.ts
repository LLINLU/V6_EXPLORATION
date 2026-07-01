import { ipInCidr, isIP } from "../ip"

describe("isIP", () => {
	describe("IPv4", () => {
		it("recognizes canonical addresses", () => {
			expect(isIP("203.0.113.10")).toBe(4)
			expect(isIP("0.0.0.0")).toBe(4)
			expect(isIP("255.255.255.255")).toBe(4)
		})

		it("rejects out-of-range octets", () => {
			expect(isIP("256.0.0.0")).toBe(0)
			expect(isIP("1.2.3.999")).toBe(0)
		})

		it("rejects leading zeros / malformed octets", () => {
			expect(isIP("01.2.3.4")).toBe(0)
			expect(isIP("1.2.3.")).toBe(0)
			expect(isIP("1.2.3")).toBe(0)
			expect(isIP("abc.def.ghi.jkl")).toBe(0)
		})
	})

	describe("IPv6", () => {
		it("recognizes canonical addresses", () => {
			expect(isIP("2001:db8::1")).toBe(6)
			expect(isIP("::1")).toBe(6)
			expect(isIP("::")).toBe(6)
			expect(isIP("fe80::1234:5678:9abc:def0")).toBe(6)
		})

		it("recognizes fully expanded form", () => {
			expect(isIP("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe(6)
		})

		it("recognizes IPv4-mapped (::ffff:1.2.3.4)", () => {
			expect(isIP("::ffff:192.0.2.1")).toBe(6)
		})

		it("rejects multiple :: compressions", () => {
			expect(isIP("2001::db8::1")).toBe(0)
		})

		it("rejects malformed hextets", () => {
			expect(isIP("gggg::1")).toBe(0)
			expect(isIP("12345::1")).toBe(0)
		})
	})

	it("returns 0 for non-IP input", () => {
		expect(isIP("")).toBe(0)
		expect(isIP("not an ip")).toBe(0)
		expect(isIP("1.2.3.4/24")).toBe(0) // CIDR notation is not a bare IP
	})
})

describe("ipInCidr — IPv4", () => {
	it("matches a /32 host equal to the IP", () => {
		expect(ipInCidr("203.0.113.10", "203.0.113.10/32")).toBe(true)
		expect(ipInCidr("203.0.113.10", "203.0.113.10")).toBe(true) // implicit /32
	})

	it("rejects a /32 host different from the IP", () => {
		expect(ipInCidr("203.0.113.11", "203.0.113.10/32")).toBe(false)
	})

	it("matches addresses inside a /24", () => {
		expect(ipInCidr("203.0.113.0", "203.0.113.0/24")).toBe(true) // network
		expect(ipInCidr("203.0.113.1", "203.0.113.0/24")).toBe(true)
		expect(ipInCidr("203.0.113.255", "203.0.113.0/24")).toBe(true) // broadcast
	})

	it("rejects addresses outside a /24", () => {
		expect(ipInCidr("203.0.114.0", "203.0.113.0/24")).toBe(false)
		expect(ipInCidr("203.0.112.255", "203.0.113.0/24")).toBe(false)
	})

	it("matches /0 for any IPv4 address", () => {
		expect(ipInCidr("0.0.0.0", "0.0.0.0/0")).toBe(true)
		expect(ipInCidr("203.0.113.10", "0.0.0.0/0")).toBe(true)
		expect(ipInCidr("255.255.255.255", "0.0.0.0/0")).toBe(true)
	})

	it("handles high-octet addresses without sign-flipping (uint32 boundary)", () => {
		// "192.168.0.1" with /24 — the leftshift of 192 would overflow signed int.
		expect(ipInCidr("192.168.0.50", "192.168.0.0/24")).toBe(true)
		// "255.255.255.0" / 24 — broadcast / network boundary.
		expect(ipInCidr("255.255.255.255", "255.255.255.0/24")).toBe(true)
	})

	it("returns false for mixed family (IPv4 ip vs IPv6 cidr)", () => {
		expect(ipInCidr("203.0.113.10", "2001:db8::/32")).toBe(false)
	})
})

describe("ipInCidr — IPv6", () => {
	it("matches a /128 host equal to the IP", () => {
		expect(ipInCidr("2001:db8::1", "2001:db8::1/128")).toBe(true)
		expect(ipInCidr("2001:db8::1", "2001:db8::1")).toBe(true)
	})

	it("rejects a /128 host different from the IP", () => {
		expect(ipInCidr("2001:db8::2", "2001:db8::1/128")).toBe(false)
	})

	it("matches addresses inside a /32 IPv6 prefix", () => {
		expect(ipInCidr("2001:db8::1", "2001:db8::/32")).toBe(true)
		expect(
			ipInCidr("2001:db8:ffff:ffff:ffff:ffff:ffff:ffff", "2001:db8::/32"),
		).toBe(true)
	})

	it("rejects addresses outside a /32 IPv6 prefix", () => {
		expect(ipInCidr("2001:db9::1", "2001:db8::/32")).toBe(false)
	})

	it("matches /0 for any IPv6 address", () => {
		expect(ipInCidr("::1", "::/0")).toBe(true)
		expect(ipInCidr("2001:db8::1", "::/0")).toBe(true)
	})

	it("recognizes ::1 as inside the loopback /128", () => {
		expect(ipInCidr("::1", "::1/128")).toBe(true)
	})

	it("treats expanded and compressed forms of the same address as equal", () => {
		expect(
			ipInCidr("2001:db8::1", "2001:0db8:0000:0000:0000:0000:0000:0001/128"),
		).toBe(true)
	})

	it("matches IPv4-mapped IPv6 forms", () => {
		expect(ipInCidr("::ffff:192.0.2.1", "::ffff:0.0.0.0/96")).toBe(true)
	})

	it("returns false for mixed family (IPv6 ip vs IPv4 cidr)", () => {
		expect(ipInCidr("2001:db8::1", "203.0.113.0/24")).toBe(false)
	})

	it("returns false for malformed CIDR", () => {
		expect(ipInCidr("203.0.113.10", "203.0.113.0/33")).toBe(false) // out of range
		expect(ipInCidr("203.0.113.10", "not-an-ip/24")).toBe(false)
	})
})
