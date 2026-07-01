import { ScenarioPaperPanel } from "@/components/scenario/side-panel/ScenarioSidePanel"
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable"
import type { TechCharacteristic } from "@/types/axis"
import type { Scenario } from "@/types/scenario"

type Props = {
	selectedScenario: Scenario
	effectiveMode: "TED" | "FAST"
	treeId: string
	query: string
	selectedTechCharacteristics: TechCharacteristic[]
	scenariosCount: number
	displayMode: "table" | "mindmap"
	paperPanelActiveTab: string
	resizeHandleDragging: boolean
	setResizeHandleDragging: React.Dispatch<React.SetStateAction<boolean>>
	setIsPanelExpanded: React.Dispatch<React.SetStateAction<boolean>>
	setPaperPanelActiveTab: React.Dispatch<React.SetStateAction<string>>
	onClose: () => void
	onCountsChange?: (counts: {
		papers: number
		patents: number
		useCases: number
	}) => void
}

export function ScenarioPaperPanelContainer({
	selectedScenario,
	effectiveMode,
	treeId,
	query,
	selectedTechCharacteristics,
	scenariosCount,
	displayMode,
	paperPanelActiveTab,
	resizeHandleDragging,
	setResizeHandleDragging,
	setIsPanelExpanded,
	setPaperPanelActiveTab,
	onClose,
	onCountsChange,
}: Props) {
	return (
		<>
			<div className="flex items-center justify-center w-1 self-stretch">
				<ResizableHandle
					className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors flex-1 self-stretch"
					onDragging={(dragging) => setResizeHandleDragging(dragging)}
				/>
			</div>

			<ResizablePanel
				id="scenario-paper-panel"
				order={2}
				defaultSize={40}
				minSize={20}
				maxSize={50}
				collapsible={true}
				collapsedSize={0}
				onCollapse={onClose}
				className="bg-white rounded-lg overflow-hidden"
			>
				<ScenarioPaperPanel
					key={selectedScenario?.id}
					scenario={selectedScenario}
					mode={effectiveMode}
					treeId={treeId}
					userQuery={query}
					technologies={selectedTechCharacteristics?.map((tc) => ({
						tech_name: tc.name,
						tech_definition: tc.description,
					}))}
					onClose={onClose}
					onExpandSummary={() => setIsPanelExpanded(true)}
					externalActiveTab={paperPanelActiveTab}
					onActiveTabChange={setPaperPanelActiveTab}
					showTechSeedsTab={displayMode === "table"}
					scenariosCount={scenariosCount}
					onCountsChange={onCountsChange}
				/>
			</ResizablePanel>
		</>
	)
}
