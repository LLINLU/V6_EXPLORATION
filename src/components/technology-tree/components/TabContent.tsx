import {
	BookmarkCheck,
	Download,
	Inbox,
	Loader2,
	RefreshCw,
	Search,
	X,
} from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { CSVLink } from "react-csv"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { useEnrichedData } from "@/hooks/useEnrichedData"
import { useUserDetail } from "@/hooks/useUserDetail"
import type { Tables } from "@/integrations/supabase/types/database.types"
import type {
	CasesWithSaved,
	PapersWithSaved,
} from "@/integrations/supabase/types/more_types"
import { getEnrichmentElapsedTime } from "@/services/enrichmentQueue"
import { savedItemStore } from "@/stores/savedStore"
import { FilterSort } from "../FilterSort"
import { ImplementationList } from "../ImplementationList"
import { PaperList } from "../PaperList"
import { PatentCard } from "../PatentCard"
import { SelectedNodeInfo } from "./SelectedNodeInfo"
import { SummarySection } from "./SummarySection"

type _PaperData = Tables<"node_papers">

const InlineLoadingStatus = ({
	label,
	tone = "blue",
}: {
	label: string
	tone?: "blue" | "amber" | "green"
}) => {
	const toneClass =
		tone === "amber"
			? "border-amber-100 bg-amber-50 text-amber-700"
			: tone === "green"
				? "border-green-100 bg-green-50 text-green-700"
				: "border-blue-100 bg-blue-50 text-blue-700"
	return (
		<div
			className={`mb-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${toneClass}`}
		>
			<Loader2 className="h-3.5 w-3.5 animate-spin" />
			<span>{label}</span>
		</div>
	)
}

declare global {
	interface Window {
		googleTranslateElementInit?: () => void
		google?: any
	}
}

interface TabContentProps {
	activeTab: string
	selectedNodeId?: string
	selectedNodeTitle?: string
	selectedNodeDescription?: string
	level?: number
	mode?: "TED" | "FAST"
	onChatToggle?: () => void
	saved_paper_ids: string[]
	saved_case_ids: string[]
	totalPatentsCount?: number
}

