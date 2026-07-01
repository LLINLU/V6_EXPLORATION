import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Check,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Copy,
	Download,
	Edit,
	FileText,
	GripVertical,
	HelpCircle,
	ListFilter,
	Loader2,
	MoreVertical,
	Plus,
	Settings2,
	Trash2,
	X,
} from "lucide-react"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { THEME_TRL_DEFS } from "@/components/scenario/report/theme/constants"
import { TechCharacteristicsDialog } from "@/components/TechCharacteristicsTable"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import type { TechCharacteristic } from "@/types/axis"
import type { Scenario as BaseScenario, FilterState } from "@/types/scenario"
import { exportToCsv } from "@/utils/csvExport"
import {
	AddEnrichmentModal,
	getAllMetrics,
	UNIFIED_METRICS,
} from "./AddEnrichmentModal"
import { CustomViewModal } from "./CustomViewModal"
import { EditScenarioModal } from "./EditScenarioModal"
import { ScenarioMindmap } from "./ScenarioMindmap"
import { TRLModal } from "./TRLModal"

/**
 * Keep your existing type imports if they already exist elsewhere.
 * These local types are only here to make the file self-contained.
 */

type ViewMode = "overview" | "market" | "research" | `custom_${string}`

type ScenarioValue = string | number | null | undefined

type SortDirection = "asc" | "desc"

type ManualScenarioInput = {
	name: string
	summary: string
}

type AvailableEnrichment = {
	key: string
	label: string
	description?: string
	category?: string
	isAvailable?: boolean
	comingSoon?: boolean
}

type AvailableColumn = {
	key: string
	label: string
}

type Scenario = BaseScenario

type SortCriterion = {
	id: string
	column: string
	direction: SortDirection
}

type CustomView = {
	id: string
	name: string
	columnKeys: string[]
}

type ColumnDefinition = {
	key: string
	label: string
	width?: string
	maxWidth?: string
	sortable?: boolean
	filterable?: boolean
	accessor: (scenario: Scenario) => ScenarioValue
}

type ScenarioTableViewProps = {
	scenarios: Scenario[]
	selectedScenarioIds: string[]
	technicalStrengths?: TechnicalStrength[]
	onToggleScenario: (scenarioId: string) => void
	onSelectAll?: () => void
	onSelectNone?: () => void
	onSaveScenario?: (updatedScenario: Scenario) => void
	onRegenerateScenario?: (
		scenarioId: string,
		mode: "converge" | "diverge",
	) => void
	filters?: FilterState
	onFilterChange?: (filters: FilterState) => void
	availableTags?: string[]
	onGenerateTree?: () => void
	isGenerating?: boolean
	generationProgress?: { current: number; total: number } | null
	generationSuccess?: boolean
	scenariosWithTrees?: string[]
	selectedTechCharacteristics?: TechCharacteristic[]
	onRowClick?: (scenario: Scenario) => void
	onRowClickWithTab?: (scenario: Scenario, tab: string) => void
	activeScenarioId?: string | null
	searchTheme?: string
	onAddScenario?: (context: string) => Promise<void>
	onAddManualScenario?: (input: ManualScenarioInput) => void | Promise<void>
	onLoadMoreScenarios?: () => Promise<void>
	displayMode?: "table" | "mindmap"
	onDisplayModeChange?: (mode: "table" | "mindmap") => void
	treeData?: {
		level1Items: any[]
		level2Items: Record<string, any[]>
		level3Items: Record<string, any[]>
		level4Items: Record<string, any[]>
		level5Items: Record<string, any[]>
		level6Items: Record<string, any[]>
		level7Items: Record<string, any[]>
		level8Items: Record<string, any[]>
		level9Items: Record<string, any[]>
		level10Items: Record<string, any[]>
		levelNames: Record<string, string>
		mode?: string
	} | null
	isLoadingTree?: boolean
	onResearchPanelChange?: (
		isVisible: boolean,
		nodeData?: {
			id: string
			title: string
			description?: string
			level: number
		},
	) => void
	onAiAssist?: (
		nodeId?: string,
		nodeTitle?: string,
		nodeDescription?: string,
		level?: number,
	) => void
	isLoadingMoreScenarios?: boolean
	treeId?: string
	treeMode?: string
	isLoadingScenarios?: boolean
	scenarioStage?: string
	onClearFilters?: () => void
	onRetryGeneration?: () => void
}

const DEFAULT_FILTERS: FilterState = {
	tamCategories: [],
	trlCategories: [],
	cagrCategories: [],
	tamCategory: "all",
	trlCategory: "all",
	cagrCategory: "all",
	implementationDifficulty: "all",
	timeToMarket: "all",
	minPaperCount: 0,
	maxPaperCount: undefined,
	minPatentCount: 0,
	maxPatentCount: undefined,
	minImplementationCount: 0,
	maxImplementationCount: undefined,
	minCompetitiveness: 0,
	maxCompetitiveness: 10,
	selectedTags: [],
}

const getNumber = (value: unknown): number | null => {
	return typeof value === "number" && !Number.isNaN(value) ? value : null
}

const getNumberish = (value: unknown): number | null => {
	const numeric = getNumber(value)
	if (numeric != null) return numeric

	if (typeof value === "string") {
		const matched = value.match(/-?\d+(?:\.\d+)?/)
		if (!matched) return null
		const parsed = Number(matched[0])
		return Number.isNaN(parsed) ? null : parsed
	}

	return null
}

const pickNumber = (...values: unknown[]): number | null => {
	for (const value of values) {
		const numeric = getNumberish(value)
		if (numeric != null) return numeric
	}

	return null
}

const getString = (value: unknown): string | null => {
	return typeof value === "string" && value.trim() !== "" ? value : null
}

const formatCompactNumber = (value: number | null | undefined) => {
	if (value == null) return "—"
	return new Intl.NumberFormat("en", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value)
}

const formatPercent = (value: number | null | undefined) => {
	if (value == null) return "—"
	return `${value}%`
}

type TechTagInfo = {
	name: string
	description?: string
	potential_applications?: string
}

const normalizeTechCharacteristicsDetailed = (
	scenario: Scenario,
): TechTagInfo[] => {
	const raw = scenario.techCharacteristics
	if (!Array.isArray(raw) || raw.length === 0) return []

	return raw
		.map((item): TechTagInfo | null => {
			if (typeof item === "string") return item ? { name: item } : null
			if (item && typeof item === "object") {
				const name = item.name || item.label || ""
				if (!name) return null
				return {
					name,
					description: item.description,
					potential_applications: item.potential_applications,
				}
			}
			return null
		})
		.filter((v): v is TechTagInfo => v !== null)
}

const normalizeTechCharacteristicsArray = (scenario: Scenario): string[] => {
	return normalizeTechCharacteristicsDetailed(scenario).map((t) => t.name)
}

const normalizeTechCharacteristics = (scenario: Scenario): string | null => {
	const values = normalizeTechCharacteristicsArray(scenario)
	return values.length > 0 ? values.join(", ") : null
}

const getScenarioPaperCagrMeta = (scenario: Scenario) => {
	const metrics = scenario.metrics ?? {}

	return metrics.papers?.cagrMeta ?? null
}

const getScenarioMetricValue = (
	scenario: Scenario,
	key: string,
): ScenarioValue => {
	const metrics = scenario.metrics ?? {}
	const analysisData = (scenario as any).analysisData ?? {}
	const preanalyzeMarket = analysisData.preanalyze?.market
	const analyzedMarket = analysisData.analyze_market?.data

	switch (key) {
		case "name":
			return getString(scenario.userInput?.name) ?? getString(scenario.name)

		case "summary":
			return (
				getString(scenario.userInput?.summary) ??
				getString(scenario.description)
			)

		case "tam":
			return pickNumber(
				metrics.tam,
				metrics.marketSizing?.global?.tam?.value,
				preanalyzeMarket?.tam?.value,
				analyzedMarket?.tam?.value,
			)

		case "cagr":
			return pickNumber(
				metrics.cagr,
				metrics.marketSizing?.cagr?.value,
				preanalyzeMarket?.projection?.cagr_percent,
				preanalyzeMarket?.tam?.cagr,
				analyzedMarket?.cagr?.value,
			)

		case "trl":
			return getNumber(metrics.trl)

		case "domesticTam":
			return pickNumber(metrics.marketSizing?.domestic?.tam?.value)

		case "domesticSam":
			return pickNumber(metrics.marketSizing?.domestic?.sam?.value)

		case "globalTam":
			return pickNumber(
				metrics.marketSizing?.global?.tam?.value,
				metrics.tam,
				preanalyzeMarket?.tam?.value,
				analyzedMarket?.tam?.value,
			)

		case "globalSam":
			return pickNumber(
				metrics.marketSizing?.global?.sam?.value,
				analyzedMarket?.sam?.value,
			)

		case "marketCagr":
			return pickNumber(
				metrics.marketSizing?.cagr?.value,
				metrics.cagr,
				preanalyzeMarket?.projection?.cagr_percent,
				preanalyzeMarket?.tam?.cagr,
				analyzedMarket?.cagr?.value,
			)

		case "marketStructure":
			return getString(
				metrics.marketSizing?.marketStructure ??
					(metrics.marketSizing as any)?.structure?.value,
			)

		case "papers":
		case "paperCount":
			return getNumber(metrics.papers?.count ?? metrics.paperCount)

		case "paperCagr":
			return getNumber(metrics.papers?.cagr)

		case "patents":
		case "patentCount":
			return getNumber(metrics.patents?.count ?? metrics.patentCount)

		case "patentCagr":
			return getNumber(metrics.patents?.cagr)

		case "implementation":
		case "implementationCount":
		case "useCaseCount":
			return getNumber(metrics.useCases?.count ?? metrics.implementationCount)

		case "useCaseCagr":
			return getNumber(metrics.useCases?.cagr)

		case "marketGrowthRate":
			return getNumber(metrics.marketGrowthRate)

		case "competitiveness":
			return getNumber(metrics.competitiveness)

		case "implementationDifficulty":
			return getString(metrics.implementationDifficulty)

		case "timeToMarket":
			return getString(metrics.timeToMarket)

		case "techCharacteristics":
			return normalizeTechCharacteristics(scenario)

		case "technologicalAdvantage":
			return scenario.technologicalAdvantage?.rating ?? null

		default:
			return null
	}
}

const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
	name: {
		key: "name",
		label: "Scenario",
		width: "200px",
		accessor: (scenario) => getScenarioMetricValue(scenario, "name"),
	},
	summary: {
		key: "summary",
		label: "Summary",
		width: "320px",
		accessor: (scenario) => getScenarioMetricValue(scenario, "summary"),
	},

	tam: {
		key: "tam",
		label: "TAM",
		width: "90px",
		sortable: true,
		filterable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "tam"),
	},
	cagr: {
		key: "cagr",
		label: "CAGR",
		width: "70px",
		sortable: true,
		filterable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "cagr"),
	},
	trl: {
		key: "trl",
		label: "TRL",
		width: "70px",
		sortable: true,
		filterable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "trl"),
	},

	domesticTam: {
		key: "domesticTam",
		label: "scenario.columns.domestic_tam",
		width: "100px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "domesticTam"),
	},
	domesticSam: {
		key: "domesticSam",
		label: "scenario.columns.domestic_sam",
		width: "90px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "domesticSam"),
	},
	globalTam: {
		key: "globalTam",
		label: "scenario.columns.global_tam",
		width: "100px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "globalTam"),
	},
	globalSam: {
		key: "globalSam",
		label: "scenario.columns.global_sam",
		width: "90px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "globalSam"),
	},
	marketCagr: {
		key: "marketCagr",
		label: "CAGR",
		width: "70px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "marketCagr"),
	},

	papers: {
		key: "papers",
		label: "scenario.columns.paper_count",
		width: "70px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "papers"),
	},
	paperCount: {
		key: "paperCount",
		label: "scenario.columns.paper_count",
		width: "70px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "paperCount"),
	},
	paperCagr: {
		key: "paperCagr",
		label: "scenario.columns.paper_cagr",
		width: "90px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "paperCagr"),
	},

	patents: {
		key: "patents",
		label: "scenario.columns.patent_count",
		width: "70px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "patents"),
	},
	patentCount: {
		key: "patentCount",
		label: "scenario.columns.patent_count",
		width: "70px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "patentCount"),
	},
	patentCagr: {
		key: "patentCagr",
		label: "scenario.columns.patent_cagr",
		width: "90px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "patentCagr"),
	},

	implementation: {
		key: "implementation",
		label: "scenario.columns.implementation_count",
		width: "70px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "implementation"),
	},
	implementationCount: {
		key: "implementationCount",
		label: "scenario.columns.implementation_count",
		width: "70px",
		sortable: true,
		accessor: (scenario) =>
			getScenarioMetricValue(scenario, "implementationCount"),
	},
	useCaseCount: {
		key: "useCaseCount",
		label: "scenario.columns.implementation_count",
		width: "70px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "useCaseCount"),
	},
	useCaseCagr: {
		key: "useCaseCagr",
		label: "scenario.columns.use_case_cagr",
		width: "90px",
		sortable: true,
		accessor: (scenario) => getScenarioMetricValue(scenario, "useCaseCagr"),
	},

	marketGrowthRate: {
		key: "marketGrowthRate",
		label: "scenario.columns.market_growth_rate",
		width: "90px",
		accessor: (scenario) =>
			getScenarioMetricValue(scenario, "marketGrowthRate"),
	},
	competitiveness: {
		key: "competitiveness",
		label: "scenario.columns.competitiveness",
		width: "90px",
		accessor: (scenario) => getScenarioMetricValue(scenario, "competitiveness"),
	},
	implementationDifficulty: {
		key: "implementationDifficulty",
		label: "scenario.columns.implementation_difficulty",
		width: "100px",
		accessor: (scenario) =>
			getScenarioMetricValue(scenario, "implementationDifficulty"),
	},
	timeToMarket: {
		key: "timeToMarket",
		label: "scenario.columns.time_to_market",
		width: "100px",
		accessor: (scenario) => getScenarioMetricValue(scenario, "timeToMarket"),
	},
	techCharacteristics: {
		key: "techCharacteristics",
		label: "scenario.columns.tech_characteristics",
		width: "160px",
		accessor: (scenario) =>
			getScenarioMetricValue(scenario, "techCharacteristics"),
	},
	technologicalAdvantage: {
		key: "technologicalAdvantage",
		label: "scenario.columns.technological_advantage",
		width: "100px",
		sortable: true,
		accessor: (scenario) =>
			getScenarioMetricValue(scenario, "technologicalAdvantage"),
	},
}

const VIEW_MODE_COLUMN_KEYS: Record<string, string[]> = {
	overview: [
		"name",
		"summary",
		"techCharacteristics",
		"technologicalAdvantage",
		"globalTam",
		"marketCagr",
		"paperCount",
		"paperCagr",
		"patentCount",
		"useCaseCount",
	],
	market: [
		"name",
		"domesticTam",
		"domesticSam",
		"globalTam",
		"globalSam",
		"marketCagr",
	],
	research: ["name", "paperCount", "patentCount", "useCaseCount", "trl"],
	default: ["name", "summary", "tam", "cagr", "trl"],
}

const SORT_COLUMN_OPTIONS = [
	"domesticTam",
	"globalTam",
	"domesticSam",
	"globalSam",
	"paperCount",
	"patentCount",
	"useCaseCount",
	"trl",
	"technologicalAdvantage",
].map((key) => ({
	value: key,
	label: COLUMN_DEFINITIONS[key].label,
}))

