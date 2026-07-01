/**
 * API endpoint for generating source pool data
 * Returns research papers, patents, and market implementations for a query
 * Adapted from getQuantitativeData in external repo
 */

import { type NextRequest, NextResponse } from "next/server"
import type {
	AcademicPaper,
	MarketImplementation,
	Patent,
	QuantitativeData,
} from "@/types/sourcePool"

function invertAbstract(invertedIndex: Record<string, number[]>): string {
	const terms = Object.keys(invertedIndex)
	const wordList: { word: string; pos: number }[] = []
	terms.forEach((term) => {
		invertedIndex[term].forEach((pos) => {
			wordList.push({ word: term, pos })
		})
	})
	wordList.sort((a, b) => a.pos - b.pos)
	return wordList.map((item) => item.word).join(" ")
}

async function searchAcademicPapersPaginated(
	query: string,
	perPage = 50,
	page = 1,
): Promise<AcademicPaper[]> {
	const res = await fetch(
		`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${perPage}&page=${page}&sort=relevance_score:desc`,
	)
	if (!res.ok) throw new Error("OpenAlex APIからの論文取得に失敗しました。")

	const data = await res.json()
	if (!data.results) return []

	const papers: AcademicPaper[] = data.results.map((item: any) => ({
		title: item.title,
		authors: item.authorships
			.map((a: any) => a.author.display_name)
			.filter(Boolean),
		year: item.publication_year,
		link: item.doi || `https://openalex.org/${item.id}`,
		abstract: item.abstract_inverted_index
			? invertAbstract(item.abstract_inverted_index)
			: "No abstract available.",
	}))
	return papers
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

		const patentPrompt = `調査テーマ「${query}」に関連する重要な特許を5つリストアップしてください。年、タイトル、そして可能であればGoogle Patentsへのリンクを含めてください。結果はJSONオブジェクトとして返してください。{"patents": [{"year": 数値, "title": "タイトル", "link": "リンクURL"}, ...]} の形式で返してください。`

		const implPrompt = `調査テーマ「${query}」に関連する市場での実装例や製品を5つリストアップしてください。年、名前、簡単な概要、そして可能であれば公式ウェブサイトへのリンクを含めてください。結果はJSONオブジェクトとして返してください。{"implementations": [{"year": 数値, "name": "名前", "summary": "概要", "link": "リンクURL"}, ...]} の形式で返してください。`

		// Fetch papers from OpenAlex and generate patents/implementations with OpenAI
		const [papers, patentResponse, implResponse] = await Promise.all([
			searchAcademicPapersPaginated(query, 50, 1),
			fetch("https://api.openai.com/v1/chat/completions", {
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
								"You are a patent research assistant. Always return valid JSON objects with a 'patents' array property.",
						},
						{
							role: "user",
							content: patentPrompt,
						},
					],
					response_format: { type: "json_object" },
				}),
			}),
			fetch("https://api.openai.com/v1/chat/completions", {
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
								"You are a market research assistant. Always return valid JSON objects with an 'implementations' array property.",
						},
						{
							role: "user",
							content: implPrompt,
						},
					],
					response_format: { type: "json_object" },
				}),
			}),
		])

		if (!patentResponse.ok || !implResponse.ok) {
			throw new Error("Failed to generate patents or implementations")
		}

		const patentData = await patentResponse.json()
		const implData = await implResponse.json()

		// Parse the responses - OpenAI returns JSON object
		let patents: Patent[] = []
		let implementations: MarketImplementation[] = []

		try {
			const patentContent = JSON.parse(patentData.choices[0].message.content)
			// Extract patents array from response object
			patents =
				patentContent.patents ||
				patentContent.data ||
				(Array.isArray(patentContent) ? patentContent : [])

			const implContent = JSON.parse(implData.choices[0].message.content)
			// Extract implementations array from response object
			implementations =
				implContent.implementations ||
				implContent.data ||
				(Array.isArray(implContent) ? implContent : [])
		} catch (e) {
			console.error("Failed to parse AI responses:", e)
			// Return empty arrays if parsing fails
			patents = []
			implementations = []
		}

		const quantitativeData: QuantitativeData = {
			papers,
			patents,
			implementations,
			paperCount: papers.length,
			patentCount: patents.length,
			implementationCount: implementations.length,
		}

		return NextResponse.json(quantitativeData)
	} catch (error) {
		console.error("Error in generate-source-pool API:", error)
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		)
	}
}
