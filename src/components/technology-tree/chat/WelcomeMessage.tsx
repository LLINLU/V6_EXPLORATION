import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { MIcon } from "@/components/ui/m-icon"
import type { SelectedNode } from "@/types/tree"

interface WelcomeMessageProps {
	onQuickMessage: (text: string) => void
	selectedNodes?: SelectedNode[]
}

export const WelcomeMessage = ({
	onQuickMessage,
	selectedNodes,
}: WelcomeMessageProps) => {
	const { t } = useTranslation()
	const handleCustomButtonClick = (text: string) => {
		onQuickMessage(text)
	}
	const exampleQuestions = [
		{
			text: t("tech.example_q_summarize"),
		},
		{
			text: t("tech.example_q_technologies"),
		},
		{
			text: t("tech.example_q_compare"),
		},
	]

	const selectedNodeTitle = useMemo(() => {
		return selectedNodes && selectedNodes.length > 0
			? selectedNodes[0].title
			: null
	}, [selectedNodes])

	return (
		<div className="p-6 space-y-6">
			{/* Bot Message */}
			<div className="flex items-start gap-3">
				<div className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
					<MIcon className="h-4 w-4" size={16} />
				</div>
				<div className="flex-1 bg-gray-50 rounded-lg p-4">
					<p className="text-sm text-gray-700 mb-3">
						{t("tech.welcome_greeting")}
						<br />
						{t("tech.welcome_ask")}
						<br />
						{selectedNodes && selectedNodes.length > 0 ? (
							<>
								{t("tech.selected_nodes")}: <br />
								<div className="mt-1 space-y-1">
									{selectedNodes.map((node) => (
										<div
											key={node.id}
											className="text-blue-700 font-medium text-sm block bg-blue-50 py-2 pl-3 pr-3 rounded-lg"
										>
											{node.title}
										</div>
									))}
								</div>
							</>
						) : selectedNodeTitle ? (
							<>
								{t("tech.selected_nodes")}: <br />
								<span className="text-blue-700 font-medium text-sm">
									{selectedNodeTitle}
								</span>
							</>
						) : null}
					</p>
				</div>
			</div>
			{/* Example Questions */}
			<div className="space-y-3">
				<h4 className="text-sm font-medium text-gray-700">
					{" "}
					{t("tech.example_questions_heading")}
				</h4>
				<div className="space-y-2">
					{exampleQuestions.map((question) => (
						<button
							key={question.text}
							onClick={() => handleCustomButtonClick(question.text)}
							className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
						>
							<span className="text-sm text-gray-700 group-hover:text-gray-900 leading-relaxed">
								{question.text}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	)
}
