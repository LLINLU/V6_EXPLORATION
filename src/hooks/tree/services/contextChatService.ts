import { toast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import type { ChatGPTMessage } from "@/types/services"
import type { NodeContext } from "@/types/tree"

export type { ChatGPTMessage }

export const callContextChat = async (
	message: string,
	context?: NodeContext,
	pastMessages?: Array<ChatGPTMessage>,
) => {
	try {
		// Convert SelectedNode[] to string[] for backend compatibility
		const backendContext = context
			? {
					...context,
					selectedNodes: context.selectedNodes?.map((node) =>
						typeof node === "string" ? node : node.title || node.id,
					),
				}
			: undefined

		const { data, error } = await supabase.functions.invoke("context-chat", {
			body: {
				message,
				context: backendContext,
				pastMessages,
			},
		})

		if (error) {
			console.error("Supabase function error:", error)
			throw error
		}

		return data.response
	} catch (error) {
		console.error("Error calling context-chat:", error)
		toast({
			title: "エラー",
			description:
				"AIチャットからの応答を取得できませんでした。もう一度お試しください。",
		})
		return "申し訳ございませんが、現在応答を生成できません。もう一度お試しください。"
	}
}
