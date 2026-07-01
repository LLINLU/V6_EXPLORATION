import { useCallback, useState } from "react"

interface ExpansionState {
	[scenarioId: string]: {
		isExpanded: boolean
		expandedLevels: {
			[levelKey: string]: boolean
		}
	}
}

export const useCardExpansion = () => {
	const [expansionState, setExpansionState] = useState<ExpansionState>({})

	const toggleScenarioExpansion = useCallback((scenarioId: string) => {
		setExpansionState((prev) => ({
			...prev,
			[scenarioId]: {
				...prev[scenarioId],
				isExpanded: !prev[scenarioId]?.isExpanded,
				expandedLevels: prev[scenarioId]?.expandedLevels || {},
			},
		}))
	}, [])

	const toggleLevelExpansion = useCallback(
		(scenarioId: string, levelKey: string) => {
			setExpansionState((prev) => ({
				...prev,
				[scenarioId]: {
					...prev[scenarioId],
					isExpanded: prev[scenarioId]?.isExpanded || false,
					expandedLevels: {
						...prev[scenarioId]?.expandedLevels,
						[levelKey]: !prev[scenarioId]?.expandedLevels?.[levelKey],
					},
				},
			}))
		},
		[],
	)

	const expandAll = useCallback((scenarioId: string, levelKeys: string[]) => {
		setExpansionState((prev) => {
			const expandedLevels: { [key: string]: boolean } = {}
			levelKeys.forEach((key) => {
				expandedLevels[key] = true
			})

			return {
				...prev,
				[scenarioId]: {
					isExpanded: true,
					expandedLevels,
				},
			}
		})
	}, [])

	const collapseAll = useCallback((scenarioId: string) => {
		setExpansionState((prev) => ({
			...prev,
			[scenarioId]: {
				isExpanded: false,
				expandedLevels: {},
			},
		}))
	}, [])

	const isScenarioExpanded = useCallback(
		(scenarioId: string) => {
			return expansionState[scenarioId]?.isExpanded || false
		},
		[expansionState],
	)

	const isLevelExpanded = useCallback(
		(scenarioId: string, levelKey: string) => {
			return expansionState[scenarioId]?.expandedLevels?.[levelKey] || false
		},
		[expansionState],
	)

	// Helper functions for programmatic expansion (for queue navigation)
	const expandScenario = useCallback((scenarioId: string) => {
		setExpansionState((prev) => ({
			...prev,
			[scenarioId]: {
				...prev[scenarioId],
				isExpanded: true,
				expandedLevels: prev[scenarioId]?.expandedLevels || {},
			},
		}))
	}, [])

	const expandLevel = useCallback((scenarioId: string, levelKey: string) => {
		setExpansionState((prev) => ({
			...prev,
			[scenarioId]: {
				isExpanded: true, // Ensure scenario is expanded when expanding a level
				expandedLevels: {
					...prev[scenarioId]?.expandedLevels,
					[levelKey]: true,
				},
			},
		}))
	}, [])

	return {
		toggleScenarioExpansion,
		toggleLevelExpansion,
		expandAll,
		collapseAll,
		isScenarioExpanded,
		isLevelExpanded,
		expandScenario,
		expandLevel,
	}
}
