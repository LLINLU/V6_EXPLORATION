// Mock Python API integration for tree enrichment
// This will be replaced with actual API call when Python API is ready

import type {
	EnrichedScenarioResponse,
	Paper,
	ScenarioTreeInput,
	UseCase,
} from "../../../api-specifications/python-api-types.ts"

/**
 * Mock function to simulate Python API call for tree enrichment
 * Returns enriched tree data with papers and use cases for each node
 */
export async function callPythonEnrichmentAPI(
	scenarioTree: ScenarioTreeInput,
): Promise<EnrichedScenarioResponse> {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 1000))

	console.log(`[MOCK API] Processing tree: ${scenarioTree.treeId}`)
	console.log(`[MOCK API] Scenario: ${scenarioTree.scenarioNode.title}`)

	// Generate mock enriched data for the entire subtree
	const enrichedNode = enrichNodeWithMockData(scenarioTree.scenarioNode)

	return {
		treeId: scenarioTree.treeId,
		scenarioNode: enrichedNode,
	}
}

/**
 * Recursively enrich each node with mock papers and use cases
 */
function enrichNodeWithMockData(node: any): any {
	const papers = generateMockPapers(node.title, node.level)
	const useCases = generateMockUseCases(node.title, node.level)

	const enrichedChildren = node.children.map((child: any) =>
		enrichNodeWithMockData(child),
	)

	return {
		...node,
		papers,
		useCases,
		children: enrichedChildren,
	}
}

/**
 * Generate mock papers based on node title and level
 */
function generateMockPapers(nodeTitle: string, _level: number): Paper[] {
	const paperCount = Math.floor(Math.random() * 5) + 1 // 1-5 papers
	const papers: Paper[] = []

	for (let i = 0; i < paperCount; i++) {
		const paperId = crypto.randomUUID() // Use proper UUID
		papers.push({
			id: paperId, // API-generated UUID
			title: `${nodeTitle}: Research Paper ${i + 1}`,
			authors: generateMockAuthors(),
			journal: generateMockJournal(),
			tags: generateMockTags(nodeTitle),
			abstract: `This paper explores advanced techniques in ${nodeTitle.toLowerCase()}. The research demonstrates significant improvements in performance and efficiency through innovative approaches. The findings contribute to the advancement of the field and provide practical insights for implementation.`,
			date: generateRandomDate(),
			citations: Math.floor(Math.random() * 200) + 10,
			region: Math.random() > 0.5 ? "international" : "domestic",
			doi: `10.1000/mock.${paperId.split("-")[0]}`,
			url: `https://example.com/paper/${paperId}`,
		})
	}

	return papers
}

/**
 * Generate mock use cases based on node title and level
 */
function generateMockUseCases(nodeTitle: string, _level: number): UseCase[] {
	const useCaseCount = Math.floor(Math.random() * 3) + 1 // 1-3 use cases
	const useCases: UseCase[] = []

	for (let i = 0; i < useCaseCount; i++) {
		const useCaseId = crypto.randomUUID() // Use proper UUID
		const releases = Math.floor(Math.random() * 15) + 1

		// Generate 1-3 press releases per use case
		const prCount = Math.min(releases, 3)
		const pressReleases: Array<{ title: string; url: string; date?: string }> =
			[]

		for (let j = 0; j < prCount; j++) {
			pressReleases.push({
				title: `${nodeTitle} Implementation Milestone ${j + 1}`,
				url: `https://example.com/press-release/${useCaseId}-${j}`,
				date: generateRandomDate(),
			})
		}

		useCases.push({
			id: useCaseId, // API-generated UUID
			title: `${nodeTitle} Implementation Case ${i + 1}`,
			description: `Real-world implementation of ${nodeTitle.toLowerCase()} technology demonstrating practical applications and measurable results. This case study showcases successful deployment and operational benefits achieved through innovative technical solutions.`,
			releases,
			pressReleases,
		})
	}

	return useCases
}

/**
 * Helper functions for generating mock data
 */
function generateMockAuthors(): string {
	const firstNames = [
		"Alice",
		"Bob",
		"Charlie",
		"Diana",
		"Eric",
		"Fiona",
		"George",
		"Helen",
	]
	const lastNames = [
		"Smith",
		"Johnson",
		"Williams",
		"Brown",
		"Jones",
		"Garcia",
		"Miller",
		"Davis",
	]

	const authorCount = Math.floor(Math.random() * 3) + 1 // 1-3 authors
	const authors: string[] = []

	for (let i = 0; i < authorCount; i++) {
		const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
		const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
		authors.push(`${firstName} ${lastName}`)
	}

	return authors.join(", ")
}

function generateMockJournal(): string {
	const journals = [
		"Nature Technology",
		"Science Advances",
		"IEEE Transactions on Technology",
		"Journal of Applied Sciences",
		"Advanced Materials Research",
		"Technology Review",
		"International Journal of Innovation",
	]

	return journals[Math.floor(Math.random() * journals.length)]
}

function generateMockTags(nodeTitle: string): string[] {
	const baseTags = ["research", "innovation", "technology"]
	const specificTags = nodeTitle.toLowerCase().split(" ").slice(0, 3)
	return [...baseTags, ...specificTags].slice(0, 5)
}

function generateRandomDate(): string {
	const start = new Date(2020, 0, 1)
	const end = new Date()
	const randomDate = new Date(
		start.getTime() + Math.random() * (end.getTime() - start.getTime()),
	)
	return randomDate.toISOString().split("T")[0] // YYYY-MM-DD format
}