export const TECHNOLOGICAL_ADVANTAGE_DEFINITIONS: Record<
	string,
	{
		label: string
		description: string
		labelKey: string
		descriptionKey: string
	}
> = {
	高: {
		label: "高",
		labelKey: "scenario.difficulty.high",
		description:
			"既存技術では原理的に実現不可能な機能を持つ、または主要性能指標で既存技術を1桁以上上回る。代替技術を具体的に挙げても、その技術では到達できない領域があることを明示できる。",
		descriptionKey: "scenario.tech_advantage.high_description",
	},
	中: {
		label: "中",
		labelKey: "scenario.difficulty.medium",
		description:
			"既存技術でも機能は実現可能だが、性能・効率・コスト・適用範囲のいずれかで定量的に明確な優位性（例：2〜10倍の改善）がある。既存技術との差別化ポイントを具体的に説明できる。",
		descriptionKey: "scenario.tech_advantage.medium_description",
	},
	低: {
		label: "低",
		labelKey: "scenario.difficulty.low",
		description:
			"既存技術で同等以上の機能・性能が既に達成されている、または達成可能である。差別化要因が原理的・定量的に示せない。",
		descriptionKey: "scenario.tech_advantage.low_description",
	},
}

function getColumns(
	viewMode: ViewMode,
	additionalEnrichments: Array<{
		key: string
		label: string
		isCustom: boolean
	}> = [],
	customViews: CustomView[] = [],
	hiddenColumns: string[] = [],
): ColumnDefinition[] {
	if (viewMode.startsWith("custom_")) {
		const customView = customViews.find((cv) => cv.id === viewMode)

		if (customView) {
			return customView.columnKeys
				.map((key) => COLUMN_DEFINITIONS[key])
				.filter((col): col is ColumnDefinition => Boolean(col))
		}
	}

	const baseKeys = (
		VIEW_MODE_COLUMN_KEYS[viewMode] ?? VIEW_MODE_COLUMN_KEYS.default
	).filter((key) => !hiddenColumns.includes(key))

	const baseColumns = baseKeys
		.map((key) => COLUMN_DEFINITIONS[key])
		.filter((col): col is ColumnDefinition => Boolean(col))

	const enrichmentColumns = additionalEnrichments
		.map((enrichment) => {
			const definedColumn = COLUMN_DEFINITIONS[enrichment.key]
			if (definedColumn) return definedColumn

			return {
				key: enrichment.key,
				label: enrichment.label,
				accessor: () => null,
			} satisfies ColumnDefinition
		})
		.filter(
			(col, index, arr) =>
				!baseColumns.some((base) => base.key === col.key) &&
				arr.findIndex((item) => item.key === col.key) === index,
		)

	return [...baseColumns, ...enrichmentColumns]
}

type RenderRowParams = {
	scenario: Scenario
	visibleColumns: ColumnDefinition[]
	onRowClick?: (scenario: Scenario) => void
	onRowClickWithTab?: (scenario: Scenario, tab: string) => void
	activeScenarioId?: string | null
	isHovered?: boolean
	onEditScenario: (scenario: Scenario) => void
	onOpenAiDetail: (scenarioId: string | null) => void
	onOpenTrlModal: (scenario: Scenario | null) => void
	t: (key: string) => string
}

const COUNT_KEY_TO_TAB: Record<string, string> = {
	paperCount: "papers",
	papers: "papers",
	patentCount: "patents",
	patents: "patents",
	implementationCount: "implementation",
	implementation: "implementation",
	useCaseCount: "implementation",
}

