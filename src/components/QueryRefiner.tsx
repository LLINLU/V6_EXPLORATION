/**
 * Query Refiner Component
 * Shows AI summary of research query for better understanding
 * Redesigned with three button groups and dropdown literacy selector
 */

import {
	Check,
	Loader2,
	Minus,
	Plus,
	RefreshCw,
	Settings2,
	Sparkles,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { SourcePoolDetailPanel } from "@/components/source-pool/SourcePoolDetailPanel"
import { SourcePoolOverview } from "@/components/source-pool/SourcePoolOverview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import {
	generateQuerySummary,
	generateTechCharacteristics,
	type QuerySummary,
} from "@/services/multiAxisService"
import { generateSourcePool } from "@/services/sourcePoolService"
import type { Keyword, TechCharacteristic } from "@/types/axis"
import type { QuantitativeData } from "@/types/sourcePool"

interface QueryRefinerProps {
	query: string
	isExpanded: boolean
	onKeywordsSelected?: (keywords: Keyword[]) => void
	onTechCharacteristicsSelected?: (
		characteristics: TechCharacteristic[],
	) => void
	onQueryRefined?: (refinedQuery: string) => void
	initialKeywords?: Keyword[]
	className?: string
}

type LiteracyLevel = "easy" | "standard" | "expert"
type SummaryLength = "short" | "medium" | "long"

