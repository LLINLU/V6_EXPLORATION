// Helpers for Supabase write paths that must bypass the 5-second TTL cache
// applied by the `from(...)` Proxy in client.ts.
//
// The default Proxy uses a cached IP-allowlist check for `from(...)` chains
// so high-frequency reads/polls don't hammer /me. Writes
// (insert/update/upsert/delete) commit DB side effects that cannot be
// retracted once they land, so they deserve the same `fresh:true` treatment
// the Edge Functions path gets. Route all write chains through `freshFrom`
// so the latest allowlist state is consulted at trigger time.

import { ensureIpAllowed } from "@/lib/ipGuard"
import { supabase } from "./client"

/**
 * `supabase.from(table)` with a forced `fresh:true` IP allowlist check.
 *
 * Use for write chains. The returned builder is the regular PostgREST
 * builder (Proxied to add the read-side TTL check), so callers retain the
 * usual fluent API:
 *
 *   await (await freshFrom("tree_nodes")).insert({ ... })
 *   await (await freshFrom("teams")).delete().eq("id", teamId)
 *
 * The supabase client is constructed without an explicit `<Database>`
 * generic (see client.ts), so callers see the same generic builder shape
 * they'd get from `supabase.from(table)` directly — no extra type-safety
 * lost on the write side.
 */
export async function freshFrom<T extends string>(table: T) {
	await ensureIpAllowed({ fresh: true })
	return supabase.from(table)
}
