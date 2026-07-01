import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScenarioTableView } from "@/components/scenario/ScenarioTableView"
import { ScenarioPaperPanel } from "@/components/scenario/side-panel/ScenarioSidePanel"
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable"
import { toast } from "@/components/ui/use-toast"
import { useTreeStructurePolling } from "@/hooks/useTreeStructurePolling"
import { useUserDetail } from "@/hooks/useUserDetail"
import { getOutputLanguage } from "@/lib/outputLanguage"
import {
	addManualScenario,
	addScenariosToTree,
	fetchMindmapTreeData,
	generateTreesForSelectedScenarios,
	getScenariosWithTrees,
	mergeMindmapTreeData,
} from "@/services/treeGenerationService"
import type { TechCharacteristic } from "@/types/axis"
import {
	DEFAULT_FILTERS,
	type FilterState,
	type Scenario,
} from "@/types/scenario"
import { applyFilters, getAllUniqueTags } from "@/utils/scenarioFilters"
import { DeepNodeResearchPanel } from "./DeepNodeResearchPanel"
import { ScenarioPaperPanelContainer } from "./ScenarioPaperPanelContainer"

type TechnicalStrength = {
	id: string
	tree_id: string
	name?: string | null
	description?: string | null
	[key: string]: any
}

type SelectedNodeForResearch = {
	id: string
	title: string
	description?: string
	level: number
}

type Props = {
	scenarios: Scenario[]
	treeId: string
	technicalStrengths: TechnicalStrength[]
	query: string
	effectiveMode: "TED" | "FAST" | null | undefined
	isLoading?: boolean
	stage?: string
	onLoadMoreScenarios?: () => Promise<void>
	isLoadingMoreScenarios?: boolean
	onUpdateScenarioCounts?: (
		scenarioId: string,
		counts: { papers: number; patents: number; useCases: number },
	) => void
	onScenarioAdded?: (newScenarios: Scenario[]) => void
	onRetryGeneration?: () => void
}

