/**
 * Local API route for generating axes
 * This bypasses Supabase edge functions for local development
 */

import { type NextRequest, NextResponse } from "next/server"

interface Axis {
	name: string
	description: string
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { query } = body

		if (!query) {
			return NextResponse.json({ error: "Query is required" }, { status: 400 })
		}

		const openAIApiKey = process.env.OPENAI_API_KEY

		if (!openAIApiKey) {
			return NextResponse.json(
				{ error: "OpenAI API key not configured" },
				{ status: 500 },
			)
		}

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
			return NextResponse.json(
				{ error: "Failed to generate axes" },
				{ status: 500 },
			)
		}

		const data = await response.json()
		const content = data.choices[0].message.content
		const parsed = JSON.parse(content)

		// Handle both formats: {axes: [...]} or direct array
		const axes: Axis[] = Array.isArray(parsed) ? parsed : parsed.axes || []

		return NextResponse.json({ axes })
	} catch (error) {
		console.error("Error in generate-axes API:", error)
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		)
	}
}
