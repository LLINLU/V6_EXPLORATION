import { type FormEvent, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast as sonnerToast } from "sonner"
import { TechCharacteristicsDialog } from "@/components/TechCharacteristicsTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateMockTechStrengths } from "@/data/mockTechStrengths"
import { useTreeGeneration } from "@/hooks/useTreeGeneration"
import { useUserDetail } from "@/hooks/useUserDetail"
import { supabase } from "@/integrations/supabase/client"
import { freshFrom } from "@/integrations/supabase/writes"
import { getOutputLanguage } from "@/lib/outputLanguage"
import { enqueueEnrichment } from "@/services/enrichmentQueue"
import { triggerEnrichmentRefresh } from "@/stores/enrichedDataStore"
import type { Keyword, TechCharacteristic, TechStrength } from "@/types/axis"
import type { Scenario } from "@/types/scenario"
import { GenerationInputPanel } from "./GenerationInputPanel"
import { GenerationModeSelector } from "./GenerationModeSelector"
import { SuggestionList } from "./SuggestionList"

type GenerationMode = "TED" | "SOCIAL_PROBLEM" | "FAST" | "QUERY"

const TOAST_IDS = {
	FAST_GENERATION_FAILED: "fast-generation-failed",
	FAST_GENERATION_ERROR: "fast-generation-error",
	SOCIAL_PROBLEM_GENERATION_FAILED: "social-problem-generation-failed",
	SOCIAL_PROBLEM_GENERATION_ERROR: "social-problem-generation-error",
	TECH_STRENGTHS_FAILED: "tech-strengths-failed",
	TREE_ID_MISSING: "tree-id-missing",
	PIPELINE_ERROR: "pipeline-error",
	CONFIRM_TREE_ID_MISSING: "confirm-tree-id-missing",
	ADD_STRENGTH_NO_TREE: "add-strength-no-tree",
	ADD_STRENGTH_SAVE_FAILED: "add-strength-save-failed",
	REMOVE_STRENGTH_FAILED: "remove-strength-failed",
} as const

