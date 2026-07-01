import express from "express"
import request from "supertest"
import { describe, expect, it } from "vitest"
import { requireAuth } from "../../src/middleware/auth.js"

function buildApp() {
	const app = express()
	app.get("/protected", requireAuth, (_req, res) => {
		res.json({ userId: res.locals.userId })
	})
	return app
}

describe("requireAuth", () => {
	const validUuid = "12345678-1234-1234-1234-123456789abc"

	it("accepts a valid UUID in X-User-Id and exposes it on res.locals", async () => {
		const res = await request(buildApp())
			.get("/protected")
			.set("X-User-Id", validUuid)

		expect(res.status).toBe(200)
		expect(res.body).toEqual({ userId: validUuid })
	})

	it("rejects requests without X-User-Id header", async () => {
		const res = await request(buildApp()).get("/protected")
		expect(res.status).toBe(401)
		expect(res.body).toEqual({ error: "Unauthorized" })
	})

	it("rejects an empty X-User-Id header", async () => {
		const res = await request(buildApp()).get("/protected").set("X-User-Id", "")
		expect(res.status).toBe(401)
	})

	it("rejects a non-UUID X-User-Id header", async () => {
		const res = await request(buildApp())
			.get("/protected")
			.set("X-User-Id", "not-a-uuid")
		expect(res.status).toBe(401)
	})

	it("rejects an X-User-Id that almost-but-not-quite matches UUID format", async () => {
		const res = await request(buildApp())
			.get("/protected")
			.set("X-User-Id", "12345678-1234-1234-1234-12345678") // too short
		expect(res.status).toBe(401)
	})

	it("rejects X-User-Id that contains a comma (duplicate header collapsed by Node)", async () => {
		// supertest sends duplicates as a single comma-joined string, which is
		// what Node's HTTP parser does to duplicate non-cookie headers. API
		// Gateway only ever injects X-User-Id once — a comma signals that an
		// upstream hop duplicated the header or a spoof attempt is in flight.
		const res = await request(buildApp())
			.get("/protected")
			.set("X-User-Id", `${validUuid}, ${validUuid}`)
		expect(res.status).toBe(401)
		expect(res.body).toEqual({ error: "Unauthorized" })
	})

	it("rejects a whitespace-only X-User-Id", async () => {
		const res = await request(buildApp())
			.get("/protected")
			.set("X-User-Id", "   ")
		expect(res.status).toBe(401)
	})
})
