import type { ChatMessage, NodeSuggestion } from "@/types/chat"

const generateNodeSuggestion = (message: string): NodeSuggestion => {
	// Extract potential topics from the message
	const topicKeywords = [
		"glaucoma",
		"retinal",
		"vision",
		"disease",
		"detection",
		"screening",
		"neural network",
		"deep learning",
		"machine learning",
		"algorithm",
		"diagnosis",
		"medical",
		"healthcare",
		"imaging",
		"analysis",
		"classification",
		"computer vision",
		"AI",
		"artificial intelligence",
	]

	// Check if any keywords appear in the message
	const matchedKeywords = topicKeywords.filter((keyword) =>
		message.toLowerCase().includes(keyword.toLowerCase()),
	)

	// Generate title based on matched keywords or use a default
	let title = ""
	let description = ""

	if (matchedKeywords.length > 0) {
		// Use matched keywords to create a more relevant title and description
		if (message.toLowerCase().includes("glaucoma")) {
			title = "Automated Glaucoma Screening"
			description =
				"Combines computer vision and AI to provide rapid screening of glaucoma indicators in retinal images."
		} else if (
			message.toLowerCase().includes("neural") ||
			message.toLowerCase().includes("deep learning")
		) {
			title = "Neural Network Disease Classification"
			description =
				"Leverages deep learning architectures to classify multiple retinal conditions from single-image inputs."
		} else if (
			message.toLowerCase().includes("detection") ||
			message.toLowerCase().includes("screening")
		) {
			title = "AI-Powered OCT Analysis"
			description =
				"Implements machine learning algorithms to analyze optical coherence tomography images for early disease detection."
		} else {
			title = "Computer-Aided Diagnosis System"
			description =
				"Develops an automated system for assisting clinicians in diagnosing retinal pathologies."
		}
	} else {
		// Default if no keywords match
		title = "網膜疾患検出のための深層学習"
		description =
			"畳み込みニューラルネットワークを使用して、OCTスキャンから網膜疾患を高精度で自動的に検出および分類します。"
	}

	return {
		id: Math.random().toString(36).substr(2, 9),
		level: 2,
		title,
		description,
	}
}

export const processUserMessage = (message: string): ChatMessage => {
	const suggestion = generateNodeSuggestion(message)

	return {
		content: `了解しました — あなたの考えに合ったノードを一緒に作成しましょう。\n\nこちらが私の提案です：\n🔹タイトル：${suggestion.title}\n🔹説明：${suggestion.description}\n\nいかがでしょうか：`,
		isUser: false,
		suggestion,
		type: "suggestion",
	}
}
