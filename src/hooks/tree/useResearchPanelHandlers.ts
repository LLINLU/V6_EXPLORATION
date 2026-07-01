import { useCallback, useState } from "react"
import { useTreeUIStore } from "@/stores/treeUIStore"

interface ResearchPanelNodeData {
	id: string
	title: string
	description?: string
	level: number
}

interface UseResearchPanelHandlersProps {
	viewMode: string
	setSidebarTab: (tab: string) => void
	setShowSidebar: (show: boolean) => void
}

export const useResearchPanelHandlers = ({
	viewMode,
	setSidebarTab,
	setShowSidebar,
}: UseResearchPanelHandlersProps) => {
	const [researchPanelNodeData, setResearchPanelNodeData] =
		useState<ResearchPanelNodeData | null>(null)

	const handleResearchPanelChange = useCallback(
		(isVisible: boolean, nodeData?: ResearchPanelNodeData) => {
			if (!isVisible) {
				setResearchPanelNodeData(null)
				if (viewMode === "mindmap") {
					setSidebarTab("result")
				}
			} else if (nodeData) {
				setResearchPanelNodeData(nodeData)
				if (viewMode === "mindmap") {
					setShowSidebar(true)
					// make sure the sidebar is not collapsed when opened
					useTreeUIStore.setState({ collapsedSidebar: false })
					setSidebarTab("result")
				}
			}
		},
		[viewMode, setSidebarTab, setShowSidebar],
	)

	return {
		researchPanelNodeData,
		handleResearchPanelChange,
	}
}
