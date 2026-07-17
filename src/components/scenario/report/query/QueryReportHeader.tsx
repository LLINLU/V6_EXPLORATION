"use client"

import {
	AlignLeft,
	ArrowLeft,
	ArrowUp,
	ChevronDown,
	Download,
	FileCode,
	FileText,
	Lightbulb,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { TechCharacteristicsDialog } from "@/components/TechCharacteristicsTable"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import {
	downloadQueryReportAsHtml,
	downloadQueryReportAsPdf,
} from "@/lib/downloadQueryReport"
import { getOutputLanguage } from "@/lib/outputLanguage"
import type { TechStrength } from "@/types/axis"
import type { QueryReportData } from "@/types/query-report"

type Mode = "TED" | "FAST" | "QUERY"

const MODE_STYLES: Record<Mode, { pill: string; iconColor?: string }> = {
	TED: {
		pill: "bg-blue-50 text-blue-700 border-[#cddeff]",
	},
	FAST: {
		pill: "bg-blue-50 text-blue-700 border-[#cddeff]",
		iconColor: "#1d4ed8",
	},
	QUERY: {
		pill: "bg-blue-50 text-blue-700 border-[#cddeff]",
	},
}

function ModeIcon({ mode, active }: { mode: Mode; active: boolean }) {
	const cls = `h-3 w-3 mr-1 ${active ? "stroke-[2.5px]" : ""}`
	if (mode === "TED") return <Lightbulb className={cls} />
	if (mode === "QUERY") return <AlignLeft className={cls} />
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			fill={active ? "#1d4ed8" : "#9f9f9f"}
			viewBox="0 0 256 256"
			className="mr-1"
			aria-hidden
		>
			<path d="M193.83,128a195.73,195.73,0,0,0,19.9-33.65c10.74-23.88,11-42.66.8-52.88s-29-9.94-52.88.8A195.73,195.73,0,0,0,128,62.17a195.73,195.73,0,0,0-33.65-19.9c-23.88-10.74-42.66-11-52.88-.8s-9.94,29,.8,52.88A195.73,195.73,0,0,0,62.17,128a195.73,195.73,0,0,0-19.9,33.65c-10.74,23.88-11,42.66-.8,52.88h0c5,5,12,7.47,20.63,7.47,9.1,0,20-2.76,32.25-8.27A195.73,195.73,0,0,0,128,193.83a195.73,195.73,0,0,0,33.65,19.9C173.9,219.24,184.8,222,193.9,222c8.64,0,15.65-2.49,20.63-7.47h0c10.23-10.22,9.94-29-.8-52.88A195.73,195.73,0,0,0,193.83,128ZM206,50c9.28,9.28,2.36,36.29-19.8,68a306.2,306.2,0,0,0-22.78-25.45A306.2,306.2,0,0,0,138,69.76C169.75,47.61,196.77,40.68,206,50Zm-27.19,78A289.17,289.17,0,0,1,155,155a289.17,289.17,0,0,1-27,23.88A289.17,289.17,0,0,1,101,155a290.62,290.62,0,0,1-23.88-27A297.06,297.06,0,0,1,128,77.14,290.74,290.74,0,0,1,155,101,289.17,289.17,0,0,1,178.85,128ZM50,50c2.68-2.69,6.84-4,12.17-4,13.11,0,33.3,8,55.87,23.81A302.94,302.94,0,0,0,92.54,92.54,306.2,306.2,0,0,0,69.76,118C47.6,86.25,40.68,59.24,50,50ZM50,206h0c-9.28-9.28-2.35-36.29,19.8-68a306.2,306.2,0,0,0,22.78,25.45A306.2,306.2,0,0,0,118,186.24C86.25,208.4,59.24,215.32,50,206ZM206,206c-9.28,9.28-36.29,2.35-68-19.81a304.26,304.26,0,0,0,25.45-22.77A306.2,306.2,0,0,0,186.24,138C208.4,169.75,215.32,196.76,206,206Zm-68-78a10,10,0,1,1-10-10A10,10,0,0,1,138,128Z" />
		</svg>
	)
}

function ModePill({
	mode,
	active,
	withChevron,
	label,
	size = "menu",
}: {
	mode: Mode
	active: boolean
	withChevron?: boolean
	label: string
	size?: "trigger" | "menu"
}) {
	const s = MODE_STYLES[mode]
	const sizing =
		size === "trigger"
			? "h-9 rounded-[8px] px-3"
			: "h-[28px] rounded-full px-3 py-1"
	return (
		<span
			className={`inline-flex items-center text-sm transition-colors border ${sizing} ${s.pill}`}
		>
			<span className="max-w-[180px] truncate whitespace-nowrap">{label}</span>
			{withChevron && (
				<ChevronDown className="h-3 w-3 ml-1.5 opacity-70" strokeWidth={2.25} />
			)}
		</span>
	)
}

