import { useLocation } from "react-router-dom"

interface ScenarioSectionProps {
	scenario?: string
	conversationHistory?: any[]
	onGuidanceClick?: (type: string) => void
	treeMode?: string
}

export const ScenarioSection = ({
	scenario,
	treeMode,
}: ScenarioSectionProps) => {
	const location = useLocation()

	// Get searchMode from location state - if it's not defined or is "deep", show the section
	// 'quick' mode means user came directly from home page, hide the section
	// any other mode (e.g. "deep", undefined) means user came from research-context, show the section
	const searchMode = location.state?.searchMode
	// If searchMode is "quick", don't render the component
	if (searchMode === "quick") {
		return null
	}

	// Only render if scenario exists and is not empty
	if (!scenario || scenario.trim() === "") {
		return null
	}

	// Dynamic labels based on tree mode
	const labels =
		treeMode === "FAST"
			? {
					title: "技術の構成要素：",
					editTitle: "Technologyを編集",
					editScreenReader: "Technologyを編集",
				}
			: {
					title: "研究シナリオ：",
					editTitle: "シナリオを編集",
					editScreenReader: "シナリオを編集",
				}

	return (
		<div
			className={`${treeMode === "FAST" ? "bg-[#f6f4fb]" : "bg-blue-50"} rounded-lg p-6 py-[12px] px-[16px] mt-4`}
			style={{ marginBottom: "4px" }}
		>
			<div>
				<h2
					className={`text-sm font-medium ${treeMode === "FAST" ? "text-[#9162b9]" : "text-blue-600"} mb-1`}
				>
					{labels.title}
				</h2>
				<div className="w-full max-h-[100px] overflow-y-auto">
					<p className="text-gray-800 mb-0 text-sm">{scenario}</p>
				</div>
			</div>
		</div>
	)
}
