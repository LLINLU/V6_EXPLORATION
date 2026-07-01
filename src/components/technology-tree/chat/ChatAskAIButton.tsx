import type React from "react"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const ChatAskAIButton: React.FC = memo(() => {
	const { t } = useTranslation()
	const { toast } = useToast()

	// TODO(FAST Ask AI): Restore the real chat-opening behavior here. This button
	// currently shows the same "Under Construction" placeholder used by TED mode
	// (see scenario/report/query/QueryReportHeader.tsx -> handleAskAI). The real
	// implementation should toggle the layout chat / fullscreen chat by reading
	// MindMapContext and using useChatStore().setChatDisplayMode +
	// useTreeUIStore().setChatBoxOpen / mindActions.setFullscreenChatOpen.
	// The previous working logic was removed in this change — re-add it when the
	// FAST Ask AI feature is ready to ship.
	const handleClick = () => {
		toast({
			title: "Under Construction",
			description: t("scenario.header.ask_ai_wip", {
				defaultValue: "Coming soon",
			}),
		})
	}

	return (
		<Button
			onClick={handleClick}
			className="ask-ai-btn rounded-full px-[18px] py-3 text-white font-medium flex items-center z-50"
			style={{
				height: "36px",
				width: "100px",
			}}
		>
			<div className="flex items-center">
				<span className="text-white font-medium">Ask AI</span>
			</div>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				fill="#ffffff"
				viewBox="0 0 256 256"
			>
				<path d="M232.07,186.76a80,80,0,0,0-62.5-114.17A80,80,0,1,0,23.93,138.76l-7.27,24.71a16,16,0,0,0,19.87,19.87l24.71-7.27a80.39,80.39,0,0,0,25.18,7.35,80,80,0,0,0,108.34,40.65l24.71,7.27a16,16,0,0,0,19.87-19.86ZM62,159.5a8.28,8.28,0,0,0-2.26.32L32,168l8.17-27.76a8,8,0,0,0-.63-6,64,64,0,1,1,26.26,26.26A8,8,0,0,0,62,159.5Zm153.79,28.73L224,216l-27.76-8.17a8,8,0,0,0-6,.63,64.05,64.05,0,0,1-85.87-24.88A79.93,79.93,0,0,0,174.7,89.71a64,64,0,0,1,41.75,92.48A8,8,0,0,0,215.82,188.23Z"></path>
			</svg>
		</Button>
	)
})

ChatAskAIButton.displayName = "ChatAskAIButton"

export { ChatAskAIButton }
