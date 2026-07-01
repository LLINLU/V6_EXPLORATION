import { ChevronDown, ChevronUp } from "lucide-react"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	getQueueListFormatted,
	getQueueStatus,
	isQueueTrulyIdle,
} from "@/services/enrichmentQueue"

interface QueueStatusDisplayProps {
	onNodeSelect?: (nodeId: string) => void
	isVisible?: boolean
	onVisibilityChange?: (visible: boolean) => void
	isChatOpen?: boolean
	chatDisplayMode?: "panel" | "overlay"
}

interface QueueItem {
	name: string
	type: string
	status: string
	elapsedSeconds: number
	nodeId?: string
}

interface QueueStatus {
	queueLength: number
	processing: {
		papers: number
		useCases: number
		trl: number
	}
	maxConcurrent: {
		papers: number
		useCases: number
		trl: number
	}
	apiHealthy: boolean
	lastHealthCheck: number
	polling: number
}

const QueueStatusDisplayComponent: React.FC<QueueStatusDisplayProps> = ({
	onNodeSelect,
	isVisible: propIsVisible,
	onVisibilityChange,
	isChatOpen,
	chatDisplayMode,
}) => {
	const { t } = useTranslation()
	const [status, setStatus] = useState<QueueStatus>(getQueueStatus())
	const [internalVisible, setInternalVisible] = useState(true)
	const [isFolded, setIsFolded] = useState(false)
	const [hasUserInteracted, setHasUserInteracted] = useState(false)
	const [previousFoldedState, setPreviousFoldedState] = useState(false)
	const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null)
	const userInteractionTimerRef = useRef<NodeJS.Timeout | null>(null)
	const previousStatusRef = useRef<string>("")
	const isVisible =
		propIsVisible !== undefined ? propIsVisible : internalVisible

	// Auto-show when searches are running
	useEffect(() => {
		if (
			status.queueLength > 0 ||
			status.processing.papers > 0 ||
			status.processing.useCases > 0 ||
			status.processing.trl > 0
		) {
			// Clear any pending auto-hide timer when new searches start
			if (autoHideTimerRef.current) {
				clearTimeout(autoHideTimerRef.current)
				autoHideTimerRef.current = null
			}
			// Reset user interaction flag when new searches start
			setHasUserInteracted(false)
			// Clear user interaction timer
			if (userInteractionTimerRef.current) {
				clearTimeout(userInteractionTimerRef.current)
				userInteractionTimerRef.current = null
			}

			if (propIsVisible === undefined) {
				setInternalVisible(true)
			} else if (onVisibilityChange) {
				onVisibilityChange(true)
			}
		}
	}, [
		status.queueLength,
		status.processing.papers,
		status.processing.useCases,
		status.processing.trl,
		propIsVisible,
		onVisibilityChange,
	])

	// Auto-fold when chat panel opens
	useEffect(() => {
		if (isChatOpen && chatDisplayMode === "panel") {
			// Save current folded state before folding
			setPreviousFoldedState(isFolded)
			setIsFolded(true)
		} else if (!isChatOpen) {
			// Restore previous folded state when chat closes
			setIsFolded(previousFoldedState)
		}
	}, [isChatOpen, chatDisplayMode, isFolded, previousFoldedState])

	const [lastUpdate, setLastUpdate] = useState(Date.now())
	const [activeTab, setActiveTab] = useState<"summary" | "queue">("queue")

	useEffect(() => {
		const interval = setInterval(() => {
			setStatus(getQueueStatus())
			setLastUpdate(Date.now())
		}, 500)

		return () => clearInterval(interval)
	}, [])

	const title = useMemo(() => {
		const isSearching =
			status.queueLength > 0 ||
			status.processing.papers > 0 ||
			status.processing.useCases > 0 ||
			status.processing.trl > 0
		return isSearching ? t("tech.searching") : t("tech.search_complete")
	}, [status, t])

	const queueList = useMemo(() => {
		return getQueueListFormatted()
	}, []) // Add status as a dependency

	// Auto-hide when all searches complete
	useEffect(() => {
		const currentTitle =
			status.queueLength > 0 ||
			status.processing.papers > 0 ||
			status.processing.useCases > 0 ||
			status.processing.trl > 0
				? t("tech.searching")
				: t("tech.search_complete")
		const isCompleted = currentTitle === t("tech.search_complete")
		const hasCompletedItems = queueList.some(
			(item: QueueItem) => item.status === "done",
		)
		const hasNoActiveItems =
			status.queueLength === 0 &&
			status.processing.papers === 0 &&
			status.processing.useCases === 0 &&
			status.processing.trl === 0
		const isTrulyIdle = isQueueTrulyIdle()

		// Only proceed if status has meaningfully changed or we have a new meaningful state
		const statusChanged = previousStatusRef.current !== currentTitle
		const shouldEvaluateHide =
			statusChanged ||
			(isCompleted && hasNoActiveItems && queueList.length === 0)

		if (!shouldEvaluateHide) {
			return
		}

		// console.log("[QueueStatusDisplay] Auto-hide evaluation:", {
		// currentTitle,
		// isCompleted,
		// hasCompletedItems,
		// hasNoActiveItems,
		// hasUserInteracted,
		// queueListLength: queueList.length,
		// isTrulyIdle,
		// statusChanged,
		// previousStatus: previousStatusRef.current,
		// })

		// Clear any existing timer first
		if (autoHideTimerRef.current) {
			clearTimeout(autoHideTimerRef.current)
			autoHideTimerRef.current = null
		}

		// Immediate hide conditions: No items to display and completed state
		const shouldHideImmediately =
			isCompleted &&
			hasNoActiveItems &&
			queueList.length === 0 &&
			!hasUserInteracted &&
			isTrulyIdle

		// Delayed hide conditions: Transition from searching to completed with items
		const shouldHideDelayed =
			isCompleted &&
			hasNoActiveItems &&
			!hasUserInteracted &&
			statusChanged &&
			previousStatusRef.current === t("tech.searching") &&
			hasCompletedItems

		if (shouldHideImmediately) {
			// console.log(
			// "[QueueStatusDisplay] Hiding immediately - no items to display",
			// )
			if (propIsVisible === undefined) {
				setInternalVisible(false)
			} else if (onVisibilityChange) {
				onVisibilityChange(false)
			}
		} else if (shouldHideDelayed) {
			// console.log("[QueueStatusDisplay] Setting delayed auto-hide timer")
			autoHideTimerRef.current = setTimeout(() => {
				// console.log("[QueueStatusDisplay] Auto-hiding component after delay")
				if (!hasUserInteracted) {
					if (propIsVisible === undefined) {
						setInternalVisible(false)
					} else if (onVisibilityChange) {
						onVisibilityChange(false)
					}
				}
			}, 4000)
		}

		previousStatusRef.current = currentTitle
	}, [
		queueList.length,
		hasUserInteracted,
		propIsVisible,
		onVisibilityChange,
		queueList.some,
		status.processing.papers,
		status.processing.trl,
		status.processing.useCases,
		status.queueLength,
		t,
	])

	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			if (autoHideTimerRef.current) {
				clearTimeout(autoHideTimerRef.current)
			}
			if (userInteractionTimerRef.current) {
				clearTimeout(userInteractionTimerRef.current)
			}
		}
	}, [])

	const QueList = useMemo(() => {
		const waiting = queueList.filter(
			(item: QueueItem) => item.status === "waiting",
		)
		const inprogress = queueList.filter(
			(item: QueueItem) => item.status === "fetching",
		)
		const done = queueList.filter((item: QueueItem) => item.status === "done")

		const Section = ({
			items,
			renderItem,
		}: {
			items: QueueItem[]
			renderItem: (item: QueueItem, idx: number) => JSX.Element
		}) =>
			items.length > 0 && (
				<>
					{items.map(renderItem)}
					<div className="h-2" />
				</>
			)
		const renderQueueItem = (
			item: QueueItem,
			index: number,
			section: string,
		) => {
			const maxTime =
				item.type === t("tech.paper_search")
					? 20
					: item.type === t("tech.trl_calc")
						? 120
						: 90
			const percent =
				section === "done"
					? 100
					: Math.min(100, Math.floor((item.elapsedSeconds / maxTime) * 100))
			const handleItemClick = (event: React.MouseEvent) => {
				event.preventDefault()
				event.stopPropagation()

				// Mark user interaction to prevent auto-hide
				setHasUserInteracted(true)
				// Reset user interaction after 10 seconds
				if (userInteractionTimerRef.current) {
					clearTimeout(userInteractionTimerRef.current)
				}
				userInteractionTimerRef.current = setTimeout(() => {
					setHasUserInteracted(false)
				}, 10000)

				if (onNodeSelect && item.nodeId) {
					onNodeSelect(item.nodeId)
				}
			}
			return (
				<div
					key={index}
					className={`border-b border-gray-200 pb-2 pt-1 flex items-center justify-between gap-2 rounded-sm px-2 transition-colors duration-150 ease-in-out ${
						onNodeSelect && item.nodeId
							? "cursor-pointer bg-white hover:bg-blue-50 active:bg-blue-100"
							: "bg-white"
					}`}
					onClick={handleItemClick}
					title={
						onNodeSelect && item.nodeId
							? t("tech.click_to_navigate", { name: item.name })
							: ""
					}
				>
					<div className="flex flex-col flex-1 pointer-events-none">
						<div className="flex items-center gap-1">
							<span className="text-[11px] text-gray-600 mb-[2px]">
								{item.type}
							</span>
							{onNodeSelect && item.nodeId && (
								<span
									className="text-blue-500 text-xs"
									title={t("tech.clickable")}
								>
									↗
								</span>
							)}
						</div>
						<span className="text-gray-800 font-medium">{item.name}</span>
					</div>
					<div className="flex flex-col items-center gap-1 pointer-events-none">
						{section === "waiting" && (
							<span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-[10px] font-semibold">
								{t("tech.waiting")}
							</span>
						)}
						{section === "fetching" && (
							<>
								<div className="w-8 h-8 relative">
									<svg
										className="absolute top-0 left-0 w-full h-full"
										viewBox="0 0 36 36"
									>
										<path
											className="text-gray-200"
											stroke="currentColor"
											strokeWidth="3.8"
											fill="none"
											d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
										/>
										<path
											className="text-blue-500"
											stroke="currentColor"
											strokeWidth="3.8"
											strokeDasharray={`${percent}, 100`}
											fill="none"
											d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
										/>
									</svg>
									<div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-[10px] text-gray-700">
										{percent}%
									</div>
								</div>
								<span className="text-gray-400 text-[10px]">
									{item.elapsedSeconds}s
								</span>
							</>
						)}
						{section === "done" && (
							<div className="w-8 h-8 relative">
								<svg
									className="absolute top-0 left-0 w-full h-full"
									viewBox="0 0 36 36"
								>
									<path
										className="text-gray-200"
										stroke="currentColor"
										strokeWidth="3.8"
										fill="none"
										d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
									/>
									<path
										className="text-blue-500"
										stroke="currentColor"
										strokeWidth="3.8"
										strokeDasharray={`100, 100`}
										fill="none"
										d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
									/>
								</svg>
								<div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-[8px] text-blue-600 font-bold">
									100%
								</div>
							</div>
						)}
					</div>
				</div>
			)
		}

		return (
			<CardContent className="max-h-64 overflow-y-auto text-xs space-y-2">
				<Section
					items={waiting}
					renderItem={(item: QueueItem, idx: number) =>
						renderQueueItem(item, idx, "waiting")
					}
				/>
				<Section
					items={inprogress}
					renderItem={(item: QueueItem, idx: number) =>
						renderQueueItem(item, idx, "fetching")
					}
				/>
				<Section
					items={done}
					renderItem={(item: QueueItem, idx: number) =>
						renderQueueItem(item, idx, "done")
					}
				/>
			</CardContent>
		)
	}, [queueList, onNodeSelect, t])

	if (!isVisible) {
		return null
	}

	return (
		<div className="fixed bottom-4 right-4 z-50">
			<Card
				className={`${
					isFolded ? "w-48" : "w-64"
				} animate-in slide-in-from-bottom-2 duration-200 transition-all`}
			>
				<CardHeader className="pb-2">
					<div className="flex items-start justify-between">
						<div className="flex flex-col items-start">
							<CardTitle
								className="text-left mb-1"
								style={{ fontSize: "13px", color: "#48485e" }}
							>
								{title}
							</CardTitle>
							{!isFolded && (
								<div className="flex gap-1 text-xs mt-2">
									<button
										className={`px-2 py-1 rounded ${
											activeTab === "queue"
												? "bg-[#eff6ff]"
												: "hover:bg-gray-100"
										}`}
										onClick={() => {
											setHasUserInteracted(true)
											if (userInteractionTimerRef.current) {
												clearTimeout(userInteractionTimerRef.current)
											}
											userInteractionTimerRef.current = setTimeout(() => {
												setHasUserInteracted(false)
											}, 10000)
											setActiveTab("queue")
										}}
									>
										{t("tech.each_search")}
									</button>
									<button
										className={`px-2 py-1 rounded ${
											activeTab === "summary"
												? "bg-[#eff6ff]"
												: "hover:bg-gray-100"
										}`}
										onClick={() => {
											setHasUserInteracted(true)
											if (userInteractionTimerRef.current) {
												clearTimeout(userInteractionTimerRef.current)
											}
											userInteractionTimerRef.current = setTimeout(() => {
												setHasUserInteracted(false)
											}, 10000)
											setActiveTab("summary")
										}}
									>
										{t("tech.overall")}
									</button>
								</div>
							)}
						</div>
						<div className="flex items-start gap-1 ml-2 -mt-[3px]">
							<button
								onClick={() => {
									setHasUserInteracted(true)
									if (userInteractionTimerRef.current) {
										clearTimeout(userInteractionTimerRef.current)
									}
									userInteractionTimerRef.current = setTimeout(() => {
										setHasUserInteracted(false)
									}, 10000)
									setIsFolded(!isFolded)
								}}
								className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-1 rounded hover:bg-gray-100"
								title={isFolded ? t("tech.expand") : t("tech.collapse")}
							>
								{isFolded ? (
									<ChevronDown className="w-4 h-4" />
								) : (
									<ChevronUp className="w-4 h-4" />
								)}
							</button>
							<button
								onClick={() => {
									if (onVisibilityChange) {
										onVisibilityChange(false)
									} else {
										setInternalVisible(false)
									}
								}}
								className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-1 rounded hover:bg-gray-100"
								title={t("tech.hide")}
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>
				</CardHeader>
				{!isFolded && (
					<>
						{activeTab === "summary" && (
							<CardContent className="text-xs space-y-2">
								<div className="flex items-center justify-between">
									<span>{t("tech.searching")}</span>
									<Badge
										variant={
											status.processing.papers +
												status.processing.useCases +
												status.processing.trl >
											0
												? "default"
												: "secondary"
										}
										className="font-normal"
									>
										{status.processing.papers +
											status.processing.useCases +
											status.processing.trl}
										{t("tech.count_suffix")}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span>{t("tech.paper_search_running")}</span>
									<Badge
										variant={
											status.processing.papers > 0 ? "default" : "secondary"
										}
										className="font-normal"
									>
										{status.processing.papers} / {status.maxConcurrent.papers}
										{t("tech.count_suffix")}
									</Badge>
								</div>

								<div className="flex items-center justify-between">
									<span>{t("tech.case_search_running")}</span>
									<Badge
										variant={
											status.processing.useCases > 0 ? "default" : "secondary"
										}
										className="font-normal"
									>
										{status.processing.useCases} /{" "}
										{status.maxConcurrent.useCases}
										{t("tech.count_suffix")}
									</Badge>
								</div>

								<div className="flex items-center justify-between">
									<span>{t("tech.trl_calc_running")}</span>
									<Badge
										variant={
											status.processing.trl > 0 ? "default" : "secondary"
										}
										className="font-normal"
									>
										{status.processing.trl} / {status.maxConcurrent.trl}
										{t("tech.count_suffix")}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span>{t("tech.search_waiting")}</span>
									<Badge
										variant={status.queueLength > 0 ? "default" : "secondary"}
										className="font-normal"
									>
										{status.queueLength}
										{t("tech.count_suffix")}
									</Badge>
								</div>

								{"consecutiveFailures" in status &&
									typeof (status as any).consecutiveFailures === "number" &&
									(status as any).consecutiveFailures > 0 && (
										<div className="flex items-center justify-between">
											<span>失敗数:</span>
											<Badge variant="destructive" className="font-normal">
												{(status as any).consecutiveFailures}
											</Badge>
										</div>
									)}

								<div className="text-gray-500 text-xs">
									Updated: {new Date(lastUpdate).toLocaleTimeString()}
								</div>
							</CardContent>
						)}
						{activeTab === "queue" && QueList}
					</>
				)}
			</Card>
		</div>
	)
}

export const QueueStatusDisplay = React.memo(QueueStatusDisplayComponent)
