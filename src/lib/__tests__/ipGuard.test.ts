// Tests for the IP allowlist guard. Each test creates its own guard instance
// via `createIpGuard()` so `lastCheck` / `inflight` / `backoff` state does
// not leak across cases.

// jsdom (jest's default test environment for this project) does not expose
// the Fetch API `Response` global, but `ipGuard.nextApiFetch` constructs one
// to mimic a blocked HTTP response. Provide a minimal stand-in matching the
// shape ipGuard relies on (status, headers, json()).
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

jest.mock("@/integrations/supabase/client", () => ({
	supabase: {
		auth: { getSession: jest.fn() },
	},
}))

jest.mock("../apiClient", () => {
	const actual = jest.requireActual("../apiClient")
	return {
		...actual,
		apiClient: {
			get: jest.fn(),
		},
	}
})

import { ApiError, apiClient } from "../apiClient"
import { createIpGuard } from "../ipGuard"

const mockedGet = apiClient.get as jest.Mock

// Helper: build an ApiError with a given HTTP status. The constructor signature
// is `new ApiError(status, message, body)` per src/lib/apiClient.ts.
function apiErr(status: number, body: unknown = null): ApiError {
	return new ApiError(status, `HTTP ${status}`, body)
}

describe("ipGuard.createIpGuard().ensure", () => {
	beforeEach(() => {
		jest.useFakeTimers()
		jest.setSystemTime(new Date("2026-05-21T00:00:00Z"))
		mockedGet.mockReset()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it("(a) 200 で TTL 内はキャッシュされ、/me は 1 回しか叩かれない", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet.mockResolvedValue({ ok: true })

		await guard.ensure()
		await guard.ensure()
		await guard.ensure()

		expect(mockedGet).toHaveBeenCalledTimes(1)
		expect(mockedGet).toHaveBeenCalledWith("/me")
	})

	it("(a) TTL 経過後の cached 呼出は再フェッチする", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet.mockResolvedValue({ ok: true })

		await guard.ensure()
		expect(mockedGet).toHaveBeenCalledTimes(1)

		jest.advanceTimersByTime(5_001)
		await guard.ensure()

		expect(mockedGet).toHaveBeenCalledTimes(2)
	})

	it("(b) fresh はキャッシュを無視して常に /me を叩く", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet.mockResolvedValue({ ok: true })

		await guard.ensure() // cached, fires
		await guard.ensure({ fresh: true }) // ignores TTL, fires
		await guard.ensure({ fresh: true }) // ignores TTL, fires

		expect(mockedGet).toHaveBeenCalledTimes(3)
	})

	it("(c) 5xx は fail-open: 例外を投げず lastCheck も更新しない", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet
			.mockRejectedValueOnce(apiErr(503, { error: "down" }))
			.mockResolvedValueOnce({ ok: true })

		// fail-open: resolves quietly
		await expect(guard.ensure()).resolves.toBeUndefined()

		// 1 回目は backoff (1sec) に入るので、advance 1.1sec して再試行可能に
		jest.advanceTimersByTime(1_100)
		await guard.ensure()

		// 1 回目が 5xx で lastCheck 未更新だったので、2 回目は実際に /me を叩く
		expect(mockedGet).toHaveBeenCalledTimes(2)
	})

	it("(c) network error も fail-open でバックオフが効く", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet
			.mockRejectedValueOnce(new TypeError("network"))
			.mockResolvedValueOnce({ ok: true })

		await expect(guard.ensure()).resolves.toBeUndefined()

		// バックオフ内 (= 1sec 未満) は /me を叩かない
		jest.advanceTimersByTime(500)
		await guard.ensure()
		expect(mockedGet).toHaveBeenCalledTimes(1)

		// バックオフ満了後は再試行する
		jest.advanceTimersByTime(700)
		await guard.ensure()
		expect(mockedGet).toHaveBeenCalledTimes(2)
	})

	it("(d) 403 は fail-closed: ApiError を投げる", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet.mockRejectedValue(apiErr(403, { code: "IP_RESTRICTED" }))

		await expect(guard.ensure()).rejects.toBeInstanceOf(ApiError)
		await expect(guard.ensure()).rejects.toMatchObject({ status: 403 })
	})

	it("(d) 401 / 4xx も fail-closed: ApiError を投げる", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet.mockRejectedValue(apiErr(401, { error: "unauthorized" }))

		await expect(guard.ensure()).rejects.toBeInstanceOf(ApiError)
	})

	it("(e/B2) cached inflight 中に fresh が来ても古い結果に相乗りしない", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })

		// 1 回目の /me は遅延 (= 古い状態の応答)
		// Initialize with a no-op so TS's control-flow analysis doesn't keep
		// narrowing this to `null` after the assignment inside the closure.
		let resolveCached: (v: unknown) => void = () => {}
		mockedGet.mockReturnValueOnce(
			new Promise<unknown>((res) => {
				resolveCached = res
			}),
		)
		// 2 回目の /me は fresh 用に別途応答
		mockedGet.mockResolvedValueOnce({ ok: "fresh" })

		// 1 つ目: cached 呼出 (まだ resolve されない)
		const cachedP = guard.ensure()
		// 2 つ目: fresh 呼出 — cached の inflight に相乗りしないはず
		const freshP = guard.ensure({ fresh: true })

		// この時点で 2 件の /me が独立して in-flight
		expect(mockedGet).toHaveBeenCalledTimes(2)

		resolveCached({ ok: "cached" })
		await cachedP
		await freshP
	})

	it("(e) cached 呼出が並行しても inflightCached が共有されて /me は 1 回", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		// Initialize with a no-op so TS's control-flow analysis doesn't keep
		// narrowing this to `null` after the assignment inside the closure.
		let resolveCached: (v: unknown) => void = () => {}
		mockedGet.mockReturnValueOnce(
			new Promise<unknown>((res) => {
				resolveCached = res
			}),
		)

		const p1 = guard.ensure()
		const p2 = guard.ensure()
		const p3 = guard.ensure()

		expect(mockedGet).toHaveBeenCalledTimes(1)
		resolveCached({ ok: true })
		await Promise.all([p1, p2, p3])
	})

	it("(e) fresh 呼出が並行しても inflightFresh が共有されて /me は 1 回", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		let resolveFresh: (v: unknown) => void = () => {}
		mockedGet.mockReturnValueOnce(
			new Promise<unknown>((res) => {
				resolveFresh = res
			}),
		)

		const p1 = guard.ensure({ fresh: true })
		const p2 = guard.ensure({ fresh: true })

		expect(mockedGet).toHaveBeenCalledTimes(1)
		resolveFresh({ ok: true })
		await Promise.all([p1, p2])
	})

	it("(B3) 5xx 連続でバックオフ delay が伸びる (1s → 2s → 5s)", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet.mockRejectedValue(apiErr(503))

		// 1 回目失敗 → 1sec バックオフ
		await guard.ensure()
		expect(mockedGet).toHaveBeenCalledTimes(1)

		// 500ms 後はバックオフ中なので /me を叩かない
		jest.advanceTimersByTime(500)
		await guard.ensure()
		expect(mockedGet).toHaveBeenCalledTimes(1)

		// 1.1sec 後はバックオフ満了 → 2 回目 /me (失敗 → 2sec バックオフ)
		jest.advanceTimersByTime(600)
		await guard.ensure()
		expect(mockedGet).toHaveBeenCalledTimes(2)

		// 2 回目失敗後の 1.5sec はまだバックオフ中
		jest.advanceTimersByTime(1_500)
		await guard.ensure()
		expect(mockedGet).toHaveBeenCalledTimes(2)

		// 合計 2.1sec 経過でバックオフ満了 → 3 回目 /me
		jest.advanceTimersByTime(600)
		await guard.ensure()
		expect(mockedGet).toHaveBeenCalledTimes(3)
	})

	it("(B3) 200 復帰でバックオフがリセットされる", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet
			.mockRejectedValueOnce(apiErr(503))
			.mockResolvedValueOnce({ ok: true })

		await guard.ensure() // 失敗 → 1sec バックオフ
		jest.advanceTimersByTime(1_100)
		await guard.ensure() // 成功 → backoffStep リセット、TTL 適用

		// TTL 内なので追加の /me は飛ばない
		await guard.ensure()
		expect(mockedGet).toHaveBeenCalledTimes(2)

		// TTL 経過後、再度失敗させると backoffStep が 0 から再スタート
		mockedGet.mockRejectedValueOnce(apiErr(503))
		jest.advanceTimersByTime(5_100)
		await guard.ensure() // 失敗 → 再び 1sec バックオフ

		jest.advanceTimersByTime(500)
		await guard.ensure() // バックオフ中
		expect(mockedGet).toHaveBeenCalledTimes(3)

		mockedGet.mockResolvedValueOnce({ ok: true })
		jest.advanceTimersByTime(600)
		await guard.ensure() // バックオフ満了 → 復帰
		expect(mockedGet).toHaveBeenCalledTimes(4)
	})

	it("(B1) インスタンス間で状態が独立している", async () => {
		const g1 = createIpGuard({ ttlMs: 5_000 })
		const g2 = createIpGuard({ ttlMs: 5_000 })
		mockedGet.mockResolvedValue({ ok: true })

		await g1.ensure()
		await g1.ensure() // cached
		await g2.ensure() // g2 はキャッシュゼロから始まる

		expect(mockedGet).toHaveBeenCalledTimes(2)
	})

	it("4xx (fail-closed) でバックオフは起動しない", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet
			.mockRejectedValueOnce(apiErr(403, { code: "IP_RESTRICTED" }))
			.mockRejectedValueOnce(apiErr(403, { code: "IP_RESTRICTED" }))

		await expect(guard.ensure()).rejects.toBeInstanceOf(ApiError)

		// 4xx 後はバックオフ無しで即再試行可能
		await expect(guard.ensure()).rejects.toBeInstanceOf(ApiError)
		expect(mockedGet).toHaveBeenCalledTimes(2)
	})
})

