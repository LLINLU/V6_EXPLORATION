import { useEffect } from "react"

interface NodeSelectionEffectProps {
	selectedPath: {
		level1: string
		level2: string
		level3: string
		level4?: string
		level5?: string
		level6?: string
		level7?: string
		level8?: string
		level9?: string
		level10?: string
	}
	setShowSidebar: (show: boolean) => void
	setSidebarTab: (tab: string) => void
}

export const useNodeSelectionEffect = ({
	selectedPath,
	setShowSidebar,
	setSidebarTab,
}: NodeSelectionEffectProps) => {
	// Effect to handle node selection and sidebar display
	useEffect(() => {
		// Find the deepest selected level to show in sidebar
		const deepestLevel =
			selectedPath.level10 ||
			selectedPath.level9 ||
			selectedPath.level8 ||
			selectedPath.level7 ||
			selectedPath.level6 ||
			selectedPath.level5 ||
			selectedPath.level4 ||
			selectedPath.level3 ||
			selectedPath.level2 ||
			selectedPath.level1

		if (deepestLevel) {
			setShowSidebar(true)
			setSidebarTab("nodeinfo") // Changed to nodeinfo to show node details

			// Dispatch an event to refresh paper list with the selected node
			const event = new CustomEvent("refresh-papers", {
				detail: { nodeId: deepestLevel },
			})
			document.dispatchEvent(event)
		}
	}, [selectedPath, setShowSidebar, setSidebarTab])
}
