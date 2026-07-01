import { Check, ChevronDown, ChevronRight, HelpCircle } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AvailableColumn } from "@/types/ui"
import { UNIFIED_METRICS } from "./AddEnrichmentModal"

export type { AvailableColumn } from "@/types/ui"

interface CustomViewModalProps {
	isOpen: boolean
	onClose: () => void
	availableColumns: AvailableColumn[]
	onCreateView: (name: string, columnKeys: string[]) => void
}

// Add scenario and summary as base columns — labels/descriptions resolved at render time via t()
const BASE_COLUMN_KEYS = [
	{
		key: "name",
		labelKey: "scenario.custom_view.base_col_scenario",
		descriptionKey: "scenario.custom_view.base_col_scenario_desc",
	},
	{
		key: "summary",
		labelKey: "scenario.custom_view.base_col_summary",
		descriptionKey: "scenario.custom_view.base_col_summary_desc",
	},
]

export const CustomViewModal: React.FC<CustomViewModalProps> = ({
	isOpen,
	onClose,
	onCreateView,
}) => {
	const { t } = useTranslation()
	const BASE_COLUMNS = BASE_COLUMN_KEYS.map((c) => ({
		key: c.key,
		label: t(c.labelKey),
		description: t(c.descriptionKey),
	}))
	const [viewName, setViewName] = useState("")
	const [selectedColumns, setSelectedColumns] = useState<string[]>([])
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(["base", ...UNIFIED_METRICS.map((c) => c.id)]),
	)

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

	const handleToggleColumn = (columnKey: string) => {
		setSelectedColumns((prev) =>
			prev.includes(columnKey)
				? prev.filter((key) => key !== columnKey)
				: [...prev, columnKey],
		)
	}

	const handleCreate = () => {
		if (viewName.trim() && selectedColumns.length > 0) {
			onCreateView(viewName.trim(), selectedColumns)
			setViewName("")
			setSelectedColumns([])
			onClose()
		}
	}

	const handleClose = () => {
		setViewName("")
		setSelectedColumns([])
		onClose()
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="text-base">
						{t("scenario.custom_view.title")}
					</DialogTitle>
					<DialogDescription className="text-xs">
						{t("scenario.custom_view.description")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* View Name */}
					<div className="space-y-2">
						<Label htmlFor="view-name" className="text-sm font-medium">
							{t("scenario.custom_view.view_name_label")}
						</Label>
						<Input
							id="view-name"
							placeholder={t("scenario.custom_view.view_name_placeholder")}
							value={viewName}
							onChange={(e) => setViewName(e.target.value)}
							className="w-full"
						/>
					</div>

					{/* Available Metrics */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							{t("scenario.custom_view.select_metrics")}
						</Label>
						<div className="space-y-3 max-h-[350px] overflow-y-auto">
							{/* Base Columns Category */}
							<div className="border rounded-lg">
								<button
									type="button"
									onClick={() => toggleCategory("base")}
									className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
								>
									{expandedCategories.has("base") ? (
										<ChevronDown className="h-4 w-4 text-gray-500" />
									) : (
										<ChevronRight className="h-4 w-4 text-gray-500" />
									)}
									<span className="text-sm font-medium text-gray-700">
										{t("scenario.custom_view.base_items")}
									</span>
									<span className="text-xs text-gray-400 ml-auto">
										{
											selectedColumns.filter((k) =>
												BASE_COLUMNS.some((c) => c.key === k),
											).length
										}
										/{BASE_COLUMNS.length}
										{t("scenario.custom_view.items_suffix")}
									</span>
								</button>

								{expandedCategories.has("base") && (
									<div className="px-3 pb-2 grid grid-cols-2 gap-2">
										{BASE_COLUMNS.map((column) => {
											const isSelected = selectedColumns.includes(column.key)
											return (
												<TooltipProvider key={column.key}>
													<Tooltip>
														<TooltipTrigger asChild>
															<button
																type="button"
																onClick={() => handleToggleColumn(column.key)}
																className={`text-left px-3 py-2 rounded-md border transition-colors ${
																	isSelected
																		? "border-blue-500 bg-blue-50"
																		: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
																}`}
															>
																<div className="flex items-center justify-between gap-1">
																	<span className="text-xs font-medium truncate">
																		{column.label}
																	</span>
																	{isSelected && (
																		<Check className="h-3 w-3 text-blue-600 flex-shrink-0" />
																	)}
																</div>
															</button>
														</TooltipTrigger>
														<TooltipContent>
															<p className="text-xs">{column.description}</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											)
										})}
									</div>
								)}
							</div>

							{/* Unified Metrics Categories */}
							{UNIFIED_METRICS.map((category) => {
								const isExpanded = expandedCategories.has(category.id)
								const selectedCount = category.metrics.filter((m) =>
									selectedColumns.includes(m.key),
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
												{category.label}
											</span>
											<span className="text-xs text-gray-400 ml-auto">
												{selectedCount}/{category.metrics.length}
												{t("scenario.custom_view.items_suffix")}
											</span>
										</button>

										{/* Category Metrics */}
										{isExpanded && (
											<div className="px-3 pb-2 grid grid-cols-2 gap-2">
												{category.metrics.map((metric) => {
													const isSelected = selectedColumns.includes(
														metric.key,
													)
													return (
														<TooltipProvider key={metric.key}>
															<Tooltip>
																<TooltipTrigger asChild>
																	<button
																		type="button"
																		onClick={() =>
																			handleToggleColumn(metric.key)
																		}
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
																			{isSelected && (
																				<Check className="h-3 w-3 text-blue-600 flex-shrink-0" />
																			)}
																		</div>
																	</button>
																</TooltipTrigger>
																<TooltipContent>
																	<p className="text-xs">
																		{metric.description}
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
					</div>
				</div>

				{/* Contact Customer Support */}
				<div className="pt-2">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="text-xs text-gray-600 p-0 h-auto flex items-center gap-1 hover:opacity-80"
									onClick={(e) => {
										e.preventDefault()
										// TODO: Implement contact support functionality
									}}
								>
									<HelpCircle className="h-3.5 w-3.5 text-gray-500" />
									<span>
										{t("scenario.enrichment_modal.contact_prefix")}
										<span className="text-blue-600 hover:text-blue-800">
											{t("scenario.enrichment_modal.contact_link")}
										</span>
										{t("scenario.enrichment_modal.contact_suffix")}
									</span>
								</button>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								<p className="text-xs">
									{t("scenario.enrichment_modal.contact_tooltip")}
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>

				<div className="flex justify-end gap-2 pt-3 border-t">
					<Button variant="outline" size="sm" onClick={handleClose}>
						{t("scenario.enrichment_modal.cancel")}
					</Button>
					<Button
						size="sm"
						onClick={handleCreate}
						disabled={!viewName.trim() || selectedColumns.length === 0}
					>
						{t("scenario.custom_view.create_button")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
