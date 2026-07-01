/**
 * Scenario Mindmap View Component
 * Uses the same MindMapContainer as the technology-tree page
 * Displays tree data with the exact same styling and interactions
 */

import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { MindMapContainer } from "@/components/technology-tree/mindmap/MindMapContainer"
import {
	triggerEnrichmentRefresh,
	triggerEnrichmentStart,
} from "@/hooks/useEnrichedData"
import { useUserDetail } from "@/hooks/useUserDetail"
import {
	enrichNodeWithNewStructure,
	hasNodeEnrichedData,
	isNodeLoading,
	type StreamingResponse,
} from "@/services/nodeEnrichmentService"
import type { Scenario } from "@/types/scenario"
import type { TreeNode } from "@/types/tree"

interface SelectedNodeForResearch {
	id: string
	title: string
	description?: string
	level: number
}

interface TreeData {
	level1Items: TreeNode[]
	level2Items: Record<string, TreeNode[]>
	level3Items: Record<string, TreeNode[]>
	level4Items: Record<string, TreeNode[]>
	level5Items: Record<string, TreeNode[]>
	level6Items: Record<string, TreeNode[]>
	level7Items: Record<string, TreeNode[]>
	level8Items: Record<string, TreeNode[]>
	level9Items: Record<string, TreeNode[]>
	level10Items: Record<string, TreeNode[]>
	levelNames: Record<string, string>
	mode?: string
}

interface ScenarioMindmapProps {
	scenarios: Scenario[]
	selectedScenarioIds: string[]
	onToggleScenario: (scenarioId: string) => void
	onSelectAll?: () => void
	onSelectNone?: () => void
	searchTheme?: string
	onRowClick?: (scenario: Scenario) => void
	activeScenarioId?: string | null
	// Tree data from database (when available)
	treeData?: TreeData | null
	isLoadingTree?: boolean
	// Tree identifiers for enrichment
	treeId?: string
	treeMode?: string
	// Research panel callback
	onResearchPanelChange?: (
		isVisible: boolean,
		nodeData?: SelectedNodeForResearch,
	) => void
	// AI assist callback
	onAiAssist?: (
		nodeId?: string,
		nodeTitle?: string,
		nodeDescription?: string,
		level?: number,
	) => void
	// Scenarios that have generated trees (expandable)
	scenariosWithTrees?: string[]
}

