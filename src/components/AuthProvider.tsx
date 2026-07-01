import type { AuthError, Session, User } from "@supabase/supabase-js"
import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { ApiError, apiClient, IP_RESTRICTED_EVENT } from "@/lib/apiClient"

// Shared with Login.tsx. The IP_RESTRICTED → /ip-restricted → /login chain
// drops router state, so we persist the originating URL in localStorage
// before signOut and restore it after the next successful login.
const REDIRECT_KEY = "memorylab:postLoginRedirect"

// Visibility-driven /me re-checks are throttled to this interval. Each
// Cmd-Tab fires visibilitychange, so without throttling rapid focus
// changes would amplify into /me traffic. 30s catches a network switch
// (office Wi-Fi → mobile hotspot) without hammering the BE.
const VISIBILITY_MIN_INTERVAL_MS = 30_000

interface AuthContextType {
	user: User | null
	session: Session | null
	loading: boolean
	isAdmin: boolean
	adminLoading: boolean
	/**
	 * The caller's source IP as observed by API Gateway (returned by `/me`).
	 * Null until the first successful `/me` call lands. Consumers use this to
	 * detect self-lockout when editing IP allowlist entries.
	 */
	sourceIp: string | null
	signIn: (email: string, password: string) => Promise<void>
	signUp: (email: string, password: string) => Promise<void>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null)
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)
	const [isAdmin, setIsAdmin] = useState(false)
	const [adminLoading, setAdminLoading] = useState(false)
	const [sourceIp, setSourceIp] = useState<string | null>(null)
	const navigate = useNavigate()

	useEffect(() => {
		// 初期セッション状態を取得（ネットワーク障害時にハングしないようタイムアウト付き）
		const AUTH_TIMEOUT_MS = 10_000
		const timeoutId = setTimeout(() => {
			console.warn(
				"[AuthProvider] getSession timed out - proceeding without session",
			)
			setLoading(false)
		}, AUTH_TIMEOUT_MS)

		supabase.auth
			.getSession()
			.then(({ data: { session } }) => {
				clearTimeout(timeoutId)
				setSession(session)
				setUser(session?.user ?? null)
				setLoading(false)
			})
			.catch((err) => {
				clearTimeout(timeoutId)
				console.error("[AuthProvider] getSession failed:", err)
				setLoading(false)
			})

		// 認証状態の変更を監視
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session)
			setUser(session?.user ?? null)
			setLoading(false)

			// ユーザーがログアウトした場合は管理者状態をリセット
			if (!session?.user) {
				setIsAdmin(false)
				setAdminLoading(false)
			}
		})

		return () => subscription.unsubscribe()
	}, [])

	// Global handler for IP_RESTRICTED. Any API call (not just /me) can surface
	// it, so apiClient dispatches a CustomEvent and we centralize the
	// signOut + block-screen routing here.
	useEffect(() => {
		const handler = () => {
			if (window.location.pathname === "/ip-restricted") return

			// Stash the originating URL so the next login can return the user
			// there. /login and /ip-restricted are excluded to avoid loops.
			const here = window.location.pathname + window.location.search
			if (here !== "/login" && here !== "/ip-restricted" && here !== "/") {
				window.localStorage.setItem(REDIRECT_KEY, here)
			}

			navigate("/ip-restricted")
			supabase.auth.signOut().catch(() => {
				/* ignore — block screen handles re-login */
			})
		}
		window.addEventListener(IP_RESTRICTED_EVENT, handler)
		return () => window.removeEventListener(IP_RESTRICTED_EVENT, handler)
	}, [navigate])

	// Re-evaluate the IP allowlist via /me on two triggers:
	//   1. session.access_token changes (initial login, TOKEN_REFRESHED)
	//   2. tab becomes visible again (network may have switched)
	//
	// A single check at login would let an admin-added restriction slip
	// through any open session that keeps calling Supabase directly. The
	// Proxy in client.ts handles active users via its own TTL check; this
	// hook covers idle tabs that regain focus.
	const lastMeCheckRef = useRef<number>(0)

	useEffect(() => {
		if (!session?.access_token) {
			// signOut / token cleared: drop the cached source IP so the next
			// signed-in user doesn't see the previous caller's IP while /me is
			// still in flight (the self-lockout warning compares against this).
			setSourceIp(null)
			return
		}

		let cancelled = false
		const runCheck = async () => {
			lastMeCheckRef.current = Date.now()
			try {
				// `/me` returns `{ userId, sourceIp }`; we capture sourceIp so
				// downstream UIs (IP allowlist self-lockout warning) can compare
				// the caller's IP against the CIDR they're about to add/delete.
				const res = await apiClient.get<{
					userId: string
					sourceIp: string | null
				}>("/me")
				if (cancelled) return
				setSourceIp(res.sourceIp ?? null)
			} catch (err) {
				if (cancelled) return
				// 403 IP_RESTRICTED is already routed to the block screen by
				// apiClient's interceptor — swallow it here. Anything else is
				// a transient failure and we log it without surfacing to the UI.
				if (err instanceof ApiError) {
					if (err.status !== 403) {
						console.warn("[AuthProvider] /me check failed:", err.status)
					}
				} else {
					console.warn("[AuthProvider] /me check failed:", err)
				}
			}
		}

		runCheck()

		const handleVisibility = () => {
			if (document.visibilityState !== "visible") return
			if (Date.now() - lastMeCheckRef.current < VISIBILITY_MIN_INTERVAL_MS) {
				return
			}
			runCheck()
		}
		document.addEventListener("visibilitychange", handleVisibility)

		return () => {
			cancelled = true
			document.removeEventListener("visibilitychange", handleVisibility)
		}
	}, [session?.access_token])

	// 管理者権限チェック
	useEffect(() => {
		const checkAdminStatus = async () => {
			if (!user?.id) {
				setIsAdmin(false)
				setAdminLoading(false)
				return
			}

			setAdminLoading(true)
			try {
				const { data, error } = await supabase.functions.invoke(
					"is-app-admin",
					{
						body: { userId: user.id },
					},
				)

				if (error) {
					console.error("Admin check error:", error)
					setIsAdmin(false)
				} else {
					setIsAdmin(data?.isAdmin || false)
				}
			} catch (error) {
				console.error("Error checking admin status:", error)
				setIsAdmin(false)
			} finally {
				setAdminLoading(false)
			}
		}

		checkAdminStatus()
	}, [user?.id])

	const signIn = async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		})

		if (error) {
			throw error
		}
	}

	const signUp = async (email: string, password: string) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
		})

		if (error) {
			throw error
		}
	}

	const signOut = async () => {
		const { error } = await supabase.auth.signOut()
		if (error) {
			throw error
		}
		navigate("/")
	}

	const value = {
		user,
		session,
		loading,
		isAdmin,
		adminLoading,
		sourceIp,
		signIn,
		signUp,
		signOut,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const handleAuthError = (error: AuthError) => {
	console.error("Authentication error:", error)
}
