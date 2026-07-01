/**
 * Scenario Chat Component
 * AI assistant for asking questions about scenarios and requesting data
 */

import { ArrowUp, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Scenario } from "@/types/scenario"

interface Message {
	id: string
	role: "user" | "assistant"
	content: string
	timestamp: Date
	actions?: {
		type: "filter" | "regenerate" | "request_data"
		payload?: any
	}[]
}

interface ScenarioChatProps {
	scenarios: Scenario[]
	selectedScenarioIds: string[]
	onFilterScenarios?: (filteredIds: string[]) => void
	onRegenerateScenarios?: (criteria: string) => void
	onRequestData?: (scenarioId: string, dataType: string) => void
}

export const ScenarioChat = ({
	scenarios,
	selectedScenarioIds,
	onFilterScenarios,
	onRegenerateScenarios,
	onRequestData,
}: ScenarioChatProps) => {
	const { t } = useTranslation()
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "welcome",
			role: "assistant",
			content: t("scenario.chat.welcome_message"),
			timestamp: new Date(),
		},
	])
	const [input, setInput] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const scrollRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		scrollRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [])

	const handleSend = async () => {
		if (!input.trim() || isLoading) return

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: input,
			timestamp: new Date(),
		}

		setMessages((prev) => [...prev, userMessage])
		setInput("")
		setIsLoading(true)

		try {
			// Call the scenario-chat edge function
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
			const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

			const response = await fetch(
				`${supabaseUrl}/functions/v1/scenario-chat`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${supabaseKey}`,
					},
					body: JSON.stringify({
						message: input,
						scenarios,
						selectedScenarioIds,
						pastMessages: messages
							.filter((m) => m.id !== "welcome")
							.map((m) => ({
								role: m.role,
								content: m.content,
							})),
					}),
				},
			)

			if (!response.ok) {
				throw new Error("Failed to get response from AI")
			}

			const data = await response.json()

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: data.response,
				timestamp: new Date(),
				actions: data.actions,
			}

			setMessages((prev) => [...prev, assistantMessage])

			// Execute actions if any
			if (data.actions && Array.isArray(data.actions)) {
				data.actions.forEach((action: any) => {
					if (action.type === "filter" && onFilterScenarios) {
						onFilterScenarios(action.payload.scenarioIds)
					} else if (action.type === "regenerate" && onRegenerateScenarios) {
						onRegenerateScenarios(action.payload.criteria)
					} else if (action.type === "request_data" && onRequestData) {
						onRequestData(action.payload.scenarioId, action.payload.dataType)
					}
				})
			}
		} catch (error) {
			console.error("Chat error:", error)
			setMessages((prev) => [
				...prev,
				{
					id: (Date.now() + 1).toString(),
					role: "assistant",
					content: t("scenario.chat.error_message"),
					timestamp: new Date(),
				},
			])
		} finally {
			setIsLoading(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	return (
		<div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<h3 className="font-semibold text-gray-900">
					{t("scenario.chat.header_title")}
				</h3>
				<p className="text-xs text-gray-500">
					{scenarios.length} scenarios • {selectedScenarioIds.length} selected
				</p>
			</div>

			{/* Messages */}
			<ScrollArea className="flex-1 p-4">
				<div className="space-y-4">
					{messages.map((message) => (
						<div
							key={message.id}
							className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-[80%] rounded-lg p-3 ${
									message.role === "user"
										? "bg-blue-600 text-white"
										: "bg-gray-100 text-gray-900"
								}`}
							>
								<p className="text-sm whitespace-pre-wrap">{message.content}</p>
								{message.actions && message.actions.length > 0 && (
									<div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
										<p className="text-xs opacity-75">
											{t("scenario.chat.executed_actions")}
										</p>
										{message.actions.map((action, idx) => (
											<p
												key={`${action.type}-${idx}`}
												className="text-xs opacity-75"
											>
												• {action.type === "filter" && "Filtered scenarios"}
												{action.type === "regenerate" &&
													"Regenerated scenarios"}
												{action.type === "request_data" && "Requested data"}
											</p>
										))}
									</div>
								)}
								<p className="text-xs opacity-75 mt-1">
									{message.timestamp.toLocaleTimeString()}
								</p>
							</div>
						</div>
					))}
					{isLoading && (
						<div className="flex justify-start">
							<div className="bg-gray-100 rounded-lg p-3">
								<Loader2 className="h-4 w-4 animate-spin text-gray-600" />
							</div>
						</div>
					)}
					<div ref={scrollRef} />
				</div>
			</ScrollArea>

			{/* Input */}
			<div className="p-4 border-t">
				<div className="bg-white relative">
					<Textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={t("scenario.chat.input_placeholder")}
						className={cn(
							"w-full resize-none border bg-gray-50 focus-visible:ring-0 text-sm px-4 py-3 pr-12 rounded-xl",
							isLoading && "cursor-not-allowed opacity-50",
						)}
						rows={1}
						disabled={isLoading}
					/>
					<Button
						onClick={handleSend}
						disabled={!input.trim() || isLoading}
						size="icon"
						className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
					>
						{isLoading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<ArrowUp className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>
		</div>
	)
}
