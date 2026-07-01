import { AlertTriangle, Loader2, Play, Trash2 } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

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

interface TestConfig {
	testName: string
	endpoint: string
	concurrentUsers: number
	requestsPerUser: number
	payload: string
}

interface LoadTestTabProps {
	testConfig: TestConfig
	setTestConfig: React.Dispatch<React.SetStateAction<TestConfig>>
	loadTests: LoadTestResult[]
	isRunningTest: boolean
	testProgress: number
	startLoadTest: () => void
	clearTestResults: () => void
	formatDuration: (start: Date, end?: Date) => string
}

export const LoadTestTab: React.FC<LoadTestTabProps> = ({
	testConfig,
	setTestConfig,
	loadTests,
	isRunningTest,
	testProgress,
	startLoadTest,
	clearTestResults,
	formatDuration,
}) => {
	const { t } = useTranslation()
	const [showWarningDialog, setShowWarningDialog] = useState(false)

	const totalTreesToGenerate =
		testConfig.concurrentUsers * testConfig.requestsPerUser

	const handleStartTest = () => {
		setShowWarningDialog(true)
	}

	const confirmStartTest = () => {
		setShowWarningDialog(false)
		startLoadTest()
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>{t("admin.loadTest.configTitle")}</CardTitle>
						<CardDescription>
							{t("admin.loadTest.configDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="testName">{t("admin.loadTest.testName")}</Label>
							<Input
								id="testName"
								value={testConfig.testName}
								onChange={(e) =>
									setTestConfig((prev) => ({
										...prev,
										testName: e.target.value,
									}))
								}
								placeholder={t("admin.loadTest.testNamePlaceholder")}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="concurrentUsers">
									{t("admin.loadTest.concurrentUsers")}
								</Label>
								<Input
									id="concurrentUsers"
									type="number"
									value={testConfig.concurrentUsers}
									onChange={(e) =>
										setTestConfig((prev) => ({
											...prev,
											concurrentUsers: parseInt(e.target.value) || 10,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="requestsPerUser">
									{t("admin.loadTest.requestsPerUser")}
								</Label>
								<Input
									id="requestsPerUser"
									type="number"
									value={testConfig.requestsPerUser}
									onChange={(e) =>
										setTestConfig((prev) => ({
											...prev,
											requestsPerUser: parseInt(e.target.value) || 5,
										}))
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="endpoint">{t("admin.loadTest.endpoint")}</Label>
							<Input
								id="endpoint"
								value={testConfig.endpoint}
								onChange={(e) =>
									setTestConfig((prev) => ({
										...prev,
										endpoint: e.target.value,
									}))
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="payload">
								{t("admin.loadTest.requestPayload")}
							</Label>
							<Textarea
								id="payload"
								value={testConfig.payload}
								onChange={(e) =>
									setTestConfig((prev) => ({
										...prev,
										payload: e.target.value,
									}))
								}
								rows={6}
								className="font-mono text-sm"
							/>
						</div>

						{/* Expected tree generation count display */}
						<div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
							<div className="flex items-center gap-2 text-amber-800">
								<AlertTriangle className="h-4 w-4" />
								<span className="font-medium">
									{t("admin.loadTest.expectedTreeCount")}
								</span>
							</div>
							<p className="text-sm text-amber-700 mt-1">
								{t("admin.loadTest.expectedTreeCountDesc", {
									count: totalTreesToGenerate,
								})}
							</p>
							<p className="text-xs text-amber-600 mt-1">
								({testConfig.concurrentUsers} {t("admin.loadTest.users")} ×{" "}
								{testConfig.requestsPerUser}{" "}
								{t("admin.loadTest.requestsPerUserShort")})
							</p>
						</div>

						{isRunningTest && (
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span>{t("admin.loadTest.testInProgress")}</span>
									<span>{testProgress}%</span>
								</div>
								<Progress value={testProgress} />
							</div>
						)}

						<div className="flex gap-2">
							<Button
								onClick={handleStartTest}
								disabled={isRunningTest}
								className="flex-1"
							>
								{isRunningTest ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{t("admin.loadTest.running")}
									</>
								) : (
									<>
										<Play className="mr-2 h-4 w-4" />
										{t("admin.loadTest.startTest")}
									</>
								)}
							</Button>
							<Button
								variant="outline"
								onClick={clearTestResults}
								disabled={isRunningTest}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t("admin.loadTest.resultsTitle")}</CardTitle>
						<CardDescription>
							{t("admin.loadTest.resultsDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{loadTests.length === 0 ? (
							<div className="text-center text-gray-500 py-8">
								{t("admin.loadTest.noResults")}
							</div>
						) : (
							<div className="space-y-4">
								{loadTests.map((test) => (
									<div
										key={test.id}
										className="border rounded-lg p-4 space-y-2"
									>
										<div className="flex items-center justify-between">
											<h4 className="font-medium">{test.testName}</h4>
											<Badge
												variant={
													test.status === "completed"
														? "default"
														: test.status === "failed"
															? "destructive"
															: "secondary"
												}
											>
												{test.status === "running"
													? t("admin.loadTest.statusRunning")
													: test.status === "completed"
														? t("admin.loadTest.statusCompleted")
														: t("admin.loadTest.statusFailed")}
											</Badge>
										</div>

										<div className="grid grid-cols-2 gap-4 text-sm">
											<div>
												<span className="text-gray-600">
													{t("admin.loadTest.totalRequests")}:
												</span>{" "}
												{test.requests}
											</div>
											<div>
												<span className="text-gray-600">
													{t("admin.loadTest.success")}:
												</span>{" "}
												{test.successCount}
											</div>
											<div>
												<span className="text-gray-600">
													{t("admin.loadTest.failed")}:
												</span>{" "}
												{test.errorCount}
											</div>
											<div>
												<span className="text-gray-600">
													{t("admin.loadTest.executionTime")}:
												</span>{" "}
												{formatDuration(test.startTime, test.endTime)}
											</div>
										</div>

										{test.status === "completed" && (
											<div className="grid grid-cols-3 gap-4 text-sm pt-2 border-t">
												<div>
													<span className="text-gray-600">
														{t("admin.loadTest.average")}:
													</span>{" "}
													{Math.round(test.averageResponseTime)}ms
												</div>
												<div>
													<span className="text-gray-600">
														{t("admin.loadTest.max")}:
													</span>{" "}
													{test.maxResponseTime}ms
												</div>
												<div>
													<span className="text-gray-600">
														{t("admin.loadTest.min")}:
													</span>{" "}
													{test.minResponseTime === Infinity
														? 0
														: test.minResponseTime}
													ms
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-amber-500" />
							{t("admin.loadTest.confirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.loadTest.confirmDesc", { count: totalTreesToGenerate })}
							<br />
							<br />
							<div className="bg-gray-50 p-3 rounded-lg text-sm">
								<div>
									• {t("admin.loadTest.concurrentUsers")}:{" "}
									{testConfig.concurrentUsers}
								</div>
								<div>
									• {t("admin.loadTest.requestsPerUser")}:{" "}
									{testConfig.requestsPerUser}
								</div>
								<div>
									• {t("admin.loadTest.totalRequestsCount")}:{" "}
									{totalTreesToGenerate}
								</div>
							</div>
							<br />
							{t("admin.loadTest.confirmWarning")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("admin.loadTest.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={confirmStartTest}>
							{t("admin.loadTest.execute")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
