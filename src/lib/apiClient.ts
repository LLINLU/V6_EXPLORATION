import { supabase } from "@/integrations/supabase/client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
if (!API_BASE_URL) {
	throw new Error(
		"NEXT_PUBLIC_API_BASE_URL is not set — configure it in your .env file",
	)
}

/**
 * Name of the CustomEvent dispatched when any API call returns
 * 403 + `{ code: "IP_RESTRICTED" }`. AuthProvider listens for this and
 * routes the user to the block screen. Decoupling via a window event
 * keeps apiClient free of react-router / auth-context dependencies.
 */
export const IP_RESTRICTED_EVENT = "memorylab:ip-restricted"

function isIpRestrictedBody(body: unknown): boolean {
	return (
		!!body &&
		typeof body === "object" &&
		"code" in body &&
		(body as { code: unknown }).code === "IP_RESTRICTED"
	)
}

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly body?: unknown,
	) {
		super(message)
		this.name = "ApiError"
	}
}

async function getAuthCreds(): Promise<{ token: string; userId: string }> {
	const { data } = await supabase.auth.getSession()
	const token = data?.session?.access_token
	const userId = data?.session?.user?.id
	if (!token || !userId) {
		throw new ApiError(401, "Not authenticated — no session token")
	}
	return { token, userId }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body" | "method"> {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
	/** JSON-serializable request body. */
	body?: unknown
	/** Skip Authorization header (e.g. for unauthenticated /health). */
	skipAuth?: boolean
	signal?: AbortSignal
}

export async function apiFetch<T>(
	path: string,
	opts: ApiFetchOptions = {},
): Promise<T> {
	const headers = new Headers(opts.headers)
	if (!opts.skipAuth) {
		const { token, userId } = await getAuthCreds()
		headers.set("Authorization", `Bearer ${token}`)
		// API Gateway injects X-User-Id from the Lambda Authorizer's verified
		// context, and HTTP_PROXY forwards client headers, so sending X-User-Id
		// from the browser causes a duplicated header (BE then sees a comma-
		// joined value and rejects it). Opt-in only for direct FE → BE access
		// (local dev), where the BE auth middleware reads this header.
		if (process.env.NEXT_PUBLIC_SEND_USER_ID_HEADER === "true") {
			headers.set("X-User-Id", userId)
		}
		// Local-dev affordance for the per-user IP allowlist feature.
		// In production this header is injected by API Gateway from
		// `$context.identity.sourceIp` — never trusted from the client.
		// Gated to non-production so a misconfigured Amplify env can't ship
		// the override to end users; bundlers eliminate the branch at build
		// time when NODE_ENV === "production".
		if (process.env.NODE_ENV !== "production") {
			const devSourceIp = process.env.NEXT_PUBLIC_DEV_SOURCE_IP
			if (devSourceIp) {
				headers.set("X-Source-IP", devSourceIp)
			}
		}
	}
	if (opts.body !== undefined) {
		headers.set("Content-Type", "application/json")
	}

	const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
	const res = await fetch(url, {
		...opts,
		method: opts.method ?? "GET",
		headers,
		body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
	})

	const text = await res.text().catch(() => "")
	let parsed: unknown
	try {
		parsed = text ? JSON.parse(text) : undefined
	} catch {
		parsed = text
	}

	if (!res.ok) {
		// Per-user IP allowlist enforcement: BE returns 403 + { code: "IP_RESTRICTED" }
		// when the caller's source IP is not in their allowlist. Dispatch a global
		// event so AuthProvider can route to the block screen — every authenticated
		// endpoint may surface this, not just /me, so this catch is centralized here.
		if (res.status === 403 && isIpRestrictedBody(parsed)) {
			if (typeof window !== "undefined") {
				window.dispatchEvent(new CustomEvent(IP_RESTRICTED_EVENT))
			}
		}
		throw new ApiError(
			res.status,
			`${opts.method ?? "GET"} ${path} failed: ${res.status}`,
			parsed,
		)
	}
	return parsed as T
}

export const apiClient = {
	get: <T>(path: string, opts?: Omit<ApiFetchOptions, "body" | "method">) =>
		apiFetch<T>(path, { ...opts, method: "GET" }),
	post: <T>(
		path: string,
		body?: unknown,
		opts?: Omit<ApiFetchOptions, "body" | "method">,
	) => apiFetch<T>(path, { ...opts, method: "POST", body }),
	// `delete` is a reserved word in some positions; `del` follows fetch-wrapper
	// conventions (e.g. Hapi's `del`).
	del: <T = void>(
		path: string,
		opts?: Omit<ApiFetchOptions, "body" | "method">,
	) => apiFetch<T>(path, { ...opts, method: "DELETE" }),
}
