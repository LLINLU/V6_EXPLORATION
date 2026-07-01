import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { useTreeUIStore } from "@/stores/treeUIStore"
import type { LocationState } from "@/types/tree"
import { convertDatabaseTreeToAppFormat } from "@/utils/databaseTreeConverter"

interface UseTreeInitializationProps {
	loadTreeFromDatabase: (treeId: string) => Promise<any>
	setPollingTreeId: (treeId: string) => void
	state: LocationState | null
}

interface UseTreeInitializationReturn {
	databaseTreeData: any
	isInitializing: boolean
	currentQuery: string
	savedConversationHistory: any[]
	setDatabaseTreeData: (data: any) => void
	setHasLoadedDatabase: (loaded: boolean) => void
}

const isValidUUID = (str: string) => {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
	return uuidRegex.test(str)
}

export const useTreeInitialization = ({
	loadTreeFromDatabase,
	setPollingTreeId,
	state,
}: UseTreeInitializationProps): UseTreeInitializationReturn => {
	const locationState = state as LocationState | null
	const { setShowFallbackAlert } = useTreeUIStore()

	const [databaseTreeData, setDatabaseTreeData] = useState<any>(null)
	const [hasLoadedDatabase, setHasLoadedDatabase] = useState(false)
	const [isInitializing, setIsInitializing] = useState(false)
	const [currentQuery, setCurrentQuery] = useState<string>("")
	const [savedConversationHistory, setSavedConversationHistory] = useState<
		any[]
	>([])

	// Handle conversation history
	useEffect(() => {
		if (locationState?.conversationHistory) {
			setSavedConversationHistory(locationState.conversationHistory)
		}
	}, [locationState])

	// Reset database data on tree ID change
	// biome-ignore lint/correctness/useExhaustiveDependencies: to re-render the tree
	useEffect(() => {
		setDatabaseTreeData(null)
		setHasLoadedDatabase(false)
	}, [locationState?.treeId])

	// Main initialization logic
	useEffect(() => {
		const initializeTreeData = async () => {
			if (
				locationState?.fromDatabase &&
				locationState?.treeId &&
				!hasLoadedDatabase
			) {
				// console.log("initializing tree from database", locationState.treeId)
				if (!isValidUUID(locationState.treeId)) {
					toast({
						title: "無効なツリーID",
						description:
							"有効なUUID形式のツリーIDが必要です。新しいツリーを生成してください。",
					})
					return
				}

				setHasLoadedDatabase(true)
				try {
					const result = await loadTreeFromDatabase(locationState.treeId)
					if (result?.treeStructure) {
						const convertedData = await convertDatabaseTreeToAppFormat(
							result.treeStructure,
							{
								description: result.treeData?.description,
								search_theme: result.treeData?.search_theme,
								name: result.treeData?.name,
								mode: (result.treeData as any)?.mode,
							},
						)
						if (convertedData) {
							setDatabaseTreeData(convertedData)
							setCurrentQuery(
								locationState?.query || result.treeData?.search_theme || "",
							)

							const level1Items = convertedData.level1Items || []
							const incompleteScenarios = level1Items.filter(
								(item) =>
									typeof item.children_count === "number" &&
									item.children_count === 0,
							)

							if (incompleteScenarios.length > 0) {
								setPollingTreeId(locationState.treeId)
							}
						}
					}
				} catch (error) {
					console.error("Error loading database tree:", error)
					setHasLoadedDatabase(false)
				}
				return
			}

			// Demo tree handling
			if (locationState?.isDemo || locationState?.treeId?.startsWith("demo-")) {
				// console.log("Demo tree detected - no longer supported")
				toast({
					title: "デモツリーは廃止されました",
					description: `リアルなツリー生成のみサポートしています。新しいツリーを生成してください。`,
				})
				return
			}

			// TED tree handling
			if (locationState?.treeData && locationState?.tedResults) {
				// console.log(
				// "Initializing with TED-generated tree data:",
				// locationState.treeData,
				// )

				setCurrentQuery(locationState?.query || "")

				const tedResults = locationState.tedResults
				let hasFallbackData = false

				if (
					tedResults.purpose?.layer?.generation_metadata?.coverage_note?.includes(
						"Fallback",
					) ||
					tedResults.function?.layer?.generation_metadata?.coverage_note?.includes(
						"Fallback",
					) ||
					tedResults.measure?.layer?.generation_metadata?.coverage_note?.includes(
						"Fallback",
					)
				) {
					hasFallbackData = true
					setShowFallbackAlert(true)
				}

				const scores = []
				if (tedResults.purpose?.evaluation?.total_score) {
					scores.push(
						`Purpose: ${Math.round(
							tedResults.purpose.evaluation.total_score / 4,
						)}%`,
					)
				}
				if (tedResults.function?.evaluation?.total_score) {
					scores.push(
						`Function: ${Math.round(
							tedResults.function.evaluation.total_score / 4,
						)}%`,
					)
				}
				if (tedResults.measure?.evaluation?.total_score) {
					scores.push(
						`Measure: ${Math.round(
							tedResults.measure.evaluation.total_score / 4,
						)}%`,
					)
				}

				toast({
					title: hasFallbackData
						? "TED Tree Generated with Templates"
						: "TED Tree Generated Successfully",
					description:
						scores.length > 0
							? `Quality scores: ${scores.join(", ")}`
							: "Tree structure created successfully",
				})
			}

			// console.log(
			// "No specific initialization required, completing initialization",
			// )

			if (locationState?.query) {
				setCurrentQuery(locationState.query)
			}
		}

		setIsInitializing(true)
		initializeTreeData().finally(() => {
			setIsInitializing(false)
		})

		const timeoutId = setTimeout(() => {
			setIsInitializing(false)
		}, 5000)

		return () => {
			clearTimeout(timeoutId)
		}
	}, [
		locationState?.treeData,
		locationState?.tedResults,
		locationState?.fromDatabase,
		locationState?.treeId,
		locationState?.query,
		hasLoadedDatabase,
		locationState?.isDemo,
		loadTreeFromDatabase,
		setPollingTreeId,
		setShowFallbackAlert,
	])

	return {
		databaseTreeData,
		isInitializing,
		currentQuery,
		savedConversationHistory,
		setDatabaseTreeData,
		setHasLoadedDatabase,
	}
}
