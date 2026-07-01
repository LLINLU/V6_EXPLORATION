import { AlignLeft } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { TechCharacteristicsDialog } from "@/components/TechCharacteristicsTable"
import { QueryDisplay } from "@/components/technology-tree/QueryDisplay"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
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

type Props = {
	query: string
	mode: "TED" | "FAST" | undefined | null
	treeId?: string
	keywords?: Keyword[]
	technicalStrengths?: TechnicalStrength[]
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
		if (!treeId) return
		navigate(`/query-report?id=${encodeURIComponent(treeId)}`)
	}

	return (
		<>
			<div className="bg-white rounded-lg px-4 py-1.5 flex items-center justify-between flex-shrink-0">
				{/* Left spacer */}
				<div className="flex items-center gap-2" />

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
				<div className="flex items-center gap-2">
					{treeId && (
						<Button
							type="button"
							variant="outline"
							onClick={handleOpenQueryReport}
							className="h-9 rounded-md px-3 hover:bg-[#f4fff7] hover:text-emerald-700 hover:border-[#c0ece0]"
						>
							<AlignLeft className="mr-2 h-4 w-4" />
							{t("index.mode_query_label")}
						</Button>
					)}
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
