import { Activity, Loader2, TestTube, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ImperativePanelHandle } from "react-resizable-panels"
import { useAuth } from "@/components/AuthProvider"
import {
	IpAllowlistPanel,
	type IpAllowlistTarget,
} from "@/components/admin/IpAllowlistPanel"
import { LoadTestTab } from "@/components/admin/LoadTestTab"
import { SystemOverviewTab } from "@/components/admin/SystemOverviewTab"
import { UserManagementTab } from "@/components/admin/UserManagementTab"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring"
import { supabase } from "@/integrations/supabase/client"

interface LoadTestResult {
	id: string
	testName: string
	startTime: Date
	endTime?: Date
	status: "running" | "completed" | "failed"
	requests: number
	successCount: number
	errorCount: number
	averageResponseTime: number
	maxResponseTime: number
	minResponseTime: number
}

// Persist only the user-chosen width — not the open/closed state. The
// library's autoSaveId would also persist the collapsed `[100, 0]` layout,
// which conflicts with the always-mounted + collapse/expand animation
// strategy used below (see the ResizablePanelGroup block).
const PANEL_SIZE_STORAGE_KEY = "memorylab:admin-ip-allowlist-panel-size"
const PANEL_DEFAULT_SIZE = 35
const PANEL_MIN_SIZE = 20
const PANEL_MAX_SIZE = 60

function loadSavedPanelSize(): number {
	if (typeof window === "undefined") return PANEL_DEFAULT_SIZE
	try {
		const stored = window.localStorage.getItem(PANEL_SIZE_STORAGE_KEY)
		if (stored) {
			const parsed = Number.parseFloat(stored)
			if (
				Number.isFinite(parsed) &&
				parsed >= PANEL_MIN_SIZE &&
				parsed <= PANEL_MAX_SIZE
			) {
				return parsed
			}
		}
	} catch {
		/* private mode / disabled storage — fall through to default */
	}
	return PANEL_DEFAULT_SIZE
}

function savePanelSize(size: number): void {
	if (typeof window === "undefined") return
	try {
		window.localStorage.setItem(PANEL_SIZE_STORAGE_KEY, String(size))
	} catch {
		/* best-effort; non-fatal */
	}
}

