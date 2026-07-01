// Supabase client with built-in IP allowlist guard.
//
// Supabase-direct calls (Edge Functions / PostgREST) bypass our BE's
// ipRestriction middleware. To close that gap, every call routed through
// this client (functions.invoke + from.*) runs a /me check on the BE first.
// /me returns 403 IP_RESTRICTED when the caller's source IP is not in their
// allowlist, which fires IP_RESTRICTED_EVENT (see apiClient.ts) → block
// screen + signOut.
//
// Policy:
//   - functions.invoke: always fresh (no cache). These are fire-and-forget
//     triggers — once the Edge Function starts, the background work can't
//     be retracted, so the guard must see the latest allowlist state.
//   - from(...): 5 sec TTL cache. High-frequency polling / batch reads
//     where a few seconds of detection lag is acceptable.
//   - fail-open on 5xx / network failure (server faults shouldn't block
//     the user); fail-closed on 4xx (propagate as `{ data: null, error }`
//     so existing `if (error)` callers handle it).
//   - auth passes through (signIn/Out must always work). storage / realtime
//     are not wired into the guard; touching them throws in dev / warns in
//     prod so the gap is loud rather than silent.
//
// Implementation note: SupabaseClient exposes `functions` as a getter that
// returns a fresh FunctionsClient every access — monkey-patching
// `raw.functions.invoke` mutates a temporary that is immediately discarded.
// Wrapping the SupabaseClient itself with a Proxy makes the override survive
// across `.functions` reads.

import { createClient } from "@supabase/supabase-js"
import { ensureIpAllowed } from "@/lib/ipGuard"

const NEXT_PUBLIC_SUPABASE_URL =
	process.env.NEXT_PUBLIC_SUPABASE_URL ??
	"https://mlhxwypwicflpahwpmlg.supabase.co"
const NEXT_PUBLIC_SUPABASE_ANON_KEY =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saHh3eXB3aWNmbHBhaHdwbWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzgwOTYsImV4cCI6MjA3NzgxNDA5Nn0.qukD4rR0WkUK9qiTJ7fyw6qrOvf4XnPpmU2AlhhwpFk"

const raw = createClient(
	NEXT_PUBLIC_SUPABASE_URL,
	NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

// ─── functions.invoke wrap (fresh check) ───────────────────────────────
function wrapInvoke(
	originalInvoke: (
		name: string,
		opts?: unknown,
	) => Promise<{ data: unknown; error: unknown }>,
) {
	return async (name: string, opts?: unknown) => {
		try {
			await ensureIpAllowed({ fresh: true })
		} catch (err) {
			// Shape errors as `{ data, error }` so existing `if (error)` callers
			// don't need to differentiate guard failures from supabase failures.
			return { data: null, error: err as Error }
		}
		return originalInvoke(name, opts)
	}
}

// ─── PostgrestBuilder Proxy wrap (cached check) ────────────────────────
// The Postgrest builder is a chain whose `.then` triggers the HTTP request.
// Hooking `.then` lets us run ensureIpAllowed at the exact moment the chain
// is awaited. Chain methods (.select / .eq / ...) return new builders, so
// the wrap recurses.
function isThenable(
	v: unknown,
): v is { then: (...args: unknown[]) => unknown } {
	return (
		!!v &&
		typeof v === "object" &&
		"then" in v &&
		typeof (v as { then: unknown }).then === "function"
	)
}

function proxyBuilder<T extends object>(builder: T): T {
	return new Proxy(builder, {
		get(target, prop, receiver) {
			if (prop === "then") {
				const originalThen = Reflect.get(target, prop, receiver) as (
					onResolve: unknown,
					onReject: unknown,
				) => unknown
				if (typeof originalThen !== "function") return originalThen
				return (
					onResolve?: (v: unknown) => unknown,
					onReject?: (e: unknown) => unknown,
				) => {
					return ensureIpAllowed().then(
						() => originalThen.call(target, onResolve, onReject),
						(err) => {
							// Keep the supabase contract: errors surface as a resolved
							// { data, error }, never a rejection. When onResolve is absent
							// (e.g. `.then(undefined, onReject)`), still resolve the chain
							// to the shaped value rather than `undefined`.
							const shaped = { data: null, error: err }
							return onResolve ? onResolve(shaped) : shaped
						},
					)
				}
			}
			const val = Reflect.get(target, prop, receiver)
			if (typeof val === "function") {
				return (...args: unknown[]) => {
					const result = (val as (...a: unknown[]) => unknown).apply(
						target,
						args,
					)
					return isThenable(result) ? proxyBuilder(result as object) : result
				}
			}
			return val
		},
	})
}

// ─── SupabaseClient-level Proxy ──────────────────────────────────────────
// `functions` is a getter that returns a fresh FunctionsClient each access,
// so we wrap on every read. `auth` passes through untouched (signIn/Out
// must always work). `storage` / `realtime` aren't wired into the guard;
// touching them is treated as a programming error (throw in dev, warn in
// prod) until they're explicitly handled.
const UNGATED_PROPS = new Set(["storage", "realtime"])

function reportUngated(prop: string): void {
	const message =
		`[supabase] '${prop}' is not gated by the IP allowlist guard. ` +
		`Extend src/integrations/supabase/client.ts to wrap this API before using it.`
	if (process.env.NODE_ENV !== "production") {
		throw new Error(message)
	}
	console.warn(message)
}

export const supabase: typeof raw = new Proxy(raw, {
	get(target, prop, receiver) {
		if (typeof prop === "string" && UNGATED_PROPS.has(prop)) {
			reportUngated(prop)
		}
		if (prop === "functions") {
			const fns = Reflect.get(target, prop, receiver)
			if (!fns || typeof fns !== "object") return fns
			return new Proxy(fns as object, {
				get(fnsTarget, fnsProp, fnsReceiver) {
					if (fnsProp === "invoke") {
						const orig = Reflect.get(fnsTarget, fnsProp, fnsReceiver) as (
							n: string,
							o?: unknown,
						) => Promise<{ data: unknown; error: unknown }>
						return wrapInvoke(orig.bind(fnsTarget))
					}
					return Reflect.get(fnsTarget, fnsProp, fnsReceiver)
				},
			})
		}
		if (prop === "from") {
			const fromFn = Reflect.get(target, prop, receiver) as (
				relation: string,
			) => object
			return (relation: string) => proxyBuilder(fromFn.call(target, relation))
		}
		return Reflect.get(target, prop, receiver)
	},
})
