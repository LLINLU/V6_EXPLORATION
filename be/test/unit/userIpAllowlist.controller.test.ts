// Controller-level tests for the user IP allowlist endpoints. Mocks the
// service layer (so no DB) and the admins config (so we control who is admin
// without depending on env-loaded UUID lists). Validates auth, authorization,
// validation, error mapping, and the bulk endpoints.

import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Pretend the test caller is "ADMIN_UUID"; everyone else is non-admin.
const ADMIN_UUID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
const NON_ADMIN_UUID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
const TARGET_UUID = "cccccccc-cccc-cccc-cccc-cccccccccccc"

vi.mock("../../src/config/admins.js", () => ({
	isAdmin: (id: string) => id === ADMIN_UUID,
}))

const serviceMock = vi.hoisted(() => ({
	listEntries: vi.fn(),
	createEntry: vi.fn(),
	deleteEntry: vi.fn(),
	getEntryCountsByUser: vi.fn(),
	getEntriesByUsers: vi.fn(),
	bulkCreate: vi.fn(),
	bulkDeleteByCidr: vi.fn(),
}))

class InvalidCidrErrorMock extends Error {
	constructor(public readonly reason: string) {
		super(`Invalid CIDR: ${reason}`)
		this.name = "InvalidCidrError"
	}
}
class DuplicateEntryErrorMock extends Error {
	constructor() {
		super("Duplicate")
		this.name = "DuplicateEntryError"
	}
}

vi.mock("../../src/services/userIpAllowlistService.js", () => ({
	...serviceMock,
	InvalidCidrError: InvalidCidrErrorMock,
	DuplicateEntryError: DuplicateEntryErrorMock,
}))

// requireAuth and ipRestriction expect headers set by API Gateway; stub them
// out so each test can pretend to be any caller / source IP.
vi.mock("../../src/middleware/auth.js", () => ({
	requireAuth: (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		const id = req.headers["x-user-id"]
		if (typeof id !== "string" || !id) {
			res.status(401).json({ error: "Unauthorized" })
			return
		}
		res.locals.userId = id
		next()
	},
}))
vi.mock("../../src/middleware/ipRestriction.js", () => ({
	ipRestriction: (
		_req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		res.locals.sourceIp = "203.0.113.10"
		next()
	},
}))

const { userIpAllowlistRouter } = await import(
	"../../src/controllers/userIpAllowlist.js"
)

function buildApp() {
	const app = express()
	app.use(express.json())
	app.use(userIpAllowlistRouter)
	return app
}

beforeEach(() => {
	Object.values(serviceMock).forEach((m) => m.mockReset())
})

describe("GET /users/:userId/ip-allowlist", () => {
	it("returns 200 for admin caller", async () => {
		serviceMock.listEntries.mockResolvedValue([
			{
				id: "00000000-0000-0000-0000-000000000001",
				cidr: "203.0.113.0/24",
				description: "office",
				createdAt: new Date("2026-01-01"),
				updatedAt: new Date("2026-01-01"),
			},
		])
		const res = await request(buildApp())
			.get(`/users/${TARGET_UUID}/ip-allowlist`)
			.set("X-User-Id", ADMIN_UUID)
		expect(res.status).toBe(200)
		expect(res.body.items).toHaveLength(1)
		expect(res.body.items[0].cidr).toBe("203.0.113.0/24")
	})

	it("returns 403 FORBIDDEN for non-admin caller", async () => {
		const res = await request(buildApp())
			.get(`/users/${TARGET_UUID}/ip-allowlist`)
			.set("X-User-Id", NON_ADMIN_UUID)
		expect(res.status).toBe(403)
		expect(res.body.code).toBe("FORBIDDEN")
		expect(serviceMock.listEntries).not.toHaveBeenCalled()
	})

	it("returns 400 INVALID_USER_ID for non-UUID path", async () => {
		const res = await request(buildApp())
			.get("/users/not-a-uuid/ip-allowlist")
			.set("X-User-Id", ADMIN_UUID)
		expect(res.status).toBe(400)
		expect(res.body.code).toBe("INVALID_USER_ID")
	})

	it("returns 401 when X-User-Id header is missing", async () => {
		const res = await request(buildApp()).get(
			`/users/${TARGET_UUID}/ip-allowlist`,
		)
		expect(res.status).toBe(401)
	})
})

