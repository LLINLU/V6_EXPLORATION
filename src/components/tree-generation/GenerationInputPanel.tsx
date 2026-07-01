import { ArrowUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Keyword, TechCharacteristic } from "@/types/axis"
import { GenerationModeSelector } from "./GenerationModeSelector"

type Props = {
	searchValue: string
	selectedMode: "TED" | "SOCIAL_PROBLEM" | "FAST" | "QUERY"
	isDeepRefinerMode: boolean
	isRefinerExpanded: boolean
	isGenerating: boolean
	onSearchChange: (value: string) => void
	onSubmit: () => void
	onModeChange: (mode: "TED" | "SOCIAL_PROBLEM" | "FAST" | "QUERY") => void
	onRefinerExpandedChange: (value: boolean) => void
	onKeywordsSelected: (keywords: Keyword[]) => void
	onTechCharacteristicsSelected: (items: TechCharacteristic[]) => void
	onQueryRefined?: (query: string) => void
}

export const GenerationInputPanel = ({
	searchValue,
	selectedMode,
	isDeepRefinerMode,
	isRefinerExpanded,
	isGenerating,
	onSearchChange,
	onSubmit,
	onModeChange,
	onRefinerExpandedChange,
	onKeywordsSelected,
	onTechCharacteristicsSelected,
	onQueryRefined,
}: Props) => {
	const { t } = useTranslation()
	const getPlaceholderText = () => {
		if (isDeepRefinerMode) {
			return t("index.placeholder_deep_refiner")
		}
		if (selectedMode === "QUERY") return t("index.placeholder_query")
		return selectedMode === "TED" || selectedMode === "SOCIAL_PROBLEM"
			? t("index.placeholder_ted")
			: t("index.placeholder_fast")
	}

	const panelClass = isDeepRefinerMode
		? "rounded-2xl p-[1.3px]"
		: "p-5 border border-[#ebf0f7] rounded-2xl"

	return (
		<div
			className={panelClass}
			style={
				isDeepRefinerMode
					? {
							background:
								"linear-gradient(to right, rgb(172 200 251) 0%, rgb(197 146 246) 100%)",
						}
					: { backgroundColor: "#fbfbfb" }
			}
		>
			<div className={isDeepRefinerMode ? "rounded-2xl p-4 bg-white" : ""}>
				<div className="relative">
					<Input
						type="text"
						placeholder={getPlaceholderText()}
						className={`h-14 w-full px-5 pr-14 text-base md:text-lg border-none focus-visible:ring-0 placeholder:text-gray-400 transition-all duration-300 ${
							isDeepRefinerMode ? "bg-white" : "bg-gray-50"
						}`}
						value={searchValue}
						onChange={(e) => onSearchChange(e.target.value)}
						disabled={isGenerating}
					/>
					<Button
						onClick={onSubmit}
						size="icon"
						className={`absolute bottom-3 right-3 h-8 w-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
							isDeepRefinerMode ? "" : "bg-gray-100 hover:bg-gray-200"
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
									isDeepRefinerMode ? "border-white" : "border-gray-600"
								}`}
							/>
						) : (
							<ArrowUp
								className={`h-4 w-4 ${
									isDeepRefinerMode ? "text-white" : "text-gray-600"
								}`}
							/>
						)}
					</Button>
				</div>

				{/* Query Helper / QueryRefiner - commented out
				{selectedMode === "FAST" && isRefinerExpanded && (
					<QueryRefiner
						query={searchValue}
						isExpanded={isRefinerExpanded}
						onKeywordsSelected={onKeywordsSelected}
						onTechCharacteristicsSelected={onTechCharacteristicsSelected}
						onQueryRefined={onQueryRefined}
						className="mt-4"
					/>
				)}
				*/}

				<div className="flex mt-4 min-w-0 items-center overflow-hidden">
					<GenerationModeSelector
						selectedMode={selectedMode}
						isDeepRefinerMode={isDeepRefinerMode}
						isRefinerExpanded={isRefinerExpanded}
						isGenerating={isGenerating}
						onModeChange={onModeChange}
						onRefinerExpandedChange={onRefinerExpandedChange}
						switchId="query-helper-toggle" /* Query Helper toggle passed but hidden in GenerationModeSelector */
					/>
				</div>
			</div>
		</div>
	)
}
