import { ArrowUp, Lightbulb } from "lucide-react"
import { type FormEvent, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { QueryRefiner } from "@/components/QueryRefiner"
import { TechCharacteristicsDialog } from "@/components/TechCharacteristicsTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { generateMockTechStrengths } from "@/data/mockTechStrengths"
import { useTreeGeneration } from "@/hooks/useTreeGeneration"
import { useUserDetail } from "@/hooks/useUserDetail"
import { supabase } from "@/integrations/supabase/client"
import { getOutputLanguage } from "@/lib/outputLanguage"
import type { Keyword, TechCharacteristic, TechStrength } from "@/types/axis"
import type { Scenario } from "@/types/scenario"

interface SuggestionProps {
	label: string
	onClick: () => void
	mode?: string
}

const SearchSuggestion = ({ label, onClick, mode }: SuggestionProps) => {
	const getBackgroundColor = () => {
		return mode === "FAST" ? "bg-[#fdfdfd]" : "bg-[#f6fbff]"
	}

	const getBorderColor = () => {
		return mode === "FAST" ? "border-[#d7c3eb]" : "border-[#c4d4f4]"
	}

	const getHoverColor = () => {
		return mode === "FAST" ? "hover:bg-[#f8f8f8]" : "hover:bg-[#f0f6ff]"
	}

	return (
		<button
			className={`${getBackgroundColor()} ${getHoverColor()} rounded-md px-4 py-1 text-gray-700 transition-colors text-sm border ${getBorderColor()}`}
			onClick={onClick}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				fill={mode === "TED" ? "#9eb6e6" : "#ba99bd"}
				viewBox="0 0 256 256"
				className="inline-block mr-1.5"
			>
				<path d="M100,58H40A14,14,0,0,0,26,72v64a14,14,0,0,0,14,14h62v10a34,34,0,0,1-34,34,6,6,0,0,0,0,12,46.06,46.06,0,0,0,46-46V72A14,14,0,0,0,100,58Zm2,80H40a2,2,0,0,1-2-2V72a2,2,0,0,1,2-2h60a2,2,0,0,1,2,2ZM216,58H156a14,14,0,0,0-14,14v64a14,14,0,0,0,14,14h62v10a34,34,0,0,1-34,34,6,6,0,0,0,0,12,46.06,46.06,0,0,0,46-46V72A14,14,0,0,0,216,58Zm2,80H156a2,2,0,0,1-2-2V72a2,2,0,0,1,2-2h60a2,2,0,0,1,2,2Z"></path>
			</svg>
			{label}
		</button>
	)
}

export const TreeGenerationSection = () => {
	const navigate = useNavigate()
	const [searchValue, setSearchValue] = useState("")
	const [selectedMode, setSelectedMode] = useState<"TED" | "FAST">("TED")
	const [isDeepRefinerMode, setIsDeepRefinerMode] = useState(false)
	const [isRefinerExpanded, setIsRefinerExpanded] = useState(false)
	const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([])
	const [_selectedTechCharacteristics, setSelectedTechCharacteristics] =
		useState<TechCharacteristic[]>([])
	const [showTechTable, setShowTechTable] = useState(false)
	const [techStrengths, setTechStrengths] = useState<TechStrength[]>([])
	const [isLoadingPipeline, setIsLoadingPipeline] = useState(false)
	// Store pipeline results so we can navigate on confirm without re-generating
	const pipelineResultRef = useRef<{
		scenarios?: Scenario[]
		treeId?: string
	} | null>(null)
	const {
		generateScenariosOnly: _generateScenariosOnly,
		generateTree,
		isGenerating,
	} = useTreeGeneration()
	const { userDetails } = useUserDetail()
	const getPlaceholderText = () => {
		if (isDeepRefinerMode) {
			return "DeepRefinerで詳細な研究コンテキストを構築します"
		}
		return selectedMode === "TED"
			? "クエリを入力すると、関連するシナリオと技術コンポーネントが生成されます。"
			: "技術を分解して要素技術を整理する"
	}
	const handleSubmit = async (e?: FormEvent) => {
		if (e) e.preventDefault()
		if (searchValue.trim() && !isGenerating) {
			if (isDeepRefinerMode) {
				// Navigate to research context chat screen
				navigate("/research-context", {
					state: {
						query: searchValue,
						searchMode: selectedMode.toLowerCase(),
					},
				})
			} else if (selectedMode === "FAST") {
				// FAST mode: Generate tree and navigate directly to mindmap
				const results = await generateTree(searchValue, "FAST")

				if (results) {
					navigate(
						`/technology-tree?id=${encodeURIComponent(results.treeId)}`,
						{
							state: {
								query: searchValue,
								searchMode: "fast",
								treeId: results.treeId,
								fromDatabase: true,
								isDemo: false,
								mode: "FAST",
							},
						},
					)
				}
			} else {
				// TED mode: generateScenariosOnly calls generate-tree-v3 which uses pipeline/generate
				// and returns both tech_strengths and scenarios in a single call
				setShowTechTable(true)
				setIsLoadingPipeline(true)
				setTechStrengths([])
				pipelineResultRef.current = null

				try {
					let strengths = []
					try {
						const { data: techData, error: techError } =
							await supabase.functions.invoke("generate-tech-strengths", {
								body: {
									searchTheme: searchValue,
									language: getOutputLanguage(),
									user_id: userDetails?.user_id,
									team_id: userDetails?.team_id,
								},
							})

						if (techError) {
							console.error(
								"generate-technical-strengths edge function error:",
								techError,
							)
						} else if (
							techData?.tech_strengths &&
							techData.tech_strengths.length > 0
						) {
							strengths = techData.tech_strengths
							// If still no strengths available, fall back to mock strengths
							if (!strengths || strengths.length === 0) {
								strengths = generateMockTechStrengths(searchValue)
							}

							setTechStrengths(strengths)
							// Only store treeId here — do not include scenarios so ScenarioSelection
							// will run the `generate-scenarios` edge function on mount (avoids double-run)
							pipelineResultRef.current = {
								treeId: techData.treeId,
							}
						}
					} catch (err) {
						console.error("Failed to call generate-technical-strengths:", err)
					}
				} catch (err) {
					console.error("Pipeline generation failed:", err)
				} finally {
					setIsLoadingPipeline(false)
				}
			}
		}
	}

	const handleTechTableConfirm = async (confirmedStrengths: TechStrength[]) => {
		// Convert TechStrength to TechCharacteristic for downstream compatibility
		const asCharacteristics: TechCharacteristic[] = confirmedStrengths.map(
			(s) => ({
				name: s.strength_name,
				description: s.description,
				selected: true,
			}),
		)
		setSelectedTechCharacteristics(asCharacteristics)

		const pipelineResult = pipelineResultRef.current

		if (pipelineResult?.treeId) {
			navigate("/scenario-selection", {
				state: {
					query: searchValue,
					mode: selectedMode,
					treeId: pipelineResult.treeId,
					scenarios: pipelineResult.scenarios,
					selectedKeywords:
						selectedKeywords.length > 0 ? selectedKeywords : undefined,
					selectedTechCharacteristics:
						asCharacteristics.length > 0 ? asCharacteristics : undefined,
					// Instruct the ScenarioSelection page to re-run scenario generation on mount
					regenerateScenariosOnLoad: false,
				},
			})
		}
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value)
	}
	const handleModeChange = (mode: "TED" | "FAST") => {
		setSelectedMode(mode)
		setIsDeepRefinerMode(false) // Reset DeepRefiner mode when selecting TED/FAST
		setIsRefinerExpanded(false) // Reset Refiner when switching modes
	}

	const handleSuggestionClick = (suggestion: string) => {
		setSearchValue(suggestion)
	}

	// Dynamic suggestions based on selected mode
	const tedSuggestions = [
		"量子コンピューティングの医療応用",
		"空中触覚技術",
		"カーボンニュートラル",
	]

	const fastSuggestions = [
		"空中触覚技術",
		"レーザービーム制御技術",
		"リチウムイオン電池耐熱技術",
	]

	const currentSuggestions =
		selectedMode === "TED" ? tedSuggestions : fastSuggestions

	return (
		<Card className="border-0 shadow-none">
			<CardHeader className="text-center">
				<CardTitle
					className="mb-4"
					style={{
						fontSize: "1.875rem",
						fontWeight: 600,
						background:
							"-webkit-linear-gradient(left, #0049ab 30%, #a855f7 100%)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						backgroundClip: "text",
					}}
				>
					研究情報を俯瞰する
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="w-full mx-auto mb-8">
					<div
						className={`rounded-2xl transition-all duration-300 ${
							isDeepRefinerMode ? "p-[1.3px]" : "p-4 border border-[#ebf0f7]"
						}`}
						style={
							isDeepRefinerMode
								? {
										background:
											"linear-gradient(to right, rgb(172 200 251) 0%, rgb(197 146 246) 100%)",
									}
								: {
										backgroundColor: "#fbfbfb",
									}
						}
					>
						<div
							className={`${isDeepRefinerMode ? "rounded-2xl p-4 bg-white" : ""}`}
						>
							{!isRefinerExpanded ? (
								<>
									<Input
										type="text"
										placeholder={getPlaceholderText()}
										className={`w-full px-4 py-3 text-lg border-none focus-visible:ring-0 placeholder:text-gray-400 truncate transition-all duration-300 ${
											isDeepRefinerMode ? "bg-white" : "bg-gray-50"
										}`}
										value={searchValue}
										onChange={handleSearchChange}
										disabled={isGenerating}
									/>
									<div className="flex mt-2 items-center">
										<div className="flex space-x-2">
											<TooltipProvider delayDuration={200}>
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															onClick={() => handleModeChange("TED")}
															className={`inline-flex items-center rounded-full py-1 px-4 h-[28px] text-sm transition-colors ${
																selectedMode === "TED" && !isDeepRefinerMode
																	? "bg-blue-50 text-blue-700 border border-[#cddeff]"
																	: "bg-[#eeeff0] hover:bg-[#e7eaec] text-[#9f9f9f]"
															}`}
															disabled={isGenerating}
														>
															<Lightbulb
																className={`h-3 w-3 mr-1 ${
																	selectedMode === "TED" && !isDeepRefinerMode
																		? "stroke-[2.5px]"
																		: ""
																}`}
															/>
															技術の応用先を探索
														</button>
													</TooltipTrigger>
													<TooltipContent>
														<p className="max-w-xs">
															社会課題やニーズを起点に、「シナリオ → 目的 → 機能
															→
															手段」のフレームで解決する可能性のある技術テーマを探索します。
														</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											<TooltipProvider delayDuration={200}>
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															onClick={() => handleModeChange("FAST")}
															className={`inline-flex items-center rounded-full py-1 px-4 h-[28px] text-sm transition-colors ${
																selectedMode === "FAST" && !isDeepRefinerMode
																	? "bg-[#fdfbff] text-[#9151ce] border border-[#d9c1ef]"
																	: "bg-[#eeeff0] hover:bg-[#e7eaec] text-[#9f9f9f]"
															}`}
															disabled={isGenerating}
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="12"
																height="12"
																fill={
																	selectedMode === "FAST" && !isDeepRefinerMode
																		? "#9151ce"
																		: "#9f9f9f"
																}
																viewBox="0 0 256 256"
																className="mr-1"
															>
																<path d="M193.83,128a195.73,195.73,0,0,0,19.9-33.65c10.74-23.88,11-42.66.8-52.88s-29-9.94-52.88.8A195.73,195.73,0,0,0,128,62.17a195.73,195.73,0,0,0-33.65-19.9c-23.88-10.74-42.66-11-52.88-.8s-9.94,29,.8,52.88A195.73,195.73,0,0,0,62.17,128a195.73,195.73,0,0,0-19.9,33.65c-10.74,23.88-11,42.66-.8,52.88h0c5,5,12,7.47,20.63,7.47,9.1,0,20-2.76,32.25-8.27A195.73,195.73,0,0,0,128,193.83a195.73,195.73,0,0,0,33.65,19.9C173.9,219.24,184.8,222,193.9,222c8.64,0,15.65-2.49,20.63-7.47h0c10.23-10.22,9.94-29-.8-52.88A195.73,195.73,0,0,0,193.83,128ZM206,50c9.28,9.28,2.36,36.29-19.8,68a306.2,306.2,0,0,0-22.78-25.45A306.2,306.2,0,0,0,138,69.76C169.75,47.61,196.77,40.68,206,50Zm-27.19,78A289.17,289.17,0,0,1,155,155a289.17,289.17,0,0,1-27,23.88A289.17,289.17,0,0,1,101,155a290.62,290.62,0,0,1-23.88-27A297.06,297.06,0,0,1,128,77.14,290.74,290.74,0,0,1,155,101,289.17,289.17,0,0,1,178.85,128ZM50,50c2.68-2.69,6.84-4,12.17-4,13.11,0,33.3,8,55.87,23.81A302.94,302.94,0,0,0,92.54,92.54,306.2,306.2,0,0,0,69.76,118C47.6,86.25,40.68,59.24,50,50ZM50,206h0c-9.28-9.28-2.35-36.29,19.8-68a306.2,306.2,0,0,0,22.78,25.45A306.2,306.2,0,0,0,118,186.24C86.25,208.4,59.24,215.32,50,206ZM206,206c-9.28,9.28-36.29,2.35-68-19.81a304.26,304.26,0,0,0,25.45-22.77A306.2,306.2,0,0,0,186.24,138C208.4,169.75,215.32,196.76,206,206Zm-68-78a10,10,0,1,1-10-10A10,10,0,0,1,138,128Z"></path>
															</svg>
															技術を深ぼる
														</button>
													</TooltipTrigger>
													<TooltipContent>
														<p className="max-w-xs">
															注目技術を軸に、「How1 → How2 → How3
															…」と段階的に技術要素を深掘り。実装に必要な要素技術やアプローチを体系的に整理します。
														</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											{selectedMode === "FAST" && (
												<>
													<div className="mx-2 h-6 w-px bg-gray-300"></div>

													<TooltipProvider delayDuration={200}>
														<Tooltip>
															<TooltipTrigger asChild>
																<div className="flex items-center space-x-2">
																	<Switch
																		id="refine-query-toggle"
																		checked={isRefinerExpanded}
																		onCheckedChange={setIsRefinerExpanded}
																		disabled={isGenerating}
																	/>
																	<Label
																		htmlFor="refine-query-toggle"
																		className="text-sm text-gray-600 cursor-pointer"
																	>
																		Query Helper
																	</Label>
																</div>
															</TooltipTrigger>
															<TooltipContent>
																<p className="max-w-xs">
																	Generates a personalized summary of your query
																	and relevant technical characteristics to help
																	you understand it more comprehensively. Toggle
																	on/off as needed.
																</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</>
											)}
										</div>
										<div className="ml-auto">
											<TooltipProvider delayDuration={200}>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															onClick={handleSubmit}
															size="icon"
															className={`h-8 w-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
																isDeepRefinerMode
																	? ""
																	: "bg-gray-100 hover:bg-gray-200"
															}`}
															style={
																isDeepRefinerMode
																	? {
																			backgroundImage:
																				"linear-gradient(to right, rgb(51, 130, 236) 0%, rgb(170, 112, 227) 100%)",
																		}
																	: undefined
															}
															disabled={!searchValue.trim() || isGenerating}
														>
															{isGenerating ? (
																<div
																	className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${
																		isDeepRefinerMode
																			? "border-white"
																			: "border-gray-600"
																	}`}
																/>
															) : isDeepRefinerMode ? (
																<ArrowUp className="h-4 w-4 text-white" />
															) : (
																<ArrowUp className="h-4 w-4 text-gray-600" />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>研究シナリオを生成</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
									</div>
									{selectedMode === "FAST" && (
										<QueryRefiner
											query={searchValue}
											isExpanded={isRefinerExpanded}
											onKeywordsSelected={setSelectedKeywords}
											onTechCharacteristicsSelected={
												setSelectedTechCharacteristics
											}
											className="mt-4"
										/>
									)}
								</>
							) : (
								<>
									<Input
										type="text"
										placeholder={getPlaceholderText()}
										className={`w-full px-4 py-3 text-lg border-none focus-visible:ring-0 placeholder:text-gray-400 truncate transition-all duration-300 mt-0 ${
											isDeepRefinerMode ? "bg-white" : "bg-gray-50"
										}`}
										value={searchValue}
										onChange={handleSearchChange}
										disabled={isGenerating}
									/>
									{selectedMode === "FAST" && (
										<QueryRefiner
											query={searchValue}
											isExpanded={isRefinerExpanded}
											onKeywordsSelected={setSelectedKeywords}
											onTechCharacteristicsSelected={
												setSelectedTechCharacteristics
											}
											onQueryRefined={setSearchValue}
											className="mt-4"
										/>
									)}
									<div className="flex mt-8 items-center">
										<div className="flex space-x-2">
											<TooltipProvider delayDuration={200}>
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															onClick={() => handleModeChange("TED")}
															className={`inline-flex items-center rounded-full py-1 px-4 h-[28px] text-sm transition-colors ${
																selectedMode === "TED" && !isDeepRefinerMode
																	? "bg-blue-50 text-blue-700 border border-[#cddeff]"
																	: "bg-[#eeeff0] hover:bg-[#e7eaec] text-[#9f9f9f]"
															}`}
															disabled={isGenerating}
														>
															<Lightbulb
																className={`h-3 w-3 mr-1 ${
																	selectedMode === "TED" && !isDeepRefinerMode
																		? "stroke-[2.5px]"
																		: ""
																}`}
															/>
															技術の応用先を探索
														</button>
													</TooltipTrigger>
													<TooltipContent>
														<p className="max-w-xs">
															社会課題やニーズを起点に、「シナリオ → 目的 → 機能
															→
															手段」のフレームで解決する可能性のある技術テーマを探索します。
														</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											<TooltipProvider delayDuration={200}>
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															onClick={() => handleModeChange("FAST")}
															className={`inline-flex items-center rounded-full py-1 px-4 h-[28px] text-sm transition-colors ${
																selectedMode === "FAST" && !isDeepRefinerMode
																	? "bg-[#fdfbff] text-[#9151ce] border border-[#d9c1ef]"
																	: "bg-[#eeeff0] hover:bg-[#e7eaec] text-[#9f9f9f]"
															}`}
															disabled={isGenerating}
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="12"
																height="12"
																fill={
																	selectedMode === "FAST" && !isDeepRefinerMode
																		? "#9151ce"
																		: "#9f9f9f"
																}
																viewBox="0 0 256 256"
																className="mr-1"
															>
																<path d="M193.83,128a195.73,195.73,0,0,0,19.9-33.65c10.74-23.88,11-42.66.8-52.88s-29-9.94-52.88.8A195.73,195.73,0,0,0,128,62.17a195.73,195.73,0,0,0-33.65-19.9c-23.88-10.74-42.66-11-52.88-.8s-9.94,29,.8,52.88A195.73,195.73,0,0,0,62.17,128a195.73,195.73,0,0,0-19.9,33.65c-10.74,23.88-11,42.66-.8,52.88h0c5,5,12,7.47,20.63,7.47,9.1,0,20-2.76,32.25-8.27A195.73,195.73,0,0,0,128,193.83a195.73,195.73,0,0,0,33.65,19.9C173.9,219.24,184.8,222,193.9,222c8.64,0,15.65-2.49,20.63-7.47h0c10.23-10.22,9.94-29-.8-52.88A195.73,195.73,0,0,0,193.83,128ZM206,50c9.28,9.28,2.36,36.29-19.8,68a306.2,306.2,0,0,0-22.78-25.45A306.2,306.2,0,0,0,138,69.76C169.75,47.61,196.77,40.68,206,50Zm-27.19,78A289.17,289.17,0,0,1,155,155a289.17,289.17,0,0,1-27,23.88A289.17,289.17,0,0,1,101,155a290.62,290.62,0,0,1-23.88-27A297.06,297.06,0,0,1,128,77.14,290.74,290.74,0,0,1,155,101,289.17,289.17,0,0,1,178.85,128ZM50,50c2.68-2.69,6.84-4,12.17-4,13.11,0,33.3,8,55.87,23.81A302.94,302.94,0,0,0,92.54,92.54,306.2,306.2,0,0,0,69.76,118C47.6,86.25,40.68,59.24,50,50ZM50,206h0c-9.28-9.28-2.35-36.29,19.8-68a306.2,306.2,0,0,0,22.78,25.45A306.2,306.2,0,0,0,118,186.24C86.25,208.4,59.24,215.32,50,206ZM206,206c-9.28,9.28-36.29,2.35-68-19.81a304.26,304.26,0,0,0,25.45-22.77A306.2,306.2,0,0,0,186.24,138C208.4,169.75,215.32,196.76,206,206Zm-68-78a10,10,0,1,1-10-10A10,10,0,0,1,138,128Z"></path>
															</svg>
															技術を深ぼる
														</button>
													</TooltipTrigger>
													<TooltipContent>
														<p className="max-w-xs">
															注目技術を軸に、「How1 → How2 → How3
															…」と段階的に技術要素を深掘り。実装に必要な要素技術やアプローチを体系的に整理します。
														</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											{selectedMode === "FAST" && (
												<>
													<div className="mx-2 h-6 w-px bg-gray-300"></div>

													<TooltipProvider delayDuration={200}>
														<Tooltip>
															<TooltipTrigger asChild>
																<div className="flex items-center space-x-2">
																	<Switch
																		id="refine-query-toggle-expanded"
																		checked={isRefinerExpanded}
																		onCheckedChange={setIsRefinerExpanded}
																		disabled={isGenerating}
																	/>
																	<Label
																		htmlFor="refine-query-toggle-expanded"
																		className="text-sm text-gray-600 cursor-pointer"
																	>
																		Query Helper
																	</Label>
																</div>
															</TooltipTrigger>
															<TooltipContent>
																<p className="max-w-xs">
																	Generates a personalized summary of your query
																	and relevant technical characteristics to help
																	you understand it more comprehensively. Toggle
																	on/off as needed.
																</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</>
											)}
										</div>
										<div className="ml-auto">
											<TooltipProvider delayDuration={200}>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															onClick={handleSubmit}
															size="icon"
															className={`h-8 w-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
																isDeepRefinerMode
																	? ""
																	: "bg-gray-100 hover:bg-gray-200"
															}`}
															style={
																isDeepRefinerMode
																	? {
																			backgroundImage:
																				"linear-gradient(to right, rgb(51, 130, 236) 0%, rgb(170, 112, 227) 100%)",
																		}
																	: undefined
															}
															disabled={!searchValue.trim() || isGenerating}
														>
															{isGenerating ? (
																<div
																	className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${
																		isDeepRefinerMode
																			? "border-white"
																			: "border-gray-600"
																	}`}
																/>
															) : isDeepRefinerMode ? (
																<ArrowUp className="h-4 w-4 text-white" />
															) : (
																<ArrowUp className="h-4 w-4 text-gray-600" />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>研究シナリオを生成</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
									</div>
								</>
							)}
						</div>
					</div>
				</div>

				<div className="flex flex-col">
					<div className="flex items-center gap-1 mb-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="13"
							height="13"
							viewBox="0 0 13 13"
							fill="none"
						>
							<g clipPath="url(#clip0_219_5)">
								<path
									d="M10.5625 7.3125C10.5635 7.47814 10.5132 7.64003 10.4184 7.77589C10.3237 7.91175 10.1891 8.01491 10.0333 8.07117L7.41405 9.03906L6.44921 11.6604C6.39207 11.8156 6.2887 11.9496 6.15303 12.0442C6.01737 12.1388 5.85594 12.1896 5.69054 12.1896C5.52513 12.1896 5.36371 12.1388 5.22804 12.0442C5.09238 11.9496 4.989 11.8156 4.93186 11.6604L3.96093 9.03906L1.3396 8.07422C1.18438 8.01708 1.05041 7.91371 0.955787 7.77804C0.861161 7.64238 0.810425 7.48095 0.810425 7.31555C0.810425 7.15014 0.861161 6.98872 0.955787 6.85305C1.05041 6.71739 1.18438 6.61401 1.3396 6.55687L3.96093 5.58594L4.92577 2.96461C4.98291 2.80939 5.08628 2.67542 5.22195 2.5808C5.35761 2.48617 5.51904 2.43544 5.68444 2.43544C5.84985 2.43544 6.01127 2.48617 6.14694 2.5808C6.2826 2.67542 6.38598 2.80939 6.44311 2.96461L7.41405 5.58594L10.0354 6.55078C10.1913 6.60755 10.3257 6.71132 10.4201 6.84776C10.5146 6.9842 10.5643 7.14659 10.5625 7.3125ZM7.71874 2.4375H8.53124V3.25C8.53124 3.35774 8.57404 3.46108 8.65023 3.53726C8.72641 3.61345 8.82974 3.65625 8.93749 3.65625C9.04523 3.65625 9.14856 3.61345 9.22475 3.53726C9.30094 3.46108 9.34374 3.35774 9.34374 3.25V2.4375H10.1562C10.264 2.4375 10.3673 2.3947 10.4435 2.31851C10.5197 2.24233 10.5625 2.13899 10.5625 2.03125C10.5625 1.92351 10.5197 1.82017 10.4435 1.74399C10.3673 1.6678 10.264 1.625 10.1562 1.625H9.34374V0.8125C9.34374 0.704756 9.30094 0.601424 9.22475 0.525238C9.14856 0.449051 9.04523 0.40625 8.93749 0.40625C8.82974 0.40625 8.72641 0.449051 8.65023 0.525238C8.57404 0.601424 8.53124 0.704756 8.53124 0.8125V1.625H7.71874C7.61099 1.625 7.50766 1.6678 7.43148 1.74399C7.35529 1.82017 7.31249 1.92351 7.31249 2.03125C7.31249 2.13899 7.35529 2.24233 7.43148 2.31851C7.50766 2.3947 7.61099 2.4375 7.71874 2.4375ZM12.1875 4.0625H11.7812V3.65625C11.7812 3.54851 11.7384 3.44517 11.6623 3.36899C11.5861 3.2928 11.4827 3.25 11.375 3.25C11.2672 3.25 11.1639 3.2928 11.0877 3.36899C11.0115 3.44517 10.9687 3.54851 10.9687 3.65625V4.0625H10.5625C10.4547 4.0625 10.3514 4.1053 10.2752 4.18149C10.199 4.25767 10.1562 4.36101 10.1562 4.46875C10.1562 4.57649 10.199 4.67983 10.2752 4.75601C10.3514 4.8322 10.4547 4.875 10.5625 4.875H10.9687V5.28125C10.9687 5.38899 11.0115 5.49233 11.0877 5.56851C11.1639 5.6447 11.2672 5.6875 11.375 5.6875C11.4827 5.6875 11.5861 5.6447 11.6623 5.56851C11.7384 5.49233 11.7812 5.38899 11.7812 5.28125V4.875H12.1875C12.2952 4.875 12.3986 4.8322 12.4748 4.75601C12.5509 4.67983 12.5937 4.57649 12.5937 4.46875C12.5937 4.36101 12.5509 4.25767 12.4748 4.18149C12.3986 4.1053 12.2952 4.0625 12.1875 4.0625Z"
									fill="#9CA8D5"
								/>
							</g>
							<defs>
								<clipPath id="clip0_219_5">
									<rect width="13" height="13" fill="white" />
								</clipPath>
							</defs>
						</svg>
						<span className="text-gray-600 text-sm">試してみる：</span>
					</div>
					<div className="flex gap-2 flex-wrap">
						{currentSuggestions.map((suggestion) => (
							<SearchSuggestion
								key={suggestion}
								label={suggestion}
								onClick={() => handleSuggestionClick(suggestion)}
								mode={selectedMode}
							/>
						))}
					</div>
				</div>
			</CardContent>

			<TechCharacteristicsDialog
				open={showTechTable}
				onOpenChange={setShowTechTable}
				onConfirm={handleTechTableConfirm}
				query={searchValue}
				loading={isLoadingPipeline}
				techStrengths={techStrengths}
				isLoadingTechStrengths={isLoadingPipeline && techStrengths.length === 0}
				onAddTechStrength={(ts) => setTechStrengths((prev) => [...prev, ts])}
				onRemoveTechStrength={(index) =>
					setTechStrengths((prev) => prev.filter((_, i) => i !== index))
				}
			/>
		</Card>
	)
}
