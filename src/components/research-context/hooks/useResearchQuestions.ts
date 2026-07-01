export const RESEARCH_QUESTIONS = {
	focus: { weight: 60, label: "研究の焦点" },
	purpose: { weight: 20, label: "研究目的" },
	targetField: { weight: 20, label: "対象分野/領域" },
}

export const useResearchQuestions = () => {
	const updateProgress = (
		answers: Record<string, string>,
		confidenceLevels: Record<string, number>,
	) => {
		let totalProgress = 0
		const confidence = { ...confidenceLevels }

		Object.entries(RESEARCH_QUESTIONS).forEach(([key, config]) => {
			if (answers[key]) {
				totalProgress += config.weight
				confidence[key] = Math.min((confidence[key] || 0) + 25, 100)
			}
		})

		return { totalProgress, confidence }
	}

	return { RESEARCH_QUESTIONS, updateProgress }
}
