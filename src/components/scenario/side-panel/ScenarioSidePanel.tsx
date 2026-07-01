import i18next from "i18next"
import {
	BookmarkCheck,
	Download,
	FileCode,
	FileText,
	Maximize2,
	Minimize2,
	Search,
	X,
} from "lucide-react"
import {
	createElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/components/AuthProvider"
import { ThemeReportView } from "@/components/scenario/report/theme/ThemeReportView"
import { TabNavigator } from "@/components/technology-tree/components/TabNavigator"
import { FilterSort } from "@/components/technology-tree/FilterSort"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
	enrichmentEventBus,
	triggerEnrichmentRefresh,
	useEnrichedData,
} from "@/hooks/useEnrichedData"
import { useScenarioReportState } from "@/hooks/useScenarioReportState"
import { supabase } from "@/integrations/supabase/client"
import type {
	CasesWithSaved,
	PapersWithSaved,
} from "@/integrations/supabase/types/more_types"
import { apiClient } from "@/lib/apiClient"
import { isMostlyJapanese } from "@/lib/languageUtils"
import { getOutputLanguage } from "@/lib/outputLanguage"
import type { NodePatent } from "@/stores/enrichedDataStore"
import type { Scenario } from "@/types/scenario"
import type { ThemeReportData } from "@/types/theme-report"
import { exportToCsv } from "@/utils/csvExport"
import { ImplementationTab } from "./tabs/ImplementationTab"
import { OverviewTab } from "./tabs/OverviewTab"
import { PaperTab } from "./tabs/PaperTab"
import { PatentTab } from "./tabs/PatentTab"
import { ReportTab } from "./tabs/ReportTab"

function getReportStyles(): string {
	return Array.from(document.styleSheets)
		.map((sheet) => {
			try {
				return Array.from(sheet.cssRules)
					.map((r) => r.cssText)
					.join("\n")
			} catch {
				return sheet.href ? `@import url("${sheet.href}")` : ""
			}
		})
		.join("\n")
}

const REPORT_SECTION_IDS = [
	"theme-s01",
	"theme-s02",
	"theme-s03",
	"theme-s04",
	"theme-s05",
	"theme-s06",
	"theme-s07",
	"theme-s08",
] as const

function getReportSectionLabels(): Record<string, string> {
	return {
		"theme-s01": i18next.t("scenario.report.sections.s01"),
		"theme-s02": i18next.t("scenario.report.sections.s02"),
		"theme-s03": i18next.t("scenario.report.sections.s03"),
		"theme-s04": i18next.t("scenario.report.sections.s04"),
		"theme-s05": i18next.t("scenario.report.sections.s05"),
		"theme-s06": i18next.t("scenario.report.sections.s06"),
		"theme-s07": i18next.t("scenario.report.sections.s07"),
		"theme-s08": i18next.t("scenario.report.sections.s08"),
	}
}

const PDF_BRANDING_CSS = `
@page { margin: 10mm 15mm; }
@media print {
  body::after {
    content: "Memory AI により作成";
    position: fixed;
    bottom: 6mm;
    right: 10mm;
    font-size: 8px;
    font-family: monospace;
    color: #9ca3af;
    letter-spacing: 0.04em;
  }
}
`

function buildReportHtml(
	innerHTML: string,
	styles: string,
	title = "",
): string {
	const titleTag = title ? `<title>${title}</title>` : ""
	return `<!DOCTYPE html><html><head><meta charset="utf-8">${titleTag}<style>${styles}${PDF_BRANDING_CSS}</style></head><body style="padding:24px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif">${innerHTML}</body></html>`
}

