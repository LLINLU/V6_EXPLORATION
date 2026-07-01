/**
 * Scenario Metrics Service
 * Generates realistic dummy data for scenario metrics until backend is ready
 */

import type { ScenarioMetrics } from "@/types/scenario"

/**
 * Simple hash function to generate consistent values from scenario name
 */
function hashString(str: string): number {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash // Convert to 32bit integer
	}
	return Math.abs(hash)
}

/**
 * Seeded random number generator for consistency
 */
function seededRandom(seed: number): number {
	const x = Math.sin(seed) * 10000
	return x - Math.floor(x)
}

/**
 * Generate TAM (Total Addressable Market) value
 */
function generateTAM(seed: number): number {
	const random = seededRandom(seed)
	// Generate TAM between 0.1 and 100 billion
	const tam = 0.1 + random * 99.9
	return Math.round(tam * 10) / 10 // Round to 1 decimal place
}

/**
 * Categorize TAM value
 */
function categorizeTAM(tam: number | null): ScenarioMetrics["tamCategory"] {
	if (tam === null) return null
	if (tam < 1) return "small"
	if (tam < 10) return "medium"
	if (tam < 50) return "large"
	return "very-large"
}

/**
 * Categorize TRL value
 */
function categorizeTRL(trl: number | null): ScenarioMetrics["trlCategory"] {
	if (trl === null) return null
	if (trl <= 3) return "early"
	if (trl <= 6) return "mid"
	return "mature"
}

/**
 * Select random items from array
 */
function selectRandomItems<T>(
	array: T[],
	seed: number,
	min: number,
	max: number,
): T[] {
	const count = min + Math.floor(seededRandom(seed) * (max - min + 1))
	const shuffled = [...array].sort(
		(a, _b) => seededRandom(seed + array.indexOf(a)) - 0.5,
	)
	return shuffled.slice(0, count)
}

/**
 * Generate dummy metrics for a scenario
 */
export function generateDummyMetrics(scenarioName: string): ScenarioMetrics {
	const hash = hashString(scenarioName)

	// Generate TAM
	const tam = generateTAM(hash)
	const tamCategory = categorizeTAM(tam)

	// Generate TRL (1-9)
	const trl = 1 + Math.floor(seededRandom(hash + 1) * 9)
	const trlCategory = categorizeTRL(trl)

	// Generate market growth rate (5-50%)
	const marketGrowthRate = Math.round(5 + seededRandom(hash + 2) * 45)

	// Generate competitiveness (1-10)
	const competitiveness = Math.ceil(seededRandom(hash + 3) * 10)

	// Generate implementation difficulty
	const difficultyRandom = seededRandom(hash + 4)
	let implementationDifficulty: ScenarioMetrics["implementationDifficulty"]
	if (difficultyRandom < 0.33) {
		implementationDifficulty = "low"
	} else if (difficultyRandom < 0.66) {
		implementationDifficulty = "medium"
	} else {
		implementationDifficulty = "high"
	}

	// Generate time to market
	const timeRandom = seededRandom(hash + 5)
	let timeToMarket: ScenarioMetrics["timeToMarket"]
	if (timeRandom < 0.33) {
		timeToMarket = "short"
	} else if (timeRandom < 0.66) {
		timeToMarket = "medium"
	} else {
		timeToMarket = "long"
	}

	// Generate CAGR
	const cagr = 5 + (hash % 30) // 5-35%
	const cagrCategory =
		cagr < 10 ? "low" : cagr < 20 ? "medium" : cagr < 30 ? "high" : "very-high"

	// Generate counts
	const paperCount = 5 + (hash % 50)
	const patentCount = 1 + (hash % 20)
	const implementationCount = 1 + (hash % 15)

	return {
		tam,
		tamCategory,
		trl,
		trlCategory,
		marketGrowthRate,
		competitiveness,
		implementationDifficulty,
		timeToMarket,
		cagr,
		cagrCategory,
		paperCount,
		patentCount,
		implementationCount,
	}
}

/**
 * Generate dummy tags for a scenario
 */
export function generateDummyTags(
	scenarioName: string,
	mode: "TED" | "FAST",
): string[] {
	const hash = hashString(scenarioName)

	// Technology tags (common to both modes)
	const techTags = [
		"AI",
		"ML",
		"IoT",
		"Blockchain",
		"5G",
		"Quantum",
		"AR/VR",
		"Robotics",
		"Edge Computing",
		"Cloud",
		"Big Data",
		"Cybersecurity",
	]

	// Domain tags for TED mode (market/application focused)
	const domainTags = [
		"Healthcare",
		"Manufacturing",
		"Finance",
		"Transportation",
		"Energy",
		"Agriculture",
		"Education",
		"Retail",
		"Smart City",
		"Entertainment",
	]

	// Technical mechanism tags for FAST mode
	const mechanismTags = [
		"Data Processing",
		"Sensor Fusion",
		"Neural Networks",
		"Distributed Systems",
		"Real-time Analytics",
		"Computer Vision",
		"NLP",
		"Optimization",
		"Simulation",
		"Automation",
	]

	// Select appropriate tag pool based on mode
	const secondaryPool = mode === "TED" ? domainTags : mechanismTags

	// Select 2-4 random tags
	const selectedTech = selectRandomItems(techTags, hash, 1, 2)
	const selectedSecondary = selectRandomItems(secondaryPool, hash + 100, 1, 2)

	return [...selectedTech, ...selectedSecondary]
}

/**
 * Generate a short description for a scenario (optional)
 */
export function generateDummyDescription(
	scenarioName: string,
	mode: "TED" | "FAST",
): string {
	if (mode === "TED") {
		return `Exploring how ${scenarioName.toLowerCase()} can address market needs through innovative technology applications and business models.`
	} else {
		return `Technical approach to implement ${scenarioName.toLowerCase()} using advanced methodologies and system architecture.`
	}
}