function renderRow({
	scenario,
	visibleColumns,
	onRowClick,
	onRowClickWithTab,
	activeScenarioId,
	isHovered,
	onEditScenario,
	onOpenAiDetail,
	onOpenTrlModal,
	t,
}: RenderRowParams) {
	return visibleColumns.map((col, colIndex) => {
		const rawValue = COLUMN_DEFINITIONS[col.key]?.accessor(scenario) ?? null

		const renderValue = () => {
			if (col.key === "name") {
				return (
					<div className="space-y-1">
						<div className="text-sm text-gray-600 leading-relaxed line-clamp-3">
							{String(rawValue ?? "—")}
						</div>
						{scenario.aiGenerationInput?.context && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onOpenAiDetail(scenario.id)
								}}
								className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700 hover:bg-blue-100"
							>
								{t("scenario.table.ai_added_badge")}
							</button>
						)}
					</div>
				)
			}

			if (col.key === "summary") {
				return (
					<div className="line-clamp-4 text-sm text-gray-600 leading-relaxed">
						{rawValue == null ? "—" : String(rawValue)}
					</div>
				)
			}

			if (col.key === "trl") {
				if (rawValue == null)
					return <span className="text-sm text-gray-400">—</span>
				const trlNum = Number(rawValue)
				const barColor =
					trlNum >= 7
						? "bg-emerald-400"
						: trlNum >= 4
							? "bg-blue-400"
							: "bg-amber-400"
				const textColor =
					trlNum >= 7
						? "text-emerald-500"
						: trlNum >= 4
							? "text-blue-500"
							: "text-amber-500"
				const tooltipBg =
					trlNum >= 7
						? "bg-emerald-50 border-emerald-100"
						: trlNum >= 4
							? "bg-blue-50 border-blue-200"
							: "bg-amber-50 border-amber-200"
				const trlDef = THEME_TRL_DEFS.find((d) => d.level === trlNum)
				const chart = (
					<div className="flex flex-col gap-1">
						<span className={`text-sm font-bold ${textColor}`}>{trlNum}</span>
						<div className="flex items-end gap-0.5 h-6 w-full">
							{Array.from({ length: 9 }, (_, i) => {
								const level = i + 1
								const filled = level <= trlNum
								return (
									<div
										key={i}
										className={`w-1.5 shrink-0 rounded-sm ${filled ? barColor : "bg-gray-200"}`}
										style={{ height: filled ? "100%" : "30%" }}
									/>
								)
							})}
						</div>
					</div>
				)
				const trlButton = (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							onOpenTrlModal(scenario)
						}}
						className="cursor-pointer text-left"
					>
						{chart}
					</button>
				)
				if (!trlDef) return trlButton
				return (
					<TooltipProvider delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>{trlButton}</TooltipTrigger>
							<TooltipContent
								side="bottom"
								className={`max-w-[240px] space-y-1 p-3 ${tooltipBg}`}
							>
								<p className={`text-xs font-bold ${textColor}`}>
									TRL {trlNum} — {trlDef.title}
								</p>
								<p className="text-xs text-gray-600 leading-relaxed">
									{trlDef.desc}
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)
			}

			// Determine if a job is running for this specific column
			const ad = (scenario as any).analysisData ?? {}
			const isJobActive = (job: any) =>
				job?.status === "running" || job?.status === "queued"

			// Preanalyze only covers global TAM and CAGR
			const PREANALYZE_COLS = [
				"tam",
				"globalTam",
				"cagr",
				"marketCagr",
				"marketGrowthRate",
			]
			// Full market analysis covers all market columns
			const _MARKET_COLS = [
				"tam",
				"domesticTam",
				"domesticSam",
				"globalTam",
				"globalSam",
				"cagr",
				"marketCagr",
				"marketGrowthRate",
			]
			const _TRL_COLS = ["trl"]

			// Columns that show spinner from metrics fetch flags
			const PAPER_COLS = ["papers", "paperCount", "paperCagr"]
			const PATENT_COLS = ["patents", "patentCount", "patentCagr"]
			const USECASE_COLS = [
				"implementation",
				"implementationCount",
				"useCaseCount",
				"useCaseCagr",
			]

			const metrics = scenario.metrics
			const isColLoading = (() => {
				if (PREANALYZE_COLS.includes(col.key)) {
					return isJobActive(ad.preanalyze_job)
				}
				if (PAPER_COLS.includes(col.key)) {
					return !!metrics._fetchingPapers || rawValue == null
				}
				if (PATENT_COLS.includes(col.key)) {
					return !!metrics._fetchingPatents || rawValue == null
				}
				if (USECASE_COLS.includes(col.key)) {
					return !!metrics._fetchingUseCases || rawValue == null
				}
				return false
			})()

			const loadingSpinner = (
				<span className="inline-flex items-center gap-1 text-sm text-blue-600">
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
				</span>
			)

			const noDataDash = (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="text-sm text-gray-400 cursor-help">—</span>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="max-w-[220px] text-center">
							<p className="text-xs">{t("scenario.table.no_data_tooltip")}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)

			// Preanalyze market detail popover for TAM/CAGR cells
			const preanalyzeMarket = ad.preanalyze?.market
			const tamInfo = preanalyzeMarket?.tam
			const projectionInfo = preanalyzeMarket?.projection
			const hasMarketDetail = !!tamInfo && PREANALYZE_COLS.includes(col.key)

			// Full market analysis SAM derivation popover
			const analyzeMarketData = ad.analyze_market?.data
			const samInfo = analyzeMarketData?.sam
			const analyzeMarketTam = analyzeMarketData?.tam
			const marketDerivation = ad.analyze_market?.derivation
			const SAM_COLS = ["globalSam", "domesticSam"]
			const hasSamDetail = !!samInfo && SAM_COLS.includes(col.key)

			const marketDetailPopover = (displayContent: React.ReactNode) => {
				if (!hasMarketDetail) return displayContent
				return (
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
								onClick={(e) => e.stopPropagation()}
							>
								{displayContent}
							</button>
						</PopoverTrigger>
						<PopoverContent
							className="w-96 p-0"
							side="bottom"
							align="start"
							collisionPadding={16}
							avoidCollisions
						>
							<div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
								<div>
									<p className="text-sm font-semibold text-gray-900">
										{tamInfo.market_name}
									</p>
									{tamInfo.region && (
										<span className="text-xs text-gray-500 capitalize">
											{tamInfo.region} · {tamInfo.year}
										</span>
									)}
								</div>
								{tamInfo.market_definition && (
									<p className="text-xs text-gray-600 leading-relaxed">
										{tamInfo.market_definition}
									</p>
								)}
								<div className="grid grid-cols-2 gap-2 text-xs">
									<div className="bg-gray-50 rounded p-2">
										<span className="text-gray-500 block">TAM</span>
										<span className="font-medium text-gray-900">
											{tamInfo.market_size ??
												formatCompactNumber(tamInfo.value)}
										</span>
									</div>
									<div className="bg-gray-50 rounded p-2">
										<span className="text-gray-500 block">CAGR</span>
										<span className="font-medium text-gray-900">
											{tamInfo.cagr ??
												(projectionInfo?.cagr_percent
													? `${projectionInfo.cagr_percent}%`
													: "—")}
										</span>
										{tamInfo.cagr_start_year && tamInfo.cagr_end_year && (
											<span className="text-gray-400 block">
												{tamInfo.cagr_start_year}–{tamInfo.cagr_end_year}
											</span>
										)}
									</div>
								</div>
								{projectionInfo?.projections && (
									<div className="text-xs">
										<span className="text-gray-500 block mb-1">
											{t("scenario.market.projection_label")}
										</span>
										<div className="flex gap-2 flex-wrap">
											{Object.entries(
												projectionInfo.projections as Record<string, number>,
											).map(([year, val]) => (
												<span
													key={year}
													className="bg-blue-50 text-blue-700 rounded px-1.5 py-0.5"
												>
													{year}: {formatCompactNumber(val)}
												</span>
											))}
										</div>
									</div>
								)}
								{tamInfo.source_url && (
									<a
										href={tamInfo.source_url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs text-blue-500 hover:underline break-all"
										onClick={(e) => e.stopPropagation()}
									>
										{tamInfo.source_url}
									</a>
								)}
							</div>
						</PopoverContent>
					</Popover>
				)
			}

			const samDetailPopover = (displayContent: React.ReactNode) => {
				if (!hasSamDetail) return displayContent
				return (
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
								onClick={(e) => e.stopPropagation()}
							>
								{displayContent}
							</button>
						</PopoverTrigger>
						<PopoverContent
							className="w-96 p-0"
							side="bottom"
							align="start"
							collisionPadding={16}
							avoidCollisions
						>
							<div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
								<p className="text-sm font-semibold text-gray-900">
									{t("scenario.market.sam_derivation_title")}
								</p>
								{samInfo.equation_template && (
									<div className="bg-gray-50 rounded p-2">
										<span className="text-xs text-gray-500 block mb-1">
											{t("scenario.market.calculation_formula")}
										</span>
										<p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
											{samInfo.equation_template}
										</p>
									</div>
								)}
								<div className="grid grid-cols-2 gap-2 text-xs">
									<div className="bg-gray-50 rounded p-2">
										<span className="text-gray-500 block">SAM</span>
										<span className="font-medium text-gray-900">
											{samInfo.formatted ??
												(typeof samInfo.value === "number"
													? formatCompactNumber(samInfo.value)
													: "—")}
										</span>
									</div>
									{analyzeMarketTam && (
										<div className="bg-gray-50 rounded p-2">
											<span className="text-gray-500 block">TAM</span>
											<span className="font-medium text-gray-900">
												{analyzeMarketTam.market_size ??
													(typeof analyzeMarketTam.value === "number"
														? formatCompactNumber(analyzeMarketTam.value)
														: "—")}
											</span>
										</div>
									)}
								</div>
								{marketDerivation?.sources &&
									Array.isArray(marketDerivation.sources) &&
									marketDerivation.sources.length > 0 && (
										<div className="text-xs space-y-1">
											<span className="text-gray-500 block">
												{t("scenario.market.reference_sources")}
											</span>
											{marketDerivation.sources.map((src: any, i: number) => (
												<div key={i}>
													{src.url ? (
														<a
															href={src.url}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-500 hover:underline break-all"
															onClick={(e) => e.stopPropagation()}
														>
															{src.title ?? src.url}
														</a>
													) : (
														<span className="text-gray-600">
															{src.title ?? "—"}
														</span>
													)}
												</div>
											))}
										</div>
									)}
							</div>
						</PopoverContent>
					</Popover>
				)
			}

			if (
				[
					"tam",
					"domesticTam",
					"domesticSam",
					"globalTam",
					"globalSam",
					"paperCount",
					"papers",
					"patentCount",
					"patents",
					"implementationCount",
					"implementation",
					"useCaseCount",
				].includes(col.key)
			) {
				const isCountCol = COUNT_KEY_TO_TAB[col.key] != null
				if (typeof rawValue === "number") {
					const formattedValue = (
						<span
							className={`text-sm text-gray-800 ${isCountCol ? "text-blue-600 hover:text-blue-800 hover:underline cursor-pointer" : ""}`}
							onClick={
								isCountCol
									? (e) => {
											e.stopPropagation()
											onRowClickWithTab?.(scenario, COUNT_KEY_TO_TAB[col.key])
										}
									: undefined
							}
						>
							{formatCompactNumber(rawValue)}
						</span>
					)
					if (hasMarketDetail && !isCountCol)
						return marketDetailPopover(formattedValue)
					if (hasSamDetail && !isCountCol)
						return samDetailPopover(formattedValue)
					return formattedValue
				}
				if (isColLoading) return loadingSpinner
				return noDataDash
			}

			if (
				[
					"cagr",
					"marketCagr",
					"paperCagr",
					"patentCagr",
					"useCaseCagr",
					"marketGrowthRate",
				].includes(col.key)
			) {
				const paperCagrMeta =
					col.key === "paperCagr" ? getScenarioPaperCagrMeta(scenario) : null

				const hasPaperCagrDetail =
					col.key === "paperCagr" &&
					paperCagrMeta &&
					typeof paperCagrMeta === "object"

				const paperCagrPopover = (displayContent: React.ReactNode) => {
					if (!hasPaperCagrDetail) return displayContent

					const yearCounts = paperCagrMeta.yearCounts ?? {}
					const sortedYears = Object.keys(yearCounts)
						.map(Number)
						.sort((a, b) => a - b)

					return (
						<Popover>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
									onClick={(e) => e.stopPropagation()}
								>
									{displayContent}
								</button>
							</PopoverTrigger>

							<PopoverContent
								className="w-96 p-0"
								side="bottom"
								align="start"
								collisionPadding={16}
								avoidCollisions
							>
								<div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
									<div>
										<p className="text-sm font-semibold text-gray-900">
											{t("scenario.paper_cagr.breakdown_title")}
										</p>
										<p className="text-xs text-gray-500">
											{t("scenario.paper_cagr.breakdown_subtitle")}
										</p>
									</div>

									<div className="grid grid-cols-2 gap-2 text-xs">
										<div className="bg-gray-50 rounded p-2">
											<span className="text-gray-500 block">
												{t("scenario.paper_cagr.start_year")}
											</span>
											<span className="font-medium text-gray-900">
												{paperCagrMeta.startYear ?? "—"}
											</span>
										</div>

										<div className="bg-gray-50 rounded p-2">
											<span className="text-gray-500 block">
												{t("scenario.paper_cagr.end_year")}
											</span>
											<span className="font-medium text-gray-900">
												{paperCagrMeta.endYear ?? "—"}
											</span>
										</div>

										<div className="bg-gray-50 rounded p-2">
											<span className="text-gray-500 block">
												{t("scenario.paper_cagr.start_year_count")}
											</span>
											<span className="font-medium text-gray-900">
												{paperCagrMeta.startValue ?? "—"}
											</span>
										</div>

										<div className="bg-gray-50 rounded p-2">
											<span className="text-gray-500 block">
												{t("scenario.paper_cagr.end_year_count")}
											</span>
											<span className="font-medium text-gray-900">
												{paperCagrMeta.endValue ?? "—"}
											</span>
										</div>
									</div>

									<div className="text-xs">
										<span className="text-gray-500 block mb-2">
											{t("scenario.paper_cagr.annual_count")}
										</span>

										{sortedYears.length > 0 ? (
											(() => {
												const max = Math.max(
													...sortedYears.map((y) => yearCounts[y] ?? 0),
													1,
												)

												return (
													<div className="rounded bg-gray-50 px-2 py-2 overflow-x-auto">
														<div className="flex items-end gap-2 h-24 min-w-max">
															{sortedYears.map((year) => {
																const count = yearCounts[year] ?? 0
																const height = Math.max((count / max) * 100, 8)

																return (
																	<div
																		key={year}
																		className="group relative flex flex-col items-center justify-end flex-shrink-0"
																	>
																		{/* hover number */}
																		<div className="absolute -top-5 hidden group-hover:block text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded">
																			{count}
																		</div>

																		<div className="w-full flex items-end justify-center h-16">
																			<div
																				className="w-4 rounded-t bg-blue-500 group-hover:bg-blue-600 transition-colors"
																				style={{ height: `${height}%` }}
																			/>
																		</div>

																		<span className="mt-1 text-[10px] leading-none text-gray-500">
																			{year}
																		</span>
																	</div>
																)
															})}
														</div>
													</div>
												)
											})()
										) : (
											<span className="text-gray-400">
												{t("scenario.paper_cagr.no_data")}
											</span>
										)}
									</div>
								</div>
							</PopoverContent>
						</Popover>
					)
				}

				if (typeof rawValue === "number") {
					const formattedValue = (
						<span className="text-sm text-gray-800">
							{formatPercent(rawValue)}
						</span>
					)

					if (hasMarketDetail) return marketDetailPopover(formattedValue)
					if (hasPaperCagrDetail) return paperCagrPopover(formattedValue)

					return formattedValue
				}

				if (isColLoading) return loadingSpinner
				return noDataDash
			}

			// Render tech characteristics as badge tags with tooltip
			if (col.key === "techCharacteristics") {
				const tags = normalizeTechCharacteristicsDetailed(scenario)
				if (tags.length === 0) return noDataDash
				return (
					<TooltipProvider delayDuration={200}>
						<div className="flex flex-wrap gap-0.5">
							{tags.map((tag, i) => {
								const hasDetail = tag.description || tag.potential_applications
								const badge = (
									<span
										key={i}
										className="inline-block bg-gray-100 text-gray-500 rounded px-2 py-1 text-[14px] leading-relaxed whitespace-nowrap"
									>
										{tag.name}
									</span>
								)
								if (!hasDetail) return badge
								return (
									<Tooltip key={i}>
										<TooltipTrigger asChild>{badge}</TooltipTrigger>
										<TooltipContent
											side="bottom"
											className="max-w-[280px] text-xs p-2 space-y-1"
										>
											{tag.description && (
												<p>
													<span className="font-semibold text-gray-500">
														{t("scenario.tech_char.definition_label")}:{" "}
													</span>
													{tag.description}
												</p>
											)}
											{tag.potential_applications && (
												<p>
													<span className="font-semibold text-gray-500">
														{t("scenario.tech_char.advantage_label")}:{" "}
													</span>
													{tag.potential_applications}
												</p>
											)}
										</TooltipContent>
									</Tooltip>
								)
							})}
						</div>
					</TooltipProvider>
				)
			}

			if (rawValue == null || rawValue === "") {
				if (isColLoading) return loadingSpinner
				return noDataDash
			}

			// Render technological advantage as a colored badge with tooltip
			if (col.key === "technologicalAdvantage") {
				const advantage = scenario.technologicalAdvantage
				if (!advantage || !advantage.rating) return noDataDash

				// Normalize English API ratings to Japanese keys used in definitions
				const normalizeRating = (r: string): string =>
					({ High: "高", Medium: "中", Low: "低" })[r] ?? r
				const normalizedRating = normalizeRating(advantage.rating)

				const ratingColors: Record<
					string,
					{ bg: string; text: string; border: string }
				> = {
					高: {
						bg: "bg-[#a3ffc3]",
						text: "text-[#195831]",
						border: "border-[#a3ffc3]",
					},
					中: {
						bg: "bg-[#d9f99d]",
						text: "text-[#3f6212]",
						border: "border-[#d9f99d]",
					},
					低: {
						bg: "bg-red-50",
						text: "text-red-700",
						border: "border-red-200",
					},
				}
				const colors = ratingColors[normalizedRating] ?? {
					bg: "bg-gray-50",
					text: "text-gray-700",
					border: "border-gray-200",
				}
				const ratingDef = TECHNOLOGICAL_ADVANTAGE_DEFINITIONS[normalizedRating]

				const badge = (
					<span
						className={`inline-flex items-center rounded-md px-4 py-1 text-[14px] font-medium cursor-pointer ${colors.bg} ${colors.text}`}
					>
						{ratingDef ? t(ratingDef.labelKey) : advantage.rating}
					</span>
				)

				return (
					<Popover>
						<PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
							{badge}
						</PopoverTrigger>
						<PopoverContent
							className="w-80 p-0"
							side="bottom"
							align="start"
							collisionPadding={16}
							avoidCollisions
						>
							<div className="p-3 space-y-1">
								<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pb-1 border-b border-gray-100">
									{t("scenario.tech_advantage.definition_title")}
								</p>
								{Object.values(TECHNOLOGICAL_ADVANTAGE_DEFINITIONS).map(
									(def) => {
										const isCurrent = def.label === normalizedRating
										const defColors = ratingColors[def.label] ?? {
											bg: "bg-gray-50",
											text: "text-gray-700",
											border: "border-gray-200",
										}
										return (
											<div
												key={def.label}
												className={`rounded-md p-2.5 ${isCurrent ? `${defColors.bg} border ${defColors.border}` : "opacity-50"}`}
											>
												<div className="flex items-center gap-2 mb-1">
													<span
														className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-semibold ${defColors.bg} ${defColors.text} ${defColors.border}`}
													>
														{t(def.labelKey)}
													</span>
													{isCurrent && (
														<span
															className={`text-[10px] font-medium ${defColors.text}`}
														>
															{t("scenario.tech_advantage.current_rating")}
														</span>
													)}
												</div>
												<p className="text-xs text-gray-600 leading-relaxed">
													{t(def.descriptionKey)}
												</p>
											</div>
										)
									},
								)}
								{advantage.explanation && (
									<div className="pt-1 border-t border-gray-100">
										<p className="text-[10px] text-gray-500 font-medium mb-1">
											{t("scenario.tech_advantage.rationale_label")}
										</p>
										<p className="text-xs text-gray-600 leading-relaxed">
											{advantage.explanation}
										</p>
									</div>
								)}
							</div>
						</PopoverContent>
					</Popover>
				)
			}

			return <span className="text-sm text-gray-800">{String(rawValue)}</span>
		}

		return (
			<td
				key={`${scenario.id}-${col.key}`}
				className={`px-4 py-3 align-top ${colIndex === 0 ? "sticky left-[48px] z-10" : ""}`}
				style={{
					backgroundColor:
						colIndex === 0
							? isHovered
								? "#f9fafb"
								: activeScenarioId === scenario.id
									? "#f8fbff"
									: "white"
							: activeScenarioId === scenario.id
								? "#f8fbff"
								: undefined,
					minWidth: col.width,
				}}
				onClick={() => {
					onRowClick?.(scenario)
				}}
			>
				<div className="cursor-pointer">{renderValue()}</div>
			</td>
		)
	})
}

export const ScenarioTableView = ({
	scenarios,
	selectedScenarioIds,
	technicalStrengths = [],
	onToggleScenario,
	onSelectAll,
	onSelectNone,
	onSaveScenario,
	onRegenerateScenario,
	filters,
	onFilterChange,
	availableTags: _availableTags = [],
	onGenerateTree,
	isGenerating = false,
	generationProgress = null,
	generationSuccess = false,
	scenariosWithTrees = [],
	selectedTechCharacteristics: _selectedTechCharacteristics = [],
	onRowClick,
	onRowClickWithTab,
	activeScenarioId,
	searchTheme = "",
	onAddScenario,
	onAddManualScenario,
	onLoadMoreScenarios,
	displayMode = "table",
	onDisplayModeChange,
	treeData = null,
	isLoadingTree = false,
	onResearchPanelChange,
	onAiAssist,
	isLoadingMoreScenarios = false,
	treeId,
	treeMode = "TED",
	isLoadingScenarios = false,
	scenarioStage,
	onClearFilters,
	onRetryGeneration,
}: ScenarioTableViewProps) => {
	const { t } = useTranslation()
	const TABLE_PREFS_STORAGE_PREFIX = "scenario-table-view-prefs-v1"
	const tablePrefsStorageKey = `${TABLE_PREFS_STORAGE_PREFIX}:${treeId || "default"}`

	const [viewMode, setViewMode] = useState<ViewMode>("overview")
	const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
	const [editModalOpen, setEditModalOpen] = useState(false)
	const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
		null,
	)
	const [additionalEnrichments, setAdditionalEnrichments] = useState<
		Array<{ key: string; label: string; isCustom: boolean }>
	>([])
	const [isEnrichmentModalOpen, setIsEnrichmentModalOpen] = useState(false)
	const [customViews, setCustomViews] = useState<CustomView[]>([])
	const [hiddenColumns, setHiddenColumns] = useState<string[]>([])
	const [isCustomViewModalOpen, setIsCustomViewModalOpen] = useState(false)
	const [showTechDialog, setShowTechDialog] = useState(false)
	const [localFilters, setLocalFilters] = useState<FilterState>(
		filters || DEFAULT_FILTERS,
	)
	const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false)
	const [expandedFilterCategories, setExpandedFilterCategories] = useState<
		Set<string>
	>(new Set(UNIFIED_METRICS.map((c: any) => c.id)))
	const [isAddScenarioOpen, setIsAddScenarioOpen] = useState(false)
	const [addScenarioContext, setAddScenarioContext] = useState("")
	const [isAddingScenario, setIsAddingScenario] = useState(false)
	const [addScenarioTab, setAddScenarioTab] = useState<"ai" | "manual">("ai")
	const [aiDetailScenarioId, setAiDetailScenarioId] = useState<string | null>(
		null,
	)
	const [manualScenarioName, setManualScenarioName] = useState("")
	const [manualScenarioSummary, setManualScenarioSummary] = useState("")
	const [trlModalScenario, setTrlModalScenario] = useState<Scenario | null>(
		null,
	)
	const [isEditScenarioOpen, setIsEditScenarioOpen] = useState(false)
	const [editingScenario, setEditingScenario] = useState<Scenario | null>(null)
	const [editScenarioName, setEditScenarioName] = useState("")
	const [editScenarioSummary, setEditScenarioSummary] = useState("")
	const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([])
	const [selectedTechTags, setSelectedTechTags] = useState<string[]>([])
	const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false)
	const [columnFilterOpen, setColumnFilterOpen] = useState<string | null>(null)
	const [hasLoadedTablePrefs, setHasLoadedTablePrefs] = useState(false)
	const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})

	// Scenario loading progress state
	const [scenarioProgress, setScenarioProgress] = useState(0)
	const scenarioStartRef = useRef<number | null>(null)

	const isCheckingDb =
		scenarioStage === "fetch_base_data" || scenarioStage === "fetch_scenarios"
	const isGeneratingScenarios = scenarioStage === "run_generate_scenarios"
	const showScenarioLoader =
		isCheckingDb || isGeneratingScenarios || isLoadingScenarios

	useEffect(() => {
		if (!isGeneratingScenarios) {
			scenarioStartRef.current = null
			setScenarioProgress(0)
			return
		}

		if (!scenarioStartRef.current) {
			scenarioStartRef.current = Date.now()
		}

		const interval = setInterval(() => {
			const elapsed = Date.now() - (scenarioStartRef.current ?? Date.now())
			const ratio = Math.min(elapsed / 150000, 1)
			const next = Math.round(ratio * 95)
			setScenarioProgress((prev) => (next > prev ? next : prev))
		}, 200)

		return () => clearInterval(interval)
	}, [isGeneratingScenarios])

	useEffect(() => {
		if (filters) {
			setLocalFilters(filters)
		}
	}, [filters])

	useEffect(() => {
		if (typeof window === "undefined") return

		try {
			const raw = window.localStorage.getItem(tablePrefsStorageKey)
			if (!raw) {
				setHasLoadedTablePrefs(true)
				return
			}

			const parsed = JSON.parse(raw) as {
				viewMode?: ViewMode
				additionalEnrichments?: Array<{
					key: string
					label: string
					isCustom: boolean
				}>
				customViews?: CustomView[]
				hiddenColumns?: string[]
				columnWidths?: Record<string, number>
			}

			if (parsed.viewMode) {
				setViewMode(parsed.viewMode)
			}

			if (Array.isArray(parsed.additionalEnrichments)) {
				setAdditionalEnrichments(parsed.additionalEnrichments)
			}

			if (Array.isArray(parsed.customViews)) {
				setCustomViews(parsed.customViews)
			}

			if (Array.isArray(parsed.hiddenColumns)) {
				setHiddenColumns(parsed.hiddenColumns)
			}

			if (parsed.columnWidths && typeof parsed.columnWidths === "object") {
				setColumnWidths(parsed.columnWidths)
			}
		} catch (error) {
			console.warn(
				"[ScenarioTableView] Failed to restore table preferences",
				error,
			)
		} finally {
			setHasLoadedTablePrefs(true)
		}
	}, [tablePrefsStorageKey])

	useEffect(() => {
		if (typeof window === "undefined" || !hasLoadedTablePrefs) return

		const payload = {
			viewMode,
			additionalEnrichments,
			customViews,
			hiddenColumns,
			columnWidths,
		}

		window.localStorage.setItem(tablePrefsStorageKey, JSON.stringify(payload))
	}, [
		hasLoadedTablePrefs,
		viewMode,
		additionalEnrichments,
		customViews,
		hiddenColumns,
		columnWidths,
		tablePrefsStorageKey,
	])

	const visibleColumns = useMemo(
		() =>
			getColumns(viewMode, additionalEnrichments, customViews, hiddenColumns),
		[viewMode, additionalEnrichments, customViews, hiddenColumns],
	)

	const exportColumns = visibleColumns

	const sortableColumns = useMemo(
		() =>
			Object.values(COLUMN_DEFINITIONS)
				.filter((col) => col.sortable)
				.map((col) => col.key),
		[],
	)

	const filterableColumns = useMemo(
		() =>
			Object.values(COLUMN_DEFINITIONS)
				.filter((col) => col.filterable)
				.map((col) => col.key),
		[],
	)

	const getColumnValue = (
		scenario: Scenario,
		columnKey: string,
	): ScenarioValue => {
		return COLUMN_DEFINITIONS[columnKey]?.accessor(scenario) ?? null
	}

	const sortedScenarios = useMemo(() => {
		if (sortCriteria.length === 0) return scenarios

		const getColumnValueHere = (
			scenario: Scenario,
			columnKey: string,
		): ScenarioValue => {
			return COLUMN_DEFINITIONS[columnKey]?.accessor(scenario) ?? null
		}

		const compareScenarioValues = (
			aValue: ScenarioValue,
			bValue: ScenarioValue,
			direction: SortDirection,
		) => {
			if (aValue == null && bValue == null) return 0
			if (aValue == null) return direction === "asc" ? 1 : -1
			if (bValue == null) return direction === "asc" ? -1 : 1

			if (typeof aValue === "number" && typeof bValue === "number") {
				return direction === "asc" ? aValue - bValue : bValue - aValue
			}

			const aText = String(aValue).toLowerCase()
			const bText = String(bValue).toLowerCase()

			if (aText === bText) return 0
			return direction === "asc"
				? aText.localeCompare(bText)
				: bText.localeCompare(aText)
		}

		return [...scenarios].sort((a, b) => {
			for (const criterion of sortCriteria) {
				const aValue = getColumnValueHere(a, criterion.column)
				const bValue = getColumnValueHere(b, criterion.column)
				const result = compareScenarioValues(
					aValue,
					bValue,
					criterion.direction,
				)
				if (result !== 0) return result
			}
			return 0
		})
	}, [scenarios, sortCriteria])

	// Collect all unique tech characteristic tags from scenarios
	const allTechTags = useMemo(() => {
		const tagSet = new Set<string>()
		for (const scenario of scenarios) {
			for (const tag of normalizeTechCharacteristicsArray(scenario)) {
				tagSet.add(tag)
			}
		}
		return Array.from(tagSet).sort()
	}, [scenarios])

	// Filter scenarios by selected tech tags
	const filteredScenarios = useMemo(() => {
		if (selectedTechTags.length === 0) return sortedScenarios
		return sortedScenarios.filter((scenario) => {
			const tags = normalizeTechCharacteristicsArray(scenario)
			return selectedTechTags.some((t) => tags.includes(t))
		})
	}, [sortedScenarios, selectedTechTags])

	const columnFilterOptions: Record<
		string,
		{ value: string; label: string }[]
	> = {
		tam: [
			{ value: "small", label: t("scenario.filter.tam_small") },
			{ value: "medium", label: t("scenario.filter.tam_medium") },
			{ value: "large", label: t("scenario.filter.tam_large") },
			{ value: "very-large", label: t("scenario.filter.tam_very_large") },
		],
		trl: [
			{ value: "early", label: t("scenario.filter.trl_early") },
			{ value: "mid", label: t("scenario.filter.trl_mid") },
			{ value: "mature", label: t("scenario.filter.trl_mature") },
		],
		cagr: [
			{ value: "low", label: t("scenario.filter.cagr_low") },
			{ value: "medium", label: t("scenario.filter.cagr_medium") },
			{ value: "high", label: t("scenario.filter.cagr_high") },
			{ value: "very-high", label: t("scenario.filter.cagr_very_high") },
		],
	}

	const handleDisplayModeChange = (mode: "table" | "mindmap") => {
		onDisplayModeChange?.(mode)
	}

	const getSortInfo = (
		columnKey: string,
	): { isSorted: boolean; direction: SortDirection | null } => {
		const criterion = sortCriteria.find((c) => c.column === columnKey)
		if (criterion) {
			return { isSorted: true, direction: criterion.direction }
		}
		return { isSorted: false, direction: null }
	}

	const getFilterSelectedKey = (columnKey: string) => {
		return `${columnKey}Selected` as keyof typeof localFilters
	}

	const hasColumnFilter = (columnKey: string) => {
		const selectedKey = getFilterSelectedKey(columnKey)
		const selectedValues: string[] = ((localFilters as any)[selectedKey] ||
			[]) as string[]
		const allOptions = columnFilterOptions[columnKey]?.length || 0
		return selectedValues.length > 0 && selectedValues.length < allOptions
	}

	const handleSort = (columnKey: string) => {
		const existingIndex = sortCriteria.findIndex((c) => c.column === columnKey)

		if (existingIndex === 0) {
			setSortCriteria((prev) =>
				prev.map((c, i) =>
					i === 0
						? { ...c, direction: c.direction === "asc" ? "desc" : "asc" }
						: c,
				),
			)
			return
		}

		if (existingIndex > 0) {
			setSortCriteria((prev) => {
				const criterion = prev[existingIndex]
				const rest = prev.filter((_, i) => i !== existingIndex)
				return [
					{
						...criterion,
						direction: criterion.direction === "asc" ? "desc" : "asc",
					},
					...rest,
				]
			})
			return
		}

		setSortCriteria((prev) => [
			{ id: crypto.randomUUID(), column: columnKey, direction: "desc" },
			...prev,
		])
	}

	const addSortCriterion = () => {
		const usedColumns = sortCriteria.map((c) => c.column)
		const availableColumn = SORT_COLUMN_OPTIONS.find(
			(opt) => !usedColumns.includes(opt.value),
		)

		if (!availableColumn) return

		setSortCriteria((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				column: availableColumn.value,
				direction: "desc",
			},
		])
	}

	const updateSortCriterion = (id: string, updates: Partial<SortCriterion>) => {
		setSortCriteria((prev) =>
			prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
		)
	}

	const removeSortCriterion = (id: string) => {
		setSortCriteria((prev) => prev.filter((c) => c.id !== id))
	}

	const clearAllSortCriteria = () => {
		setSortCriteria([])
	}

	const handleFilterUpdate = (updates: Partial<FilterState>) => {
		const newFilters = { ...localFilters, ...updates }
		setLocalFilters(newFilters)
		onFilterChange?.(newFilters)
	}

	const getActiveFilters = () => {
		const active: Array<{ key: string; label: string; value: any }> = []

		const tamSelected: string[] = ((localFilters as any).tamSelected ||
			[]) as string[]
		if (
			tamSelected.length > 0 &&
			tamSelected.length < columnFilterOptions.tam.length
		) {
			tamSelected.forEach((val) => {
				const option = columnFilterOptions.tam.find((o) => o.value === val)
				if (option) {
					active.push({
						key: `tamSelected_${val}`,
						label: `TAM: ${option.label}`,
						value: val,
					})
				}
			})
		}

		const trlSelected: string[] = ((localFilters as any).trlSelected ||
			[]) as string[]
		if (
			trlSelected.length > 0 &&
			trlSelected.length < columnFilterOptions.trl.length
		) {
			trlSelected.forEach((val) => {
				const option = columnFilterOptions.trl.find((o) => o.value === val)
				if (option) {
					active.push({
						key: `trlSelected_${val}`,
						label: `TRL: ${option.label}`,
						value: val,
					})
				}
			})
		}

		const cagrSelected: string[] = ((localFilters as any).cagrSelected ||
			[]) as string[]
		if (
			cagrSelected.length > 0 &&
			cagrSelected.length < columnFilterOptions.cagr.length
		) {
			cagrSelected.forEach((val) => {
				const option = columnFilterOptions.cagr.find((o) => o.value === val)
				if (option) {
					active.push({
						key: `cagrSelected_${val}`,
						label: `CAGR: ${option.label}`,
						value: val,
					})
				}
			})
		}

		if (localFilters.tamCategory !== "all") {
			active.push({
				key: "tamCategory",
				label: `TAM: ${localFilters.tamCategory}`,
				value: localFilters.tamCategory,
			})
		}

		if (localFilters.trlCategory !== "all") {
			active.push({
				key: "trlCategory",
				label: `TRL: ${localFilters.trlCategory}`,
				value: localFilters.trlCategory,
			})
		}

		if (localFilters.cagrCategory !== "all") {
			active.push({
				key: "cagrCategory",
				label: `CAGR: ${localFilters.cagrCategory}`,
				value: localFilters.cagrCategory,
			})
		}

		if (localFilters.implementationDifficulty !== "all") {
			active.push({
				key: "implementationDifficulty",
				label: `Difficulty: ${localFilters.implementationDifficulty}`,
				value: localFilters.implementationDifficulty,
			})
		}

		if (localFilters.timeToMarket !== "all") {
			active.push({
				key: "timeToMarket",
				label: `Time to Market: ${localFilters.timeToMarket}`,
				value: localFilters.timeToMarket,
			})
		}

		if ((localFilters.minPaperCount ?? 0) > 0) {
			active.push({
				key: "minPaperCount",
				label: `Papers ≥ ${localFilters.minPaperCount}`,
				value: localFilters.minPaperCount,
			})
		}

		if (localFilters.maxPaperCount != null) {
			active.push({
				key: "maxPaperCount",
				label: `Papers ≤ ${localFilters.maxPaperCount}`,
				value: localFilters.maxPaperCount,
			})
		}

		if ((localFilters.minPatentCount ?? 0) > 0) {
			active.push({
				key: "minPatentCount",
				label: `Patents ≥ ${localFilters.minPatentCount}`,
				value: localFilters.minPatentCount,
			})
		}

		if (localFilters.maxPatentCount != null) {
			active.push({
				key: "maxPatentCount",
				label: `Patents ≤ ${localFilters.maxPatentCount}`,
				value: localFilters.maxPatentCount,
			})
		}

		if ((localFilters.minImplementationCount ?? 0) > 0) {
			active.push({
				key: "minImplementationCount",
				label: `Implementation ≥ ${localFilters.minImplementationCount}`,
				value: localFilters.minImplementationCount,
			})
		}

		if (localFilters.maxImplementationCount != null) {
			active.push({
				key: "maxImplementationCount",
				label: `Implementation ≤ ${localFilters.maxImplementationCount}`,
				value: localFilters.maxImplementationCount,
			})
		}

		if ((localFilters.minCompetitiveness ?? 0) > 0) {
			active.push({
				key: "minCompetitiveness",
				label: `Competitiveness ≥ ${localFilters.minCompetitiveness}`,
				value: localFilters.minCompetitiveness,
			})
		}

		if ((localFilters.maxCompetitiveness ?? 10) < 10) {
			active.push({
				key: "maxCompetitiveness",
				label: `Competitiveness ≤ ${localFilters.maxCompetitiveness}`,
				value: localFilters.maxCompetitiveness,
			})
		}

		return active
	}

	const removeFilter = (key: string) => {
		const updates: Partial<FilterState> = {}

		if (key.startsWith("tamSelected_")) {
			const valueToRemove = key.replace("tamSelected_", "")
			const currentSelected: string[] = ((localFilters as any).tamSelected ||
				[]) as string[]
			const newSelected = currentSelected.filter((v) => v !== valueToRemove)
			;(updates as any).tamSelected =
				newSelected.length === 0 ? [] : newSelected
		} else if (key.startsWith("trlSelected_")) {
			const valueToRemove = key.replace("trlSelected_", "")
			const currentSelected: string[] = ((localFilters as any).trlSelected ||
				[]) as string[]
			const newSelected = currentSelected.filter((v) => v !== valueToRemove)
			;(updates as any).trlSelected =
				newSelected.length === 0 ? [] : newSelected
		} else if (key.startsWith("cagrSelected_")) {
			const valueToRemove = key.replace("cagrSelected_", "")
			const currentSelected: string[] = ((localFilters as any).cagrSelected ||
				[]) as string[]
			const newSelected = currentSelected.filter((v) => v !== valueToRemove)
			;(updates as any).cagrSelected =
				newSelected.length === 0 ? [] : newSelected
		} else if (key === "tamCategory") {
			updates.tamCategory = "all"
		} else if (key === "trlCategory") {
			updates.trlCategory = "all"
		} else if (key === "cagrCategory") {
			updates.cagrCategory = "all"
		} else if (key === "implementationDifficulty") {
			updates.implementationDifficulty = "all"
		} else if (key === "timeToMarket") {
			updates.timeToMarket = "all"
		} else if (key === "minPaperCount") {
			updates.minPaperCount = 0
		} else if (key === "maxPaperCount") {
			updates.maxPaperCount = undefined
		} else if (key === "minPatentCount") {
			updates.minPatentCount = 0
		} else if (key === "maxPatentCount") {
			updates.maxPatentCount = undefined
		} else if (key === "minImplementationCount") {
			updates.minImplementationCount = 0
		} else if (key === "maxImplementationCount") {
			updates.maxImplementationCount = undefined
		} else if (key === "minCompetitiveness") {
			updates.minCompetitiveness = 0
		} else if (key === "maxCompetitiveness") {
			updates.maxCompetitiveness = 10
		}

		handleFilterUpdate(updates)
	}

	const handleResetFilters = () => {
		setLocalFilters(DEFAULT_FILTERS)
		onFilterChange?.(DEFAULT_FILTERS)
	}

	const activeFilters = getActiveFilters()

	const isSelected = (id: string) => selectedScenarioIds.includes(id)

	const handleScenarioReport = (scenarioId: string) => {
		const scenario = scenarios.find((s) => s.id === scenarioId)
		if (scenario) onRowClick?.(scenario)
	}

	const handleEdit = (scenarioId: string) => {
		const scenario = scenarios.find((s) => s.id === scenarioId)
		if (!scenario) return
		setSelectedScenario(scenario)
		setEditModalOpen(true)
	}

	const handleSaveScenario = (updatedScenario: Scenario) => {
		onSaveScenario?.(updatedScenario)
		setEditModalOpen(false)
	}

	const handleRegenerateScenario = (
		scenarioId: string,
		mode: "converge" | "diverge",
	) => {
		onRegenerateScenario?.(scenarioId, mode)
	}

	const getAvailableEnrichments = (): AvailableEnrichment[] => {
		const visibleColumnKeys = visibleColumns.map((col) => col.key)

		const allEnrichments = getAllMetrics().map((metric) => {
			const hasDefinition = Boolean(COLUMN_DEFINITIONS[metric.key])
			const hasAnyScenarioData = hasDefinition
				? scenarios.some((scenario) => {
						const value = getScenarioMetricValue(scenario, metric.key)
						return value != null && value !== ""
					})
				: false

			return {
				key: metric.key,
				label: metric.label,
				description: metric.description,
				category: metric.category,
				isAvailable: hasAnyScenarioData,
				comingSoon: !hasAnyScenarioData,
			}
		})

		return allEnrichments.filter(
			(enrichment) => !visibleColumnKeys.includes(enrichment.key),
		)
	}

	const availableEnrichments = getAvailableEnrichments()

	const handleAddEnrichment = (
		enrichmentKey: string,
		label: string,
		isCustom: boolean,
	) => {
		if (viewMode.startsWith("custom_")) {
			setCustomViews((prev) =>
				prev.map((view) => {
					if (view.id !== viewMode) return view
					if (view.columnKeys.includes(enrichmentKey)) return view
					return {
						...view,
						columnKeys: [...view.columnKeys, enrichmentKey],
					}
				}),
			)
			return
		}

		setAdditionalEnrichments((prev) => {
			if (prev.some((item) => item.key === enrichmentKey)) return prev
			return [...prev, { key: enrichmentKey, label, isCustom }]
		})
	}

	const handleToggleEnrichment = (key: string, enabled: boolean) => {
		if (viewMode.startsWith("custom_")) {
			setCustomViews((prev) =>
				prev.map((view) => {
					if (view.id !== viewMode) return view
					if (enabled && !view.columnKeys.includes(key)) {
						return { ...view, columnKeys: [...view.columnKeys, key] }
					}
					if (!enabled && view.columnKeys.includes(key)) {
						return {
							...view,
							columnKeys: view.columnKeys.filter((k) => k !== key),
						}
					}
					return view
				}),
			)
			return
		}

		const baseKeys =
			VIEW_MODE_COLUMN_KEYS[viewMode] ?? VIEW_MODE_COLUMN_KEYS.default
		if (baseKeys.includes(key)) {
			setHiddenColumns((prev) =>
				enabled ? prev.filter((k) => k !== key) : [...new Set([...prev, key])],
			)
			return
		}

		if (enabled) {
			const label = COLUMN_DEFINITIONS[key]?.label ?? key
			handleAddEnrichment(key, label, false)
			return
		}

		setAdditionalEnrichments((prev) => prev.filter((item) => item.key !== key))
	}

	const availableColumns: AvailableColumn[] = Object.values(
		COLUMN_DEFINITIONS,
	).map((col) => ({
		key: col.key,
		label: col.label,
	}))

	const handleCreateCustomView = (name: string, columnKeys: string[]) => {
		const customViewId = `custom_${Date.now()}`
		const newCustomView: CustomView = {
			id: customViewId,
			name,
			columnKeys,
		}
		setCustomViews((prev) => [...prev, newCustomView])
		setViewMode(customViewId as ViewMode)
	}

	const aiDetailScenario = scenarios.find((s) => s.id === aiDetailScenarioId)

	const handleExportCsv = () => {
		const rows = filteredScenarios.map((scenario) =>
			Object.fromEntries(
				exportColumns.map((col) => [
					col.label,
					getColumnValue(scenario, col.key) ?? "",
				]),
			),
		)

		exportToCsv(
			`scenarios_${viewMode}_${new Date().toISOString().split("T")[0]}.csv`,
			rows,
		)
	}

	const handleExportSpreadsheet = () => {
		let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Scenarios">
<Table>
<Row>`

		for (const col of exportColumns) {
			xmlContent += `<Cell><Data ss:Type="String">${col.label}</Data></Cell>`
		}

		xmlContent += `</Row>`

		for (const scenario of filteredScenarios) {
			xmlContent += `<Row>`
			for (const col of exportColumns) {
				const rawValue = getColumnValue(scenario, col.key)
				const value = rawValue == null ? "" : String(rawValue)
				const escapedValue = value
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;")

				xmlContent += `<Cell><Data ss:Type="String">${escapedValue}</Data></Cell>`
			}
			xmlContent += `</Row>`
		}

		xmlContent += `</Table>
</Worksheet>
</Workbook>`

		const blob = new Blob([xmlContent], {
			type: "application/vnd.ms-excel;charset=utf-8;",
		})
		const url = URL.createObjectURL(blob)
		const link = document.createElement("a")
		link.href = url
		link.download = `scenarios_${viewMode}_${new Date().toISOString().split("T")[0]}.xls`
		link.click()
		URL.revokeObjectURL(url)
	}

	const getMetricTooltip = (key: string): string | null => {
		const tooltipKeys: Record<string, string> = {
			name: "scenario.metric_tooltip.name",
			summary: "scenario.metric_tooltip.summary",
			tam: "scenario.metric_tooltip.tam",
			cagr: "scenario.metric_tooltip.cagr",
			trl: "scenario.metric_tooltip.trl",
			papers: "scenario.metric_tooltip.papers",
			paperCount: "scenario.metric_tooltip.paper_count",
			paperCagr: "scenario.metric_tooltip.paper_cagr",
			patents: "scenario.metric_tooltip.patents",
			patentCount: "scenario.metric_tooltip.patent_count",
			patentCagr: "scenario.metric_tooltip.patent_cagr",
			implementation: "scenario.metric_tooltip.implementation",
			implementationCount: "scenario.metric_tooltip.implementation_count",
			useCaseCount: "scenario.metric_tooltip.use_case_count",
			useCaseCagr: "scenario.metric_tooltip.use_case_cagr",
			domesticTam: "scenario.metric_tooltip.domestic_tam",
			domesticSam: "scenario.metric_tooltip.domestic_sam",
			globalTam: "scenario.metric_tooltip.global_tam",
			globalSam: "scenario.metric_tooltip.global_sam",
			marketCagr: "scenario.metric_tooltip.market_cagr",
			marketGrowthRate: "scenario.metric_tooltip.market_growth_rate",
			competitiveness: "scenario.metric_tooltip.competitiveness",
			implementationDifficulty:
				"scenario.metric_tooltip.implementation_difficulty",
			timeToMarket: "scenario.metric_tooltip.time_to_market",
			techCharacteristics: "scenario.metric_tooltip.tech_characteristics",
		}
		const tooltipKey = tooltipKeys[key]
		return tooltipKey ? t(tooltipKey) : null
	}

	// Column resize state
	const resizingRef = React.useRef<{
		key: string
		startX: number
		startWidth: number
	} | null>(null)

	const handleResizeStart = (
		e: React.MouseEvent,
		colKey: string,
		thElement: HTMLTableCellElement,
	) => {
		e.preventDefault()
		e.stopPropagation()
		const startWidth = thElement.offsetWidth
		resizingRef.current = { key: colKey, startX: e.clientX, startWidth }

		const handleMouseMove = (moveEvent: MouseEvent) => {
			const ref = resizingRef.current
			if (!ref) return
			const diff = moveEvent.clientX - ref.startX
			const newWidth = Math.max(60, ref.startWidth + diff)
			setColumnWidths((prev) => ({ ...prev, [ref.key]: newWidth }))
		}

		const handleMouseUp = () => {
			resizingRef.current = null
			document.removeEventListener("mousemove", handleMouseMove)
			document.removeEventListener("mouseup", handleMouseUp)
			document.body.style.cursor = ""
			document.body.style.userSelect = ""
		}

		document.addEventListener("mousemove", handleMouseMove)
		document.addEventListener("mouseup", handleMouseUp)
		document.body.style.cursor = "col-resize"
		document.body.style.userSelect = "none"
	}

	const renderHeaderCell = (col: ColumnDefinition, colIndex: number) => {
		const isSortable = sortableColumns.includes(col.key)
		const isFilterable = filterableColumns.includes(col.key)
		const hasFilter = hasColumnFilter(col.key)
		const columnSortInfo = getSortInfo(col.key)
		const metricTooltip = getMetricTooltip(col.key)

		const resolvedWidth = columnWidths[col.key] || undefined

		return (
			<th
				key={col.key}
				ref={(el) => {
					if (el) el.dataset.colKey = col.key
				}}
				className={`group px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider relative ${
					isSortable ? "select-none" : ""
				} ${colIndex === 0 ? "sticky left-[48px] z-20 bg-gray-50" : ""}`}
				style={{
					fontWeight: 400,
					width: resolvedWidth ? `${resolvedWidth}px` : col.width,
					maxWidth: col.maxWidth,
					minWidth: resolvedWidth ? undefined : (col.width ?? "60px"),
					overflow: "hidden",
				}}
			>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1 whitespace-nowrap">
						<TooltipProvider delayDuration={200}>
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										className={
											isSortable
												? "cursor-pointer whitespace-nowrap"
												: "whitespace-nowrap"
										}
										onClick={isSortable ? () => handleSort(col.key) : undefined}
									>
										{col.label.startsWith("scenario.")
											? t(col.label)
											: col.label}
									</span>
								</TooltipTrigger>
								{metricTooltip && (
									<TooltipContent
										side="bottom"
										className="text-xs max-w-[220px] font-normal normal-case tracking-normal"
									>
										{metricTooltip}
									</TooltipContent>
								)}
							</Tooltip>
						</TooltipProvider>

						{col.key === "techCharacteristics" && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									setShowTechDialog(true)
								}}
								className="p-0.5 text-gray-400 hover:text-blue-600 transition-colors"
								aria-label="技術特性の詳細"
							>
								<ChevronRight className="h-3.5 w-3.5" />
							</button>
						)}

						{isSortable && (
							<span
								className={`transition-opacity cursor-pointer ${
									columnSortInfo.isSorted
										? "opacity-100"
										: "opacity-0 group-hover:opacity-100"
								}`}
								onClick={() => handleSort(col.key)}
							>
								{columnSortInfo.isSorted ? (
									columnSortInfo.direction === "asc" ? (
										<ArrowUp className="h-3 w-3 text-blue-600" />
									) : (
										<ArrowDown className="h-3 w-3 text-blue-600" />
									)
								) : (
									<ArrowUpDown className="h-3 w-3 text-gray-400" />
								)}
							</span>
						)}

						{isFilterable && !hasFilter && (
							<Popover
								open={columnFilterOpen === col.key}
								onOpenChange={(open) =>
									setColumnFilterOpen(open ? col.key : null)
								}
							>
								<PopoverTrigger asChild>
									<span
										className="transition-opacity cursor-pointer opacity-0 group-hover:opacity-100"
										onClick={(e) => {
											e.stopPropagation()
											setColumnFilterOpen(
												columnFilterOpen === col.key ? null : col.key,
											)
										}}
									>
										<Settings2 className="h-3 w-3 text-gray-400" />
									</span>
								</PopoverTrigger>
								<PopoverContent className="w-48 p-0" align="start">
									<div className="py-1">
										{columnFilterOptions[col.key]?.map((option) => {
											const selectedKey =
												`${col.key}Selected` as keyof typeof localFilters
											const selectedValues: string[] = ((localFilters as any)[
												selectedKey
											] || []) as string[]
											const allOptions =
												columnFilterOptions[col.key]?.map((o) => o.value) || []
											const isAllSelected = selectedValues.length === 0
											const isOptionSelected =
												isAllSelected || selectedValues.includes(option.value)

											const toggleOption = () => {
												if (isAllSelected) {
													const newSelected = allOptions.filter(
														(v) => v !== option.value,
													)
													handleFilterUpdate({
														[selectedKey]: newSelected,
													} as any)
													return
												}

												const newSelected = selectedValues.includes(
													option.value,
												)
													? selectedValues.filter((v) => v !== option.value)
													: [...selectedValues, option.value]

												const finalSelected =
													newSelected.length === allOptions.length
														? []
														: newSelected

												handleFilterUpdate({
													[selectedKey]: finalSelected,
												} as any)
											}

											return (
												<button
													key={option.value}
													type="button"
													onClick={toggleOption}
													className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
												>
													<div
														className={`w-4 h-4 rounded border flex items-center justify-center ${
															isOptionSelected
																? "bg-blue-500 border-blue-500"
																: "border-gray-300"
														}`}
													>
														{isOptionSelected && (
															<Check className="h-3 w-3 text-white" />
														)}
													</div>
													<span className="text-gray-700">{option.label}</span>
												</button>
											)
										})}
									</div>
								</PopoverContent>
							</Popover>
						)}

						{col.key === "techCharacteristics" && allTechTags.length > 0 && (
							<Popover>
								<PopoverTrigger asChild>
									<span
										className={`transition-opacity cursor-pointer ${
											selectedTechTags.length > 0
												? "opacity-100"
												: "opacity-0 group-hover:opacity-100"
										}`}
										onClick={(e) => e.stopPropagation()}
									>
										<ListFilter
											className={`h-3 w-3 ${selectedTechTags.length > 0 ? "text-blue-600" : "text-gray-400"}`}
										/>
									</span>
								</PopoverTrigger>
								<PopoverContent className="w-56 p-0" align="start">
									<div className="py-1 max-h-[300px] overflow-y-auto">
										<button
											type="button"
											onClick={() => setSelectedTechTags([])}
											className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors border-b border-gray-100"
										>
											<div
												className={`w-4 h-4 rounded border flex items-center justify-center ${
													selectedTechTags.length === 0
														? "bg-blue-500 border-blue-500"
														: "border-gray-300"
												}`}
											>
												{selectedTechTags.length === 0 && (
													<Check className="h-3 w-3 text-white" />
												)}
											</div>
											<span className="text-gray-700 font-medium">
												{t("scenario.filter.all_tags")}
											</span>
										</button>
										{allTechTags.map((tag) => {
											const isSelected = selectedTechTags.includes(tag)
											const toggleTag = () => {
												setSelectedTechTags((prev) => {
													if (isSelected) {
														return prev.filter((t) => t !== tag)
													}
													return [...prev, tag]
												})
											}
											return (
												<button
													key={tag}
													type="button"
													onClick={toggleTag}
													className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
												>
													<div
														className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
															isSelected
																? "bg-blue-500 border-blue-500"
																: "border-gray-300"
														}`}
													>
														{isSelected && (
															<Check className="h-3 w-3 text-white" />
														)}
													</div>
													<span className="text-gray-700 truncate">{tag}</span>
												</button>
											)
										})}
									</div>
								</PopoverContent>
							</Popover>
						)}
					</div>
				</div>
				{/* Resize handle */}
				<div
					className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 transition-colors z-10"
					onMouseDown={(e) => {
						const th = (e.target as HTMLElement).closest("th")
						if (th) handleResizeStart(e, col.key, th)
					}}
				/>
			</th>
		)
	}

	const renderTableView = () => (
		<div className="flex-1 overflow-auto min-h-0">
			<table
				style={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}
			>
				<thead className="bg-gray-50 border-b sticky top-0 z-30">
					<tr>
						<th className="px-4 py-3 text-left w-12 sticky left-0 z-20 bg-gray-50">
							<span className="text-xs text-gray-500 uppercase tracking-wider font-normal">
								#
							</span>
						</th>

						{visibleColumns.map((col, colIndex) =>
							renderHeaderCell(col, colIndex),
						)}

						<th className="px-4 py-3 text-right w-16">
							<TooltipProvider delayDuration={200}>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={() => setIsEnrichmentModalOpen(true)}
											className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-1 transition-colors"
										>
											<Plus className="h-4 w-4" />
										</button>
									</TooltipTrigger>
									<TooltipContent
										side="bottom"
										className="text-xs max-w-[200px] font-normal"
									>
										{t("scenario.toolbar.add_column_tooltip")}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</th>
					</tr>
				</thead>

				<tbody className="divide-y divide-gray-200">
					{filteredScenarios.length === 0 && showScenarioLoader && (
						<tr>
							<td
								colSpan={visibleColumns.length + 2}
								className="py-16 text-center"
							>
								<div className="flex flex-col items-center justify-center">
									{isCheckingDb && (
										<p className="text-gray-600">
											{t("scenario.table.checking_db")}
										</p>
									)}
									{isGeneratingScenarios && (
										<div className="w-full max-w-md mx-auto">
											<Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
											<p className="text-lg text-slate-600 mb-4">
												{t("scenario.table.checking_scenarios")}
											</p>
											<div className="flex justify-between text-xs text-slate-500 mb-2">
												<span>{t("scenario.table.progress_label")}</span>
												<span>{scenarioProgress}%</span>
											</div>
											<div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
												<div
													className="h-full bg-gradient-to-r from-violet-400 to-blue-500 rounded-full transition-all duration-200"
													style={{ width: `${scenarioProgress}%` }}
												/>
											</div>
											<p className="text-xs text-slate-400 mt-3">
												{t("scenario.table.max_time_notice")}
											</p>
										</div>
									)}
								</div>
							</td>
						</tr>
					)}
					{filteredScenarios.length === 0 && !showScenarioLoader && (
						<tr>
							<td
								colSpan={visibleColumns.length + 2}
								className="py-16 text-center"
							>
								{scenarios.length === 0 ? (
									<>
										<p className="text-gray-600 mb-4">
											{t("scenario.table.no_scenarios_generated")}
										</p>
										{onRetryGeneration && (
											<Button variant="outline" onClick={onRetryGeneration}>
												{t("scenario.table.retry_generation")}
											</Button>
										)}
									</>
								) : (
									<>
										<p className="text-gray-600 mb-4">
											{t("scenario.table.no_scenarios_found")}
										</p>
										{onClearFilters && (
											<Button variant="outline" onClick={onClearFilters}>
												{t("scenario.table.clear_all_filters")}
											</Button>
										)}
									</>
								)}
							</td>
						</tr>
					)}
					{filteredScenarios.map((scenario, index) => (
						<tr
							key={scenario.id}
							className={`hover:bg-gray-50 transition-colors ${
								isSelected(scenario.id) ? "bg-blue-50" : ""
							}`}
							style={{
								backgroundColor:
									activeScenarioId === scenario.id ? "#f8fbff" : undefined,
							}}
							onMouseEnter={() => setHoveredRowId(scenario.id)}
							onMouseLeave={() => setHoveredRowId(null)}
						>
							<td
								className="px-4 py-4 sticky left-0 z-10"
								data-cell-type="checkbox"
								style={{
									backgroundColor:
										hoveredRowId === scenario.id
											? "#f9fafb"
											: activeScenarioId === scenario.id
												? "#f8fbff"
												: "white",
								}}
							>
								{isSelected(scenario.id) ? (
									<Checkbox
										checked
										onCheckedChange={() => onToggleScenario(scenario.id)}
										className="h-4 w-4"
									/>
								) : hoveredRowId === scenario.id ? (
									<Checkbox
										checked={false}
										onCheckedChange={() => onToggleScenario(scenario.id)}
										className="h-4 w-4"
									/>
								) : (
									<span className="text-sm text-gray-500 font-medium">
										{index + 1}
									</span>
								)}
							</td>

							{renderRow({
								scenario,
								visibleColumns,
								onRowClick,
								onRowClickWithTab,
								activeScenarioId,
								isHovered: hoveredRowId === scenario.id,
								onEditScenario: (scenarioToEdit) => {
									setEditingScenario(scenarioToEdit)
									setEditScenarioName(
										scenarioToEdit.userInput?.name || scenarioToEdit.name,
									)
									setEditScenarioSummary(
										scenarioToEdit.userInput?.summary ||
											scenarioToEdit.description ||
											"",
									)
									setIsEditScenarioOpen(true)
								},
								onOpenAiDetail: setAiDetailScenarioId,
								onOpenTrlModal: setTrlModalScenario,
								t,
							})}

							<td className="px-4 py-4 text-right" data-cell-type="actions">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className={`h-8 w-8 transition-opacity ${
												hoveredRowId === scenario.id
													? "opacity-100"
													: "opacity-0"
											}`}
										>
											<MoreVertical className="h-4 w-4 text-gray-500" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-48">
										<DropdownMenuItem
											onClick={() => handleScenarioReport(scenario.id)}
											className="cursor-pointer"
										>
											<FileText className="h-4 w-4 mr-2" />
											Scenario Report
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleEdit(scenario.id)}
											className="cursor-pointer"
										>
											<Edit className="h-4 w-4 mr-2" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => {
												console.log("Remove scenario:", scenario.id)
											}}
											className="cursor-pointer text-red-600 focus:text-red-600"
										>
											<Trash2 className="h-4 w-4 mr-2" />
											{t("scenario.table.delete")}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</td>
						</tr>
					))}

					{onAddScenario && !isGeneratingScenarios && (
						<tr
							className="hover:bg-blue-50 transition-colors cursor-pointer group border-t border-dashed border-gray-300"
							onClick={() => setIsAddScenarioOpen(true)}
						>
							<td colSpan={visibleColumns.length + 2} className="px-4 py-3">
								<div className="flex items-center gap-1.5 text-gray-500 group-hover:text-blue-600 transition-colors">
									<Plus className="h-4 w-4" />
									<span className="text-sm">
										{t("scenario.table.new_scenario")}
									</span>
								</div>
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	)

	// In mindmap view, when no treeData is available, only scenarios listed in `scenariosWithTrees`
	// are rendered as top-level nodes, and they indicate which scenarios have drill-down capability.
	const renderMindmapView = () => (
		<div className="flex-1 overflow-hidden h-full">
			<ScenarioMindmap
				scenarios={scenarios}
				selectedScenarioIds={selectedScenarioIds}
				onToggleScenario={onToggleScenario}
				onSelectAll={onSelectAll}
				onSelectNone={onSelectNone}
				searchTheme={searchTheme}
				onRowClick={onRowClick}
				activeScenarioId={activeScenarioId}
				treeData={treeData}
				isLoadingTree={isLoadingTree}
				onResearchPanelChange={onResearchPanelChange}
				onAiAssist={onAiAssist}
				treeId={treeId}
				treeMode={treeMode}
				scenariosWithTrees={scenariosWithTrees}
			/>
		</div>
	)

	return (
		<>
			<Dialog
				open={aiDetailScenarioId !== null}
				onOpenChange={(open) => !open && setAiDetailScenarioId(null)}
			>
				<DialogContent
					className="sm:max-w-[600px] z-[100]"
					style={{ pointerEvents: "auto" }}
				>
					<div className="group flex items-center gap-1">
						<DialogTitle>{t("scenario.ai_detail.title")}</DialogTitle>
						<ChevronRight className="h-3 w-3 text-muted-foreground hidden group-hover:inline-block shrink-0" />
					</div>
					<DialogHeader>
						<DialogDescription className="text-sm text-gray-600">
							{t("scenario.ai_detail.search_theme_label")}:{" "}
							<span className="font-medium text-gray-800">
								{searchTheme || t("scenario.ai_detail.no_search_theme")}
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							{t("scenario.ai_detail.added_info_label")}
						</Label>
						<div className="relative">
							<Textarea
								className="min-h-[150px] resize-none bg-gray-50 read-only:border-gray-200 read-only:focus-visible:ring-0 pr-10"
								value={aiDetailScenario?.aiGenerationInput?.context ?? ""}
								readOnly
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute right-2 top-2 h-8 w-8 text-xs text-[#b7bfcc] hover:text-gray-700 hover:bg-gray-200"
								onClick={() => {
									const text =
										aiDetailScenario?.aiGenerationInput?.context ?? ""
									if (!text) return
									void navigator.clipboard.writeText(text)
									toast({
										title: t("scenario.ai_detail.copied_title"),
										description: t("scenario.ai_detail.copied_description"),
									})
								}}
							>
								<Copy className="h-4 w-4" />
								<span className="sr-only">
									{t("scenario.ai_detail.copy_sr")}
								</span>
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col">
				<div className="p-4 border-b bg-white space-y-3 flex-shrink-0">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-1">
								<h3
									className="font-normal text-gray-900"
									style={{ fontWeight: 400 }}
								>
									{displayMode === "mindmap"
										? t("scenario.header.check_tech_seeds")
										: t("scenario.header.check_scenarios")}
								</h3>
								<TooltipProvider delayDuration={200}>
									<Tooltip>
										<TooltipTrigger asChild>
											<HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
										</TooltipTrigger>
										<TooltipContent
											side="bottom"
											className="text-xs max-w-[280px]"
										>
											<p>{t("scenario.header.guide_tooltip")}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>

							{/* 3-step stepper */}
							<div className="flex items-center gap-0">
								{/* Step 1 — Select scenarios */}
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												type="button"
												onClick={() => handleDisplayModeChange("table")}
												className="flex items-center gap-2 px-1 py-1 rounded hover:bg-gray-50 transition-colors"
											>
												<span
													className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-colors ${
														displayMode === "table"
															? "bg-blue-600 text-white"
															: "border border-gray-300 text-gray-400 bg-white"
													}`}
												>
													1
												</span>
												<span
													className={`text-sm font-medium transition-colors ${
														displayMode === "table"
															? "text-blue-600"
															: "text-gray-400"
													}`}
												>
													{t("scenario.header.select_scenarios")}
												</span>
											</button>
										</TooltipTrigger>
										<TooltipContent className="max-w-[280px]">
											<p>{t("scenario.header.select_scenarios_tooltip")}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>

								{/* Connector */}
								<div className="w-8 h-px bg-gray-200 mx-2 flex-shrink-0" />

								{/* Step 2 — Generate tree */}
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												type="button"
												onClick={
													selectedScenarioIds.length > 0 &&
													!isGenerating &&
													!generationSuccess
														? onGenerateTree
														: undefined
												}
												disabled={
													selectedScenarioIds.length === 0 && !generationSuccess
												}
												className={`flex items-center gap-2 px-1 py-1 rounded transition-colors ${
													generationSuccess
														? "cursor-default text-green-600"
														: selectedScenarioIds.length > 0 && !isGenerating
															? "hover:bg-gray-50 cursor-pointer"
															: "cursor-default"
												}`}
											>
												<span
													className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-colors flex-shrink-0 ${
														generationSuccess
															? "bg-green-500 text-white"
															: isGenerating
																? "bg-blue-600 text-white"
																: selectedScenarioIds.length > 0
																	? "border border-blue-500 text-blue-500 bg-white"
																	: "border border-gray-200 text-gray-300 bg-white"
													}`}
												>
													{generationSuccess ? (
														<Check className="h-3.5 w-3.5" />
													) : isGenerating ? (
														<Loader2 className="h-3.5 w-3.5 animate-spin" />
													) : (
														2
													)}
												</span>
												<span
													className={`text-sm font-medium transition-colors ${
														generationSuccess
															? "text-green-600"
															: isGenerating
																? "text-blue-600"
																: selectedScenarioIds.length > 0
																	? "text-blue-600"
																	: "text-gray-300"
													}`}
												>
													{isGenerating
														? generationProgress
															? `${t("scenario.header.generating")} (${generationProgress.current}/${generationProgress.total})`
															: t("scenario.header.generating")
														: generationSuccess
															? t("scenario.header.generation_complete")
															: selectedScenarioIds.length > 0
																? `${t("scenario.header.create_tree")} (${selectedScenarioIds.length})`
																: t("scenario.header.create_tree")}
												</span>
											</button>
										</TooltipTrigger>
										<TooltipContent className="max-w-[280px]">
											<p>
												{generationSuccess
													? t("scenario.header.generation_success_tooltip")
													: selectedScenarioIds.length > 0
														? `${t("scenario.header.generate_tree_tooltip_prefix")}${selectedScenarioIds.length}${t("scenario.header.generate_tree_tooltip_suffix")}`
														: t(
																"scenario.header.generate_tree_no_selection_tooltip",
															)}
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>

								{/* Connector */}
								<div className="w-8 h-px bg-gray-200 mx-2 flex-shrink-0" />

								{/* Step 3 — View tree */}
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												type="button"
												onClick={() => handleDisplayModeChange("mindmap")}
												className="flex items-center gap-2 px-1 py-1 rounded hover:bg-gray-50 transition-colors"
											>
												<span
													className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-colors ${
														displayMode === "mindmap"
															? "bg-blue-600 text-white"
															: "border border-gray-300 text-gray-400 bg-white"
													}`}
												>
													3
												</span>
												<span
													className={`text-sm font-medium transition-colors ${
														displayMode === "mindmap"
															? "text-blue-600"
															: "text-gray-400"
													}`}
												>
													{t("scenario.header.show_all_mindmaps")}
												</span>
											</button>
										</TooltipTrigger>
										<TooltipContent className="max-w-[250px]">
											<p>{t("scenario.header.show_all_mindmaps_tooltip")}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						</div>

						{displayMode === "mindmap" && (
							<DropdownMenu>
								<TooltipProvider delayDuration={200}>
									<Tooltip>
										<TooltipTrigger asChild>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 px-2 text-gray-500 hover:text-gray-700"
												>
													<Download className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
										</TooltipTrigger>
										<TooltipContent side="bottom" className="text-xs">
											{t("scenario.export.export_mindmap")}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
								<DropdownMenuContent align="end" className="w-48">
									<DropdownMenuItem
										onClick={() => {
											const mindmapElement = document.querySelector(
												'[data-mindmap-container="true"]',
											) as HTMLElement | null

											if (!mindmapElement) return

											import("html-to-image").then(({ toJpeg }) => {
												toJpeg(mindmapElement, {
													quality: 0.95,
													backgroundColor: "#ffffff",
												}).then((dataUrl) => {
													const link = document.createElement("a")
													link.download = `mindmap_${new Date().toISOString().split("T")[0]}.jpg`
													link.href = dataUrl
													link.click()
												})
											})
										}}
										className="cursor-pointer"
									>
										<FileText className="h-4 w-4 mr-2" />
										{t("scenario.export.export_jpg")}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											const mindmapElement = document.querySelector(
												'[data-mindmap-container="true"]',
											) as HTMLElement | null

											if (!mindmapElement) return

											import("html-to-image").then(({ toPng }) => {
												toPng(mindmapElement, {
													backgroundColor: "#ffffff",
												}).then((dataUrl) => {
													import("jspdf").then(({ default: jsPDF }) => {
														const img = new Image()
														img.src = dataUrl
														img.onload = () => {
															const pdf = new jsPDF({
																orientation:
																	img.width > img.height
																		? "landscape"
																		: "portrait",
																unit: "px",
																format: [img.width, img.height],
															})
															pdf.addImage(
																dataUrl,
																"PNG",
																0,
																0,
																img.width,
																img.height,
															)
															pdf.save(
																`mindmap_${new Date().toISOString().split("T")[0]}.pdf`,
															)
														}
													})
												})
											})
										}}
										className="cursor-pointer"
									>
										<FileText className="h-4 w-4 mr-2" />
										{t("scenario.export.export_pdf")}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>

					{displayMode === "table" && (
						<>
							{/* TechnicalStrengthsCard moved to EditQueryModal
							<TechnicalStrengthsCard
								technicalStrengths={technicalStrengths}
								isLoading={technicalStrengths.length === 0}
								errorMessage={null}
								defaultCollapsed={true}
							/>
							*/}
							<div className="flex items-center justify-between border-b border-gray-100 -mx-4 px-4">
								<div className="flex items-center gap-1 group">
									{(["overview", "market", "research"] as const).map((mode) => (
										<button
											key={mode}
											type="button"
											onClick={() => setViewMode(mode)}
											className={`px-3 py-2 text-sm transition-colors relative ${
												viewMode === mode
													? "text-blue-600 font-medium"
													: "text-gray-500 hover:text-gray-700 font-normal"
											}`}
										>
											{mode === "overview"
												? t("scenario.tabs.overview")
												: mode === "market"
													? t("scenario.tabs.market")
													: t("scenario.tabs.research")}
											{viewMode === mode && (
												<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
											)}
										</button>
									))}

									{customViews.map((customView) => (
										<button
											key={customView.id}
											type="button"
											onClick={() => setViewMode(customView.id as ViewMode)}
											className={`px-3 py-2 text-sm font-medium transition-colors relative ${
												viewMode === customView.id
													? "text-blue-600"
													: "text-gray-500 hover:text-gray-700"
											}`}
										>
											{customView.name}
											{viewMode === customView.id && (
												<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
											)}
										</button>
									))}

									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													onClick={() => setIsCustomViewModalOpen(true)}
													className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-all duration-200 flex items-center gap-1 opacity-0 group-hover:opacity-100"
												>
													<Plus className="h-3 w-3" />
													{t("scenario.tabs.custom")}
												</button>
											</TooltipTrigger>
											<TooltipContent className="max-w-[200px]">
												<p>{t("scenario.tabs.custom_tooltip")}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
							</div>

							<div className="flex items-center justify-between gap-2">
								<div className="flex flex-wrap items-center gap-2">
									<Select
										value={localFilters.tamCategory}
										onValueChange={(value: FilterState["tamCategory"]) =>
											handleFilterUpdate({ tamCategory: value })
										}
									>
										<SelectTrigger
											className="focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
											style={{
												width: "132px",
												height: "30px",
												color: "#4c5361",
											}}
										>
											<SelectValue placeholder="TAM" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												{t("scenario.filter.all_tam")}
											</SelectItem>
											<SelectItem value="small">
												{t("scenario.filter.tam_small")}
											</SelectItem>
											<SelectItem value="medium">
												{t("scenario.filter.tam_medium")}
											</SelectItem>
											<SelectItem value="large">
												{t("scenario.filter.tam_large")}
											</SelectItem>
											<SelectItem value="very-large">
												{t("scenario.filter.tam_very_large")}
											</SelectItem>
										</SelectContent>
									</Select>

									<Select
										value={localFilters.trlCategory}
										onValueChange={(value: FilterState["trlCategory"]) =>
											handleFilterUpdate({ trlCategory: value })
										}
									>
										<SelectTrigger
											className="focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
											style={{
												width: "132px",
												height: "30px",
												color: "#4c5361",
											}}
										>
											<SelectValue placeholder="TRL" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												{t("scenario.filter.all_trl")}
											</SelectItem>
											<SelectItem value="early">
												{t("scenario.filter.trl_early")}
											</SelectItem>
											<SelectItem value="mid">
												{t("scenario.filter.trl_mid")}
											</SelectItem>
											<SelectItem value="mature">
												{t("scenario.filter.trl_mature")}
											</SelectItem>
										</SelectContent>
									</Select>

									<Select
										value={localFilters.cagrCategory}
										onValueChange={(value) =>
											handleFilterUpdate({
												cagrCategory: value as FilterState["cagrCategory"],
											})
										}
									>
										<SelectTrigger
											className="focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
											style={{
												width: "150px",
												height: "30px",
												color: "#4c5361",
											}}
										>
											<SelectValue placeholder="CAGR" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												{t("scenario.filter.all_cagr")}
											</SelectItem>
											<SelectItem value="low">
												{t("scenario.filter.cagr_low")}
											</SelectItem>
											<SelectItem value="medium">
												{t("scenario.filter.cagr_medium")}
											</SelectItem>
											<SelectItem value="high">
												{t("scenario.filter.cagr_high")}
											</SelectItem>
											<SelectItem value="very-high">
												{t("scenario.filter.cagr_very_high")}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsAddScenarioOpen(true)}
										className="border-gray-300 hover:bg-gray-50 text-gray-600"
										style={{ fontWeight: 400, height: "30px" }}
									>
										<Plus className="h-3 w-3 mr-1" />
										{t("scenario.toolbar.add_scenario")}
									</Button>

									<Button
										variant="outline"
										size="sm"
										className="border-gray-300 hover:bg-gray-50 text-gray-600"
										style={{ fontWeight: 400, height: "30px" }}
										onClick={() => setIsEnrichmentModalOpen(true)}
									>
										<Plus className="h-3 w-3 mr-1" />
										{t("scenario.toolbar.add_column")}
									</Button>

									<div className="flex items-center gap-1">
										<Popover
											open={isFilterPopoverOpen}
											onOpenChange={setIsFilterPopoverOpen}
										>
											<TooltipProvider delayDuration={200}>
												<Tooltip>
													<TooltipTrigger asChild>
														<PopoverTrigger asChild>
															<Button
																variant="ghost"
																size="sm"
																className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
															>
																<ListFilter className="h-4 w-4" />
															</Button>
														</PopoverTrigger>
													</TooltipTrigger>
													<TooltipContent side="bottom" className="text-xs">
														{t("scenario.toolbar.filter")}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
											<PopoverContent className="w-96" align="start">
												<div className="space-y-3">
													<h4
														className="font-semibold text-sm"
														style={{ fontWeight: 500 }}
													>
														{t("scenario.toolbar.filter")}
													</h4>

													<div className="space-y-2 max-h-[400px] overflow-y-auto">
														{UNIFIED_METRICS.map((category: any) => {
															const isExpanded = expandedFilterCategories.has(
																category.id,
															)

															return (
																<div
																	key={category.id}
																	className="border rounded-lg"
																>
																	<button
																		type="button"
																		onClick={() => {
																			setExpandedFilterCategories((prev) => {
																				const next = new Set(prev)
																				if (next.has(category.id))
																					next.delete(category.id)
																				else next.add(category.id)
																				return next
																			})
																		}}
																		className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
																	>
																		{isExpanded ? (
																			<ChevronDown className="h-4 w-4 text-gray-500" />
																		) : (
																			<ChevronRight className="h-4 w-4 text-gray-500" />
																		)}
																		<span className="text-xs font-medium text-gray-700">
																			{category.labelKey
																				? t(category.labelKey)
																				: category.label}
																		</span>
																	</button>

																	{isExpanded && (
																		<div className="px-3 pb-3 space-y-3">
																			{category.metrics.map((metric: any) => {
																				const selectedValues: string[] = ((
																					localFilters as any
																				)[`${metric.key}Selected`] ||
																					[]) as string[]

																				const allOptions =
																					metric.selectOptions
																						?.filter(
																							(opt: any) => opt.value !== "all",
																						)
																						.map((opt: any) => opt.value) || []

																				const isAllSelected =
																					selectedValues.length === 0
																				const isOptionSelected = (
																					optValue: string,
																				) =>
																					isAllSelected ||
																					selectedValues.includes(optValue)

																				const toggleOption = (
																					optValue: string,
																				) => {
																					if (isAllSelected) {
																						const newSelected =
																							allOptions.filter(
																								(v: string) => v !== optValue,
																							)
																						handleFilterUpdate({
																							[`${metric.key}Selected`]:
																								newSelected,
																						} as any)
																						return
																					}

																					const newSelected =
																						selectedValues.includes(optValue)
																							? selectedValues.filter(
																									(v) => v !== optValue,
																								)
																							: [...selectedValues, optValue]

																					const finalSelected =
																						newSelected.length ===
																						allOptions.length
																							? []
																							: newSelected

																					handleFilterUpdate({
																						[`${metric.key}Selected`]:
																							finalSelected,
																					} as any)
																				}

																				return (
																					<div
																						key={metric.key}
																						className="space-y-1"
																					>
																						<Label className="text-xs text-gray-600">
																							{metric.labelKey
																								? t(metric.labelKey)
																								: metric.label}
																						</Label>

																						{metric.filterType === "select" &&
																							metric.selectOptions && (
																								<div className="flex flex-wrap gap-1">
																									{metric.selectOptions
																										.filter(
																											(opt: any) =>
																												opt.value !== "all",
																										)
																										.map((opt: any) => (
																											<button
																												key={opt.value}
																												type="button"
																												onClick={() =>
																													toggleOption(
																														opt.value,
																													)
																												}
																												className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all ${
																													isOptionSelected(
																														opt.value,
																													)
																														? "bg-blue-50 border-blue-200 text-blue-700"
																														: "bg-gray-50 border-gray-200 text-gray-400"
																												}`}
																											>
																												{isOptionSelected(
																													opt.value,
																												) && (
																													<Check className="h-3 w-3" />
																												)}
																												<span>
																													{opt.labelKey
																														? t(opt.labelKey)
																														: opt.label}
																												</span>
																											</button>
																										))}
																								</div>
																							)}

																						{metric.filterType === "range" && (
																							<div className="flex items-center gap-2">
																								<Input
																									type="number"
																									placeholder={t(
																										"scenario.filter.min_placeholder",
																									)}
																									value={
																										((localFilters as any)[
																											`min${metric.key.charAt(0).toUpperCase() + metric.key.slice(1)}`
																										] as number | undefined) ||
																										""
																									}
																									onChange={(e) =>
																										handleFilterUpdate({
																											[`min${metric.key.charAt(0).toUpperCase() + metric.key.slice(1)}`]:
																												e.target.value
																													? Number(
																															e.target.value,
																														)
																													: 0,
																										} as any)
																									}
																									className="h-8 text-xs"
																									min={
																										metric.rangeConfig?.min ?? 0
																									}
																									max={metric.rangeConfig?.max}
																								/>
																								<span className="text-gray-500 text-xs">
																									-
																								</span>
																								<Input
																									type="number"
																									placeholder={t(
																										"scenario.filter.max_placeholder",
																									)}
																									value={
																										((localFilters as any)[
																											`max${metric.key.charAt(0).toUpperCase() + metric.key.slice(1)}`
																										] as number | undefined) ||
																										""
																									}
																									onChange={(e) =>
																										handleFilterUpdate({
																											[`max${metric.key.charAt(0).toUpperCase() + metric.key.slice(1)}`]:
																												e.target.value
																													? Number(
																															e.target.value,
																														)
																													: undefined,
																										} as any)
																									}
																									className="h-8 text-xs"
																									min={
																										metric.rangeConfig?.min ?? 0
																									}
																									max={metric.rangeConfig?.max}
																								/>
																								{metric.rangeConfig?.unit && (
																									<span className="text-gray-400 text-xs">
																										{metric.rangeConfig.unit}
																									</span>
																								)}
																							</div>
																						)}
																					</div>
																				)
																			})}
																		</div>
																	)}
																</div>
															)
														})}
													</div>

													<div className="flex items-center justify-start gap-2 pt-2 border-t">
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																handleResetFilters()
																setIsFilterPopoverOpen(false)
															}}
															className="text-gray-600 hover:text-gray-900"
															style={{ fontWeight: 400 }}
														>
															{t("scenario.filter.reset")}
														</Button>
														<Button
															size="sm"
															onClick={() => setIsFilterPopoverOpen(false)}
															className="bg-blue-500 hover:bg-blue-600 text-white"
															style={{ fontWeight: 400 }}
														>
															{t("scenario.filter.apply")}
														</Button>
													</div>
												</div>
											</PopoverContent>
										</Popover>

										<Popover
											open={isSortPopoverOpen}
											onOpenChange={setIsSortPopoverOpen}
										>
											<TooltipProvider delayDuration={200}>
												<Tooltip>
													<TooltipTrigger asChild>
														<PopoverTrigger asChild>
															<Button
																variant="ghost"
																size="sm"
																className={`h-8 w-8 p-0 hover:bg-gray-100 ${
																	sortCriteria.length > 0
																		? "text-blue-600"
																		: "text-gray-500 hover:text-gray-700"
																}`}
															>
																<ArrowUpDown className="h-4 w-4" />
															</Button>
														</PopoverTrigger>
													</TooltipTrigger>
													<TooltipContent side="bottom" className="text-xs">
														{t("scenario.sort.sort_label")}{" "}
														{sortCriteria.length > 0
															? `(${sortCriteria.length})`
															: ""}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											<PopoverContent className="w-80 p-0" align="end">
												<div className="p-3 space-y-2">
													{sortCriteria.length === 0 ? (
														<div className="text-sm text-gray-500 py-2 text-center">
															{t("scenario.sort.no_criteria")}
														</div>
													) : (
														<div className="space-y-2">
															{sortCriteria.map((criterion) => (
																<div
																	key={criterion.id}
																	className="flex items-center gap-2 p-2 bg-[#f5f9ff] rounded-lg"
																>
																	<div className="cursor-grab text-gray-400 hover:text-gray-600">
																		<GripVertical className="h-4 w-4" />
																	</div>

																	<Select
																		value={criterion.column}
																		onValueChange={(value) =>
																			updateSortCriterion(criterion.id, {
																				column: value,
																			})
																		}
																	>
																		<SelectTrigger className="h-8 flex-1 text-xs">
																			<SelectValue />
																		</SelectTrigger>
																		<SelectContent>
																			{SORT_COLUMN_OPTIONS.map((opt) => (
																				<SelectItem
																					key={opt.value}
																					value={opt.value}
																					disabled={sortCriteria.some(
																						(c) =>
																							c.id !== criterion.id &&
																							c.column === opt.value,
																					)}
																				>
																					{opt.label.startsWith("scenario.")
																						? t(opt.label)
																						: opt.label}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>

																	<Select
																		value={criterion.direction}
																		onValueChange={(value: SortDirection) =>
																			updateSortCriterion(criterion.id, {
																				direction: value,
																			})
																		}
																	>
																		<SelectTrigger className="h-8 w-24 text-xs">
																			<SelectValue />
																		</SelectTrigger>
																		<SelectContent>
																			<SelectItem value="asc">
																				{t("scenario.sort.asc")}
																			</SelectItem>
																			<SelectItem value="desc">
																				{t("scenario.sort.desc")}
																			</SelectItem>
																		</SelectContent>
																	</Select>

																	<Button
																		variant="ghost"
																		size="sm"
																		className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
																		onClick={() =>
																			removeSortCriterion(criterion.id)
																		}
																	>
																		<X className="h-4 w-4" />
																	</Button>
																</div>
															))}
														</div>
													)}

													<div className="border-t pt-2 space-y-1">
														<button
															type="button"
															className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
															onClick={addSortCriterion}
															disabled={
																sortCriteria.length >=
																SORT_COLUMN_OPTIONS.length
															}
														>
															<Plus className="h-4 w-4" />
															Add sort
														</button>
														{sortCriteria.length > 0 && (
															<button
																type="button"
																className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
																onClick={clearAllSortCriteria}
															>
																<Trash2 className="h-4 w-4" strokeWidth={1.5} />
																Delete sort
															</button>
														)}
													</div>
												</div>
											</PopoverContent>
										</Popover>

										<DropdownMenu>
											<TooltipProvider delayDuration={200}>
												<Tooltip>
													<TooltipTrigger asChild>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="sm"
																className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
															>
																<Download className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
													</TooltipTrigger>
													<TooltipContent side="bottom" className="text-xs">
														{t("scenario.export.export_table")}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
											<DropdownMenuContent align="end" className="w-48">
												<DropdownMenuItem
													onClick={handleExportCsv}
													className="cursor-pointer"
												>
													<FileText className="h-4 w-4 mr-2" />
													{t("scenario.export.export_csv")}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={handleExportSpreadsheet}
													className="cursor-pointer"
												>
													<FileText className="h-4 w-4 mr-2" />
													{t("scenario.export.export_spreadsheet")}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</div>
						</>
					)}

					{displayMode === "table" && activeFilters.length > 0 && (
						<div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
							{activeFilters.map((filter) => (
								<div
									key={filter.key}
									className="inline-flex items-center gap-1.5 px-3 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-300"
									style={{ fontWeight: 400, height: "30px" }}
								>
									<span>{filter.label}</span>
									<button
										type="button"
										onClick={() => removeFilter(filter.key)}
										className="hover:bg-gray-200 rounded-full p-0.5"
									>
										<X className="h-3 w-3" />
									</button>
								</div>
							))}
							<Button
								variant="ghost"
								size="sm"
								onClick={handleResetFilters}
								className="text-xs text-gray-600 hover:text-gray-900"
								style={{ fontWeight: 400, height: "30px" }}
							>
								{t("scenario.filter.reset_filters")}
							</Button>
						</div>
					)}
				</div>

				{displayMode === "table" ? renderTableView() : renderMindmapView()}

				<EditScenarioModal
					isOpen={editModalOpen}
					onClose={() => setEditModalOpen(false)}
					scenario={selectedScenario}
					onSave={handleSaveScenario}
					onRegenerate={handleRegenerateScenario}
				/>

				<AddEnrichmentModal
					isOpen={isEnrichmentModalOpen}
					onClose={() => setIsEnrichmentModalOpen(false)}
					availableEnrichments={availableEnrichments}
					existingColumnKeys={visibleColumns.map((col) => col.key)}
					onToggleEnrichment={handleToggleEnrichment}
				/>

				<CustomViewModal
					isOpen={isCustomViewModalOpen}
					onClose={() => setIsCustomViewModalOpen(false)}
					availableColumns={availableColumns}
					onCreateView={handleCreateCustomView}
				/>

				<Dialog open={isEditScenarioOpen} onOpenChange={setIsEditScenarioOpen}>
					<DialogContent className="sm:max-w-[600px]">
						<DialogHeader>
							<DialogTitle>{t("scenario.edit_scenario.title")}</DialogTitle>
							<DialogDescription className="text-sm text-gray-600">
								{t("scenario.edit_scenario.search_theme_label")}:{" "}
								<span className="font-medium text-gray-800">
									{searchTheme || t("scenario.edit_scenario.no_search_theme")}
								</span>
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 pt-4">
							<div className="space-y-2">
								<Label htmlFor="edit-name" className="text-sm font-medium">
									{t("scenario.edit_scenario.name_label")}{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Input
									id="edit-name"
									placeholder={t("scenario.edit_scenario.name_placeholder")}
									value={editScenarioName}
									onChange={(e) => setEditScenarioName(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="edit-summary" className="text-sm font-medium">
									{t("scenario.edit_scenario.summary_label")}{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Textarea
									id="edit-summary"
									placeholder={t("scenario.edit_scenario.summary_placeholder")}
									value={editScenarioSummary}
									onChange={(e) => setEditScenarioSummary(e.target.value)}
									className="min-h-[120px] resize-none"
								/>
							</div>

							<div className="flex justify-end gap-2 pt-2">
								<Button
									variant="outline"
									onClick={() => {
										setEditScenarioName("")
										setEditScenarioSummary("")
										setEditingScenario(null)
										setIsEditScenarioOpen(false)
									}}
								>
									{t("scenario.edit_scenario.cancel")}
								</Button>
								<Button
									onClick={() => {
										if (
											!editScenarioName.trim() ||
											!editScenarioSummary.trim() ||
											!editingScenario
										) {
											return
										}

										const updatedScenario: Scenario = {
											...editingScenario,
											name: editScenarioName.trim(),
											description: editScenarioSummary.trim(),
											userInput: {
												name: editScenarioName.trim(),
												summary: editScenarioSummary.trim(),
											},
										}

										onSaveScenario?.(updatedScenario)
										setEditScenarioName("")
										setEditScenarioSummary("")
										setEditingScenario(null)
										setIsEditScenarioOpen(false)
									}}
									disabled={
										!editScenarioName.trim() || !editScenarioSummary.trim()
									}
								>
									{t("scenario.edit_scenario.replace")}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				<TRLModal
					open={!!trlModalScenario}
					onOpenChange={(open) => !open && setTrlModalScenario(null)}
					scenario={trlModalScenario}
				/>

				{isAddScenarioOpen && (
					<Dialog open={isAddScenarioOpen} onOpenChange={setIsAddScenarioOpen}>
						<DialogContent className="sm:max-w-[600px]">
							<div className="group flex items-center gap-1">
								<DialogTitle>{t("scenario.add_scenario.title")}</DialogTitle>
								<ChevronRight className="h-3 w-3 text-muted-foreground hidden group-hover:inline-block shrink-0" />
							</div>

							<DialogHeader>
								<DialogDescription className="text-sm text-gray-600">
									{t("scenario.add_scenario.search_theme_label")}:{" "}
									<span className="font-medium text-gray-800">
										{searchTheme || t("scenario.add_scenario.no_search_theme")}
									</span>
								</DialogDescription>
							</DialogHeader>

							<Tabs
								value={addScenarioTab}
								onValueChange={(v) => setAddScenarioTab(v as "ai" | "manual")}
								className="w-full"
							>
								<div className="inline-flex items-center border border-gray-200 rounded-lg p-0.5 w-fit">
									<button
										type="button"
										onClick={() => setAddScenarioTab("ai")}
										className={`px-3 py-1 text-xs rounded-md transition-colors ${
											addScenarioTab === "ai"
												? "bg-blue-50 text-blue-600 font-medium"
												: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
										}`}
									>
										{t("scenario.add_scenario.tab_ai")}
									</button>
									<button
										type="button"
										onClick={() => setAddScenarioTab("manual")}
										className={`px-3 py-1 text-xs rounded-md transition-colors ${
											addScenarioTab === "manual"
												? "bg-blue-50 text-blue-600 font-medium"
												: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
										}`}
									>
										{t("scenario.add_scenario.tab_manual")}
									</button>
								</div>

								<TabsContent value="ai" className="space-y-4 pt-4">
									<div className="space-y-2">
										<Label htmlFor="context" className="text-sm font-medium">
											{t("scenario.add_scenario.ai_context_label")}
										</Label>
										<Textarea
											id="context"
											placeholder={t(
												"scenario.add_scenario.ai_context_placeholder",
											)}
											value={addScenarioContext}
											onChange={(e) => setAddScenarioContext(e.target.value)}
											className="min-h-[150px] resize-none"
											disabled={isAddingScenario}
										/>
									</div>

									<div className="flex justify-end gap-2 pt-2">
										<Button
											variant="outline"
											onClick={() => {
												setAddScenarioContext("")
												setIsAddScenarioOpen(false)
											}}
											disabled={isAddingScenario}
										>
											{t("scenario.add_scenario.cancel")}
										</Button>
										<Button
											className="bg-blue-600 hover:bg-blue-600/90 text-white"
											onClick={async () => {
												console.log(
													"[ADD_SCENARIO] button clicked, onAddScenario=",
													typeof onAddScenario,
													"context=",
													addScenarioContext.trim(),
												)
												if (!addScenarioContext.trim()) return
												setIsAddingScenario(true)
												try {
													console.log("[ADD_SCENARIO] calling onAddScenario")
													await onAddScenario?.(addScenarioContext.trim())
													setAddScenarioContext("")
													setIsAddScenarioOpen(false)
													toast({
														title: t("scenario.add_scenario.success_title"),
														description: t(
															"scenario.add_scenario.ai_success_description",
														),
													})
												} catch (error) {
													console.error("[ADD_SCENARIO] Error:", error)
													toast({
														title: t("scenario.add_scenario.error_title"),
														description: t(
															"scenario.add_scenario.error_description",
														),
													})
												} finally {
													setIsAddingScenario(false)
												}
											}}
											disabled={isAddingScenario || !addScenarioContext.trim()}
										>
											{isAddingScenario ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													{t("scenario.add_scenario.generating")}
												</>
											) : (
												t("scenario.add_scenario.generate_start")
											)}
										</Button>
									</div>
								</TabsContent>

								<TabsContent value="manual" className="space-y-4 pt-4">
									<div className="space-y-2">
										<Label
											htmlFor="manual-name"
											className="text-sm font-medium"
										>
											{t("scenario.add_scenario.name_label")}{" "}
											<span className="text-red-500">*</span>
										</Label>
										<Input
											id="manual-name"
											placeholder={t("scenario.add_scenario.name_placeholder")}
											value={manualScenarioName}
											onChange={(e) => setManualScenarioName(e.target.value)}
										/>
									</div>

									<div className="space-y-2">
										<Label
											htmlFor="manual-summary"
											className="text-sm font-medium"
										>
											{t("scenario.add_scenario.summary_label")}{" "}
											<span className="text-red-500">*</span>
										</Label>
										<Textarea
											id="manual-summary"
											placeholder={t(
												"scenario.add_scenario.summary_placeholder",
											)}
											value={manualScenarioSummary}
											onChange={(e) => setManualScenarioSummary(e.target.value)}
											className="min-h-[120px] resize-none"
										/>
									</div>

									<div className="flex justify-end gap-2 pt-2">
										<Button
											variant="outline"
											onClick={() => {
												setManualScenarioName("")
												setManualScenarioSummary("")
												setIsAddScenarioOpen(false)
											}}
										>
											{t("scenario.add_scenario.cancel")}
										</Button>
										<Button
											onClick={async () => {
												if (
													!manualScenarioName.trim() ||
													!manualScenarioSummary.trim()
												) {
													return
												}
												try {
													await onAddManualScenario?.({
														name: manualScenarioName.trim(),
														summary: manualScenarioSummary.trim(),
													})
													setManualScenarioName("")
													setManualScenarioSummary("")
													setIsAddScenarioOpen(false)
													toast({
														title: t("scenario.add_scenario.success_title"),
														description: t(
															"scenario.add_scenario.manual_success_description",
														),
													})
												} catch (error) {
													console.error("[ADD_MANUAL_SCENARIO] Error:", error)
													toast({
														title: t("scenario.add_scenario.error_title"),
														description: t(
															"scenario.add_scenario.error_description",
														),
													})
												}
											}}
											disabled={
												!manualScenarioName.trim() ||
												!manualScenarioSummary.trim()
											}
											className="bg-[rgba(38,99,235,0.9)] text-primary-foreground hover:bg-[rgba(38,99,235,0.8)]"
										>
											{t("scenario.add_scenario.add")}
										</Button>
									</div>
								</TabsContent>
							</Tabs>
						</DialogContent>
					</Dialog>
				)}
			</div>

			<TechCharacteristicsDialog
				open={showTechDialog}
				onOpenChange={setShowTechDialog}
				onConfirm={() => setShowTechDialog(false)}
				query={searchTheme}
				techStrengths={technicalStrengths.map((s: any) => ({
					strength_name: s.strength_name ?? s.name ?? "",
					description: s.description ?? "",
					potential_applications: s.potential_applications ?? "",
				}))}
				isLoadingTechStrengths={false}
				showConfirmButton={false}
				showDownloadButton={true}
			/>
		</>
	)
}

type TechnicalStrength = {
	id: string
	tree_id: string
	name?: string | null
	description?: string | null
	[key: string]: any
}

type TechnicalStrengthsCardProps = {
	technicalStrengths?: TechnicalStrength[]
	isLoading?: boolean
	errorMessage?: string | null
	className?: string
	defaultCollapsed?: boolean
}

export function TechnicalStrengthsCard({
	technicalStrengths = [],
	isLoading = false,
	errorMessage = null,
	className = "",
	defaultCollapsed = true,
}: TechnicalStrengthsCardProps) {
	const { t } = useTranslation()
	const [isTableCollapsed, setIsTableCollapsed] = useState(defaultCollapsed)
	const isCompactTable = true

	const hasItems = technicalStrengths.length > 0
	const showEmpty = !isLoading && !errorMessage && !hasItems

	return (
		<section
			className={`overflow-hidden rounded-lg border border-[#cddeff] bg-white ${className}`}
		>
			<div
				className={`flex items-center justify-between border-b border-[#cddeff] bg-blue-50 ${
					isCompactTable ? "px-3 py-2" : "px-4 py-3"
				}`}
			>
				<h3
					className={`font-semibold text-blue-700 ${
						isCompactTable ? "text-xs" : "text-sm"
					}`}
				>
					{t("scenario.tech_strengths.title")}
				</h3>

				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => setIsTableCollapsed((prev) => !prev)}
						aria-label={
							isTableCollapsed
								? "Expand technical strengths"
								: "Collapse technical strengths"
						}
						className="inline-flex h-7 w-7 items-center justify-center rounded border border-blue-200 bg-white text-blue-700 transition-colors hover:bg-blue-100"
					>
						{isTableCollapsed ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronUp className="h-4 w-4" />
						)}
					</button>
				</div>
			</div>

			{!isTableCollapsed && (
				<div className="overflow-x-auto">
					<table
						className={`w-full border-collapse ${
							isCompactTable ? "text-xs" : "text-sm"
						}`}
					>
						<thead>
							<tr className="bg-blue-50/60">
								<th
									className={`w-[160px] text-left font-semibold text-blue-700 ${
										isCompactTable
											? "px-3 py-2 text-[12px]"
											: "px-4 py-2.5 text-[13px]"
									}`}
								>
									Title
								</th>
								<th
									className={`text-left font-semibold text-blue-700 ${
										isCompactTable
											? "px-3 py-2 text-[12px]"
											: "px-4 py-2.5 text-[13px]"
									}`}
								>
									Description
								</th>
							</tr>
						</thead>

						<tbody className="bg-white">
							{isLoading &&
								Array.from({ length: 5 }).map((_, index) => (
									<tr
										key={`technical-strength-skeleton-${index}`}
										className={index < 4 ? "border-b border-border" : ""}
									>
										<td
											className={
												isCompactTable
													? "px-3 py-2.5 align-top"
													: "px-4 py-3 align-top"
											}
										>
											<div
												className={`animate-pulse rounded bg-gray-200 ${
													isCompactTable ? "h-3.5 w-20" : "h-4 w-24"
												}`}
											/>
										</td>
										<td
											className={isCompactTable ? "px-3 py-2.5" : "px-4 py-3"}
										>
											<div
												className={`animate-pulse rounded bg-gray-200 ${
													isCompactTable ? "h-3.5 w-full" : "h-4 w-full"
												}`}
											/>
										</td>
									</tr>
								))}

							{!isLoading &&
								hasItems &&
								technicalStrengths.map((item, index) => (
									<tr
										key={`${item.strength_name}-${index}`}
										className={
											index < technicalStrengths.length - 1
												? "border-b border-border"
												: ""
										}
									>
										<td
											className={`align-top font-medium text-foreground ${
												isCompactTable
													? "px-3 py-2.5 text-[12px]"
													: "px-4 py-3 text-[13px]"
											}`}
										>
											{item.strength_name}
										</td>
										<td
											className={`text-foreground ${
												isCompactTable
													? "px-3 py-2.5 text-[12px] leading-5"
													: "px-4 py-3 text-[13px] leading-relaxed"
											}`}
										>
											{item.description}
										</td>
									</tr>
								))}

							{!isLoading && errorMessage && (
								<tr>
									<td
										colSpan={2}
										className={`text-center text-muted-foreground ${
											isCompactTable ? "px-3 py-5 text-xs" : "px-4 py-6 text-sm"
										}`}
									>
										{errorMessage}
									</td>
								</tr>
							)}

							{showEmpty && (
								<tr>
									<td
										colSpan={2}
										className={`text-center text-muted-foreground ${
											isCompactTable ? "px-3 py-5 text-xs" : "px-4 py-6 text-sm"
										}`}
									>
										{t("scenario.tech_strengths.empty")}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</section>
	)
}
