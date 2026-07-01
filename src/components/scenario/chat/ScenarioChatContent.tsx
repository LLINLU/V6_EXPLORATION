import { ArrowUp, Loader2 } from "lucide-react"
import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { MIcon } from "@/components/ui/m-icon"

interface ScenarioChatContentProps {
	onSendMessage?: (message: string) => void
	onQuickQuestion?: (question: string) => void
	isLoading?: boolean
}

export const ScenarioChatContent: React.FC<ScenarioChatContentProps> = ({
	onSendMessage,
	onQuickQuestion,
	isLoading = false,
}) => {
	const [isComposing, setIsComposing] = useState(false)
	const editableRef = useRef<HTMLDivElement>(null)

	const quickQuestions = [
		"各指標を解釈して",
		"ニーズに合った潜在的な指標を提案して",
		"シナリオを深掘りして",
	]

	const getTextContent = () => {
		return editableRef.current?.textContent || ""
	}

	const clearInput = () => {
		if (editableRef.current) {
			editableRef.current.textContent = ""
		}
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const text = getTextContent().trim()
		if (text && onSendMessage && !isLoading) {
			onSendMessage(text)
			clearInput()
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey && !isComposing) {
			e.preventDefault()
			handleSubmit(e)
		}
	}

	const handleQuickQuestion = (question: string) => {
		if (onQuickQuestion) {
			onQuickQuestion(question)
		} else if (onSendMessage) {
			onSendMessage(question)
		}
	}

	return (
		<div className="flex flex-col h-full bg-white">
			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-6 space-y-6">
					{/* Bot Message */}
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
							<MIcon className="h-4 w-4" size={16} />
						</div>
						<div className="flex-1 bg-gray-50 rounded-lg p-4">
							<p className="text-sm text-gray-700 leading-relaxed">
								こんにちは！私は、あらゆる指標に関するシナリオの理解をお手伝いするAIアシスタントです。また、サマリーを作成する際に「どのセクションを含めるべきか」も一緒に整理してサポートします。
								<br />
								なんでも気軽に聞いてください！
							</p>
						</div>
					</div>

					{/* Example Questions */}
					<div className="space-y-3">
						<h4 className="text-sm font-medium text-gray-700">
							こんな質問ができます：
						</h4>
						<div className="space-y-2">
							{quickQuestions.map((question) => (
								<button
									key={question}
									type="button"
									onClick={() => handleQuickQuestion(question)}
									className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
								>
									<span className="text-sm text-gray-700 group-hover:text-gray-900 leading-relaxed">
										{question}
									</span>
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Input Area */}
			<div className="pt-0 pb-6 px-6 bg-white">
				<form onSubmit={handleSubmit}>
					<div className="relative">
						<div
							ref={editableRef}
							contentEditable
							onKeyDown={handleKeyDown}
							onCompositionStart={() => setIsComposing(true)}
							onCompositionEnd={() => setIsComposing(false)}
							className="h-[150px] overflow-y-auto resize-none pr-12 relative pt-3 pb-12 px-3 border border-[#eee] rounded-lg focus:outline-none focus:border-transparent text-xs"
							style={{
								background: "#f9fafb",
								whiteSpace: "pre-wrap",
								wordWrap: "break-word",
							}}
							data-placeholder="メッセージを入力... (@を入力してシナリオを選択)"
							suppressContentEditableWarning={true}
						/>
						<Button
							type="submit"
							disabled={!getTextContent().trim() || isLoading}
							className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-0 w-8 h-8 flex items-center justify-center disabled:opacity-50"
							size="icon"
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<ArrowUp className="h-4 w-4" />
							)}
						</Button>
					</div>
				</form>
			</div>

			{/* CSS for placeholder */}
			<style>{`
				[data-placeholder]:empty:before {
					content: attr(data-placeholder);
					color: #9ca3af;
					pointer-events: none;
				}
			`}</style>
		</div>
	)
}
