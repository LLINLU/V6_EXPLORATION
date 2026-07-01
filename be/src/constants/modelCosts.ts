/**
 * Anthropic model registry (cost + runtime config)
 */

//////////////////////////////
// Types
//////////////////////////////

export type AIModelId =
	| "claude-opus-4-6"
	| "claude-sonnet-4-6"
	| "claude-haiku-4-5"

export interface ModelCost {
	inputCostPerToken: number
	outputCostPerToken: number
	webSearchCostPerSearch: number
}

export interface ModelConfig extends ModelCost {
	/**
	 * Preferred model (usually short alias)
	 */
	model: string

	/**
	 * Optional versioned model (fallback / override)
	 */
	apiModel?: string

	maxTokens: number
	temperature: number
	maxSearches: number | null
}

//////////////////////////////
// Pricing Constants
//////////////////////////////

const WEB_SEARCH_COST_PER_SEARCH = 10 / 1_000

//////////////////////////////
// Model Registry
//////////////////////////////

export const MODELS = {
	"claude-opus-4-6": {
		model: "claude-opus-4-6",
		apiModel: "claude-opus-4-6",
		inputCostPerToken: 5 / 1_000_000,
		outputCostPerToken: 25 / 1_000_000,
		webSearchCostPerSearch: WEB_SEARCH_COST_PER_SEARCH,
		maxTokens: 8192,
		temperature: 0.7,
		maxSearches: null,
	},

	"claude-sonnet-4-6": {
		model: "claude-sonnet-4-6",
		apiModel: "claude-sonnet-4-6",
		inputCostPerToken: 3 / 1_000_000,
		outputCostPerToken: 15 / 1_000_000,
		webSearchCostPerSearch: WEB_SEARCH_COST_PER_SEARCH,
		maxTokens: 8192,
		temperature: 0.7,
		maxSearches: null,
	},

	"claude-haiku-4-5": {
		model: "claude-haiku-4-5",
		apiModel: "claude-haiku-4-5-20251001",
		inputCostPerToken: 1 / 1_000_000,
		outputCostPerToken: 5 / 1_000_000,
		webSearchCostPerSearch: WEB_SEARCH_COST_PER_SEARCH,
		maxTokens: 8192,
		temperature: 0.7,
		maxSearches: null,
	},
} satisfies Record<AIModelId, ModelConfig>

export const DEFAULT_SCENARIO_REPORT_MODEL_ID: AIModelId = "claude-opus-4-6"
export const DEFAULT_QUERY_REPORT_MODEL_ID: AIModelId = "claude-opus-4-6"

//////////////////////////////
// Helpers
//////////////////////////////

export function getModelList(): [AIModelId, ModelConfig][] {
	return Object.entries(MODELS) as [AIModelId, ModelConfig][]
}

export function estimateModelCost(args: {
	modelId: AIModelId
	inputTokens: number
	outputTokens: number
	webSearches?: number
}): number {
	const model = MODELS[args.modelId]

	return (
		args.inputTokens * model.inputCostPerToken +
		args.outputTokens * model.outputCostPerToken +
		(args.webSearches ?? 0) * model.webSearchCostPerSearch
	)
}
