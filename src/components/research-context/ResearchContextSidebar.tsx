import { useTranslation } from "react-i18next"
import { ContextDetailsCard } from "./sidebar/ContextDetailsCard"
import { QuestionProgressCard } from "./sidebar/QuestionProgressCard"
import { ResearchObjectiveCard } from "./sidebar/ResearchObjectiveCard"
import { UserSelectionsCard } from "./sidebar/UserSelectionsCard"

interface ResearchContextSidebarProps {
	query: string
	researchAnswers: Record<string, string>
	userAnswers: {
		focus?: string
		purpose?: string[]
		targetField?: Record<string, string[]>
		additionalContext?: string
	}
	refinementProgress: number
	confidenceLevels?: Record<string, number>
	questionStatus?: Record<string, boolean>
}

export const ResearchContextSidebar = ({
	query,
	researchAnswers,
	userAnswers,
	refinementProgress,
	confidenceLevels = {},
	questionStatus = {},
}: ResearchContextSidebarProps) => {
	const { t } = useTranslation()
	return (
		<div className="h-screen bg-gray-50 p-4 overflow-y-auto">
			<div className="space-y-4">
				<div className="mb-6">
					<h2 className="text-xl font-bold text-gray-900 mb-2">
						{t("research.sidebar.title")}
					</h2>
					<p className="text-sm text-gray-600">
						{t("research.sidebar.subtitle")}
					</p>
				</div>

				{/* Research Objective Summary */}
				<ResearchObjectiveCard
					query={query}
					researchAnswers={researchAnswers}
				/>

				{/* Question Progress */}
				<QuestionProgressCard
					refinementProgress={refinementProgress}
					questionStatus={questionStatus}
				/>

				{/* User Selections */}
				<UserSelectionsCard
					userAnswers={userAnswers}
					questionStatus={questionStatus}
				/>

				{/* Context Details */}
				<ContextDetailsCard
					researchAnswers={researchAnswers}
					confidenceLevels={confidenceLevels}
				/>
			</div>
		</div>
	)
}
