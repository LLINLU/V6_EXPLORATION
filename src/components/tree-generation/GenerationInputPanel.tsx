import { AlignLeft, ArrowUp, Lightbulb } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Keyword, TechCharacteristic } from "@/types/axis"

// Matches the decompose/atom icon used for FAST mode in QueryReportHeader's
// ModeIcon, so the same mode always reads with the same icon app-wide.
function DecomposeIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 256 256"
			className={className}
			fill="currentColor"
			aria-hidden
		>
			<path d="M193.83,128a195.73,195.73,0,0,0,19.9-33.65c10.74-23.88,11-42.66.8-52.88s-29-9.94-52.88.8A195.73,195.73,0,0,0,128,62.17a195.73,195.73,0,0,0-33.65-19.9c-23.88-10.74-42.66-11-52.88-.8s-9.94,29,.8,52.88A195.73,195.73,0,0,0,62.17,128a195.73,195.73,0,0,0-19.9,33.65c-10.74,23.88-11,42.66-.8,52.88h0c5,5,12,7.47,20.63,7.47,9.1,0,20-2.76,32.25-8.27A195.73,195.73,0,0,0,128,193.83a195.73,195.73,0,0,0,33.65,19.9C173.9,219.24,184.8,222,193.9,222c8.64,0,15.65-2.49,20.63-7.47h0c10.23-10.22,9.94-29-.8-52.88A195.73,195.73,0,0,0,193.83,128ZM206,50c9.28,9.28,2.36,36.29-19.8,68a306.2,306.2,0,0,0-22.78-25.45A306.2,306.2,0,0,0,138,69.76C169.75,47.61,196.77,40.68,206,50Zm-27.19,78A289.17,289.17,0,0,1,155,155a289.17,289.17,0,0,1-27,23.88A289.17,289.17,0,0,1,101,155a290.62,290.62,0,0,1-23.88-27A297.06,297.06,0,0,1,128,77.14,290.74,290.74,0,0,1,155,101,289.17,289.17,0,0,1,178.85,128ZM50,50c2.68-2.69,6.84-4,12.17-4,13.11,0,33.3,8,55.87,23.81A302.94,302.94,0,0,0,92.54,92.54,306.2,306.2,0,0,0,69.76,118C47.6,86.25,40.68,59.24,50,50ZM50,206h0c-9.28-9.28-2.35-36.29,19.8-68a306.2,306.2,0,0,0,22.78,25.45A306.2,306.2,0,0,0,118,186.24C86.25,208.4,59.24,215.32,50,206ZM206,206c-9.28,9.28-36.29,2.35-68-19.81a304.26,304.26,0,0,0,25.45-22.77A306.2,306.2,0,0,0,186.24,138C208.4,169.75,215.32,196.76,206,206Zm-68-78a10,10,0,1,1-10-10A10,10,0,0,1,138,128Z" />
		</svg>
	)
}

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

type PillColor = "green" | "blue" | "purple"

const PILL_ACTIVE_STYLES: Record<PillColor, string> = {
	green: "bg-[#f4fff7] text-emerald-700 border border-[#c0ece0]",
	blue: "bg-blue-50 text-blue-700 border border-[#cddeff]",
	purple: "bg-[#fdfbff] text-[#9151ce] border border-[#d9c1ef]",
}

function TogglePill({
	checked,
	onToggle,
	label,
	tooltip,
	icon,
	color,
}: {
	checked: boolean
	onToggle: () => void
	label: string
	tooltip: string
	icon: ReactNode
	color: PillColor
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
								? PILL_ACTIVE_STYLES[color]
								: "bg-transparent text-gray-400 border border-gray-200 hover:bg-gray-50 hover:text-gray-600"
						}`}
					>
						{icon}
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
	const isTedExplore = selectedMode === "TED" && !showTreeFirst

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
							icon={<AlignLeft className="h-3 w-3 shrink-0" />}
							color="green"
						/>
						<TogglePill
							checked={isTedExplore}
							onToggle={() => {
								onShowTreeFirstChange(false)
								onModeChange("TED")
							}}
							label="技術の応用先を探索する"
							tooltip="入力した技術が解決しうる社会・産業・ビジネス課題を探索します。新技術と満たされていないニーズ・市場動向・現実の課題を結びつけて機会を見出します。"
							icon={<Lightbulb className="h-3 w-3 shrink-0" />}
							color="blue"
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
							label="技術の構成要素を分解する"
							tooltip="入力した技術をマインドマップ形式のツリーで即座に可視化します。構成要素を俯瞰してからシナリオ探索に進めます。"
							icon={<DecomposeIcon className="h-3 w-3 shrink-0" />}
							color="purple"
						/>
					</div>
				)}
			</div>
		</div>
	)
}
