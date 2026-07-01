/**
 * Local API route for generating keywords for a specific axis
 * This bypasses Supabase edge functions for local development
 */

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { query, axis } = body

		if (!query || !axis) {
			return NextResponse.json(
				{ error: "Query and axis are required" },
				{ status: 400 },
			)
		}

		const openAIApiKey = process.env.OPENAI_API_KEY

		if (!openAIApiKey) {
			return NextResponse.json(
				{ error: "OpenAI API key not configured" },
				{ status: 500 },
			)
		}

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
			return NextResponse.json(
				{ error: "Failed to generate keywords" },
				{ status: 500 },
			)
		}

		const data = await response.json()
		const content = data.choices[0].message.content
		const parsed = JSON.parse(content)

		// Validate that the response contains the expected axis
		if (!parsed[axis]) {
			console.error("Response missing expected axis:", parsed)
			return NextResponse.json(
				{
					error: `Response did not contain keywords for axis "${axis}"`,
				},
				{ status: 500 },
			)
		}

		return NextResponse.json(parsed)
	} catch (error) {
		console.error("Error in generate-keywords-for-axis API:", error)
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		)
	}
}