describe("POST /users/:userId/ip-allowlist", () => {
	it("returns 201 with the created entry on success", async () => {
		serviceMock.createEntry.mockResolvedValue({
			id: "00000000-0000-0000-0000-000000000001",
			userId: TARGET_UUID,
			cidr: "203.0.113.10/32",
			description: null,
			createdAt: new Date("2026-01-01"),
			updatedAt: new Date("2026-01-01"),
		})
		const res = await request(buildApp())
			.post(`/users/${TARGET_UUID}/ip-allowlist`)
			.set("X-User-Id", ADMIN_UUID)
			.send({ cidr: "203.0.113.10" })
		expect(res.status).toBe(201)
		expect(res.body.cidr).toBe("203.0.113.10/32")
	})

	it("returns 400 INVALID_CIDR with reason on bad input", async () => {
		serviceMock.createEntry.mockRejectedValue(
			new InvalidCidrErrorMock("not a valid IPv4 or IPv6 address"),
		)
		const res = await request(buildApp())
			.post(`/users/${TARGET_UUID}/ip-allowlist`)
			.set("X-User-Id", ADMIN_UUID)
			.send({ cidr: "abc" })
		expect(res.status).toBe(400)
		expect(res.body).toEqual({
			code: "INVALID_CIDR",
			reason: "not a valid IPv4 or IPv6 address",
		})
	})

	it("returns 409 CONFLICT on duplicate", async () => {
		serviceMock.createEntry.mockRejectedValue(new DuplicateEntryErrorMock())
		const res = await request(buildApp())
			.post(`/users/${TARGET_UUID}/ip-allowlist`)
			.set("X-User-Id", ADMIN_UUID)
			.send({ cidr: "203.0.113.10" })
		expect(res.status).toBe(409)
		expect(res.body.code).toBe("CONFLICT")
	})

	it("returns 400 INVALID_BODY on missing cidr", async () => {
		const res = await request(buildApp())
			.post(`/users/${TARGET_UUID}/ip-allowlist`)
			.set("X-User-Id", ADMIN_UUID)
			.send({})
		expect(res.status).toBe(400)
		expect(res.body.code).toBe("INVALID_BODY")
	})

	it("returns 403 for non-admin caller", async () => {
		const res = await request(buildApp())
			.post(`/users/${TARGET_UUID}/ip-allowlist`)
			.set("X-User-Id", NON_ADMIN_UUID)
			.send({ cidr: "203.0.113.10" })
		expect(res.status).toBe(403)
		expect(serviceMock.createEntry).not.toHaveBeenCalled()
	})
})

