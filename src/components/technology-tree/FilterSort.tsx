import { ArrowUpDown, Check, SlidersHorizontal } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FilterSortProps {
	onFilterChange?: (filter: string) => void
	onSortChange?: (sort: string) => void
	className?: string
}

export const FilterSort = ({
	onFilterChange,
	onSortChange,
	className,
}: FilterSortProps) => {
	const { t } = useTranslation()
	const [selectedFilters, setSelectedFilters] = useState({
		timePeriod: "",
		citations: "",
		region: "",
		completeness: "",
	})
	const [filterOpen, setFilterOpen] = useState(false)

	// Calculate active filter count
	const activeFilterCount =
		Object.values(selectedFilters).filter(Boolean).length

	useEffect(() => {
		if (!onFilterChange) return

		// Determine the output based on whether any filters are active.
		const isActive = Object.values(selectedFilters).filter(Boolean).length > 0

		// If there are no active filters, send the empty string.
		// If there are active filters, send the JSON string.
		const outputString = isActive ? JSON.stringify(selectedFilters) : ""

		onFilterChange(outputString)
	}, [selectedFilters, onFilterChange])

	const handleFilterSelect = (
		category: keyof typeof selectedFilters,
		value: string,
	) => {
		setSelectedFilters((prev) => {
			const newValue = prev[category] === value ? "" : value
			const newFilters = { ...prev, [category]: newValue }
			// onFilterChange?.(JSON.stringify(newFilters))
			// console.log("NEW TIME FILTER:", newFilters.timePeriod)
			return newFilters
		})
	}

	const handleReset = () => {
		const clearedFilters = {
			timePeriod: "",
			citations: "",
			region: "",
			completeness: "",
		}
		setSelectedFilters(clearedFilters)
		// onFilterChange?.("")
	}

	return (
		<div className={`flex items-center gap-2 ${className || ""}`}>
			<DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className={`gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 relative ${
							activeFilterCount > 0
								? "bg-gray-100 text-gray-700 hover:bg-gray-200"
								: ""
						}`}
					>
						<SlidersHorizontal className="h-4 w-4" />
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
						<DropdownMenuLabel>{t("papers_filter.period")}</DropdownMenuLabel>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault()
								handleFilterSelect("timePeriod", "1")
							}}
							className="flex items-center justify-between"
						>
							{t("papers_filter.past_year")}
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
							{t("papers_filter.past_5_years")}
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
							{t("papers_filter.past_10_years")}
							{selectedFilters.timePeriod === "10" && (
								<Check className="h-4 w-4" />
							)}
						</DropdownMenuItem>

						<DropdownMenuSeparator />
						<DropdownMenuLabel>
							{t("papers_filter.citations")}
						</DropdownMenuLabel>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault()
								handleFilterSelect("citations", "-1")
							}}
							className="flex items-center justify-between"
						>
							{t("papers_filter.citations_any")}
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
							{t("papers_filter.citations_0")}
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
							{t("papers_filter.citations_10")}
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
							{t("papers_filter.citations_50")}
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
							{t("papers_filter.citations_100")}
							{selectedFilters.citations === "100" && (
								<Check className="h-4 w-4" />
							)}
						</DropdownMenuItem>
						<DropdownMenuSeparator />

						<DropdownMenuLabel>
							{t("papers_filter.author_journal")}
						</DropdownMenuLabel>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault()
								handleFilterSelect("completeness", "complete")
							}}
							className="flex items-center justify-between"
						>
							{t("papers_filter.complete_only")}
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
							{t("papers_filter.missing_info")}
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
							{t("papers_filter.all_papers")}
							{selectedFilters.completeness === "all" && (
								<Check className="h-4 w-4" />
							)}
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuLabel>{t("papers_filter.region")}</DropdownMenuLabel>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault()
								handleFilterSelect("region", "domestic")
							}}
							className="flex items-center justify-between"
						>
							{t("papers_filter.domestic")}
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
							{t("papers_filter.international")}
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
							{t("papers_filter.both_regions")}
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
								{t("papers_filter.reset")}
							</Button>
						</div>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
					>
						<ArrowUpDown className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onSelect={() => onSortChange?.("newest")}>
						{t("papers_filter.newest_first")}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => onSortChange?.("oldest")}>
						{t("papers_filter.oldest_first")}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => onSortChange?.("citations")}>
						{t("papers_filter.most_citations")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