export function QueryReportHeader({
	query,
	queryId,
	reportData,
}: {
	query: string
	queryId?: string
	reportData?: QueryReportData | null
}) {
	const { t } = useTranslation()
	const { toast } = useToast()
	const navigate = useNavigate()
	const [mode, setMode] = useState<Mode>("QUERY")
	const [inputQuery, setInputQuery] = useState(query)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showTechDialog, setShowTechDialog] = useState(false)
	const [isLoadingTechStrengths, setIsLoadingTechStrengths] = useState(false)
	const [techStrengths, setTechStrengths] = useState<TechStrength[]>([])

	useEffect(() => {
		setInputQuery(query)
	}, [query])

	const labels: Record<Mode, string> = {
		TED: t("index.mode_ted_label", "技術の応用先を探索する"),
		FAST: t("index.mode_fast_label", "技術の構成要素を分解する"),
		QUERY: t("index.mode_query_label", "技術の全体像を把握する"),
	}

	const handleAskAI = () => {
		toast({
			title: "Under Construction",
			description: t("scenario.header.ask_ai_wip", {
				defaultValue: "Coming soon",
			}),
		})
	}

	const loadTechnicalStrengths = async (
		treeId: string,
	): Promise<TechStrength[]> => {
		const { data, error } = await supabase
			.from("technical_strengths")
			.select("strength_name, description, potential_applications")
			.eq("tree_id", treeId)
			.order("ordinal", { ascending: true })

		if (error) {
			throw new Error(error.message)
		}

		return (data ?? []).map((row) => ({
			strength_name: row.strength_name ?? "",
			description: row.description ?? "",
			potential_applications: row.potential_applications ?? "",
		}))
	}

	const hasGeneratedScenarios = async (treeId: string): Promise<boolean> => {
		const { data, error } = await supabase
			.from("tree_nodes")
			.select("id")
			.eq("tree_id", treeId)
			.eq("level", 1)
			.limit(1)

		if (error) {
			throw new Error(error.message)
		}

		return Boolean(data?.length)
	}

	const handleOpenScenarioSelection = async () => {
		if (!queryId || isLoadingTechStrengths) return
		setIsLoadingTechStrengths(true)

		try {
			if (await hasGeneratedScenarios(queryId)) {
				navigate(`/scenario-selection?tree_id=${encodeURIComponent(queryId)}`)
				return
			}

			setShowTechDialog(true)
			setTechStrengths([])

			let strengths = await loadTechnicalStrengths(queryId)

			if (strengths.length === 0) {
				const { data, error } = await supabase.functions.invoke(
					"generate-tech-strengths",
					{
						body: {
							treeId: queryId,
							searchTheme: query,
							language: getOutputLanguage(),
						},
					},
				)

				if (error) {
					throw new Error(error.message)
				}

				const generated = Array.isArray(data?.tech_strengths)
					? data.tech_strengths.map((row: Partial<TechStrength>) => ({
							strength_name: row.strength_name ?? "",
							description: row.description ?? "",
							potential_applications: row.potential_applications ?? "",
						}))
					: []

				strengths =
					generated.length > 0
						? generated
						: await loadTechnicalStrengths(queryId)
			}

			setTechStrengths(strengths)
		} catch (error) {
			toast({
				title: t("common.toast_error_title", "Error"),
				description:
					error instanceof Error
						? error.message
						: t("scenario.toast.try_again", "Please try again."),
			})
			setShowTechDialog(false)
		} finally {
			setIsLoadingTechStrengths(false)
		}
	}

	const handleAddTechStrength = async (techStrength: TechStrength) => {
		if (!queryId) return

		try {
			const { data: maxRow } = await supabase
				.from("technical_strengths")
				.select("ordinal")
				.eq("tree_id", queryId)
				.order("ordinal", { ascending: false })
				.limit(1)
				.maybeSingle()

			const { error } = await supabase.from("technical_strengths").insert({
				tree_id: queryId,
				ordinal: (maxRow?.ordinal ?? 0) + 1,
				strength_name: techStrength.strength_name,
				strength_name_t: null,
				description: techStrength.description,
				description_t: null,
				potential_applications: techStrength.potential_applications,
				potential_applications_t: null,
			})

			if (error) throw new Error(error.message)

			setTechStrengths((prev) => [...prev, techStrength])
		} catch (error) {
			toast({
				title: t("common.toast_save_error_title", "Couldn't save"),
				description:
					error instanceof Error
						? error.message
						: t("common.toast_try_again_later", "Try again in a moment."),
			})
		}
	}

	const handleRemoveTechStrength = async (index: number) => {
		if (!queryId) return
		const removed = techStrengths[index]
		if (!removed) return

		setTechStrengths((prev) => prev.filter((_, i) => i !== index))

		const { error } = await supabase
			.from("technical_strengths")
			.delete()
			.eq("tree_id", queryId)
			.eq("strength_name", removed.strength_name)

		if (error) {
			setTechStrengths((prev) => {
				const next = [...prev]
				next.splice(index, 0, removed)
				return next
			})
			toast({
				title: t("common.toast_delete_error_title", "Couldn't delete"),
				description: t(
					"index.toast_tech_strength_delete_failed",
					"Couldn't delete technical characteristic.",
				),
			})
		}
	}

	const handleTechConfirm = () => {
		if (!queryId) return
		setShowTechDialog(false)
		navigate(`/scenario-selection?tree_id=${encodeURIComponent(queryId)}`)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const q = inputQuery.trim()
		if (!q || isSubmitting) return

		if (mode === "QUERY") {
			setIsSubmitting(true)
			navigate("/query-report", {
				state: {
					createReport: true,
					query: q,
					language: getOutputLanguage(),
				},
			})
			setIsSubmitting(false)
			return
		}

		if (mode === "TED" && queryId) {
			await handleOpenScenarioSelection()
			return
		}

		// For TED/FAST, hand off to Index with the query + mode pre-applied
		navigate("/", { state: { query: q, mode } })
	}

	return (
		<>
			<div className="bg-white rounded-lg px-4 py-2 flex items-center justify-between flex-shrink-0 gap-3">
				{/* Back to home */}
				<div className="flex items-center gap-2 shrink-0 w-[100px]">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => navigate("/")}
						className="h-8 w-8 text-gray-500 hover:text-gray-800"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</div>

				{/* Search row with mode dropdown */}
				<form
					onSubmit={handleSubmit}
					className="w-1/2 min-w-0 flex items-center gap-[0.2rem]"
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="shrink-0 focus:outline-none"
								aria-label="モード選択"
							>
								<ModePill
									mode={mode}
									active
									withChevron
									label={labels[mode]}
									size="trigger"
								/>
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-52 py-1">
							<DropdownMenuItem
								onSelect={() => setMode("QUERY")}
								className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
							>
								<span>{labels["QUERY"]}</span>
								{mode === "QUERY" && (
									<svg viewBox="0 0 8 6" className="w-3 h-3 shrink-0 text-blue-600" fill="none">
										<path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => navigate("/v1/prioritization")}
								className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
							>
								<span>シナリオを探索する</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => navigate("/v1/treemap")}
								className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
							>
								<span>ツリーマップを直接生成する</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<div className="relative flex-1 min-w-0">
						<Input
							type="text"
							value={inputQuery}
							onChange={(e) => setInputQuery(e.target.value)}
							placeholder={t("tech_page.queryPlaceholder", "クエリを入力")}
							className="h-9 pr-10"
						/>
						<Button
							type="submit"
							size="sm"
							disabled={!inputQuery.trim() || isSubmitting}
							className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 bg-transparent hover:bg-muted border-0 text-foreground"
						>
							<ArrowUp className="h-4 w-4" />
						</Button>
					</div>
				</form>

				{/* Right actions */}
				<div className="flex items-center gap-2 shrink-0">
					{queryId && (
						<Button
							type="button"
							variant="outline"
							onClick={handleOpenScenarioSelection}
							disabled={isLoadingTechStrengths}
							className="h-9 max-w-[220px] rounded-md px-3 whitespace-nowrap hover:bg-blue-50 hover:text-blue-700 hover:border-[#cddeff]"
						>
							<Lightbulb className="mr-2 h-4 w-4" />
							<span className="truncate">{labels.TED}</span>
						</Button>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="icon"
								disabled={!reportData}
								aria-label={t("scenario.report.download", {
									defaultValue: "Download report",
								})}
								className="h-9 w-9 rounded-md"
							>
								<Download className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem
								onClick={() => {
									const win = window.open("", "_blank", "width=900,height=700")
									downloadQueryReportAsPdf(reportData, win)
								}}
								className="gap-2 cursor-pointer"
							>
								<FileText className="h-3.5 w-3.5" />
								{t("tech.save_pdf", { defaultValue: "Save PDF" })}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => downloadQueryReportAsHtml(reportData)}
								className="gap-2 cursor-pointer"
							>
								<FileCode className="h-3.5 w-3.5" />
								{t("tech.save_html", { defaultValue: "Save HTML" })}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						onClick={handleAskAI}
						className="ask-ai-btn rounded-full px-[18px] py-3 text-white font-medium flex items-center"
						style={{ height: "36px", width: "100px" }}
					>
						<span className="text-white font-medium">Ask AI</span>
					</Button>
				</div>
			</div>

			<TechCharacteristicsDialog
				open={showTechDialog}
				onOpenChange={setShowTechDialog}
				onConfirm={handleTechConfirm}
				query={query}
				techStrengths={techStrengths}
				isLoadingTechStrengths={isLoadingTechStrengths}
				onAddTechStrength={handleAddTechStrength}
				onRemoveTechStrength={handleRemoveTechStrength}
			/>
		</>
	)
}
