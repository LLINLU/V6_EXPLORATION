import { useEffect, useState } from "react"
import { ConversationInterface } from "@/components/research-context/ConversationInterface"
import { ResearchContextSidebar } from "@/components/research-context/ResearchContextSidebar"
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable"

const ResearchContextContent = () => {
	// Get state from URL params or default values for SSR compatibility
	const getInitialState = () => {
		if (typeof window === "undefined") {
			return { query: "", searchMode: "deep" }
		}

		try {
			const urlParams = new URLSearchParams(window.location.search)
			return {
				query: urlParams.get("query") || "",
				searchMode: urlParams.get("searchMode") || "deep",
			}
		} catch {
			return { query: "", searchMode: "deep" }
		}
	}

	const { query, searchMode } = getInitialState()

	// Centralized conversation context state
	const [conversationContext, setConversationContext] = useState({
		query,
		messages: [],
		researchAnswers: {},
		userAnswers: {},
		refinementProgress: 0,
		confidenceLevels: {},
		questionStatus: {
			focus: false,
			purpose: false,
			depth: false,
			targetField: false,
			expectedOutcome: false,
			applications: false,
			additionalContext: false,
		},
	})

	const handleContextUpdate = (newContext: any) => {
		// console.log("ResearchContext received context update:", newContext)
		if (
			newContext.refinementProgress !== conversationContext.refinementProgress
		) {
			setConversationContext((prevContext) => ({
				...prevContext,
				...newContext,
				messages: newContext.messages || prevContext.messages,
				researchAnswers:
					newContext.researchAnswers || prevContext.researchAnswers,
				userAnswers: newContext.userAnswers || prevContext.userAnswers,
				refinementProgress:
					newContext.refinementProgress || prevContext.refinementProgress,
				confidenceLevels:
					newContext.confidenceLevels || prevContext.confidenceLevels,
				questionStatus: newContext.questionStatus || prevContext.questionStatus,
			}))
		}
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel defaultSize={60} minSize={40}>
					<ConversationInterface
						query={query}
						searchMode={searchMode}
						onContextUpdate={handleContextUpdate}
					/>
				</ResizablePanel>

				<ResizableHandle withHandle />

				<ResizablePanel defaultSize={40} minSize={30}>
					<ResearchContextSidebar
						query={conversationContext.query}
						researchAnswers={conversationContext.researchAnswers}
						userAnswers={conversationContext.userAnswers}
						refinementProgress={conversationContext.refinementProgress}
						confidenceLevels={conversationContext.confidenceLevels}
						questionStatus={conversationContext.questionStatus}
					/>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}

const ResearchContext = () => {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	// Show loading during SSR
	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	return <ResearchContextContent />
}

export default ResearchContext
