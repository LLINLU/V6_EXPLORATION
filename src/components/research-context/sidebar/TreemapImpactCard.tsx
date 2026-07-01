import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTreemapImpact } from "./utils/researchUtils"

interface TreemapImpactCardProps {
	researchAnswers: Record<string, string>
}

export const TreemapImpactCard = ({
	researchAnswers,
}: TreemapImpactCardProps) => {
	const { t } = useTranslation()
	const treemapImpact = getTreemapImpact(researchAnswers)

	if (treemapImpact.length === 0) {
		return null
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm flex items-center">
					<ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
					{t("research.impact.title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<p className="text-xs text-gray-600 mb-2">
						{t("research.impact.description")}:
					</p>
					{treemapImpact.map((impact) => (
						<div
							key={impact}
							className="text-sm text-gray-700 flex items-center"
						>
							<div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
							{impact}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
