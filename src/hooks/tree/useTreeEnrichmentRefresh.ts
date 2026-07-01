import { useEffect } from "react"
import { enrichmentEventBus } from "@/hooks/useEnrichedData"
import { convertDatabaseTreeToAppFormat } from "@/utils/databaseTreeConverter"

interface UseTreeEnrichmentRefreshProps {
	treeId?: string
	databaseTreeData: any
	loadTreeFromDatabase: (treeId: string) => Promise<any>
	setDatabaseTreeData: (data: any) => void
}

export const useTreeEnrichmentRefresh = ({
	treeId,
	databaseTreeData,
	loadTreeFromDatabase,
	setDatabaseTreeData,
}: UseTreeEnrichmentRefreshProps) => {
	useEffect(() => {
		if (!treeId || !databaseTreeData) return

		const refreshTreeData = async () => {
			try {
				const result = await loadTreeFromDatabase(treeId)
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
						const timestampedData = {
							...convertedData,
							_timestamp: Date.now(),
						}
						setDatabaseTreeData(timestampedData)
					}
				}
			} catch (error) {
				console.error("Error refreshing tree data:", error)
			}
		}

		const unsubscribe = enrichmentEventBus.subscribe((_nodeId: string) => {
			refreshTreeData()
		})

		return () => {
			unsubscribe()
		}
	}, [treeId, databaseTreeData, loadTreeFromDatabase, setDatabaseTreeData])
}
