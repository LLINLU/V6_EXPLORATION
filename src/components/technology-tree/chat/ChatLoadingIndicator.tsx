import type React from "react"
import { useTranslation } from "react-i18next"

interface ChatLoadingIndicatorProps {
	isLoading: boolean
}

export const ChatLoadingIndicator: React.FC<ChatLoadingIndicatorProps> = ({
	isLoading,
}) => {
	const { t } = useTranslation()
	if (!isLoading) {
		return null
	}

	return (
		<div className="px-6 py-3 bg-white border-t border-gray-100">
			<div className="flex items-center gap-3 text-sm text-gray-600">
				<div className="flex space-x-1">
					<div
						className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
						style={{ animationDelay: "0ms" }}
					></div>
					<div
						className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
						style={{ animationDelay: "150ms" }}
					></div>
					<div
						className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
						style={{ animationDelay: "300ms" }}
					></div>
				</div>
				<span>{t("tech.ai_generating")}</span>
			</div>
		</div>
	)
}