export const QueryRefiner: React.FC<QueryRefinerProps> = ({
	query,
	isExpanded,
	onKeywordsSelected: _onKeywordsSelected,
	onTechCharacteristicsSelected,
	onQueryRefined: _onQueryRefined,
	initialKeywords: _initialKeywords,
	className = "",
}) => {
	const { t } = useTranslation()
	const [querySummary, setQuerySummary] = useState<QuerySummary | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selectedLevel, setSelectedLevel] = useState<LiteracyLevel>("standard")
	const [selectedLength, setSelectedLength] = useState<SummaryLength>("medium")
	const [tempLevel, setTempLevel] = useState<LiteracyLevel>("standard")
	const [tempLength, setTempLength] = useState<SummaryLength>("medium")
	const [showSummary, setShowSummary] = useState(false)
	const [techCharacteristics, setTechCharacteristics] = useState<
		TechCharacteristic[]
	>([])
	const [isLoadingTechChars, setIsLoadingTechChars] = useState(false)
	const [showTechChars, setShowTechChars] = useState(false)
	const [techCharLevel, setTechCharLevel] = useState<LiteracyLevel>("standard")
	const [sourcePoolData, setSourcePoolData] = useState<QuantitativeData | null>(
		null,
	)
	const [isLoadingSourcePool, setIsLoadingSourcePool] = useState(false)
	const [showSourcePool, setShowSourcePool] = useState(false)
	const [sourcePoolDetailType, setSourcePoolDetailType] = useState<
		"papers" | "patents" | "implementations" | null
	>(null)

	// Notify parent when selected tech characteristics change
	useEffect(() => {
		if (onTechCharacteristicsSelected) {
			const selected = techCharacteristics.filter(
				(char) => char.selected !== false,
			)
			onTechCharacteristicsSelected(selected)
		}
	}, [techCharacteristics, onTechCharacteristicsSelected])

	const handleGenerateSummary = async (
		level: LiteracyLevel = selectedLevel,
		length: SummaryLength = selectedLength,
		forceRegenerate: boolean = false,
	) => {
		if (!query.trim()) return

		// If already generated and not forcing regenerate, just toggle visibility
		if (querySummary && !forceRegenerate) {
			setShowSummary(!showSummary)
			return
		}

		setIsLoading(true)
		setError(null)
		setSelectedLevel(level)
		setSelectedLength(length)

		try {
			const summary = await generateQuerySummary(query, level)

			// Truncate summary based on selected length
			let truncatedSummary = summary.summary
			const lengthLimits = {
				short: 300,
				medium: 500,
				long: 1000,
			}
			const maxLength = lengthLimits[length]

			if (truncatedSummary.length > maxLength) {
				truncatedSummary = `${truncatedSummary.substring(0, maxLength)}...`
			}

			setQuerySummary({
				tldr: summary.tldr,
				summary: truncatedSummary,
			})
			setShowSummary(true)
		} catch (e) {
			console.error("Failed to generate query summary:", e)
			setError("t('research.queryRefiner.summaryGenerationFailed')")
		} finally {
			setIsLoading(false)
		}
	}

	const getLiteracyLabel = (level: LiteracyLevel) => {
		const labels = {
			easy: t("research.queryRefiner.easy"),
			standard: t("research.queryRefiner.standard"),
			expert: t("research.queryRefiner.expert"),
		}
		return labels[level]
	}

	const handleGenerateTechCharacteristics = async () => {
		if (!query.trim()) return

		// If already generated, just toggle visibility
		if (techCharacteristics.length > 0) {
			setShowTechChars(!showTechChars)
			return
		}

		setIsLoadingTechChars(true)
		setError(null)

		try {
			const chars = await generateTechCharacteristics(query)
			setTechCharacteristics(chars)
			setShowTechChars(true)
		} catch (e) {
			console.error("Failed to generate tech characteristics:", e)
			setError("t('research.queryRefiner.techCharGenerationFailed')")
		} finally {
			setIsLoadingTechChars(false)
		}
	}

	const handleToggleTechChar = (index: number) => {
		setTechCharacteristics((prev) =>
			prev.map((char, i) =>
				i === index ? { ...char, selected: !char.selected } : char,
			),
		)
	}

	const handleGenerateMoreTechChars = async () => {
		if (!query.trim()) return

		setIsLoadingTechChars(true)
		setError(null)

		try {
			const newChars = await generateTechCharacteristics(query)
			// Take only 5 new characteristics and append to existing
			const fiveNewChars = newChars.slice(0, 5)
			setTechCharacteristics((prev) => [...prev, ...fiveNewChars])
		} catch (e) {
			console.error("Failed to generate more tech characteristics:", e)
			setError("t('research.queryRefiner.techCharGenerationFailed')")
		} finally {
			setIsLoadingTechChars(false)
		}
	}

	const selectedCount = techCharacteristics.filter(
		(char) => char.selected,
	).length

	const handleGenerateSourcePool = async () => {
		if (!query.trim()) return

		// If already generated, just toggle visibility
		if (sourcePoolData) {
			setShowSourcePool(!showSourcePool)
			return
		}

		setIsLoadingSourcePool(true)
		setError(null)

		try {
			const data = await generateSourcePool(query)
			setSourcePoolData(data)
			setShowSourcePool(true)
		} catch (e) {
			console.error("Failed to generate source pool:", e)
			setError("t('research.queryRefiner.sourcePoolGenerationFailed')")
		} finally {
			setIsLoadingSourcePool(false)
		}
	}

	const handleSourcePoolSectionClick = (
		type: "papers" | "patents" | "implementations",
	) => {
		setSourcePoolDetailType(type)
	}

	const handleCloseSourcePoolDetail = () => {
		setSourcePoolDetailType(null)
	}

	if (!isExpanded) {
		return null
	}

	return (
		<div className={className}>
			<div className="space-y-4 pt-4 border-t border-gray-200">
				{/* Three Button Groups */}
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="group inline-block">
										<Button
											onClick={() => handleGenerateSummary()}
											disabled={isLoading || !query.trim()}
											className="flex items-center justify-center gap-2 px-[10px] py-1 shadow-none transition-colors disabled:pointer-events-none"
											style={{
												padding: "4px 10px",
												borderRadius: "16px",
												height: "32px",
												...(showSummary && querySummary
													? {
															backgroundColor: "#f7f6ff",
															borderColor: "#ac72c5",
														}
													: {
															backgroundColor: "white",
															borderColor: "#e0cae9",
														}),
												borderWidth: "1px",
												color: "#7e487e",
												opacity: query.trim() ? "100%" : "60%",
											}}
											onMouseEnter={(e) => {
												if (query.trim()) {
													if (showSummary && querySummary) {
														e.currentTarget.style.borderColor = "#7e487e"
														e.currentTarget.style.backgroundColor = "#f2f0ff"
													} else {
														e.currentTarget.style.borderColor = "#7e487e"
														e.currentTarget.style.backgroundColor = "#f2f0ff"
													}
												}
											}}
											onMouseLeave={(e) => {
												if (query.trim()) {
													if (showSummary && querySummary) {
														e.currentTarget.style.borderColor = "#ac72c5"
														e.currentTarget.style.backgroundColor = "#f7f6ff"
													} else {
														e.currentTarget.style.borderColor = "#e0cae9"
														e.currentTarget.style.backgroundColor = "white"
													}
												}
											}}
										>
											{isLoading ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin" />
													{t("research.queryRefiner.generating")}
												</>
											) : (
												<>
													<Sparkles className="h-4 w-4" strokeWidth={1.5} />
													{t("research.queryRefiner.generateSummary")}
												</>
											)}
										</Button>
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-[200px]">
									<p>
										click to see the summary of your query for aligned
										understanding before diving in!
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="inline-block">
										<Button
											onClick={handleGenerateTechCharacteristics}
											disabled={isLoadingTechChars || !query.trim()}
											variant="outline"
											className={`flex items-center justify-center gap-2 px-[10px] py-1 shadow-none transition-colors ${
												showTechChars && techCharacteristics.length > 0
													? "border border-blue-500"
													: "border border-[#CDDFFF]"
											}`}
											style={{
												padding: "4px 10px",
												borderRadius: "16px",
												height: "32px",
												...(showTechChars && techCharacteristics.length > 0
													? { backgroundColor: "#F0F6FF", color: "#133a97" }
													: query.trim()
														? { backgroundColor: "white", color: "#1c52d4" }
														: { backgroundColor: "white" }),
											}}
											onMouseEnter={(e) => {
												if (query.trim()) {
													if (showTechChars && techCharacteristics.length > 0) {
														e.currentTarget.style.borderColor = "#6896ff"
														e.currentTarget.style.backgroundColor = "#dfe7ff"
														e.currentTarget.style.color = "#0f4bdb"
													} else {
														e.currentTarget.style.borderColor = "#6896ff"
														e.currentTarget.style.backgroundColor = "#dfe7ff"
														e.currentTarget.style.color = "#0f4bdb"
													}
												}
											}}
											onMouseLeave={(e) => {
												if (query.trim()) {
													if (showTechChars && techCharacteristics.length > 0) {
														e.currentTarget.style.borderColor = "#3b82f6"
														e.currentTarget.style.backgroundColor = "#F0F6FF"
														e.currentTarget.style.color = "#133a97"
													} else {
														e.currentTarget.style.borderColor = "#CDDFFF"
														e.currentTarget.style.backgroundColor = "white"
														e.currentTarget.style.color = "#1c52d4"
													}
												}
											}}
										>
											{isLoadingTechChars ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin mr-2" />
													{t("research.queryRefiner.generating")}
												</>
											) : (
												t("research.queryRefiner.selectTechChar")
											)}
										</Button>
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-[200px]">
									<p>{t("research.queryRefiner.techCharTooltip")}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className="group inline-block"
										onMouseEnter={(e) => {
											if (query.trim() && !(showSourcePool && sourcePoolData)) {
												const button = e.currentTarget.querySelector("button")
												if (button) {
													button.style.borderColor = "#c5ae7d"
													button.style.backgroundColor = "#fafae8"
												}
											}
										}}
										onMouseLeave={(e) => {
											if (query.trim()) {
												const button = e.currentTarget.querySelector("button")
												if (button) {
													if (showSourcePool && sourcePoolData) {
														// Keep selected state
														button.style.setProperty(
															"border-color",
															"rgb(208 192 159)",
															"important",
														)
														button.style.setProperty(
															"background-color",
															"#fff9f0",
															"important",
														)
														button.style.setProperty(
															"color",
															"rgb(134, 109, 52)",
															"important",
														)
													} else {
														button.style.borderColor = "rgb(220, 209, 186)"
														button.style.backgroundColor = "rgb(255 255 255)"
													}
												}
											}
										}}
									>
										<Button
											variant="outline"
											onClick={handleGenerateSourcePool}
											disabled={isLoadingSourcePool || !query.trim()}
											className="font-normal transition-colors"
											style={{
												borderRadius: "16px",
												height: "32px",
												fontWeight: 400,
												...(showSourcePool && sourcePoolData
													? {
															backgroundColor: "#fff9f0",
															color: "rgb(134, 109, 52)",
															borderColor: "rgb(208 192 159)",
															opacity: 1,
														}
													: query.trim()
														? {
																backgroundColor: "rgb(255 255 255)",
																color: "rgb(134, 109, 52)",
																borderColor: "rgb(220, 209, 186)",
																opacity: 1,
															}
														: {
																backgroundColor: "#fffff7",
																color: "#694d15",
																borderColor: "#dcd1ba",
																opacity: "60%",
															}),
											}}
										>
											{isLoadingSourcePool ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin mr-2" />
													{t("research.queryRefiner.generating")}
												</>
											) : (
												t("research.queryRefiner.checkSourcePool")
											)}
										</Button>
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-[200px]">
									<p>{t("research.queryRefiner.sourcePoolTooltip")}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>

				{/* Source Pool Overview */}
				{showSourcePool && sourcePoolData && (
					<div className="pt-4">
						<div
							className="group relative bg-white rounded-lg p-4"
							style={{
								borderColor: "#bfdbfe",
								borderWidth: "1px",
								borderStyle: "solid",
							}}
						>
							<div className="flex items-center justify-between mb-3">
								<div
									className="text-gray-700"
									style={{ fontSize: "12px", fontWeight: 400 }}
								>
									{t("research.queryRefiner.quantitativeOverview")}
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowSourcePool(false)}
									className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<Minus
										className="h-4 w-4"
										style={{ color: "rgb(108 114 128)" }}
									/>
								</Button>
							</div>
							<SourcePoolOverview
								data={sourcePoolData}
								onSectionClick={handleSourcePoolSectionClick}
							/>
						</div>
					</div>
				)}

				{/* Source Pool Detail Panel */}
				{sourcePoolDetailType && sourcePoolData && (
					<SourcePoolDetailPanel
						isOpen={true}
						type={sourcePoolDetailType}
						data={
							sourcePoolDetailType === "papers"
								? sourcePoolData.papers
								: sourcePoolDetailType === "patents"
									? sourcePoolData.patents
									: sourcePoolData.implementations
						}
						query={query}
						onClose={handleCloseSourcePoolDetail}
					/>
				)}

				{/* Tech Characteristics Pills */}
				{showTechChars && techCharacteristics.length > 0 && (
					<div
						className="group bg-white rounded-lg p-4"
						style={{
							borderColor: "#bfdbfe",
							borderWidth: "1px",
							borderStyle: "solid",
						}}
					>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<div
									className="text-gray-700"
									style={{ fontSize: "12px", fontWeight: 400 }}
								>
									{t("research.queryRefiner.techLabel")} {selectedCount}/
									{techCharacteristics.length} selected
								</div>
								<div className="flex items-center gap-2">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 px-2 text-gray-600 hover:bg-gray-100"
											>
												<Settings2 className="h-3 w-3 mr-1" />
												<span className="text-xs">
													{getLiteracyLabel(techCharLevel)}
												</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-48">
											<DropdownMenuLabel>
												{t("research.queryRefiner.literacyLevel")}
											</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={(e) => {
													e.preventDefault()
													setTechCharLevel("easy")
												}}
												className={techCharLevel === "easy" ? "bg-blue-50" : ""}
											>
												<div className="flex items-center justify-between w-full">
													<span>{t("research.queryRefiner.easy")}</span>
													{techCharLevel === "easy" && (
														<Check className="h-4 w-4 text-blue-600" />
													)}
												</div>
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => {
													e.preventDefault()
													setTechCharLevel("standard")
												}}
												className={
													techCharLevel === "standard" ? "bg-blue-50" : ""
												}
											>
												<div className="flex items-center justify-between w-full">
													<span>{t("research.queryRefiner.standard")}</span>
													{techCharLevel === "standard" && (
														<Check className="h-4 w-4 text-blue-600" />
													)}
												</div>
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => {
													e.preventDefault()
													setTechCharLevel("expert")
												}}
												className={
													techCharLevel === "expert" ? "bg-blue-50" : ""
												}
											>
												<div className="flex items-center justify-between w-full">
													<span>{t("research.queryRefiner.expert")}</span>
													{techCharLevel === "expert" && (
														<Check className="h-4 w-4 text-blue-600" />
													)}
												</div>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowTechChars(false)}
										className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<Minus
											className="h-4 w-4"
											style={{ color: "rgb(108 114 128)" }}
										/>
									</Button>
								</div>
							</div>
							<TooltipProvider>
								<div className="flex flex-wrap gap-2">
									{techCharacteristics.map((char, index) => (
										<Tooltip key={`tech-char-${char.name}-${index}`}>
											<TooltipTrigger asChild>
												<button
													onClick={() => handleToggleTechChar(index)}
													className={`inline-flex items-center gap-2 px-4 rounded-full border transition-all ${
														char.selected
															? "bg-blue-50"
															: "bg-gray-50 border-gray-300 text-gray-500"
													} hover:shadow-sm`}
													style={{
														height: "32px",
														...(char.selected
															? {
																	borderColor: "#5f98ff",
																	color: "#1e54d4",
																}
															: {}),
													}}
												>
													{char.selected && <Check className="h-4 w-4" />}
													<span className="text-sm">{char.name}</span>
												</button>
											</TooltipTrigger>
											<TooltipContent>
												<p className="max-w-xs">{char.description}</p>
											</TooltipContent>
										</Tooltip>
									))}
									<button
										onClick={handleGenerateMoreTechChars}
										disabled={isLoadingTechChars || !query.trim()}
										className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
										style={{ height: "32px", width: "32px", minWidth: "32px" }}
									>
										{isLoadingTechChars ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Plus className="h-4 w-4" />
										)}
									</button>
								</div>
							</TooltipProvider>
						</div>
					</div>
				)}

				{/* Error Message */}
				{error && (
					<Alert variant="destructive" className="border-0 p-0 bg-transparent">
						<AlertDescription className="text-[#FF5E5E]">
							{error}
						</AlertDescription>
					</Alert>
				)}

				{/* Summary Display */}
				{!isLoading && querySummary && showSummary && (
					<div className="group relative">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowSummary(false)}
							className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
						>
							<Minus
								className="h-4 w-4"
								style={{ color: "rgb(108 114 128)" }}
							/>
						</Button>
						<Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
							<CardContent className="pt-6 space-y-4">
								{/* Header with Settings Dropdown */}
								<div className="flex items-center justify-between mb-3">
									<p className="text-xs text-gray-600">
										{t("research.queryRefiner.summaryDescription")}
									</p>
									<div className="flex items-center gap-0 ml-auto">
										<span className="text-xs text-gray-500">
											{getLiteracyLabel(selectedLevel)}
										</span>
										<DropdownMenu
											onOpenChange={(open) => {
												if (open) {
													setTempLevel(selectedLevel)
													setTempLength(selectedLength)
												}
											}}
										>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0 hover:bg-blue-100"
												>
													<Settings2 className="h-4 w-4 text-gray-600" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-56">
												<DropdownMenuLabel>
													{t("research.queryRefiner.literacyLevel")}
												</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={(e) => {
														e.preventDefault()
														setTempLevel("easy")
													}}
													className={tempLevel === "easy" ? "bg-blue-50" : ""}
												>
													<div className="flex items-center justify-between w-full">
														<span>{t("research.queryRefiner.easy")}</span>
														{tempLevel === "easy" && (
															<Check className="h-4 w-4 text-blue-600" />
														)}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={(e) => {
														e.preventDefault()
														setTempLevel("standard")
													}}
													className={
														tempLevel === "standard" ? "bg-blue-50" : ""
													}
												>
													<div className="flex items-center justify-between w-full">
														<span>{t("research.queryRefiner.standard")}</span>
														{tempLevel === "standard" && (
															<Check className="h-4 w-4 text-blue-600" />
														)}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={(e) => {
														e.preventDefault()
														setTempLevel("expert")
													}}
													className={tempLevel === "expert" ? "bg-blue-50" : ""}
												>
													<div className="flex items-center justify-between w-full">
														<span>{t("research.queryRefiner.expert")}</span>
														{tempLevel === "expert" && (
															<Check className="h-4 w-4 text-blue-600" />
														)}
													</div>
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuLabel>
													{t("research.queryRefiner.summaryLength")}
												</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={(e) => {
														e.preventDefault()
														setTempLength("short")
													}}
													className={tempLength === "short" ? "bg-blue-50" : ""}
												>
													<div className="flex items-center justify-between w-full">
														<span>{t("research.queryRefiner.short300")}</span>
														{tempLength === "short" && (
															<Check className="h-4 w-4 text-blue-600" />
														)}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={(e) => {
														e.preventDefault()
														setTempLength("medium")
													}}
													className={
														tempLength === "medium" ? "bg-blue-50" : ""
													}
												>
													<div className="flex items-center justify-between w-full">
														<span>{t("research.queryRefiner.medium500")}</span>
														{tempLength === "medium" && (
															<Check className="h-4 w-4 text-blue-600" />
														)}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={(e) => {
														e.preventDefault()
														setTempLength("long")
													}}
													className={tempLength === "long" ? "bg-blue-50" : ""}
												>
													<div className="flex items-center justify-between w-full">
														<span>{t("research.queryRefiner.long1000")}</span>
														{tempLength === "long" && (
															<Check className="h-4 w-4 text-blue-600" />
														)}
													</div>
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<div className="p-2">
													<Button
														onClick={() =>
															handleGenerateSummary(tempLevel, tempLength, true)
														}
														className="w-full text-white h-8"
														style={{
															backgroundColor: "#3f84ff",
															color: "white",
															borderColor: "#5f98ff",
														}}
													>
														Confirm
													</Button>
												</div>
											</DropdownMenuContent>
										</DropdownMenu>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleGenerateSummary(
													selectedLevel,
													selectedLength,
													true,
												)
											}
											disabled={isLoading}
											className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50"
										>
											{isLoading ? (
												<Loader2
													className="h-4 w-4 animate-spin"
													style={{ color: "rgb(108 114 128)" }}
												/>
											) : (
												<RefreshCw
													className="h-4 w-4"
													style={{ color: "rgb(108 114 128)" }}
												/>
											)}
										</Button>
									</div>
								</div>

								{/* TL;DR - No title, just one-liner with blue border */}
								<div className="border-l-4 border-blue-500 pl-3 py-1">
									<p className="text-sm text-gray-900">{querySummary.tldr}</p>
								</div>

								{/* Detailed Summary */}
								<div>
									<p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
										{querySummary.summary}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	)
}
