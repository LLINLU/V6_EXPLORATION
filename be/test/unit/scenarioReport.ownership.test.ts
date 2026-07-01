import express from "express"
import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock(
	"../../src/services/scenarioReportService/scenarioReportJobService.js",
	() => ({
		createScenarioReportJob: vi.fn(),
		createScenarioReportJobRequest: vi.fn(),
		getInProgressScenarioReportJob: vi.fn(),
		getLastScenarioReportJob: vi.fn(),
	}),
)
vi.mock(
	"../../src/services/scenarioReportService/scenarioReportResultService.js",
	() => ({
		getScenarioResult: vi.fn(),
	}),
)
vi.mock(
	"../../src/services/scenarioReportService/scenarioReportLimitService.js",
	() => ({
		checkScenarioReportLimit: vi.fn(),
	}),
)
vi.mock("../../src/queue/index.js", () => ({
	enqueueReportJob: vi.fn(),
}))
// IP allowlist enforcement is exercised in its own test file; here we just
// pass through so these tests can focus on ownership scoping.
vi.mock("../../src/middleware/ipRestriction.js", () => ({
	ipRestriction: (
		_req: express.Request,
		_res: express.Response,
		next: express.NextFunction,
	) => next(),
}))

import { scenarioReportRouter } from "../../src/controllers/scenarioReport.js"
import { enqueueReportJob } from "../../src/queue/index.js"
import {
	createScenarioReportJob,
	createScenarioReportJobRequest,
	getInProgressScenarioReportJob,
	getLastScenarioReportJob,
} from "../../src/services/scenarioReportService/scenarioReportJobService.js"
import { checkScenarioReportLimit } from "../../src/services/scenarioReportService/scenarioReportLimitService.js"
import { getScenarioResult } from "../../src/services/scenarioReportService/scenarioReportResultService.js"

const userA = "11111111-1111-1111-1111-111111111111"
const userB = "22222222-2222-2222-2222-222222222222"
const scenarioId = "33333333-3333-3333-3333-333333333333"

function buildApp() {
	const app = express()
	app.use(express.json())
	app.use(scenarioReportRouter)
	return app
}

beforeEach(() => {
	vi.clearAllMocks()
})

afterEach(() => {
	vi.resetAllMocks()
})

describe("GET /scenario-report/:id ownership filter", () => {
	it("passes userId from X-User-Id to getScenarioResult and returns the result when ownership matches", async () => {
		vi.mocked(getScenarioResult).mockResolvedValueOnce({
			id: "result-1",
			jobId: "job-1",
			scenarioId,
			resultJson: { foo: "bar" },
			validatedAt: new Date(),
		})

		const res = await request(buildApp())
			.get(`/scenario-report/${scenarioId}`)
			.set("X-User-Id", userA)

		expect(res.status).toBe(200)
		expect(res.body.status).toBe("done")
		expect(res.body.data).toEqual({ foo: "bar" })
		expect(getScenarioResult).toHaveBeenCalledWith(scenarioId, userA)
	})

	it("returns not_found (no leakage) when result, in-progress, and last job all miss for this user", async () => {
		vi.mocked(getScenarioResult).mockResolvedValueOnce(null)
		vi.mocked(getInProgressScenarioReportJob).mockResolvedValueOnce(null)
		vi.mocked(getLastScenarioReportJob).mockResolvedValueOnce(null)

		const res = await request(buildApp())
			.get(`/scenario-report/${scenarioId}`)
			.set("X-User-Id", userB)

		expect(res.status).toBe(200)
		expect(res.body.status).toBe("not_found")
		expect(getScenarioResult).toHaveBeenCalledWith(scenarioId, userB)
		expect(getInProgressScenarioReportJob).toHaveBeenCalledWith(
			scenarioId,
			userB,
		)
		expect(getLastScenarioReportJob).toHaveBeenCalledWith(scenarioId, userB)
	})

	it("rejects unauthenticated requests with 401 (no service calls)", async () => {
		const res = await request(buildApp()).get(`/scenario-report/${scenarioId}`)
		expect(res.status).toBe(401)
		expect(getScenarioResult).not.toHaveBeenCalled()
		expect(getInProgressScenarioReportJob).not.toHaveBeenCalled()
		expect(getLastScenarioReportJob).not.toHaveBeenCalled()
	})
})

describe("POST /scenario-report ownership", () => {
	const body = {
		theme: "x",
		scenario_title: "t",
		scenario_description: "d",
		scenario_id: scenarioId,
		language: "Japanese",
	}

	it("scopes the in-progress check to the requesting user (different user can start their own job)", async () => {
		vi.mocked(checkScenarioReportLimit).mockResolvedValue({
			allowed: true,
			used: 0,
			limit: 5,
		})
		vi.mocked(getInProgressScenarioReportJob).mockResolvedValue(null)
		vi.mocked(createScenarioReportJob).mockResolvedValue({ id: "job-new" })
		vi.mocked(createScenarioReportJobRequest).mockResolvedValue(undefined)
		vi.mocked(enqueueReportJob).mockResolvedValue(undefined)

		const res = await request(buildApp())
			.post("/scenario-report")
			.set("X-User-Id", userB)
			.send(body)

		expect(res.status).toBe(201)
		expect(getInProgressScenarioReportJob).toHaveBeenCalledWith(
			scenarioId,
			userB,
		)
		expect(createScenarioReportJob).toHaveBeenCalledWith(userB, scenarioId)
	})
})
