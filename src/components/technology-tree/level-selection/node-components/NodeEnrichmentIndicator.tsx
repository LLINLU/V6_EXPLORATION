import { Clock, Loader2, RotateCcw } from "lucide-react"
import type React from "react"
import { useEnrichmentQueue } from "@/hooks/useEnrichmentQueue"

interface NodeEnrichmentIndicatorProps {
	nodeId?: string
	showTime?: boolean
	size?: "sm" | "md" | "lg"
	loadingPapers?: boolean
	loadingUseCases?: boolean
	loadingTrl?: boolean
	textColor: string
}

export const NodeEnrichmentIndicator: React.FC<
	NodeEnrichmentIndicatorProps
> = ({
	nodeId,
	showTime = true,
	size = "sm",
	loadingPapers = false,
	loadingUseCases = false,
	loadingTrl = false,
	textColor = "text-gray-100",
}) => {
	const sizeClasses = size === "sm" ? "h-4 w-4" : "h-5 w-5"
	const textSizeClass = size === "sm" ? "text-xs" : "text-sm"

	// Use queue system if nodeId is provided, otherwise fall back to legacy props
	const queueStatus = useEnrichmentQueue(nodeId || null)

	// Determine what to show based on queue status or legacy props
	const showQueueStatus = showTime
	const actualLoadingPapers = showQueueStatus
		? queueStatus.isPapersLoading
		: loadingPapers
	const actualLoadingUseCases = showQueueStatus
		? queueStatus.isUseCasesLoading
		: loadingUseCases
	const actualLoadingTrl = showQueueStatus
		? queueStatus.isTrlLoading
		: loadingTrl
	const isWaiting = showQueueStatus ? queueStatus.isWaiting : false
	const hasError = showQueueStatus ? queueStatus.hasError : false

	// Don't show anything if nothing is happening
	if (
		!actualLoadingPapers &&
		!actualLoadingUseCases &&
		!actualLoadingTrl &&
		!isWaiting &&
		!hasError
	) {
		return null
	}

	// Handle error states
	if (hasError) {
		return (
			<div className="flex items-center justify-center">
				<RotateCcw className={`mr-2 ${sizeClasses}`} />
				<span className={`${textSizeClass} font-semibold ${textColor}`}>
					ページを更新してください
				</span>
			</div>
		)
	}

	// Handle waiting state
	if (
		isWaiting &&
		!actualLoadingPapers &&
		!actualLoadingUseCases &&
		!actualLoadingTrl
	) {
		return (
			<div className="flex items-center justify-center text-yellow-600">
				<Clock className={`mr-2 ${sizeClasses}`} />
				<span className={`${textSizeClass} font-semibold`}>待機中</span>
			</div>
		)
	}

	// Build the loading message based on what's being loaded
	let loadingMessage = ""
	const loadingTypes = []
	if (actualLoadingPapers) loadingTypes.push("論文")
	if (actualLoadingUseCases) loadingTypes.push("事例")
	if (actualLoadingTrl) loadingTypes.push("TRL")

	if (loadingTypes.length > 0) {
		loadingMessage = `${loadingTypes.join("・")}を検索中`
	} else {
		// This shouldn't happen, but fallback to general message
		loadingMessage = "データを検索中"
	}

	// Show elapsed time if available
	let elapsedTime = ""
	if (showQueueStatus) {
		if (actualLoadingPapers) {
			elapsedTime = queueStatus.formatElapsedTime(queueStatus.papersElapsedTime)
		} else if (actualLoadingUseCases) {
			elapsedTime = queueStatus.formatElapsedTime(
				queueStatus.useCasesElapsedTime,
			)
		} else if (actualLoadingTrl) {
			elapsedTime = queueStatus.formatElapsedTime(queueStatus.trlElapsedTime)
		}
	}

	return (
		<div className="flex items-center justify-center text-white">
			<Loader2 className={`animate-spin mr-2 ${sizeClasses}`} />
			<span className={`${textSizeClass} font-semibold`}>
				{loadingMessage}
				{<span className="ml-1 text-white">({elapsedTime})</span>}
			</span>
		</div>
	)
}
