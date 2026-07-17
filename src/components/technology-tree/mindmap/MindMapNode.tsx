import { Minus, Trash2 } from "lucide-react"

const TRL_META: Record<number, { label: string; bg: string }> = {
	1: { label: "基礎研究",   bg: "#feeeee" },
	2: { label: "基礎研究",   bg: "#feeeee" },
	3: { label: "基礎研究",   bg: "#feeeee" },
	4: { label: "実証段階",   bg: "#feffec" },
	5: { label: "実証段階",   bg: "#feffec" },
	6: { label: "実証段階",   bg: "#feffec" },
	7: { label: "商業化済み", bg: "#f1f7ff" },
	8: { label: "商業化済み", bg: "#f1f7ff" },
	9: { label: "商業化済み", bg: "#f1f7ff" },
}
function getTrlMeta(trl: number) {
	return TRL_META[trl] ?? TRL_META[3]
}
import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { getLevelColor as getUtilLevelColor } from "@/components/technology-tree/utils/levelColors"
import { useTreeUIStore } from "@/stores/treeUIStore"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useEnrichedData } from "@/hooks/useEnrichedData"
import {
	isPapersLoading,
	isTrlLoading,
	isUseCasesLoading,
} from "@/services/nodeEnrichmentService"
import type { MindMapNode } from "@/utils/mindMapDataTransform"
import { getLevelNames } from "@/utils/technologyTreeUtils"
import { NodeEnrichmentIndicator } from "../level-selection/node-components/NodeEnrichmentIndicator"
import { NodeLoadingIndicator } from "../level-selection/node-components/NodeLoadingIndicator"

interface MindMapNodeProps {
	node: MindMapNode
	layoutDirection: "horizontal" | "vertical"
	onClick: (nodeId: string, level: number) => void
	onEdit?: (
		level: string,
		nodeId: string,
		updatedNode: { title: string; description: string },
	) => void
	onDelete?: (level: string, nodeId: string) => void
	onAiAssist?: (nodeId: string, level: number) => void
	onToggleExpand?: (nodeId: string, isExpanded: boolean) => void
}

// Layout constants
const LAYOUT_CONSTANTS = {
	HORIZONTAL: {
		NODE_WIDTH: 280,
		NODE_HEIGHT: 100,
		HOVER_AREA_EXTRA_WIDTH: 52,
		HOVER_AREA_EXTRA_HEIGHT: 0,
		EDGE_LENGTH: 12,
		EDGE_THICKNESS: 2,
		BUTTON_OFFSET: 12,
	},
	VERTICAL: {
		NODE_WIDTH: 260,
		NODE_HEIGHT: 90,
		HOVER_AREA_EXTRA_WIDTH: 0,
		HOVER_AREA_EXTRA_HEIGHT: 36,
		EDGE_LENGTH: 8,
		EDGE_THICKNESS: 2,
		BUTTON_OFFSET: 8,
	},
	BUTTON: {
		SIZE: 32, // 8 * 4 (w-8 h-8)
		HALF_SIZE: 16, // SIZE / 2
	},
} as const

// Helper functions for styles
const getLevelColorClasses = (level: number) => {
	const colors = [
		"bg-[#f2f2f28c] border-[#c3c3c3] text-slate-900", // Root node (level 0)
		"bg-[#e8f1ff] border-[#90aff7] text-[#0d2965]", // Level 1
		"bg-[#effdfa] border-[#97d0ca] text-[#0b554f]", // Level 2
		"bg-[#f9f3ff] border-[#debbe0] text-[#362036]", // Level 3
		"bg-[#fffeef] border-[#d9d2bc] text-[#31250a]", // Level 4
		"bg-[#f4fafe] border-[#b2ddfa] text-[#242c4e]", // Level 5
		"bg-[#f5f7ff] border-[#bec8fd] text-[#2a247e]", // Level 6
		"bg-yellow-100 border-yellow-300 text-yellow-800", // Level 7
		"bg-red-100 border-red-300 text-red-800", // Level 8
		"bg-teal-100 border-teal-300 text-teal-800", // Level 9
		"bg-gray-100 border-gray-300 text-gray-800", // Level 10
	]
	return colors[level] || colors[colors.length - 1]
}

