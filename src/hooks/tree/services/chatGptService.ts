import { toast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import type { ChatGPTMessage } from "@/types/services"

export type { ChatGPTMessage }

export const callChatGPT = async (
	message: string,
	pastMessage: Array<ChatGPTMessage>,
	context: string = "research",
) => {
	try {
		// console.log("Calling ChatGPT with message:", message)

		const { data, error } = await supabase.functions.invoke("chat-gpt", {
			body: { message, pastMessage: pastMessage, context },
		})

		if (error) {
			console.error("Supabase function error:", error)
			throw error
		}

		// console.log("ChatGPT response:", data)
		return data.response
	} catch (error) {
		console.error("Error calling ChatGPT:", error)
		toast({
			title: "エラー",
			description:
				"ChatGPTからの応答を取得できませんでした。もう一度お試しください。",
		})
		return "申し訳ございませんが、現在応答を生成できません。もう一度お試しください。"
	}
}
