export interface NodeSuggestion {
	id: string
	title: string
	level: number
	description?: string
}

export interface ChatMessage {
	type?: "user" | "ai" | "text" | "suggestion"
	content: string
	timestamp?: number
	isUser?: boolean
	isGuidance?: boolean
	suggestions?: NodeSuggestion[]
	suggestion?: NodeSuggestion
	showCheckResults?: boolean
	nodeTitle?: string
	selectedNodes?: any[]
	isDeepAnalysis?: boolean
	metadata?: {
		paperTitle?: string
		analysisDirection?: string
	}
}