export function ScenarioSelectionMainLayout({
	scenarios,
	treeId,
	technicalStrengths,
	query,
	effectiveMode,
	isLoading,
	stage,
	onLoadMoreScenarios,
	isLoadingMoreScenarios = false,
	onUpdateScenarioCounts,
	onScenarioAdded,
	onRetryGeneration,
}: Props) {
	const { t } = useTranslation()
	const { userDetails } = useUserDetail()
	const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
	const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([])
	const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
		null,
	)
	const [displayMode, setDisplayMode] = useState<"table" | "mindmap">("table")

	const [showPaperPanel, setShowPaperPanel] = useState(false)
	const [isPanelExpanded, setIsPanelExpanded] = useState(false)
	const [paperPanelActiveTab, setPaperPanelActiveTab] = useState("summary")
	const [resizeHandleDragging, setResizeHandleDragging] = useState(false)

	// Deep node selection (level 2+ in mindmap)
	const [selectedDeepNode, setSelectedDeepNode] =
		useState<SelectedNodeForResearch | null>(null)
	const [showDeepNodePanel, setShowDeepNodePanel] = useState(false)
	const [selectedMindmapPath, setSelectedMindmapPath] = useState<
		Record<string, string>
	>({})

	// Tree generation state
	const [isGeneratingTrees, setIsGeneratingTrees] = useState(false)
	const [generationProgress, setGenerationProgress] = useState<{
		current: number
		total: number
	} | null>(null)
	const [scenariosWithTrees, setScenariosWithTrees] = useState<string[]>([])
	const [generationSuccess, setGenerationSuccess] = useState(false)
	const [mindmapTreeData, setMindmapTreeData] = useState<any>(null)

	const handleDisplayModeChange = useCallback(
		async (mode: "table" | "mindmap") => {
			setDisplayMode(mode)
			if (mode === "table") {
				setShowDeepNodePanel(false)
				setSelectedDeepNode(null)
			}
			if (mode === "mindmap" && treeId && scenariosWithTrees.length > 0) {
				try {
					const data = await fetchMindmapTreeData(treeId, scenariosWithTrees)
					setMindmapTreeData(data)
				} catch (error) {
					console.error(
						"[ScenarioSelectionMainLayout] Error refreshing on tab switch:",
						error,
					)
				}
			}
		},
		[treeId, scenariosWithTrees],
	)

	const treeStructurePolling = useTreeStructurePolling()
	const generatingScenarioIdsRef = useRef<string[]>([])
	const reloadDebounceRef = useRef<NodeJS.Timeout | null>(null)

	const filteredScenarios = useMemo(
		() => applyFilters(scenarios, filters),
		[scenarios, filters],
	)

	const availableTags = useMemo(() => getAllUniqueTags(scenarios), [scenarios])

	const selectedTechCharacteristics = useMemo<TechCharacteristic[]>(
		() =>
			technicalStrengths.map((strength) => ({
				name: strength.strength_name || "",
				description: strength.description || "",
				selected: true,
			})),
		[technicalStrengths],
	)

	const handleToggleScenario = (scenarioId: string) => {
		setSelectedScenarioIds((prev) =>
			prev.includes(scenarioId)
				? prev.filter((id) => id !== scenarioId)
				: [...prev, scenarioId],
		)
	}

	const handleSelectAll = () => {
		setSelectedScenarioIds(filteredScenarios.map((scenario) => scenario.id))
	}

	const handleSelectNone = () => {
		setSelectedScenarioIds([])
	}

	const handleClearFilters = () => {
		setFilters(DEFAULT_FILTERS)
	}

	const handleSaveScenario = (updatedScenario: Scenario) => {
		console.log("[ScenarioSelectionMainLayout] save scenario:", updatedScenario)
	}

	const handleRegenerateScenario = (
		scenarioId: string,
		mode: "converge" | "diverge",
	) => {
		console.log("[ScenarioSelectionMainLayout] regenerate scenario:", {
			scenarioId,
			mode,
		})
	}

	// Load existing tree data on mount
	useEffect(() => {
		if (!treeId) return
		let cancelled = false

		;(async () => {
			try {
				const existingIds = await getScenariosWithTrees(treeId)
				if (cancelled) return

				if (existingIds.length > 0) {
					setScenariosWithTrees(existingIds)
					const data = await fetchMindmapTreeData(treeId, existingIds)
					if (cancelled) return
					setMindmapTreeData(data)
				}
			} catch (error) {
				console.error(
					"[ScenarioSelectionMainLayout] Failed to load existing tree data:",
					error,
				)
			}
		})()

		return () => {
			cancelled = true
		}
	}, [treeId])

	const refreshCompletedScenarioData = useCallback(async () => {
		if (!treeId) return
		try {
			const readyIds = await getScenariosWithTrees(treeId)
			const targetIds = generatingScenarioIdsRef.current
			const relevantReadyIds = readyIds.filter((id) => targetIds.includes(id))

			if (relevantReadyIds.length > 0) {
				const newData = await fetchMindmapTreeData(treeId, relevantReadyIds)
				setMindmapTreeData((prev: any) => mergeMindmapTreeData(prev, newData))
				setScenariosWithTrees((prev) => [
					...new Set([...prev, ...relevantReadyIds]),
				])
				setGenerationProgress({
					current: relevantReadyIds.length,
					total: targetIds.length,
				})
			}
		} catch (error) {
			console.error(
				"[ScenarioSelectionMainLayout] Error refreshing tree data:",
				error,
			)
		}
	}, [treeId])

	const startGenerationPolling = useCallback(
		(scenarioIds: string[]) => {
			if (!treeId || scenarioIds.length === 0) return

			generatingScenarioIdsRef.current = scenarioIds

			treeStructurePolling.startPolling(treeId, scenarioIds, {
				onStructureUpdate: () => {
					if (reloadDebounceRef.current) clearTimeout(reloadDebounceRef.current)
					reloadDebounceRef.current = setTimeout(() => {
						refreshCompletedScenarioData()
					}, 1500)
				},
				onAllComplete: () => {
					if (reloadDebounceRef.current) clearTimeout(reloadDebounceRef.current)

					refreshCompletedScenarioData().then(() => {
						setIsGeneratingTrees(false)
						setGenerationProgress(null)
						setGenerationSuccess(true)

						toast({
							title: t("scenario.tree_generation.complete_title"),
							description: t("scenario.tree_generation.complete_description", {
								count: scenarioIds.length,
							}),
						})
					})
				},
			})
		},
		[treeId, treeStructurePolling, refreshCompletedScenarioData, t],
	)

	useEffect(() => {
		return () => {
			treeStructurePolling.stopPolling()
			if (reloadDebounceRef.current) clearTimeout(reloadDebounceRef.current)
		}
	}, [treeStructurePolling.stopPolling])

	useEffect(() => {
		if (!selectedScenario?.id) return

		const latestScenario = scenarios.find(
			(scenario) => scenario.id === selectedScenario.id,
		)
		if (!latestScenario) return

		setSelectedScenario((current) => {
			if (!current || current.id !== latestScenario.id) return current
			return current === latestScenario ? current : latestScenario
		})
	}, [scenarios, selectedScenario?.id])

	const handleGenerateTree = useCallback(async () => {
		if (selectedScenarioIds.length === 0) {
			toast({
				title: t("scenario.tree_generation.select_scenario_title"),
				description: t("scenario.tree_generation.select_scenario_description"),
			})
			return
		}

		setIsGeneratingTrees(true)
		setGenerationSuccess(false)
		setGenerationProgress({ current: 0, total: selectedScenarioIds.length })

		const skeletonLevel1Items = selectedScenarioIds.map((id) => {
			const scenario = scenarios.find((s) => s.id === id)
			return {
				id,
				name: scenario?.name || "",
				description: scenario?.description || "",
				level: 1,
				children_count: 0,
			}
		})

		const skeletonData = {
			level1Items: skeletonLevel1Items,
			level2Items: {},
			level3Items: {},
			level4Items: {},
			level5Items: {},
			level6Items: {},
			level7Items: {},
			level8Items: {},
			level9Items: {},
			level10Items: {},
			levelNames: {
				level1: t("scenario.level_names.scenario"),
				level2: t("scenario.level_names.objective"),
				level3: t("scenario.level_names.function"),
				level4: t("scenario.level_names.means"),
			},
		}

		setMindmapTreeData((prev: any) => mergeMindmapTreeData(prev, skeletonData))
		startGenerationPolling(selectedScenarioIds)

		generateTreesForSelectedScenarios(
			treeId,
			selectedScenarioIds,
			getOutputLanguage(),
		)
			.then(() => {
				setScenariosWithTrees((prev) => [
					...new Set([...prev, ...selectedScenarioIds]),
				])
			})
			.catch((error) => {
				console.error(
					"[ScenarioSelectionMainLayout] Tree generation error:",
					error,
				)
				toast({
					title: t("scenario.tree_generation.error_title"),
					description: t("scenario.tree_generation.error_description"),
				})
				setIsGeneratingTrees(false)
				setGenerationProgress(null)
			})
	}, [selectedScenarioIds, treeId, scenarios, startGenerationPolling, t])

	// Level 1 click → open scenario paper panel
	const handleRowClick = (scenario: Scenario) => {
		// Close deep node panel if open
		setShowDeepNodePanel(false)
		setSelectedDeepNode(null)

		if (selectedScenario?.id === scenario.id && showPaperPanel) {
			setSelectedScenario(null)
			setShowPaperPanel(false)
			return
		}

		setSelectedScenario(scenario)
		setShowPaperPanel(true)
		if (effectiveMode === "TED") {
			setPaperPanelActiveTab("overview")
		}
	}

	const handleRowClickWithTab = (scenario: Scenario, tab: string) => {
		setShowDeepNodePanel(false)
		setSelectedDeepNode(null)

		setSelectedScenario(scenario)
		setShowPaperPanel(true)
		setPaperPanelActiveTab(tab)
	}

	const handleResearchPanelChange = useCallback(
		(isVisible: boolean, nodeData?: SelectedNodeForResearch) => {
			if (isVisible && nodeData && nodeData.level > 1) {
				// Close scenario paper panel
				setShowPaperPanel(false)
				setSelectedScenario(null)

				// Open deep node panel
				setSelectedDeepNode(nodeData)
				setShowDeepNodePanel(true)

				// Track the path
				setSelectedMindmapPath((prev) => ({
					...prev,
					[`level${nodeData.level}`]: nodeData.id,
				}))
			} else {
				setShowDeepNodePanel(false)
				setSelectedDeepNode(null)
			}
		},
		[],
	)

	const handleAiAssist = useCallback(
		(
			nodeId?: string,
			nodeTitle?: string,
			_nodeDescription?: string,
			level?: number,
		) => {
			if (!nodeId || !nodeTitle || !level) return
			// AI assist is handled via the deep node panel's chat tab
		},
		[],
	)

	const handleAddManualScenario = async (input: {
		name: string
		summary: string
	}) => {
		const result = await addManualScenario(
			treeId,
			input.name,
			input.summary,
			userDetails?.team_id ?? undefined,
			userDetails?.user_id ?? undefined,
		)
		if (!result.success) {
			throw new Error(result.error || t("scenario.toast.add_scenario_failed"))
		}
		if (result.scenario) {
			onScenarioAdded?.([
				{
					id: result.scenario.id,
					name: result.scenario.name,
					description: result.scenario.description,
					level: result.scenario.level,
					metrics: {
						tam: null,
						tamCategory: null,
						trl: null,
						trlCategory: null,
						cagr: null,
						cagrCategory: null,
						marketGrowthRate: null,
						competitiveness: null,
						implementationDifficulty: null,
						timeToMarket: null,
						paperCount: null,
						patentCount: null,
						implementationCount: null,
					},
					tags: [],
					isManuallyAdded: true,
				},
			])
		}
	}

	const handleAddScenario = async (context: string) => {
		console.log(
			"[ScenarioSelectionMainLayout] handleAddScenario called, treeId=",
			treeId,
			"context=",
			context,
		)
		const result = await addScenariosToTree(treeId, context)
		console.log(
			"[ScenarioSelectionMainLayout] addScenariosToTree result=",
			result,
		)
		if (!result.success) {
			throw new Error(result.error || t("scenario.toast.add_scenario_failed"))
		}
		if ((result.scenarios?.length ?? 0) > 0) {
			const newScenarios: Scenario[] = (result.scenarios ?? []).map(
				(s: any) => ({
					id: s.id,
					name: s.name,
					description: s.description,
					level: s.level,
					metrics: {
						tam: null,
						tamCategory: null,
						trl: null,
						trlCategory: null,
						cagr: null,
						cagrCategory: null,
						marketGrowthRate: null,
						competitiveness: null,
						implementationDifficulty: null,
						timeToMarket: null,
						paperCount: null,
						patentCount: null,
						implementationCount: null,
					},
					tags: [],
					isAIGenerated: true,
				}),
			)
			onScenarioAdded?.(newScenarios)
		}
	}

	const handleClosePaperPanel = () => {
		setShowPaperPanel(false)
		setSelectedScenario(null)
	}

	const handleCloseDeepNodePanel = () => {
		setShowDeepNodePanel(false)
		setSelectedDeepNode(null)
	}

	const filteredMindmapTreeData = useMemo(() => {
		if (!mindmapTreeData) return null

		const visibleIds = isGeneratingTrees
			? selectedScenarioIds
			: selectedScenarioIds.length > 0
				? selectedScenarioIds.filter((id) => scenariosWithTrees.includes(id))
				: scenariosWithTrees

		if (visibleIds.length === 0) return null

		const visibleSet = new Set(visibleIds)
		const filteredLevel1 = (mindmapTreeData.level1Items || []).filter(
			(item: any) => visibleSet.has(item.id),
		)

		return {
			...mindmapTreeData,
			level1Items: filteredLevel1,
		}
	}, [
		mindmapTreeData,
		selectedScenarioIds,
		scenariosWithTrees,
		isGeneratingTrees,
	])

	// Determine which right panel to show
	const hasScenarioPanel = showPaperPanel && !!selectedScenario
	const hasDeepNodePanel = showDeepNodePanel && !!selectedDeepNode
	const hasRightPanel = hasScenarioPanel || hasDeepNodePanel
	const tableDefaultSize = hasRightPanel ? 60 : 100

	return (
		effectiveMode && (
			<div className="flex-1 min-h-0 w-full">
				{isPanelExpanded && showPaperPanel && selectedScenario ? (
					<ResizablePanelGroup
						direction="horizontal"
						className="h-full w-full"
						key="expanded-panel"
					>
						<ResizablePanel
							id="expanded-panel"
							order={1}
							defaultSize={100}
							minSize={50}
							className="bg-white rounded-lg overflow-hidden"
						>
							<ScenarioPaperPanel
								key={selectedScenario.id}
								scenario={selectedScenario}
								mode={effectiveMode}
								treeId={treeId}
								userQuery={query}
								technologies={selectedTechCharacteristics.map((tc) => ({
									tech_name: tc.name,
									tech_definition: tc.description,
								}))}
								onClose={() => {
									setIsPanelExpanded(false)
									handleClosePaperPanel()
								}}
								isExpanded={true}
								onCollapse={() => setIsPanelExpanded(false)}
								externalActiveTab={paperPanelActiveTab}
								onActiveTabChange={setPaperPanelActiveTab}
								showTechSeedsTab={displayMode === "table"}
								scenariosCount={scenarios.length}
								onCountsChange={
									onUpdateScenarioCounts
										? (counts) =>
												onUpdateScenarioCounts(selectedScenario.id, counts)
										: undefined
								}
							/>
						</ResizablePanel>
					</ResizablePanelGroup>
				) : (
					<ResizablePanelGroup
						direction="horizontal"
						className="h-full w-full"
						key={`panels-${hasRightPanel ? "right" : "no-right"}`}
					>
						<ResizablePanel
							id="scenario-table-panel"
							order={1}
							defaultSize={tableDefaultSize}
							minSize={30}
							className="bg-white rounded-lg overflow-hidden"
						>
							<div className="h-full flex flex-col overflow-hidden">
								<div className="flex-1 min-h-0 overflow-hidden">
									<ScenarioTableView
										scenarios={filteredScenarios}
										selectedScenarioIds={selectedScenarioIds}
										technicalStrengths={technicalStrengths}
										onToggleScenario={handleToggleScenario}
										onSelectAll={handleSelectAll}
										onSelectNone={handleSelectNone}
										onSaveScenario={handleSaveScenario}
										onRegenerateScenario={handleRegenerateScenario}
										filters={filters}
										onFilterChange={setFilters}
										availableTags={availableTags}
										onGenerateTree={handleGenerateTree}
										isGenerating={isGeneratingTrees}
										generationProgress={generationProgress}
										generationSuccess={generationSuccess}
										scenariosWithTrees={scenariosWithTrees}
										selectedTechCharacteristics={selectedTechCharacteristics}
										onRowClick={handleRowClick}
										onRowClickWithTab={handleRowClickWithTab}
										activeScenarioId={selectedScenario?.id}
										searchTheme={query}
										onAddScenario={handleAddScenario}
										onAddManualScenario={handleAddManualScenario}
										onLoadMoreScenarios={onLoadMoreScenarios}
										displayMode={displayMode}
										onDisplayModeChange={handleDisplayModeChange}
										treeData={filteredMindmapTreeData}
										isLoadingTree={false}
										onResearchPanelChange={handleResearchPanelChange}
										onAiAssist={handleAiAssist}
										isLoadingMoreScenarios={isLoadingMoreScenarios}
										treeId={treeId}
										treeMode={effectiveMode}
										isLoadingScenarios={isLoading}
										scenarioStage={stage}
										onClearFilters={handleClearFilters}
										onRetryGeneration={onRetryGeneration}
									/>
								</div>
							</div>
						</ResizablePanel>

						{/* Scenario Paper Panel (level 1 clicks) */}
						{hasScenarioPanel && !hasDeepNodePanel && (
							<ScenarioPaperPanelContainer
								selectedScenario={selectedScenario}
								effectiveMode={effectiveMode}
								treeId={treeId}
								query={query}
								selectedTechCharacteristics={selectedTechCharacteristics}
								scenariosCount={scenarios.length}
								displayMode={displayMode}
								paperPanelActiveTab={paperPanelActiveTab}
								resizeHandleDragging={resizeHandleDragging}
								setResizeHandleDragging={setResizeHandleDragging}
								setIsPanelExpanded={setIsPanelExpanded}
								setPaperPanelActiveTab={setPaperPanelActiveTab}
								onClose={handleClosePaperPanel}
								onCountsChange={
									onUpdateScenarioCounts
										? (counts) =>
												onUpdateScenarioCounts(selectedScenario.id, counts)
										: undefined
								}
							/>
						)}

						{/* Deep Node Research Panel (level 2+ clicks in mindmap) */}
						{hasDeepNodePanel && selectedDeepNode && (
							<>
								<ResizableHandle withHandle className="mx-1" />
								<ResizablePanel
									id="deep-node-panel"
									order={2}
									defaultSize={40}
									minSize={25}
									maxSize={60}
									className="bg-white rounded-lg overflow-hidden"
								>
									<DeepNodeResearchPanel
										nodeId={selectedDeepNode.id}
										title={selectedDeepNode.title}
										description={selectedDeepNode.description}
										level={selectedDeepNode.level}
										mode={effectiveMode}
										selectedPath={selectedMindmapPath}
										onClose={handleCloseDeepNodePanel}
									/>
								</ResizablePanel>
							</>
						)}
					</ResizablePanelGroup>
				)}
			</div>
		)
	)
}
