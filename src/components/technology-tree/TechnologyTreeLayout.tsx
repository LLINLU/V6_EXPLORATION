import { ArrowLeft, FileText } from "lucide-react"
import type React from "react"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable"
import { SidebarProvider } from "@/components/ui/sidebar"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUserDetail } from "@/hooks/useUserDetail"
import type { ChatDisplayMode, ViewMode } from "@/types/tree"
import { ChatAskAIButton } from "./chat/ChatAskAIButton"
import { QueryDisplay } from "./QueryDisplay"
import { QueueStatusDisplay } from "./QueueStatusDisplay"
import { TechTreeLayout } from "./TechTreeLayout"

interface TechnologyTreeLayoutProps {
	viewMode: ViewMode
	showSidebar: boolean
	collapsedSidebar: boolean
	toggleSidebar: () => void

	researchPanelContent: React.ReactNode
	chatboxContent: React.ReactNode
	mainContent: React.ReactNode
	chatBoxOpen: boolean
	chatDisplayMode: ChatDisplayMode
	handleQueueNodeSelect: (nodeId: string) => void
	isFullscreen?: boolean
	query?: string // <-- Add query prop
	treeMode?: string // <-- Add treeMode prop
	treeId?: string
}

const TechnologyTreeLayoutWrapper = memo((props: TechnologyTreeLayoutProps) => {
	const {
		viewMode,
		showSidebar,
		collapsedSidebar,
		toggleSidebar,
		researchPanelContent,
		chatboxContent,
		mainContent,
		chatBoxOpen,
		chatDisplayMode,
		handleQueueNodeSelect,
		//isFullscreen = false,
		isFullscreen, // <-- Receive isFullscreen
		query, // <-- Receive query
		treeMode, // <-- Receive treeMode
		treeId, // <-- Receive treeId
	} = props

	const { userDetails } = useUserDetail()
	const { t } = useTranslation()
	const navigate = useNavigate()
	const isPanelOpen = showSidebar && !collapsedSidebar

	return (
		<SidebarProvider defaultOpen={true}>
			<div
				className={`min-h-screen flex w-full overflow-hidden bg-[#EEEEEE] p-1 gap-1 ${
					viewMode === "mindmap"
						? "tech-tree-page-mindmap"
						: "tech-tree-page-treemap"
				}`}
			>
				{userDetails ? <AppSidebar /> : null}

				<div className="flex-1 overflow-hidden flex flex-col gap-1">
					{/* Query Display Section - appears first */}
					{userDetails ? (
						<div className="bg-white rounded-lg px-4 py-2 flex items-center justify-between flex-shrink-0">
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigate(-1)}
									className="gap-2 text-gray-700 hover:text-gray-900"
								>
									<ArrowLeft className="h-4 w-4" />
									{t("tech_page.back_button")}
								</Button>
							</div>

							<div className="w-1/2 mx-auto">
								<QueryDisplay
									className="mb-0"
									query={query}
									treeMode={treeMode}
								/>
							</div>

							<div className="flex items-center gap-1">
								{" "}
								{/* Wrapper for right-side items */}
								{!isFullscreen && (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													onClick={toggleSidebar}
													disabled={isPanelOpen}
													className="h-8 w-8"
												>
													<FileText className="h-4 w-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent side="bottom">
												<p>
													{isPanelOpen
														? t("tech_page.panel_already_open")
														: t("tech_page.show_panel")}
												</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}
								{!chatBoxOpen && !isFullscreen && <ChatAskAIButton />}
							</div>
						</div>
					) : null}

					<ResizablePanelGroup
						direction="horizontal"
						className="h-full flex-1 "
					>
						<ResizablePanel defaultSize={75} minSize={50}>
							<TechTreeLayout
								showSidebar={showSidebar}
								collapsedSidebar={collapsedSidebar}
								researchPanelContent={researchPanelContent}
								chatboxContent={chatboxContent}
								showChatbox={chatBoxOpen && chatDisplayMode === "panel"}
								isOverlayMode={chatDisplayMode === "overlay"}
								chatBoxOpen={chatBoxOpen}
							>
								{mainContent}
							</TechTreeLayout>
						</ResizablePanel>

						<ResizableHandle withHandle className="bg-transparent" />
					</ResizablePanelGroup>

					<QueueStatusDisplay
						onNodeSelect={handleQueueNodeSelect}
						isChatOpen={chatBoxOpen}
						chatDisplayMode={chatDisplayMode}
					/>
				</div>
			</div>

			{/* Overlay ChatBox - rendered outside the panel structure when in overlay mode */}
			{chatBoxOpen && chatDisplayMode === "overlay" && (
				<div className="fixed inset-0 pointer-events-none z-40">
					<div className="pointer-events-auto">{chatboxContent}</div>
				</div>
			)}
		</SidebarProvider>
	)
})

TechnologyTreeLayoutWrapper.displayName = "TechnologyTreeLayoutWrapper"

export { TechnologyTreeLayoutWrapper }