describe("ipGuard.createIpGuard().nextApiFetch", () => {
	beforeEach(() => {
		jest.useFakeTimers()
		jest.setSystemTime(new Date("2026-05-21T00:00:00Z"))
		mockedGet.mockReset()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it("403 IP_RESTRICTED 時は fetch を呼ばず 403 Response を返す", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet.mockRejectedValue(apiErr(403, { code: "IP_RESTRICTED" }))

		const fetchSpy = jest.fn()
		;(global as unknown as { fetch: jest.Mock }).fetch = fetchSpy

		const res = await guard.nextApiFetch("/api/generate-axes", {
			method: "POST",
		})

		expect(fetchSpy).not.toHaveBeenCalled()
		expect(res.status).toBe(403)
		const body = (await res.json()) as { code: string }
		expect(body.code).toBe("IP_RESTRICTED")
	})

	it("200 で /me が通れば実際の fetch が呼ばれる", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet.mockResolvedValue({ ok: true })

		const fetchSpy = jest
			.fn()
			.mockResolvedValue(
				new Response(JSON.stringify({ ok: true }), { status: 200 }),
			)
		;(global as unknown as { fetch: jest.Mock }).fetch = fetchSpy

		const res = await guard.nextApiFetch("/api/generate-axes", {
			method: "POST",
		})

		expect(fetchSpy).toHaveBeenCalledWith("/api/generate-axes", {
			method: "POST",
		})
		expect(res.status).toBe(200)
	})

	it("5xx は fail-open で実際の fetch を呼ぶ", async () => {
		const guard = createIpGuard({ ttlMs: 5_000 })
		mockedGet.mockRejectedValue(apiErr(503))

		const fetchSpy = jest
			.fn()
			.mockResolvedValue(new Response("{}", { status: 200 }))
		;(global as unknown as { fetch: jest.Mock }).fetch = fetchSpy

		const res = await guard.nextApiFetch("/api/generate-axes")

		expect(fetchSpy).toHaveBeenCalled()
		expect(res.status).toBe(200)
	})
})
