import type React from "react"
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react"
import type { TreeNode } from "@/types/tree"

// Types
interface SelectedPath {
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
}

interface SelectedNodeForResearch {
	id: string
	title: string
	description?: string
	level: number
}

interface MindMapData {
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
	query?: string
	selectedPath: SelectedPath
}

interface MindMapState {
	// Layout state
	layoutDirection: "horizontal" | "vertical"
	isControlsCollapsed: boolean
	showNavigation: boolean
	isFullscreen: boolean

	// Selection state
	selectedNodeForHighlight: string | null
	selectedNodeForResearch: SelectedNodeForResearch | null

	// Expansion state
	expandedNodes: Set<string>

	// UI state
	showResearchPanel: boolean
	fullscreenChatOpen: boolean
	cursorStyle: string

	// Search state
	searchValue: string
	searchMode: "TED" | "FAST"

	// Initialization state
	isInitialized: boolean
	lastQuery: string
}

interface MindMapActions {
	// Layout actions
	setLayoutDirection: (direction: "horizontal" | "vertical") => void
	toggleLayout: () => void
	setIsControlsCollapsed: (collapsed: boolean) => void
	toggleControlsCollapse: () => void
	setShowNavigation: (show: boolean) => void
	toggleNavigation: () => void
	setIsFullscreen: (fullscreen: boolean) => void
	toggleFullscreen: () => void

	// Selection actions
	setSelectedNodeForHighlight: (nodeId: string | null) => void
	setSelectedNodeForResearch: (node: SelectedNodeForResearch | null) => void
	updateSelectedNode: (
		nodeId: string,
		level: number,
		nodes: any[],
	) => SelectedNodeForResearch | null

	// Expansion actions
	setExpandedNodes: (
		nodes: Set<string> | ((prev: Set<string>) => Set<string>),
	) => void
	toggleExpand: (nodeId: string, isExpanded: boolean) => void
	handleLevelExpand: (level: number) => void
	handleLevelCollapse: (level: number) => void

	// UI actions
	setShowResearchPanel: (show: boolean) => void
	toggleResearchPanel: () => void
	setFullscreenChatOpen: (open: boolean) => void
	toggleChatPanel: () => void
	setCursorStyle: (style: string) => void

	// Search actions
	setSearchValue: (value: string) => void
	setSearchMode: (mode: "TED" | "FAST") => void

	// Initialization actions
	setIsInitialized: (initialized: boolean) => void
	setLastQuery: (query: string) => void
}

interface MindMapContextValue {
	data: MindMapData
	state: MindMapState
	actions: MindMapActions
}

export const MindMapContext = createContext<MindMapContextValue | undefined>(
	undefined,
)

interface MindMapProviderProps {
	children: ReactNode
	data: MindMapData
	initialFullscreen?: boolean
}

