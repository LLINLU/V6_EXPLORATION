/**
 * Edit Scenario Modal Component
 * Modal for editing scenario details and regenerating variations
 */

import { Loader2, RefreshCw, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Scenario } from "@/types/scenario"

interface EditScenarioModalProps {
	isOpen: boolean
	onClose: () => void
	scenario: Scenario | null
	onSave: (updatedScenario: Scenario) => void
	onRegenerate: (scenarioId: string, mode: "converge" | "diverge") => void
}

export const EditScenarioModal = ({
	isOpen,
	onClose,
	scenario,
	onSave,
	onRegenerate,
}: EditScenarioModalProps) => {
	const { t } = useTranslation()
	const [editedScenario, setEditedScenario] = useState<Scenario | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [isRegenerating, setIsRegenerating] = useState<
		"converge" | "diverge" | null
	>(null)

	useEffect(() => {
		if (scenario) {
			setEditedScenario(scenario)
		}
	}, [scenario])

	const handleSave = async () => {
		if (!editedScenario) return

		setIsSaving(true)
		try {
			await onSave(editedScenario)
			onClose()
		} catch (error) {
			console.error("Error saving scenario:", error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleRegenerate = async (mode: "converge" | "diverge") => {
		if (!editedScenario) return

		setIsRegenerating(mode)
		try {
			await onRegenerate(editedScenario.id, mode)
			// Modal will stay open to show the regenerated result
		} catch (error) {
			console.error("Error regenerating scenario:", error)
		} finally {
			setIsRegenerating(null)
		}
	}

	if (!editedScenario) return null

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
				{/* Header */}
				<div className="px-6 pt-6 pb-4 border-b">
					<h2 className="text-xl font-semibold text-gray-900">
						{t("scenario.edit_modal.title")}
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						{t("scenario.edit_modal.subtitle")}
					</p>
				</div>

				{/* Scrollable Content */}
				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
					{/* Scenario Name */}
					<div className="space-y-2">
						<Label
							htmlFor="scenario-name"
							className="text-sm"
							style={{ fontWeight: 400 }}
						>
							{t("scenario.edit_modal.name_label")}
						</Label>
						<Input
							id="scenario-name"
							value={editedScenario.name}
							onChange={(e) =>
								setEditedScenario({ ...editedScenario, name: e.target.value })
							}
							className="w-full"
							placeholder={t("scenario.edit_modal.name_placeholder")}
						/>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label
							htmlFor="scenario-description"
							className="text-sm"
							style={{ fontWeight: 400 }}
						>
							{t("scenario.edit_modal.description_label")}
						</Label>
						<Textarea
							id="scenario-description"
							value={editedScenario.description || ""}
							onChange={(e) =>
								setEditedScenario({
									...editedScenario,
									description: e.target.value,
								})
							}
							className="w-full min-h-[100px]"
							placeholder={t("scenario.edit_modal.description_placeholder")}
						/>
					</div>

					{/* Tags */}
					<div className="space-y-2">
						<Label
							htmlFor="scenario-tags"
							className="text-sm"
							style={{ fontWeight: 400 }}
						>
							{t("scenario.edit_modal.tags_label")}
						</Label>
						<Input
							id="scenario-tags"
							value={editedScenario.tags.join(", ")}
							onChange={(e) =>
								setEditedScenario({
									...editedScenario,
									tags: e.target.value
										.split(",")
										.map((tag) => tag.trim())
										.filter(Boolean),
								})
							}
							className="w-full"
							placeholder={t("scenario.edit_modal.tags_placeholder")}
						/>
					</div>

					{/* Regenerate Options */}
					<div className="pt-4 border-t">
						<h3 className="text-sm font-semibold text-gray-900 mb-3">
							{t("scenario.edit_modal.regenerate_title")}
						</h3>
						<p className="text-xs text-gray-600 mb-4">
							{t("scenario.edit_modal.regenerate_description")}
						</p>
						<div className="grid grid-cols-2 gap-3">
							<Button
								onClick={() => handleRegenerate("converge")}
								disabled={isRegenerating !== null || isSaving}
								variant="outline"
								className="h-auto py-4 flex flex-col items-start space-y-2 border-2 hover:border-blue-500 hover:bg-blue-50"
							>
								<div className="flex items-center gap-2 w-full">
									<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
										<RefreshCw className="h-4 w-4 text-blue-600" />
									</div>
									<span className="font-semibold text-gray-900">
										{t("scenario.edit_modal.converge_label")}
									</span>
								</div>
								<span className="text-xs text-gray-600 text-left">
									{t("scenario.edit_modal.converge_description")}
								</span>
								{isRegenerating === "converge" && (
									<Loader2 className="h-4 w-4 animate-spin text-blue-600 ml-auto" />
								)}
							</Button>

							<Button
								onClick={() => handleRegenerate("diverge")}
								disabled={isRegenerating !== null || isSaving}
								variant="outline"
								className="h-auto py-4 flex flex-col items-start space-y-2 border-2 hover:border-purple-500 hover:bg-purple-50"
							>
								<div className="flex items-center gap-2 w-full">
									<div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
										<Zap className="h-4 w-4 text-purple-600" />
									</div>
									<span className="font-semibold text-gray-900">
										{t("scenario.edit_modal.diverge_label")}
									</span>
								</div>
								<span className="text-xs text-gray-600 text-left">
									{t("scenario.edit_modal.diverge_description")}
								</span>
								{isRegenerating === "diverge" && (
									<Loader2 className="h-4 w-4 animate-spin text-purple-600 ml-auto" />
								)}
							</Button>
						</div>
					</div>
				</div>

				{/* Footer */}
				<DialogFooter className="px-6 py-4 border-t bg-gray-50">
					<div className="flex items-center justify-end gap-3 w-full">
						<Button
							onClick={onClose}
							variant="outline"
							disabled={isSaving || isRegenerating !== null}
						>
							{t("scenario.edit_modal.cancel")}
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSaving || isRegenerating !== null}
							className="bg-blue-600 hover:bg-blue-700 text-white"
						>
							{isSaving ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
									{t("scenario.edit_modal.saving")}
								</>
							) : (
								t("scenario.edit_modal.save")
							)}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
