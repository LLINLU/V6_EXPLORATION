import type { MetricsData } from "@/types/services"

export type { MetricsData }

export const generateInsightsData = (
	nodeId: string,
	_nodeTitle: string,
	level: number,
): MetricsData => {
	// Generate random but consistent data based on nodeId
	const seed = nodeId
		.split("")
		.reduce((acc, char) => acc + char.charCodeAt(0), 0)
	const random = (min: number, max: number) =>
		min + ((seed * 9301 + 49297) % (max - min))

	// Generate TAM based on level (higher levels = smaller TAM)
	const baseTAM = Math.max(1, 10 - level) * 1000000000 // $1B to $10B
	const tamVariation = random(50, 150) / 100
	const tam = Math.round(baseTAM * tamVariation)

	// Generate CAGR (5-45%)
	const cagr = random(5, 45)

	// TRL is now fetched from API, so we don't generate it anymore

	return {
		nodeId,
		tam: {
			value: tam,
			currency: "$",
			period: "by 2030",
		},
		cagr: {
			value: cagr,
			period: "2024-2030",
		},
	}
}
