import { randomUUID } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import express from "express"
import request from "supertest"
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest"

const queueMockState = vi.hoisted(() => ({
	queuedJobIds: [] as string[],
}))

vi.mock("../../src/queue/index.js", () => {
	const enqueue = vi.fn(async (payload: unknown) => {
		if (typeof payload === "string") {
			queueMockState.queuedJobIds.push(payload)
			return
		}

		if (
			payload &&
			typeof payload === "object" &&
			"jobId" in payload &&
			typeof payload.jobId === "string"
		) {
			queueMockState.queuedJobIds.push(payload.jobId)
			return
		}

		if (
			payload &&
			typeof payload === "object" &&
			"job_id" in payload &&
			typeof payload.job_id === "string"
		) {
			queueMockState.queuedJobIds.push(payload.job_id)
		}
	})

	return {
		startWorker: vi.fn(async () => undefined),
		stopWorker: vi.fn(async () => undefined),

		enqueueReportJob: enqueue,
		enqueueScenarioReportJob: enqueue,
		enqueueJob: enqueue,
		enqueue: enqueue,

		__queueMockState: queueMockState,
	}
})

const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === "true"
const hasDb = !!process.env.DATABASE_URL
const shouldRunIntegrationTests = runIntegrationTests && hasDb

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsFolder = path.resolve(__dirname, "../../src/db/migrations")

const GENERATE_PATH = "/scenario-report"
const STATUS_PATH = (scenarioId: string) => `/scenario-report/${scenarioId}`

type JobStatus = "queued" | "running" | "done" | "failed" | "not_found"

interface QueuedResponse {
	status: "queued"
	job_id: string
}

interface JobResponse {
	id?: string | null
	job_id?: string | null
	status?: JobStatus
	progress?: number | string | null
	error?: string | null
	scenario_id?: string
	data?: unknown
	result?: unknown
}

