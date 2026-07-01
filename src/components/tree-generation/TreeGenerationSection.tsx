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
	const [selectedMode, setSelectedMode] = useState<GenerationMode>("QUERY")
	const [isDeepRefinerMode, setIsDeepRefinerMode] = useState(false)
	const [isRefinerExpanded, setIsRefinerExpanded] = useState(false)
	const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([])
	const [_selectedTechCharacteristics, setSelectedTechCharacteristics] =
		useState<TechCharacteristic[]>([])
	const [showTechTable, setShowTechTable] = useState(false)
	const [techStrengths, setTechStrengths] = useState<TechStrength[]>([])
	const [isLoadingPipeline, setIsLoadingPipeline] = useState(false)

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

		if (isDeepRefinerMode) {
			navigate("/research-context", {
				state: {
					query: searchValue,
					searchMode:
						selectedMode === "SOCIAL_PROBLEM"
							? "social_problem"
							: selectedMode.toLowerCase(),
				},
			})
			return
		}

		if (selectedMode === "QUERY") {
			navigate("/query-report", {
				state: {
					createReport: true,
					query: searchValue,
					language: getOutputLanguage(),
				},
			})
			return
		}

		if (selectedMode === "FAST" || selectedMode === "SOCIAL_PROBLEM") {
			const generationMode = selectedMode === "SOCIAL_PROBLEM" ? "TED" : "FAST"
			try {
				const results = await generateTree(
					searchValue,
					generationMode,
					undefined,
					selectedMode === "SOCIAL_PROBLEM" ? "SOCIAL_PROBLEM" : generationMode,
				)
				if (!results?.treeId) {
					sonnerToast.error(t("index.toast_tree_generation_error_title"), {
						id:
							selectedMode === "SOCIAL_PROBLEM"
								? TOAST_IDS.SOCIAL_PROBLEM_GENERATION_FAILED
								: TOAST_IDS.FAST_GENERATION_FAILED,
						description: t("index.toast_tree_generation_failed_desc"),
					})
					return
				}

				if (selectedMode === "SOCIAL_PROBLEM") {
					await ensureSocialProblemModeSaved(results.treeId)
					enqueueSocialProblemEnrichment(
						results.treeId,
						((results as any).scenarios ?? []) as Array<{
							id: string
							name?: string
							description?: string
						}>,
					)
				}

				navigate(`/technology-tree?id=${encodeURIComponent(results.treeId)}`, {
					state: {
						query: searchValue,
						searchMode:
							selectedMode === "SOCIAL_PROBLEM"
								? "social_problem"
								: selectedMode.toLowerCase(),
						treeId: results.treeId,
						fromDatabase: true,
						isDemo: false,
						mode: generationMode,
						socialProblemMode: selectedMode === "SOCIAL_PROBLEM",
					},
				})
			} catch (error) {
				console.error("Tree generation failed:", error)
				sonnerToast.error(t("index.toast_tree_generation_error_title"), {
					id:
						selectedMode === "SOCIAL_PROBLEM"
							? TOAST_IDS.SOCIAL_PROBLEM_GENERATION_ERROR
							: TOAST_IDS.FAST_GENERATION_ERROR,
					description:
						error instanceof Error
							? error.message
							: t("index.toast_tree_generation_error_desc"),
				})
			}
			return
		}

		// TED mode with scenario selection and technical advantages.
		setShowTechTable(true)
		setIsLoadingPipeline(true)
		setTechStrengths([])
		pipelineResultRef.current = null

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
				sonnerToast.error(t("index.toast_tech_strengths_failed_title"), {
					id: TOAST_IDS.TECH_STRENGTHS_FAILED,
					description: t("index.toast_tech_strengths_failed_desc"),
				})
			}

			if (!techData?.treeId) {
				sonnerToast.error(t("index.toast_tree_id_missing_title"), {
					id: TOAST_IDS.TREE_ID_MISSING,
					description: t("common.toast_please_retry"),
				})
				setShowTechTable(false)
				return
			}

			const strengths: TechStrength[] =
				!techError && techData.tech_strengths?.length > 0
					? techData.tech_strengths
					: generateMockTechStrengths(searchValue)

			setTechStrengths(strengths)
			pipelineResultRef.current = { treeId: techData.treeId }
		} catch {
			sonnerToast.error(t("common.toast_error_title"), {
				id: TOAST_IDS.PIPELINE_ERROR,
				description: t("index.toast_pipeline_error_desc"),
			})
			setShowTechTable(false)
		} finally {
			setIsLoadingPipeline(false)
		}
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

		navigate(
			`/scenario-selection?tree_id=${encodeURIComponent(pipelineResult.treeId)}`,
			{
				state: {
					query: searchValue,
					mode: "TED",
					treeId: pipelineResult.treeId,
					scenarios: pipelineResult.scenarios,
					selectedKeywords:
						selectedKeywords.length > 0 ? selectedKeywords : undefined,
					selectedTechCharacteristics:
						asCharacteristics.length > 0 ? asCharacteristics : undefined,
					regenerateScenariosOnLoad: false,
				},
			},
		)
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
					<GenerationInputPanel
						searchValue={searchValue}
						selectedMode={selectedMode}
						isDeepRefinerMode={isDeepRefinerMode}
						isRefinerExpanded={isRefinerExpanded}
						isGenerating={isGenerating}
						onSearchChange={(value) => setSearchValue(value)}
						onSubmit={() => void handleSubmit()}
						onModeChange={handleModeChange}
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
