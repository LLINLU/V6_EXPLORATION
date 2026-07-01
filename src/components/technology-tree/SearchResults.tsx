import { useEffect } from "react"
import { useEnrichedData } from "@/hooks/useEnrichedData"
import { TabContent } from "./components/TabContent"

interface SearchResultsProps {
	selectedNodeTitle?: string
	selectedNodeDescription?: string
	selectedNodeId?: string
	activeTab: string
	onTabChange: (value: string) => void
	level?: number
	mode?: "TED" | "FAST"
	onChatToggle?: () => void
	saved_paper_ids: string[]
	saved_case_ids: string[]
	totalPatentsCount?: number
}

export const SearchResults = ({
	selectedNodeTitle,
	selectedNodeDescription,
	selectedNodeId,
	activeTab,
	onTabChange,
	level,
	mode = "TED",
	onChatToggle,
	saved_paper_ids,
	saved_case_ids,
	totalPatentsCount,
}: SearchResultsProps) => {
	// Use enriched data hook for future functionality
	useEnrichedData(selectedNodeId || null)

	useEffect(() => {
		const handleRefresh = (_event: Event) => {
			// console.log("SearchResults component detected refresh event:", event)

			// Reset scroll position for the papers list container
			const papersContainer = document.querySelector("[data-papers-scroll]")
			if (papersContainer) {
				papersContainer.scrollTop = 0
			}

			// Ensure we're on the papers tab
			onTabChange("papers")
		}
		document.addEventListener("refresh-papers", handleRefresh)
		return () => {
			document.removeEventListener("refresh-papers", handleRefresh)
		}
	}, [onTabChange])

	return (
		<div className="h-full flex flex-col bg-white">
			<div className="flex-1 overflow-hidden">
				<TabContent
					activeTab={activeTab}
					selectedNodeId={selectedNodeId}
					selectedNodeTitle={selectedNodeTitle}
					selectedNodeDescription={selectedNodeDescription}
					level={level}
					mode={mode}
					onChatToggle={onChatToggle}
					saved_paper_ids={saved_paper_ids}
					saved_case_ids={saved_case_ids}
					totalPatentsCount={totalPatentsCount}
				/>
			</div>
		</div>
	)
}
