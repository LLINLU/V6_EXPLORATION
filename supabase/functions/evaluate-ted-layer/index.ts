import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const openAIApiKey = Deno.env.get("OPENAI_API_KEY")

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
}

// Retry logic with exponential backoff
const retryWithBackoff = async (
	fn: () => Promise<Response>,
	maxRetries = 3,
) => {
	for (let i = 0; i <= maxRetries; i++) {
		try {
			const response = await fn()
			if (response.status === 429) {
				if (i === maxRetries)
					throw new Error("Rate limit exceeded after all retries")

				const retryAfter = response.headers.get("retry-after")
				const waitTime = retryAfter
					? parseInt(retryAfter) * 1000
					: 2 ** i * 1000

				console.log(
					`Rate limited, waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`,
				)
				await new Promise((resolve) => setTimeout(resolve, waitTime))
				continue
			}
			return response
		} catch (error) {
			if (i === maxRetries) throw error
			const waitTime = 2 ** i * 1000
			console.log(
				`Request failed, retrying in ${waitTime}ms (attempt ${i + 1}/${maxRetries}):`,
				error.message,
			)
			await new Promise((resolve) => setTimeout(resolve, waitTime))
		}
	}
	throw new Error("Max retries exceeded")
}

const TED_EVALUATOR_PROMPT = `You are an **expert evaluator of TED (Technology Element Decomposition) hierarchical trees** and are fully versed in the TED workshop technique developed by JAXA & Ritsumeikan University.

Your task is to **critically evaluate a SINGLE LAYER** of a TED tree and return a structured scorecard that diagnoses strengths, weaknesses, and concrete improvement actions.

### Layer Configuration
The current layer configuration is: Purpose → Function → Measure (3 layers)
- Purpose (目的): User-oriented goals expressed as verb + noun pairs
- Function (機能): Technical capabilities the artefact must perform to satisfy each purpose  
- Measure/Means (手段/技術): Concrete elements (materials, parts, algorithms, parameters, etc.) that realise each function

### Evaluation Criteria & Scoring Rules (Per Layer)

| Criterion                  | Max | What to Check for Single Layer                                                                        |
| -------------------------- | --- | ----------------------------------------------------------------------------------------------------- |
| **Layer Content Quality**  | 100 | Appropriate content for layer type; correct abstraction level; meaningful descriptions              |
| **MECE & Sibling Quality** | 100 | Exclusivity & exhaustiveness of sibling set; no overlaps or critical omissions                      |
| **Why-How Relationships**  | 100 | Logical relationships with parent layer (if applicable); proper abstraction progression             |
| **Naming Convention**      | 100 | Bilingual format compliance; verb-noun format for purposes; consistency and clarity                 |

* **Total Score** = sum of the four subscores (0–400).
* **Passing Grade** = 280 (70% threshold)
* If **Total < 280**, the layer **needs_regeneration**.

### Layer-Specific Evaluation Guidelines

**Purpose Layer (目的):**
- Check for verb + noun format
- Verify user-oriented goals (not technical features)
- Ensure appropriate abstraction level
- Confirm comprehensive coverage of user needs

**Function Layer (機能):**
- Verify technical capabilities (not implementations)
- Check logical connection to parent purposes
- Ensure MECE coverage of required functionality
- Confirm technology-agnostic descriptions

**Measure Layer (手段/技術):**
- Verify concrete, implementable elements
- Check specific technologies/methods/materials
- Ensure direct realization of parent functions
- Confirm measurable and actionable items

### Input Format
You will receive:
- layer_data: The generated layer with nodes
- parent_layer: Parent layer nodes (if applicable)
- original_query: The user's research query
- layer_context: Additional generation context

### Output Format (return **one** JSON object)

{
  "total_score": 0-400,
  "passing_grade": 280,
  "needs_regeneration": true | false,
  "evaluated_layer": "purpose|function|measure",
  "layer_content_quality": {
    "score": 0-100,
    "strengths": ["Appropriate abstraction level", "Clear descriptions", "..."],
    "weaknesses": ["Node X too abstract for this layer", "Missing key aspect", "..."],
    "suggestions": ["Make Node X more concrete", "Add coverage for Y", "..."]
  },
  "mece_sibling_quality": {
    "score": 0-100,
    "strengths": ["No overlaps detected", "Good coverage", "..."],
    "weaknesses": ["Overlap between Node A and B", "Missing coverage of Z", "..."],
    "suggestions": ["Merge similar nodes", "Add node for missing area", "..."]
  },
  "why_how_relationships": {
    "score": 0-100,
    "strengths": ["Clear parent-child logic", "Proper abstraction flow", "..."],
    "weaknesses": ["Node X doesn't support parent Y", "Abstraction jump too large", "..."],
    "suggestions": ["Revise Node X to better support parent", "Add intermediate concepts", "..."]
  },
  "naming_convention": {
    "score": 0-100,
    "strengths": ["Consistent bilingual format", "Clear verb-noun structure", "..."],
    "weaknesses": ["Missing English translation", "Unclear verb-noun format", "..."],
    "suggestions": ["Add English translations", "Restructure as verb + noun", "..."]
  },
  "overall_feedback": "Layer-specific feedback and improvement recommendations for this single layer.",
  "regeneration_priority": "high|medium|low"
}

### Quality Standards
- **Excellent (90-100)**: Exemplary TED compliance, perfect MECE, clear relationships
- **Good (80-89)**: Strong TED compliance, minor improvements needed
- **Passing (70-79)**: Acceptable quality, some refinements beneficial
- **Needs Work (60-69)**: Significant issues, regeneration recommended
- **Poor (<60)**: Major problems, regeneration required

Focus on actionable, specific feedback that will improve the layer quality in the next generation cycle.`

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders })
	}

	try {
		const {
			layer_data,
			parent_layer = [],
			original_query,
			layer_context = "",
		} = await req.json()

		console.log("Evaluating TED layer:", {
			layer: layer_data?.layer,
			nodes_count: layer_data?.nodes?.length,
			has_parents: parent_layer.length > 0,
		})

		if (!layer_data || !layer_data.nodes) {
			return new Response(
				JSON.stringify({ error: "layer_data with nodes is required" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		if (!openAIApiKey) {
			console.error("OpenAI API key is missing")
			return new Response(
				JSON.stringify({ error: "OpenAI API key not configured" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		const evaluationPrompt = `
Evaluate this TED layer:

**Layer Data:**
${JSON.stringify(layer_data, null, 2)}

**Parent Layer (if applicable):**
${parent_layer.length > 0 ? JSON.stringify(parent_layer, null, 2) : "This is the root Purpose layer."}

**Original Query:** "${original_query}"

**Context:** ${layer_context}

Provide a detailed evaluation with specific, actionable feedback for improving this layer.
    `

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
						{ role: "system", content: TED_EVALUATOR_PROMPT },
						{ role: "user", content: evaluationPrompt },
					],
					temperature: 0.3,
					max_tokens: 2000,
				}),
			})
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error(
				"OpenAI API error:",
				response.status,
				response.statusText,
				errorText,
			)
			return new Response(
				JSON.stringify({
					error: "Failed to evaluate TED layer",
					details: `OpenAI API returned ${response.status}: ${response.statusText}`,
					openai_error: errorText,
				}),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		const data = await response.json()
		console.log("OpenAI evaluation response received")

		const evaluationContent = data.choices?.[0]?.message?.content

		if (!evaluationContent) {
			console.error("No content in OpenAI response:", data)
			return new Response(
				JSON.stringify({ error: "No content received from OpenAI" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		// Try to parse JSON from the response
		let evaluationData: any
		try {
			evaluationData = JSON.parse(evaluationContent)
		} catch (_e) {
			// If JSON parsing fails, extract JSON from markdown or other formatting
			const jsonMatch = evaluationContent.match(/\{[\s\S]*\}/)
			if (jsonMatch) {
				try {
					evaluationData = JSON.parse(jsonMatch[0])
				} catch (parseError) {
					console.error("Failed to parse extracted JSON:", parseError)
					return new Response(
						JSON.stringify({
							error: "Failed to parse OpenAI evaluation response as JSON",
							raw_content: evaluationContent,
						}),
						{
							status: 500,
							headers: { ...corsHeaders, "Content-Type": "application/json" },
						},
					)
				}
			} else {
				console.error("No JSON found in OpenAI response:", evaluationContent)
				return new Response(
					JSON.stringify({
						error: "No valid JSON found in OpenAI evaluation response",
						raw_content: evaluationContent,
					}),
					{
						status: 500,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					},
				)
			}
		}

		return new Response(
			JSON.stringify({
				success: true,
				evaluation: evaluationData,
				raw_response: evaluationContent,
			}),
			{ headers: { ...corsHeaders, "Content-Type": "application/json" } },
		)
	} catch (error) {
		console.error("Error in evaluate-ted-layer function:", error)
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: error.message,
				stack: error.stack,
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		)
	}
})
