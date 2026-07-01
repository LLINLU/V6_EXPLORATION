import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { useTreeGeneration } from "@/hooks/useTreeGeneration"

interface ChatMessage {
	content: string
	isUser: boolean
	buttons?: Array<{
		label: string
		value: string
	}>
	checkboxGroups?: Array<{
		title: string
		options: Array<{
			label: string
			value: string
		}>
	}>
	isDisabled?: boolean
	initialSelections?: Record<string, string[]>
	messagePhase?: string
}

export const useRefinementChat = (
	initialQuery: string,
	onRefinementComplete: (context: any) => void,
	onContextUpdate?: (context: any) => void,
) => {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [inputValue, setInputValue] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [refinementProgress, setRefinementProgress] = useState(0)
	const [currentQuestionPhase, setCurrentQuestionPhase] = useState("focus")
	const [userAnswers, setUserAnswers] = useState<{
		focus?: string
		purpose?: string[]
		targetField?: Record<string, string[]>
		additionalContext?: string
	}>({})
	const [questionStatus, setQuestionStatus] = useState({
		focus: false,
		purpose: false,
		targetField: false,
		additionalContext: false,
	})

	const { generateResearchContext } = useTreeGeneration()

	// Enhanced context emission
	useEffect(() => {
		const contextData = {
			query: initialQuery,
			messages,
			refinementProgress,
			userAnswers,
			conversationHistory: messages,
			questionStatus,
		}

		if (onContextUpdate) {
			onContextUpdate(contextData)
		}
	}, [
		initialQuery,
		messages,
		onContextUpdate,
		refinementProgress,
		userAnswers,
		questionStatus,
	])

	function initializeConversationCase(phase: string, query: string): string[] {
		switch (phase) {
			case "focus":
				return [
					`「${query}」について詳しく伺わせてください。`,
					`この研究テーマに対して、どちらの方向性により関心をお持ちでしょうか？`,
				]

			case "purpose":
				return [
					`研究の焦点が明確になりました。`,
					`次に、この研究を行う目的について教えてください。どのような背景や狙いで、この研究に取り組まれているのでしょうか？`,
				]

			case "targetField":
				return [
					`研究目的が分かりました。`,
					`最後に、この技術を実際に活用したいと考えている分野について教えてください。どのような業界や領域での応用をイメージされていますか？`,
				]

			default:
				return []
		}
	}

	const initializeConversation = async () => {
		setIsLoading(true)
		try {
			const messageContents = initializeConversationCase("focus", initialQuery)
			const initialMessages: ChatMessage[] = messageContents.map(
				(content, index) => ({
					content,
					isUser: false,
					...(index === messageContents.length - 1
						? {
								buttons: [
									{ label: "技術的な仕組み・原理", value: "technical" },
									{ label: "市場応用・実用化", value: "market" },
								],
							}
						: {}),
				}),
			)
			setMessages(initialMessages)
		} catch (_error) {
			toast({
				title: "エラー",
				description: "会話の初期化に失敗しました。",
			})
		} finally {
			setIsLoading(false)
			setRefinementProgress(30)
		}
	}

	const generatePurposeQuestion = async (currentMessages: ChatMessage[]) => {
		const messageContents = initializeConversationCase("purpose", initialQuery)
		const purposeMessages: ChatMessage[] = messageContents.map(
			(content, index) => ({
				content,
				isUser: false,
				messagePhase: "purpose",
				...(index === messageContents.length - 1
					? {
							checkboxGroups: [
								{
									title: "研究目的 (Research Purpose)",
									options: [
										{
											label: "ビジネス・製品開発",
											value: "ビジネス・製品開発",
										},
										{ label: "社会課題解決", value: "社会課題解決" },
										{ label: "競争優位性確保", value: "競争優位性確保" },
										{ label: "実証実験・PoC", value: "実証実験・PoC" },
										{ label: "網羅的に見る", value: "網羅的に見る" },
									],
								},
							],
						}
					: {}),
			}),
		)

		setMessages([...currentMessages, ...purposeMessages])
	}

	const generateTargetFieldQuestion = async (
		currentMessages: ChatMessage[],
		focusType: "TED" | "FAST",
		purposeText: string,
	) => {
		setIsLoading(true)

		try {
			// Call research context edge function to get dynamic options
			const researchContextResult = await generateResearchContext(
				initialQuery,
				purposeText,
				focusType,
			)

			let checkboxGroups = []

			if (researchContextResult?.result) {
				const result = researchContextResult.result

				if (focusType === "FAST") {
					if (result.technical_domains) {
						checkboxGroups.push({
							title: "技術領域 (Technical Domains)",
							options: [
								...result.technical_domains.map((domain: string) => ({
									label: domain,
									value: domain, // Use clean domain text as value
								})),
								{ label: "網羅的に見る", value: "網羅的に見る" },
							],
						})
					}

					if (result.focus_mechanisms) {
						checkboxGroups.push({
							title: "注目すべき技術的な仕組み・観点 (Focus Mechanisms)",
							options: [
								...result.focus_mechanisms.map((mechanism: string) => ({
									label: mechanism,
									value: mechanism, // Use clean mechanism text as value
								})),
								{ label: "網羅的に見る", value: "網羅的に見る" },
							],
						})
					}
				} else {
					// TED
					if (result.target_market_areas) {
						checkboxGroups.push({
							title: "市場領域 (Target Market Areas)",
							options: [
								...result.target_market_areas.map((area: string) => ({
									label: area,
									value: area, // Use clean area text as value
								})),
								{ label: "網羅的に見る", value: "網羅的に見る" },
							],
						})
					}

					if (result.application_areas) {
						checkboxGroups.push({
							title: "アプリケーション領域 (Application Areas)",
							options: [
								...result.application_areas.map((area: string) => ({
									label: area,
									value: area, // Use clean area text as value
								})),
								{ label: "網羅的に見る", value: "網羅的に見る" },
							],
						})
					}

					if (result.application_themes) {
						checkboxGroups.push({
							title: "応用テーマ (Application Themes)",
							options: [
								...result.application_themes.map((theme: string) => ({
									label: theme,
									value: theme, // Use clean theme text as value
								})),
								{ label: "網羅的に見る", value: "網羅的に見る" },
							],
						})
					}
				}
			}

			// Fallback if no dynamic options
			if (checkboxGroups.length === 0) {
				checkboxGroups = [
					{
						title: "市場領域 (Target Market Areas)",
						options: [
							{ label: "医療・ヘルスケア市場", value: "医療・ヘルスケア市場" },
							{ label: "教育・学習支援市場", value: "教育・学習支援市場" },
							{ label: "製造・工場・物流市場", value: "製造・工場・物流市場" },
							{ label: "農業・環境保全市場", value: "農業・環境保全市場" },
							{ label: "金融・保険市場", value: "金融・保険市場" },
							{
								label: "行政・公共サービス市場",
								value: "行政・公共サービス市場",
							},
							{
								label: "小売・マーケティング市場",
								value: "小売・マーケティング市場",
							},
							{ label: "網羅的に見る", value: "網羅的に見る" },
						],
					},
					{
						title: "アプリケーション領域 (Application Areas)",
						options: [
							{
								label: "診断・治療支援システム",
								value: "診断・治療支援システム",
							},
							{
								label: "学習管理・教育支援プラットフォーム",
								value: "学習管理・教育支援プラットフォーム",
							},
							{
								label: "生産管理・品質管理システム",
								value: "生産管理・品質管理システム",
							},
							{
								label: "作物管理・環境モニタリング",
								value: "作物管理・環境モニタリング",
							},
							{ label: "リスク管理・投資支援", value: "リスク管理・投資支援" },
							{
								label: "行政手続き・市民サービス",
								value: "行政手続き・市民サービス",
							},
							{ label: "顧客分析・販売支援", value: "顧客分析・販売支援" },
							{ label: "網羅的に見る", value: "網羅的に見る" },
						],
					},
					{
						title: "応用テーマ (Application Themes)",
						options: [
							{
								label: "業務効率化・自動化による生産性向上",
								value: "業務効率化・自動化による生産性向上",
							},
							{
								label: "データ分析・予測による意思決定支援",
								value: "データ分析・予測による意思決定支援",
							},
							{
								label: "ユーザー体験向上・パーソナライゼーション",
								value: "ユーザー体験向上・パーソナライゼーション",
							},
							{
								label: "コスト削減・リソース最適化",
								value: "コスト削減・リソース最適化",
							},
							{ label: "品質向上・リスク管理", value: "品質向上・リスク管理" },
							{
								label: "新サービス創出・イノベーション促進",
								value: "新サービス創出・イノベーション促進",
							},
							{ label: "網羅的に見る", value: "網羅的に見る" },
						],
					},
				]
			}

			const messageContents = initializeConversationCase(
				"targetField",
				initialQuery,
			)
			const targetFieldMessages: ChatMessage[] = messageContents.map(
				(content, index) => ({
					content,
					isUser: false,
					messagePhase: "targetField",
					...(index === messageContents.length - 1 ? { checkboxGroups } : {}),
				}),
			)

			setMessages([...currentMessages, ...targetFieldMessages])
		} finally {
			setIsLoading(false)
		}
	}

	const generateAdditionalContextQuestion = async (
		currentMessages: ChatMessage[],
	) => {
		const additionalContextMessage: ChatMessage = {
			content:
				"最後に、これ以外に考慮して欲しいことはありますか？\n\n特定の技術的制約、予算、スケジュール、関連する既存技術など、技術ツリー生成時に考慮すべき追加情報があれば教えてください。",
			isUser: false,
			messagePhase: "additionalContext",
		}

		setMessages([...currentMessages, additionalContextMessage])
	}

	const handleButtonClick = async (value: string) => {
		// Only handle focus phase buttons
		if (currentQuestionPhase !== "focus") {
			return
		}

		const buttonResponse =
			value === "technical"
				? "技術的な仕組み・原理に興味があります"
				: "市場応用・実用化に興味があります"

		// Store focus answer
		setUserAnswers((prev) => ({ ...prev, focus: buttonResponse }))
		setQuestionStatus((prev) => ({ ...prev, focus: true }))

		// Disable the focus question in messages
		const updatedMessages = messages.map((msg) => {
			if (msg.buttons) {
				return { ...msg, isDisabled: true }
			}
			return msg
		})

		const userMessage = { content: buttonResponse, isUser: true }
		const newMessages = [...updatedMessages, userMessage]
		setMessages(newMessages)

		// Move to purpose phase
		setCurrentQuestionPhase("purpose")
		setRefinementProgress(60)
		await generatePurposeQuestion(newMessages)
	}

	const handleSendMessage = async () => {
		if (currentQuestionPhase === "additionalContext") {
			await handleAdditionalContextSubmit(inputValue.trim())
		}
	}

	const handleSkipAdditionalContext = async () => {
		await handleAdditionalContextSubmit("")
	}

	const handleAdditionalContextSubmit = async (contextInput: string) => {
		// Store additional context answer
		setUserAnswers((prev) => ({ ...prev, additionalContext: contextInput }))
		setQuestionStatus((prev) => ({ ...prev, additionalContext: true }))

		// Disable the additional context question in messages
		const updatedMessages = messages.map((msg) => {
			if (msg.messagePhase === "additionalContext") {
				return { ...msg, isDisabled: true }
			}
			return msg
		})

		const userResponse = contextInput || "（スキップ）"
		const userMessage = { content: userResponse, isUser: true }
		const finalMessages = [
			...updatedMessages,
			userMessage,
			{
				content:
					"研究コンテキストの詳細化が完了しました。収集された情報に基づいて、あなたの研究に最適化された技術ツリーを生成する準備が整いました。",
				isUser: false,
			},
		]

		setMessages(finalMessages)
		setRefinementProgress(100)
		setInputValue("") // Clear input
		setCurrentQuestionPhase("completed") // Change phase to hide input

		setTimeout(() => {
			onRefinementComplete({
				query: initialQuery,
				userAnswers: { ...userAnswers, additionalContext: contextInput },
				conversationHistory: finalMessages,
				refinementProgress: 100,
			})
		}, 1000)
	}

	const handleCheckboxSubmit = async (selections: Record<string, string[]>) => {
		// Format the selections for display - values are now clean text
		let selectionSummary = ""
		Object.entries(selections).forEach(([groupTitle, selectedItems]) => {
			if (selectedItems.length > 0) {
				if (selectionSummary) selectionSummary += "\n"
				selectionSummary += `${groupTitle}:\n`
				selectedItems.forEach((item) => {
					selectionSummary += `• ${item}\n`
				})
			}
		})

		// Store user answers in our simple dictionary
		if (currentQuestionPhase === "purpose") {
			const purposeAnswers = Object.values(selections).flat()
			setUserAnswers((prev) => ({ ...prev, purpose: purposeAnswers }))
			setQuestionStatus((prev) => ({ ...prev, purpose: true }))

			// Disable this question in messages
			const updatedMessages = messages.map((msg) => {
				if (msg.messagePhase === "purpose") {
					return { ...msg, isDisabled: true, initialSelections: selections }
				}
				return msg
			})

			const userMessage = { content: selectionSummary, isUser: true }
			const newMessages = [...updatedMessages, userMessage]
			setMessages(newMessages)

			// Generate next question with research context
			const focusType = userAnswers.focus?.includes("技術的") ? "FAST" : "TED"
			const purposeText = purposeAnswers.join(", ") // Values are now clean text

			setCurrentQuestionPhase("targetField")
			setRefinementProgress(80)
			await generateTargetFieldQuestion(newMessages, focusType, purposeText)
		} else if (currentQuestionPhase === "targetField") {
			setUserAnswers((prev) => ({ ...prev, targetField: selections }))
			setQuestionStatus((prev) => ({ ...prev, targetField: true }))

			// Disable this question in messages
			const updatedMessages = messages.map((msg) => {
				if (msg.messagePhase === "targetField") {
					return { ...msg, isDisabled: true, initialSelections: selections }
				}
				return msg
			})

			const userMessage = { content: selectionSummary, isUser: true }
			const newMessages = [...updatedMessages, userMessage]
			setMessages(newMessages)

			// Move to additional context phase
			setCurrentQuestionPhase("additionalContext")
			setRefinementProgress(90)
			await generateAdditionalContextQuestion(newMessages)
		}
	}

	return {
		messages,
		inputValue,
		setInputValue,
		isLoading,
		currentQuestionPhase,
		handleButtonClick,
		handleCheckboxSubmit,
		handleSendMessage,
		handleSkipAdditionalContext,
		initializeConversation,
	}
}
