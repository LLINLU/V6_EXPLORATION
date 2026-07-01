/**
 * Local API route for generating technical characteristics
 * Returns 5-7 key technical characteristics for a research query
 */

import { type NextRequest, NextResponse } from "next/server"

interface TechCharacteristic {
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

		const prompt = `You are analyzing a research query to identify key technical characteristics.

Research Query: "${query}"

Generate 5-7 important and distinctive technical characteristics related to this query.
Each characteristic should represent a key technical aspect, feature, or dimension that researchers would care about.

For each characteristic:
- Name: A concise name (2-4 words)
- Description: A brief explanation (10-20 words) of what this characteristic means in context

Examples of good characteristics:
- "Scalability": "Ability to handle increasing workloads and data volumes efficiently"
- "Real-time Processing": "Capability to process and analyze data with minimal latency"
- "Energy Efficiency": "Optimization of power consumption and resource utilization"

Return as JSON array with objects containing "name" and "description" properties.

Example format:
{
  "characteristics": [
    {"name": "...", "description": "..."},
    {"name": "...", "description": "..."}
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
							"You are a technical analyst who identifies key characteristics of research domains. Always return valid JSON.",
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
				{ error: "Failed to generate technical characteristics" },
				{ status: 500 },
			)
		}

		const data = await response.json()
		const content = data.choices[0].message.content
		const parsed: { characteristics: TechCharacteristic[] } =
			JSON.parse(content)

		return NextResponse.json({
			characteristics: parsed.characteristics || [],
		})
	} catch (error) {
		console.error("Error in generate-tech-characteristics API:", error)
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		)
	}
}