const AdminPageContent = () => {
	const { t } = useTranslation()
	const { user, isAdmin, adminLoading, loading } = useAuth()
	const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)

	useEffect(() => {
		if (typeof window !== "undefined") {
			setSearchParams(new URLSearchParams(window.location.search))
		}
	}, [])
	const [loadTests, setLoadTests] = useState<LoadTestResult[]>([])
	const [isRunningTest, setIsRunningTest] = useState(false)
	const [testProgress, setTestProgress] = useState(0)

	// IP allowlist side panel is rendered at the page-level layout (NOT inside
	// any tab box) so it can push the entire admin content to the left when
	// open. The panel sticks to the right edge of the viewport.
	//
	// `target` is a discriminated union: per-user management (kind: "user") or
	// team-bulk registration (kind: "team"). The panel switches its UI by
	// `target.kind`.
	const [ipAllowlistTarget, setIpAllowlistTarget] =
		useState<IpAllowlistTarget | null>(null)

	// Open/close animation state. `displayedTarget` lags `ipAllowlistTarget`
	// so the panel can slide out for PANEL_ANIM_MS before unmounting.
	// `panelOpen` is flipped on the next frame to fire the CSS transition.
	// `savedSizeRef` holds the last user-chosen width — captured just
	// before close, restored on open.
	const PANEL_ANIM_MS = 200
	const [displayedTarget, setDisplayedTarget] =
		useState<IpAllowlistTarget | null>(null)
	const [panelOpen, setPanelOpen] = useState(false)
	const rightPanelRef = useRef<ImperativePanelHandle>(null)
	const savedSizeRef = useRef<number>(PANEL_DEFAULT_SIZE)

	// Defer localStorage read until after mount to keep SSR safe.
	useEffect(() => {
		savedSizeRef.current = loadSavedPanelSize()
	}, [])

	useEffect(() => {
		if (ipAllowlistTarget) {
			setDisplayedTarget(ipAllowlistTarget)
			const id = requestAnimationFrame(() => {
				setPanelOpen(true)
				rightPanelRef.current?.resize(savedSizeRef.current)
			})
			return () => cancelAnimationFrame(id)
		}
		const currentSize = rightPanelRef.current?.getSize()
		if (currentSize != null && currentSize > 1) {
			savedSizeRef.current = currentSize
			savePanelSize(currentSize)
		}
		setPanelOpen(false)
		rightPanelRef.current?.resize(0)
		const id = setTimeout(() => setDisplayedTarget(null), PANEL_ANIM_MS)
		return () => clearTimeout(id)
	}, [ipAllowlistTarget])

	// システム監視データを取得
	const {
		teamStats,
		isLoading: monitoringLoading,
		error: monitoringError,
		refreshStats,
	} = useSystemMonitoring()

	// URLクエリパラメータからタブを取得、デフォルトは'overview'
	const currentTab = searchParams?.get("tab") || "overview"

	// タブ変更ハンドラー
	const handleTabChange = (value: string) => {
		if (typeof window !== "undefined") {
			const newParams = new URLSearchParams(window.location.search)
			newParams.set("tab", value)
			window.history.replaceState(
				{},
				"",
				`${window.location.pathname}?${newParams}`,
			)
			setSearchParams(newParams)
		}
	}

	// テスト設定
	const [testConfig, setTestConfig] = useState({
		testName: "",
		endpoint: "generate-tree-fast-v3",
		concurrentUsers: 10,
		requestsPerUser: 5,
		payload: JSON.stringify(
			{
				searchTheme: "負荷テスト用クエリ",
				team_id: teamStats?.[0]?.team_id,
				user_id: user?.id,
			},
			null,
			2,
		),
	})

	// アクセス権限がない場合のリダイレクト
	useEffect(() => {
		if (!loading && !adminLoading && !isAdmin) {
			// console.log("!loading", !loading)
			// console.log("!adminLoading", !adminLoading)
			// console.log("!isAdmin", !isAdmin)
			setTimeout(() => {
				if (typeof window !== "undefined") {
					window.location.href = "/"
				}
			}, 3000)
		}
	}, [isAdmin, adminLoading, loading])

	const startLoadTest = async () => {
		if (!testConfig.testName.trim()) {
			alert(t("admin_page.test_name_required"))
			return
		}

		setIsRunningTest(true)
		setTestProgress(0)

		const testResult: LoadTestResult = {
			id: crypto.randomUUID(),
			testName: testConfig.testName,
			startTime: new Date(),
			status: "running",
			requests: testConfig.concurrentUsers * testConfig.requestsPerUser,
			successCount: 0,
			errorCount: 0,
			averageResponseTime: 0,
			maxResponseTime: 0,
			minResponseTime: Infinity,
		}

		setLoadTests((prev) => [testResult, ...prev])

		try {
			// 実際の負荷テスト実行
			const totalRequests =
				testConfig.concurrentUsers * testConfig.requestsPerUser
			const batchSize = Math.max(1, Math.floor(testConfig.concurrentUsers / 2))

			for (let i = 0; i < totalRequests; i += batchSize) {
				const batch = Math.min(batchSize, totalRequests - i)
				const promises = Array.from({ length: batch }, () =>
					simulateRequest(testConfig.endpoint, JSON.parse(testConfig.payload)),
				)

				const results = await Promise.allSettled(promises)

				results.forEach((result) => {
					if (result.status === "fulfilled") {
						testResult.successCount++
						const responseTime = result.value.responseTime
						testResult.averageResponseTime =
							(testResult.averageResponseTime * (testResult.successCount - 1) +
								responseTime) /
							testResult.successCount
						testResult.maxResponseTime = Math.max(
							testResult.maxResponseTime,
							responseTime,
						)
						testResult.minResponseTime = Math.min(
							testResult.minResponseTime,
							responseTime,
						)
					} else {
						testResult.errorCount++
					}
				})

				setTestProgress(Math.round(((i + batch) / totalRequests) * 100))

				// 次のバッチまで少し待機
				if (i + batch < totalRequests) {
					await new Promise((resolve) => setTimeout(resolve, 1000))
				}
			}

			testResult.status = "completed"
			testResult.endTime = new Date()
		} catch (_error) {
			testResult.status = "failed"
			testResult.endTime = new Date()
		} finally {
			setIsRunningTest(false)
			setTestProgress(0)
			setLoadTests((prev) =>
				prev.map((t) => (t.id === testResult.id ? testResult : t)),
			)
		}
	}

	const simulateRequest = async (
		endpoint: string,
		payload: Record<string, unknown>,
	): Promise<{ responseTime: number }> => {
		const startTime = Date.now()

		try {
			// 実際のSupabase Functionを呼び出し
			const response = await supabase.functions.invoke(endpoint, {
				body: payload,
			})

			const responseTime = Date.now() - startTime

			if (response.error) {
				throw new Error(response.error.message)
			}

			return { responseTime }
		} catch (_error) {
			const responseTime = Date.now() - startTime
			throw { responseTime }
		}
	}

	const clearTestResults = () => {
		setLoadTests([])
	}

	const formatDuration = (start: Date, end?: Date) => {
		const duration = end
			? end.getTime() - start.getTime()
			: Date.now() - start.getTime()
		return `${Math.round(duration / 1000)}${t("admin_page.seconds")}`
	}

	if (adminLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		)
	}

	if (!isAdmin) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Alert className="max-w-md">
					<AlertDescription>{t("admin_page.no_access")}</AlertDescription>
				</Alert>
			</div>
		)
	}

	const mainContent = (
		<div className="p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex gap-2 items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							{t("admin_page.title")}
						</h1>
						<p className="text-gray-600">{t("admin_page.subtitle")}</p>
						<Button
							onClick={() => {
								if (typeof window !== "undefined") {
									window.location.href = "/"
								}
							}}
						>
							{t("admin_page.back_to_home")}
						</Button>
					</div>
					<Badge variant="secondary">{t("admin_page.admin_badge")}</Badge>
				</div>

				<Tabs
					value={currentTab}
					onValueChange={handleTabChange}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="overview" className="flex items-center gap-2">
							<Activity className="h-4 w-4" />
							{t("admin_page.tab_system_monitoring")}
						</TabsTrigger>
						<TabsTrigger value="load-test" className="flex items-center gap-2">
							<TestTube className="h-4 w-4" />
							{t("admin_page.tab_load_test")}
						</TabsTrigger>
						<TabsTrigger value="users" className="flex items-center gap-2">
							<Users className="h-4 w-4" />
							{t("admin_page.tab_user_management")}
						</TabsTrigger>
					</TabsList>

					{/* システム監視タブ */}
					<TabsContent value="overview" className="space-y-6">
						<SystemOverviewTab
							teamStats={teamStats}
							isLoading={monitoringLoading}
							error={monitoringError}
							onRefresh={refreshStats}
						/>
					</TabsContent>

					{/* 負荷テストタブ */}
					<TabsContent value="load-test" className="space-y-6">
						<LoadTestTab
							testConfig={testConfig}
							setTestConfig={setTestConfig}
							loadTests={loadTests}
							isRunningTest={isRunningTest}
							testProgress={testProgress}
							startLoadTest={startLoadTest}
							clearTestResults={clearTestResults}
							formatDuration={formatDuration}
						/>
					</TabsContent>

					{/* ユーザー管理タブ */}
					<TabsContent value="users" className="space-y-6">
						<UserManagementTab
							onOpenIpAllowlist={({ userId, label }) =>
								setIpAllowlistTarget({ kind: "user", userId, label })
							}
							onOpenIpAllowlistForTeam={({ teamId, teamName, members }) =>
								setIpAllowlistTarget({
									kind: "team",
									teamId,
									teamName,
									members,
								})
							}
						/>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)

	return (
		// h-screen (not min-h-screen): both panels need to scroll independently
		// inside a viewport-fixed container. min-h-screen lets the left side
		// push body height, which would defeat the right panel's own overflow.
		<div className="h-screen bg-gray-50">
			{/*
			 * The right panel stays mounted (collapsible + collapsedSize=0).
			 *   - Conditionally rendering it would force the library into
			 *     single-panel layout (flex-grow hardcoded to 1), which can't
			 *     be transitioned. Driving open/close via imperative `resize()`
			 *     lets the library rewrite both sides' flex-grow together so
			 *     `transition-[flex]` runs in sync on both panels.
			 *   - Swapping `mainContent`'s parent subtree would also remount
			 *     Tabs / UserManagementTab and re-fetch the user list — same
			 *     parent for both panel states avoids that.
			 *   - The handle is hidden + non-interactive while collapsed.
			 */}
			<ResizablePanelGroup direction="horizontal" className="h-full">
				<ResizablePanel
					id="admin-main"
					order={1}
					defaultSize={100}
					minSize={35}
					className="transition-[flex] duration-200 ease-out"
				>
					<div className="h-full overflow-auto">{mainContent}</div>
				</ResizablePanel>
				<ResizableHandle
					withHandle
					disabled={!displayedTarget}
					className={`transition-opacity duration-200 ${
						displayedTarget ? "" : "pointer-events-none opacity-0"
					}`}
				/>
				<ResizablePanel
					ref={rightPanelRef}
					id="admin-ip-allowlist"
					order={2}
					defaultSize={0}
					collapsible
					collapsedSize={0}
					minSize={PANEL_MIN_SIZE}
					maxSize={PANEL_MAX_SIZE}
					className="transition-[flex] duration-200 ease-out"
				>
					{/*
					 * Outer overflow-hidden clips the slide; the inner div
					 * tracks `panelOpen` and translates in/out along the X axis.
					 */}
					<div className="h-full overflow-hidden">
						<div
							className={`h-full transition-transform duration-200 ease-out ${
								panelOpen ? "translate-x-0" : "translate-x-full"
							}`}
						>
							{displayedTarget && (
								<IpAllowlistPanel
									// Remount on target change so internal state resets cleanly
									// when switching between user / team / different user.
									key={
										displayedTarget.kind === "user"
											? `user:${displayedTarget.userId}`
											: `team:${displayedTarget.teamId}`
									}
									target={displayedTarget}
									onClose={() => setIpAllowlistTarget(null)}
								/>
							)}
						</div>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}

const AdminPage = () => {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	// Show loading during SSR
	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	return <AdminPageContent />
}

export default AdminPage
