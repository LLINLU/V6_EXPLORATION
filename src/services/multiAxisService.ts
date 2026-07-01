/**
 * Multi-Axis Keyword Service
 * Frontend service for interacting with multi-axis keyword generation edge functions
 * Adapted from reference repository's geminiService.ts
 */

// import { supabase } from "@/integrations/supabase/client" // TODO: Uncomment when keyword_axes table is created
import type {
	Axis,
	GroupedKeywords,
	Keyword,
	TechCharacteristic,
} from "@/types/axis"
import type { QuerySummary } from "@/types/services"

export type { QuerySummary }

/**
 * Get recommended axes for a given query
 * Adapted from: getRecommendedAxes in reference repo
 */
export async function getRecommendedAxes(query: string): Promise<Axis[]> {
	try {
		// Use local API route for development
		const response = await fetch("/api/generate-axes", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query }),
		})

		if (!response.ok) {
			const errorData = await response.json()
			console.error("Error generating axes:", errorData)
			throw new Error("Failed to generate exploration axes")
		}

		const data = await response.json()
		return data.axes || []
	} catch (error) {
		console.error("Exception in getRecommendedAxes:", error)
		throw error
	}
}

/**
 * Generate keywords for a specific axis
 * Adapted from: generateKeywordsForAxis in reference repo
 */
export async function generateKeywordsForAxis(
	query: string,
	axis: string,
): Promise<{ [axis: string]: Keyword[] }> {
	try {
		// Use local API route for development
		const response = await fetch("/api/generate-keywords-for-axis", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query, axis }),
		})

		if (!response.ok) {
			const errorData = await response.json()
			console.error("Error generating keywords:", errorData)
			throw new Error(`Failed to generate keywords for axis "${axis}"`)
		}

		const data = await response.json()

		// The response format is { [axis]: [{keyword, description}] }
		// We need to add the axis property to each keyword
		const axisData = data[axis] || []
		const keywordsWithAxis = axisData.map((kw: Omit<Keyword, "axis">) => ({
			...kw,
			axis,
		}))

		return { [axis]: keywordsWithAxis }
	} catch (error) {
		console.error("Exception in generateKeywordsForAxis:", error)
		throw error
	}
}

/**
 * Group selected keywords by their axis
 * Adapted from: groupKeywordsByAxis helper in reference repo
 * Used for passing to tree generation
 */
export function groupKeywordsByAxis(
	selectedKeywords: Keyword[],
): GroupedKeywords {
	return selectedKeywords.reduce((acc, kw) => {
		if (!acc[kw.axis]) {
			acc[kw.axis] = []
		}
		acc[kw.axis].push(kw.keyword)
		return acc
	}, {} as GroupedKeywords)
}

/**
 * Save multi-axis data to database
 * TODO: Create keyword_axes table in database before enabling this function
 */
export async function saveKeywordAxes(
	_query: string,
	_axes: Axis[],
	_selectedKeywords: Keyword[],
	_treeId?: string,
): Promise<void> {
	// TODO: Uncomment when keyword_axes table is created
	// try {
	// 	const {
	// 		data: { user },
	// 	} = await supabase.auth.getUser()

	// 	if (!user) {
	// 		throw new Error("User not authenticated")
	// 	}

	// 	const { error } = await supabase.from("keyword_axes").insert({
	// 		query,
	// 		axes: axes,
	// 		selected_keywords: selectedKeywords,
	// 		tree_id: treeId || null,
	// 		user_id: user.id,
	// 	})

	// 	if (error) {
	// 		console.error("Error saving keyword axes:", error)
	// 		throw new Error("Failed to save keyword axes")
	// 	}
	// } catch (error) {
	// 	console.error("Exception in saveKeywordAxes:", error)
	// 	throw error
	// }
	console.warn("saveKeywordAxes: Database table not yet created")
}

/**
 * Load keyword axes data for a tree
 * TODO: Create keyword_axes table in database before enabling this function
 */
export async function loadKeywordAxes(_treeId: string): Promise<{
	query: string
	axes: Axis[]
	selectedKeywords: Keyword[]
} | null> {
	// TODO: Uncomment when keyword_axes table is created
	// try {
	// 	const { data, error } = await supabase
	// 		.from("keyword_axes")
	// 		.select("*")
	// 		.eq("tree_id", treeId)
	// 		.order("created_at", { ascending: false })
	// 		.limit(1)
	// 		.single()

	// 	if (error) {
	// 		if (error.code === "PGRST116") {
	// 			// No rows returned
	// 			return null
	// 		}
	// 		console.error("Error loading keyword axes:", error)
	// 		throw new Error("Failed to load keyword axes")
	// 	}

	// 	return {
	// 		query: data.query,
	// 		axes: data.axes as Axis[],
	// 		selectedKeywords: data.selected_keywords as Keyword[],
	// 	}
	// } catch (error) {
	// 	console.error("Exception in loadKeywordAxes:", error)
	// 	throw error
	// }
	console.warn("loadKeywordAxes: Database table not yet created")
	return null
}

/**
 * Generate AI summary of a query
 * Provides TL;DR and detailed explanation of what the query is about
 * Adapted from: generateScenarioSummary in reference repo
 */
export async function generateQuerySummary(
	query: string,
	literacyLevel: "easy" | "standard" | "expert" = "standard",
): Promise<QuerySummary> {
	try {
		// Use local API route for development
		const response = await fetch("/api/generate-query-summary", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query, literacyLevel }),
		})

		if (!response.ok) {
			const errorData = await response.json()
			console.error("Error generating query summary:", errorData)
			throw new Error("Failed to generate query summary")
		}

		const data = await response.json()
		return {
			tldr: data.tldr || "",
			summary: data.summary || "",
		}
	} catch (error) {
		console.error("Exception in generateQuerySummary:", error)
		throw error
	}
}

/**
 * Generate technical characteristics for a query
 * Returns 5-7 key technical characteristics that users can select
 * Adapted from: generateTechCharacteristics in reference repo
 */
export async function generateTechCharacteristics(
	query: string,
): Promise<TechCharacteristic[]> {
	try {
		// Use local API route for development
		const response = await fetch("/api/generate-tech-characteristics", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query }),
		})

		if (!response.ok) {
			const errorData = await response.json()
			console.error("Error generating tech characteristics:", errorData)
			throw new Error("Failed to generate technical characteristics")
		}

		const data = await response.json()
		// Mark all as selected by default
		return (data.characteristics || []).map((char: TechCharacteristic) => ({
			...char,
			selected: true,
		}))
	} catch (error) {
		console.error("Exception in generateTechCharacteristics:", error)
		throw error
	}
}
