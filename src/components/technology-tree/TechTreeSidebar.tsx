import type React from "react"
import { useEffect, useState } from "react"
import { SidebarContent } from "@/components/technology-tree/SidebarContent"
import { SidebarControls } from "@/components/technology-tree/SidebarControls"
import { useEnrichedData } from "@/hooks/useEnrichedData"
import { useUserDetail } from "@/hooks/useUserDetail"
import { supabase } from "@/integrations/supabase/client"
import { savedItemStore } from "@/stores/savedStore"
import type { ChatMessage, NodeSuggestion } from "@/types/chat"

interface TechTreeSidebarProps {
	sidebarTab: string
	setSidebarTab: (tab: string) => void
	toggleSidebar: () => void
	isExpanded: boolean
	toggleExpand: () => void
	chatMessages: ChatMessage[]
	inputValue: string
	isInteractionEnabled?: boolean
	onInputChange: (value: string) => void
	onSendMessage: () => void
	onUseNode: (suggestion: NodeSuggestion) => void
	onEditNode?: (suggestion: NodeSuggestion) => void
	onRefine?: (suggestion: NodeSuggestion) => void
	onCheckResults?: () => void
	onChatToggle?: () => void
	selectedNodeTitle?: string | null
	selectedNodeDescription?: string | null
	selectedNodeId?: string | null
	selectedPath?: {
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
	searchMode?: string
	isFullscreenMode?: boolean
}

function getPatentCountFromAnalysis(data: unknown): number | undefined {
	if (!data || typeof data !== "object") return undefined
	const analysis = data as any
	const count =
		analysis.patents_count ??
		analysis.patent_count ??
		analysis.analyze_trl?.patents_count ??
		analysis.analyze_trl?.data?.patents_count ??
		analysis.analyze_trl?.report?.patents_count
	return typeof count === "number" && Number.isFinite(count) ? count : undefined
}

export const TechTreeSidebar: React.FC<TechTreeSidebarProps> = ({
	sidebarTab,
	setSidebarTab,
	toggleSidebar,
	isExpanded,
	toggleExpand,
	chatMessages,
	inputValue,
	isInteractionEnabled = true,
	isFullscreenMode: _isFullscreenMode = false,
	onInputChange,
	onSendMessage,
	onUseNode,
	onEditNode,
	onRefine,
	onCheckResults,
	onChatToggle,
	selectedNodeTitle,
	selectedNodeDescription,
	selectedNodeId,
	selectedPath,
	searchMode,
}) => {
	const [activeTab, setActiveTab] = useState("papers")
	const [totalPatentsCount, setTotalPatentsCount] = useState<
		number | undefined
	>()

	const {
		papers,
		patents,
		useCases,
		loadingPapers,
		loadingPatents,
		loadingUseCases,
	} = useEnrichedData(selectedNodeId || null)

	const { userDetails } = useUserDetail()
	const user_id = userDetails?.user_id || ""
	const team_id = userDetails?.team_id || ""

	useEffect(() => {
		void patents.length
		void loadingPatents
		if (!selectedNodeId) {
			setTotalPatentsCount(undefined)
			return
		}
		let cancelled = false
		supabase
			.from("node_analysis")
			.select("data")
			.eq("node_id", selectedNodeId)
			.maybeSingle()
			.then(({ data }) => {
				if (cancelled) return
				setTotalPatentsCount(getPatentCountFromAnalysis(data?.data))
			})
		return () => {
			cancelled = true
		}
	}, [selectedNodeId, patents.length, loadingPatents])

	// UseEffect only runs when the provided arguments in [] change!
	useEffect(() => {
		savedItemStore.setState({ user_id })
		savedItemStore.setState({ team_id })

		const fetch = async () => {
			await savedItemStore.getState().fetchSavedPapers()
			await savedItemStore.getState().fetchSavedCases()
		}

		fetch()
	}, [user_id, team_id])

	// Fetching values from zustand: safe!
	const saved_paper_ids = savedItemStore((state) => state.saved_paper_ids)
	const saved_case_ids = savedItemStore((state) => state.saved_case_ids)

	// Calculate the current level based on selectedPath
	const getCurrentLevel = () => {
		if (!selectedPath) return undefined

		if (selectedPath.level10) return 10
		if (selectedPath.level9) return 9
		if (selectedPath.level8) return 8
		if (selectedPath.level7) return 7
		if (selectedPath.level6) return 6
		if (selectedPath.level5) return 5
		if (selectedPath.level4) return 4
		if (selectedPath.level3) return 3
		if (selectedPath.level2) return 2
		if (selectedPath.level1) return 1

		return undefined
	}

	// Determine mode based on searchMode
	const mode = searchMode === "fast" ? "FAST" : "TED"
	const currentLevel = getCurrentLevel()
	const hasPatentDisplayData =
		(patents ?? []).length > 0 || typeof totalPatentsCount === "number"
	const shouldShowPatentsLoading = loadingPatents && !hasPatentDisplayData
	const shouldShowUseCasesLoading =
		loadingUseCases && (useCases?.length ?? 0) === 0

	return (
		<div className="h-full flex flex-col">
			<SidebarControls
				sidebarTab={sidebarTab}
				setSidebarTab={setSidebarTab}
				toggleSidebar={toggleSidebar}
				isExpanded={isExpanded}
				toggleExpand={toggleExpand}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				papersCount={
					papers.length > 0 ? papers.length : loadingPapers ? undefined : 0
				}
				patentsCount={
					totalPatentsCount ??
					((patents ?? []).length > 0
						? (patents ?? []).length
						: shouldShowPatentsLoading
							? undefined
							: 0)
				}
				useCasesCount={
					(useCases?.length ?? 0) > 0
						? useCases.length
						: shouldShowUseCasesLoading
							? undefined
							: 0
				}
				loadingPapers={loadingPapers}
				loadingPatents={shouldShowPatentsLoading}
				loadingUseCases={shouldShowUseCasesLoading}
			/>

			<div className="flex-1 overflow-hidden">
				<SidebarContent
					sidebarTab={sidebarTab}
					chatMessages={chatMessages}
					inputValue={inputValue}
					isInteractionEnabled={isInteractionEnabled}
					onInputChange={onInputChange}
					onSendMessage={onSendMessage}
					onUseNode={onUseNode}
					onEditNode={onEditNode}
					onRefine={onRefine}
					onCheckResults={onCheckResults}
					selectedNodeTitle={selectedNodeTitle}
					selectedNodeDescription={selectedNodeDescription}
					selectedNodeId={selectedNodeId}
					selectedPath={selectedPath}
					activeTab={activeTab}
					onTabChange={setActiveTab}
					level={currentLevel}
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
