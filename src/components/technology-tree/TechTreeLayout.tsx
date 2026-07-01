import React from "react"
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable"

interface TechTreeLayoutProps {
	children: React.ReactNode
	researchPanelContent: React.ReactNode
	chatboxContent?: React.ReactNode
	showSidebar: boolean
	collapsedSidebar: boolean

	showChatbox: boolean
	chatBoxOpen: boolean
	isOverlayMode: boolean
}

export const TechTreeLayout: React.FC<TechTreeLayoutProps> = ({
	children,
	researchPanelContent,
	chatboxContent,
	showSidebar,
	collapsedSidebar,

	showChatbox,
	chatBoxOpen,
	isOverlayMode,
}) => {
	const isSidebarVisible = showSidebar && !collapsedSidebar
	const shouldShowResearchPanel = isSidebarVisible
	const shouldShowChatPanel = showChatbox && !isOverlayMode

	return (
		<div className="h-full overflow-hidden tech-tree-layout">
			<ResizablePanelGroup
				direction="horizontal"
				className="h-full gap-0.5"
				autoSaveId="tech-tree-layout"
			>
				{/* Main Content - always present */}
				<ResizablePanel
					id="main-content"
					order={1}
					className="rounded-lg overflow-hidden"
					defaultSize={
						shouldShowResearchPanel || shouldShowChatPanel
							? shouldShowResearchPanel && shouldShowChatPanel
								? 50
								: 75
							: 100
					}
					minSize={shouldShowResearchPanel || shouldShowChatPanel ? 30 : 100}
					maxSize={
						shouldShowResearchPanel || shouldShowChatPanel ? undefined : 100
					}
				>
					{React.isValidElement(children)
						? React.cloneElement(children as React.ReactElement<any>, {
								chatBoxOpen,
							})
						: children}
				</ResizablePanel>

				{/* Research Panel - conditionally visible */}
				{shouldShowResearchPanel && (
					<>
						<ResizableHandle className="w-0 opacity-0 cursor-col-resize !opacity-0 !bg-transparent after:!hidden" />
						<ResizablePanel
							id="research-panel"
							order={2}
							className="rounded-lg overflow-hidden bg-white"
							defaultSize={25}
							minSize={20}
							maxSize={35}
						>
							{researchPanelContent}
						</ResizablePanel>
					</>
				)}

				{/* Chat Panel - conditionally visible */}
				{shouldShowChatPanel && (
					<>
						<ResizableHandle className="w-0 opacity-0 cursor-col-resize !opacity-0 !bg-transparent after:!hidden" />
						<ResizablePanel
							id="chat-panel"
							order={3}
							className="rounded-lg overflow-hidden bg-white"
							defaultSize={25}
							minSize={20}
							maxSize={35}
						>
							{chatboxContent}
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	)
}
