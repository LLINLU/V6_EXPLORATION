import { AlignLeft, Lightbulb } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

type Props = {
	selectedMode: "TED" | "SOCIAL_PROBLEM" | "FAST" | "QUERY"
	isDeepRefinerMode: boolean
	isRefinerExpanded: boolean
	isGenerating: boolean
	onModeChange: (mode: "TED" | "SOCIAL_PROBLEM" | "FAST" | "QUERY") => void
	onRefinerExpandedChange: (value: boolean) => void
	switchId: string
}

export const GenerationModeSelector = ({
	selectedMode,
	isDeepRefinerMode,
	isRefinerExpanded,
	isGenerating,
	onModeChange,
	onRefinerExpandedChange,
	switchId,
}: Props) => {
	const { t } = useTranslation()
	return (
		<div className="flex min-w-0 flex-1 max-w-full space-x-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
			<TooltipProvider delayDuration={200}>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => onModeChange("QUERY")}
							className={`inline-flex shrink-0 items-center rounded-full py-1 px-4 h-[28px] text-sm whitespace-nowrap transition-colors ${
								selectedMode === "QUERY" && !isDeepRefinerMode
									? "bg-[#f4fff7] text-emerald-700 border border-[#c0ece0]"
									: "bg-[#eeeff0] hover:bg-[#e7eaec] text-[#9f9f9f]"
							}`}
							disabled={isGenerating}
						>
							<AlignLeft
								className={`h-3 w-3 mr-1 ${
									selectedMode === "QUERY" && !isDeepRefinerMode
										? "stroke-[2.5px]"
										: ""
								}`}
							/>
							{t("index.mode_query_label")}
						</button>
					</TooltipTrigger>
					<TooltipContent className="max-w-[min(420px,calc(100vw-32px))] p-3">
						<p className="text-sm leading-relaxed whitespace-normal">
							{t("index.mode_query_tooltip")}
						</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<TooltipProvider delayDuration={200}>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => onModeChange("TED")}
							className={`inline-flex shrink-0 items-center rounded-full py-1 px-4 h-[28px] text-sm whitespace-nowrap transition-colors ${
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
							{t("index.mode_ted_label")}
						</button>
					</TooltipTrigger>
					<TooltipContent className="max-w-[min(420px,calc(100vw-32px))] p-3">
						<p className="text-sm leading-relaxed whitespace-normal">
							{t("index.mode_ted_tooltip")}
						</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<TooltipProvider delayDuration={200}>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => onModeChange("FAST")}
							className={`inline-flex shrink-0 items-center rounded-full py-1 px-4 h-[28px] text-sm whitespace-nowrap transition-colors ${
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
							{t("index.mode_fast_label")}
						</button>
					</TooltipTrigger>
					<TooltipContent className="max-w-[min(420px,calc(100vw-32px))] p-3">
						<p className="text-sm leading-relaxed whitespace-normal">
							{t("index.mode_fast_tooltip")}
						</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			{/* Query Helper toggle - commented out
			{selectedMode === "FAST" && (
				<>
					<div className="mx-2 h-6 w-px bg-gray-300"></div>

					<TooltipProvider delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center space-x-2">
									<Switch
										id={switchId}
										checked={isRefinerExpanded}
										onCheckedChange={onRefinerExpandedChange}
										disabled={isGenerating}
									/>
									<Label
										htmlFor={switchId}
										className="text-sm text-gray-600 cursor-pointer"
									>
										Query Helper
									</Label>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p className="max-w-xs">
									Generates a personalized summary of your query and relevant
									technical characteristics to help you understand it more
									comprehensively.
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</>
			)}
			*/}
		</div>
	)
}
