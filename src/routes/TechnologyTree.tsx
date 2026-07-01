"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import { useTechTreeSidebarActions } from "@/components/technology-tree/hooks/useTechTreeSidebarActions"
import { TechnologyTreeLayoutWrapper } from "@/components/technology-tree/TechnologyTreeLayout"
import { TechTreeChatComponent } from "@/components/technology-tree/TechTreeChatComponent"
// Components
import { TechTreeMainComponent } from "@/components/technology-tree/TechTreeMainComponent"
import { TechTreeResearchPanelComponent } from "@/components/technology-tree/TechTreeResearchPanelComponent"
import { toast } from "@/components/ui/use-toast"
import { useMessageHandlers } from "@/hooks/tree/handlers/useMessageHandlers"
import { useFullscreenHandlers } from "@/hooks/tree/useFullscreenHandlers"
import { useMindMapView } from "@/hooks/tree/useMindMapView"
import { useNodeInfo } from "@/hooks/tree/useNodeInfo"
import { useNodeSelectionEffect } from "@/hooks/tree/useNodeSelectionEffect"
import { useResearchPanelHandlers } from "@/hooks/tree/useResearchPanelHandlers"
import { useScenarioState } from "@/hooks/tree/useScenarioState"
import { useScrollNavigation } from "@/hooks/tree/useScrollNavigation"
import { useTechnologyTreeMaster } from "@/hooks/tree/useTechnologyTreeMaster"
import { useTreeEnrichmentRefresh } from "@/hooks/tree/useTreeEnrichmentRefresh"
// Custom hooks for separation of concerns
import { useTreeInitialization } from "@/hooks/tree/useTreeInitialization"
import { useTreeOperations } from "@/hooks/tree/useTreeOperations"
import { useTreeScenario } from "@/hooks/tree/useTreeScenario"
import { useTreeScrollEffects } from "@/hooks/tree/useTreeScrollEffects"
import { cleanupName } from "@/hooks/tree/utils/stringCleaner"
import { useLevel1EnrichmentPolling } from "@/hooks/useLevel1EnrichmentPolling"
import { useTreeGeneration } from "@/hooks/useTreeGeneration"
import { useTreeStructurePolling } from "@/hooks/useTreeStructurePolling"
import { useUserDetail } from "@/hooks/useUserDetail"
import { useChatStore } from "@/stores/chatStore"
// Store imports for gradual migration
import { useTreeUIStore } from "@/stores/treeUIStore"
import type { LocationState } from "@/types/tree"
import { convertDatabaseTreeToAppFormat } from "@/utils/databaseTreeConverter"

