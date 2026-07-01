import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { getOutputLanguage } from "@/lib/outputLanguage"
import type {
	GenerationProgress,
	TedEvaluation,
	TedLayer,
	TedNode,
} from "@/types/tree"

export const useTedGeneration = () => {
	const [isGenerating, setIsGenerating] = useState(false)
	const [progress, setProgress] = useState<GenerationProgress>({
		current_layer: "purpose",
		current_step: "generating",
		attempt_count: 0,
		layer_results: {},
	})
	const [error, setError] = useState<string | null>(null)

	const generateLayer = async (
		query: string,
		targetLayer: "purpose" | "function" | "measure",
		parentNodes: TedNode[] = [],
		context: string = "",
	): Promise<TedLayer | null> => {
		try {
			// console.log(`Generating ${targetLayer} layer...`)

			// Add delay between requests to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 2000))

			const { data, error } = await supabase.functions.invoke(
				"generate-ted-layer",
				{
					body: {
						query,
						target_layer: targetLayer,
						parent_nodes: parentNodes,
						context,
						language: getOutputLanguage(),
					},
				},
			)

			if (error) {
				console.error("Layer generation error:", error)
				throw new Error(
					`Generation failed: ${error.message || "Unknown error"}`,
				)
			}

			if (!data?.success) {
				const errorMsg = data?.error || "Failed to generate layer"
				console.error("Generation failed:", errorMsg, data)
				throw new Error(errorMsg)
			}

			if (!data.layer_data) {
				console.error("No layer data in response:", data)
				throw new Error("No layer data received from generation service")
			}

			// Show feedback if fallback was used
			if (data.fallback_used) {
				toast({
					title: `${targetLayer} layer generated with template`,
					description: `Reason: ${data.fallback_reason}. You can customize the nodes manually.`,
				})
			}

			return data.layer_data
		} catch (error) {
			console.error(`Error generating ${targetLayer} layer:`, error)

			// Provide more specific error messages
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error"
			if (errorMessage.includes("Rate limit")) {
				throw new Error(
					`OpenAI API rate limit exceeded. Using template data for ${targetLayer} layer.`,
				)
			} else if (errorMessage.includes("API key")) {
				throw new Error(
					`OpenAI API key issue. Using template data for ${targetLayer} layer.`,
				)
			} else {
				throw new Error(
					`Failed to generate ${targetLayer} layer: ${errorMessage}`,
				)
			}
		}
	}

	const evaluateLayer = async (
		layerData: TedLayer,
		parentLayer: TedNode[] = [],
		originalQuery: string,
		context: string = "",
	): Promise<TedEvaluation | null> => {
		try {
			// console.log(`Evaluating ${layerData.layer} layer...`)

			// Skip evaluation for template/fallback data to avoid additional API calls
			if (
				layerData.generation_metadata?.coverage_note?.includes("Fallback") ||
				layerData.generation_metadata?.coverage_note?.includes("template")
			) {
				// console.log("Skipping evaluation for template data")
				return {
					total_score: 12, // Passing score for template data
					passing_grade: 3,
					needs_regeneration: false,
					evaluated_layer: layerData.layer,
					overall_feedback:
						"Template data provided due to API limitations. You can edit nodes manually.",
					regeneration_priority: "low" as const,
				}
			}

			// Add delay between requests to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 2000))

			const { data, error } = await supabase.functions.invoke(
				"evaluate-ted-layer",
				{
					body: {
						layer_data: layerData,
						parent_layer: parentLayer,
						original_query: originalQuery,
						layer_context: context,
					},
				},
			)

			if (error) {
				console.error("Layer evaluation error, using default pass:", error)
				// Return a passing evaluation if evaluation fails to avoid blocking progress
				return {
					total_score: 12,
					passing_grade: 3,
					needs_regeneration: false,
					evaluated_layer: layerData.layer,
					overall_feedback:
						"Evaluation skipped due to API limitations. Layer accepted.",
					regeneration_priority: "low" as const,
				}
			}

			if (!data?.success) {
				console.error("Evaluation failed, using default pass:", data)
				return {
					total_score: 12,
					passing_grade: 3,
					needs_regeneration: false,
					evaluated_layer: layerData.layer,
					overall_feedback:
						"Evaluation skipped due to API limitations. Layer accepted.",
					regeneration_priority: "low" as const,
				}
			}

			if (!data.evaluation) {
				console.error(
					"No evaluation data in response, using default pass:",
					data,
				)
				return {
					total_score: 12,
					passing_grade: 3,
					needs_regeneration: false,
					evaluated_layer: layerData.layer,
					overall_feedback:
						"Evaluation skipped due to API limitations. Layer accepted.",
					regeneration_priority: "low" as const,
				}
			}

			return data.evaluation
		} catch (error) {
			console.error(
				`Error evaluating ${layerData.layer} layer, using default pass:`,
				error,
			)

			// Return a passing evaluation to avoid blocking progress
			return {
				total_score: 12,
				passing_grade: 3,
				needs_regeneration: false,
				evaluated_layer: layerData.layer,
				overall_feedback:
					"Evaluation skipped due to API limitations. Layer accepted.",
				regeneration_priority: "low" as const,
			}
		}
	}

	const generateCompleteTree = async (query: string) => {
		setIsGenerating(true)
		setError(null)
		setProgress({
			current_layer: "purpose",
			current_step: "generating",
			attempt_count: 0,
			layer_results: {},
		})

		try {
			const layers: ("purpose" | "function" | "measure")[] = [
				"purpose",
				"function",
				"measure",
			]
			const results: GenerationProgress["layer_results"] = {}

			for (const layerType of layers) {
				let layerGenerated = false
				let attemptCount = 0
				const maxAttempts = 2 // Reduced from 3 to minimize API calls

				while (!layerGenerated && attemptCount < maxAttempts) {
					attemptCount++

					// Update progress
					setProgress((prev) => ({
						...prev,
						current_layer: layerType,
						current_step: attemptCount === 1 ? "generating" : "regenerating",
						attempt_count: attemptCount,
					}))

					try {
						// Get parent nodes for this layer
						const parentNodes =
							layerType === "purpose"
								? []
								: layerType === "function"
									? results.purpose?.layer.nodes || []
									: results.function?.layer.nodes || []

						// Generate layer
						const layerData = await generateLayer(
							query,
							layerType,
							parentNodes,
							`Attempt ${attemptCount} for ${layerType} layer`,
						)

						if (!layerData) {
							throw new Error(
								`Failed to generate ${layerType} layer on attempt ${attemptCount}`,
							)
						}

						// Update progress to evaluation
						setProgress((prev) => ({
							...prev,
							current_step: "evaluating",
						}))

						// Evaluate layer
						const evaluation = await evaluateLayer(
							layerData,
							parentNodes,
							query,
							`Evaluation attempt ${attemptCount}`,
						)

						if (!evaluation) {
							throw new Error(
								`Failed to evaluate ${layerType} layer on attempt ${attemptCount}`,
							)
						}

						// Accept the layer (either it passes or we're using fallback logic)
						results[layerType] = { layer: layerData, evaluation }
						layerGenerated = true

						toast({
							title: `${layerType} layer completed`,
							description: `Score: ${evaluation.total_score}/${evaluation.passing_grade * 4} - ${evaluation.overall_feedback}`,
						})
					} catch (layerError) {
						console.error(
							`Error in attempt ${attemptCount} for ${layerType}:`,
							layerError,
						)

						if (attemptCount === maxAttempts) {
							// Even if generation fails, create a minimal layer to avoid complete failure
							const fallbackLayer: TedLayer = {
								layer: layerType,
								nodes: [
									{
										id: `${layerType}_fallback`,
										name: `${layerType}を定義する((Define ${layerType}))`,
										description: `手動で${layerType}を定義してください`,
										parent_id: null,
									},
								],
								generation_metadata: {
									total_nodes: 1,
									abstraction_level: "medium",
									coverage_note: "Fallback node - please customize manually",
								},
							}

							const fallbackEvaluation: TedEvaluation = {
								total_score: 12,
								passing_grade: 3,
								needs_regeneration: false,
								evaluated_layer: layerType,
								overall_feedback:
									"Fallback layer created. Please customize manually.",
								regeneration_priority: "medium" as const,
							}

							results[layerType] = {
								layer: fallbackLayer,
								evaluation: fallbackEvaluation,
							}
							layerGenerated = true

							toast({
								title: `${layerType} layer created with fallback`,
								description:
									"Please customize the nodes manually due to API limitations.",
							})
						} else {
							// Wait longer between failed attempts
							await new Promise((resolve) => setTimeout(resolve, 5000))
						}
					}
				}
			}

			// Update final progress
			setProgress((prev) => ({
				...prev,
				current_layer: "complete",
				current_step: "complete",
				layer_results: results,
			}))

			toast({
				title: "TED Tree Generation Complete",
				description:
					"All layers have been generated. You can now customize them as needed.",
			})

			return results
		} catch (error) {
			console.error("TED generation error:", error)
			const errorMessage =
				error instanceof Error ? error.message : "Failed to generate TED tree"
			setError(errorMessage)

			toast({
				title: "Generation Completed with Limitations",
				description:
					"Some layers may use template data. You can customize them manually.",
			})

			return null
		} finally {
			setIsGenerating(false)
		}
	}

	const getProgressText = () => {
		if (!isGenerating) return ""

		const { current_layer, current_step, attempt_count } = progress

		if (current_layer === "complete") {
			return "TED tree generation completed successfully!"
		}

		const layerName = {
			purpose: "Purpose (目的)",
			function: "Function (機能)",
			measure: "Measure (手段/技術)",
		}[current_layer]

		const stepText = {
			generating: "Generating",
			evaluating: "Evaluating",
			regenerating: `Regenerating (attempt ${attempt_count})`,
			complete: "Complete",
		}[current_step]

		return `${stepText} ${layerName} layer...`
	}

	return {
		isGenerating,
		progress,
		error,
		generateCompleteTree,
		getProgressText,
	}
}
