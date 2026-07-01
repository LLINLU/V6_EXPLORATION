import { Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getQuestionProgress } from "./utils/researchUtils"

interface QuestionProgressCardProps {
	refinementProgress: number
	questionStatus: Record<string, boolean>
}

export const QuestionProgressCard = ({
	refinementProgress,
	questionStatus,
}: QuestionProgressCardProps) => {
	const { t } = useTranslation()
	const questions = getQuestionProgress(questionStatus)

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm flex items-center">
					<Clock className="h-4 w-4 mr-2 text-orange-600" />
					{t("research.questionProgress.title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<div className="flex justify-between items-center mb-2">
						<span className="text-sm text-gray-600">
							{t("research.questionProgress.completion")}
						</span>
						<Badge variant="secondary">{refinementProgress}%</Badge>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2 mb-3">
						<div
							className="bg-orange-500 h-2 rounded-full transition-all duration-300"
							style={{ width: `${refinementProgress}%` }}
						></div>
					</div>

					<div className="space-y-1">
						{questions.map((question) => (
							<div
								key={question.label}
								className="flex items-center justify-between text-xs"
							>
								<span className="text-gray-600">{question.label}</span>
								<span
									className={
										question.status ? "text-green-600" : "text-gray-400"
									}
								>
									{question.status ? "✓" : "○"}
								</span>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
