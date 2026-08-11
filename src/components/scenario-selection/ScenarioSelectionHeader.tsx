import { AlignLeft, ChevronDown, Lightbulb } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { TechCharacteristicsDialog } from "@/components/TechCharacteristicsTable"
import { QueryDisplay } from "@/components/technology-tree/QueryDisplay"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { formatDayLabel } from "@/lib/relativeDate"
import {
	findExistingTrees,
	type TreeVersion,
} from "@/services/treeGenerationService"
import type { Keyword, TechStrength } from "@/types/axis"

type TechnicalStrength = {
	id: string
	tree_id: string
	name?: string | null
	strength_name?: string | null
	description?: string | null
	potential_applications?: string | null
	[key: string]: any
}

type HeaderMode = "TED" | "FAST" | "QUERY"

type Props = {
	query: string
	mode: "TED" | "FAST" | undefined | null
	treeId?: string
	keywords?: Keyword[]
	technicalStrengths?: TechnicalStrength[]
}

// Matches the decompose/atom icon used for FAST mode elsewhere (QueryReportHeader,
// GenerationInputPanel) so the same mode always reads with the same icon app-wide.
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

export function ScenarioSelectionHeader({
	query,
	mode,
	treeId,
	keywords = [],
	technicalStrengths = [],
}: Props) {
	const { t } = useTranslation()
	const { toast } = useToast()
	const navigate = useNavigate()
	const [showTechDialog, setShowTechDialog] = useState(false)
	const [currentMode, setCurrentMode] = useState<HeaderMode>(mode ?? "TED")
	const [existingTreeMatches, setExistingTreeMatches] = useState<TreeVersion[]>(
		[],
	)
	const [showExistingTreeChoice, setShowExistingTreeChoice] = useState(false)
	const [existingTreeFallback, setExistingTreeFallback] = useState<
		(() => void) | null
	>(null)

	const labels: Record<HeaderMode, string> = {
		QUERY: t("index.mode_query_label", "技術の全体像を把握する"),
		TED: "シナリオを探索する",
		FAST: "技術の構成要素を分解する",
	}

	const handleAskAI = () => {
		toast({
			title: "Under Construction",
			description: t("scenario.header.ask_ai_wip"),
		})
	}

	// Convert DB technical_strengths to TechStrength format for the dialog
	// DB column is `strength_name`, not `name`
	const techStrengths: TechStrength[] = useMemo(
		() =>
			technicalStrengths.map((s) => ({
				strength_name: s.strength_name ?? s.name ?? "",
				description: s.description ?? "",
				potential_applications: s.potential_applications ?? "",
			})),
		[technicalStrengths],
	)

	const handleTechConfirm = (_techStrengths: TechStrength[]) => {
		setShowTechDialog(false)
	}

	const handleOpenQueryReport = () => {
		setCurrentMode("QUERY")
		if (!treeId) return
		navigate(`/query-report?id=${encodeURIComponent(treeId)}`)
	}

	const checkExistingTreesAndNavigate = async (
		targetMode: "TED" | "FAST",
		fallback: () => void,
	) => {
		setCurrentMode(targetMode)
		if (targetMode === mode) {
			// Already viewing a tree in this mode — nothing to switch to.
			return
		}
		const matches = await findExistingTrees(query, targetMode)
		if (matches.length > 0) {
			setExistingTreeMatches(matches)
			setExistingTreeFallback(() => fallback)
			setShowExistingTreeChoice(true)
			return
		}
		fallback()
	}

	const handleSelectExistingTree = (existingTreeId: string) => {
		setShowExistingTreeChoice(false)
		if (currentMode === "FAST") {
			navigate(`/technology-tree?id=${encodeURIComponent(existingTreeId)}`, {
				state: {
					query,
					searchMode: "fast",
					treeId: existingTreeId,
					fromDatabase: true,
					isDemo: false,
					mode: "FAST",
				},
			})
			return
		}
		navigate(
			`/scenario-selection?tree_id=${encodeURIComponent(existingTreeId)}`,
		)
	}

	const handleGenerateNewTreeAnyway = () => {
		setShowExistingTreeChoice(false)
		existingTreeFallback?.()
	}

	return (
		<>
			<div className="bg-white rounded-lg px-4 py-1.5 flex items-center justify-between flex-shrink-0">
				{/* Mode dropdown */}
				<div className="flex items-center gap-2 w-[220px]">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="shrink-0 focus:outline-none"
								aria-label="モード選択"
							>
								<span className="inline-flex items-center text-sm border h-9 rounded-[8px] px-3 bg-blue-50 text-blue-700 border-[#cddeff] gap-1.5 whitespace-nowrap">
									{labels[currentMode]}
									<ChevronDown className="h-3 w-3 opacity-70" />
								</span>
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-52 py-1">
							<DropdownMenuItem
								onSelect={handleOpenQueryReport}
								className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
							>
								<span className="flex items-center gap-1.5">
									<AlignLeft className="h-3 w-3 shrink-0" />
									{labels.QUERY}
								</span>
								{currentMode === "QUERY" && (
									<svg
										viewBox="0 0 8 6"
										className="w-3 h-3 shrink-0 text-blue-600"
										fill="none"
									>
										<path
											d="M1 3l2 2 4-4"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() =>
									void checkExistingTreesAndNavigate("TED", () =>
										navigate("/", { state: { query, mode: "TED" } }),
									)
								}
								className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
							>
								<span className="flex items-center gap-1.5">
									<Lightbulb className="h-3 w-3 shrink-0" />
									{labels.TED}
								</span>
								{currentMode === "TED" && (
									<svg
										viewBox="0 0 8 6"
										className="w-3 h-3 shrink-0 text-blue-600"
										fill="none"
									>
										<path
											d="M1 3l2 2 4-4"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() =>
									void checkExistingTreesAndNavigate("FAST", () =>
										navigate("/", { state: { query, mode: "FAST" } }),
									)
								}
								className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
							>
								<span className="flex items-center gap-1.5">
									<DecomposeIcon className="h-3 w-3 shrink-0" />
									{labels.FAST}
								</span>
								{currentMode === "FAST" && (
									<svg
										viewBox="0 0 8 6"
										className="w-3 h-3 shrink-0 text-blue-600"
										fill="none"
									>
										<path
											d="M1 3l2 2 4-4"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								)}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Invisible anchor for the existing-version picker, opened programmatically */}
					<DropdownMenu
						open={showExistingTreeChoice}
						onOpenChange={(open) => !open && setShowExistingTreeChoice(false)}
					>
						<DropdownMenuTrigger asChild>
							<span className="h-0 w-0 pointer-events-none" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-64 py-1">
							<div className="px-3 py-1.5 text-xs text-gray-400">
								同じクエリで作成済み
							</div>
							{existingTreeMatches.map((tree) => (
								<DropdownMenuItem
									key={tree.id}
									onSelect={() => handleSelectExistingTree(tree.id)}
									className="flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer"
								>
									<span>バージョン {tree.version}</span>
									<span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 whitespace-nowrap">
										{formatDayLabel(new Date(tree.createdAt), "今日", "昨日")},{" "}
										{new Date(tree.createdAt).toLocaleTimeString([], {
											hour: "numeric",
											minute: "2-digit",
										})}
									</span>
								</DropdownMenuItem>
							))}
							<DropdownMenuItem
								onSelect={handleGenerateNewTreeAnyway}
								className="px-3 py-2 text-sm cursor-pointer text-blue-600"
							>
								新しく作成する
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Query */}
				<div className="w-1/2 mx-auto">
					<QueryDisplay
						className="mb-0"
						query={query}
						treeMode={mode ?? undefined}
						initialKeywords={keywords}
						hideContainer
						disableSubmit
					/>
				</div>

				{/* Ask AI button */}
				<div className="flex items-center gap-2 w-[220px] justify-end">
					<Button
						onClick={handleAskAI}
						className="ask-ai-btn rounded-full px-[18px] py-3 text-white font-medium flex items-center z-50"
						style={{ height: "36px", width: "100px" }}
					>
						<span className="text-white font-medium">Ask AI</span>
					</Button>
				</div>
			</div>

			{/* Tech Characteristics Dialog */}
			<TechCharacteristicsDialog
				open={showTechDialog}
				onOpenChange={setShowTechDialog}
				onConfirm={handleTechConfirm}
				query={query}
				techStrengths={techStrengths}
				isLoadingTechStrengths={false}
				showConfirmButton={false}
				showDownloadButton={true}
			/>
		</>
	)
}
