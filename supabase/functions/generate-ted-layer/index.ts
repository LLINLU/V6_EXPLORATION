import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const openAIApiKey = Deno.env.get("OPENAI_API_KEY")

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
}

// Improved retry logic with more conservative backoff
const retryWithBackoff = async (
	fn: () => Promise<Response>,
	maxRetries = 2,
) => {
	for (let i = 0; i <= maxRetries; i++) {
		try {
			const response = await fn()
			if (response.status === 429) {
				if (i === maxRetries) {
					console.log(
						"Rate limit exceeded after all retries, returning fallback",
					)
					throw new Error("RATE_LIMITED")
				}

				const retryAfter = response.headers.get("retry-after")
				// Cap wait time at 30 seconds max to avoid extremely long waits
				const waitTime = retryAfter
					? Math.min(parseInt(retryAfter) * 1000, 30000)
					: Math.min(2 ** i * 2000, 30000)

				console.log(
					`Rate limited, waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`,
				)
				await new Promise((resolve) => setTimeout(resolve, waitTime))
				continue
			}
			return response
		} catch (error) {
			if (error.message === "RATE_LIMITED") throw error
			if (i === maxRetries) throw error
			const waitTime = Math.min(2 ** i * 2000, 15000)
			console.log(
				`Request failed, retrying in ${waitTime}ms (attempt ${i + 1}/${maxRetries}):`,
				error.message,
			)
			await new Promise((resolve) => setTimeout(resolve, waitTime))
		}
	}
	throw new Error("Max retries exceeded")
}

// Fallback TED data generator
const generateFallbackTedLayer = (
	_query: string,
	targetLayer: "purpose" | "function" | "measure",
	parentNodes: any[] = [],
	language = "Japanese",
) => {
	const isEnglish = language === "English"
	const fallbackData = {
		purpose: {
			layer: "purpose",
			nodes: [
				{
					id: "purpose_1",
					name: isEnglish
						? "Improve Efficiency"
						: "効率を向上する((Improve Efficiency))",
					description: isEnglish
						? "Improve system operational efficiency to achieve better performance"
						: "システムの動作効率を向上させることで、より良いパフォーマンスを実現する",
					parent_id: null,
				},
				{
					id: "purpose_2",
					name: isEnglish
						? "Enhance Accuracy"
						: "精度を高める((Enhance Accuracy))",
					description: isEnglish
						? "Improve measurement and processing accuracy to obtain reliable results"
						: "測定や処理の精度を向上させることで、信頼性の高い結果を得る",
					parent_id: null,
				},
				{
					id: "purpose_3",
					name: isEnglish ? "Reduce Cost" : "コストを削減する((Reduce Cost))",
					description: isEnglish
						? "Reduce operational and development costs to achieve economic benefits"
						: "運用コストや開発コストを削減し、経済的な効果を実現する",
					parent_id: null,
				},
			],
			generation_metadata: {
				total_nodes: 3,
				abstraction_level: "high",
				coverage_note: "Fallback template covering common research purposes",
			},
		},
		function: {
			layer: "function",
			nodes: parentNodes.slice(0, 3).map((parent, index) => ({
				id: `function_${index + 1}`,
				name: isEnglish
					? `Function ${index + 1}`
					: `機能${index + 1}((Function ${index + 1}))`,
				description: isEnglish
					? `Concrete function to realize ${parent.name}`
					: `${parent.name}を実現するための具体的な機能`,
				parent_id: parent.id,
			})),
			generation_metadata: {
				total_nodes: Math.min(parentNodes.length, 3),
				abstraction_level: "medium",
				coverage_note: "Fallback functions based on purpose nodes",
			},
		},
		measure: {
			layer: "measure",
			nodes: parentNodes.slice(0, 3).map((parent, index) => ({
				id: `measure_${index + 1}`,
				name: isEnglish
					? `Measure ${index + 1}`
					: `手段${index + 1}((Measure ${index + 1}))`,
				description: isEnglish
					? `Specific technology or method to implement ${parent.name}`
					: `${parent.name}を実装するための具体的な技術や手法`,
				parent_id: parent.id,
			})),
			generation_metadata: {
				total_nodes: Math.min(parentNodes.length, 3),
				abstraction_level: "low",
				coverage_note: "Fallback measures based on function nodes",
			},
		},
	}

	return fallbackData[targetLayer]
}