function buildInteractiveHtml(
	innerHTML: string,
	styles: string,
	title: string,
): string {
	const sectionLabels = getReportSectionLabels()
	const tocItems = REPORT_SECTION_IDS.map(
		(id) =>
			`<button onclick="document.getElementById('${id}').scrollIntoView({behavior:'smooth',block:'start'})" id="toc-${id}" style="display:block;width:100%;text-align:left;padding:6px 12px;border:none;border-left:2px solid transparent;background:transparent;font-size:13px;color:#6b7280;cursor:pointer;line-height:1.4">${sectionLabels[id]}</button>`,
	).join("")
	const ids = JSON.stringify([...REPORT_SECTION_IDS])

	const scriptBody = `(function(){
var s08=document.querySelector('[data-section08-tabs]');
if(s08){
  var secs=Array.from(s08.querySelectorAll('[data-player-section]'));
  var bar=document.createElement('div');
  bar.style.cssText='display:flex;margin-bottom:12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;padding:4px;gap:4px';
  secs.forEach(function(sec,i){
    var label=sec.getAttribute('data-player-label');
    var count=sec.querySelectorAll('tbody tr').length;
    var btn=document.createElement('button');
    btn.textContent=label+(count?' ('+count+')':'');
    btn.style.cssText='flex:1;padding:6px 12px;border:none;border-radius:6px;font-size:13px;cursor:pointer;'+(i===0?'background:#fff;color:#2563eb;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.06)':'background:transparent;color:#6b7280;font-weight:400');
    btn.onclick=function(){
      secs.forEach(function(s,j){s.style.display=j===i?'block':'none';});
      Array.from(bar.children).forEach(function(b,j){
        b.style.background=j===i?'#fff':'transparent';
        b.style.color=j===i?'#2563eb':'#6b7280';
        b.style.fontWeight=j===i?'600':'400';
        b.style.boxShadow=j===i?'0 1px 2px rgba(0,0,0,.06)':'none';
      });
    };
    bar.appendChild(btn);
    if(i>0)sec.style.display='none';
    var p=sec.querySelector('[data-player-heading]');if(p)p.style.display='none';
  });
  s08.insertBefore(bar,s08.firstChild);
}
document.querySelectorAll('[data-fold-toggle]').forEach(function(btn){
  var panel=btn.nextElementSibling;if(!panel)return;
  var svg=btn.querySelector('svg');
  btn.addEventListener('click',function(){
    var hiding=panel.style.display!=='none';
    panel.style.display=hiding?'none':'';
    if(svg)svg.style.transform=hiding?'rotate(0deg)':'';
  });
});
document.querySelectorAll('[data-trl-toggle]').forEach(function(btn){
  var panel=btn.nextElementSibling;if(!panel)return;
  var svg=btn.querySelector('svg');
  btn.addEventListener('click',function(){
    var hiding=panel.style.display!=='none';
    panel.style.display=hiding?'none':'';
    if(svg)svg.style.transform=hiding?'rotate(180deg)':'';
  });
});
document.querySelectorAll('[data-tech-toggle]').forEach(function(header){
  var card=header.parentElement;if(!card)return;
  var lit=card.querySelector('[data-tech-lit]');if(!lit)return;
  var chevron=header.querySelector('svg');
  header.addEventListener('click',function(){
    var hiding=lit.style.display!=='none';
    lit.style.display=hiding?'none':'';
    if(chevron)chevron.style.transform=hiding?'rotate(180deg)':'';
  });
});
var ids=${ids};
var obs=new IntersectionObserver(function(e){
  e.forEach(function(en){
    if(en.isIntersecting){
      ids.forEach(function(id){
        var b=document.getElementById('toc-'+id);if(!b)return;
        b.style.borderLeftColor=id===en.target.id?'#3b82f6':'transparent';
        b.style.color=id===en.target.id?'#111827':'#6b7280';
        b.style.fontWeight=id===en.target.id?'600':'400';
      });
    }
  });
},{rootMargin:'-10% 0px -75% 0px'});
ids.forEach(function(id){var el=document.getElementById(id);if(el)obs.observe(el);});
})();`

	const script = `<script>${scriptBody}</script>`
	const toc = `<nav style="position:fixed;top:0;left:0;width:200px;height:100vh;overflow-y:auto;background:#f9fafb;border-right:1px solid #e5e7eb;padding:20px 0;box-sizing:border-box"><p style="font-size:10px;font-family:monospace;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px 16px">Contents</p>${tocItems}</nav>`
	const body = `${toc}<div style="margin-left:216px;padding:32px 48px;max-width:860px;box-sizing:border-box">${innerHTML}</div>${script}`
	return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${styles}</style></head><body style="margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif">${body}</body></html>`
}

function renderPrintHtml(data: ThemeReportData): string {
	const container = document.createElement("div")
	container.style.cssText =
		"position:absolute;left:-9999px;top:-9999px;width:900px"
	document.body.appendChild(container)
	const root = createRoot(container)
	flushSync(() => {
		root.render(
			createElement(ThemeReportView, {
				data,
				isExpanded: true,
				printMode: true,
			}),
		)
	})
	const html = container.innerHTML
	root.unmount()
	document.body.removeChild(container)
	return html
}

const PRINT_CSS = `
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
}
`

function downloadReportAsPdf(data: ThemeReportData | null, win: Window | null) {
	if (!data || !win) return
	const innerHTML = renderPrintHtml(data)
	const styles = getReportStyles()
	const title = data.theme || data.scenario || "シナリオレポート"
	win.document.open()
	win.document.write(buildReportHtml(innerHTML, styles + PRINT_CSS, title))
	win.document.close()
	win.focus()
	setTimeout(() => {
		win.print()
		win.close()
	}, 600)
}

function downloadReportAsHtml(data: ThemeReportData | null, filename: string) {
	if (!data) return
	const innerHTML = renderPrintHtml(data)
	const title = data.theme || data.scenario || "シナリオレポート"
	const html = buildInteractiveHtml(innerHTML, getReportStyles(), title)
	const blob = new Blob([html], { type: "text/html;charset=utf-8" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}

type PatentExportItem = NodePatent & {
	url?: string
	patent_number?: string
	applicant?: string
}

function getPatentSummaryFromAnalysis(data: unknown): string | undefined {
	if (!data || typeof data !== "object") return undefined
	const analysis = data as any
	const summary =
		analysis.patent_summary ??
		analysis.analyze_trl?.patent_summary ??
		analysis.analyze_trl?.data?.patent_summary ??
		analysis.analyze_trl?.report?.patent_summary
	return typeof summary === "string" && summary.trim()
		? summary.trim()
		: undefined
}

function getPatentCountFromAnalysis(data: unknown): number | undefined {
	if (!data || typeof data !== "object") return undefined
	const analysis = data as any
	const count =
		analysis.patents_count ??
		analysis.patent_count ??
		analysis.analyze_trl?.patents_count ??
		analysis.analyze_trl?.data?.patents_count ??
		analysis.analyze_trl?.report?.patents_count
	return typeof count === "number" && Number.isFinite(count) ? count : undefined
}

function getFiniteNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

interface ScenarioSummaryCacheEntry {
	papersSummary?: string
	patentsSummary?: string
	patentsTotalCount?: number
	marketSummary?: string
}

const scenarioSummaryCache = new Map<string, ScenarioSummaryCacheEntry>()
const SUMMARY_RETRY_DELAYS_MS = [1000, 4000, 8000]

interface ScenarioPaperPanelProps {
	scenario: Scenario | null
	mode?: "TED" | "FAST"
	treeId?: string | null
	userQuery?: string | null
	technologies?: { tech_name: string; tech_definition: string }[]
	onClose?: () => void
	isExpanded?: boolean
	onExpandSummary?: () => void
	onCollapse?: () => void
	showTechSeedsTab?: boolean
	externalActiveTab?: string
	onActiveTabChange?: (tab: string) => void
	scenariosCount?: number
	onCountsChange?: (counts: {
		papers: number
		patents: number
		useCases: number
	}) => void
}

export const ScenarioPaperPanel = ({
	scenario,
	mode = "TED",
	treeId,
	userQuery,
	technologies,
	onClose,
	isExpanded = false,
	onExpandSummary,
	onCollapse,
	showTechSeedsTab: _showTechSeedsTab = false,
	externalActiveTab,
	onActiveTabChange,
	scenariosCount,
	onCountsChange,
}: ScenarioPaperPanelProps) => {
	void technologies

	const { toast } = useToast()
	const { user } = useAuth()
	const { t, i18n } = useTranslation()

	// ── Tab state ──────────────────────────────────────────────────────────────
	const [activeTab, setActiveTab] = useState("overview")

	useEffect(() => {
		if (externalActiveTab && externalActiveTab !== activeTab) {
			setActiveTab(externalActiveTab)
		}
	}, [externalActiveTab, activeTab])

	// ── Google Translate ───────────────────────────────────────────────────────
	useEffect(() => {
		const initTranslate = () => {
			const container = document.getElementById("google_translate_element")
			if (!container || container.childElementCount > 0) return
			const TranslateElement = window.google?.translate?.TranslateElement
			if (typeof TranslateElement !== "function") return
			const layout = TranslateElement.InlineLayout?.HORIZONTAL
			new TranslateElement(
				{
					pageLanguage: "en",
					includedLanguages: "ja,en",
					autoDisplay: false,
					...(layout ? { layout } : {}),
				},
				"google_translate_element",
			)
		}
		window.googleTranslateElementInit = initTranslate
		if (typeof window.google?.translate?.TranslateElement === "function") {
			initTranslate()
		}
		const existing = document.querySelector(
			'script[src*="translate.google.com/translate_a/element.js"]',
		)
		if (!existing) {
			const script = document.createElement("script")
			script.src =
				"https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
			script.async = true
			document.body.appendChild(script)
		} else {
			initTranslate()
		}
		// Re-init whenever React remounts the div (panel open/close, Strict Mode)
		const interval = setInterval(initTranslate, 1000)
		return () => clearInterval(interval)
	}, [])

	// ── Report state ───────────────────────────────────────────────────────────
	const storeKey = scenario?.id ?? "__none__"
	const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				await apiClient.get("/health", {
					signal: AbortSignal.timeout(4000),
				})
				if (!cancelled) setApiHealthy(true)
			} catch {
				if (!cancelled) setApiHealthy(false)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [])

	const {
		showReport,
		reportData,
		isLoading: isReportLoading,
		analysisSteps: _analysisSteps,
		finalizeProgress,
		checkingScenario,
		scenarioData,
		queueStatus,
		jobStartedAt,
		generate: generateReport,
		resetError,
	} = useScenarioReportState({ scenario, userQuery, storeKey, apiHealthy })

	// ── Enriched data ──────────────────────────────────────────────────────────
	const {
		papers: enrichedPapers,
		patents: enrichedPatents,
		useCases: enrichedUseCases,
		loading: enrichedLoading,
		loadingPapers,
		loadingPatents,
		loadingUseCases,
	} = useEnrichedData(scenario?.id ?? null)

	const [isFetchingFromEdge, setIsFetchingFromEdge] = useState(false)

	// ── Summaries from DB ──────────────────────────────────────────────────────
	const displayedPatents = enrichedPatents
	const displayedPatentsCount = displayedPatents.length
	const scenarioPaperCount =
		getFiniteNumber(scenario?.metrics?.paperCount) ??
		getFiniteNumber(scenario?.metrics?.papers?.count)
	const scenarioPatentCount =
		getFiniteNumber(scenario?.metrics?.patentCount) ??
		getFiniteNumber(scenario?.metrics?.patents?.count)
	const scenarioUseCasesCount =
		getFiniteNumber(scenario?.metrics?.implementationCount) ??
		getFiniteNumber(scenario?.metrics?.useCases?.count)
	const isPapersLoading =
		enrichedLoading || loadingPapers || !!scenario?.metrics?._fetchingPapers
	const isPatentsLoading =
		enrichedLoading ||
		loadingPatents ||
		isFetchingFromEdge ||
		!!scenario?.metrics?._fetchingPatents
	const isUseCasesLoading =
		enrichedLoading || loadingUseCases || !!scenario?.metrics?._fetchingUseCases
	const [papersSummary, setPapersSummary] = useState<string | undefined>()
	const [patentsSummary, setPatentsSummary] = useState<string | undefined>()
	const [patentsTotalCount, setPatentsTotalCount] = useState<
		number | undefined
	>()
	const totalPatentsCount =
		patentsTotalCount ??
		scenarioPatentCount ??
		(displayedPatentsCount > 0
			? displayedPatentsCount
			: isPatentsLoading
				? undefined
				: 0)
	const shouldShowPatentsLoading =
		isPatentsLoading && displayedPatentsCount === 0
	const [marketSummary, setMarketSummary] = useState<string | undefined>()
	const [_loadingSummaries, setLoadingSummaries] = useState(false)
	const summaryMatchesCurrentLanguage = useCallback(
		(summary: string | undefined) => {
			if (!summary?.trim()) return false
			const isEnglish = i18n.language?.toLowerCase().startsWith("en")
			const summaryIsJapanese = isMostlyJapanese(summary)
			return isEnglish ? !summaryIsJapanese : summaryIsJapanese
		},
		[i18n.language],
	)
	const displayPapersSummary = summaryMatchesCurrentLanguage(papersSummary)
		? papersSummary
		: undefined
	const displayPatentsSummary = summaryMatchesCurrentLanguage(patentsSummary)
		? patentsSummary
		: undefined
	const displayMarketSummary = summaryMatchesCurrentLanguage(marketSummary)
		? marketSummary
		: undefined

	const lastCountsRef = useRef<{
		papers: number
		patents: number
		useCases: number
	} | null>(null)

	useEffect(() => {
		if (enrichedLoading || !onCountsChange) return
		const papersCount =
			enrichedPapers.length > 0
				? enrichedPapers.length
				: (scenarioPaperCount ?? (isPapersLoading ? undefined : 0))
		const useCasesCount =
			enrichedUseCases.length > 0
				? enrichedUseCases.length
				: (scenarioUseCasesCount ?? (isUseCasesLoading ? undefined : 0))
		if (
			papersCount === undefined ||
			totalPatentsCount === undefined ||
			useCasesCount === undefined
		)
			return
		const nextCounts = {
			papers: papersCount,
			patents: totalPatentsCount,
			useCases: useCasesCount,
		}
		const prev = lastCountsRef.current
		if (
			prev &&
			prev.papers === nextCounts.papers &&
			prev.patents === nextCounts.patents &&
			prev.useCases === nextCounts.useCases
		)
			return
		lastCountsRef.current = nextCounts
		onCountsChange(nextCounts)
	}, [
		enrichedLoading,
		enrichedPapers.length,
		scenarioPaperCount,
		isPapersLoading,
		totalPatentsCount,
		enrichedUseCases.length,
		scenarioUseCasesCount,
		isUseCasesLoading,
		onCountsChange,
	])

	const loadSummaries = useCallback((nodeId: string) => {
		let cancelled = false
		setLoadingSummaries(true)
		Promise.all([
			supabase
				.from("node_papers_summary")
				.select("summary")
				.eq("node_id", nodeId)
				.maybeSingle(),
			supabase
				.from("node_usecases_summary")
				.select("summary")
				.eq("node_id", nodeId)
				.maybeSingle(),
			supabase
				.from("node_analysis")
				.select("data")
				.eq("node_id", nodeId)
				.maybeSingle(),
		]).then(([papersRes, usecasesRes, analysisRes]) => {
			if (cancelled) return
			const previousSummaries = scenarioSummaryCache.get(nodeId) ?? {}
			const nextSummaries = {
				papersSummary:
					papersRes.data?.summary ?? previousSummaries.papersSummary,
				marketSummary:
					usecasesRes.data?.summary ?? previousSummaries.marketSummary,
				patentsSummary:
					getPatentSummaryFromAnalysis(analysisRes.data?.data) ??
					previousSummaries.patentsSummary,
				patentsTotalCount:
					getPatentCountFromAnalysis(analysisRes.data?.data) ??
					previousSummaries.patentsTotalCount,
			}
			scenarioSummaryCache.set(nodeId, nextSummaries)
			setPapersSummary(nextSummaries.papersSummary)
			setMarketSummary(nextSummaries.marketSummary)
			setPatentsSummary(nextSummaries.patentsSummary)
			setPatentsTotalCount(nextSummaries.patentsTotalCount)
			setLoadingSummaries(false)
		})
		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		if (!scenario?.id) {
			setPapersSummary(undefined)
			setPatentsSummary(undefined)
			setPatentsTotalCount(undefined)
			setMarketSummary(undefined)
			return
		}
		const cached = scenarioSummaryCache.get(scenario.id)
		setPapersSummary(cached?.papersSummary)
		setPatentsSummary(cached?.patentsSummary)
		setPatentsTotalCount(cached?.patentsTotalCount)
		setMarketSummary(cached?.marketSummary)
		return loadSummaries(scenario.id)
	}, [scenario?.id, loadSummaries])

	useEffect(() => {
		if (!scenario?.id) return
		const nodeId = scenario.id
		const unsubscribe = enrichmentEventBus.subscribe((enrichedNodeId) => {
			if (enrichedNodeId === nodeId) {
				loadSummaries(nodeId)
			}
		})
		return () => {
			unsubscribe()
		}
	}, [scenario?.id, loadSummaries])

	useEffect(() => {
		if (!scenario?.id) return
		if (
			enrichedPapers.length === 0 &&
			enrichedUseCases.length === 0 &&
			enrichedPatents.length === 0
		)
			return
		const timeoutIds = SUMMARY_RETRY_DELAYS_MS.map((delay) =>
			window.setTimeout(() => {
				loadSummaries(scenario.id)
			}, delay),
		)
		return () => {
			for (const timeoutId of timeoutIds) {
				window.clearTimeout(timeoutId)
			}
		}
	}, [
		scenario?.id,
		enrichedPapers.length,
		enrichedUseCases.length,
		enrichedPatents.length,
		loadSummaries,
	])

	// ── Papers UI data ─────────────────────────────────────────────────────────
	const realPapersForUI = useMemo(() => {
		if (
			!scenario ||
			!Array.isArray(enrichedPapers) ||
			enrichedPapers.length === 0
		)
			return []
		return enrichedPapers.map((p: any) => ({
			id: p.id,
			title: p.title ?? p.title_en ?? "",
			authors: p.authors ?? p.author ?? "",
			journal: p.journal ?? p.venue ?? "",
			tags: Array.isArray(p.tags)
				? p.tags
				: p.tags
					? String(p.tags).split(",")
					: [],
			abstract: p.abstract ?? p.summary ?? "",
			date: p.date ?? p.published_at ?? "",
			citations:
				typeof p.citations === "number" ? p.citations : (p.citation_count ?? 0),
			doi: p.doi ?? "",
			score: typeof p.score === "number" ? p.score : 0,
		}))
	}, [scenario, enrichedPapers])

	// ── Use cases UI data ──────────────────────────────────────────────────────
	const [savedCaseIds, setSavedCaseIds] = useState<Set<string>>(new Set())

	const realUseCasesForUI = useMemo((): CasesWithSaved[] => {
		if (
			!scenario ||
			!Array.isArray(enrichedUseCases) ||
			enrichedUseCases.length === 0
		)
			return []
		return enrichedUseCases.map((uc: any) => ({
			...uc,
			saved: savedCaseIds.has(uc.id),
		}))
	}, [scenario, enrichedUseCases, savedCaseIds])
	const papersTabCount =
		realPapersForUI.length > 0 ? realPapersForUI.length : scenarioPaperCount
	const useCasesTabCount =
		realUseCasesForUI.length > 0
			? realUseCasesForUI.length
			: scenarioUseCasesCount

	// ── Paper filtering / sorting / pagination ─────────────────────────────────
	const [savedPaperIds, setSavedPaperIds] = useState<Set<string>>(new Set())
	const [currentFilter, setCurrentFilter] = useState("")
	const [currentSort, setCurrentSort] = useState("citations")
	const [currentKeyword, setCurrentKeyword] = useState("")
	const [showSavedOnly, setShowSavedOnly] = useState(false)
	const [isSearchExpanded, setIsSearchExpanded] = useState(false)
	const searchControlRef = useRef<HTMLDivElement | null>(null)
	const reportContainerRef = useRef<HTMLDivElement>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)

	const papersWithSaved: PapersWithSaved[] = useMemo(
		() =>
			realPapersForUI.map((p: any) => ({
				...p,
				saved: savedPaperIds.has(p.id),
			})),
		[realPapersForUI, savedPaperIds],
	)

	const filteredPapers = useMemo(() => {
		let filtered = papersWithSaved

		if (currentKeyword.trim()) {
			const kw = currentKeyword.toLowerCase()
			filtered = filtered.filter(
				(p) =>
					p.title.toLowerCase().includes(kw) ||
					p.abstract.toLowerCase().includes(kw) ||
					p.authors.toLowerCase().includes(kw),
			)
		}

		if (currentFilter) {
			const fa = currentFilter.split(",").filter(Boolean)
			filtered = filtered.filter((p) => {
				if (fa.some((f) => f.includes("past-"))) {
					const py = new Date(p.date || "").getFullYear()
					const cy = new Date().getFullYear()
					if (fa.find((f) => f.includes("past-year")) && cy - py > 1)
						return false
					if (fa.find((f) => f.includes("past-5-years")) && cy - py > 5)
						return false
					if (fa.find((f) => f.includes("past-10-years")) && cy - py > 10)
						return false
				}
				if (fa.some((f) => f.includes("citations-"))) {
					const c = p.citations || 0
					if (fa.find((f) => f === "citations-0") && c !== 0) return false
					if (fa.find((f) => f === "citations-10") && c < 10) return false
					if (fa.find((f) => f === "citations-50") && c < 50) return false
					if (fa.find((f) => f === "citations-100") && c < 100) return false
				}
				if (fa.some((f) => ["domestic", "international"].includes(f))) {
					const region = fa.find((f) =>
						["domestic", "international"].includes(f),
					)
					if (region && p.region !== region) return false
				}
				return true
			})
		}

		if (showSavedOnly) filtered = filtered.filter((p) => p.saved)
		return filtered
	}, [papersWithSaved, currentFilter, currentKeyword, showSavedOnly])

	const sortedPapers = useMemo(() => {
		const s = [...filteredPapers]
		if (currentSort === "newest")
			return s.sort(
				(a, b) =>
					new Date(b.date || "").getTime() - new Date(a.date || "").getTime(),
			)
		if (currentSort === "oldest")
			return s.sort(
				(a, b) =>
					new Date(a.date || "").getTime() - new Date(b.date || "").getTime(),
			)
		if (currentSort === "citations")
			return s.sort((a, b) => (b.citations || 0) - (a.citations || 0))
		return s
	}, [filteredPapers, currentSort])

	useEffect(() => {
		setCurrentPage(1)
	}, [])

	const totalPages = Math.max(1, Math.ceil(sortedPapers.length / pageSize))
	const safePage = Math.min(currentPage, totalPages)
	const visiblePapers = sortedPapers.slice(
		(safePage - 1) * pageSize,
		safePage * pageSize,
	)

	const displayedCases = useMemo(
		() =>
			showSavedOnly
				? realUseCasesForUI.filter((c) => c.saved)
				: realUseCasesForUI,
		[realUseCasesForUI, showSavedOnly],
	)
	const shouldShowUseCasesLoading =
		isUseCasesLoading && realUseCasesForUI.length === 0

	// ── Handlers ───────────────────────────────────────────────────────────────
	const handleTogglePaper = (paper: PapersWithSaved) => {
		setSavedPaperIds((prev) => {
			const next = new Set(prev)
			if (next.has(paper.id)) {
				next.delete(paper.id)
				toast({ title: t("tech.paper_removed"), description: paper.title })
			} else {
				next.add(paper.id)
				toast({ title: t("tech.paper_saved"), description: paper.title })
			}
			return next
		})
	}

	const handleToggleCase = (useCase: CasesWithSaved) => {
		setSavedCaseIds((prev) => {
			const next = new Set(prev)
			if (next.has(useCase.id)) {
				next.delete(useCase.id)
				toast({ title: t("tech.case_removed"), description: useCase.product })
			} else {
				next.add(useCase.id)
				toast({ title: t("tech.case_saved"), description: useCase.product })
			}
			return next
		})
	}

	const handleFilterChange = useCallback((filter: string) => {
		setCurrentFilter(filter)
		setCurrentPage(1)
	}, [])

	const handleSortChange = (sort: string) => {
		setCurrentSort(sort)
		setCurrentPage(1)
	}

	const handleCloseSearch = useCallback(() => setIsSearchExpanded(false), [])

	useEffect(() => {
		if (!isSearchExpanded) return
		const onPointerDown = (e: PointerEvent) => {
			if (searchControlRef.current?.contains(e.target as Node)) return
			handleCloseSearch()
		}
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleCloseSearch()
		}
		document.addEventListener("pointerdown", onPointerDown)
		document.addEventListener("keydown", onKeyDown)
		return () => {
			document.removeEventListener("pointerdown", onPointerDown)
			document.removeEventListener("keydown", onKeyDown)
		}
	}, [handleCloseSearch, isSearchExpanded])

	const refreshScenarioEnrichedData = useCallback(async () => {
		if (!scenario?.id) return
		try {
			triggerEnrichmentRefresh(scenario.id)
		} catch (_e) {
			try {
				const store = (
					await import("@/stores/enrichedDataStore")
				).useEnrichedDataStore.getState()
				store.refreshData(scenario.id)
			} catch (_err) {
				/* ignore */
			}
		}
	}, [scenario?.id])

	const fetchPapersFromEdge = async () => {
		if (!scenario || !treeId) return
		setIsFetchingFromEdge(true)
		try {
			const { error } = await supabase.functions.invoke(
				"search-scenario-articles",
				{
					body: {
						treeId,
						query: (userQuery ?? scenario.name ?? "").slice(0, 120),
						nodeId: scenario.id,
						scenarioName: scenario.name,
						team_id: user?.user_metadata?.team_id ?? null,
						treeType: mode ?? null,
						language: getOutputLanguage(),
						scenariosCount: Number(scenariosCount ?? 0),
						force: true,
					},
				},
			)
			if (error) {
				console.error(
					"[ScenarioPaperPanel] search-scenario-articles error:",
					error,
				)
				toast({ title: "エラー", description: "論文の取得に失敗しました" })
				return
			}
			await refreshScenarioEnrichedData()
		} catch (e) {
			console.error("[ScenarioPaperPanel] fetchPapersFromEdge failed:", e)
		} finally {
			setIsFetchingFromEdge(false)
		}
	}

	const fetchPatentsFromEdge = async () => {
		if (!scenario || !treeId) return
		setIsFetchingFromEdge(true)
		try {
			const { error } = await supabase.functions.invoke(
				"search-scenario-patents",
				{
					body: {
						tree_id: treeId,
						treeId,
						node_id: scenario.id,
						nodeId: scenario.id,
						query: (userQuery ?? scenario.name ?? "").slice(0, 200),
						scenarioName: scenario.name,
						scenario_name: scenario.name,
						team_id: user?.user_metadata?.team_id ?? null,
						language: getOutputLanguage(),
					},
				},
			)
			if (error) {
				console.error(
					"[ScenarioPaperPanel] search-scenario-patents error:",
					error,
				)
				toast({ title: "エラー", description: "特許の取得に失敗しました" })
				return
			}
			await refreshScenarioEnrichedData()
		} catch (e) {
			console.error("[ScenarioPaperPanel] fetchPatentsFromEdge failed:", e)
		} finally {
			setIsFetchingFromEdge(false)
		}
	}

	const fetchUseCasesFromEdge = async () => {
		if (!scenario || !treeId) return
		setIsFetchingFromEdge(true)
		try {
			const { error } = await supabase.functions.invoke(
				"scenario-market-impls",
				{
					body: {
						tree_id: treeId,
						treeId,
						node_id: scenario.id,
						nodeId: scenario.id,
						query: (userQuery ?? scenario.name ?? "").slice(0, 200),
						scenarioName: scenario.name,
						scenario_name: scenario.name,
						team_id: user?.user_metadata?.team_id ?? null,
						language: getOutputLanguage(),
					},
				},
			)
			if (error) {
				console.error(
					"[ScenarioPaperPanel] scenario-market-impls error:",
					error,
				)
				toast({ title: "エラー", description: "事例の取得に失敗しました" })
				return
			}
			await refreshScenarioEnrichedData()
		} catch (e) {
			console.error("[ScenarioPaperPanel] fetchUseCasesFromEdge failed:", e)
		} finally {
			setIsFetchingFromEdge(false)
		}
	}

	// ── CSV exports ────────────────────────────────────────────────────────────
	const scenarioNameForExport = (scenario?.name?.trim() || "scenario").replace(
		/[\\/:*?"<>|]/g,
		"_",
	)

	const notifyEmpty = () =>
		toast({
			title: "エクスポートするデータがありません。",
			description: "CSVとして書き出せるデータが見つかりませんでした。",
			type: "warning",
		})

	const handleDownloadPapers = () => {
		if (sortedPapers.length === 0) return notifyEmpty()
		exportToCsv(
			`${scenarioNameForExport}_論文_${new Date().toISOString().split("T")[0]}.csv`,
			sortedPapers.map((item) => {
				const rawDoi = String(item.doi ?? "")
					.trim()
					.replace(/^doi:\s*/i, "")
				const doiUrl = rawDoi
					? rawDoi.startsWith("http")
						? rawDoi
						: `https://doi.org/${rawDoi}`
					: ""
				return {
					title: item.title,
					authors: item.authors,
					date: item.date,
					citations: item.citations,
					doi: item.doi,
					url: String(item.url ?? "").trim() || doiUrl,
					tags: Array.isArray(item.tags)
						? item.tags.join("; ")
						: JSON.stringify(item.tags),
					region: item.region,
					saved: item.saved ? "Yes" : "No",
				}
			}),
		)
		toast({
			title: "ダウンロードしました",
			description: "論文データをCSVで書き出しました",
		})
	}

	const handleDownloadPatents = () => {
		if (enrichedPatents.length === 0) return notifyEmpty()

		const getApplicant = (item: PatentExportItem) =>
			(item.applicant ?? item.assignee?.[0]?.name ?? "").trim()

		const exportable = enrichedPatents.filter(
			(item: PatentExportItem) => getApplicant(item) !== "",
		)

		if (exportable.length === 0) {
			return toast({
				title: t("export.all_filtered_title", {
					defaultValue: "エクスポートするデータがありません。",
				}),
				description: t("export.all_filtered_description", {
					defaultValue:
						"全ての特許に applicant 情報がないため、エクスポートできるデータがありません。",
				}),
				type: "warning",
			})
		}

		const rows = exportable.map((item: PatentExportItem) => {
			const existingUrl = String(item.url ?? "").trim()
			const pubNum = String(item.publication_number ?? "").trim()
			const generatedUrl = pubNum
				? `https://patents.google.com/patent/${pubNum}/en`
				: ""
			const normalizedUrl =
				generatedUrl ||
				(existingUrl.startsWith("http")
					? existingUrl
					: existingUrl.startsWith("patents.google.com")
						? `https://${existingUrl}`
						: "")
			const applicant = getApplicant(item)
			return {
				title: item.title ?? "",
				applicant,
				patent_number:
					(String(item.patent_number ?? "").trim() ||
						pubNum ||
						existingUrl.match(/\/patent\/([^/?#]+)/i)?.[1]) ??
					"",
				earliest_priority_date: item.earliest_priority_date ?? "",
				url: normalizedUrl,
			}
		})

		exportToCsv(
			`${scenarioNameForExport}_特許_${new Date().toISOString().split("T")[0]}.csv`,
			rows,
		)

		const skipped = enrichedPatents.length - rows.length
		toast({
			title: t("export.downloaded", { defaultValue: "ダウンロードしました" }),
			description:
				rows.length && skipped
					? t("export.downloaded_with_skipped", {
							exported: rows.length,
							skipped,
							defaultValue:
								"{{exported}} 件をエクスポートしました（{{skipped}} 件は applicant 不明のため除外）",
						})
					: t("export.downloaded_count", {
							exported: rows.length,
							defaultValue: "{{exported}} 件をエクスポートしました",
						}),
		})
	}

	const handleDownloadUseCases = () => {
		if (displayedCases.length === 0) return notifyEmpty()
		exportToCsv(
			`${scenarioNameForExport}_事例_${new Date().toISOString().split("T")[0]}.csv`,
			displayedCases.map((item) => ({
				product: item.product,
				description: item.description,
				company: item.company,
				press_releases: item.press_releases,
			})),
		)
		toast({
			title: "ダウンロードしました",
			description: "事例データをCSVで書き出しました",
		})
	}

	// ── Early exit ─────────────────────────────────────────────────────────────
	if (!scenario) {
		return (
			<div className="h-full flex items-center justify-center text-gray-500">
				<p>{t("scenario.panel.no_scenario")}</p>
			</div>
		)
	}

	// ── Render ─────────────────────────────────────────────────────────────────
	return (
		<div className="h-full flex flex-col bg-white overflow-hidden">
			{/* ── Header: tabs + action buttons ──────────────────────────────── */}
			<div className="relative flex items-end gap-2 px-4 pt-2 border-b border-gray-200 flex-shrink-0">
				<div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide -mb-px">
					<TabNavigator
						activeTab={activeTab}
						onValueChange={(value) => {
							setActiveTab(value)
							onActiveTabChange?.(value)
						}}
						papersCount={papersTabCount}
						patentsCount={totalPatentsCount}
						useCasesCount={useCasesTabCount}
						loadingPapers={isPapersLoading}
						loadingPatents={shouldShowPatentsLoading}
						loadingUseCases={shouldShowUseCasesLoading}
						showSummaryTab={true}
					/>
				</div>

				<div className="flex items-center gap-1 flex-shrink-0">
					{activeTab === "summary" && isExpanded && (
						<DropdownMenu>
							<TooltipProvider delayDuration={150}>
								<Tooltip>
									<TooltipTrigger asChild>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												aria-label="ドキュメントをダウンロード"
											>
												<Download className="h-3.5 w-3.5" />
											</Button>
										</DropdownMenuTrigger>
									</TooltipTrigger>
									<TooltipContent side="bottom" className="text-[12px]">
										ダウンロード
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<DropdownMenuContent align="end" className="w-40">
								<DropdownMenuItem
									onClick={() => {
										const win = window.open(
											"",
											"_blank",
											"width=900,height=700",
										)
										downloadReportAsPdf(reportData, win)
									}}
									className="gap-2 cursor-pointer"
								>
									<FileText className="h-3.5 w-3.5" />
									{t("tech.save_pdf")}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										downloadReportAsHtml(
											reportData,
											`${scenarioNameForExport}_レポート_${new Date().toISOString().split("T")[0]}.html`,
										)
									}
									className="gap-2 cursor-pointer"
								>
									<FileCode className="h-3.5 w-3.5" />
									{t("tech.save_html")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					{!isExpanded && onExpandSummary && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onExpandSummary}
							aria-label="拡大"
						>
							<Maximize2 className="h-3.5 w-3.5" />
						</Button>
					)}
					{isExpanded ? (
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onCollapse?.()}
							aria-label="縮小"
						>
							<Minimize2 className="h-3.5 w-3.5" />
						</Button>
					) : (
						<Button variant="ghost" size="icon" onClick={onClose}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="h-3.5 w-3.5"
							>
								<rect width="18" height="18" x="3" y="3" rx="2" />
								<path d="M15 3v18" />
								<path d="m8 9 3 3-3 3" />
							</svg>
						</Button>
					)}
				</div>
			</div>

			{/* ── Filter / search bar (papers / patents / implementation only) ── */}
			{activeTab !== "summary" &&
				activeTab !== "overview" &&
				activeTab !== "techseeds" && (
					<div className="flex-shrink-0 px-4 pt-3">
						<div className="flex items-center mb-2">
							<div ref={searchControlRef} className="flex items-center gap-2">
								{/* Search — papers only */}
								{activeTab === "papers" &&
									(isSearchExpanded ? (
										<div className="relative">
											<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
											<Input
												placeholder="タイトル、概要、著者で検索"
												value={currentKeyword}
												onChange={(e) => {
													setCurrentKeyword(e.target.value)
													setCurrentPage(1)
												}}
												className="pl-10 pr-10 w-64"
											/>
											{currentKeyword && (
												<Button
													variant="ghost"
													size="sm"
													className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
													onClick={() => {
														setCurrentKeyword("")
														setCurrentPage(1)
													}}
												>
													<X className="h-3 w-3 text-gray-400" />
												</Button>
											)}
										</div>
									) : (
										<Button
											variant="ghost"
											size="sm"
											className={`h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${
												currentKeyword ? "bg-gray-100 text-gray-700" : ""
											}`}
											onClick={() => setIsSearchExpanded(true)}
										>
											<Search className="h-4 w-4" />
										</Button>
									))}

								{/* Filter + sort — papers only */}
								{activeTab === "papers" && (
									<FilterSort
										onFilterChange={handleFilterChange}
										onSortChange={handleSortChange}
									/>
								)}

								{/* Saved toggle */}
								<Button
									variant="ghost"
									size="sm"
									className={`h-8 w-8 p-0 text-gray-500 hover:text-gray-700 ${
										showSavedOnly ? "bg-gray-100 hover:bg-gray-200" : ""
									}`}
									onClick={() => setShowSavedOnly((v) => !v)}
								>
									<BookmarkCheck className="h-4 w-4" />
								</Button>

								{/* CSV download */}
								{(activeTab === "papers" ||
									activeTab === "patents" ||
									activeTab === "implementation") && (
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
										onClick={() => {
											if (activeTab === "papers") handleDownloadPapers()
											else if (activeTab === "patents") handleDownloadPatents()
											else handleDownloadUseCases()
										}}
									>
										<Download className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					</div>
				)}

			{/* Google Translate widget */}
			<div className="px-4 pt-[12px]">
				<div id="google_translate_element" />
			</div>

			{/* ── Tab content ─────────────────────────────────────────────────── */}
			<div className="translate flex-1 overflow-y-auto overflow-x-hidden px-4 pt-0 pb-4 min-h-0">
				{activeTab === "overview" && (
					<OverviewTab
						scenario={scenario}
						mode={mode}
						enrichedPapers={enrichedPapers}
						enrichedPatents={enrichedPatents}
						enrichedUseCases={enrichedUseCases}
					/>
				)}

				{activeTab === "papers" && (
					<PaperTab
						isLoading={isPapersLoading}
						visiblePapers={visiblePapers}
						sortedPapersCount={sortedPapers.length}
						showSavedOnly={showSavedOnly}
						papersSummary={displayPapersSummary}
						currentPage={safePage}
						totalPages={totalPages}
						pageSize={pageSize}
						treeId={treeId}
						isFetchingFromEdge={isFetchingFromEdge}
						onTogglePaper={handleTogglePaper}
						onPageChange={setCurrentPage}
						onPageSizeChange={setPageSize}
						onFetchPapers={fetchPapersFromEdge}
					/>
				)}

				{activeTab === "patents" && (
					<PatentTab
						isLoading={shouldShowPatentsLoading}
						displayedPatents={displayedPatents}
						totalPatentsCount={totalPatentsCount}
						patentsSummary={displayPatentsSummary}
						onReload={fetchPatentsFromEdge}
					/>
				)}

				{activeTab === "implementation" && (
					<ImplementationTab
						isLoading={shouldShowUseCasesLoading}
						displayedCases={displayedCases}
						totalCasesCount={enrichedUseCases.length}
						showSavedOnly={showSavedOnly}
						marketSummary={displayMarketSummary}
						scenarioId={scenario.id}
						onReload={fetchUseCasesFromEdge}
						onToggleCase={handleToggleCase}
					/>
				)}

				{activeTab === "summary" && (
					<ReportTab
						storeKey={storeKey}
						isLoading={isReportLoading}
						showReport={showReport}
						reportData={reportData}
						finalizeProgress={finalizeProgress}
						apiHealthy={apiHealthy}
						checkingScenario={checkingScenario}
						scenarioData={scenarioData}
						queueStatus={queueStatus}
						jobStartedAt={jobStartedAt}
						treeId={treeId}
						isExpanded={isExpanded}
						onGenerate={generateReport}
						onResetError={resetError}
						reportContainerRef={reportContainerRef}
					/>
				)}
			</div>
		</div>
	)
}
