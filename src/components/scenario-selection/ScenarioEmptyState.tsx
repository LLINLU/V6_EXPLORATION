import { Loader2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

type Props = {
	onClearFilters: () => void
	isLoading?: boolean
	stage?: string
}

const MAX_GENERATION_MS = 200000
const ACTIVE_MAX_PROGRESS = 95
const TICK_MS = 200

export function ScenarioEmptyState({
	onClearFilters,
	isLoading,
	stage,
}: Props) {
	const { t } = useTranslation()
	const isCheckingDb = useMemo(
		() => stage === "fetch_base_data" || stage === "fetch_scenarios",
		[stage],
	)

	const isGenerating = useMemo(
		() => stage === "run_generate_scenarios",
		[stage],
	)

	const [progress, setProgress] = useState(0)
	const startRef = useRef<number | null>(null)
	const wasGeneratingRef = useRef(false)

	// Reset progress & startRef when a new generation run begins
	useEffect(() => {
		if (isGenerating && !wasGeneratingRef.current) {
			// Transition: not generating → generating
			startRef.current = Date.now()
			setProgress(0)
		}

		if (!isGenerating && wasGeneratingRef.current) {
			// Transition: generating → done — briefly show 100%
			setProgress(100)
		}

		wasGeneratingRef.current = isGenerating
	}, [isGenerating])

	// Tick progress while generating
	useEffect(() => {
		if (!isGenerating) return

		const interval = setInterval(() => {
			const elapsed = Date.now() - (startRef.current ?? Date.now())
			const ratio = Math.min(elapsed / MAX_GENERATION_MS, 1)
			const next = Math.round(ratio * ACTIVE_MAX_PROGRESS)
			setProgress((prev) => (next > prev ? next : prev))
		}, TICK_MS)

		return () => clearInterval(interval)
	}, [isGenerating])

	const showLoader = isCheckingDb || isGenerating || isLoading

	if (!showLoader) {
		return (
			<div className="bg-white border border-gray-200 rounded-lg p-12 text-center flex-shrink-0">
				<p className="text-gray-600 mb-4">
					{t("scenario.empty_state.no_scenarios")}
				</p>

				<Button variant="outline" onClick={onClearFilters}>
					{t("scenario.empty_state.clear_filters")}
				</Button>
			</div>
		)
	}

	return (
		<div className="bg-white border border-gray-200 rounded-lg p-12 text-center flex-shrink-0">
			<Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
			{isCheckingDb && (
				<p className="text-gray-600">{t("scenario.empty_state.checking_db")}</p>
			)}
			{isGenerating && (
				<>
					<p className="text-gray-700 mb-4">
						{t("scenario.empty_state.generating")}
					</p>

					<div className="max-w-md mx-auto">
						<div className="flex justify-between text-xs text-gray-500 mb-2">
							<span>{t("scenario.empty_state.progress_label")}</span>
							<span>{progress}%</span>
						</div>

						<div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
							<div
								className="h-full bg-blue-500 rounded-full transition-all duration-200"
								style={{ width: `${progress}%` }}
							/>
						</div>

						<p className="text-xs text-gray-400 mt-3">
							{t("scenario.empty_state.max_time_notice")}
						</p>
					</div>
				</>
			)}
		</div>
	)
}
