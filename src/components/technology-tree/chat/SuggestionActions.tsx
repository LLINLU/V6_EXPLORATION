import { Check, Edit, MessageSquare } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import type { NodeSuggestion } from "@/types/chat"

interface SuggestionActionsProps {
	suggestion: NodeSuggestion
	onUseNode?: (suggestion: NodeSuggestion) => void
	onEditNode?: (suggestion: NodeSuggestion) => void
	onRefine?: (suggestion: NodeSuggestion) => void
}

export const SuggestionActions = ({
	suggestion,
	onUseNode,
	onEditNode,
	onRefine,
}: SuggestionActionsProps) => {
	const { t } = useTranslation()
	return (
		<div className="flex flex-wrap gap-2 mt-3">
			<Button
				variant="outline"
				size="sm"
				onClick={() => onUseNode?.(suggestion)}
				className="flex items-center gap-2"
			>
				<Check className="h-4 w-4" />
				{t("tech.use")}
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => onEditNode?.(suggestion)}
				className="flex items-center gap-2"
			>
				<Edit className="h-4 w-4" />
				{t("tech.edit")}
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => onRefine?.(suggestion)}
				className="flex items-center gap-2"
			>
				<MessageSquare className="h-4 w-4" />
				{suggestion.title.includes("Refined")
					? t("tech.refine_further")
					: t("tech.improve_further")}
			</Button>
		</div>
	)
}
