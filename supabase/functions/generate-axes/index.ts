import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const openAIApiKey = Deno.env.get("OPENAI_API_KEY")

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
}

interface Axis {
	name: string
	description: string
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders })
	}

	try {
		const { query } = await req.json()

		console.log("Received generate-axes request:", { query })

		if (!query) {
			return new Response(JSON.stringify({ error: "Query is required" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}

		// Adapted from reference: getRecommendedAxes
		const prompt = `For the research theme "${query}", recommend 3-5 diverse and insightful axes for analysis.
Provide a short name and concise one-sentence description for each axis.
Return as JSON array with "name" and "description" properties.

Example format:
[
  {
    "name": "Technology",
    "description": "Core technologies and infrastructure requirements"
  },
  {
    "name": "Economics",
    "description": "Cost-effectiveness and business model sustainability"
  }
]`

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${openAIApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content:
							"You are an expert research analyst who helps users explore topics from multiple dimensions. Always return valid JSON.",
					},
					{
						role: "user",
						content: prompt,
					},
				],
				response_format: { type: "json_object" },
			}),
		})

		if (!response.ok) {
			console.error("OpenAI API error:", response.status, response.statusText)
			return new Response(
				JSON.stringify({ error: "Failed to generate axes" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		const data = await response.json()
		console.log("OpenAI response received")

		const content = data.choices[0].message.content
		const parsed = JSON.parse(content)

		// Handle both formats: {axes: [...]} or direct array
		const axes: Axis[] = Array.isArray(parsed) ? parsed : parsed.axes || []

		return new Response(JSON.stringify({ axes }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	} catch (error) {
		console.error("Error in generate-axes function:", error)
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
