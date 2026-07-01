import { Button } from "@/components/ui/button"
import { TabNavigator } from "./components/TabNavigator"

interface SidebarControlsProps {
	sidebarTab: string
	setSidebarTab: (tab: string) => void
	toggleSidebar: () => void
	isExpanded: boolean
	toggleExpand: () => void
	activeTab: string
	onTabChange: (value: string) => void
	papersCount?: number
	patentsCount?: number
	useCasesCount?: number
	loadingPapers?: boolean
	loadingPatents?: boolean
	loadingUseCases?: boolean
}

export const SidebarControls = ({
	toggleSidebar,
	activeTab,
	onTabChange,
	patentsCount,
	papersCount,
	useCasesCount,
	loadingPapers = false,
	loadingPatents = false,

	loadingUseCases = false,
}: SidebarControlsProps) => {
	return (
		<>
			<div className="flex justify-between items-center px-4 pt-3">
				{/* Tab Navigator on the most left */}
				<div className="flex-shrink-0">
					<TabNavigator
						activeTab={activeTab}
						onValueChange={onTabChange}
						papersCount={papersCount}
						patentsCount={patentsCount}
						useCasesCount={useCasesCount}
						loadingPatents={loadingPatents}
						loadingPapers={loadingPapers}
						loadingUseCases={loadingUseCases}
					/>
				</div>

				{/* Control buttons on the right */}
				<div className="flex items-center gap-2 flex-shrink-0">
					<Button variant="ghost" size="icon" onClick={toggleSidebar}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="h-3.5 w-3.5"
						>
							<rect width="18" height="18" x="3" y="3" rx="2"></rect>
							<path d="M15 3v18"></path>
							<path d="m8 9 3 3-3 3"></path>
						</svg>
					</Button>
				</div>
			</div>
			<div className="border-b border-gray-200"></div>
		</>
	)
}
