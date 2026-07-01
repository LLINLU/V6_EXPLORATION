import { Target } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getResearchObjective } from "./utils/researchUtils"

interface ResearchObjectiveCardProps {
	query: string
	researchAnswers: Record<string, string>
}

export const ResearchObjectiveCard = ({
	query,
	researchAnswers,
}: ResearchObjectiveCardProps) => {
	const { t } = useTranslation()
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm flex items-center">
					<Target className="h-4 w-4 mr-2 text-blue-600" />
					{t("research.researchObjective.title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-gray-700 leading-relaxed">
					{getResearchObjective(query, researchAnswers)}
				</p>
			</CardContent>
		</Card>
	)
}
