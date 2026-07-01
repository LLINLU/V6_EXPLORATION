import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const openAIApiKey = Deno.env.get("OPENAI_API_KEY")

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
}

interface Keyword {
	keyword: string
	description: string
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders })
	}

	try {
		const { query, axis } = await req.json()

		console.log("Received generate-keywords-for-axis request:", { query, axis })

		if (!query || !axis) {
			return new Response(
				JSON.stringify({ error: "Query and axis are required" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		// Adapted from reference: generateKeywordsForAxis
		const prompt = `For the research theme "${query}", generate 3-5 specific keywords related to the axis "${axis}".
Provide a concise one-sentence description for each keyword.
Return as JSON object where key is the axis name ("${axis}") and value is array of objects with "keyword" and "description" properties.

Example format:
{
  "${axis}": [
    {
      "keyword": "Example Keyword",
      "description": "Brief description of what this keyword represents"
    }
  ]
}`

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
							"You are an expert research analyst who generates specific, actionable keywords for research topics. Always return valid JSON.",
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
				JSON.stringify({ error: "Failed to generate keywords" }),
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

		// Validate that the response contains the expected axis
		if (!parsed[axis]) {
			console.error("Response missing expected axis:", parsed)
			return new Response(
				JSON.stringify({
					error: `Response did not contain keywords for axis "${axis}"`,
				}),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		return new Response(JSON.stringify(parsed), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	} catch (error) {
		console.error("Error in generate-keywords-for-axis function:", error)
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
