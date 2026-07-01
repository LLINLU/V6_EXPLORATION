import { Send } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChatMessage } from "@/components/shared/ChatMessage"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { LoadingIndicator } from "./chat/LoadingIndicator"
import { useRefinementChat } from "./hooks/useRefinementChat"

interface RefinementChatProps {
	initialQuery: string
	onRefinementComplete: (context: any) => void
	onContextUpdate?: (context: any) => void
}

export const RefinementChat = ({
	initialQuery,
	onRefinementComplete,
	onContextUpdate,
}: RefinementChatProps) => {
	const { t } = useTranslation()
	const {
		messages,
		inputValue,
		setInputValue,
		isLoading,
		currentQuestionPhase,
		handleButtonClick,
		handleCheckboxSubmit,
		handleSendMessage,
		handleSkipAdditionalContext,
		initializeConversation,
	} = useRefinementChat(initialQuery, onRefinementComplete, onContextUpdate)
	const [initial, setInitial] = useState(false)
	useEffect(() => {
		if (!initial) {
			initializeConversation()
			setInitial(true)
		}
	}, [initial, initializeConversation])

	return (
		<div className="h-full flex flex-col">
			<div className="flex-1 overflow-y-auto p-6 space-y-4">
				{messages.map((message, index) => (
					<ChatMessage
						key={`${index}-${message.isDisabled ? "disabled" : "enabled"}-${JSON.stringify(message.initialSelections)}`}
						content={message.content}
						isUser={message.isUser}
						buttons={message.buttons}
						onButtonClick={handleButtonClick}
						checkboxGroups={message.checkboxGroups}
						onCheckboxSubmit={handleCheckboxSubmit}
						isDisabled={message.isDisabled}
						initialSelections={message.initialSelections}
					/>
				))}
				{isLoading && <LoadingIndicator />}
			</div>
			{currentQuestionPhase === "additionalContext" && (
				<div className="border-t border-gray-200 bg-white p-4">
					<div className="max-w-4xl mx-auto">
						<div className="flex flex-col gap-3">
							<Textarea
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								placeholder="{t('research.refinement.additionalContextPlaceholder')}"
								className="min-h-[80px] resize-none"
								disabled={isLoading}
							/>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={handleSkipAdditionalContext}
									disabled={isLoading}
								>
									{t("research.refinement.skip")}
								</Button>
								<Button
									onClick={handleSendMessage}
									disabled={isLoading}
									className="flex items-center gap-2"
								>
									<Send className="h-4 w-4" />
									{t("research.refinement.send")}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
