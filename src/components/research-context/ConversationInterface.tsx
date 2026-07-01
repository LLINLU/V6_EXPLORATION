import { ArrowLeft, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useTreeGeneration } from "@/hooks/useTreeGeneration"
import { RefinementChat } from "./RefinementChat"

interface ConversationInterfaceProps {
	query: string
	searchMode: string
	onContextUpdate?: (context: any) => void
}
export const ConversationInterface = ({
	query,
	searchMode,
	onContextUpdate,
}: ConversationInterfaceProps) => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [isRefinementComplete, setIsRefinementComplete] = useState(false)
	const [refinedContext, setRefinedContext] = useState<any>(null)
	const [isGeneratingTree, setIsGeneratingTree] = useState(false)
	const [generatedTreeId, setGeneratedTreeId] = useState<string | null>(null)
	const { generateTreeWithResearchContext, isGenerating } = useTreeGeneration()

	const handleRefinementComplete = (context: any) => {
		// console.log("Refinement complete with context:", context)
		setRefinedContext(context)
		setIsRefinementComplete(true)

		// Update parent context
		if (onContextUpdate && context) {
			onContextUpdate({
				...(context as any),
				refinementProgress: 100,
			})
		}
	}

	const handleContextUpdate = (context: any) => {
		// console.log("Context update received in ConversationInterface:", context)
		// Forward updates to parent
		if (onContextUpdate) {
			onContextUpdate(context)
		}
	}

	const handleProceedToTechnologyTree = async () => {
		if (generatedTreeId) {
			// Tree already generated, just navigate
			const mode =
				searchMode === "fast" ||
				(refinedContext as any)?.userAnswers?.focus?.includes("技術的")
					? "FAST"
					: "TED"
			navigate(`/technology-tree?id=${encodeURIComponent(generatedTreeId)}`, {
				state: {
					query,
					searchMode: mode.toLowerCase(),
					treeId: generatedTreeId,
					fromDatabase: true,
					isDemo: false,
					mode: mode,
					refinedContext,
				},
			})
			return
		}

		// Generate tree with research context
		setIsGeneratingTree(true)
		try {
			// Determine mode based on searchMode or focus selection
			const mode =
				searchMode === "fast" ||
				(refinedContext as any)?.userAnswers?.focus?.includes("技術的")
					? "FAST"
					: "TED"

			// console.log("Generating tree with research context:", {
			// query,
			// mode,
			// refinedContext,
			// })

			const result = await generateTreeWithResearchContext(
				query,
				mode,
				refinedContext as any,
			)

			if (result?.treeId) {
				setGeneratedTreeId(result.treeId)
				// Navigate to the generated tree
				navigate(`/technology-tree?id=${encodeURIComponent(result.treeId)}`, {
					state: {
						query,
						searchMode: mode.toLowerCase(),
						treeId: result.treeId,
						fromDatabase: true,
						isDemo: false,
						mode: mode,
						refinedContext, // Include research context data
					},
				})
			} else {
				console.error("Failed to generate tree with research context")
			}
		} catch (error) {
			console.error("Error generating tree with research context:", error)
		} finally {
			setIsGeneratingTree(false)
		}
	}

	const handleBackToHome = () => {
		navigate("/")
	}

	return (
		<div className="h-screen bg-white flex flex-col">
			<div className="border-b border-gray-200 bg-white px-6 py-4">
				<div className="flex items-center gap-4 mb-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleBackToHome}
						className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
					>
						<ArrowLeft className="h-4 w-4" />
						{t("research.conversation.backToHome")}
					</Button>
				</div>
				<h1 className="text-2xl font-bold text-gray-900">
					{t("research.conversation.title")}
				</h1>
				<p className="text-gray-600 mt-1">
					{t("research.conversation.subtitle")}
				</p>
			</div>

			<div className="flex-1 overflow-hidden">
				{
					<RefinementChat
						initialQuery={query}
						onRefinementComplete={handleRefinementComplete}
						onContextUpdate={handleContextUpdate}
					/>
				}
			</div>

			{isRefinementComplete && (
				<div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
					<div className="flex justify-end">
						<Button
							onClick={handleProceedToTechnologyTree}
							disabled={isGeneratingTree || isGenerating}
							className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
						>
							{isGeneratingTree || isGenerating ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									{t("research.conversation.generatingTree")}
								</>
							) : generatedTreeId ? (
								<>
									{t("research.conversation.viewTree")}
									<ArrowRight className="ml-2 h-4 w-4" />
								</>
							) : (
								<>
									{t("research.conversation.generateTree")}
									<ArrowRight className="ml-2 h-4 w-4" />
								</>
							)}
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