export const TreeGenerationSection = () => {
	const navigate = useNavigate()
	const { t } = useTranslation()

	const [searchValue, setSearchValue] = useState("")
	const [selectedMode, setSelectedMode] = useState<GenerationMode>("TED")
	const [isDeepRefinerMode, setIsDeepRefinerMode] = useState(false)
	const [isRefinerExpanded, setIsRefinerExpanded] = useState(false)
	const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([])
	const [_selectedTechCharacteristics, setSelectedTechCharacteristics] =
		useState<TechCharacteristic[]>([])
	const [showTechTable, setShowTechTable] = useState(false)
	const [techStrengths, setTechStrengths] = useState<TechStrength[]>([])
	const [isLoadingPipeline, setIsLoadingPipeline] = useState(false)
	const [showTreeFirst, setShowTreeFirst] = useState(false)

	const pipelineResultRef = useRef<{
		scenarios?: Scenario[]
		treeId?: string
	} | null>(null)

	const { generateTree, isGenerating } = useTreeGeneration()
	const { userDetails } = useUserDetail()

	const tedSuggestions = [
		t("index.suggestion_ted_1"),
		t("index.suggestion_ted_2"),
		t("index.suggestion_ted_3"),
	]

	const fastSuggestions = [
		t("index.suggestion_fast_1"),
		t("index.suggestion_fast_2"),
		t("index.suggestion_fast_3"),
	]

	const querySuggestions = [
		t("index.suggestion_query_1"),
		t("index.suggestion_query_2"),
		t("index.suggestion_query_3"),
	]

	const currentSuggestions =
		selectedMode === "TED" || selectedMode === "SOCIAL_PROBLEM"
			? tedSuggestions
			: selectedMode === "QUERY"
				? querySuggestions
				: fastSuggestions

	const handleModeChange = (mode: GenerationMode) => {
		setSelectedMode(mode)
		setIsDeepRefinerMode(false)
		setIsRefinerExpanded(false)
		setShowTreeFirst(false)
	}

	const handleSuggestionClick = (suggestion: string) => {
		setSearchValue(suggestion)
	}

	const saveTechStrengthToSupabase = async (
		strength: TechStrength,
		treeId: string,
		ordinal: number,
	): Promise<{ error: { code?: string; message?: string } | null }> => {
		const { error } = await (await freshFrom("technical_strengths")).insert({
			tree_id: treeId,
			ordinal,
			strength_name: strength.strength_name,
			strength_name_t: null,
			description: strength.description,
			description_t: null,
			potential_applications: strength.potential_applications || "",
			potential_applications_t: null,
		})
		return { error }
	}

	const enqueueSocialProblemEnrichment = (
		treeId: string,
		scenarios: Array<{ id: string; name?: string; description?: string }>,
	) => {
		for (const scenario of scenarios) {
			if (!scenario.id || !scenario.name) continue

			const params = {
				nodeId: scenario.id,
				treeId,
				enrichNode: scenario.name,
				query: searchValue,
				parentNodes: [],
				treeType: "TED",
				team_id: userDetails?.team_id ?? null,
				include_desc: false,
			}

			const refresh = () => triggerEnrichmentRefresh(scenario.id)
			enqueueEnrichment(scenario.id, scenario.name, "papers", params, refresh)
			enqueueEnrichment(scenario.id, scenario.name, "useCases", params, refresh)
			enqueueEnrichment(scenario.id, scenario.name, "patents", params, refresh)
		}
	}

	const ensureSocialProblemModeSaved = async (treeId: string) => {
		const { data: currentTree, error: readError } = await supabase
			.from("technology_trees")
			.select("mode")
			.eq("id", treeId)
			.maybeSingle()

		if (readError) {
			throw new Error(
				`Failed to verify Social Problem tree mode: ${readError.message}`,
			)
		}

		if (currentTree?.mode === "SOCIAL_PROBLEM") {
			return
		}

		const { error: updateError } = await (await freshFrom("technology_trees"))
			.update({ mode: "SOCIAL_PROBLEM" })
			.eq("id", treeId)

		if (updateError) {
			throw new Error(
				`Failed to save Social Problem tree mode: ${updateError.message}`,
			)
		}

		const { data: updatedTree, error: verifyError } = await supabase
			.from("technology_trees")
			.select("mode")
			.eq("id", treeId)
			.maybeSingle()

		if (verifyError) {
			throw new Error(
				`Failed to verify updated Social Problem tree mode: ${verifyError.message}`,
			)
		}

		if (updatedTree?.mode !== "SOCIAL_PROBLEM") {
			throw new Error("Tree mode was not saved as SOCIAL_PROBLEM")
		}
	}

	const handleSubmit = async (e?: FormEvent) => {
		if (e) e.preventDefault()
		if (!searchValue.trim() || isGenerating) return

		if (selectedMode === "FAST") {
			navigate("/v1/problem")
			return
		}

		if (selectedMode === "QUERY") {
			navigate("/query-report", {
				state: { createReport: true, query: searchValue, language: getOutputLanguage() },
			})
			return
		}

		// TED + showTreeFirst: show mindmap tree first, skip characteristics dialog
		if (showTreeFirst) {
			navigate("/v1/treemap")
			return
		}

		// TED mode: show tech characteristics dialog with mock data, then navigate to V1 prioritization
		setShowTechTable(true)
		setTechStrengths(generateMockTechStrengths(searchValue))
		pipelineResultRef.current = { treeId: "dummy" }
	}

	const handleTechTableConfirm = async (confirmedStrengths: TechStrength[]) => {
		const asCharacteristics: TechCharacteristic[] = confirmedStrengths.map(
			(s) => ({
				name: s.strength_name,
				description: s.description,
				selected: true,
			}),
		)

		setSelectedTechCharacteristics(asCharacteristics)

		const pipelineResult = pipelineResultRef.current

		if (!pipelineResult?.treeId) {
			sonnerToast.error(t("common.toast_error_title"), {
				id: TOAST_IDS.CONFIRM_TREE_ID_MISSING,
				description: t("index.toast_tree_id_not_found_restart"),
			})
			return
		}

		navigate("/v1/prioritization")
	}

	const handleAddTechStrength = async (newStrength: TechStrength) => {
		const treeId = pipelineResultRef.current?.treeId
		if (!treeId) {
			sonnerToast.error(t("common.toast_save_error_title"), {
				id: TOAST_IDS.ADD_STRENGTH_NO_TREE,
				description: t("index.toast_tree_id_not_found"),
			})
			return
		}

		const { data: maxRow } = await supabase
			.from("technical_strengths")
			.select("ordinal")
			.eq("tree_id", treeId)
			.order("ordinal", { ascending: false })
			.limit(1)
			.maybeSingle()
		const ordinal = (maxRow?.ordinal ?? 0) + 1

		const { error } = await saveTechStrengthToSupabase(
			newStrength,
			treeId,
			ordinal,
		)
		if (error) {
			sonnerToast.error(t("common.toast_save_failed_title"), {
				id: TOAST_IDS.ADD_STRENGTH_SAVE_FAILED,
				description: t("common.toast_try_again_later"),
			})
			return
		}
		setTechStrengths((prev) => [...prev, newStrength])
	}

	const handleRemoveTechStrength = async (index: number) => {
		const strengthToRemove = techStrengths[index]
		if (!strengthToRemove) return

		const treeId = pipelineResultRef.current?.treeId

		if (!treeId) {
			sonnerToast.error(t("common.toast_delete_error_title"), {
				id: TOAST_IDS.REMOVE_STRENGTH_FAILED,
				description: t("index.toast_tree_id_not_found"),
			})
			return
		}

		setTechStrengths((prev) => prev.filter((_, i) => i !== index))

		const { error } = await supabase
			.from("technical_strengths")
			.delete()
			.eq("tree_id", treeId)
			.eq("strength_name", strengthToRemove.strength_name)

		if (error) {
			setTechStrengths((prev) => {
				const next = [...prev]
				next.splice(index, 0, strengthToRemove)
				return next
			})
			sonnerToast.error(t("common.toast_delete_error_title"), {
				id: TOAST_IDS.REMOVE_STRENGTH_FAILED,
				description: t("index.toast_tech_strength_delete_failed"),
			})
		}
	}

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
					{t("index.heading")}
				</CardTitle>
			</CardHeader>

			<CardContent>
				<div className="w-full mx-auto mb-8">
					<div className="mb-2">
						<GenerationModeSelector
							selectedMode={selectedMode}
							isGenerating={isGenerating}
							onModeChange={handleModeChange}
						/>
					</div>
					<GenerationInputPanel
						searchValue={searchValue}
						selectedMode={selectedMode}
						isDeepRefinerMode={isDeepRefinerMode}
						isRefinerExpanded={isRefinerExpanded}
						isGenerating={isGenerating}
						showTreeFirst={showTreeFirst}
						onSearchChange={(value) => setSearchValue(value)}
						onSubmit={() => void handleSubmit()}
						onModeChange={handleModeChange}
						onShowTreeFirstChange={setShowTreeFirst}
						onRefinerExpandedChange={(value) => setIsRefinerExpanded(value)}
						onKeywordsSelected={(keywords) => setSelectedKeywords(keywords)}
						onTechCharacteristicsSelected={(items) =>
							setSelectedTechCharacteristics(items)
						}
						onQueryRefined={(value) => setSearchValue(value)}
					/>
				</div>

				<SuggestionList
					suggestions={currentSuggestions}
					selectedMode={selectedMode}
					onSuggestionClick={handleSuggestionClick}
				/>
			</CardContent>

			<TechCharacteristicsDialog
				open={showTechTable}
				onOpenChange={(open) => setShowTechTable(open)}
				onConfirm={handleTechTableConfirm}
				query={searchValue}
				loading={isLoadingPipeline}
				techStrengths={techStrengths}
				isLoadingTechStrengths={isLoadingPipeline && techStrengths.length === 0}
				onAddTechStrength={handleAddTechStrength}
				onRemoveTechStrength={handleRemoveTechStrength}
			/>
		</Card>
	)
}
