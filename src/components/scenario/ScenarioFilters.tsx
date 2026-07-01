/**
 * Scenario Filters Component
 * Dropdown-based filter controls for scenarios
 */

import { Plus, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
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
import type { FilterState } from "@/types/scenario"

interface ScenarioFiltersProps {
	filters: FilterState
	onFilterChange: (filters: FilterState) => void
	resultCount: { filtered: number; total: number }
	availableTags: string[]
}

export const ScenarioFilters = ({
	filters,
	onFilterChange,
	resultCount: _resultCount,
	availableTags: _availableTags,
}: ScenarioFiltersProps) => {
	const { t } = useTranslation()
	const [localFilters, setLocalFilters] = useState(filters)
	const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false)

	const handleFilterUpdate = (updates: Partial<FilterState>) => {
		const newFilters = { ...localFilters, ...updates }
		setLocalFilters(newFilters)
		onFilterChange(newFilters)
	}

	const handleResetFilters = () => {
		const defaultFilters: FilterState = {
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
		setLocalFilters(defaultFilters)
		onFilterChange(defaultFilters)
	}

	const getActiveFilters = () => {
		const active: Array<{ key: string; label: string; value: any }> = []

		if (
			localFilters.implementationDifficulty &&
			localFilters.implementationDifficulty !== "all"
		) {
			active.push({
				key: "implementationDifficulty",
				label: `${t("scenario.filters.difficulty_label")}: ${localFilters.implementationDifficulty}`,
				value: localFilters.implementationDifficulty,
			})
		}

		if (localFilters.timeToMarket && localFilters.timeToMarket !== "all") {
			active.push({
				key: "timeToMarket",
				label: `${t("scenario.filters.time_to_market_label")}: ${localFilters.timeToMarket}`,
				value: localFilters.timeToMarket,
			})
		}

		if (localFilters.minPaperCount && localFilters.minPaperCount > 0) {
			active.push({
				key: "minPaperCount",
				label: `${t("scenario.filters.paper_count_label")} ≥ ${localFilters.minPaperCount}`,
				value: localFilters.minPaperCount,
			})
		}

		if (localFilters.maxPaperCount) {
			active.push({
				key: "maxPaperCount",
				label: `${t("scenario.filters.paper_count_label")} ≤ ${localFilters.maxPaperCount}`,
				value: localFilters.maxPaperCount,
			})
		}

		if (localFilters.minPatentCount && localFilters.minPatentCount > 0) {
			active.push({
				key: "minPatentCount",
				label: `${t("scenario.filters.patent_count_label")} ≥ ${localFilters.minPatentCount}`,
				value: localFilters.minPatentCount,
			})
		}

		if (localFilters.maxPatentCount) {
			active.push({
				key: "maxPatentCount",
				label: `${t("scenario.filters.patent_count_label")} ≤ ${localFilters.maxPatentCount}`,
				value: localFilters.maxPatentCount,
			})
		}

		if (
			localFilters.minImplementationCount &&
			localFilters.minImplementationCount > 0
		) {
			active.push({
				key: "minImplementationCount",
				label: `${t("scenario.filters.implementation_count_label")} ≥ ${localFilters.minImplementationCount}`,
				value: localFilters.minImplementationCount,
			})
		}

		if (localFilters.maxImplementationCount) {
			active.push({
				key: "maxImplementationCount",
				label: `${t("scenario.filters.implementation_count_label")} ≤ ${localFilters.maxImplementationCount}`,
				value: localFilters.maxImplementationCount,
			})
		}

		if (
			localFilters.minCompetitiveness &&
			localFilters.minCompetitiveness > 0
		) {
			active.push({
				key: "minCompetitiveness",
				label: `${t("scenario.filters.competitiveness_label")} ≥ ${localFilters.minCompetitiveness}`,
				value: localFilters.minCompetitiveness,
			})
		}

		if (
			localFilters.maxCompetitiveness &&
			localFilters.maxCompetitiveness < 10
		) {
			active.push({
				key: "maxCompetitiveness",
				label: `${t("scenario.filters.competitiveness_label")} ≤ ${localFilters.maxCompetitiveness}`,
				value: localFilters.maxCompetitiveness,
			})
		}

		return active
	}

	const removeFilter = (key: string) => {
		const updates: Partial<FilterState> = {}
		if (key === "implementationDifficulty") {
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

	const activeFilters = getActiveFilters()

	return (
		<div className="space-y-3">
			{/* Filter Controls Row */}
			<div className="flex flex-wrap items-center gap-2">
				{/* TAM Dropdown */}
				<Select
					value={localFilters.tamCategory}
					onValueChange={(value: FilterState["tamCategory"]) =>
						handleFilterUpdate({ tamCategory: value })
					}
				>
					<SelectTrigger className="w-40 h-9 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0">
						<SelectValue placeholder="TAM" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("scenario.filter.all_tam")}</SelectItem>
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

				{/* TRL Dropdown */}
				<Select
					value={localFilters.trlCategory}
					onValueChange={(value: FilterState["trlCategory"]) =>
						handleFilterUpdate({ trlCategory: value })
					}
				>
					<SelectTrigger className="w-32 h-9 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0">
						<SelectValue placeholder="TRL" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("scenario.filter.all_trl")}</SelectItem>
						<SelectItem value="early">
							{t("scenario.filter.trl_early")}
						</SelectItem>
						<SelectItem value="mid">{t("scenario.filter.trl_mid")}</SelectItem>
						<SelectItem value="mature">
							{t("scenario.filter.trl_mature")}
						</SelectItem>
					</SelectContent>
				</Select>

				{/* CAGR Dropdown */}
				<Select
					value={localFilters.cagrCategory || "all"}
					onValueChange={(value) =>
						handleFilterUpdate({
							cagrCategory: value as
								| "all"
								| "low"
								| "medium"
								| "high"
								| "very-high",
						})
					}
				>
					<SelectTrigger className="w-40 h-9 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0">
						<SelectValue placeholder="CAGR" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("scenario.filter.all_cagr")}</SelectItem>
						<SelectItem value="low">{t("scenario.filter.cagr_low")}</SelectItem>
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

				{/* + Filter Button */}
				<Popover
					open={isFilterPopoverOpen}
					onOpenChange={setIsFilterPopoverOpen}
				>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="h-9 border-gray-300 hover:bg-gray-50"
						>
							<Plus className="h-4 w-4 mr-1" />
							{t("scenario.filters.filter_button")}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-96" align="start">
						<div className="space-y-4">
							<h4 className="font-semibold text-sm">
								{t("scenario.filters.additional_filters")}
							</h4>

							{/* Implementation Difficulty */}
							<div className="space-y-2">
								<Label className="text-xs text-gray-600">
									{t("scenario.filters.difficulty_label")}
								</Label>
								<Select
									value={localFilters.implementationDifficulty || "all"}
									onValueChange={(value) =>
										handleFilterUpdate({
											implementationDifficulty: value as any,
										})
									}
								>
									<SelectTrigger className="h-9">
										<SelectValue
											placeholder={t("scenario.filters.select_difficulty")}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{t("scenario.filters.all")}
										</SelectItem>
										<SelectItem value="low">
											{t("scenario.difficulty.low")}
										</SelectItem>
										<SelectItem value="medium">
											{t("scenario.difficulty.medium")}
										</SelectItem>
										<SelectItem value="high">
											{t("scenario.difficulty.high")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Time to Market */}
							<div className="space-y-2">
								<Label className="text-xs text-gray-600">
									{t("scenario.filters.time_to_market_label")}
								</Label>
								<Select
									value={localFilters.timeToMarket || "all"}
									onValueChange={(value) =>
										handleFilterUpdate({ timeToMarket: value as any })
									}
								>
									<SelectTrigger className="h-9">
										<SelectValue
											placeholder={t("scenario.filters.select_period")}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{t("scenario.filters.all")}
										</SelectItem>
										<SelectItem value="short">
											{t("scenario.filters.time_short")}
										</SelectItem>
										<SelectItem value="medium">
											{t("scenario.filters.time_medium")}
										</SelectItem>
										<SelectItem value="long">
											{t("scenario.filters.time_long")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Paper Count Range */}
							<div className="space-y-2">
								<Label className="text-xs text-gray-600">
									{t("scenario.filters.paper_count_label")}
								</Label>
								<div className="flex items-center gap-2">
									<Input
										type="number"
										placeholder={t("scenario.filters.min")}
										value={localFilters.minPaperCount || ""}
										onChange={(e) =>
											handleFilterUpdate({
												minPaperCount: e.target.value
													? Number(e.target.value)
													: 0,
											})
										}
										className="h-9"
										min="0"
									/>
									<span className="text-gray-500">-</span>
									<Input
										type="number"
										placeholder={t("scenario.filters.max")}
										value={localFilters.maxPaperCount || ""}
										onChange={(e) =>
											handleFilterUpdate({
												maxPaperCount: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										className="h-9"
										min="0"
									/>
								</div>
							</div>

							{/* Patent Count Range */}
							<div className="space-y-2">
								<Label className="text-xs text-gray-600">
									{t("scenario.filters.patent_count_label")}
								</Label>
								<div className="flex items-center gap-2">
									<Input
										type="number"
										placeholder={t("scenario.filters.min")}
										value={localFilters.minPatentCount || ""}
										onChange={(e) =>
											handleFilterUpdate({
												minPatentCount: e.target.value
													? Number(e.target.value)
													: 0,
											})
										}
										className="h-9"
										min="0"
									/>
									<span className="text-gray-500">-</span>
									<Input
										type="number"
										placeholder={t("scenario.filters.max")}
										value={localFilters.maxPatentCount || ""}
										onChange={(e) =>
											handleFilterUpdate({
												maxPatentCount: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										className="h-9"
										min="0"
									/>
								</div>
							</div>

							{/* Implementation Count Range */}
							<div className="space-y-2">
								<Label className="text-xs text-gray-600">
									{t("scenario.filters.implementation_count_label")}
								</Label>
								<div className="flex items-center gap-2">
									<Input
										type="number"
										placeholder={t("scenario.filters.min")}
										value={localFilters.minImplementationCount || ""}
										onChange={(e) =>
											handleFilterUpdate({
												minImplementationCount: e.target.value
													? Number(e.target.value)
													: 0,
											})
										}
										className="h-9"
										min="0"
									/>
									<span className="text-gray-500">-</span>
									<Input
										type="number"
										placeholder={t("scenario.filters.max")}
										value={localFilters.maxImplementationCount || ""}
										onChange={(e) =>
											handleFilterUpdate({
												maxImplementationCount: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										className="h-9"
										min="0"
									/>
								</div>
							</div>

							{/* Competitiveness Range */}
							<div className="space-y-2">
								<Label className="text-xs text-gray-600">
									{t("scenario.filters.competitiveness_label")} (1-10)
								</Label>
								<div className="flex items-center gap-2">
									<Input
										type="number"
										placeholder={t("scenario.filters.min")}
										value={localFilters.minCompetitiveness || ""}
										onChange={(e) =>
											handleFilterUpdate({
												minCompetitiveness: e.target.value
													? Number(e.target.value)
													: 0,
											})
										}
										className="h-9"
										min="0"
										max="10"
									/>
									<span className="text-gray-500">-</span>
									<Input
										type="number"
										placeholder={t("scenario.filters.max")}
										value={localFilters.maxCompetitiveness || ""}
										onChange={(e) =>
											handleFilterUpdate({
												maxCompetitiveness: e.target.value
													? Number(e.target.value)
													: 10,
											})
										}
										className="h-9"
										min="0"
										max="10"
									/>
								</div>
							</div>
						</div>
					</PopoverContent>
				</Popover>
			</div>

			{/* Active Filters Display */}
			{activeFilters.length > 0 && (
				<div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
					{activeFilters.map((filter) => (
						<div
							key={filter.key}
							className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-300"
							style={{ fontWeight: 400 }}
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
						className="h-7 text-xs text-gray-600 hover:text-gray-900"
					>
						{t("scenario.filter.reset_filters")}
					</Button>
				</div>
			)}
		</div>
	)
}