const TechnologyTreeContent = () => {
	const { t } = useTranslation()
	const [locationState, setLocationState] = useState<LocationState | null>(null)

	const treeGeneration = useTreeGeneration()
	const location = useLocation()
	const treeIdFromUrl = location.search.split("id=")[1]
	const { updateLastViewedAt } = useTreeOperations()

	// Load tree from location state
	const loadFromState = (locationState: any) => {
		const state = {
			query: locationState.query || undefined,
			scenario: locationState.scenario || undefined,
			searchMode: locationState.searchMode || undefined,
			treeId: locationState.treeId || undefined,
			fromDatabase:
				locationState.fromDatabase === true ||
				locationState.fromDatabase === "true" ||
				undefined,
			isDemo:
				locationState.isDemo === true ||
				locationState.isDemo === "true" ||
				undefined,
			selectedKeywords: locationState.selectedKeywords || undefined,
		}
		setLocationState(state)

		// Update last viewed timestamp (fire and forget)
		if (locationState.treeId) {
			updateLastViewedAt(locationState.treeId)
		}
	}

	// Load tree from URL parameter
	const loadFromUrl = async (treeId: string) => {
		const result = await treeGeneration.loadTreeFromDatabase(treeId)
		const state = {
			treeId: treeId,
			fromDatabase: true,
			treeData: result?.treeStructure,
			query: cleanupName(result?.treeData?.name || ""),
			scenario: result?.treeData?.description || "",
			searchMode: result?.treeData?.mode || undefined,
		}
		setLocationState(state)

		// Update last viewed timestamp (fire and forget)
		updateLastViewedAt(treeId)
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: to re-render the tree
	useEffect(() => {
		if (treeIdFromUrl) {
			loadFromUrl(treeIdFromUrl)
		} else if (location.state && typeof location.state === "object") {
			loadFromState(location.state)
		}
	}, [location.state, treeIdFromUrl])

	// Core view mode and context state
	const viewModeHook = useMindMapView()

	const uiStore = useTreeUIStore()

	const chatStore = useChatStore()

	const { userDetails } = useUserDetail()
	const scenarioState = useScenarioState({
		initialScenario: locationState?.scenario,
		initialSearchMode: locationState?.searchMode,
	})

	const treeInitialization = useTreeInitialization({
		loadTreeFromDatabase: treeGeneration.loadTreeFromDatabase,
		setPollingTreeId: treeGeneration.setPollingTreeId,
		state: locationState,
	})

	const applyConvertedTreeData = useCallback(
		async (result: any | null): Promise<boolean> => {
			if (!result?.treeStructure) {
				console.error(`[TechnologyTree] loadTreeFromDatabase returned null`)
				return false
			}

			try {
				const convertedData = await convertDatabaseTreeToAppFormat(
					result.treeStructure,
					{
						description: result.treeData?.description,
						search_theme: result.treeData?.search_theme,
						name: result.treeData?.name,
						mode: (result.treeData as any)?.mode,
					},
				)

				if (!convertedData) {
					console.error(
						`[TechnologyTree] convertDatabaseTreeToAppFormat returned null`,
					)
					return false
				}

				const timestampedData = {
					...convertedData,
					_timestamp: Date.now(),
				}

				// console.log(
				// `[TechnologyTree] Tree reloaded - showing ${convertedData.level1Items?.length || 0} level 1 nodes`,
				// )
				// console.log(
				// `[TechnologyTree] Level 1 node details:`,
				// convertedData.level1Items?.map((c: any) => ({
				// id: c.id,
				// name: c.name,
				// childrenCount: c.children_count || 0,
				// })),
				// )

				treeInitialization.setDatabaseTreeData(timestampedData)
				return true
			} catch (error) {
				console.error(
					`[TechnologyTree] Error converting tree structure:`,
					error,
				)
				return false
			}
		},
		[treeInitialization.setDatabaseTreeData],
	)

	useTreeEnrichmentRefresh({
		treeId: locationState?.treeId,
		databaseTreeData: treeInitialization.databaseTreeData,
		loadTreeFromDatabase: treeGeneration.loadTreeFromDatabase,
		setDatabaseTreeData: treeInitialization.setDatabaseTreeData,
	})
	const scrollNavigation = useScrollNavigation()

	// Memoize empty objects to prevent infinite re-renders
	const emptyLevelItems = useMemo(
		() => ({
			level4Items: {},
			level5Items: {},
			level6Items: {},
			level7Items: {},
			level8Items: {},
			level9Items: {},
			level10Items: {},
		}),
		[],
	)

	useTreeScrollEffects({
		...emptyLevelItems,
		databaseTreeData: treeInitialization.databaseTreeData,
		updateLastVisibleLevel: scrollNavigation.updateLastVisibleLevel,
		triggerScrollUpdate: scrollNavigation.triggerScrollUpdate,
	})

	const technologyTreeMaster = useTechnologyTreeMaster({
		databaseTreeData: treeInitialization.databaseTreeData,
		viewModeHook,
		locationState,
		currentQuery: treeInitialization.currentQuery,
		contextMode: chatStore.contextMode,
		searchMode: scenarioState.searchMode,
	})

	console.log("technology tree showsidebar?", technologyTreeMaster.showSidebar)

	// Sync tree data to store when it changes
	useEffect(() => {
		technologyTreeMaster.syncTreeDataToStore()
	}, [technologyTreeMaster.syncTreeDataToStore])

	const messageHandlers = useMessageHandlers(technologyTreeMaster.nodeContext)

	const techTreeSidebarActions = useTechTreeSidebarActions(
		technologyTreeMaster.addCustomNode,
		uiStore.setSidebarTab,
	)

	// Specialized handlers
	const {
		isFullscreenMode,
		toggleFullscreenMode,
		onAiAssist,
		handleChatToggle,
	} = useFullscreenHandlers()

	const { chatDisplayMode } = chatStore
	const { researchPanelNodeData, handleResearchPanelChange } =
		useResearchPanelHandlers({
			viewMode: viewModeHook.viewMode,
			setSidebarTab: uiStore.setSidebarTab,
			setShowSidebar: uiStore.setShowSidebar,
		})

	// Node selection and effects
	const selectedNodeInfo = useNodeInfo(
		technologyTreeMaster.selectedPath,
		technologyTreeMaster.userClickedNode,
		technologyTreeMaster.level1Items,
		technologyTreeMaster.level2Items,
		technologyTreeMaster.level3Items,
		technologyTreeMaster.level4Items,
		technologyTreeMaster.level5Items,
		technologyTreeMaster.level6Items,
		technologyTreeMaster.level7Items,
		technologyTreeMaster.level8Items,
		technologyTreeMaster.level9Items,
		technologyTreeMaster.level10Items,
	)
	const level1NodeIds =
		technologyTreeMaster.level1Items?.map((item) => item.id) || []
	const enrichmentTreeId = locationState?.treeId || null

	const level1EnrichmentPolling = useLevel1EnrichmentPolling()
	const treeStructurePolling = useTreeStructurePolling()

	// Ref for debouncing tree reloads
	const reloadDebounceRef = useRef<NodeJS.Timeout | null>(null)
	// Ref so the stale timeout closure always reads the current treeId
	const enrichmentTreeIdRef = useRef<string | null>(enrichmentTreeId)
	useEffect(() => {
		enrichmentTreeIdRef.current = enrichmentTreeId
	}, [enrichmentTreeId])

	// Start tree structure polling when tree and level 1 nodes are available
	// biome-ignore lint/correctness/useExhaustiveDependencies: level1NodeIds array reference changes but we only care about length
	useEffect(() => {
		if (!enrichmentTreeId || level1NodeIds.length === 0) {
			// console.log(
			// `[TechnologyTree] Not starting tree structure polling - treeId: ${enrichmentTreeId}, level1NodeIds: ${level1NodeIds.length}`,
			// )
			return
		}

		// console.log(
		// `[TechnologyTree] Starting tree structure polling with ${level1NodeIds.length} nodes`,
		// )

		treeStructurePolling.startPolling(enrichmentTreeId, level1NodeIds, {
			onStructureUpdate: () => {
				// onStructureUpdate - called when ANY individual node gets children
				// console.log(
				// `[TechnologyTree] Tree structure updated, scheduling debounced reload`,
				// )

				// Debounce the reload to prevent rapid successive reloads
				if (reloadDebounceRef.current) {
					clearTimeout(reloadDebounceRef.current)
					// console.log(`[TechnologyTree] Cleared previous reload timeout`)
				}

				reloadDebounceRef.current = setTimeout(() => {
					// console.log(
					// `[TechnologyTree] Debounce completed, reloading tree from database`,
					// )
					const currentTreeId = enrichmentTreeIdRef.current
					if (currentTreeId) {
						treeGeneration
							.loadTreeFromDatabase(currentTreeId)
							.then((result) => applyConvertedTreeData(result))
							.catch((error) => {
								console.error(`[TechnologyTree] Error reloading tree:`, error)
							})
					}
				}, 1500) // Wait 1.5 seconds after last update before reloading
			},
			onAllComplete: () => {
				// onAllComplete - called when ALL level 1 nodes have children
				// console.log(
				// `[TechnologyTree] All scenario nodes complete, showing completion toast`,
				// )

				// Clear any pending reload since we're complete
				if (reloadDebounceRef.current) {
					clearTimeout(reloadDebounceRef.current)
				}

				// Do final reload to ensure all children are displayed
				const currentTreeId = enrichmentTreeIdRef.current
				if (currentTreeId) {
					treeGeneration
						.loadTreeFromDatabase(currentTreeId)
						.then((result) => applyConvertedTreeData(result))
						.then((success) => {
							if (success) {
								toast({
									title: t("tech_page.tree_generation_complete"),
									description: t("tech_page.all_scenario_nodes_generated"),
								})
							}
						})
				}
			},
		})

		return () => {
			treeStructurePolling.stopPolling()
			if (reloadDebounceRef.current) {
				clearTimeout(reloadDebounceRef.current)
				reloadDebounceRef.current = null
			}
		}
	}, [
		enrichmentTreeId,
		level1NodeIds.length,
		treeStructurePolling.startPolling,
		treeStructurePolling.stopPolling,
		applyConvertedTreeData,
	])

	// Start level 1 enrichment polling when tree and level 1 nodes are available
	// biome-ignore lint/correctness/useExhaustiveDependencies: level1NodeIds array reference changes but we only care about length
	useEffect(() => {
		if (!enrichmentTreeId || level1NodeIds.length === 0) {
			return
		}

		// console.log(
		// `[TechnologyTree] Starting level 1 enrichment polling with ${level1NodeIds.length} nodes`,
		// )

		level1EnrichmentPolling.startPolling(enrichmentTreeId, level1NodeIds)

		return () => {
			level1EnrichmentPolling.cleanup()
		}
	}, [
		enrichmentTreeId,
		level1NodeIds.length,
		level1EnrichmentPolling.startPolling,
		level1EnrichmentPolling.cleanup,
	])

	useNodeSelectionEffect({
		selectedPath: technologyTreeMaster.selectedPath,
		setShowSidebar: technologyTreeMaster.setShowSidebar,
		setSidebarTab: uiStore.setSidebarTab,
	})

	// Callbacks and memoized values
	const treeScenario = useTreeScenario({
		currentQuery: treeInitialization.currentQuery,
		locationState,
		userDetails,
		treeMode: technologyTreeMaster.treeMode,
		setPollingTreeId: treeGeneration.setPollingTreeId,
		setDatabaseTreeData: treeInitialization.setDatabaseTreeData,
		setHasLoadedDatabase: treeInitialization.setHasLoadedDatabase,
	})

	// Content components (using new separated components)
	const chatboxContent = (
		<TechTreeChatComponent
			onSendMessage={messageHandlers.handleSendMessage}
			onQuickMessage={messageHandlers.handleSendQuickMessage}
			onUseNode={techTreeSidebarActions.handleUseNode}
			onEditNode={techTreeSidebarActions.handleEditNodeFromChat}
			onRefine={techTreeSidebarActions.handleRefineNode}
			onNodeSelect={technologyTreeMaster.handleNodeSelect}
			researchPanelNodeData={researchPanelNodeData}
			selectedNodeInfo={selectedNodeInfo}
		/>
	)

	const researchPanelContent = (
		<TechTreeResearchPanelComponent
			onSendMessage={messageHandlers.handleSendMessage}
			onUseNode={techTreeSidebarActions.handleUseNode}
			onEditNode={techTreeSidebarActions.handleEditNodeFromChat}
			onRefine={techTreeSidebarActions.handleRefineNode}
			onCheckResults={techTreeSidebarActions.handleCheckResults}
			onChatToggle={handleChatToggle}
			researchPanelNodeData={researchPanelNodeData}
			selectedNodeInfo={selectedNodeInfo}
			selectedPath={technologyTreeMaster.selectedPath}
		/>
	)

	const currentQuery = treeInitialization.currentQuery || locationState?.query
	const currentTreeMode =
		technologyTreeMaster.treeMode ||
		(locationState?.treeData as { mode?: string } | null)?.mode ||
		scenarioState.searchMode

	const mainContent = (
		<TechTreeMainComponent
			locationState={locationState}
			savedConversationHistory={treeInitialization.savedConversationHistory}
			scenario={scenarioState.scenario}
			searchMode={scenarioState.searchMode}
			currentQuery={treeInitialization.currentQuery}
			containerRef={scrollNavigation.containerRef}
			canScrollLeft={scrollNavigation.canScrollLeft}
			canScrollRight={scrollNavigation.canScrollRight}
			lastVisibleLevel={scrollNavigation.lastVisibleLevel}
			handleScrollToStart={scrollNavigation.handleScrollToStart}
			handleScrollToEnd={scrollNavigation.handleScrollToEnd}
			handleGuidanceClick={messageHandlers.handleGuidanceClick}
			handleAddScenario={treeScenario.handleAddScenario}
			isGenerating={treeGeneration.isGenerating}
			handleResearchPanelChange={handleResearchPanelChange}
			onAiAssist={onAiAssist}
			viewMode={viewModeHook.viewMode}
			toggleView={viewModeHook.toggleView}
			setMindmapExpansionState={viewModeHook.setMindmapExpansionState}
			getMindmapExpansionState={viewModeHook.getMindmapExpansionState}
			justSwitchedView={viewModeHook.justSwitchedView}
			clearViewSwitchFlag={viewModeHook.clearViewSwitchFlag}
			saveMindmapPanZoomState={viewModeHook.saveMindmapPanZoomState}
			getMindmapPanZoomState={viewModeHook.getMindmapPanZoomState}
			isFullscreenMode={isFullscreenMode}
			toggleFullscreenMode={toggleFullscreenMode}
			researchPanelContent={researchPanelContent}
			chatboxContent={chatboxContent}
		/>
	)

	return (
		<TechnologyTreeLayoutWrapper
			viewMode={viewModeHook.viewMode}
			showSidebar={technologyTreeMaster.showSidebar}
			collapsedSidebar={uiStore.collapsedSidebar}
			toggleSidebar={uiStore.toggleSidebar}
			researchPanelContent={researchPanelContent}
			chatboxContent={chatboxContent}
			mainContent={mainContent}
			chatBoxOpen={uiStore.chatBoxOpen}
			chatDisplayMode={chatDisplayMode}
			handleQueueNodeSelect={technologyTreeMaster.handleQueueNodeSelect}
			isFullscreen={isFullscreenMode}
			query={currentQuery}
			treeMode={currentTreeMode}
			treeId={locationState?.treeId}
		/>
	)
}

const TechnologyTree = () => {
	return <TechnologyTreeContent />
}

export default TechnologyTree
