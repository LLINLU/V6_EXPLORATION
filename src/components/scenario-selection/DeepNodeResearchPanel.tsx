import { useCallback } from "react"
import { TechTreeSidebar } from "@/components/technology-tree/TechTreeSidebar"
import { useTreeUIStore } from "@/stores/treeUIStore"

interface DeepNodeResearchPanelProps {
	nodeId: string
	title: string
	description?: string
	level: number
	mode?: "TED" | "FAST"
	selectedPath?: Record<string, string>
	onClose: () => void
}

export function DeepNodeResearchPanel({
	nodeId,
	title,
	description,
	level,
	mode = "TED",
	selectedPath,
	onClose,
}: DeepNodeResearchPanelProps) {
	const { sidebarTab, setSidebarTab, isExpanded, toggleExpand } =
		useTreeUIStore()

	// Prevent chat tab from being active in this panel
	const effectiveSidebarTab = sidebarTab === "chat" ? "papers" : sidebarTab
	const handleSetSidebarTab = useCallback(
		(tab: string) => {
			if (tab === "chat") return
			setSidebarTab(tab)
		},
		[setSidebarTab],
	)

	const formattedPath = selectedPath
		? {
				level1: selectedPath.level1 || "",
				level2: selectedPath.level2 || "",
				level3: selectedPath.level3 || "",
				level4: selectedPath.level4,
				level5: selectedPath.level5,
				level6: selectedPath.level6,
				level7: selectedPath.level7,
				level8: selectedPath.level8,
				level9: selectedPath.level9,
				level10: selectedPath.level10,
			}
		: undefined

	return (
		<div className="flex-1 min-h-0 overflow-hidden">
			<TechTreeSidebar
				sidebarTab={effectiveSidebarTab}
				setSidebarTab={handleSetSidebarTab}
				toggleSidebar={onClose}
				isExpanded={isExpanded}
				toggleExpand={toggleExpand}
				chatMessages={[]}
				inputValue={""}
				onInputChange={() => {}}
				onSendMessage={() => {}}
				onUseNode={() => {}}
				selectedNodeTitle={title}
				selectedNodeDescription={description}
				selectedNodeId={nodeId}
				selectedPath={formattedPath}
				isInteractionEnabled={true}
				isFullscreenMode={false}
			/>
		</div>
	)
}
