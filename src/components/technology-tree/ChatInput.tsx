import { Loader2, Send } from "lucide-react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ChatInputProps {
	value: string
	onChange: (value: string) => void
	onSend?: () => void
	isLoading?: boolean
	isInteractionEnabled?: boolean
}

export const ChatInput = ({
	value,
	onChange,
	onSend,
	isLoading = false,
	isInteractionEnabled = true,
}: ChatInputProps) => {
	const handleSend = () => {
		if (onSend && value.trim() && !isLoading && isInteractionEnabled) {
			// console.log("handleSend", value)
			onSend()
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (
			e.key === "Enter" &&
			!e.shiftKey &&
			value.trim() &&
			!isLoading &&
			isInteractionEnabled &&
			!e.nativeEvent.isComposing
		) {
			e.preventDefault()
			handleSend()
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value)
	}

	return (
		<div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
			<div className="bg-white relative">
				<Textarea
					placeholder={
						!isInteractionEnabled
							? "何かを選択してから入力してください"
							: "メッセージを入力してください..."
					}
					className={cn(
						"w-full resize-none border bg-gray-50 focus-visible:ring-0 text-sm px-4 py-3 pr-12 rounded-xl",
						(isLoading || !isInteractionEnabled) &&
							"cursor-not-allowed opacity-50",
					)}
					value={value}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					disabled={isLoading || !isInteractionEnabled}
					rows={1}
				/>
				<Button
					onClick={handleSend}
					disabled={!value.trim() || isLoading || !isInteractionEnabled}
					size="icon"
					className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Send className="h-4 w-4" />
					)}
				</Button>
			</div>
		</div>
	)
}
