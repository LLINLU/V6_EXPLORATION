import { TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRecentConversationTopics } from "./utils/researchUtils"

interface ConversationTopicsCardProps {
	conversationMessages: Array<{ content: string; isUser: boolean }>
}

export const ConversationTopicsCard = ({
	conversationMessages,
}: ConversationTopicsCardProps) => {
	const { t } = useTranslation()
	const recentTopics = getRecentConversationTopics(conversationMessages)

	if (recentTopics.length === 0) {
		return null
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm flex items-center">
					<TrendingUp className="h-4 w-4 mr-2 text-gray-600" />
					{t("research.conversationTopics.title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<p className="text-xs text-gray-600 mb-2">
						{t("research.conversationTopics.recentTopics")}:
					</p>
					{recentTopics.map((topic) => (
						<div
							key={topic}
							className="text-xs text-gray-700 bg-gray-100 rounded p-2"
						>
							{topic}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
