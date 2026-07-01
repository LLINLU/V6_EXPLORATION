// Shared IP allowlist guard used across multiple FE → backend paths.
//
// The BE's ipRestriction middleware enforces per-user IP allowlists for
// requests that reach our Express BE. Three FE call paths bypass that
// middleware and need their own guard:
//
//   1. supabase.functions.invoke(...)         (Supabase Edge Functions)
//   2. supabase.from(...).select/insert/...    (Supabase PostgREST)
//   3. fetch("/api/*", ...)                    (Next.js server routes calling OpenAI etc.)
//
// All three call `ensureIpAllowed()` before issuing the actual request, so
// the gate logic, cache, and failure policy can live in one place.

import { ApiError, apiClient } from "./apiClient"

const DEFAULT_TTL_MS = 5_000
// Exponential-ish backoff when /me returns 5xx / network error. We keep the
// last step (5s) as the steady-state retry interval so we don't drift further
// during a prolonged BE outage.
const BACKOFF_STEPS_MS = [1_000, 2_000, 5_000] as const

export interface IpGuard {
	ensure: (opts?: { fresh?: boolean }) => Promise<void>
	nextApiFetch: (
		input: RequestInfo | URL,
		init?: RequestInit,
	) => Promise<Response>
}

/**
 * Create an IP guard instance.
 *
 * Module exports a default singleton (`ensureIpAllowed` / `nextApiFetch`).
 * Tests should create their own instance via `createIpGuard()` to avoid
 * leaking `lastCheck` / `inflight` state across cases.
 */
export function createIpGuard(opts?: { ttlMs?: number }): IpGuard {
	const TTL_MS = opts?.ttlMs ?? DEFAULT_TTL_MS

	let lastCheck = 0
	// Track fresh and cached in-flights separately. A fresh-intent caller
	// must not be merged with a cached check that could resolve from stale
	// data — sharing a single in-flight promise across both intents would
	// silently downgrade `{ fresh: true }` to a cached result.
	let inflightCached: Promise<void> | null = null
	let inflightFresh: Promise<void> | null = null
	// 5xx / network failure backoff: while `now < backoffUntil`, we skip
	// hitting /me entirely (fail-open). Each consecutive failure increases
	// the step until the table caps out.
	let backoffUntil = 0
	let backoffStep = 0

	async function callMe(): Promise<void> {
		try {
			await apiClient.get("/me")
			lastCheck = Date.now()
			backoffStep = 0
			backoffUntil = 0
		} catch (err) {
			if (err instanceof ApiError && err.status >= 500) {
				const delay =
					BACKOFF_STEPS_MS[Math.min(backoffStep, BACKOFF_STEPS_MS.length - 1)]
				backoffUntil = Date.now() + delay
				backoffStep++
				console.warn(
					"[ipGuard] /me 5xx, fail-open backoff",
					delay,
					"ms",
					err.status,
					err.body,
				)
				return
			}
			if (!(err instanceof ApiError)) {
				const delay =
					BACKOFF_STEPS_MS[Math.min(backoffStep, BACKOFF_STEPS_MS.length - 1)]
				backoffUntil = Date.now() + delay
				backoffStep++
				console.warn(
					"[ipGuard] /me network error, fail-open backoff",
					delay,
					"ms",
					err,
				)
				return
			}
			// 4xx: fail-closed. Reset backoff so a real auth/IP fix is detected
			// on the next call without waiting.
			lastCheck = 0
			backoffStep = 0
			backoffUntil = 0
			throw err
		}
	}

	/**
	 * Verify that the current source IP is allowed for the authenticated user.
	 *
	 * - When `opts.fresh` is true, the TTL cache is bypassed and /me is
	 *   fetched (never reusing an inflight cached check). Use this for
	 *   fire-and-forget triggers (Supabase Edge Function invokes, writes that
	 *   commit DB side effects, Next.js API route calls that consume quota)
	 *   where a cached "OK" could let an operation slip through after an
	 *   admin adds a restriction.
	 * - Otherwise the result is cached for `TTL_MS`; subsequent calls within
	 *   the window return immediately. Suitable for high-frequency polling
	 *   and reads.
	 *
	 * Policy:
	 * - 200 → resolve, update cache
	 * - 403 / 401 / other 4xx → reject (fail-closed); the apiClient
	 *   interceptor surfaces IP_RESTRICTED separately
	 * - 5xx / network error → resolve (fail-open) and engage backoff; the
	 *   guard skips further /me calls until the backoff window elapses so a
	 *   BE outage doesn't turn into FE-driven /me amplification.
	 */
	async function ensure(opts?: { fresh?: boolean }): Promise<void> {
		const now = Date.now()

		// During backoff we treat every call as fail-open without contacting
		// BE. The next call after `backoffUntil` retries naturally.
		if (now < backoffUntil) return

		if (opts?.fresh) {
			if (inflightFresh) return inflightFresh
			inflightFresh = callMe().finally(() => {
				inflightFresh = null
			})
			return inflightFresh
		}

		if (now - lastCheck < TTL_MS) return
		if (inflightCached) return inflightCached
		inflightCached = callMe().finally(() => {
			inflightCached = null
		})
		return inflightCached
	}

	/**
	 * `fetch()` wrapper for in-app Next.js API routes (`/api/*`).
	 *
	 * These routes call external services (OpenAI etc.) and are not gated by
	 * our BE's ipRestriction middleware. Without this wrap they'd bypass IP
	 * allowlist enforcement entirely, letting a restricted user consume
	 * credits/quota until the next /me check elsewhere catches up.
	 *
	 * On block, returns a 403 Response whose body is `{ code: "IP_RESTRICTED" }`
	 * encoded as `application/json`. Callers must consume the body with
	 * `response.json()`; non-JSON consumers (e.g. SSE) are out of scope.
	 */
	async function nextApiFetch(
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> {
		try {
			await ensure({ fresh: true })
		} catch (err) {
			const body =
				err instanceof ApiError ? err.body : { code: "IP_RESTRICTED" }
			const status = err instanceof ApiError ? err.status : 403
			return new Response(JSON.stringify(body ?? { code: "IP_RESTRICTED" }), {
				status,
				headers: { "Content-Type": "application/json" },
			})
		}
		return fetch(input, init)
	}

	return { ensure, nextApiFetch }
}

const defaultGuard = createIpGuard()

export const ensureIpAllowed = defaultGuard.ensure
export const nextApiFetch = defaultGuard.nextApiFetch