export const TabContent: React.FC<TabContentProps> = ({
	activeTab,
	selectedNodeId,
	selectedNodeTitle,
	selectedNodeDescription,
	level,
	mode = "TED",
	onChatToggle,
	saved_paper_ids,
	saved_case_ids,
	totalPatentsCount: totalPatentsCountProp,
}) => {
	const { t } = useTranslation()
	const [currentFilter, setCurrentFilter] = useState("")
	const [currentSort, setCurrentSort] = useState("citations")
	const [currentKeyword, setCurrentKeyword] = useState("")
	const [showSavedOnly, setShowSavedOnly] = useState(false)

	const [_elapsedTime, setElapsedTime] = useState(0)
	const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false)

	const containerRef = useRef<HTMLDivElement>(null)
	const paperListRef = useRef<HTMLDivElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)

	const {
		papers,
		patents,
		useCases,
		loadingPapers,
		loadingPatents,
		loadingUseCases,
		refresh,
	} = useEnrichedData(selectedNodeId || null)
	const displayedPatents = patents ?? []
	const totalPatentsCount = totalPatentsCountProp ?? displayedPatents.length
	const effectiveTotalPatentsCount =
		totalPatentsCount > 0 ? totalPatentsCount : displayedPatents.length
	const visiblePatents =
		effectiveTotalPatentsCount > 0
			? displayedPatents.slice(
					0,
					Math.min(displayedPatents.length, effectiveTotalPatentsCount),
				)
			: displayedPatents
	const displayedPatentsCount = visiblePatents.length
	const shouldShowPatentsLoading = loadingPatents && displayedPatentsCount === 0

	// ── Papers: attach saved flag ──
	const savedPaperIdsSet = new Set(saved_paper_ids)
	const papersWithSavedFlag = papers.map((p) => ({
		...p,
		saved: savedPaperIdsSet.has(p.id),
	}))

	// ── Cases: attach saved flag ──
	const savedCaseIdsSet = new Set(saved_case_ids)
	const casesWithSavedFlag = useCases.map((p) => ({
		...p,
		saved: savedCaseIdsSet.has(p.id),
	}))

	// ── Papers: keyword filter ──
	const keywordFilteredPapers = currentKeyword
		? papersWithSavedFlag.filter((paper) => {
				const searchText = currentKeyword.toLowerCase()
				return (
					paper.title?.toLowerCase().includes(searchText) ||
					paper.abstract?.toLowerCase().includes(searchText) ||
					paper.authors?.toLowerCase().includes(searchText)
				)
			})
		: papersWithSavedFlag

	const paper_filters = currentFilter
		? JSON.parse(currentFilter)
		: {
				timePeriod: "",
				citations: "",
				region: "",
				completeness: "",
			}

	const filteredPapers = keywordFilteredPapers.filter((item) => {
		if (
			paper_filters.region &&
			item.region.toLowerCase() !== paper_filters.region.toLowerCase()
		)
			return false

		const minCitations = parseInt(paper_filters.citations || "-1")
		if (item.citations < minCitations) {
			return false
		}

		const years_within = parseInt(paper_filters.timePeriod || "100")
		const today = new Date()
		const threshold = new Date()
		const current_year = today.getFullYear()
		threshold.setFullYear(current_year - years_within)

		let item_date = today
		if (item.date) item_date = new Date(item.date)

		if (item_date.getTime() <= threshold.getTime()) return false

		return true
	})

	// ── Papers: saved filter ──
	const displayedPapers = showSavedOnly
		? filteredPapers.filter((p) => p.saved)
		: filteredPapers

	// ── Papers: sort helpers ──
	function sortPaperOldest(a: PapersWithSaved, b: PapersWithSaved) {
		let a_date = new Date()
		let b_date = new Date()
		if (a.date) a_date = new Date(a.date)
		if (b.date) b_date = new Date(b.date)
		if (a_date <= b_date) return -1
		return 1
	}

	function sortPaperNewest(a: PapersWithSaved, b: PapersWithSaved) {
		let a_date = new Date()
		let b_date = new Date()
		if (a.date) a_date = new Date(a.date)
		if (b.date) b_date = new Date(b.date)
		if (a_date <= b_date) return 1
		return -1
	}

	function sortPaperCitation(a: PapersWithSaved, b: PapersWithSaved) {
		if (a.citations && b.citations) {
			if (a.citations <= b.citations) return -1
			else if (a.citations > b.citations) return 1
		}
		return 0
	}

	let sortedPapers = displayedPapers
	if (currentSort === "citations")
		sortedPapers = displayedPapers.sort(sortPaperCitation)
	else if (currentSort === "newest")
		sortedPapers = displayedPapers.sort(sortPaperNewest)
	else if (currentSort === "oldest")
		sortedPapers = displayedPapers.sort(sortPaperOldest)

	// ── Papers: CSV data ──
	const paper_data = sortedPapers.map((item) => {
		const existingUrl = String(item.url ?? "").trim()
		const rawDoi = String(item.doi ?? "")
			.trim()
			.replace(/^doi:\s*/i, "")
		const doiUrl = rawDoi
			? rawDoi.startsWith("http://") || rawDoi.startsWith("https://")
				? rawDoi
				: `https://doi.org/${rawDoi}`
			: ""

		return {
			title: item.title,
			authors: item.authors,
			date: item.date,
			citations: item.citations,
			doi: item.doi,
			url: existingUrl || doiUrl,
			tags: Array.isArray(item.tags)
				? item.tags.join(", ")
				: JSON.stringify(item.tags),
			region: item.region,
		}
	})

	// ── Patents: CSV data ──
	const patent_data = (patents ?? []).map((item: any) => {
		const existingUrl = String(item.url ?? "").trim()
		const directPatentNumber = String(item.patent_number ?? "").trim()
		const publicationNumber = String(item.publication_number ?? "").trim()
		const patentNumberFromUrl =
			existingUrl.match(/\/patent\/([^/?#]+)/i)?.[1] ?? ""
		const normalizedPatentNumber =
			directPatentNumber || publicationNumber || patentNumberFromUrl
		const generatedPatentUrl = publicationNumber
			? `https://patents.google.com/patent/${publicationNumber}/en`
			: ""
		const normalizedExistingUrl = existingUrl
			? existingUrl.startsWith("http://") || existingUrl.startsWith("https://")
				? existingUrl
				: existingUrl.startsWith("patents.google.com")
					? `https://${existingUrl}`
					: ""
			: ""
		const normalizedUrl = generatedPatentUrl || normalizedExistingUrl

		return {
			title: item.title ?? "",
			applicant: item.applicant ?? item.assignee?.[0]?.name ?? "",
			patent_number: normalizedPatentNumber,
			earliest_priority_date: item.earliest_priority_date ?? "",
			url: normalizedUrl,
		}
	})

	// ── Cases: saved filter + CSV data ──
	const displayedCases = showSavedOnly
		? casesWithSavedFlag.filter((c) => c.saved)
		: casesWithSavedFlag
	const shouldShowUseCasesLoading =
		loadingUseCases && casesWithSavedFlag.length === 0

	const cases_data = displayedCases.map((item) => ({
		product: item.product,
		description: item.description,
		company: item.company,
		press_releases: item.press_releases,
	}))

	// ── Saved item toggles ──
	const toggle_paper = savedItemStore((state) => state.toggle_paper)
	const toggle_case = savedItemStore((state) => state.toggle_usecase)

	const { toast } = useToast()

	const handleTogglePaper = useCallback(
		(paper: PapersWithSaved) => {
			toast({
				title: paper.saved ? t("tech.paper_removed") : t("tech.paper_saved"),
				description: paper.title,
			})
			toggle_paper(paper)
		},
		[toggle_paper, toast, t],
	)

	const handleToggleCase = useCallback(
		(useCase: CasesWithSaved) => {
			toast({
				title: useCase.saved ? t("tech.case_removed") : t("tech.case_saved"),
				description: useCase.product,
			})
			toggle_case(useCase)
		},
		[toggle_case, toast, t],
	)

	// ── Google Translate setup ──
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
		// Re-init whenever React remounts the div (tab switch, node change, Strict Mode)
		const interval = setInterval(initTranslate, 1000)
		return () => clearInterval(interval)
	}, [])

	// ── Enrichment elapsed-time tracker ──
	useEffect(() => {
		const interval = setInterval(() => {
			if (loadingUseCases && selectedNodeId && activeTab === "implementation") {
				const elapsed = getEnrichmentElapsedTime(selectedNodeId, "useCases")
				setElapsedTime(elapsed ? Math.floor(elapsed / 1000) : 0)
			} else {
				setElapsedTime(0)
			}
		}, 500)

		return () => clearInterval(interval)
	}, [loadingUseCases, selectedNodeId, activeTab])

	// ── Filter / sort / search handlers ──
	const handleFilterChange = (filter: string) => {
		setCurrentFilter(filter)
	}

	const handleSortChange = (sort: string) => {
		setCurrentSort(sort)
	}

	const handleKeywordChange = (keyword: string) => {
		setCurrentKeyword(keyword)
	}

	const handleTotalCountChange = (_count: number) => {
		// unused
	}

	const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		handleKeywordChange(e.target.value)
	}

	const handleClearSearch = () => {
		setCurrentKeyword("")
		handleKeywordChange("")
		searchInputRef.current?.focus()
	}

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			setIsSearchPopoverOpen(false)
			searchInputRef.current?.blur()
		}
	}

	const handleReloadPatents = useCallback(() => {
		if (!selectedNodeId) return
		refresh()
	}, [refresh, selectedNodeId])

	// Auto-focus search input when popover opens
	useEffect(() => {
		if (isSearchPopoverOpen) {
			setTimeout(() => {
				searchInputRef.current?.focus()
			}, 0)
		}
	}, [isSearchPopoverOpen])

	useEffect(() => {
		if (paperListRef.current) {
			setTimeout(() => {
				if (paperListRef.current) {
					paperListRef.current.style.outline = ""
				}
			}, 10)
		}
	}, [])

	const { userDetails } = useUserDetail()
	const exportDate = new Date().toISOString().split("T")[0]
	const scenarioNameForExport = (
		selectedNodeTitle?.trim() || "scenario"
	).replace(/[\\/:*?"<>|]/g, "_")

	// ── CSV export helper (papers | patents | cases) ──
	const getCsvExport = () => {
		if (activeTab === "patents")
			return {
				data: patent_data,
				filename: `${scenarioNameForExport}_特許_${exportDate}.csv`,
			}
		if (activeTab === "implementation")
			return {
				data: cases_data,
				filename: `${scenarioNameForExport}_事例_${exportDate}.csv`,
			}
		return {
			data: paper_data,
			filename: `${scenarioNameForExport}_論文_${exportDate}.csv`,
		}
	}

	const csvExport = getCsvExport()

	return (
		<div className="h-full flex flex-col" ref={containerRef}>
			<SelectedNodeInfo
				title={selectedNodeTitle || "Select a node to view research"}
				description={
					selectedNodeDescription ||
					"Click on any node in the mindmap to see papers and implementation examples."
				}
				level={level}
				mode={mode}
				nodeId={selectedNodeId}
				onChatToggle={onChatToggle}
			/>

			<SummarySection selectedNodeId={selectedNodeId} activeTab={activeTab} />

			{/* ── Toolbar: translate, search, filter, saved, CSV ── */}
			<div className="flex-shrink-0 px-4">
				<div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
					{/* Google Translate widget */}
					<div
						id="google_translate_element"
						className="text-sm flex-shrink-0"
					/>

					<div className="flex items-center gap-2 justify-end flex-shrink-0">
						{/* Search + FilterSort — papers tab only */}
						{activeTab === "papers" && (
							<>
								<Popover
									open={isSearchPopoverOpen}
									onOpenChange={setIsSearchPopoverOpen}
								>
									<PopoverTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className={`h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${
												currentKeyword ? "bg-gray-100 text-gray-700" : ""
											}`}
										>
											<Search className="h-4 w-4" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-80 p-3"
										align="end"
										side="bottom"
										sideOffset={8}
										alignOffset={-130}
									>
										<div className="relative">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
											<Input
												ref={searchInputRef}
												placeholder={t("tech.search_papers_placeholder")}
												value={currentKeyword}
												onChange={handleSearchInputChange}
												onKeyDown={handleSearchKeyDown}
												className="pl-10 pr-10"
											/>
											{currentKeyword && (
												<Button
													variant="ghost"
													size="sm"
													className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
													onClick={handleClearSearch}
												>
													<X className="h-3 w-3 text-gray-400" />
												</Button>
											)}
										</div>
									</PopoverContent>
								</Popover>

								<FilterSort
									onFilterChange={handleFilterChange}
									onSortChange={handleSortChange}
									className="contents"
								/>
							</>
						)}

						{/* Saved filter — papers, patents, and implementation tabs */}
						{(activeTab === "papers" ||
							activeTab === "patents" ||
							activeTab === "implementation") &&
							userDetails && (
								<Button
									variant="ghost"
									size="sm"
									className={`h-8 w-8 p-0 text-gray-500 hover:text-gray-700 ${
										showSavedOnly ? "bg-gray-100 hover:bg-gray-200" : ""
									}`}
									onClick={() => setShowSavedOnly(!showSavedOnly)}
								>
									<BookmarkCheck className="h-4 w-4" />
								</Button>
							)}

						{/* CSV download — all data tabs */}
						<CSVLink data={csvExport.data} filename={csvExport.filename}>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
							>
								<Download className="h-4 w-4" />
							</Button>
						</CSVLink>
					</div>
				</div>
			</div>

			{/* ── Tab content body ── */}
			<div
				className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4"
				data-papers-scroll
			>
				<div className="translate">
					{/* ────── Papers tab ────── */}
					{activeTab === "papers" ? (
						loadingPapers && displayedPapers.length === 0 ? (
							<div className="flex items-center justify-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
							</div>
						) : showSavedOnly && displayedPapers.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-64 text-gray-500">
								<Inbox className="h-12 w-12 mb-4 text-gray-300" />
								<p
									className="font-medium"
									style={{ fontSize: "14px", lineHeight: "21px" }}
								>
									{t("tech.no_saved_papers")}
								</p>
								<p className="text-sm mt-2">{t("tech.save_papers_hint")}</p>
							</div>
						) : (
							<>
								{loadingPapers && (
									<InlineLoadingStatus label={t("tech.searching")} />
								)}
								<PaperList
									papers={displayedPapers as PapersWithSaved[]}
									selectedNodeId={selectedNodeId}
									filterString={currentFilter}
									sortBy={currentSort}
									onTotalCountChange={handleTotalCountChange}
									togglePaper={handleTogglePaper}
								/>
							</>
						)
					) : /* ────── Patents tab ────── */
					activeTab === "patents" ? (
						shouldShowPatentsLoading ? (
							<div className="flex items-center justify-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
							</div>
						) : displayedPatentsCount === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 gap-3">
								{shouldShowPatentsLoading ? (
									<>
										<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
										<p className="text-gray-500 text-sm">
											{t("common.loading")}
										</p>
									</>
								) : (
									<Button
										variant="outline"
										size="sm"
										onClick={handleReloadPatents}
									>
										<RefreshCw className="h-4 w-4 mr-2" />
										{t("scenario.tab.patent_reload")}
									</Button>
								)}
							</div>
						) : (
							<div className="translate">
								<p className="mb-3 text-xs text-gray-500">
									{t("scenario.tab.patent_displayed_count", {
										displayed: displayedPatentsCount.toLocaleString(),
										total: effectiveTotalPatentsCount.toLocaleString(),
									})}
								</p>
								<ul className="space-y-4 px-1">
									{visiblePatents.map((patent: any) => (
										<PatentCard key={patent.id} patent={patent} />
									))}
								</ul>
							</div>
						)
					) : /* ────── Implementation / use-cases tab ────── */
					activeTab === "implementation" ? (
						showSavedOnly && displayedCases.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-64 text-gray-500">
								<Inbox className="h-12 w-12 mb-4 text-gray-300" />
								<p
									className="font-medium"
									style={{ fontSize: "14px", lineHeight: "21px" }}
								>
									{t("tech.no_saved_cases")}
								</p>
								<p className="text-sm mt-2">{t("tech.save_cases_hint")}</p>
							</div>
						) : (
							<ImplementationList
								selectedNodeId={selectedNodeId}
								useCases={displayedCases as CasesWithSaved[]}
								loadingUseCases={shouldShowUseCasesLoading}
								toggleCase={handleToggleCase}
							/>
						)
					) : null}
				</div>
			</div>
		</div>
	)
}
