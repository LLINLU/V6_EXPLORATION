import { useCallback } from "react"
import type { Tables } from "@/integrations/supabase/types/database.types"
import { useChatStore } from "@/stores/chatStore"

type NodePapers = Tables<"node_papers">
type NodeUseCases = Tables<"node_use_cases">

interface NodeSelectionParams {
	onTreeNodeClick: (level: string, nodeId: string) => void
	onEnrichNode: (
		nodeId: string,
		nodeLevel: number,
		onComplete?: () => void,
	) => void
	onFetchAndSetContext: (
		nodeIds: string[],
	) => Promise<{ papers: NodePapers[]; useCases: NodeUseCases[] }>
	availableNodes?: Array<{
		id: string
		title: string
		level: number
		description?: string
	}>
}

/**
 * Hook for unified node selection management
 * Handles all types of node interactions (tree clicks, mentions, queue selections)
 */
export const useNodeSelection = ({
	onTreeNodeClick,
	onEnrichNode,
	onFetchAndSetContext,
	availableNodes = [],
}: NodeSelectionParams) => {
	const {
		addMentionedNode,
		selectedNodes,
		setNodePapers,
		setNodeUseCases,
		setClickedNode,
	} = useChatStore()

	const handleSetNodePapersAndUseCasesByEnrichment = useCallback(
		(nodeId: string, level: number) => {
			// console.log(
			// "[NODE_CLICK] Starting enrichment for node:",
			// nodeId,
			// "level:",
			// level,
			// )

			// First, immediately fetch and set context (don't wait for enrichment)
			onFetchAndSetContext([nodeId])
				.then(({ papers, useCases }) => {
					// console.log(
					// "[NODE_CLICK] Fetched papers:",
					// papers.length,
					// "useCases:",
					// useCases.length,
					// "for node:",
					// nodeId,
					// )
					setNodePapers(nodeId, papers)
					setNodeUseCases(nodeId, useCases)
				})
				.catch((error) => {
					console.error("[NODE_CLICK] Failed to fetch context:", error)
				})

			// Then trigger enrichment (if needed)
			onEnrichNode(nodeId, level, async () => {
				// console.log("[NODE_CLICK] Enrichment complete for node:", nodeId)
				const { papers, useCases } = await onFetchAndSetContext([nodeId])
				// console.log(
				// "[NODE_CLICK] Updated papers:",
				// papers.length,
				// "useCases:",
				// useCases.length,
				// "for node:",
				// nodeId,
				// )
				setNodePapers(nodeId, papers)
				setNodeUseCases(nodeId, useCases)
			})
		},
		[onEnrichNode, onFetchAndSetContext, setNodePapers, setNodeUseCases],
	)

	// Handle tree node click (navigational)
	const handleTreeNodeClick = useCallback(
		(level: string, nodeId: string) => {
			// Call the original node click handler
			onTreeNodeClick(level, nodeId)

			// Find the node title from available nodes
			const node = availableNodes.find((n) => n.id === nodeId)
			if (node) {
				// Set as clicked node in chat context
				setClickedNode(nodeId, node.title)
				// console.log("[NODE_CLICK] Set clicked node:", nodeId, node.title)
			} else {
				// console.warn("[NODE_CLICK] Node not found in availableNodes:", nodeId)
				// Still set the clicked node with just the ID
				setClickedNode(nodeId, nodeId)
			}

			// Enrich and set papers/use cases
			// Extract numeric level from "level1", "level2", etc.
			const numericLevel = parseInt(level.replace("level", ""))
			handleSetNodePapersAndUseCasesByEnrichment(nodeId, numericLevel)
		},
		[
			onTreeNodeClick,
			handleSetNodePapersAndUseCasesByEnrichment,
			availableNodes,
			setClickedNode,
		],
	)

	// Handle @ mention node selection (adds to chat context)
	const handleMentionNodeSelect = useCallback(
		async (node: { id: string; title: string; level: number }) => {
			if (!node || !node.id || !node.title) {
				// console.warn("[useNodeSelection] Invalid node provided:", node)
				return
			}

			// Add to chat context
			addMentionedNode(node.id, node.title)
			// Enrich the node if needed and update context
			handleSetNodePapersAndUseCasesByEnrichment(node.id, node.level)
		},
		[addMentionedNode, handleSetNodePapersAndUseCasesByEnrichment],
	)

	// Handle queue-based node selection (for enrichment queue)
	const handleQueueNodeSelect = useCallback((_nodeId: string) => {
		// Find the node in available nodes to get title and level
		// This is a simplified implementation - you might need to pass more context
		// console.log("[NODE_SELECTION] Queue node selected:", nodeId)
		// Implementation depends on queue system requirements
	}, [])

	return {
		// Individual handlers for backward compatibility
		handleTreeNodeClick,
		handleMentionNodeSelect,
		handleQueueNodeSelect,

		// Selection state
		selectedNodes,
		hasSelectedNodes: selectedNodes.length > 0,
	}
}
