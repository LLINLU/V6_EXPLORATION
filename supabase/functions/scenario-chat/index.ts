import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const openAIApiKey = Deno.env.get("OPENAI_API_KEY")

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
}

const SCENARIO_CHAT_SYSTEM_PROMPT = `You are an expert AI research assistant specialized in analyzing technology scenarios, market opportunities, and strategic decision-making.

Your role is to help users:
1. Analyze and compare scenarios based on various metrics (TAM, TRL, market growth, difficulty, time to market)
2. Filter scenarios based on specific criteria
3. Identify high-potential opportunities and risks
4. Request specific data types (market trends, research papers, patents, competitive landscape)
5. Provide strategic recommendations

### Available Scenario Metrics:
- **TAM (Total Addressable Market)**: small, medium, large, very-large
- **TRL (Technology Readiness Level)**: early (1-3), mid (4-6), mature (7-9)
- **Implementation Difficulty**: low, medium, high
- **Time to Market**: short (<1yr), medium (1-3yr), long (>3yr)
- **Market Growth Rate**: Percentage annual growth
- **Tags**: Technology and domain tags

### Response Format:
You must respond in JSON format with the following structure:
{
  "content": "Your response message to the user",
  "actions": [
    {
      "type": "filter" | "regenerate" | "request_data",
      "payload": {
        // Action-specific payload
        // For filter: { "scenarioIds": ["id1", "id2"], "criteria": "description" }
        // For regenerate: { "criteria": "new criteria description" }
        // For request_data: { "scenarioId": "id", "dataType": "papers|patents|market|competitive" }
      }
    }
  ]
}

### Important Rules:
- Always provide clear, concise analysis
- When filtering, explain your criteria and why you selected those scenarios
- For comparisons, highlight key differentiators
- Be specific about what data would be most valuable
- If context is insufficient, ask clarifying questions
- Always include the "actions" array, even if empty

### Examples:

User: "Show me scenarios with TAM over $10B"
Response:
{
  "content": "I found X scenarios with TAM over $10B. These represent the largest market opportunities in your analysis:\\n\\n1. Scenario A - Very Large TAM ($50B+)\\n2. Scenario B - Large TAM ($10-50B)\\n\\nI've filtered the list to show only these high-TAM scenarios.",
  "actions": [
    {
      "type": "filter",
      "payload": {
        "scenarioIds": ["id1", "id2"],
        "criteria": "TAM over $10B"
      }
    }
  ]
}

User: "Compare the top 3 scenarios"
Response:
{
  "content": "Comparing your top 3 selected scenarios:\\n\\n**Scenario A:**\\n- TAM: Very Large\\n- TRL: Mature\\n- Difficulty: Medium\\n- Best for: Immediate market entry\\n\\n**Scenario B:**\\n- TAM: Large\\n- TRL: Mid\\n- Difficulty: High\\n- Best for: Long-term strategic positioning\\n\\n**Scenario C:**\\n- TAM: Medium\\n- TRL: Mature\\n- Difficulty: Low\\n- Best for: Quick wins",
  "actions": []
}

User: "Get market data for the AI healthcare scenario"
Response:
{
  "content": "I'll request comprehensive market data for the AI healthcare scenario. This will include:\\n\\n- Market size and growth trends\\n- Regional breakdown\\n- Key players and market share\\n- Investment activity\\n- Regulatory landscape\\n\\nThe data will be available shortly.",
  "actions": [
    {
      "type": "request_data",
      "payload": {
        "scenarioId": "scenario-id",
        "dataType": "market"
      }
    }
  ]
}
`

interface Scenario {
	id: string
	name: string
	description?: string
	metrics: {
		tamCategory?: string | null
		trlCategory?: string | null
		implementationDifficulty?: string | null
		timeToMarket?: string | null
		marketGrowthRate?: number | null
		trl?: number | null
	}
	tags: string[]
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response(null, {
			headers: corsHeaders,
		})
	}

	try {
		const { message, scenarios, selectedScenarioIds, pastMessages } =
			await req.json()

		if (!message) {
			return new Response(
				JSON.stringify({
					error: "Message is required",
				}),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			)
		}

		// Build context about scenarios
		let contextInfo = ""
		if (scenarios && Array.isArray(scenarios)) {
			contextInfo += `\n### Available Scenarios (${scenarios.length} total):\n`
			scenarios.forEach((scenario: Scenario) => {
				contextInfo += `\n**${scenario.name}** (ID: ${scenario.id})\n`
				if (scenario.description) {
					contextInfo += `Description: ${scenario.description}\n`
				}
				contextInfo += `TAM: ${scenario.metrics.tamCategory || "Unknown"}\n`
				contextInfo += `TRL: ${scenario.metrics.trlCategory || "Unknown"}\n`
				contextInfo += `Difficulty: ${scenario.metrics.implementationDifficulty || "Unknown"}\n`
				contextInfo += `Time to Market: ${scenario.metrics.timeToMarket || "Unknown"}\n`
				contextInfo += `Growth Rate: ${scenario.metrics.marketGrowthRate || "N/A"}%\n`
				contextInfo += `Tags: ${scenario.tags.join(", ") || "None"}\n`
			})
		}

		if (selectedScenarioIds && Array.isArray(selectedScenarioIds)) {
			contextInfo += `\n### Currently Selected Scenarios: ${selectedScenarioIds.length}\n`
			const selected = scenarios?.filter((s: Scenario) =>
				selectedScenarioIds.includes(s.id),
			)
			if (selected && selected.length > 0) {
				contextInfo += selected.map((s: Scenario) => s.name).join(", ")
			}
		}

		// Build messages array
		const messages: any[] = [
			{
				role: "system",
				content: SCENARIO_CHAT_SYSTEM_PROMPT + contextInfo,
			},
		]

		// Add past messages if provided
		if (pastMessages && Array.isArray(pastMessages)) {
			messages.push(...pastMessages)
		}

		// Add current user message
		messages.push({
			role: "user",
			content: message,
		})

		console.log("Calling OpenAI with", messages.length, "messages")

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${openAIApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: messages,
				response_format: { type: "json_object" },
			}),
		})

		if (!response.ok) {
			console.error("OpenAI API error:", response.status, response.statusText)
			let errorText = ""
			try {
				errorText = await response.text()
				console.error("Error details:", errorText)
			} catch (e) {
				console.error("Could not read error response:", e)
			}
			return new Response(
				JSON.stringify({
					error: "Failed to get response from OpenAI",
					details: `${response.status}: ${response.statusText}`,
					errorBody: errorText,
				}),
				{
					status: 500,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			)
		}

		const data = await response.json()
		const aiResponse = data.choices[0].message.content

		// Parse the JSON response
		let parsedResponse: { content: string; actions?: any[] }
		try {
			parsedResponse = JSON.parse(aiResponse)
		} catch (e) {
			console.error("Failed to parse AI response as JSON:", e)
			// Fallback to plain text response
			parsedResponse = {
				content: aiResponse,
				actions: [],
			}
		}

		return new Response(
			JSON.stringify({
				response: parsedResponse.content,
				actions: parsedResponse.actions || [],
			}),
			{
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			},
		)
	} catch (error) {
		console.error("Error in scenario-chat function:", error)
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: error.message,
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			},
		)
	}
})
