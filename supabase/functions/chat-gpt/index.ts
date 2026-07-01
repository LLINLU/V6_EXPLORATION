import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const openAIApiKey = Deno.env.get("OPENAI_API_KEY")
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
}
serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders })
	}

	try {
		const { message, pastMessage, context } = await req.json()

		console.log("Received request:", { message, pastMessage, context })

		if (!message) {
			return new Response(JSON.stringify({ error: "Message is required" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}
		let messages: any
		if (Array.isArray(pastMessage)) {
			messages = pastMessage
		} else {
			messages = [
				{
					role: "user",
					content: message,
				},
			]
		}
		console.log(messages)
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${openAIApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: messages,
			}),
		})
		if (!response.ok) {
			console.error("OpenAI API error:", response.status, response.statusText)
			return new Response(
				JSON.stringify({ error: "Failed to get response from ChatGPT" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}
		const data = await response.json()
		console.log("OpenAI response received")
		const chatGptResponse = data.choices[0].message.content
		return new Response(JSON.stringify({ response: chatGptResponse }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	} catch (error) {
		console.error("Error in chat-gpt function:", error)
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: error.message,
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		)
	}
})
