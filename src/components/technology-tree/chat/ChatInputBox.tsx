import { ArrowUp, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { NodeSuggestion } from "@/types/chat"
import type { ContextMode } from "@/types/tree"
import { useChatInput } from "./hooks/useChatInput"
import { useMentionLogic } from "./hooks/useMentionLogic"
import { MentionDropdown } from "./MentionDropdown"

interface ChatInputBoxProps {
	onInputChange: (value: string) => void
	onSendMessage: () => void
	isLoading?: boolean
	isInteractionEnabled?: boolean
	contextMode?: ContextMode
	onContextModeChange?: (mode: ContextMode) => void
	availableNodes?: NodeSuggestion[] // Available nodes for @ mention
	onNodeSelect?: (node: NodeSuggestion) => void // Callback when node is selected
	isMentionSearching?: boolean // Whether mention-related search is in progress
}

export const ChatInputBox = ({
	onInputChange,
	onSendMessage,
	isLoading = false,
	isInteractionEnabled = true,
	contextMode = "papers",
	onContextModeChange,
	availableNodes = [],
	onNodeSelect,
	isMentionSearching = false,
}: ChatInputBoxProps) => {
	const { t } = useTranslation()
	// Destructure mention logic methods directly
	const {
		showSuggestions,
		selectedSuggestionIndex,
		mentionQuery,
		hasMentions,
		editableRef,
		getTextContent,
		getCursorPosition,
		checkForMention,
		convertToPlainText,
		handleNodeSelect,
		clearInput,
		updateHasMentions,
		setShowSuggestions,
		setSelectedSuggestionIndex,
		setJustSelectedNode,
	} = useMentionLogic({
		availableNodes,
		onNodeSelect,
		onInputChange,
	})

	// Use chat input hook
	const { setIsComposing, handleInput, handleKeyDown, handleSubmit } =
		useChatInput({
			onSendMessage,
			onInputChange,
			isMentionSearching,
			isLoading,
			isInteractionEnabled,
			showSuggestions,
			availableNodes,
			selectedSuggestionIndex,
			setSelectedSuggestionIndex,
			setShowSuggestions,
			setJustSelectedNode,
			getTextContent,
			clearInput,
			updateHasMentions,
			getCursorPosition,
			checkForMention,
			convertToPlainText,
		})

	return (
		<div className="relative">
			{/* Node suggestions dropdown */}
			{showSuggestions && availableNodes.length > 0 && (
				<MentionDropdown
					availableNodes={availableNodes}
					onNodeSelect={handleNodeSelect}
					searchQuery={mentionQuery}
					selectedIndex={selectedSuggestionIndex}
					onSelectedIndexChange={setSelectedSuggestionIndex}
				/>
			)}

			<div className="pt-0 pb-6 px-6 bg-white">
				<form onSubmit={handleSubmit}>
					{/* Input with Context Mode Selector and Send Button inside */}
					<div className="relative">
						{/* Context Mode Selector - positioned inside the input box */}
						<div
							className="absolute bottom-2 left-3 flex items-center z-10"
							style={{ gap: "0.3rem" }}
						>
							<span className="text-xs font-medium text-gray-700">
								{t("tech.source")}:
							</span>
							<Select value={contextMode} onValueChange={onContextModeChange}>
								<SelectTrigger
									className="h-6 rounded-full pl-3 pr-2 py-1"
									style={{
										width: "86px",
										fontSize: "11px",
										backgroundColor: "#eff6ff",
										borderColor: "#9cbef9",
									}}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent
									className="rounded-lg max-h-28 overflow-y-auto bg-white"
									style={{ fontSize: "11px" }}
								>
									<SelectItem value="papers">
										{t("tech.papers_only")}
									</SelectItem>
									<SelectItem value="cases">{t("tech.cases_only")}</SelectItem>
									<SelectItem value="both">
										{t("tech.papers_and_cases")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div
							ref={editableRef}
							contentEditable
							onInput={handleInput}
							onKeyDown={handleKeyDown}
							onCompositionStart={() => setIsComposing(true)}
							onCompositionEnd={() => setIsComposing(false)}
							className="h-[150px] overflow-y-auto resize-none pr-12 relative pt-3 pb-12 px-3 border border-[#eee] rounded-lg focus:outline-none focus:border-transparent text-xs"
							style={{
								background: "#f9fafb",
								whiteSpace: "pre-wrap",
								wordWrap: "break-word",
							}}
							data-placeholder={
								isMentionSearching && hasMentions
									? t("tech.searching_ellipsis")
									: t("tech.enter_message_placeholder")
							}
							suppressContentEditableWarning={true}
						/>
						<Button
							type="submit"
							disabled={
								!getTextContent().trim() ||
								isLoading ||
								isMentionSearching ||
								!isInteractionEnabled
							}
							className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-0 w-8 h-8 flex items-center justify-center disabled:opacity-50"
							size="icon"
						>
							{isLoading || (isMentionSearching && hasMentions) ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<ArrowUp className="h-4 w-4" />
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
