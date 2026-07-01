// Tests for the Supabase client Proxy. Covers:
//   - ensureIpAllowed wiring on functions.invoke (fresh) and from(...) chains (cached)
//   - chained builder access patterns (.select/.eq/.in/.single/.maybeSingle)
//     survive the Proxy without double-hooking or dropping calls
//   - storage / realtime accesses fail loudly in non-production builds (A4-1)

// jsdom 環境向けに Response polyfill (ipGuard.nextApiFetch が触る)。
if (typeof globalThis.Response === "undefined") {
	class FakeResponse {
		readonly status: number
		readonly headers: Headers
		private readonly _body: string
		constructor(body: BodyInit | null = null, init: ResponseInit = {}) {
			this._body = typeof body === "string" ? body : ""
			this.status = init.status ?? 200
			this.headers = new Headers(init.headers)
		}
		async json(): Promise<unknown> {
			return JSON.parse(this._body)
		}
		async text(): Promise<string> {
			return this._body
		}
	}
	;(globalThis as unknown as { Response: unknown }).Response = FakeResponse
}

jest.mock("@/lib/ipGuard", () => ({
	ensureIpAllowed: jest.fn().mockResolvedValue(undefined),
}))

import { ensureIpAllowed } from "@/lib/ipGuard"
import { supabase } from "../client"

const mockedEnsure = ensureIpAllowed as jest.Mock

// Mock the global fetch that supabase-js uses internally for PostgREST calls.
function installFetchMock(): jest.Mock {
	const fetchMock = jest.fn().mockResolvedValue({
		ok: true,
		status: 200,
		headers: new Headers({ "content-type": "application/json" }),
		text: () => Promise.resolve("[]"),
		json: () => Promise.resolve([]),
	})
	;(global as unknown as { fetch: jest.Mock }).fetch = fetchMock
	return fetchMock
}

describe("supabase client Proxy (from)", () => {
	beforeEach(() => {
		mockedEnsure.mockReset().mockResolvedValue(undefined)
	})

	it("plain from().select() invokes ensureIpAllowed (cached check)", async () => {
		installFetchMock()
		await supabase.from("teams").select("*")
		expect(mockedEnsure).toHaveBeenCalledTimes(1)
		// cached check: no `fresh` argument
		expect(mockedEnsure).toHaveBeenCalledWith()
	})

	it("chained from().select().eq() still triggers exactly one ensureIpAllowed", async () => {
		installFetchMock()
		await supabase.from("teams").select("*").eq("id", "abc")
		expect(mockedEnsure).toHaveBeenCalledTimes(1)
	})

	it(".maybeSingle() survives the Proxy and still gates on ensureIpAllowed", async () => {
		installFetchMock()
		await supabase.from("teams").select("*").eq("id", "abc").maybeSingle()
		expect(mockedEnsure).toHaveBeenCalledTimes(1)
	})

	it(".single() survives the Proxy and still gates on ensureIpAllowed", async () => {
		installFetchMock()
		await supabase.from("teams").select("*").eq("id", "abc").single()
		expect(mockedEnsure).toHaveBeenCalledTimes(1)
	})

	it(".in() chains and resolves through the Proxy", async () => {
		installFetchMock()
		await supabase.from("teams").select("id").in("id", ["a", "b", "c"])
		expect(mockedEnsure).toHaveBeenCalledTimes(1)
	})

	it("when ensureIpAllowed rejects, from() resolves to { data: null, error }", async () => {
		installFetchMock()
		const err = new Error("IP blocked")
		mockedEnsure.mockReset().mockRejectedValueOnce(err)

		const result = (await supabase.from("teams").select("*")) as {
			data: unknown
			error: unknown
		}

		expect(result.data).toBeNull()
		expect(result.error).toBe(err)
	})

	it("ensureIpAllowed fires BEFORE the HTTP call (gates upstream)", async () => {
		const fetchMock = installFetchMock()
		mockedEnsure.mockReset().mockRejectedValueOnce(new Error("blocked"))

		await supabase.from("teams").select("*")

		// On block we must NOT have hit the network.
		expect(fetchMock).not.toHaveBeenCalled()
	})

	// The Supabase builder contract is "always resolves; errors come through
	// the `error` field of the resolved value" — never via Promise rejection.
	// The Proxy must preserve that contract for callers that pass BOTH
	// handlers to `.then(onResolve, onReject)`: an ipGuard failure must surface
	// through `onResolve` with `{data: null, error}`, and `onReject` must never
	// fire. Otherwise existing `if (error) ...` call sites that also pass an
	// error handler would split-brain on IP-blocked outcomes.
	it("when ensureIpAllowed rejects, .then(onResolve, onReject) routes through onResolve only", async () => {
		installFetchMock()
		const err = new Error("blocked")
		mockedEnsure.mockReset().mockRejectedValueOnce(err)

		const onResolve = jest.fn()
		const onReject = jest.fn()

		const builder = supabase.from("teams").select("*") as unknown as {
			then: (
				onResolve: (v: unknown) => unknown,
				onReject: (e: unknown) => unknown,
			) => Promise<unknown>
		}
		// We don't assert on the value `.then(...)` itself resolves to — the
		// invariant lives in which handler fires and what argument it gets.
		await builder.then(onResolve, onReject)

		expect(onReject).not.toHaveBeenCalled()
		expect(onResolve).toHaveBeenCalledTimes(1)
		expect(onResolve).toHaveBeenCalledWith({ data: null, error: err })
	})
})

describe("supabase client Proxy (functions.invoke)", () => {
	beforeEach(() => {
		mockedEnsure.mockReset().mockResolvedValue(undefined)
	})

	it("functions.invoke invokes ensureIpAllowed({fresh:true})", async () => {
		installFetchMock()
		// supabase-js's invoke implementation tries to hit a URL; the fetch mock
		// resolves it to a benign response. The point of the test is the guard.
		await supabase.functions.invoke("is-app-admin", { body: {} })
		expect(mockedEnsure).toHaveBeenCalledWith({ fresh: true })
	})

	it("when ensureIpAllowed rejects, functions.invoke resolves to { data: null, error }", async () => {
		installFetchMock()
		const err = new Error("blocked")
		mockedEnsure.mockReset().mockRejectedValueOnce(err)

		const result = (await supabase.functions.invoke("anything", {
			body: {},
		})) as { data: unknown; error: unknown }

		expect(result.data).toBeNull()
		expect(result.error).toBe(err)
	})
})

describe("supabase client Proxy (ungated APIs, A4-1)", () => {
	const originalEnv = process.env.NODE_ENV

	afterEach(() => {
		// Restore: jest sets NODE_ENV to "test" by default; just reset to that.
		Object.defineProperty(process.env, "NODE_ENV", {
			value: originalEnv,
			configurable: true,
		})
	})

	it("touching `storage` throws in non-production builds", () => {
		Object.defineProperty(process.env, "NODE_ENV", {
			value: "development",
			configurable: true,
		})
		expect(() => supabase.storage).toThrow(/storage/)
	})

	it("touching `realtime` throws in non-production builds", () => {
		Object.defineProperty(process.env, "NODE_ENV", {
			value: "development",
			configurable: true,
		})
		expect(() => supabase.realtime).toThrow(/realtime/)
	})

	it("touching `storage` only warns in production builds", () => {
		Object.defineProperty(process.env, "NODE_ENV", {
			value: "production",
			configurable: true,
		})
		const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
		try {
			// Should not throw, but should log a warning.
			expect(() => supabase.storage).not.toThrow()
			expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/storage/))
		} finally {
			warnSpy.mockRestore()
		}
	})
})