export const MindMapNodeComponent: React.FC<MindMapNodeProps> = ({
	node,
	layoutDirection,
	onClick,
	onDelete,
	onAiAssist,
	onToggleExpand,
}) => {
	const { toast } = useToast()
	const { subscribe, unsubscribe } = useEnrichedData(node.id)
	const trlColorMode = useTreeUIStore((s) => s.trlColorMode)
	const [isWholeAreaHovered, setIsWholeAreaHovered] = useState(false)
	const [isSubscribed, setIsSubscribed] = useState(false)
	const [isExpandButtonHovered, setIsExpandButtonHovered] = useState(false)

	// Cleanup subscription on unmount
	useEffect(() => {
		return () => {
			if (isSubscribed) {
				unsubscribe()
			}
		}
	}, [isSubscribed, unsubscribe])

	// Memoized calculations
	const layoutConfig =
		LAYOUT_CONSTANTS[layoutDirection.toUpperCase() as "HORIZONTAL" | "VERTICAL"]

	const trlBg = trlColorMode && node.trl !== undefined && !node.isSelected
		? getTrlMeta(node.trl).bg
		: undefined

	const nodeStyles = useMemo(
		() => ({
			width: layoutConfig.NODE_WIDTH,
			height: layoutConfig.NODE_HEIGHT,
			colorClasses: node.isSelected
				? "bg-[#2563eb] border-[#2563eb] text-white"
				: getLevelColorClasses(node.level),
		}),
		[layoutConfig, node.isSelected, node.level],
	)

	const nodeFlags = useMemo(
		() => ({
			isRoot: node.level === 0,
			isGenerating:
				typeof node.children_count === "number" &&
				node.children_count === 0 &&
				node.level === 1,
			showExpandButton:
				(node.hasChildrenInOriginalData || node.level > 0) &&
				(node.children_count || 0) > 0,
			loadingPapers: isPapersLoading(node.id),
			loadingUseCases: isUseCasesLoading(node.id),
			loadingTrl: isTrlLoading(node.id),
			showEnrichmentIndicator:
				isPapersLoading(node.id) || isUseCasesLoading(node.id),
		}),
		[node],
	)

	// Event handlers
	const handleClick = useCallback(() => {
		// Subscribe to enriched data on first click
		if (!isSubscribed) {
			subscribe()
			setIsSubscribed(true)
		}
		onClick(node.id, node.level)
	}, [node.id, node.level, onClick, subscribe, isSubscribed])

	const handleCopyTitle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			try {
				await navigator.clipboard.writeText(node.name)
				toast({
					title: "Title copied to clipboard",
					description: node.name,
				})
			} catch (_error) {
				toast({
					title: "Failed to copy title",
					description: "Please try again",
				})
			}
		},
		[node.name, toast],
	)

	const handleAiAssist = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation()
			onAiAssist?.(node.id, node.level)
		},
		[node.id, node.level, onAiAssist],
	)

	const handleDelete = useCallback(() => {
		onDelete?.(`level${node.level}`, node.id)
	}, [node.id, node.level, onDelete])

	const handleToggleExpand = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation()
			onToggleExpand?.(node.id, !node.isExpanded)
			// Reset hover state after click
			setIsWholeAreaHovered(false)
		},
		[node.id, node.isExpanded, onToggleExpand],
	)

	// Level badge information
	const levelBadgeInfo = useMemo(() => {
		const levelNames = getLevelNames("TED")

		if (node.level === 0) {
			return {
				text: `ルートノード`,
				className: `bg-[#f2f2f28c] text-slate-900 border border-[#c3c3c3] font-normal`,
			}
		}

		const levelColorInfo = getUtilLevelColor(node.level)
		const levelNameMap: Record<number, string> = {
			1: levelNames.level1,
			2: levelNames.level2,
			3: levelNames.level3,
			4: levelNames.level4,
		}
		const levelName = levelNameMap[node.level] || `Level ${node.level}`

		return {
			text: `レベル${node.level}:${levelName}`,
			className: `${levelColorInfo.bg} ${levelColorInfo.text} border ${levelColorInfo.border} font-normal`,
		}
	}, [node.level])

	const expandButtonColors = node.isSelected
		? "bg-white text-[#2563eb] border-[#2563eb] hover:bg-gray-50"
		: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"

	const errorColor = node.isSelected ? "text-white" : "text-gray"

	// Main node content with unified hover area
	const nodeContent = (
		// biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
		<div
			className="relative"
			onMouseEnter={() => setIsWholeAreaHovered(true)}
			onMouseLeave={() => setIsWholeAreaHovered(false)}
			style={{
				// Create a larger hover area that includes the button space
				position: "absolute",
				left: node.x,
				top: node.y,
				width: nodeStyles.width + layoutConfig.HOVER_AREA_EXTRA_WIDTH,
				height: nodeStyles.height + layoutConfig.HOVER_AREA_EXTRA_HEIGHT,
				// Make the extended area invisible but interactive
				pointerEvents: "auto",
			}}
		>
			{/* Main Node */}
			{/* biome-ignore lint/a11y/useSemanticElements: <explanation> */}
			<div
				className={`absolute transition-all duration-200 hover:shadow-lg ${
					nodeFlags.isRoot ? "cursor-default" : "cursor-pointer"
				}`}
				style={{
					left: 0,
					top: 0,
					width: nodeStyles.width,
					height: nodeStyles.height,
				}}
				onClick={handleClick}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault()
						handleClick()
					}
				}}
				aria-label={node.name}
			>
				<div
					className={`w-full h-full rounded-lg border flex flex-col justify-center relative ${nodeStyles.colorClasses} p-2`}
					style={trlBg ? { background: trlBg, borderColor: "#e5e7eb", color: "#374151" } : undefined}
				>
					{/* Node Title */}
					<div
						className={`${
							nodeFlags.isRoot ? "text-lg" : "text-[18px]"
						} font-medium break-words leading-tight text-center`}
						title={node.name}
					>
						{node.name}
					</div>

					{/* TRL badge */}
					{!nodeFlags.isRoot && node.trl !== undefined && (() => {
						const { label, bg } = getTrlMeta(node.trl)
						const badgeBg = trlColorMode ? bg : "transparent"
						const badgeColor = trlColorMode ? "text-gray-700" : "text-gray-500"
						return (
							<div className="flex justify-center mt-1">
								<span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeColor}`} style={{ background: badgeBg }}>
									TRL {node.trl} · {label}
								</span>
							</div>
						)
					})()}

					{/* Loading Indicators */}
					{nodeFlags.isGenerating && (
						<div className="mt-1">
							<NodeLoadingIndicator size="sm" />
						</div>
					)}

					{/* Enrichment Indicator */}
					<div className="mt-1">
						<NodeEnrichmentIndicator
							nodeId={node.id}
							size="sm"
							loadingPapers={nodeFlags.loadingPapers}
							loadingUseCases={nodeFlags.loadingUseCases}
							loadingTrl={nodeFlags.loadingTrl}
							textColor={errorColor}
						/>
					</div>

					{/* Delete button on hover for level 1 nodes */}
					{node.level === 1 && isWholeAreaHovered && (
						<div className="absolute bottom-1 right-1">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										onClick={(e) => e.stopPropagation()}
										className="h-7 w-7 p-0 bg-white/80 hover:bg-red-100 rounded-full shadow-sm"
										title="ノードを削除"
									>
										<Trash2 className="h-4 w-4 text-gray-500" />
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
										<AlertDialogDescription>
											ノード「{node.name}
											」を完全に削除します。この操作は元に戻すことができません。
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>キャンセル</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDelete}
											className="bg-red-600 hover:bg-red-700"
										>
											削除する
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					)}
				</div>
			</div>

			{/* Expand/Collapse Button with Edge */}
			{nodeFlags.showExpandButton && (
				<>
					{/* Button with smooth fade animation */}
					<div
						className="transition-opacity duration-300 ease-in-out"
						style={{
							opacity:
								!node.isExpanded || (node.isExpanded && isWholeAreaHovered)
									? 1
									: 0,
							pointerEvents:
								!node.isExpanded || (node.isExpanded && isWholeAreaHovered)
									? "auto"
									: "none",
						}}
					>
						{/* No separate hover area needed - handled by parent container */}

						{/* Edge connecting node to button */}
						<div
							className="absolute pointer-events-none transition-opacity duration-300"
							style={{
								left:
									layoutDirection === "horizontal"
										? nodeStyles.width
										: nodeStyles.width / 2 - layoutConfig.EDGE_THICKNESS / 2,
								top:
									layoutDirection === "horizontal"
										? nodeStyles.height / 2 - layoutConfig.EDGE_THICKNESS / 2
										: nodeStyles.height,
								width:
									layoutDirection === "horizontal"
										? `${layoutConfig.EDGE_LENGTH}px`
										: `${layoutConfig.EDGE_THICKNESS}px`,
								height:
									layoutDirection === "horizontal"
										? `${layoutConfig.EDGE_THICKNESS}px`
										: `${layoutConfig.EDGE_LENGTH}px`,
								background: node.isSelected ? "#2563eb" : "#d1d5db",
							}}
						/>

						{/* Expand/Collapse Button */}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleToggleExpand}
							onMouseEnter={() => setIsExpandButtonHovered(true)}
							onMouseLeave={() => setIsExpandButtonHovered(false)}
							className={`absolute h-8 w-8 p-0 rounded-full border shadow-md transition-all duration-300 z-10 ${expandButtonColors}`}
							style={{
								left:
									layoutDirection === "horizontal"
										? nodeStyles.width + layoutConfig.BUTTON_OFFSET
										: nodeStyles.width / 2 - LAYOUT_CONSTANTS.BUTTON.HALF_SIZE,
								top:
									layoutDirection === "horizontal"
										? nodeStyles.height / 2 - LAYOUT_CONSTANTS.BUTTON.HALF_SIZE
										: nodeStyles.height + layoutConfig.BUTTON_OFFSET,
							}}
							title={node.isExpanded ? "Collapse children" : "Expand children"}
						>
							{node.isExpanded ? (
								<Minus className="h-4 w-4" />
							) : (
								<span className="text-xs font-medium">
									{node.totalChildrenCount || node.children_count || "?"}
								</span>
							)}
						</Button>
					</div>
				</>
			)}
		</div>
	)

	// Tooltip content sections
	const tooltipContent = useMemo(() => {
		if (!node.description?.trim() || nodeFlags.isRoot) {
			return null
		}

		return (
			<TooltipContent side="right" className="max-w-xs bg-gray-50 pt-4">
				{/* Level Badge */}
				<div className="mb-3">
					<Badge variant="outline" className={levelBadgeInfo.className}>
						{levelBadgeInfo.text}
					</Badge>
				</div>

				{/* Description */}
				<p className="mb-3" style={{ fontSize: "18px", lineHeight: "1.6" }}>
					{node.description}
				</p>

				{/* Metrics Cards */}
				{/* <div className="flex gap-1 flex-wrap mb-4">
					<div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
						<span className="text-xs text-gray-800 font-medium">
							TAM: {insightsData.tam.currency}
							{formatLargeNumber(insightsData.tam.value)}
						</span>
					</div>

					<div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
						<span className="text-xs text-gray-800 font-medium">
							CAGR: {insightsData.cagr.value}%
						</span>
					</div>

					{trlStats?.average_trl !== undefined && (
						<div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
							<div className="flex items-center gap-1">
								<span className="text-xs text-gray-800 font-medium">
									TRL: {trlStats.average_trl.toFixed(1)}/9
								</span>
								<div className="flex items-center gap-px">
									{Array.from({ length: 9 }, (_, i) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											key={`trl-indicator-${i}`}
											className={`w-1 h-1 rounded-full ${
												i < Math.round(trlStats.average_trl)
													? "bg-blue-500"
													: "bg-blue-200"
											}`}
										/>
									))}
								</div>
							</div>
						</div>
					)}
				</div> */}

				{/* Action Buttons */}
				<div className="flex items-center justify-center gap-1 -mt-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleAiAssist}
						className="h-7 w-7 p-0"
						title="AI Assistant"
					>
						{/** biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							fill="#262626"
							viewBox="0 0 256 256"
							aria-label="AI Assistant"
						>
							<path d="M229.93,186.58A78,78,0,0,0,168.16,74.42,78,78,0,1,0,26.07,138.58L18.58,164A14,14,0,0,0,36,181.42l25.46-7.49a78,78,0,0,0,26.39,7.63,78,78,0,0,0,106.77,40.37L220,229.42A14,14,0,0,0,237.42,212ZM62,161.5a6.05,6.05,0,0,0-1.69.24l-27.77,8.17a2,2,0,0,1-2.48-2.48l8.17-27.77a6.05,6.05,0,0,0-.47-4.53,66,66,0,1,1,27.08,27.08A6,6,0,0,0,62,161.5Zm155.71,26.16,8.17,27.77a2,2,0,0,1-2.48,2.48l-27.77-8.17a6.06,6.06,0,0,0-4.53.47,66,66,0,0,1-90-28.4,77.92,77.92,0,0,0,71-94.68,66,66,0,0,1,46.07,96A6.05,6.05,0,0,0,217.74,187.66Z"></path>
						</svg>
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleCopyTitle}
						className="h-7 w-7 p-0"
						title="タイトルをコピー"
					>
						{/** biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							fill="#262626"
							viewBox="0 0 256 256"
							aria-label="タイトルをコピー"
						>
							<path d="M216,34H88a6,6,0,0,0-6,6V82H40a6,6,0,0,0-6,6V216a6,6,0,0,0,6,6H168a6,6,0,0,0,6-6V174h42a6,6,0,0,0,6-6V40A6,6,0,0,0,216,34ZM162,210H46V94H162Zm48-48H174V88a6,6,0,0,0-6-6H94V46H210Z"></path>
						</svg>
					</Button>
				</div>
			</TooltipContent>
		)
	}, [
		node.description,
		nodeFlags.isRoot,
		levelBadgeInfo,
		handleAiAssist,
		handleCopyTitle,
	])

	// Return with or without tooltip
	if (tooltipContent) {
		return (
			<Tooltip open={isExpandButtonHovered ? false : undefined}>
				<TooltipTrigger asChild>{nodeContent}</TooltipTrigger>
				{tooltipContent}
			</Tooltip>
		)
	}

	return nodeContent
}
