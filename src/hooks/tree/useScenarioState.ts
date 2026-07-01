import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

interface ScenarioStateProps {
	initialScenario?: string
	initialSearchMode?: string
}

export const useScenarioState = ({
	initialScenario,
	initialSearchMode,
}: ScenarioStateProps = {}) => {
	const location = useLocation()
	const locationState = location.state as {
		query?: string
		scenario?: string
		searchMode?: string
		researchAnswers?: {
			who?: string
			what?: string
			where?: string
			when?: string
		}
	} | null

	const defaultScenario = ""

	const [scenario, setScenario] = useState(
		initialScenario || locationState?.scenario || defaultScenario,
	)
	const [searchMode, setSearchMode] = useState(
		initialSearchMode || locationState?.searchMode || "quick",
	)

	// If we get new state from navigation, update the scenario and search mode
	useEffect(() => {
		if (locationState?.scenario) {
			setScenario(locationState.scenario)
		}
		if (locationState?.searchMode) {
			setSearchMode(locationState.searchMode)
		}
	}, [locationState?.scenario, locationState?.searchMode])

	return {
		scenario,
		searchMode,
		setScenario,
		setSearchMode,

		researchAnswers: locationState?.researchAnswers,
	}
}
