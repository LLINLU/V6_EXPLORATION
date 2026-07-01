import type { PapersWithSaved } from "@/integrations/supabase/types/more_types"

/**
 * Generate mock papers for a scenario
 * Frontend-only implementation for show purposes
 */
export function generateMockPapers(
	scenarioId: string,
	scenarioName: string,
	scenarioDescription?: string,
	count: number = 10,
): PapersWithSaved[] {
	const papers: PapersWithSaved[] = []
	const currentYear = new Date().getFullYear()

	// Sample keywords from scenario name/description
	const keywords = [
		...scenarioName.split(/\s+/).filter((w) => w.length > 3),
		...(scenarioDescription?.split(/\s+/) || []).filter((w) => w.length > 3),
	].slice(0, 5)

	// Sample author names
	const authorNames = [
		"John Smith, Jane Doe, Bob Johnson",
		"Alice Williams, Charlie Brown",
		"David Lee, Sarah Chen, Mike Zhang",
		"Emma Wilson, Tom Anderson",
		"Lisa Garcia, Robert Martinez",
	]

	// Sample journals
	const journals = [
		"Nature",
		"Science",
		"IEEE Transactions",
		"Journal of Applied Research",
		"ACM Conference Proceedings",
	]

	// Sample tags based on keywords
	const generateTags = (): string[] => {
		const allTags = [
			"machine learning",
			"artificial intelligence",
			"technology",
			"research",
			"innovation",
			"system",
			"application",
			"method",
			"analysis",
			"development",
		]
		return allTags.slice(0, Math.floor(Math.random() * 5) + 2)
	}

	for (let i = 0; i < count; i++) {
		const year = currentYear - Math.floor(Math.random() * 10)
		const month = Math.floor(Math.random() * 12) + 1
		const day = Math.floor(Math.random() * 28) + 1
		const date = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`

		const keyword =
			keywords[Math.floor(Math.random() * keywords.length)] || "technology"
		const title = `${keyword}-based Approach for ${scenarioName}: A Comprehensive Study`
		const abstract = `This paper presents a novel approach to ${scenarioName.toLowerCase()}. ${scenarioDescription || "We explore various methodologies and their applications."} Our research demonstrates significant improvements in efficiency and effectiveness. The proposed method shows promising results in real-world applications.`

		papers.push({
			id: `mock-paper-${scenarioId}-${i}`,
			title: title,
			authors: authorNames[Math.floor(Math.random() * authorNames.length)],
			journal: journals[Math.floor(Math.random() * journals.length)],
			abstract: abstract,
			date: date,
			citations: Math.floor(Math.random() * 200),
			doi: `10.1000/${scenarioId}-${i}`,
			score: Math.random() * 1.0,
			tags: generateTags() as any, // Json type in database
			saved: false,
			node_id: scenarioId,
			region: Math.random() > 0.5 ? "domestic" : "international",
			tree_id: "",
			team_id: null,
			user_id: null,
			url: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
	}

	return papers
}
