import { useMemo } from "react"
import type { Tables } from "@/integrations/supabase/types/database.types"
import { useChatStore } from "@/stores/chatStore"
import type { ContextMode, NodeContext } from "@/types/tree"

type NodePapers = Tables<"node_papers">
type NodeUseCases = Tables<"node_use_cases">

interface ChatContextParams {
	contextMode: ContextMode
}

/**
 * Hook for creating chat context from selected nodes
 * Generates formatted text for AI conversations based on node data
 */
export const useChatContext = ({ contextMode }: ChatContextParams) => {
	// Use selective subscription to avoid unnecessary re-renders
	const selectedNodes = useChatStore((state) => state.selectedNodes)

	// Create formatted chat context from selected nodes
	const nodeContext = useMemo(() => {
		let contextText = ""
		let nodeTitle = ""
		// Handle node titles
		if (selectedNodes.length > 0) {
			if (selectedNodes.length === 1) {
				nodeTitle = selectedNodes[0].title
				contextText += `Query: ${nodeTitle}\n\n`
			} else {
				nodeTitle = selectedNodes.map((node) => node.title).join(", ")
				contextText += `Query: ${nodeTitle}\n\n`
				contextText += `複数ノード選択:\n`
				selectedNodes.forEach((node, index) => {
					contextText += `${index + 1}. ${node.title}\n`
				})
				contextText += `\n`
			}
		}

		// Collect all papers and use cases from selected nodes
		const allPapers: NodePapers[] = []
		const allUseCases: NodeUseCases[] = []

		selectedNodes.forEach((node) => {
			if (node.papers) {
				allPapers.push(...(node.papers as NodePapers[]))
			}
			if (node.useCases) {
				allUseCases.push(...(node.useCases as NodeUseCases[]))
			}
		})
		// Add papers information based on contextMode
		if (
			(contextMode === "both" || contextMode === "papers") &&
			allPapers.length > 0
		) {
			contextText += `参考論文:\n`
			allPapers.forEach((paper) => {
				contextText += `- Title:${paper.title}\n`
				if (paper.authors) {
					contextText += `著者: ${paper.authors} `
				}
				if (paper.journal) {
					contextText += `掲載誌: ${paper.journal} `
				}
				if (paper.date) {
					contextText += `発表年: ${paper.date} `
				}
				if (paper.doi) {
					contextText += `DOI: ${paper.doi}`
				}
				contextText += `\n`
			})
			contextText += `\n`
		}

		// Add use cases information based on contextMode
		if (
			(contextMode === "both" || contextMode === "cases") &&
			allUseCases.length > 0
		) {
			contextText += `事例:\n`
			allUseCases.forEach((useCase) => {
				contextText += `- 製品名: ${useCase.product} `
				if (useCase.description) {
					contextText += `説明: ${useCase.description} `
				}
				if (useCase.company && useCase.company.length > 0) {
					contextText += `企業: ${useCase.company.join(", ")} `
				}
				if (useCase.press_releases && useCase.press_releases.length > 0) {
					contextText += `URLs: ${useCase.press_releases.join(", ")}`
				}
				contextText += `\n`
			})
		}

		const finalContextText = contextText.trim()

		if (!finalContextText && !nodeTitle) {
			return {
				selectedNodes: [],
				contextText: "",
				contextMode,
			} as NodeContext
		}

		return {
			selectedNodes:
				selectedNodes.length > 0
					? selectedNodes
					: [{ id: nodeTitle, title: nodeTitle }],
			contextText: finalContextText || undefined,
			contextMode,
		} as NodeContext
	}, [selectedNodes, contextMode])

	return {
		nodeContext,
		selectedNodes,
		selectedNodesCount: selectedNodes.length,
		hasSelectedNodes: selectedNodes.length > 0,
	}
}
