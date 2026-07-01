import { useCallback } from "react"
import { generateTreeWithContext } from "@/services/treeGenerationService"

interface UseTreeCallbacksProps {
	currentQuery: string
	locationState: any
	userDetails: any
	treeMode: string
	setPollingTreeId: (id: string) => void
	setDatabaseTreeData: (data: any) => void
	setHasLoadedDatabase: (loaded: boolean) => void
}

export const useTreeScenario = ({
	currentQuery,
	locationState,
	userDetails,
	treeMode,
	setPollingTreeId,
	setDatabaseTreeData,
	setHasLoadedDatabase,
}: UseTreeCallbacksProps) => {
	const handleAddScenario = useCallback(
		async (context: string) => {
			console.log(
				"[useTreeScenario] handleAddScenario called, context=",
				context,
			)
			try {
				const searchTheme = currentQuery || locationState?.query
				console.log(
					"[useTreeScenario] searchTheme=",
					searchTheme,
					"treeId=",
					locationState?.treeId,
				)
				if (!searchTheme) {
					throw new Error("検索テーマが見つかりません")
				}

				const currentTreeId = locationState?.treeId
				if (!currentTreeId) {
					throw new Error("現在のツリーIDが見つかりません")
				}

				const teamId = userDetails?.team_id
				console.log(
					"[useTreeScenario] calling generateTreeWithContext, teamId=",
					teamId,
					"treeMode=",
					treeMode,
				)

				const result = await generateTreeWithContext({
					searchTheme,
					context,
					treeMode: treeMode as "TED" | "FAST",
					teamId,
					treeId: currentTreeId,
					user_id: userDetails?.user_id,
				})

				if (!result.success) {
					throw new Error(result.error || "シナリオの追加に失敗しました")
				}

				setPollingTreeId(currentTreeId)
				setDatabaseTreeData(null)
				setHasLoadedDatabase(false)
			} catch (error) {
				console.error("Error:", error)
				throw error
			}
		},
		[
			currentQuery,
			locationState?.query,
			locationState?.treeId,
			userDetails?.team_id,
			userDetails?.user_id,
			treeMode,
			setPollingTreeId,
			setDatabaseTreeData,
			setHasLoadedDatabase,
		],
	)

	const handlePanelResize = useCallback(() => {
		// console.log("handlePanelResize")
		const event = new CustomEvent("panel-resize")
		document.dispatchEvent(event)
	}, [])

	return {
		handleAddScenario,
		handlePanelResize,
	}
}