function authHeader(userId = randomUUID()) {
	return { "x-user-id": userId }
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function responseDebug(res: request.Response) {
	return res.text || JSON.stringify(res.body)
}

function redactDatabaseUrl(databaseUrl: string | undefined) {
	if (!databaseUrl) return undefined

	try {
		const url = new URL(databaseUrl)
		if (url.password) url.password = "****"
		return url.toString()
	} catch {
		return "<invalid DATABASE_URL>"
	}
}

async function assertDatabaseConnection(
	pool: typeof import("../../src/db/pool.js")["pool"],
) {
	try {
		await pool.query("SELECT current_user, current_database()")
	} catch (err) {
		throw new Error(
			[
				"Database connection failed before migrations.",
				"Check DATABASE_URL and make sure the Postgres user/password/database match the running service.",
				`DATABASE_URL=${redactDatabaseUrl(process.env.DATABASE_URL)}`,
				`Cause: ${(err as Error).message}`,
			].join(" "),
		)
	}
}

async function completeJobInDb(args: {
	pool: typeof import("../../src/db/pool.js")["pool"]
	jobId: string
	scenarioId: string
	scenarioTitle: string
}) {
	const resultJson = {
		_placeholder: true,
		theme: "AI",
		scenarioTitle: args.scenarioTitle,
	}

	await args.pool.query(
		`
			UPDATE jobs
			SET status = 'done',
			    progress = NULL,
			    updated_at = now()
			WHERE id = $1
		`,
		[args.jobId],
	)

	await args.pool.query(
		`
			INSERT INTO results (job_id, scenario_id, result_json)
			VALUES ($1, $2, $3::jsonb)
		`,
		[args.jobId, args.scenarioId, JSON.stringify(resultJson)],
	)

	await args.pool.query(
		`
			INSERT INTO usage (
				job_id,
				step,
				prompt_tokens,
				completion_tokens,
				cost_usd
			)
			VALUES ($1, 'generate', 10, 20, 0.0001)
		`,
		[args.jobId],
	)
}

async function pollUntilTerminal(args: {
	app: express.Express
	scenarioId: string
	headers: Record<string, string>
	timeoutMs?: number
	intervalMs?: number
}) {
	const {
		app,
		scenarioId,
		headers,
		timeoutMs = 30_000,
		intervalMs = 250,
	} = args

	const deadline = Date.now() + timeoutMs
	let lastBody: JobResponse | undefined

	while (Date.now() < deadline) {
		const res = await request(app).get(STATUS_PATH(scenarioId)).set(headers)

		expect(
			res.status,
			`GET ${STATUS_PATH(scenarioId)} failed: ${responseDebug(res)}`,
		).toBe(200)

		lastBody = res.body as JobResponse

		if (
			lastBody.status === "done" ||
			lastBody.status === "failed" ||
			lastBody.status === "not_found"
		) {
			return lastBody
		}

		await sleep(intervalMs)
	}

	throw new Error(
		`Timed out waiting for scenario ${scenarioId}. Last response: ${JSON.stringify(
			lastBody,
		)}`,
	)
}

/**
 * End-to-end route + DB pipeline integration test.
 *
 * Required env:
 *   RUN_INTEGRATION_TESTS=true
 *   DATABASE_URL=postgresql://...
 *
 * SQS is mocked here. This keeps the test deterministic and avoids AWS /
 * LocalStack failures when testing the HTTP route and persistence behavior.
 */
describe.skipIf(!shouldRunIntegrationTests)(
	"Scenario report pipeline (integration)",
	() => {
		let app: express.Express
		let pool: typeof import("../../src/db/pool.js")["pool"]

		beforeAll(async () => {
			const poolMod = await import("../../src/db/pool.js")
			pool = poolMod.pool

			await assertDatabaseConnection(pool)

			const db = drizzle(pool)
			await migrate(db, { migrationsFolder })

			const scenarioMod = await import(
				"../../src/controllers/scenarioReport.js"
			)

			app = express()
			app.use(express.json())
			app.use(scenarioMod.scenarioReportRouter)
		}, 30_000)

		afterAll(async () => {
			await pool?.end()
		})

		beforeEach(async () => {
			queueMockState.queuedJobIds.length = 0

			await pool.query(
				"TRUNCATE TABLE usage, results, requests, jobs RESTART IDENTITY CASCADE",
			)
		})

		it("queues, runs, and persists a scenario report end-to-end", async () => {
			const headers = authHeader()

			const body = {
				theme: "AI",
				scenario_title: "Integration test scenario",
				scenario_description: "Runs through the full pipeline",
				scenario_id: randomUUID(),
				language: "Japanese",
			}

			const postRes = await request(app)
				.post(GENERATE_PATH)
				.set(headers)
				.send(body)

			expect(
				postRes.status,
				`POST ${GENERATE_PATH} failed: ${responseDebug(postRes)}`,
			).toBe(201)

			expect(postRes.body.status).toBe("queued")
			expect(postRes.body.job_id).toEqual(expect.any(String))

			const queued = postRes.body as QueuedResponse
			const jobId = queued.job_id

			expect(queueMockState.queuedJobIds).toContain(jobId)

			const jobRow = await pool.query(
				"SELECT id, status, scenario_id FROM jobs WHERE id = $1",
				[jobId],
			)

			expect(jobRow.rows).toHaveLength(1)
			expect(jobRow.rows[0].status).toBe("queued")
			expect(jobRow.rows[0].scenario_id).toBe(body.scenario_id)

			await completeJobInDb({
				pool,
				jobId,
				scenarioId: body.scenario_id,
				scenarioTitle: body.scenario_title,
			})

			const terminal = await pollUntilTerminal({
				app,
				scenarioId: body.scenario_id,
				headers,
				timeoutMs: 30_000,
			})

			expect(
				terminal.status,
				`Scenario ${body.scenario_id} failed: ${JSON.stringify(terminal)}`,
			).toBe("done")

			expect(terminal.job_id ?? terminal.id).toBe(jobId)
			expect(terminal.scenario_id).toBe(body.scenario_id)

			if ("data" in terminal) {
				expect(terminal.data).toEqual(expect.any(Object))
			}

			if ("result" in terminal) {
				expect(terminal.result).toEqual(expect.any(Object))
			}

			const usage = await pool.query(
				"SELECT step, prompt_tokens, completion_tokens FROM usage WHERE job_id = $1 ORDER BY id",
				[jobId],
			)

			expect(usage.rows).toHaveLength(1)
			expect(usage.rows[0].step).toBe("generate")
			expect(Number(usage.rows[0].prompt_tokens)).toBeGreaterThanOrEqual(0)
			expect(Number(usage.rows[0].completion_tokens)).toBeGreaterThanOrEqual(0)
		}, 45_000)

		it("returns 409 when a second submit lands while the first is in-flight", async () => {
			const headers = authHeader()
			const scenarioId = randomUUID()

			const body = {
				theme: "AI",
				scenario_title: "Dedup scenario",
				scenario_description: "Tests duplicate-submit guard",
				scenario_id: scenarioId,
				language: "Japanese",
			}

			const first = await request(app)
				.post(GENERATE_PATH)
				.set(headers)
				.send(body)

			expect(
				first.status,
				`First POST ${GENERATE_PATH} failed: ${responseDebug(first)}`,
			).toBe(201)

			expect(first.body.job_id).toEqual(expect.any(String))

			const second = await request(app)
				.post(GENERATE_PATH)
				.set(headers)
				.send(body)

			expect(
				second.status,
				`Second POST ${GENERATE_PATH} returned ${second.status}: ${responseDebug(
					second,
				)}`,
			).toBe(409)

			expect(second.body.job_id).toBe(first.body.job_id)

			await completeJobInDb({
				pool,
				jobId: first.body.job_id,
				scenarioId,
				scenarioTitle: body.scenario_title,
			})

			const terminal = await pollUntilTerminal({
				app,
				scenarioId,
				headers,
				timeoutMs: 30_000,
			})

			expect(terminal.status).toBe("done")

			const third = await request(app)
				.post(GENERATE_PATH)
				.set(headers)
				.send(body)

			expect(
				third.status,
				`Third POST ${GENERATE_PATH} failed: ${responseDebug(third)}`,
			).toBe(201)
		}, 45_000)
	},
)
