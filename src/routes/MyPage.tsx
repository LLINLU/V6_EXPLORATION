import { ArrowUpDown, Check, Download, ListFilter, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { CSVLink } from "react-csv"
import { useTranslation } from "react-i18next"
import { AppSidebar } from "@/components/AppSidebar"
import { SavedPaperCard } from "@/components/technology-tree/SavedPaperCard"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUserDetail } from "@/hooks/useUserDetail"
import { savedItemStore } from "@/stores/savedStore"

const MyPageContent = () => {
	const { t } = useTranslation()
	const [searchQuery, setSearchQuery] = useState("")
	const [showSearchInput, setShowSearchInput] = useState(false)
	const [sortBy, setSortBy] = useState<"date" | "title">("date")
	const [selectedFilters, setSelectedFilters] = useState({
		timePeriod: "",
		citations: "",
		region: "",
		completeness: "",
	})
	const [filterOpen, setFilterOpen] = useState(false)
	const [activeTab, setActiveTab] = useState("papers")
	const searchContainerRef = useRef<HTMLDivElement | null>(null)

	const { userDetails } = useUserDetail()
	const user_id = userDetails?.user_id || ""
	const team_id = userDetails?.team_id || ""

	// UseEffect only runs when the provided arguments in [] change!
	useEffect(() => {
		savedItemStore.setState({ user_id })
		savedItemStore.setState({ team_id })

		const fetch = async () => {
			await savedItemStore.getState().fetchSavedPapers()
			await savedItemStore.getState().fetchSavedCases()
		}

		fetch()
	}, [user_id, team_id])

	const savedPapers = savedItemStore((state) => state.saved_papers)
	const savedPapersLoading = savedItemStore((state) => state.loading_paper_ids)
	const savedUseCases = savedItemStore((state) => state.saved_cases)
	const savedUseCasesLoading = savedItemStore((state) => state.loading_case_ids)

	// Calculate active filter count
	const activeFilterCount =
		Object.values(selectedFilters).filter(Boolean).length

	const handleFilterSelect = (
		category: keyof typeof selectedFilters,
		value: string,
	) => {
		setSelectedFilters((prev) => {
			const newValue = prev[category] === value ? "" : value
			return { ...prev, [category]: newValue }
		})
	}

	const handleReset = () => {
		setSelectedFilters({
			timePeriod: "",
			citations: "",
			region: "",
			completeness: "",
		})
	}

	useEffect(() => {
		if (!showSearchInput) return

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setShowSearchInput(false)
			}
		}

		const handlePointerDown = (event: MouseEvent) => {
			const target = event.target as Node
			if (!searchContainerRef.current?.contains(target)) {
				setShowSearchInput(false)
			}
		}

		document.addEventListener("keydown", handleEscape)
		document.addEventListener("mousedown", handlePointerDown)

		return () => {
			document.removeEventListener("keydown", handleEscape)
			document.removeEventListener("mousedown", handlePointerDown)
		}
	}, [showSearchInput])

	let filteredPapers = savedPapers
		.filter(
			(item) =>
				item.paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.paper.authors.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		.filter((item) => {
			if (
				selectedFilters.region.toLowerCase() &&
				item.paper.region !== selectedFilters.region
			)
				return false
			const minCitations = parseInt(selectedFilters.citations || "-1")
			if (item.paper.citations < minCitations) {
				return false
			}

			const years_within = parseInt(selectedFilters.timePeriod || "100")
			const today = new Date()
			const threshold = new Date()
			const current_year = today.getFullYear()
			threshold.setFullYear(current_year - years_within)

			let item_date = today
			if (item.paper.date) item_date = new Date(item.paper.date)

			// console.log("YEARS", item_date.getFullYear(), threshold.getFullYear())
			if (item_date.getTime() <= threshold.getTime()) return false

			return true
		})

	let filteredUseCases = savedUseCases.filter((item) => {
		const product = item.use_case.product?.toLowerCase() ?? ""
		const description = item.use_case.description?.toLowerCase() ?? ""

		const press = item.use_case.press_releases.join().toLowerCase() ?? ""
		const query = searchQuery.toLowerCase()

		return (
			product.includes(query) ||
			description.includes(query) ||
			press.includes(query)
		)
	})

	// Apply sorting
	if (sortBy === "title") {
		filteredPapers = [...filteredPapers].sort((a, b) =>
			a.paper.title.localeCompare(b.paper.title),
		)
		filteredUseCases = [...filteredUseCases].sort((a, b) =>
			a.use_case.product.localeCompare(b.use_case.product),
		)
	} else {
		filteredPapers = [...filteredPapers].sort(
			(a, b) =>
				new Date(a.saved_at ?? new Date(0)).getTime() -
				new Date(b.saved_at ?? new Date(0)).getTime(),
		)
		filteredUseCases = [...filteredUseCases].sort(
			(a, b) =>
				new Date(b.saved_at ?? new Date(0)).getTime() -
				new Date(a.saved_at ?? new Date(0)).getTime(),
		)
	}

	const paper_data = filteredPapers.map((item) => ({
		title: item.paper.title,
		authors: item.paper.authors,
		journal: item.paper.journal,
		abstract: item.paper.abstract,
		date: item.paper.date,
		citations: item.paper.citations,
		doi: item.paper.doi,
		url: item.paper.url,
		tags: Array.isArray(item.paper.tags)
			? item.paper.tags.join(", ")
			: JSON.stringify(item.paper.tags),
		region: item.paper.region,
	}))

	const cases_data = filteredUseCases.map((item) => ({
		product: item.use_case.product,
		description: item.use_case.description,
		company: item.use_case.company,
		press_releases: item.use_case.press_releases,
	}))

	// const paper_headers = [
	// 	"Paper Title",
	// 	"Authors",
	// 	"Journal",
	// 	"Abstract",
	// 	"Date",
	// 	"Citations",
	// 	"Doi",
	// 	"Url",
	// 	"Tags",
	// 	"Region"
	// ];

	// const case_headers = [
	// 	"Product",
	// 	"Description",
	// 	"Company",
	// 	"Press_releases"
	// ]

	return (
		<SidebarProvider>
			<div className="flex h-screen w-full p-1 overflow-hidden">
				<AppSidebar />
				<main className="flex-1 p-6 overflow-auto">
					<div className="max-w-6xl mx-auto">
						<div className="mb-8">
							<h1 className="text-xl font-semibold text-foreground mb-4">
								{t("my_page.saved_list")}
							</h1>
						</div>

						<Tabs
							defaultValue={activeTab}
							onValueChange={setActiveTab}
							className="w-full"
						>
							<div className="flex justify-between items-center mb-6">
								<TabsList className="grid grid-cols-2 w-fit h-8 p-[2px] rounded-md border border-[#a6d5ff] bg-white">
									<TabsTrigger
										value="papers"
										className="h-full rounded-[6px] px-3 py-0 text-xs leading-none font-medium text-[#6b7280] data-[state=active]:bg-[#E7F2FF] data-[state=active]:text-[#4C70D9] data-[state=active]:shadow-none"
									>
										{t("my_page.papers_tab", { count: filteredPapers.length })}
									</TabsTrigger>
									<TabsTrigger
										value="usecases"
										className="h-full rounded-[6px] px-3 py-0 text-xs leading-none font-medium text-[#6b7280] data-[state=active]:bg-[#E7F2FF] data-[state=active]:text-[#4C70D9] data-[state=active]:shadow-none"
									>
										{t("my_page.use_cases_tab", {
											count: filteredUseCases.length,
										})}
									</TabsTrigger>
								</TabsList>

								<div
									className="flex items-center gap-2"
									ref={searchContainerRef}
								>
									{showSearchInput && (
										<input
											type="text"
											placeholder={t("my_page.search_placeholder")}
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="h-9 px-3 rounded-md border border-input bg-background text-sm w-64"
											autoFocus
										/>
									)}
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setShowSearchInput(!showSearchInput)}
										className="h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
									>
										<Search className="h-4 w-4" />
									</Button>

									<DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className={`gap-2 relative text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${
													activeFilterCount > 0
														? "bg-gray-100 hover:bg-gray-200"
														: ""
												}`}
											>
												<ListFilter className="h-4 w-4" />
												{activeFilterCount > 0 && (
													<span className="bg-[#dbdbdb] text-[#565656] text-[0.65rem] rounded-full w-5 h-5 flex items-center justify-center font-medium">
														{activeFilterCount}
													</span>
												)}
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-56"
											align="end"
											onCloseAutoFocus={(e) => {
												e.preventDefault()
											}}
											onClick={(e) => {
												e.stopPropagation()
											}}
										>
											{/* Scrollable filter options section */}
											<div className="max-h-64 overflow-y-auto">
												<DropdownMenuLabel>Time Period</DropdownMenuLabel>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("timePeriod", "1")
													}}
													className="flex items-center justify-between"
												>
													Past year
													{selectedFilters.timePeriod === "1" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("timePeriod", "5")
													}}
													className="flex items-center justify-between"
												>
													Past 5 years
													{selectedFilters.timePeriod === "5" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("timePeriod", "10")
													}}
													className="flex items-center justify-between"
												>
													Past 10 years
													{selectedFilters.timePeriod === "10" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>

												<DropdownMenuSeparator />
												<DropdownMenuLabel>Citations</DropdownMenuLabel>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("citations", "-1")
													}}
													className="flex items-center justify-between"
												>
													Any (including 0)
													{selectedFilters.citations === "-1" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("citations", "0")
													}}
													className="flex items-center justify-between"
												>
													0 citations
													{selectedFilters.citations === "0" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("citations", "10")
													}}
													className="flex items-center justify-between"
												>
													10+ citations
													{selectedFilters.citations === "10" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("citations", "50")
													}}
													className="flex items-center justify-between"
												>
													50+ citations
													{selectedFilters.citations === "50" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("citations", "100")
													}}
													className="flex items-center justify-between"
												>
													100+ citations
													{selectedFilters.citations === "100" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuSeparator />

												<DropdownMenuLabel>
													Author/Journal Info
												</DropdownMenuLabel>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("completeness", "complete")
													}}
													className="flex items-center justify-between"
												>
													Complete info only
													{selectedFilters.completeness === "complete" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("completeness", "incomplete")
													}}
													className="flex items-center justify-between"
												>
													Missing author/journal
													{selectedFilters.completeness === "incomplete" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("completeness", "all")
													}}
													className="flex items-center justify-between"
												>
													All papers
													{selectedFilters.completeness === "all" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>

												<DropdownMenuSeparator />

												<DropdownMenuLabel>Region</DropdownMenuLabel>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("region", "domestic")
													}}
													className="flex items-center justify-between"
												>
													Domestic
													{selectedFilters.region === "domestic" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("region", "international")
													}}
													className="flex items-center justify-between"
												>
													International
													{selectedFilters.region === "international" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault()
														handleFilterSelect("region", "both")
													}}
													className="flex items-center justify-between"
												>
													Both
													{selectedFilters.region === "both" && (
														<Check className="h-4 w-4" />
													)}
												</DropdownMenuItem>
											</div>

											{/* Fixed reset button section */}
											<div className="bg-background border-t border-border">
												<DropdownMenuSeparator />
												<div className="p-2">
													<Button
														variant="outline"
														size="sm"
														onClick={(e) => {
															e.preventDefault()
															handleReset()
														}}
														className="w-full text-gray-600 hover:text-gray-800"
														disabled={activeFilterCount === 0}
													>
														{t("my_page.reset")}
													</Button>
												</div>
											</div>
										</DropdownMenuContent>
									</DropdownMenu>

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
											>
												<ArrowUpDown className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => setSortBy("date")}>
												{t("my_page.sort_by_date")}
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => setSortBy("title")}>
												{t("my_page.sort_by_title")}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>

									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger>
												{activeTab === "papers" ? (
													<CSVLink
														data={paper_data}
														filename="saved_papers_filtered.csv"
														className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
													>
														<Download className="h-4 w-4" />
													</CSVLink>
												) : (
													<CSVLink
														data={cases_data}
														filename="saved_cases_filtered.csv"
														className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
													>
														<Download className="h-4 w-4" />
													</CSVLink>
												)}
											</TooltipTrigger>
											<TooltipContent>
												<div className="max-w-sm text-sm">
													Download Results as CSV
												</div>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
							</div>

							<TabsContent value="papers" className="mt-6">
								{savedPapersLoading ? (
									<div className="text-center py-12">
										<p className="text-muted-foreground">
											{t("common.loading")}
										</p>
									</div>
								) : filteredPapers.length === 0 ? (
									<Card>
										<CardHeader>
											<CardTitle>{t("my_page.no_papers_title")}</CardTitle>
											<CardDescription>
												{t("my_page.no_papers_description")}
											</CardDescription>
										</CardHeader>
									</Card>
								) : (
									<div className="space-y-4">
										{filteredPapers.map((item) => (
											<SavedPaperCard
												key={item.id}
												paper={item.paper}
												treeId={item.tree_id}
												nodeId={item.node_id}
												isSavedItemsView={true}
												savedItemId={item.id}
												savedNotes={item.notes}
											/>
										))}
									</div>
								)}
							</TabsContent>

							<TabsContent value="usecases" className="mt-6">
								{savedUseCasesLoading ? (
									<div className="text-center py-12">
										<p className="text-muted-foreground">
											{t("common.loading")}
										</p>
									</div>
								) : filteredUseCases.length === 0 ? (
									<Card>
										<CardHeader>
											<CardTitle>{t("my_page.no_use_cases_title")}</CardTitle>
											<CardDescription>
												{t("my_page.no_use_cases_description")}
											</CardDescription>
										</CardHeader>
									</Card>
								) : (
									<div className="space-y-4">
										{filteredUseCases.map((item) => (
											<div
												key={item.id}
												className="w-full bg-white p-6 rounded-lg border border-gray-200"
											>
												<div className="space-y-3">
													<h6 className="text-base leading-6 text-black">
														{item.use_case.product}
													</h6>
													<p className="text-sm text-gray-600">
														{item.use_case.company.join(", ")}
													</p>
													<p className="text-sm text-gray-700">
														{item.use_case.description}
													</p>
													{item.use_case.press_releases.length > 0 && (
														<div className="text-xs text-gray-600">
															<p className="font-medium mb-1">
																{t("my_page.press_releases")}
															</p>
															<ul className="list-disc list-inside space-y-1">
																{item.use_case.press_releases.map((pr, idx) => (
																	<li key={`${pr.trim().slice(0, 3)}-${idx}`}>
																		{pr}
																	</li>
																))}
															</ul>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</TabsContent>
						</Tabs>
					</div>
				</main>
			</div>
		</SidebarProvider>
	)
}

export const MyPage = () => {
	return <MyPageContent></MyPageContent>
}
