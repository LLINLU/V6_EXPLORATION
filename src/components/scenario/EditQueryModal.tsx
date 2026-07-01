/**
 * Edit Query Modal Component
 * Modal for editing query and keywords before regenerating scenarios
 */

import { ArrowUp, Loader2, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
// import { QueryRefiner } from "@/components/QueryRefiner" // Query Helper - commented out
import { TechCharacteristicsDialog } from "@/components/TechCharacteristicsTable"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { generateTechCharacteristics } from "@/services/multiAxisService"
import type { Keyword, TechStrength } from "@/types/axis"

interface EditQueryModalProps {
	isOpen: boolean
	onClose: () => void
	query: string
	mode: "TED" | "FAST"
	initialKeywords?: Keyword[]
	onQueryUpdate: (newQuery: string, newKeywords: Keyword[]) => void
}

export const EditQueryModal = ({
	isOpen,
	onClose,
	query: initialQuery,
	mode,
	initialKeywords = [],
	onQueryUpdate,
}: EditQueryModalProps) => {
	const { t } = useTranslation()
	const [query, setQuery] = useState(initialQuery)
	const [selectedKeywords, setSelectedKeywords] =
		useState<Keyword[]>(initialKeywords)
	// Query Helper - commented out
	// const [isQueryHelperEnabled, setIsQueryHelperEnabled] = useState(
	// 	initialKeywords && initialKeywords.length > 0,
	// )
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Tech Characteristics state
	const [showTechDialog, setShowTechDialog] = useState(false)
	const [techStrengths, setTechStrengths] = useState<TechStrength[]>([])
	const [isLoadingTechStrengths, setIsLoadingTechStrengths] = useState(false)

	// Reset state when modal opens
	useEffect(() => {
		if (isOpen) {
			setQuery(initialQuery)
			setSelectedKeywords(initialKeywords)
			// setIsQueryHelperEnabled(initialKeywords && initialKeywords.length > 0) // Query Helper - commented out
		}
	}, [isOpen, initialQuery, initialKeywords])

	const handleSubmit = async () => {
		if (!query.trim()) return

		setIsSubmitting(true)
		try {
			await onQueryUpdate(query, selectedKeywords)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleTechCharacteristicsClick = async () => {
		setShowTechDialog(true)
		if (techStrengths.length === 0 && query.trim()) {
			setIsLoadingTechStrengths(true)
			try {
				const characteristics = await generateTechCharacteristics(query.trim())
				setTechStrengths(
					characteristics.map((c) => ({
						strength_name: c.name,
						description: c.description,
						potential_applications: "",
					})),
				)
			} catch (error) {
				console.error("Failed to generate tech characteristics:", error)
			} finally {
				setIsLoadingTechStrengths(false)
			}
		}
	}

	const handleTechConfirm = (_techStrengths: TechStrength[]) => {
		setShowTechDialog(false)
	}

	const getModeButtonClass = (buttonMode: "TED" | "FAST") => {
		if (mode === buttonMode) {
			return buttonMode === "TED"
				? "bg-blue-50 text-blue-700 border border-[#cddeff]"
				: "bg-[#fdfbff] text-[#9151ce] border border-[#d9c1ef]"
		}
		return "bg-[#eeeff0] text-[#9f9f9f] cursor-not-allowed"
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
				{/* Scrollable Content Area */}
				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
					{/* Query Input */}
					<div className="space-y-2 mt-8">
						<Input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={t("scenario.edit_query.placeholder")}
							className="w-full"
							disabled={isSubmitting}
						/>
					</div>

					{/* Tech Characteristics Button (replaces Query Helper Toggle) */}
					<div className="flex items-center py-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleTechCharacteristicsClick}
							disabled={isSubmitting || !query.trim()}
							className="text-sm"
						>
							<Sparkles className="h-4 w-4 mr-1.5" />
							{t("scenario.edit_query.tech_characteristics")}
						</Button>
					</div>

					{/* Query Helper Toggle - commented out
					<div className="flex items-center justify-between py-2">
						<div className="flex items-center space-x-2">
							<Switch
								id="query-helper-modal"
								checked={isQueryHelperEnabled}
								onCheckedChange={setIsQueryHelperEnabled}
								disabled={isSubmitting}
							/>
							<Label
								htmlFor="query-helper-modal"
								className="text-sm text-gray-600 cursor-pointer"
							>
								Query Helper
							</Label>
						</div>
					</div>
					*/}

					{/* Query Refiner - commented out
					{isQueryHelperEnabled && (
						<QueryRefiner
							query={query}
							isExpanded={true}
							onKeywordsSelected={setSelectedKeywords}
							onQueryRefined={setQuery}
							initialKeywords={initialKeywords}
							className="mt-4"
						/>
					)}
					*/}
				</div>

				{/* Fixed Footer with CTAs */}
				<div className="border-t bg-white px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 hidden">
							<button
								type="button"
								className={`inline-flex items-center rounded-full py-2 px-4 h-[36px] text-sm transition-colors ${getModeButtonClass("TED")}`}
								disabled
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									fill="currentColor"
									viewBox="0 0 256 256"
									className="mr-2"
								>
									<path d="M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Zm-16,0a72,72,0,0,0-73.74-72c-39,.92-70.47,33.39-70.26,72.39a71.65,71.65,0,0,0,27.64,56.3A32,32,0,0,1,96,186v6h24V147.5a28,28,0,1,1,16,0V192h24v-6a32.15,32.15,0,0,1,12.47-25.35A71.65,71.65,0,0,0,200,104Zm-72,28a12,12,0,1,0-12-12A12,12,0,0,0,128,132Z"></path>
								</svg>
								{t("scenario.edit_query.explore_applications")}
							</button>

							<button
								type="button"
								className={`inline-flex items-center rounded-full py-2 px-4 h-[36px] text-sm transition-colors ${getModeButtonClass("FAST")}`}
								disabled
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									fill="currentColor"
									viewBox="0 0 256 256"
									className="mr-2"
								>
									<path d="M193.83,128a195.73,195.73,0,0,0,19.9-33.65c10.74-23.88,11-42.66.8-52.88s-29-9.94-52.88.8A195.73,195.73,0,0,0,128,62.17a195.73,195.73,0,0,0-33.65-19.9c-23.88-10.74-42.66-11-52.88-.8s-9.94,29,.8,52.88A195.73,195.73,0,0,0,62.17,128a195.73,195.73,0,0,0-19.9,33.65c-10.74,23.88-11,42.66-.8,52.88h0c5,5,12,7.47,20.63,7.47,9.1,0,20-2.76,32.25-8.27A195.73,195.73,0,0,0,128,193.83a195.73,195.73,0,0,0,33.65,19.9C173.9,219.24,184.8,222,193.9,222c8.64,0,15.65-2.49,20.63-7.47h0c10.23-10.22,9.94-29-.8-52.88A195.73,195.73,0,0,0,193.83,128ZM206,50c9.28,9.28,2.36,36.29-19.8,68a306.2,306.2,0,0,0-22.78-25.45A306.2,306.2,0,0,0,138,69.76C169.75,47.61,196.77,40.68,206,50Zm-27.19,78A289.17,289.17,0,0,1,155,155a289.17,289.17,0,0,1-27,23.88A289.17,289.17,0,0,1,101,155a290.62,290.62,0,0,1-23.88-27A297.06,297.06,0,0,1,128,77.14,290.74,290.74,0,0,1,155,101,289.17,289.17,0,0,1,178.85,128ZM50,50c2.68-2.69,6.84-4,12.17-4,13.11,0,33.3,8,55.87,23.81A302.94,302.94,0,0,0,92.54,92.54,306.2,306.2,0,0,0,69.76,118C47.6,86.25,40.68,59.24,50,50ZM50,206h0c-9.28-9.28-2.35-36.29,19.8-68a306.2,306.2,0,0,0,22.78,25.45A306.2,306.2,0,0,0,118,186.24C86.25,208.4,59.24,215.32,50,206ZM206,206c-9.28,9.28-36.29,2.35-68-19.81a304.26,304.26,0,0,0,25.45-22.77A306.2,306.2,0,0,0,186.24,138C208.4,169.75,215.32,196.76,206,206Zm-68-78a10,10,0,1,1-10-10A10,10,0,0,1,138,128Z"></path>
								</svg>
								{t("scenario.edit_query.deep_dive")}
							</button>
						</div>

						<Button
							onClick={handleSubmit}
							disabled={!query.trim() || isSubmitting}
							className="bg-gray-100 hover:bg-gray-200 text-gray-600"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
									Regenerating...
								</>
							) : (
								<>
									<ArrowUp className="h-4 w-4 mr-2" />
									Regenerate Scenarios
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>

			{/* Tech Characteristics Dialog */}
			<TechCharacteristicsDialog
				open={showTechDialog}
				onOpenChange={setShowTechDialog}
				onConfirm={handleTechConfirm}
				query={query}
				techStrengths={techStrengths}
				isLoadingTechStrengths={isLoadingTechStrengths}
			/>
		</Dialog>
	)
}