export const MindMapProvider: React.FC<MindMapProviderProps> = ({
	children,
	data,
	initialFullscreen = false,
}) => {
	// State
	const [layoutDirection, setLayoutDirection] = useState<
		"horizontal" | "vertical"
	>("horizontal")
	const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false)
	const [showNavigation, setShowNavigation] = useState<boolean>(true)
	const [isFullscreen, setIsFullscreen] = useState<boolean>(initialFullscreen)

	const [selectedNodeForHighlight, setSelectedNodeForHighlight] = useState<
		string | null
	>(null)
	const [selectedNodeForResearch, setSelectedNodeForResearch] =
		useState<SelectedNodeForResearch | null>(null)

	// Initialize with only root expanded so users can manually open each level
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
		return new Set<string>(["root"])
	})

	const [showResearchPanel, setShowResearchPanel] = useState<boolean>(false)
	const [fullscreenChatOpen, setFullscreenChatOpen] = useState<boolean>(false)
	const [cursorStyle, setCursorStyle] = useState<string>("grab")

	const [searchValue, setSearchValue] = useState<string>(data.query || "")
	const [searchMode, setSearchMode] = useState<"TED" | "FAST">("TED")

	const [isInitialized, setIsInitialized] = useState<boolean>(false)
	const [lastQuery, setLastQuery] = useState<string>("")

	// Reset to root-only when tree data changes so deeper levels are not auto-opened
	useEffect(() => {
		if (data.level1Items && data.level1Items.length > 0) {
			setExpandedNodes((prev) => {
				const newExpanded = new Set<string>(prev)
				newExpanded.add("root")
				return newExpanded
			})
		}
	}, [data.level1Items, data.level1Items?.length])

	// Actions
	const toggleLayout = useCallback(() => {
		setLayoutDirection((prev) =>
			prev === "horizontal" ? "vertical" : "horizontal",
		)
	}, [])

	const toggleControlsCollapse = useCallback(() => {
		setIsControlsCollapsed((prev) => !prev)
	}, [])

	const toggleNavigation = useCallback(() => {
		setShowNavigation((prev) => !prev)
	}, [])
	const toggleFullscreen = useCallback(() => {
		setIsFullscreen((prev) => !prev)
	}, [])

	const updateSelectedNode = useCallback(
		(nodeId: string, level: number, nodes: any[]) => {
			if (level === 0) return null

			setSelectedNodeForHighlight(nodeId)
			const node = nodes.find((n) => n.id === nodeId)

			if (node) {
				const nodeForResearch = {
					id: node.id,
					title: node.name,
					description: node.description,
					level: node.level,
				}
				setSelectedNodeForResearch(nodeForResearch)
				return nodeForResearch
			}
			return null
		},
		[],
	)

	const toggleExpand = useCallback((nodeId: string, isExpanded: boolean) => {
		setExpandedNodes((prev) => {
			const newSet = new Set(prev)
			if (isExpanded) {
				newSet.add(nodeId)
			} else {
				newSet.delete(nodeId)
			}
			return newSet
		})
	}, [])

	const handleLevelExpand = useCallback((_level: number) => {
		// This will be implemented with level data access
		setExpandedNodes((prev) => {
			const newSet = new Set(prev)
			// Level expansion logic will be moved here
			return newSet
		})
	}, [])

	const handleLevelCollapse = useCallback((_level: number) => {
		// This will be implemented with level data access
		setExpandedNodes((prev) => {
			const newSet = new Set(prev)
			// Level collapse logic will be moved here
			return newSet
		})
	}, [])

	const toggleResearchPanel = useCallback(() => {
		setShowResearchPanel((prev) => {
			const newState = !prev

			if (newState && !selectedNodeForResearch) {
				setSelectedNodeForResearch({
					id: "",
					title: "Select a node to view research",
					description:
						"Click on any node in the mindmap to see papers and implementation examples.",
					level: 1,
				})
			}

			return newState
		})
	}, [selectedNodeForResearch])

	const toggleChatPanel = useCallback(() => {
		setFullscreenChatOpen((prev) => !prev)
	}, [])

	// Context value
	const contextValue = useMemo(
		() => ({
			data,
			state: {
				layoutDirection,
				isControlsCollapsed,
				showNavigation,
				isFullscreen,
				selectedNodeForHighlight,
				selectedNodeForResearch,
				expandedNodes,
				showResearchPanel,
				fullscreenChatOpen,
				cursorStyle,
				searchValue,
				searchMode,
				isInitialized,
				lastQuery,
			},
			actions: {
				setLayoutDirection,
				toggleLayout,
				setIsControlsCollapsed,
				toggleControlsCollapse,
				setShowNavigation,
				toggleNavigation,
				setIsFullscreen,
				toggleFullscreen,
				setSelectedNodeForHighlight,
				setSelectedNodeForResearch,
				updateSelectedNode,
				setExpandedNodes,
				toggleExpand,
				handleLevelExpand,
				handleLevelCollapse,
				setShowResearchPanel,
				toggleResearchPanel,
				setFullscreenChatOpen,
				toggleChatPanel,
				setCursorStyle,
				setSearchValue,
				setSearchMode,
				setIsInitialized,
				setLastQuery,
			},
		}),
		[
			data,
			layoutDirection,
			isControlsCollapsed,
			showNavigation,
			isFullscreen,
			selectedNodeForHighlight,
			selectedNodeForResearch,
			expandedNodes,
			showResearchPanel,
			fullscreenChatOpen,
			cursorStyle,
			searchValue,
			searchMode,
			isInitialized,
			lastQuery,
			toggleLayout,
			toggleControlsCollapse,
			toggleNavigation,
			toggleFullscreen,
			updateSelectedNode,
			toggleExpand,
			handleLevelExpand,
			handleLevelCollapse,
			toggleResearchPanel,
			toggleChatPanel,
		],
	)

	return (
		<MindMapContext.Provider value={contextValue}>
			{children}
		</MindMapContext.Provider>
	)
}

export const useMindMap = () => {
	const context = useContext(MindMapContext)
	if (context === undefined) {
		throw new Error("useMindMap must be used within a MindMapProvider")
	}
	return context
}

// Export types for use in other components
export type {
	MindMapData,
	MindMapState,
	MindMapActions,
	SelectedNodeForResearch,
	SelectedPath,
}
