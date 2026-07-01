import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "@/components/ui/use-toast"
import { useTreeGeneration } from "@/hooks/useTreeGeneration"
import { useChatStore } from "@/stores/chatStore"
import { useTreeUIStore } from "@/stores/treeUIStore"
import { useMindMap } from "../MindMapContext"

interface EventCallbacks {
	onNodeClick: (level: string, nodeId: string) => void
	onEditNode?: (
		level: string,
		nodeId: string,
		updatedNode: {
			title: string
			description: string
		},
	) => void
	onDeleteNode?: (level: string, nodeId: string) => void
	onResearchPanelChange?: (isVisible: boolean, nodeData?: any) => void
	onAiAssist?: (
		nodeId?: string,
		nodeTitle?: string,
		nodeDescription?: string,
		level?: number,
	) => void
	onToggleFullscreen?: () => void
}

export const useMindMapEvents = (callbacks: EventCallbacks, nodes: any[]) => {
	const { t } = useTranslation()
	const { state, actions } = useMindMap()
	const navigate = useNavigate()
	const { generateTree, isGenerating } = useTreeGeneration()
	const { setChatBoxOpen } = useTreeUIStore()
	const { setChatDisplayMode } = useChatStore()

	// Node click handler
	const handleNodeClick = useCallback(
		(nodeId: string, level: number) => {
			if (level === 0) return

			// Notify parent component
			callbacks.onNodeClick(`level${level}`, nodeId)

			// Always update node information
			const nodeData = actions.updateSelectedNode(nodeId, level, nodes)

			if (!state.isFullscreen) {
				// Non-fullscreen: Open research panel
				if (nodeData && callbacks.onResearchPanelChange) {
					callbacks.onResearchPanelChange(true, nodeData)
				}
			}
			// In fullscreen: Only node selection (panel open/close is independent)
		},
		[callbacks, actions, nodes, state.isFullscreen],
	)

	// AI Assist handler
	const handleAiAssist = useCallback(
		(nodeId: string, level: number) => {
			if (level === 0) return

			// AI Assistant should behave same as node click
			// 1. Notify parent component
			callbacks.onNodeClick(`level${level}`, nodeId)

			// 2. Always update node information (clear previous selection)
			const nodeData = actions.updateSelectedNode(nodeId, level, nodes)

			// 3. Update research panel (non-fullscreen)
			if (!state.isFullscreen && nodeData && callbacks.onResearchPanelChange) {
				callbacks.onResearchPanelChange(true, nodeData)
			}

			// 4. Open chat panel
			if (!state.isFullscreen) {
				setChatBoxOpen(true)
				setChatDisplayMode("panel")
			} else {
				actions.setFullscreenChatOpen(true)
			}

			// 5. Execute AI Assistant callback
			const node = nodes.find((n) => n.id === nodeId)
			if (node && callbacks.onAiAssist) {
				callbacks.onAiAssist(node.id, node.name, node.description, level)
			} else if (callbacks.onAiAssist) {
				callbacks.onAiAssist()
			}
		},
		[
			callbacks,
			actions,
			nodes,
			state.isFullscreen,
			setChatBoxOpen,
			setChatDisplayMode,
		],
	)

	// Add node handler
	const handleAddNode = useCallback((_nodeId: string, _level: number) => {
		// Add node functionality would be implemented here
		// console.log("Add node:", nodeId, level)
	}, [])

	// Edit node handler
	const handleEditNode = useCallback(
		(
			level: string,
			nodeId: string,
			updatedNode: { title: string; description: string },
		) => {
			if (callbacks.onEditNode) {
				callbacks.onEditNode(level, nodeId, updatedNode)
			}
		},
		[callbacks],
	)

	// Delete node handler
	const handleDeleteNode = useCallback(
		(level: string, nodeId: string) => {
			if (callbacks.onDeleteNode) {
				callbacks.onDeleteNode(level, nodeId)
			}
		},
		[callbacks],
	)

	// Node expansion handler
	const handleToggleExpand = useCallback(
		(nodeId: string, isExpanded: boolean) => {
			actions.toggleExpand(nodeId, isExpanded)
		},
		[actions],
	)

	// Search handlers
	const handleSearchValueChange = useCallback(
		(value: string) => {
			actions.setSearchValue(value)
		},
		[actions],
	)

	const handleSearchModeChange = useCallback(
		(mode: "TED" | "FAST") => {
			actions.setSearchMode(mode)
		},
		[actions],
	)

	const handleSearchSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (!state.searchValue.trim()) {
				toast({
					title: t("tech_page.errorTitle"),
					description: t("tech_page.errorEmptyQuery"),
				})
				return
			}

			try {
				const result = await generateTree(
					state.searchValue.trim(),
					state.searchMode,
				)
				if (result) {
					navigate(`/technology-tree?id=${encodeURIComponent(result.treeId)}`, {
						state: {
							query: state.searchValue.trim(),
							scenario: result.treeStructure?.scenario_inputs?.scenario,
							searchMode: "deep",
							treeData: result.treeStructure,
							treeId: result.treeId,
							fromDatabase: true,
							isGenerating: (result as any).status === "generating",
						},
						replace: true,
					})
				}
			} catch (_error) {
				toast({
					title: t("tech_page.errorGenerationTitle"),
					description: t("tech_page.errorGenerationDesc"),
				})
			}
		},
		[state.searchValue, state.searchMode, generateTree, navigate, t],
	)

	// Layout toggle handler
	const handleToggleLayout = useCallback(() => {
		actions.toggleLayout()
		// Auto center the view after layout change will be handled by parent
	}, [actions])

	// Fullscreen handlers
	const handleToggleFullscreen = useCallback(() => {
		// First toggle the internal fullscreen state
		actions.toggleFullscreen()

		// Also call the callback if provided for compatibility
		if (callbacks.onToggleFullscreen) {
			callbacks.onToggleFullscreen()
		}
	}, [actions, callbacks])

	// Panel toggle handlers for fullscreen mode
	const handleToggleResearchPanelFromNav = useCallback(() => {
		actions.toggleResearchPanel()
	}, [actions])

	const handleToggleChatPanelFromNav = useCallback(() => {
		actions.toggleChatPanel()
	}, [actions])

	// Keyboard event handler
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape" && state.isFullscreen) {
				// First toggle the internal fullscreen state
				actions.toggleFullscreen()

				// Also call the callback if provided for compatibility
				if (callbacks.onToggleFullscreen) {
					callbacks.onToggleFullscreen()
				}
			}

			// Handle Cmd+\ or Ctrl+\ for navigation toggle in fullscreen mode
			if (
				state.isFullscreen &&
				event.key === "\\" &&
				(event.metaKey || event.ctrlKey)
			) {
				event.preventDefault()
				actions.toggleNavigation()
			}
		},
		[state.isFullscreen, callbacks, actions],
	)

	return {
		// Node events
		handleNodeClick,
		handleAiAssist,
		handleAddNode,
		handleEditNode,
		handleDeleteNode,
		handleToggleExpand,

		// Search events
		handleSearchValueChange,
		handleSearchModeChange,
		handleSearchSubmit,

		// Layout events
		handleToggleLayout,

		// Fullscreen events
		handleToggleFullscreen,
		handleToggleResearchPanelFromNav,
		handleToggleChatPanelFromNav,

		// Keyboard events
		handleKeyDown,

		// State
		isGenerating,
	}
}
