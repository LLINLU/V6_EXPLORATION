import {
	CheckCircle2,
	Circle,
	FileText,
	Layers,
	MessageSquare,
	Target,
} from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UserSelectionsCardProps {
	userAnswers: {
		focus?: string
		purpose?: string[]
		targetField?: Record<string, string[]>
		additionalContext?: string
	}
	questionStatus: Record<string, boolean>
}

export const UserSelectionsCard = ({
	userAnswers,
	questionStatus,
}: UserSelectionsCardProps) => {
	const { t } = useTranslation()
	const getFocusLabel = (focus: string) => {
		// The focus is stored as the full Japanese text
		return focus
	}

	const getFocusIcon = (focus: string) => {
		if (focus?.includes("技術的")) return <Layers className="h-4 w-4" />
		if (focus?.includes("市場")) return <Target className="h-4 w-4" />
		return <Circle className="h-4 w-4" />
	}

	const renderTargetFieldSelections = () => {
		if (!userAnswers.targetField) return null

		const selections: React.ReactNode[] = []

		Object.entries(userAnswers.targetField).forEach(
			([groupTitle, selectedValues]) => {
				if (selectedValues && selectedValues.length > 0) {
					selections.push(
						<div key={groupTitle} className="mb-3">
							<h5 className="text-xs font-medium text-gray-600 mb-2">
								{groupTitle}
							</h5>
							<div className="space-y-1">
								{selectedValues.map((value) => {
									// Values are now stored as clean text, no processing needed
									const displayLabel = value

									return (
										<Badge
											key={value}
											variant="outline"
											className="text-xs px-2 py-1 mr-1 mb-1 bg-blue-50 border-blue-200 text-blue-700"
										>
											{displayLabel}
										</Badge>
									)
								})}
							</div>
						</div>,
					)
				}
			},
		)

		return selections
	}

	return (
		<Card className="shadow-sm">
			<CardHeader className="pb-3">
				<CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
					<CheckCircle2 className="h-4 w-4 text-green-600" />
					{t("research.userSelections.title")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Research Focus */}
				{userAnswers.focus && (
					<div className="bg-gray-50 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-2">
							{getFocusIcon(userAnswers.focus)}
							<span className="text-sm font-medium text-gray-700">
								{t("research.userSelections.researchFocus")}
							</span>
							{questionStatus.focus && (
								<CheckCircle2 className="h-4 w-4 text-green-600" />
							)}
						</div>
						<Badge
							variant="secondary"
							className="bg-indigo-100 text-indigo-800 border-indigo-200"
						>
							{getFocusLabel(userAnswers.focus)}
						</Badge>
					</div>
				)}

				{/* Research Purpose */}
				{userAnswers.purpose && userAnswers.purpose.length > 0 && (
					<div className="bg-gray-50 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-2">
							<MessageSquare className="h-4 w-4" />
							<span className="text-sm font-medium text-gray-700">
								{t("research.userSelections.researchPurpose")}
							</span>
							{questionStatus.purpose && (
								<CheckCircle2 className="h-4 w-4 text-green-600" />
							)}
						</div>
						<div className="space-y-1">
							{userAnswers.purpose.map((purpose) => {
								// Values are now stored as clean text, no processing needed
								const displayPurpose = purpose

								return (
									<Badge
										key={purpose}
										variant="outline"
										className="text-xs px-2 py-1 mr-1 mb-1 bg-green-50 border-green-200 text-green-700"
									>
										{displayPurpose}
									</Badge>
								)
							})}
						</div>
					</div>
				)}

				{/* Target Field Selections */}
				{userAnswers.targetField &&
					Object.keys(userAnswers.targetField).length > 0 && (
						<div className="bg-gray-50 rounded-lg p-3">
							<div className="flex items-center gap-2 mb-2">
								<Target className="h-4 w-4" />
								<span className="text-sm font-medium text-gray-700">
									{t("research.userSelections.targetField")}
								</span>
								{questionStatus.targetField && (
									<CheckCircle2 className="h-4 w-4 text-green-600" />
								)}
							</div>
							{renderTargetFieldSelections()}
						</div>
					)}

				{/* Additional Context */}
				{userAnswers.additionalContext && (
					<div className="bg-gray-50 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-2">
							<FileText className="h-4 w-4" />
							<span className="text-sm font-medium text-gray-700">
								{t("research.userSelections.additionalContext")}
							</span>
							{questionStatus.additionalContext && (
								<CheckCircle2 className="h-4 w-4 text-green-600" />
							)}
						</div>
						<div className="text-xs text-gray-600 bg-white rounded border p-2 max-h-20 overflow-y-auto">
							{userAnswers.additionalContext}
						</div>
					</div>
				)}

				{/* Empty State */}
				{!userAnswers.focus &&
					!userAnswers.purpose &&
					!userAnswers.targetField &&
					!userAnswers.additionalContext && (
						<div className="text-center py-6 text-gray-500">
							<Circle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
							<p className="text-sm">
								{t("research.userSelections.emptyState")}
							</p>
						</div>
					)}
			</CardContent>
		</Card>
	)
}