export const ScenarioMindmap = ({
	scenarios,
	searchTheme = "",
	onRowClick,
	treeData,
	isLoadingTree = false,
	treeId,
	treeMode = "TED",
	onResearchPanelChange,
	onAiAssist,
	scenariosWithTrees = [],
}: ScenarioMindmapProps) => {
	const { userDetails } = useUserDetail()
	const [selectedPath, setSelectedPath] = useState<{
		level1?: string
		level2?: string
		level3?: string
		level4?: string
		level5?: string
		level6?: string
		level7?: string
		level8?: string
		level9?: string
		level10?: string
	}>({})

	// Use tree data if available, otherwise transform scenarios into level1 items
	const level1Items: TreeNode[] = useMemo(() => {
		if (treeData?.level1Items) {
			return treeData.level1Items
		}
		// Fallback: Transform scenarios into TreeNode format
		// Only show scenarios that have generated trees (level 4+)
		const visibleScenarios = scenarios.filter((s) =>
			scenariosWithTrees.includes(s.id),
		)
		return visibleScenarios.map((scenario) => ({
			id: scenario.id,
			name: scenario.name,
			description: scenario.description || "",
			info: scenario.description,
			level: 1,
			// Visible scenarios are known to have generated children; use minimal truthful count
			children_count: 1,
		}))
	}, [treeData, scenarios, scenariosWithTrees])

	// Use tree data for deeper levels if available
	const level2Items = useMemo(() => treeData?.level2Items || {}, [treeData])
	const level3Items = useMemo(() => treeData?.level3Items || {}, [treeData])
	const level4Items = useMemo(() => treeData?.level4Items || {}, [treeData])
	const level5Items = useMemo(() => treeData?.level5Items || {}, [treeData])
	const level6Items = useMemo(() => treeData?.level6Items || {}, [treeData])
	const level7Items = useMemo(() => treeData?.level7Items || {}, [treeData])
	const level8Items = useMemo(() => treeData?.level8Items || {}, [treeData])
	const level9Items = useMemo(() => treeData?.level9Items || {}, [treeData])
	const level10Items = useMemo(() => treeData?.level10Items || {}, [treeData])

	const { t } = useTranslation()

	// Level names
	const levelNames: Record<string, string> = useMemo(
		() =>
			treeData?.levelNames || {
				level1: t("scenario.level_names.scenario"),
				level2: t("scenario.level_names.objective"),
				level3: t("scenario.level_names.function"),
				level4: t("scenario.level_names.means"),
				level5: `${t("scenario.level_names.means")}2`,
			},
		[treeData, t],
	)

	// Build tree data structure for enrichment
	const enrichmentTreeData = useMemo(
		() => ({
			level1Items,
			level2Items,
			level3Items,
			level4Items,
			level5Items,
			level6Items,
			level7Items,
			level8Items,
			level9Items,
			level10Items,
			mode: treeData?.mode || treeMode,
		}),
		[
			level1Items,
			level2Items,
			level3Items,
			level4Items,
			level5Items,
			level6Items,
			level7Items,
			level8Items,
			level9Items,
			level10Items,
			treeData?.mode,
			treeMode,
		],
	)

	// Handle node click with enrichment
	const handleNodeClick = useCallback(
		async (level: string, nodeId: string) => {
			// Update selected path
			const newPath = {
				...selectedPath,
				[level]: nodeId,
			}
			setSelectedPath(newPath)

			// Find node info for the research panel
			const levelNum = Number.parseInt(level.replace("level", ""), 10)

			if (level === "level1") {
				// Level 1 = scenario click → open scenario detail panel
				const scenario = scenarios.find((s) => s.id === nodeId)
				if (scenario && onRowClick) {
					onRowClick(scenario)
				}
			} else {
				// Level 2+ = deeper node click → open research panel
				// Find the node from the appropriate level items
				const levelItemsMap: Record<string, Record<string, any[]>> = {
					level2: level2Items,
					level3: level3Items,
					level4: level4Items,
					level5: level5Items,
					level6: level6Items,
					level7: level7Items,
					level8: level8Items,
					level9: level9Items,
					level10: level10Items,
				}

				let nodeName = ""
				let nodeDescription = ""

				// Search through the level items to find the clicked node
				const items = levelItemsMap[level]
				if (items) {
					for (const parentItems of Object.values(items)) {
						const found = parentItems.find((item: any) => item.id === nodeId)
						if (found) {
							nodeName = found.name || found.title || ""
							nodeDescription = found.description || found.info || ""
							break
						}
					}
				}

				// Notify parent to show research panel
				if (onResearchPanelChange) {
					onResearchPanelChange(true, {
						id: nodeId,
						title: nodeName,
						description: nodeDescription,
						level: levelNum,
					})
				}

				// Also trigger AI assist if available
				if (onAiAssist) {
					onAiAssist(nodeId, nodeName, nodeDescription, levelNum)
				}
			}

			// Trigger enrichment for all levels
			if (!treeId || !userDetails?.team_id) {
				return
			}

			if (isNodeLoading(nodeId)) {
				return
			}

			triggerEnrichmentStart(nodeId)

			const hasData = await hasNodeEnrichedData(nodeId)
			if (hasData) {
				triggerEnrichmentRefresh(nodeId)
				return
			}

			const treeType = (treeData?.mode || treeMode || "TED").toLowerCase()

			await enrichNodeWithNewStructure(
				nodeId,
				treeId,
				level,
				newPath,
				enrichmentTreeData,
				searchTheme,
				treeType,
				(response: StreamingResponse) => {
					if (
						response.type === "papers" ||
						response.type === "patents" ||
						response.type === "useCases" ||
						response.type === "trl" ||
						response.type === "complete"
					) {
						triggerEnrichmentRefresh(nodeId)
					}
				},
				userDetails.team_id,
			)
		},
		[
			selectedPath,
			scenarios,
			onRowClick,
			onResearchPanelChange,
			onAiAssist,
			treeId,
			userDetails?.team_id,
			treeData?.mode,
			treeMode,
			enrichmentTreeData,
			searchTheme,
			level2Items,
			level3Items,
			level4Items,
			level5Items,
			level6Items,
			level7Items,
			level8Items,
			level9Items,
			level10Items,
		],
	)

	// Pan/zoom state management
	const [panZoomState, setPanZoomState] = useState({
		zoom: 1,
		panX: 0,
		panY: 0,
	})

	const getMindmapPanZoomState = useCallback(() => {
		return panZoomState
	}, [panZoomState])

	const saveMindmapPanZoomState = useCallback(
		(state: { zoom: number; panX: number; panY: number }) => {
			setPanZoomState(state)
		},
		[],
	)

	// Loading state
	if (isLoadingTree) {
		return (
			<div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
					<p className="text-gray-600">{t("mindmap.loading")}</p>
				</div>
			</div>
		)
	}

	return (
		<div
			className="w-full h-full"
			style={{ minHeight: "100%" }}
			data-mindmap-container="true"
		>
			<MindMapContainer
				selectedPath={selectedPath}
				level1Items={level1Items}
				level2Items={level2Items}
				level3Items={level3Items}
				level4Items={level4Items}
				level5Items={level5Items}
				level6Items={level6Items}
				level7Items={level7Items}
				level8Items={level8Items}
				level9Items={level9Items}
				level10Items={level10Items}
				levelNames={levelNames}
				query={searchTheme}
				onNodeClick={handleNodeClick}
				getMindmapPanZoomState={getMindmapPanZoomState}
				saveMindmapPanZoomState={saveMindmapPanZoomState}
				onResearchPanelChange={onResearchPanelChange}
				onAiAssist={onAiAssist}
				treeMode={treeMode}
			/>
		</div>
	)
}
