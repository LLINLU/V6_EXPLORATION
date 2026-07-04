import { create } from "zustand"
import type { ViewMode } from "@/types/tree"

interface TreeUIState {
	// View mode
	viewMode: ViewMode
	isFullscreenMode: boolean

	// Sidebar
	sidebarTab: string
	showSidebar: boolean
	collapsedSidebar: boolean
	isExpanded: boolean

	// Navigation
	canScrollLeft: boolean
	canScrollRight: boolean
	lastVisibleLevel: number

	// Alerts
	showFallbackAlert: boolean

	// Mind map state
	mindmapExpansionState: Set<string>
	mindmapPanZoomState: { zoom: number; panX: number; panY: number }
	justSwitchedView: boolean

	// Chat UI state
	chatBoxOpen: boolean

	// TRL color mode
	trlColorMode: boolean
}

interface TreeUIActions {
	// View mode actions
	toggleView: () => void
	toggleFullscreenMode: () => void

	// Sidebar actions
	setSidebarTab: (tab: string) => void
	toggleSidebar: () => void
	setShowSidebar: (show: boolean) => void
	toggleExpand: () => void

	// Navigation actions
	setScrollState: (
		canLeft: boolean,
		canRight: boolean,
		lastVisible: number,
	) => void

	// Alert actions
	setShowFallbackAlert: (show: boolean) => void

	// Mind map actions
	setMindmapExpansionState: (state: Set<string>) => void
	getMindmapExpansionState: () => Set<string>
	saveMindmapPanZoomState: (state: {
		zoom: number
		panX: number
		panY: number
	}) => void
	getMindmapPanZoomState: () => { zoom: number; panX: number; panY: number }
	clearViewSwitchFlag: () => void

	// Chat UI actions
	setChatBoxOpen: (open: boolean) => void
	toggleChatBoxOpen: () => void

	// TRL color mode
	toggleTrlColorMode: () => void
	setTrlColorMode: (on: boolean) => void

	// Initialization action (from useTreeEffects)
	initializeUI: () => void
}

export const useTreeUIStore = create<TreeUIState & TreeUIActions>(
	(set, get) => ({
		// Initial state
		viewMode: "treemap",
		isFullscreenMode: false,
		sidebarTab: "chat",
		showSidebar: false,
		collapsedSidebar: false,
		isExpanded: false,
		canScrollLeft: false,
		canScrollRight: false,
		lastVisibleLevel: 3,
		showFallbackAlert: false,
		mindmapExpansionState: new Set(),
		mindmapPanZoomState: { zoom: 1, panX: 0, panY: 0 },
		justSwitchedView: false,
		chatBoxOpen: false,
		trlColorMode: false,

		// Actions
		toggleView: () =>
			set((state) => ({
				viewMode: state.viewMode === "treemap" ? "mindmap" : "treemap",
				justSwitchedView: true,
			})),

		toggleFullscreenMode: () =>
			set((state) => ({
				isFullscreenMode: !state.isFullscreenMode,
			})),

		setSidebarTab: (tab: string) => set({ sidebarTab: tab }),

		toggleSidebar: () =>
			set((state) => {
				// If collapsed, expand it
				if (state.collapsedSidebar) {
					return { showSidebar: true, collapsedSidebar: false }
				}
				// If visible, collapse it
				if (state.showSidebar) {
					return { showSidebar: false, collapsedSidebar: true }
				}
				// If hidden, show it
				return { showSidebar: true, collapsedSidebar: false }
			}),

		setShowSidebar: (show: boolean) => set({ showSidebar: show }),

		toggleExpand: () => set((state) => ({ isExpanded: !state.isExpanded })),

		setScrollState: (
			canLeft: boolean,
			canRight: boolean,
			lastVisible: number,
		) =>
			set({
				canScrollLeft: canLeft,
				canScrollRight: canRight,
				lastVisibleLevel: lastVisible,
			}),

		setShowFallbackAlert: (show: boolean) => set({ showFallbackAlert: show }),

		setMindmapExpansionState: (state: Set<string>) =>
			set({ mindmapExpansionState: state }),
		getMindmapExpansionState: () => get().mindmapExpansionState,

		saveMindmapPanZoomState: (state: {
			zoom: number
			panX: number
			panY: number
		}) => set({ mindmapPanZoomState: state }),
		getMindmapPanZoomState: () => get().mindmapPanZoomState,

		clearViewSwitchFlag: () => set({ justSwitchedView: false }),

		// Chat UI actions
		setChatBoxOpen: (open: boolean) => set({ chatBoxOpen: open }),
		toggleChatBoxOpen: () =>
			set((state) => ({ chatBoxOpen: !state.chatBoxOpen })),

		toggleTrlColorMode: () =>
			set((state) => ({ trlColorMode: !state.trlColorMode })),
		setTrlColorMode: (on: boolean) => set({ trlColorMode: on }),

		// Initialization action (from useTreeEffects)
		initializeUI: () => {
			// Import here to avoid circular dependency
			import("@/components/ui/tabs").then(({ updateTabsHorizontalState }) => {
				updateTabsHorizontalState("result")
			})

			set({
				sidebarTab: "result",
			})

			// Set page title
			document.title = "研究背景を整理します | Technology Tree"
		},
	}),
)
