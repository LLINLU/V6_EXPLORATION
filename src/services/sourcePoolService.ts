/**
 * Source Pool Service
 * Service for generating and managing source pool data (papers, patents, implementations)
 */

import type { QuantitativeData } from "@/types/sourcePool"

export async function generateSourcePool(
	query: string,
): Promise<QuantitativeData> {
	try {
		const response = await fetch("/api/generate-source-pool", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query }),
		})

		if (!response.ok) {
			const errorData = await response.json()
			console.error("Error generating source pool:", errorData)
			throw new Error("Failed to generate source pool")
		}

		const data = await response.json()
		return data as QuantitativeData
	} catch (error) {
		console.error("Exception in generateSourcePool:", error)
		throw error
	}
}
