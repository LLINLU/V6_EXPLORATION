import { Check, CheckCircle, Edit, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ChatMessage, NodeSuggestion } from "@/types/chat"

interface ChatConversationProps {
	chatMessages: ChatMessage[]
	onUseNode?: (suggestion: NodeSuggestion) => void
	onEditNode?: (suggestion: NodeSuggestion) => void
	onRefine?: (suggestion: NodeSuggestion) => void
	onCheckResults?: () => void
}

export const ChatConversation = ({
	chatMessages,
	onUseNode,
	onEditNode,
	onRefine,
	onCheckResults,
}: ChatConversationProps) => {
	const renderSuggestionActions = (
		suggestion: NodeSuggestion,
		isDisabled: boolean,
	) => (
		<div className="flex flex-wrap gap-2 mt-3">
			<Button
				variant="outline"
				size="sm"
				onClick={() => onUseNode?.(suggestion)}
				className="flex items-center gap-2"
				disabled={isDisabled}
			>
				<Check className="h-4 w-4" />
				使用する
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => onEditNode?.(suggestion)}
				className="flex items-center gap-2"
				disabled={isDisabled}
			>
				<Edit className="h-4 w-4" />
				編集
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => onRefine?.(suggestion)}
				className="flex items-center gap-2"
				disabled={isDisabled}
			>
				<MessageSquare className="h-4 w-4" />
				{suggestion.title.includes("Refined")
					? "さらに絞り込む"
					: "さらに改良する"}
			</Button>
		</div>
	)

	return (
		<div className="flex-1 overflow-y-auto p-4">
			{chatMessages.map((message, index) => {
				const nextMessage = chatMessages[index + 1]
				const isActionTaken =
					nextMessage && nextMessage.content === "ノードが追加されました 😊"

				// Skip rendering node suggestion messages (filter by type)
				if (
					message.type === "suggestion" &&
					!message.content.includes("👋 こんにちは！")
				) {
					return null
				}

				return (
					<div
						key={`${message.timestamp || Date.now()}-${index}`}
						className={`flex ${message.isUser ? "justify-end" : "justify-start"} mb-4`}
					>
						<div
							className={`inline-block max-w-[85%] rounded-xl p-4 ${
								message.isUser
									? "bg-blue-100 text-blue-900"
									: "bg-blue-50 text-blue-800"
							}`}
						>
							<p className="text-base leading-relaxed whitespace-pre-line">
								{message.content}
							</p>
							{message.suggestion &&
								renderSuggestionActions(message.suggestion, isActionTaken)}
							{message.showCheckResults && onCheckResults && (
								<div className="mt-3">
									<Button
										variant="outline"
										size="sm"
										onClick={onCheckResults}
										className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
									>
										<CheckCircle className="h-4 w-4" />
										結果を確認
									</Button>
								</div>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}
