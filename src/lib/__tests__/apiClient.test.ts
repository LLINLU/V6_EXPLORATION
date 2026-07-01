// NEXT_PUBLIC_API_BASE_URL is set in jest.setup.ts (which runs via
// `setupFilesAfterEnv` per jest.config.ts) before any module under test is
// loaded. Setting it here would be too late: ESM/Jest hoists `import` above
// any top-level statements, so apiClient.ts would already have evaluated its
// module-level env check.

jest.mock("@/integrations/supabase/client", () => ({
	supabase: {
		auth: {
			getSession: jest.fn(),
		},
	},
}))

import { supabase } from "@/integrations/supabase/client"
import { ApiError, apiClient, apiFetch } from "@/lib/apiClient"

const mockedGetSession = supabase.auth.getSession as jest.Mock

function mockFetch(response: {
	ok: boolean
	status: number
	body?: unknown
}): jest.Mock {
	const text = response.body !== undefined ? JSON.stringify(response.body) : ""
	const fetchMock = jest.fn().mockResolvedValue({
		ok: response.ok,
		status: response.status,
		text: () => Promise.resolve(text),
	})
	;(global as unknown as { fetch: jest.Mock }).fetch = fetchMock
	return fetchMock
}

describe("apiClient", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		delete process.env.NEXT_PUBLIC_SEND_USER_ID_HEADER
	})

	it("attaches Authorization: Bearer <token> and does NOT send X-User-Id by default", async () => {
		mockedGetSession.mockResolvedValue({
			data: {
				session: {
					access_token: "token-abc",
					user: { id: "11111111-2222-3333-4444-555555555555" },
				},
			},
		})
		const fetchMock = mockFetch({ ok: true, status: 200, body: { ok: true } })

		await apiClient.get("/scenario-report/123")

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const [url, init] = fetchMock.mock.calls[0]
		expect(url).toBe("https://test.example.com/scenario-report/123")
		const headers = init.headers as Headers
		expect(headers.get("Authorization")).toBe("Bearer token-abc")
		expect(headers.get("X-User-Id")).toBeNull()
	})

	it("attaches X-User-Id when NEXT_PUBLIC_SEND_USER_ID_HEADER=true (direct FE → BE for local dev)", async () => {
		process.env.NEXT_PUBLIC_SEND_USER_ID_HEADER = "true"
		mockedGetSession.mockResolvedValue({
			data: {
				session: {
					access_token: "token-abc",
					user: { id: "11111111-2222-3333-4444-555555555555" },
				},
			},
		})
		const fetchMock = mockFetch({ ok: true, status: 200, body: { ok: true } })

		await apiClient.get("/scenario-report/123")

		const [, init] = fetchMock.mock.calls[0]
		const headers = init.headers as Headers
		expect(headers.get("X-User-Id")).toBe(
			"11111111-2222-3333-4444-555555555555",
		)
	})

	it("throws ApiError(401) when there is no session", async () => {
		mockedGetSession.mockResolvedValue({ data: { session: null } })
		mockFetch({ ok: true, status: 200 })

		await expect(apiClient.get("/scenario-report/x")).rejects.toThrow(ApiError)
		await expect(apiClient.get("/scenario-report/x")).rejects.toMatchObject({
			status: 401,
		})
	})

	it("does NOT attach Authorization when skipAuth is true", async () => {
		const fetchMock = mockFetch({ ok: true, status: 200, body: { ok: true } })

		// Arbitrary path — skipAuth is for non-API-Gateway probes only.
		await apiClient.get("/local-probe", { skipAuth: true })

		expect(mockedGetSession).not.toHaveBeenCalled()
		const [, init] = fetchMock.mock.calls[0]
		const headers = init.headers as Headers
		expect(headers.get("Authorization")).toBeNull()
	})

	it("throws ApiError with the response status on non-2xx responses", async () => {
		mockedGetSession.mockResolvedValue({
			data: {
				session: {
					access_token: "t",
					user: { id: "11111111-2222-3333-4444-555555555555" },
				},
			},
		})
		mockFetch({ ok: false, status: 500, body: { error: "boom" } })

		await expect(apiFetch("/scenario-report/x")).rejects.toMatchObject({
			status: 500,
		})
	})

	it("attaches X-Source-IP when NEXT_PUBLIC_DEV_SOURCE_IP is set in non-production (local dev affordance)", async () => {
		process.env.NEXT_PUBLIC_DEV_SOURCE_IP = "203.0.113.10"
		mockedGetSession.mockResolvedValue({
			data: {
				session: {
					access_token: "t",
					user: { id: "11111111-2222-3333-4444-555555555555" },
				},
			},
		})
		const fetchMock = mockFetch({ ok: true, status: 200, body: { ok: true } })
		try {
			await apiClient.get("/me")
			const [, init] = fetchMock.mock.calls[0]
			const headers = init.headers as Headers
			expect(headers.get("X-Source-IP")).toBe("203.0.113.10")
		} finally {
			delete process.env.NEXT_PUBLIC_DEV_SOURCE_IP
		}
	})

	it("does NOT attach X-Source-IP when NODE_ENV=production (gated to dev to avoid shipping the override)", async () => {
		const originalNodeEnv = process.env.NODE_ENV
		Object.defineProperty(process.env, "NODE_ENV", {
			value: "production",
			configurable: true,
		})
		process.env.NEXT_PUBLIC_DEV_SOURCE_IP = "203.0.113.10"
		mockedGetSession.mockResolvedValue({
			data: {
				session: {
					access_token: "t",
					user: { id: "11111111-2222-3333-4444-555555555555" },
				},
			},
		})
		const fetchMock = mockFetch({ ok: true, status: 200, body: { ok: true } })
		try {
			await apiClient.get("/me")
			const [, init] = fetchMock.mock.calls[0]
			const headers = init.headers as Headers
			expect(headers.get("X-Source-IP")).toBeNull()
		} finally {
			delete process.env.NEXT_PUBLIC_DEV_SOURCE_IP
			Object.defineProperty(process.env, "NODE_ENV", {
				value: originalNodeEnv,
				configurable: true,
			})
		}
	})

	it("sends JSON body and Content-Type for POST", async () => {
		mockedGetSession.mockResolvedValue({
			data: {
				session: {
					access_token: "t",
					user: { id: "11111111-2222-3333-4444-555555555555" },
				},
			},
		})
		const fetchMock = mockFetch({ ok: true, status: 201, body: { id: "x" } })

		await apiClient.post("/scenario-report", {
			theme: "x",
			scenario_id: "abc",
		})

		const [, init] = fetchMock.mock.calls[0]
		expect(init.method).toBe("POST")
		expect(init.body).toBe(JSON.stringify({ theme: "x", scenario_id: "abc" }))
		const headers = init.headers as Headers
		expect(headers.get("Content-Type")).toBe("application/json")
	})
})
