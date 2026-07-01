import { create } from "zustand"
import type { Tables } from "@/integrations/supabase/types/database.types"
import type { ChatMessage, NodeSuggestion } from "@/types/chat"
import type { ChatDisplayMode, ContextMode, SelectedNode } from "@/types/tree"

interface ChatState {
	// Chat messages and input
	chatMessages: ChatMessage[]
	inputValue: string
	isLoading: boolean

	// Chat modes and context
	contextMode: ContextMode
	chatDisplayMode: ChatDisplayMode
	availableNodes: NodeSuggestion[]
	// nodeContext removed - components should use useChatContext hook directly

	// Node selection (from useChatContextStore)
	clickedNode: SelectedNode | null
	mentionedNodes: SelectedNode[]
	selectedNodes: SelectedNode[] // Computed: mentionedNodes if available, otherwise clickedNode as array
}

interface ChatActions {
	// Chat state setters
	setChatMessages: (messages: ChatMessage[]) => void
	addChatMessage: (message: ChatMessage) => void
	setInputValue: (value: string) => void
	setIsLoading: (loading: boolean) => void
	setContextMode: (mode: ContextMode) => void
	setChatDisplayMode: (mode: ChatDisplayMode) => void
	setAvailableNodes: (nodes: NodeSuggestion[]) => void
	// setNodeContext removed - components should use useChatContext hook directly

	// Node selection actions (from useChatContextStore)
	setClickedNode: (nodeId: string | null, nodeTitle: string | null) => void
	addMentionedNode: (nodeId: string, nodeTitle: string) => void
	resetSelectedNodesToCurrentNode: () => void
	setNodePapers: (nodeId: string, papers: Tables<"node_papers">[]) => void
	setNodeUseCases: (
		nodeId: string,
		useCases: Tables<"node_use_cases">[],
	) => void

	// Input actions
	handleInputChange: (value: string) => void
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => {
	// Internal helper function for updating selectedNodes
	const updateSelectedNodes = () => {
		const state = get()
		const newSelectedNodes =
			state.mentionedNodes.length > 0
				? state.mentionedNodes
				: state.clickedNode
					? [state.clickedNode]
					: []
		set({ selectedNodes: newSelectedNodes })
	}

	return {
		// Chat state
		chatMessages: [],
		inputValue: "",
		isLoading: false,
		contextMode: "papers",
		chatDisplayMode: "panel",
		availableNodes: [],
		// nodeContext removed - use useChatContext hook instead

		// Node selection state (from useChatContextStore)
		clickedNode: null,
		mentionedNodes: [],
		selectedNodes: [],

		// Chat actions
		setChatMessages: (messages) => set({ chatMessages: messages }),
		addChatMessage: (message) =>
			set((state) => ({
				chatMessages: [...state.chatMessages, message],
			})),
		setInputValue: (value) => set({ inputValue: value }),
		setIsLoading: (loading) => set({ isLoading: loading }),
		setContextMode: (mode) => set({ contextMode: mode }),
		setChatDisplayMode: (mode) => set({ chatDisplayMode: mode }),
		setAvailableNodes: (nodes) => set({ availableNodes: nodes }),
		// setNodeContext removed - components use useChatContext hook directly

		// Node selection actions (from useChatContextStore)
		setClickedNode: (nodeId, nodeTitle) => {
			const state = get()
			// Preserve existing papers and useCases data if the same node is being updated
			const existingNode = state.clickedNode
			const newClickedNode =
				nodeId && nodeTitle
					? {
							id: nodeId,
							title: nodeTitle,
							// Preserve existing data if this is the same node
							...(existingNode &&
								existingNode.id === nodeId && {
									papers: existingNode.papers,
									useCases: existingNode.useCases,
								}),
						}
					: null

			set({
				clickedNode: newClickedNode,
				selectedNodes:
					state.mentionedNodes.length > 0
						? state.mentionedNodes
						: newClickedNode
							? [newClickedNode]
							: [],
			})
		},

		addMentionedNode: (nodeId, nodeTitle) => {
			const current = get()
			const isAlreadyMentioned = current.mentionedNodes.some(
				(node) => node.id === nodeId || node.title === nodeTitle,
			)

			if (!isAlreadyMentioned) {
				const newMentionedNodes = [
					...current.mentionedNodes,
					{ id: nodeId, title: nodeTitle },
				]
				set({ mentionedNodes: newMentionedNodes })
				updateSelectedNodes()
			}
		},

		resetSelectedNodesToCurrentNode: () => {
			set({ mentionedNodes: [] })
			updateSelectedNodes()
		},

		setNodePapers: (nodeId, papers) => {
			// console.log("setNodePapers", nodeId, papers)
			const state = get()

			// Update clickedNode if it matches
			if (state.clickedNode && state.clickedNode.id === nodeId) {
				const updatedClickedNode = { ...state.clickedNode, papers }
				set({
					clickedNode: updatedClickedNode,
					// Update selectedNodes directly to include the new papers data
					selectedNodes:
						state.mentionedNodes.length > 0
							? state.mentionedNodes.map((node) =>
									node.id === nodeId ? { ...node, papers } : node,
								)
							: [updatedClickedNode],
				})
			}

			// Update mentionedNodes if any match
			const updatedMentionedNodes = state.mentionedNodes.map((node) =>
				node.id === nodeId ? { ...node, papers } : node,
			)
			if (
				updatedMentionedNodes.some(
					(node, index) => node !== state.mentionedNodes[index],
				)
			) {
				set({
					mentionedNodes: updatedMentionedNodes,
					selectedNodes:
						updatedMentionedNodes.length > 0
							? updatedMentionedNodes
							: state.selectedNodes,
				})
			}
		},

		setNodeUseCases: (nodeId, useCases) => {
			const state = get()

			// Update clickedNode if it matches
			if (state.clickedNode && state.clickedNode.id === nodeId) {
				const updatedClickedNode = { ...state.clickedNode, useCases }
				set({
					clickedNode: updatedClickedNode,
					// Update selectedNodes directly to include the new useCases data
					selectedNodes:
						state.mentionedNodes.length > 0
							? state.mentionedNodes.map((node) =>
									node.id === nodeId ? { ...node, useCases } : node,
								)
							: [updatedClickedNode],
				})
			}

			// Update mentionedNodes if any match
			const updatedMentionedNodes = state.mentionedNodes.map((node) =>
				node.id === nodeId ? { ...node, useCases } : node,
			)
			if (
				updatedMentionedNodes.some(
					(node, index) => node !== state.mentionedNodes[index],
				)
			) {
				set({
					mentionedNodes: updatedMentionedNodes,
					selectedNodes:
						updatedMentionedNodes.length > 0
							? updatedMentionedNodes
							: state.selectedNodes,
				})
			}
		},

		// Input actions
		handleInputChange: (value: string) => {
			set({ inputValue: value })
		},
	}
})
