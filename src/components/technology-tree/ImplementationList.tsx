import type { Tables } from "@/integrations/supabase/types/database.types"
import type { CasesWithSaved } from "@/integrations/supabase/types/more_types"
import { ImplementationCard } from "./ImplementationCard"

type useCasesData = Tables<"node_use_cases">
type NodeUseCases = Omit<useCasesData, "saved"> & { saved: boolean }

interface ImplementationListProps {
	selectedNodeId?: string
	useCases: NodeUseCases[]
	loadingUseCases: boolean
	toggleCase: (paper: CasesWithSaved) => void
}

export const ImplementationList = ({
	selectedNodeId,
	useCases,
	loadingUseCases,
	toggleCase,
}: ImplementationListProps) => {
	// Show loading state only when use cases are loading
	// Papers loading shouldn't block use cases from displaying
	if (
		selectedNodeId &&
		loadingUseCases &&
		(!useCases || useCases.length === 0)
	) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		)
	}
	if (selectedNodeId && useCases && useCases.length > 0) {
		return (
			<div className="space-y-4">
				{useCases.map((useCase) => (
					<ImplementationCard
						key={useCase.id}
						title={useCase.product}
						description={useCase.description}
						company={useCase.company}
						releases={useCase.press_releases.length}
						badgeColor="bg-[#E8F1FF]"
						badgeTextColor="text-[#0EA5E9]"
						pressReleases={useCase.press_releases.map((url, index) => {
							// Try to extract a meaningful title from the URL or use a default
							try {
								const urlObj = new URL(url)
								const title = `${urlObj.hostname}`
								return {
									title: title,
									url: url,
								}
							} catch {
								// If URL is invalid, just use a default title
								return {
									title: `プレスリリース ${index + 1}`,
									url: url,
								}
							}
						})}
						saved={useCase.saved ?? false}
						toggleCase={() => toggleCase(useCase)}
					/>
				))}
			</div>
		)
	}

	// Show empty state when no node is selected
	if (!selectedNodeId) {
		return (
			<div className="flex items-center justify-center py-8">
				<p className="text-gray-500 text-sm">ノードを選択して実装事例を表示</p>
			</div>
		)
	}

	// Show empty state when node is selected but no data is available
	return (
		<div className="flex items-center justify-center py-8">
			<p className="text-gray-500 text-sm">
				この技術の実装事例はまだありません
			</p>
		</div>
	)
}