describe("DELETE /users/:userId/ip-allowlist/:id", () => {
	const ENTRY_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd"

	it("returns 204 on success", async () => {
		serviceMock.deleteEntry.mockResolvedValue({
			id: ENTRY_ID,
			userId: TARGET_UUID,
			cidr: "203.0.113.10/32",
			description: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		const res = await request(buildApp())
			.delete(`/users/${TARGET_UUID}/ip-allowlist/${ENTRY_ID}`)
			.set("X-User-Id", ADMIN_UUID)
		expect(res.status).toBe(204)
	})

	it("returns 404 when id does not match user (cross-user is not leaked)", async () => {
		serviceMock.deleteEntry.mockResolvedValue(null)
		const res = await request(buildApp())
			.delete(`/users/${TARGET_UUID}/ip-allowlist/${ENTRY_ID}`)
			.set("X-User-Id", ADMIN_UUID)
		expect(res.status).toBe(404)
		expect(res.body.code).toBe("NOT_FOUND")
	})

	it("returns 400 INVALID_ID when entry id is not a UUID", async () => {
		const res = await request(buildApp())
			.delete(`/users/${TARGET_UUID}/ip-allowlist/not-a-uuid`)
			.set("X-User-Id", ADMIN_UUID)
		expect(res.status).toBe(400)
		expect(res.body.code).toBe("INVALID_ID")
	})

	it("returns 403 for non-admin caller", async () => {
		const res = await request(buildApp())
			.delete(`/users/${TARGET_UUID}/ip-allowlist/${ENTRY_ID}`)
			.set("X-User-Id", NON_ADMIN_UUID)
		expect(res.status).toBe(403)
	})
})

describe("POST /ip-allowlist/bulk", () => {
	it("returns per-user outcomes from the service", async () => {
		serviceMock.bulkCreate.mockResolvedValue([
			{ userId: TARGET_UUID, outcome: "added" },
			{
				userId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
				outcome: "skipped",
			},
		])
		const res = await request(buildApp())
			.post("/ip-allowlist/bulk")
			.set("X-User-Id", ADMIN_UUID)
			.send({
				userIds: [TARGET_UUID, "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"],
				cidr: "203.0.113.0/24",
				description: "office",
			})
		expect(res.status).toBe(200)
		expect(res.body.results).toHaveLength(2)
		expect(res.body.results[0]).toEqual({
			userId: TARGET_UUID,
			outcome: "added",
		})
		expect(serviceMock.bulkCreate).toHaveBeenCalledWith({
			userIds: [TARGET_UUID, "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"],
			cidr: "203.0.113.0/24",
			description: "office",
		})
	})

	it("returns 400 INVALID_CIDR when the service throws InvalidCidrError", async () => {
		serviceMock.bulkCreate.mockRejectedValue(
			new InvalidCidrErrorMock("prefix length out of range (0–32 for IPv4)"),
		)
		const res = await request(buildApp())
			.post("/ip-allowlist/bulk")
			.set("X-User-Id", ADMIN_UUID)
			.send({ userIds: [TARGET_UUID], cidr: "10.0.0.0/33" })
		expect(res.status).toBe(400)
		expect(res.body.code).toBe("INVALID_CIDR")
		expect(res.body.reason).toMatch(/IPv4/)
	})

	it("returns 403 for non-admin caller", async () => {
		const res = await request(buildApp())
			.post("/ip-allowlist/bulk")
			.set("X-User-Id", NON_ADMIN_UUID)
			.send({ userIds: [TARGET_UUID], cidr: "203.0.113.10" })
		expect(res.status).toBe(403)
		expect(serviceMock.bulkCreate).not.toHaveBeenCalled()
	})

	it("returns 400 INVALID_BODY when userIds is empty", async () => {
		const res = await request(buildApp())
			.post("/ip-allowlist/bulk")
			.set("X-User-Id", ADMIN_UUID)
			.send({ userIds: [], cidr: "203.0.113.10" })
		expect(res.status).toBe(400)
		expect(res.body.code).toBe("INVALID_BODY")
	})
})

describe("POST /ip-allowlist/bulk-delete", () => {
	it("returns per-user delete outcomes", async () => {
		serviceMock.bulkDeleteByCidr.mockResolvedValue([
			{ userId: TARGET_UUID, outcome: "deleted" },
			{
				userId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
				outcome: "not_found",
			},
		])
		const res = await request(buildApp())
			.post("/ip-allowlist/bulk-delete")
			.set("X-User-Id", ADMIN_UUID)
			.send({
				userIds: [TARGET_UUID, "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"],
				cidr: "203.0.113.0/24",
			})
		expect(res.status).toBe(200)
		expect(res.body.results).toHaveLength(2)
		expect(res.body.results[0].outcome).toBe("deleted")
		expect(res.body.results[1].outcome).toBe("not_found")
	})

	it("returns 403 for non-admin caller", async () => {
		const res = await request(buildApp())
			.post("/ip-allowlist/bulk-delete")
			.set("X-User-Id", NON_ADMIN_UUID)
			.send({ userIds: [TARGET_UUID], cidr: "203.0.113.0/24" })
		expect(res.status).toBe(403)
	})
})

describe("POST /ip-allowlist/by-users", () => {
	it("returns entries keyed by user (incl. empty array for users with no rows)", async () => {
		const u1 = TARGET_UUID
		const u2 = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
		serviceMock.getEntriesByUsers.mockResolvedValue([
			{
				id: "00000000-0000-0000-0000-000000000001",
				userId: u1,
				cidr: "203.0.113.0/24",
				description: "office",
				createdAt: new Date("2026-01-01"),
				updatedAt: new Date("2026-01-01"),
			},
		])
		const res = await request(buildApp())
			.post("/ip-allowlist/by-users")
			.set("X-User-Id", ADMIN_UUID)
			.send({ userIds: [u1, u2] })
		expect(res.status).toBe(200)
		expect(res.body.entriesByUser[u1]).toHaveLength(1)
		expect(res.body.entriesByUser[u1][0].cidr).toBe("203.0.113.0/24")
		// User with no rows is still present, as an empty array, so the FE
		// doesn't need to disambiguate "missing key" vs "zero entries".
		expect(res.body.entriesByUser[u2]).toEqual([])
	})

	it("returns 403 for non-admin caller", async () => {
		const res = await request(buildApp())
			.post("/ip-allowlist/by-users")
			.set("X-User-Id", NON_ADMIN_UUID)
			.send({ userIds: [TARGET_UUID] })
		expect(res.status).toBe(403)
		expect(serviceMock.getEntriesByUsers).not.toHaveBeenCalled()
	})

	it("returns 400 INVALID_BODY for malformed userIds (loose hex-only string)", async () => {
		// Previously the loose regex accepted "------..." — UUID_RE now refuses.
		const res = await request(buildApp())
			.post("/ip-allowlist/by-users")
			.set("X-User-Id", ADMIN_UUID)
			.send({ userIds: ["------------------------------------"] })
		expect(res.status).toBe(400)
		expect(res.body.code).toBe("INVALID_BODY")
	})

	it("returns 400 INVALID_BODY when userIds contains duplicates", async () => {
		// onConflictDoNothing protects DB integrity, but duplicates would double
		// audit lines / outcome rows. The schema rejects them up front.
		const res = await request(buildApp())
			.post("/ip-allowlist/by-users")
			.set("X-User-Id", ADMIN_UUID)
			.send({ userIds: [TARGET_UUID, TARGET_UUID] })
		expect(res.status).toBe(400)
		expect(res.body.code).toBe("INVALID_BODY")
		expect(serviceMock.getEntriesByUsers).not.toHaveBeenCalled()
	})

	it("returns 400 INVALID_BODY when userIds exceeds the 1000-cap", async () => {
		const tooMany = Array.from(
			{ length: 1001 },
			(_, i) =>
				`00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
		)
		const res = await request(buildApp())
			.post("/ip-allowlist/by-users")
			.set("X-User-Id", ADMIN_UUID)
			.send({ userIds: tooMany })
		expect(res.status).toBe(400)
		expect(res.body.code).toBe("INVALID_BODY")
		expect(serviceMock.getEntriesByUsers).not.toHaveBeenCalled()
	})
})

describe("GET /ip-allowlist/summary", () => {
	it("returns admin-aggregated counts", async () => {
		serviceMock.getEntryCountsByUser.mockResolvedValue([
			{ userId: TARGET_UUID, count: 3 },
			{ userId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", count: 1 },
		])
		const res = await request(buildApp())
			.get("/ip-allowlist/summary")
			.set("X-User-Id", ADMIN_UUID)
		expect(res.status).toBe(200)
		expect(res.body.counts).toEqual({
			[TARGET_UUID]: 3,
			"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee": 1,
		})
	})

	it("returns 403 for non-admin caller", async () => {
		const res = await request(buildApp())
			.get("/ip-allowlist/summary")
			.set("X-User-Id", NON_ADMIN_UUID)
		expect(res.status).toBe(403)
		expect(serviceMock.getEntryCountsByUser).not.toHaveBeenCalled()
	})
})
