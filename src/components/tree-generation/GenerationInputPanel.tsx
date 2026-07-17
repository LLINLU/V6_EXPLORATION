import { ArrowUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Keyword, TechCharacteristic } from "@/types/axis"

type GenerationMode = "TED" | "SOCIAL_PROBLEM" | "FAST" | "QUERY"

type Props = {
	searchValue: string
	selectedMode: GenerationMode
	isDeepRefinerMode: boolean
	isGenerating: boolean
	showTreeFirst: boolean
	onSearchChange: (value: string) => void
	onSubmit: () => void
	onModeChange: (mode: GenerationMode) => void
	onShowTreeFirstChange: (v: boolean) => void
	// kept for interface compatibility
	isRefinerExpanded: boolean
	onRefinerExpandedChange: (value: boolean) => void
	onKeywordsSelected: (keywords: Keyword[]) => void
	onTechCharacteristicsSelected: (items: TechCharacteristic[]) => void
	onQueryRefined?: (query: string) => void
}

function TogglePill({
	checked,
	onToggle,
	label,
	tooltip,
}: {
	checked: boolean
	onToggle: () => void
	label: string
	tooltip: string
}) {
	return (
		<TooltipProvider delayDuration={200}>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={onToggle}
						className={`inline-flex shrink-0 items-center gap-1.5 rounded-full py-1 px-3 h-[26px] text-xs whitespace-nowrap transition-colors ${
							checked
								? "bg-blue-50 text-blue-700 border border-[#cddeff]"
								: "bg-transparent text-gray-400 border border-gray-200 hover:bg-gray-50 hover:text-gray-600"
						}`}
					>
						{checked && (
							<svg viewBox="0 0 8 6" className="w-2 h-2 shrink-0" fill="none">
								<path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						)}
						{label}
					</button>
				</TooltipTrigger>
				<TooltipContent className="max-w-[260px] p-3">
					<p className="text-sm leading-relaxed whitespace-normal">{tooltip}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

export const GenerationInputPanel = ({
	searchValue,
	selectedMode,
	isDeepRefinerMode,
	isGenerating,
	showTreeFirst,
	onSearchChange,
	onSubmit,
	onModeChange,
	onShowTreeFirstChange,
}: Props) => {
	const { t } = useTranslation()

	const getPlaceholderText = () => {
		if (isDeepRefinerMode) return t("index.placeholder_deep_refiner")
		if (selectedMode === "QUERY") return t("index.placeholder_query")
		if (selectedMode === "FAST") return "解決したい問題を入力すると、ボトルネック分解と解決シナリオを探索します。"
		return t("index.placeholder_ted")
	}

	const isTechMode = selectedMode === "TED" || selectedMode === "QUERY"
	const isQueryReport = selectedMode === "QUERY"

	const panelClass = isDeepRefinerMode ? "rounded-2xl p-[1.3px]" : "p-5 border border-[#ebf0f7] rounded-2xl"

	return (
		<div
			className={panelClass}
			style={
				isDeepRefinerMode
					? { background: "linear-gradient(to right, rgb(172 200 251) 0%, rgb(197 146 246) 100%)" }
					: { backgroundColor: "#fbfbfb" }
			}
		>
			<div className={isDeepRefinerMode ? "rounded-2xl p-4 bg-white" : ""}>
				{/* Input row */}
				<div className="relative">
					<Input
						type="text"
						placeholder={getPlaceholderText()}
						className={`h-14 w-full px-5 pr-14 text-base md:text-lg border-none focus-visible:ring-0 placeholder:text-gray-400 placeholder:text-[0.95rem] transition-all duration-300 ${
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
								? { backgroundImage: "linear-gradient(to right, rgb(51, 130, 236) 0%, rgb(170, 112, 227) 100%)" }
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
							<ArrowUp className={`h-4 w-4 ${isDeepRefinerMode ? "text-white" : "text-gray-600"}`} />
						)}
					</Button>
				</div>

				{/* Optional toggles — only in tech mode */}
				{isTechMode && (
					<div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
						<TogglePill
							checked={isQueryReport}
							onToggle={() => {
								if (isQueryReport) {
									onModeChange("TED")
								} else {
									onShowTreeFirstChange(false)
									onModeChange("QUERY")
								}
							}}
							label="技術の全体像を把握する"
							tooltip="入力したクエリをもとにレポートを作成し、技術の背景・市場・課題を事前に把握できます。シナリオ探索をより深く進めるための任意ステップです。"
						/>
						<TogglePill
							checked={showTreeFirst}
							onToggle={() => {
								if (showTreeFirst) {
									onShowTreeFirstChange(false)
								} else {
									onModeChange("TED")
									onShowTreeFirstChange(true)
								}
							}}
							label="ツリーマップを直接生成する"
							tooltip="入力した技術をマインドマップ形式のツリーで即座に可視化します。構成要素を俯瞰してからシナリオ探索に進めます。"
						/>
					</div>
				)}
			</div>
		</div>
	)
}
