// Tests for the ipRestriction middleware. The middleware's job is to:
//   - require requireAuth to have set res.locals.userId
//   - read X-Source-IP from the request
//   - call the service's checkAccess(userId, sourceIp)
//   - 403 IP_RESTRICTED on no_match, next() on match / no_entries, fail-closed 500 otherwise
//
// We mock the service layer to keep these tests DB-free.

import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

const checkAccessMock = vi.fn()

vi.mock("../../src/services/userIpAllowlistService.js", () => ({
	checkAccess: checkAccessMock,
}))

const { ipRestriction } = await import(
	"../../src/middleware/ipRestriction.js"
)

function buildApp(opts?: { skipUserId?: boolean }) {
	const app = express()
	if (!opts?.skipUserId) {
		app.use((_req, res, next) => {
			res.locals.userId = "11111111-1111-1111-1111-111111111111"
			next()
		})
	}
	app.use(ipRestriction)
	app.get("/protected", (_req, res) => {
		res.json({
			userId: res.locals.userId,
			sourceIp: res.locals.sourceIp,
		})
	})
	return app
}

beforeEach(() => {
	checkAccessMock.mockReset()
})

describe("ipRestriction", () => {
	it("passes through and populates res.locals.sourceIp when match", async () => {
		checkAccessMock.mockResolvedValue({ status: "match" })
		const res = await request(buildApp())
			.get("/protected")
			.set("X-Source-IP", "203.0.113.10")
		expect(res.status).toBe(200)
		expect(res.body).toEqual({
			userId: "11111111-1111-1111-1111-111111111111",
			sourceIp: "203.0.113.10",
		})
		expect(checkAccessMock).toHaveBeenCalledWith(
			"11111111-1111-1111-1111-111111111111",
			"203.0.113.10",
		)
		// Authenticated 200 responses must not be cached by intermediaries —
		// they carry user-identifying payloads (userId, sourceIp, /me, etc.).
		expect(res.headers["cache-control"]).toBe("no-store")
	})

	it("passes through when the user has no_entries (opt-in default)", async () => {
		checkAccessMock.mockResolvedValue({ status: "no_entries" })
		const res = await request(buildApp())
			.get("/protected")
			.set("X-Source-IP", "203.0.113.10")
		expect(res.status).toBe(200)
		expect(res.headers["cache-control"]).toBe("no-store")
	})

	it("returns 403 IP_RESTRICTED with Cache-Control: no-store on no_match", async () => {
		checkAccessMock.mockResolvedValue({ status: "no_match" })
		const res = await request(buildApp())
			.get("/protected")
			.set("X-Source-IP", "203.0.113.11")
		expect(res.status).toBe(403)
		expect(res.body).toEqual({ code: "IP_RESTRICTED" })
		expect(res.headers["cache-control"]).toBe("no-store")
	})

	it("fail-closes with 500 when res.locals.userId is missing", async () => {
		const res = await request(buildApp({ skipUserId: true }))
			.get("/protected")
			.set("X-Source-IP", "203.0.113.10")
		expect(res.status).toBe(500)
		expect(res.body).toEqual({ code: "INTERNAL_ERROR" })
		expect(checkAccessMock).not.toHaveBeenCalled()
	})

	it("fail-closes with 500 when X-Source-IP header is absent", async () => {
		const res = await request(buildApp()).get("/protected")
		expect(res.status).toBe(500)
		expect(res.body).toEqual({ code: "INTERNAL_ERROR" })
		expect(checkAccessMock).not.toHaveBeenCalled()
	})

	it("fail-closes with 500 when X-Source-IP is empty / whitespace", async () => {
		const res = await request(buildApp())
			.get("/protected")
			.set("X-Source-IP", "   ")
		expect(res.status).toBe(500)
		expect(checkAccessMock).not.toHaveBeenCalled()
	})

	it("fail-closes with 500 when the service throws", async () => {
		checkAccessMock.mockRejectedValue(new Error("db is on fire"))
		const res = await request(buildApp())
			.get("/protected")
			.set("X-Source-IP", "203.0.113.10")
		expect(res.status).toBe(500)
		expect(res.body).toEqual({ code: "INTERNAL_ERROR" })
	})

	it("accepts IPv6 source IPs and forwards them to checkAccess", async () => {
		checkAccessMock.mockResolvedValue({ status: "match" })
		const res = await request(buildApp())
			.get("/protected")
			.set("X-Source-IP", "2001:db8::1")
		expect(res.status).toBe(200)
		expect(checkAccessMock).toHaveBeenCalledWith(
			"11111111-1111-1111-1111-111111111111",
			"2001:db8::1",
		)
	})

	it("fail-closes with 500 when X-Source-IP contains a comma (duplicate header collapsed by Node)", async () => {
		const res = await request(buildApp())
			.get("/protected")
			// supertest sends duplicates as a single comma-joined string, which is
			// what Node's HTTP parser does to duplicate non-cookie headers.
			.set("X-Source-IP", "203.0.113.10, 198.51.100.42")
		expect(res.status).toBe(500)
		expect(res.body).toEqual({ code: "INTERNAL_ERROR" })
		expect(res.headers["cache-control"]).toBe("no-store")
		// Don't fall through to checkAccess on malformed input.
		expect(checkAccessMock).not.toHaveBeenCalled()
	})

	it("attaches Cache-Control: no-store to 500 responses (no CDN pinning of misconfig)", async () => {
		const res = await request(buildApp()).get("/protected") // no X-Source-IP
		expect(res.status).toBe(500)
		expect(res.headers["cache-control"]).toBe("no-store")
	})
})
