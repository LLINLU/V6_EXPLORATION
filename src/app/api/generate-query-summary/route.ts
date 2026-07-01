/**
 * Local API route for generating query summary
 * Provides TL;DR and detailed summary of research query
 */

import { type NextRequest, NextResponse } from "next/server"

interface QuerySummary {
	tldr: string
	summary: string
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { query, literacyLevel = "standard" } = body

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

		// Adjust explanation style based on literacy level
		const literacyInstructions = {
			easy: "Use simple, plain language. Avoid technical jargon. Explain concepts as if to someone with no background knowledge. Use everyday examples and analogies.",
			standard:
				"Use clear, professional language. Include some technical terms but explain them briefly. Balance accessibility with technical accuracy.",
			expert:
				"Use precise technical terminology. Assume deep domain knowledge. Focus on nuanced details, technical implications, and cutting-edge aspects.",
		}

		const instruction =
			literacyInstructions[
				literacyLevel as keyof typeof literacyInstructions
			] || literacyInstructions.standard

		const prompt = `You are analyzing a research query to help users understand what they will explore.

Research Query: "${query}"

Literacy Level: ${literacyLevel}
Instructions: ${instruction}

Please provide:
1. A one-line TL;DR summary (1 sentence, max 100 characters)
2. A detailed summary (2-3 paragraphs) explaining:
   - What this query is fundamentally about
   - Key areas and topics that will be explored
   - What kind of scenarios and technologies might be discovered
   - Why this research direction is relevant or interesting

Adjust your language complexity and terminology based on the literacy level.

Return as JSON with "tldr" and "summary" properties.

Example format:
{
  "tldr": "Exploring sustainable energy technologies for urban transportation",
  "summary": "This research investigates..."
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
							"You are a research analyst who helps users understand the scope and implications of their research queries. Always return valid JSON.",
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
				{ error: "Failed to generate query summary" },
				{ status: 500 },
			)
		}

		const data = await response.json()
		const content = data.choices[0].message.content
		const parsed: QuerySummary = JSON.parse(content)

		return NextResponse.json({
			tldr: parsed.tldr,
			summary: parsed.summary,
		})
	} catch (error) {
		console.error("Error in generate-query-summary API:", error)
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		)
	}
}
