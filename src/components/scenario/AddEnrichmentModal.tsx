import { Check, ChevronDown, ChevronRight } from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AvailableEnrichment, MetricCategory } from "@/types/ui"

export type { AvailableEnrichment, MetricCategory } from "@/types/ui"

// Unified metrics definition - used by both filter and add column
// Note: labels/descriptions are intentionally kept in Japanese here as they are
// consumed by components that pass them through to the UI. The modal itself
// uses useTranslation for its surrounding chrome.
export const UNIFIED_METRICS: MetricCategory[] = [
	{
		id: "market",
		label: "市場指標",
		labelKey: "scenario.metrics.category_market",
		metrics: [
			{
				key: "tam",
				label: "TAM",
				description: "Total Addressable Market - 市場規模の指標",
				filterType: "select",
				selectOptions: [
					{
						value: "all",
						label: "すべて",
						labelKey: "scenario.metrics.opt_all",
					},
					{
						value: "large",
						label: "大 (>$10B)",
						labelKey: "scenario.metrics.opt_large_tam",
					},
					{
						value: "medium",
						label: "中 ($1B-$10B)",
						labelKey: "scenario.metrics.opt_medium_tam",
					},
					{
						value: "small",
						label: "小 (<$1B)",
						labelKey: "scenario.metrics.opt_small_tam",
					},
				],
			},
			{
				key: "cagr",
				label: "CAGR",
				description: "年平均成長率 - 市場成長率の指標",
				filterType: "range",
				rangeConfig: { min: 0, max: 100, unit: "%" },
			},
			{
				key: "marketGrowthRate",
				label: "市場成長率",
				labelKey: "scenario.columns.market_growth_rate",
				description: "年間成長率 (%)",
				filterType: "range",
				rangeConfig: { min: 0, max: 100, unit: "%" },
			},
			{
				key: "marketSize",
				label: "市場規模",
				labelKey: "scenario.metrics.market_size",
				description: "（大7→小1）",
				filterType: "range",
				rangeConfig: { min: 1, max: 7 },
			},
			{
				key: "competitiveness",
				label: "競合把握",
				labelKey: "scenario.columns.competitiveness",
				description: "独占・寡占・分散",
				filterType: "select",
				selectOptions: [
					{
						value: "all",
						label: "すべて",
						labelKey: "scenario.metrics.opt_all",
					},
					{
						value: "monopoly",
						label: "独占",
						labelKey: "scenario.metrics.opt_monopoly",
					},
					{
						value: "oligopoly",
						label: "寡占",
						labelKey: "scenario.metrics.opt_oligopoly",
					},
					{
						value: "dispersed",
						label: "分散",
						labelKey: "scenario.metrics.opt_dispersed",
					},
				],
			},
		],
	},
	{
		id: "technical",
		label: "技術指標",
		labelKey: "scenario.metrics.category_technical",
		metrics: [
			{
				key: "trl",
				label: "TRL",
				description: "Technology Readiness Level - 技術成熟度",
				filterType: "range",
				rangeConfig: { min: 1, max: 9 },
			},
			{
				key: "technologicalAdvantage",
				label: "技術的優位性",
				labelKey: "scenario.columns.technological_advantage",
				description: "技術的な競争優位性",
				filterType: "select",
				selectOptions: [
					{
						value: "all",
						label: "すべて",
						labelKey: "scenario.metrics.opt_all",
					},
					{ value: "low", label: "低", labelKey: "scenario.difficulty.low" },
					{
						value: "medium",
						label: "中",
						labelKey: "scenario.difficulty.medium",
					},
					{ value: "high", label: "高", labelKey: "scenario.difficulty.high" },
				],
			},
			{
				key: "implementationDifficulty",
				label: "実装難易度",
				labelKey: "scenario.columns.implementation_difficulty",
				description: "技術実装の難しさ",
				filterType: "select",
				selectOptions: [
					{
						value: "all",
						label: "すべて",
						labelKey: "scenario.metrics.opt_all",
					},
					{ value: "low", label: "低", labelKey: "scenario.difficulty.low" },
					{
						value: "medium",
						label: "中",
						labelKey: "scenario.difficulty.medium",
					},
					{ value: "high", label: "高", labelKey: "scenario.difficulty.high" },
				],
			},
			{
				key: "timeToMarket",
				label: "市場投入時間",
				labelKey: "scenario.columns.time_to_market",
				description: "製品化までの期間",
				filterType: "select",
				selectOptions: [
					{
						value: "all",
						label: "すべて",
						labelKey: "scenario.metrics.opt_all",
					},
					{
						value: "short",
						label: "短期 (<1年)",
						labelKey: "scenario.metrics.opt_short_time",
					},
					{
						value: "medium",
						label: "中期 (1-3年)",
						labelKey: "scenario.metrics.opt_medium_time",
					},
					{
						value: "long",
						label: "長期 (>3年)",
						labelKey: "scenario.metrics.opt_long_time",
					},
				],
			},
			{
				key: "substitutability",
				label: "代替性",
				labelKey: "scenario.metrics.substitutability",
				description: "代替技術の存在度",
				filterType: "select",
				selectOptions: [
					{
						value: "all",
						label: "すべて",
						labelKey: "scenario.metrics.opt_all",
					},
					{ value: "high", label: "高", labelKey: "scenario.difficulty.high" },
					{
						value: "medium",
						label: "中",
						labelKey: "scenario.difficulty.medium",
					},
					{ value: "low", label: "低", labelKey: "scenario.difficulty.low" },
				],
			},
		],
	},
	{
		id: "research",
		label: "研究指標",
		labelKey: "scenario.metrics.category_research",
		metrics: [
			{
				key: "paperCagr",
				label: "論文CAGR",
				labelKey: "scenario.columns.paper_cagr",
				descriptionKey: "scenario.columns.paper_cagr_desc",
				filterType: "range",
				rangeConfig: { min: 0, max: 100, unit: "%" },
			},
			{
				key: "paperCount",
				label: "論文数",
				labelKey: "scenario.columns.paper_count",
				description: "関連研究論文数",
				filterType: "range",
				rangeConfig: { min: 0 },
			},
			{
				key: "patentCount",
				label: "特許数",
				labelKey: "scenario.columns.patent_count",
				description: "関連特許件数",
				filterType: "range",
				rangeConfig: { min: 0 },
			},
			{
				key: "implementationCount",
				label: "事例数",
				labelKey: "scenario.columns.implementation_count",
				description: "市場実装事例数",
				filterType: "range",
				rangeConfig: { min: 0 },
			},
		],
	},
]

