import type { NodeSuggestion } from "@/types/chat"
import type { TreeNode } from "@/types/tree"

export const generateChildNode = (
	parentTitle: string,
	level: number,
): NodeSuggestion => {
	const prefixes = {
		2: ["Advanced", "Novel", "Improved", "Enhanced", "Modern"],
		3: [
			"Algorithm for",
			"Technique for",
			"Method for",
			"Approach to",
			"System for",
		],
	}

	const randomPrefix = (level === 2 ? prefixes[2] : prefixes[3])[
		Math.floor(Math.random() * 5)
	]

	if (parentTitle === "網膜疾患検出のための深層学習") {
		return {
			id: Math.random().toString(36).substr(2, 9),
			level: level,
			title: "網膜疾患検出のための深層学習アルゴリズム",
			description: "網膜疾患検出のための深層学習の生成された子ノード",
		}
	}

	return {
		id: Math.random().toString(36).substr(2, 9),
		level: level,
		title: `${randomPrefix} ${parentTitle}`,
		description: `Generated child node for ${parentTitle}`,
	}
}

export const createNodeFromSuggestion = (node: NodeSuggestion): TreeNode => {
	const nodeId = node.id || node.title.toLowerCase().replace(/\s+/g, "-")

	// Replace specific title and description if it matches our target
	if (node.title === "Deep Learning for Retinal Disease Detection") {
		node.title = "網膜疾患検出のための深層学習"
		node.description =
			"畳み込みニューラルネットワークを使用して、OCTスキャンから網膜疾患を高精度で自動的に検出および分類します。"
	}
	return {
		id: nodeId,
		name: node.title,
		info: "18論文",
		isCustom: true,
		description: node.description || `Custom node for ${node.title}`,
		level: 0, // Level will be set by the caller
	}
}
