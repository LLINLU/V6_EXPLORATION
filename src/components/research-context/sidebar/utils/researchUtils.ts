export const getResearchObjective = (
	query: string,
	researchAnswers: Record<string, string>,
) => {
	const focus = researchAnswers.focus
	const purpose = researchAnswers.purpose

	if (focus && purpose) {
		const focusText =
			focus === "technical" ? "技術的な仕組み・原理" : "市場応用・実用化"
		return `${query}について、${focusText}の観点から「${purpose}」を目的とした研究`
	} else if (focus) {
		const focusText =
			focus === "technical" ? "技術的な仕組み・原理" : "市場応用・実用化"
		return `${query}について、${focusText}の観点からの研究`
	}
	return `${query}に関する研究`
}
export const getTreemapImpact = (researchAnswers: Record<string, string>) => {
	const impacts = []
	if (researchAnswers.focus === "technical") {
		impacts.push("技術特許・論文に重点配置")
		impacts.push("実装方法・アルゴリズムの詳細表示")
		impacts.push("基礎理論から応用技術への階層構造")
	} else if (researchAnswers.focus === "market") {
		impacts.push("市場分析・商用事例に重点配置")
		impacts.push("企業動向・投資情報の表示")
		impacts.push("商用化から技術開発への逆算構造")
	}

	if (researchAnswers.depth === "基礎研究") {
		impacts.push("理論的基盤を深く展開")
	} else if (researchAnswers.depth === "応用研究") {
		impacts.push("実用化技術を中心に展開")
	}

	if (researchAnswers.targetField) {
		impacts.push(`${researchAnswers.targetField}関連技術を優先表示`)
	}

	return impacts
}

export const getGranularityPreview = (
	researchAnswers: Record<string, string>,
) => {
	let granularity = "標準"
	let depth = "中程度"

	if (researchAnswers.depth === "基礎研究") {
		granularity = "高精細"
		depth = "深層"
	} else if (researchAnswers.depth === "応用研究") {
		granularity = "実用重視"
		depth = "実装寄り"
	}

	return { granularity, depth }
}

export const getRecentConversationTopics = (
	conversationMessages: Array<{ content: string; isUser: boolean }>,
) => {
	return conversationMessages
		.filter((msg) => msg.isUser)
		.slice(-3)
		.map(
			(msg) =>
				msg.content.substring(0, 60) + (msg.content.length > 60 ? "..." : ""),
		)
}
export const getQuestionProgress = (
	questionStatus: Record<string, boolean>,
) => {
	const questions = [
		{ key: "focus", label: "研究焦点", status: questionStatus.focus },
		{ key: "purpose", label: "研究目的", status: questionStatus.purpose },
		{
			key: "targetField",
			label: "対象分野・領域",
			status: questionStatus.targetField,
		},
		{
			key: "additionalContext",
			label: "追加考慮事項",
			status: questionStatus.additionalContext,
		},
	]

	return questions
}
