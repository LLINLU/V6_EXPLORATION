import type { NodeContextData } from "@/types/services"

export type { NodeContextData }

// Create context from all available data when no specific node is selected
export const createGeneralContext = (
	allPapers: any[],
	allUseCases: any[],
): NodeContextData | undefined => {
	// console.log("createGeneralContext called with:", {
	// 	papersCount: allPapers?.length,
	// 	useCasesCount: allUseCases?.length,
	// })

	if (!allPapers?.length && !allUseCases?.length) {
		// console.log("createGeneralContext: No data available, returning undefined")
		return undefined
	}

	let contextText = ""

	// console.log("allPapers:", allPapers)
	// Add papers information as formatted text
	if (allPapers && allPapers.length > 0) {
		contextText += `利用可能な論文 (${Math.min(allPapers.length, 10)}件):\n`
		allPapers.slice(0, 10).forEach((paper, index) => {
			contextText += `${index + 1}. ${paper.title}\n`
			if (paper.authors) {
				contextText += `   著者: ${paper.authors}\n`
			}
			if (paper.journal) {
				contextText += `   掲載誌: ${paper.journal}\n`
			}
			if (paper.date) {
				contextText += `   発表年: ${paper.date}\n`
			}
			if (paper.abstract) {
				const abstract =
					paper.abstract.length > 150
						? `${paper.abstract.substring(0, 150)}...`
						: paper.abstract
				contextText += `   概要: ${abstract}\n`
			}
			contextText += `\n`
		})
		contextText += `\n`
	}

	// Add use cases information as formatted text
	if (allUseCases && allUseCases.length > 0) {
		contextText += `利用可能な事例 (${Math.min(allUseCases.length, 5)}件):\n`
		allUseCases.slice(0, 5).forEach((useCase, index) => {
			contextText += `${index + 1}. ${useCase.product}\n`
			if (useCase.description) {
				const description =
					useCase.description.length > 120
						? `${useCase.description.substring(0, 120)}...`
						: useCase.description
				contextText += `   説明: ${description}\n`
			}
			if (useCase.company && useCase.company.length > 0) {
				contextText += `   企業: ${useCase.company.join(", ")}\n`
			}
			contextText += `\n`
		})
	}

	const result = {
		selectedNode: "研究データベース全体",
		contextText: contextText.trim() || undefined,
	}

	// console.log("createGeneralContext result:", result)
	return result
}

export const createNodeContext = (
	selectedNodeId?: string,
	selectedNodeTitle?: string,
	selectedPath?: any,
	enrichedData?: { papers: any[]; useCases: any[] },
): NodeContextData | undefined => {
	// console.log("createNodeContext called with:", {
	// 	selectedNodeId,
	// 	selectedNodeTitle,
	// 	selectedPath,
	// 	papersCount: enrichedData?.papers?.length,
	// 	useCasesCount: enrichedData?.useCases?.length,
	// })

	// If no specific node is selected, create general context from available data
	if (
		!selectedNodeId &&
		!selectedNodeTitle &&
		!enrichedData?.papers?.length &&
		!enrichedData?.useCases?.length
	) {
		// console.log("createNodeContext: No data available, returning undefined")
		return undefined
	}

	let contextText = ""

	// Add path information
	const pathContext = selectedPath
		? Object.entries(selectedPath)
				.filter(([_, value]) => value)
				.map(([level, nodeId]) => `${level}: ${nodeId}`)
				.join(" → ")
		: ""

	if (pathContext) {
		contextText += `選択パス: ${pathContext}\n\n`
	}

	// Add papers information as formatted text
	if (enrichedData?.papers && enrichedData.papers.length > 0) {
		contextText += `関連論文 (${Math.min(enrichedData.papers.length, 5)}件):\n`
		enrichedData.papers.slice(0, 5).forEach((paper, index) => {
			contextText += `${index + 1}. ${paper.title}\n`
			if (paper.authors) {
				contextText += `   著者: ${paper.authors}\n`
			}
			if (paper.journal) {
				contextText += `   掲載誌: ${paper.journal}\n`
			}
			if (paper.date) {
				contextText += `   発表年: ${paper.date}\n`
			}
			if (paper.abstract) {
				const abstract =
					paper.abstract.length > 200
						? `${paper.abstract.substring(0, 200)}...`
						: paper.abstract
				contextText += `   概要: ${abstract}\n`
			}
			contextText += `\n`
		})
		contextText += `\n`
	}

	// Add use cases information as formatted text
	if (enrichedData?.useCases && enrichedData.useCases.length > 0) {
		contextText += `関連事例 (${Math.min(enrichedData.useCases.length, 3)}件):\n`
		enrichedData.useCases.slice(0, 3).forEach((useCase, index) => {
			contextText += `${index + 1}. ${useCase.product}\n`
			if (useCase.description) {
				const description =
					useCase.description.length > 150
						? `${useCase.description.substring(0, 150)}...`
						: useCase.description
				contextText += `   説明: ${description}\n`
			}
			if (useCase.company && useCase.company.length > 0) {
				contextText += `   企業: ${useCase.company.join(", ")}\n`
			}
			contextText += `\n`
		})
	}

	const result = {
		selectedNode: selectedNodeTitle || selectedNodeId || "全体",
		contextText: contextText.trim() || undefined,
	}

	// console.log("createNodeContext result:", result)
	return result
}
