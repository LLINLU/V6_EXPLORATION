import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
	try {
		const { query, axes, keywords } = await request.json()

		if (!query) {
			return NextResponse.json({ error: "Query is required" }, { status: 400 })
		}

		const axesContext = axes?.length > 0 ? `Axes: ${axes.join(", ")}` : ""
		const keywordsContext =
			keywords?.length > 0
				? `Keywords: ${keywords.map((k: any) => k.keyword).join(", ")}`
				: ""

		const prompt = `Given the original query: "${query}"
${axesContext}
${keywordsContext}

Generate 2 refined, more specific versions of this query that incorporate the selected axes and keywords. Each refined query should:
1. Be clear and concise (one sentence)
2. Integrate the relevant keywords naturally
3. Maintain the original intent while being more focused
4. Be in the same language as the original query

Return ONLY a JSON array with exactly 2 refined query strings, nothing else.
Example: ["refined query 1", "refined query 2"]`

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.7,
			}),
		})

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.statusText}`)
		}

		const data = await response.json()
		const content = data.choices[0]?.message?.content

		if (!content) {
			throw new Error("No content in response")
		}

		// Parse the JSON response
		let refinedQueries: string[]
		try {
			refinedQueries = JSON.parse(content)
		} catch {
			// If parsing fails, try to extract queries from text
			const lines = content.split("\n").filter((line: string) => line.trim())
			refinedQueries = lines.slice(0, 2)
		}

		// Ensure we have exactly 2 queries
		if (!Array.isArray(refinedQueries) || refinedQueries.length !== 2) {
			throw new Error("Invalid response format")
		}

		return NextResponse.json({ refinedQueries })
	} catch (error) {
		console.error("Error refining query:", error)
		return NextResponse.json(
			{ error: "Failed to refine query" },
			{ status: 500 },
		)
	}
}