// Helper to get all metrics as flat array
export const getAllMetrics = (): AvailableEnrichment[] => {
	return UNIFIED_METRICS.flatMap((category) =>
		category.metrics.map((m) => ({ ...m, category: category.label })),
	)
}

// Helper to get metric by key
export const getMetricByKey = (
	key: string,
): AvailableEnrichment | undefined => {
	for (const category of UNIFIED_METRICS) {
		const metric = category.metrics.find((m) => m.key === key)
		if (metric) return { ...metric, category: category.label }
	}
	return undefined
}

const canonicalizeKey = (key: string) => {
	if (key === "papers") return "paperCount"
	if (key === "patents") return "patentCount"
	if (key === "useCaseCount" || key === "implementation")
		return "implementationCount"
	if (key === "marketCagr") return "cagr"
	return key
}

interface AddEnrichmentModalProps {
	isOpen: boolean
	onClose: () => void
	availableEnrichments?: AvailableEnrichment[]
	existingColumnKeys: string[]
	onToggleEnrichment: (enrichmentKey: string, enabled: boolean) => void
}

export const AddEnrichmentModal: React.FC<AddEnrichmentModalProps> = ({
	isOpen,
	onClose,
	availableEnrichments,
	existingColumnKeys,
	onToggleEnrichment,
}) => {
	const { t } = useTranslation()
	const [selectedEnrichmentKeys, setSelectedEnrichmentKeys] = useState<
		string[]
	>([])
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(UNIFIED_METRICS.map((c) => c.id)),
	)

	const existingKeyAliases: Record<string, string[]> = {
		implementationCount: ["useCaseCount", "implementation"],
		paperCount: ["papers"],
		patentCount: ["patents"],
		cagr: ["marketCagr"],
	}

	const isMetricSelected = (key: string) =>
		selectedEnrichmentKeys.includes(canonicalizeKey(key))

	const isMetricExisting = (key: string) => {
		if (existingColumnKeys.includes(key)) return true
		const aliases = existingKeyAliases[key] ?? []
		return aliases.some((alias) => existingColumnKeys.includes(alias))
	}
	const baseMetrics = [
		{
			key: "summary",
			label: t("scenario.custom_view.base_col_summary"),
			description: t("scenario.custom_view.base_col_summary_desc"),
		},
		{
			key: "globalTam",
			label: t("scenario.columns.global_tam"),
			description: t("scenario.custom_view.base_col_global_tam_desc"),
		},
		{
			key: "techCharacteristics",
			label: t("scenario.columns.tech_characteristics"),
			description: t("scenario.custom_view.base_col_tech_characteristics_desc"),
		},
	]

	const wasOpenRef = useRef(false)
	const existingColumnKeysRef = useRef(existingColumnKeys)
	existingColumnKeysRef.current = existingColumnKeys
	useEffect(() => {
		if (isOpen && !wasOpenRef.current) {
			setSelectedEnrichmentKeys(
				Array.from(
					new Set(
						existingColumnKeysRef.current.map((key) => canonicalizeKey(key)),
					),
				),
			)
		}
		wasOpenRef.current = isOpen
	}, [isOpen])

	const toggleCategory = (categoryId: string) => {
		setExpandedCategories((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(categoryId)) {
				newSet.delete(categoryId)
			} else {
				newSet.add(categoryId)
			}
			return newSet
		})
	}

	const handleAdd = () => {
		const allKeys = [
			...baseMetrics.map((metric) => metric.key),
			...UNIFIED_METRICS.flatMap((category) =>
				category.metrics.map((metric) => metric.key),
			),
		]
		const uniqueKeys = Array.from(new Set(allKeys))
		const resolveActualKey = (key: string) => {
			if (existingColumnKeys.includes(key)) return key
			if (key === "paperCount" && existingColumnKeys.includes("papers"))
				return "papers"
			if (key === "patentCount" && existingColumnKeys.includes("patents"))
				return "patents"
			if (key === "implementationCount") {
				if (existingColumnKeys.includes("useCaseCount")) return "useCaseCount"
				if (existingColumnKeys.includes("implementation"))
					return "implementation"
			}
			if (key === "cagr" && existingColumnKeys.includes("marketCagr"))
				return "marketCagr"
			return key
		}
		for (const key of uniqueKeys) {
			const wasSelected = isMetricExisting(key)
			const isSelected = isMetricSelected(key)
			if (wasSelected !== isSelected) {
				onToggleEnrichment(resolveActualKey(key), isSelected)
			}
		}
		onClose()
	}

	const hasChanges = (() => {
		const allKeys = [
			...baseMetrics.map((metric) => metric.key),
			...UNIFIED_METRICS.flatMap((category) =>
				category.metrics.map((metric) => metric.key),
			),
		]
		const uniqueKeys = Array.from(new Set(allKeys))
		return uniqueKeys.some(
			(key) => isMetricExisting(key) !== isMetricSelected(key),
		)
	})()

	const handleClose = () => {
		setSelectedEnrichmentKeys(
			Array.from(
				new Set(existingColumnKeys.map((key) => canonicalizeKey(key))),
			),
		)
		onClose()
	}

	const enrichmentByKey = new Map(
		(availableEnrichments ?? []).map((enrichment) => [
			enrichment.key,
			enrichment,
		]),
	)
	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="text-base">
						{t("scenario.enrichment_modal.title")}
					</DialogTitle>
					<DialogDescription className="text-xs">
						{t("scenario.enrichment_modal.description")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-2 max-h-[400px] overflow-y-auto">
					<div className="border rounded-lg">
						<div className="w-full flex items-center gap-2 px-3 py-2 text-left">
							<span className="text-sm font-medium text-gray-700">
								{t("scenario.custom_view.base_items")}
							</span>
							<span className="text-xs text-gray-400 ml-auto">
								{baseMetrics.filter((m) => isMetricSelected(m.key)).length}/
								{baseMetrics.length}
								{t("scenario.enrichment_modal.items_suffix")}
							</span>
						</div>

						<div className="px-3 pb-2 grid grid-cols-2 gap-2">
							{baseMetrics.map((metric) => {
								const isSelected = isMetricSelected(metric.key)
								return (
									<TooltipProvider key={metric.key}>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													onClick={() => {
														const canonicalKey = canonicalizeKey(metric.key)
														setSelectedEnrichmentKeys((prev) =>
															prev.includes(canonicalKey)
																? prev.filter((key) => key !== canonicalKey)
																: [...prev, canonicalKey],
														)
													}}
													className={`text-left px-3 py-2 rounded-md border transition-colors ${
														isSelected
															? "border-blue-500 bg-blue-50"
															: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
													}`}
												>
													<div className="flex items-center justify-between gap-1">
														<span className="text-xs font-medium truncate">
															{metric.label}
														</span>
														{isSelected ? (
															<Check
																className={`h-3 w-3 flex-shrink-0 ${isMetricExisting(metric.key) ? "text-green-500" : "text-blue-600"}`}
															/>
														) : null}
													</div>
												</button>
											</TooltipTrigger>
											<TooltipContent>
												<p className="text-xs">{metric.description}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)
							})}
						</div>
					</div>

					{UNIFIED_METRICS.map((category) => {
						const isExpanded = expandedCategories.has(category.id)
						const selectedCount = category.metrics.filter((m) =>
							isMetricSelected(m.key),
						).length

						return (
							<div key={category.id} className="border rounded-lg">
								{/* Category Header */}
								<button
									type="button"
									onClick={() => toggleCategory(category.id)}
									className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
								>
									{isExpanded ? (
										<ChevronDown className="h-4 w-4 text-gray-500" />
									) : (
										<ChevronRight className="h-4 w-4 text-gray-500" />
									)}
									<span className="text-sm font-medium text-gray-700">
										{category.labelKey ? t(category.labelKey) : category.label}
									</span>
									<span className="text-xs text-gray-400 ml-auto">
										{selectedCount}/{category.metrics.length}
										{t("scenario.enrichment_modal.items_suffix")}
									</span>
								</button>

								{/* Category Metrics */}
								{isExpanded && (
									<div className="px-3 pb-2 grid grid-cols-2 gap-2">
										{category.metrics.map((metric) => {
											const enrichment = enrichmentByKey.get(metric.key)
											const isComingSoon = enrichment?.comingSoon === true
											const isSelected = isMetricSelected(metric.key)
											const isDisabled = isComingSoon
											return (
												<TooltipProvider key={metric.key}>
													<Tooltip>
														<TooltipTrigger asChild>
															<button
																type="button"
																onClick={() => {
																	if (isDisabled) return
																	const canonicalKey = canonicalizeKey(
																		metric.key,
																	)
																	setSelectedEnrichmentKeys((prev) =>
																		prev.includes(canonicalKey)
																			? prev.filter(
																					(key) => key !== canonicalKey,
																				)
																			: [...prev, canonicalKey],
																	)
																}}
																disabled={isDisabled}
																className={`text-left px-3 py-2 rounded-md border transition-colors ${
																	isDisabled
																		? "border-gray-200 bg-gray-50 cursor-not-allowed"
																		: isSelected
																			? "border-blue-500 bg-blue-50"
																			: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
																}`}
															>
																<div className="flex items-center justify-between gap-1">
																	<span
																		className={`text-xs font-medium truncate ${isDisabled ? "text-gray-400" : ""}`}
																	>
																		{metric.labelKey
																			? t(metric.labelKey)
																			: metric.label}
																	</span>
																	{isComingSoon ? (
																		<span className="text-[10px] text-gray-400">
																			{t("common.coming_soon")}
																		</span>
																	) : isSelected ? (
																		<Check
																			className={`h-3 w-3 flex-shrink-0 ${isMetricExisting(metric.key) ? "text-green-500" : "text-blue-600"}`}
																		/>
																	) : null}
																</div>
															</button>
														</TooltipTrigger>
														<TooltipContent>
															<p className="text-xs">
																{isSelected && isMetricExisting(metric.key)
																	? t("scenario.enrichment_modal.already_added")
																	: isComingSoon
																		? t("common.coming_soon")
																		: metric.descriptionKey
																			? t(metric.descriptionKey)
																			: metric.description}
															</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											)
										})}
									</div>
								)}
							</div>
						)
					})}
				</div>

				<div className="flex justify-end gap-2 pt-3 border-t">
					<Button variant="outline" size="sm" onClick={handleClose}>
						{t("scenario.enrichment_modal.cancel")}
					</Button>
					<Button size="sm" onClick={handleAdd} disabled={!hasChanges}>
						{t("scenario.enrichment_modal.apply")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