const buildTedLayerPrompt = (language = "Japanese") => {
	const isEnglish = language === "English"

	const namingRule = isEnglish
		? "2. Output every node name as a plain **English phrase** (no Japanese, no bilingual suffix)"
		: "2. Output every node name in the format **日本語訳((English phrase))**"

	const purposeExample = isEnglish
		? `- Express as verb + noun pairs (e.g., "Improve diagnostic accuracy")`
		: `- Express as verb + noun pairs (e.g., "診断精度を向上する((Improve diagnostic accuracy))")`

	const nameFieldExample = isEnglish
		? `"name": "English Name"`
		: `"name": "日本語名((English Name))"`

	const descriptionNote = isEnglish
		? `"description": "Detailed description in English"`
		: `"description": "Detailed description in Japanese"`

	const namingQuality = isEnglish
		? "- Clear, concise English names"
		: "- Bilingual naming format consistently applied"

	return `You are an **expert facilitator of TED (Technology Element Decomposition) hierarchical trees** and are fully versed in the **TED workshop technique** developed by JAXA & Ritsumeikan University.

Your task is to generate ONE SPECIFIC LAYER of a TED hierarchy based on the user's input and any previously generated layers.

### Layer Configuration
The current layer configuration is: Purpose → Function → Measure (3 layers)
- Purpose (目的): User-oriented goals expressed as verb + noun pairs
- Function (機能): Technical capabilities the artefact must perform to satisfy each purpose
- Measure/Means (手段/技術): Concrete elements (materials, parts, algorithms, parameters, etc.) that realise each function

### Generation Rules for Single Layer
1. Generate ONLY the requested layer (Purpose, Function, or Measure)
${namingRule}
3. Generate 3-4 nodes for the layer to ensure comprehensive coverage
4. Ensure siblings are mutually exclusive and collectively exhaustive (MECE)
5. Follow Why-How logic: child answers HOW parent is achieved, parent answers WHY child exists
6. Use appropriate abstraction level for the layer type

### Layer-Specific Guidelines

**Purpose Layer (目的):**
${purposeExample}
- Focus on user-oriented goals and benefits
- Abstract enough to encompass multiple technical approaches
- Answer "What value does this provide to users?"

**Function Layer (機能):**
- Technical capabilities and features required
- More concrete than purposes but still technology-agnostic
- Focus on "what the system must do" rather than "how it does it"
- Each function should directly support a parent purpose

**Measure Layer (手段/技術):**
- Concrete implementation elements
- Specific technologies, materials, algorithms, components
- Measurable and implementable items
- Direct technical solutions that realize parent functions

### Input Format
You will receive:
- query: The original user research query
- target_layer: The layer to generate (purpose, function, or measure)
- parent_nodes: Array of parent layer nodes (empty for purpose layer)
- context: Any additional context from previous generations

### Output Format
Return a JSON object with this exact structure:
{
  "layer": "purpose|function|measure",
  "nodes": [
    {
      "id": "unique_id",
      ${nameFieldExample},
      ${descriptionNote},
      "parent_id": "parent_node_id_or_null_for_purpose"
    }
  ],
  "generation_metadata": {
    "total_nodes": number,
    "abstraction_level": "high|medium|low",
    "coverage_note": "Brief explanation of coverage strategy"
  }
}

### Quality Requirements
- Each node must be distinct and non-overlapping with siblings
- Complete coverage of the parent scope (for function/measure layers)
- Appropriate abstraction level for the layer
- Clear Why-How relationships between layers
${namingQuality}
- Comprehensive but not excessive (3-4 nodes typically optimal)

Focus on generating high-quality, TED-compliant nodes for the specified layer only.`
}

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders })
	}

	try {
		const {
			query,
			target_layer,
			parent_nodes = [],
			context = "",
			language = "Japanese",
		} = await req.json()

		console.log("Generating TED layer:", {
			target_layer,
			query,
			parent_nodes_count: parent_nodes.length,
			language,
		})

		if (!query || !target_layer) {
			return new Response(
				JSON.stringify({ error: "Query and target_layer are required" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		if (!openAIApiKey) {
			console.error("OpenAI API key is missing, using fallback")
			const fallbackData = generateFallbackTedLayer(
				query,
				target_layer,
				parent_nodes,
				language,
			)
			return new Response(
				JSON.stringify({
					success: true,
					layer_data: fallbackData,
					fallback_used: true,
					fallback_reason: "OpenAI API key not configured",
				}),
				{ headers: { ...corsHeaders, "Content-Type": "application/json" } },
			)
		}

		const contextPrompt = `
User Query: "${query}"
Target Layer: ${target_layer}
${parent_nodes.length > 0 ? `Parent Nodes: ${JSON.stringify(parent_nodes, null, 2)}` : "This is the root Purpose layer."}
${context ? `Additional Context: ${context}` : ""}

Generate the ${target_layer} layer following TED methodology. Be concise and generate exactly 3-4 high-quality nodes.
    `

		try {
			const response = await retryWithBackoff(async () => {
				return await fetch("https://api.openai.com/v1/chat/completions", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${openAIApiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						model: "gpt-4o-mini",
						messages: [
							{ role: "system", content: buildTedLayerPrompt(language) },
							{ role: "user", content: contextPrompt },
						],
						temperature: 0.7,
						max_tokens: 1500,
					}),
				})
			})

			if (!response.ok) {
				throw new Error(
					`OpenAI API returned ${response.status}: ${response.statusText}`,
				)
			}

			const data = await response.json()
			console.log("OpenAI response received for layer generation")

			const generatedContent = data.choices?.[0]?.message?.content

			if (!generatedContent) {
				throw new Error("No content received from OpenAI")
			}

			// Try to parse JSON from the response
			let layerData: any
			try {
				layerData = JSON.parse(generatedContent)
			} catch (_e) {
				// If JSON parsing fails, extract JSON from markdown or other formatting
				const jsonMatch = generatedContent.match(/\{[\s\S]*\}/)
				if (jsonMatch) {
					try {
						layerData = JSON.parse(jsonMatch[0])
					} catch (_parseError) {
						throw new Error("Failed to parse OpenAI response as JSON")
					}
				} else {
					throw new Error("No valid JSON found in OpenAI response")
				}
			}

			// Validate the response structure
			if (
				!layerData.layer ||
				!layerData.nodes ||
				!Array.isArray(layerData.nodes)
			) {
				throw new Error("Invalid layer data structure received from OpenAI")
			}

			return new Response(
				JSON.stringify({
					success: true,
					layer_data: layerData,
					fallback_used: false,
				}),
				{ headers: { ...corsHeaders, "Content-Type": "application/json" } },
			)
		} catch (error) {
			console.error("OpenAI API failed, using fallback:", error.message)

			// Use fallback data when OpenAI fails
			const fallbackData = generateFallbackTedLayer(
				query,
				target_layer,
				parent_nodes,
				language,
			)
			return new Response(
				JSON.stringify({
					success: true,
					layer_data: fallbackData,
					fallback_used: true,
					fallback_reason: error.message.includes("RATE_LIMITED")
						? "OpenAI rate limit exceeded"
						: "OpenAI API error",
				}),
				{ headers: { ...corsHeaders, "Content-Type": "application/json" } },
			)
		}
	} catch (error) {
		console.error("Error in generate-ted-layer function:", error)

		// Even in case of general errors, try to provide fallback
		try {
			const { query, target_layer, parent_nodes = [] } = await req.json()
			const fallbackData = generateFallbackTedLayer(
				query || "research query",
				target_layer || "purpose",
				parent_nodes,
			)

			return new Response(
				JSON.stringify({
					success: true,
					layer_data: fallbackData,
					fallback_used: true,
					fallback_reason: "System error, using template data",
				}),
				{ headers: { ...corsHeaders, "Content-Type": "application/json" } },
			)
		} catch (_fallbackError) {
			return new Response(
				JSON.stringify({
					error: "Internal server error",
					details: error.message,
				}),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}
	}
})
