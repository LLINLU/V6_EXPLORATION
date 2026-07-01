import { ArrowRight, Download, Loader2, Plus, X } from "lucide-react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { TechStrength } from "@/types/axis"
import { exportToCsv } from "@/utils/csvExport"

interface TechCharacteristicsDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: (techStrengths: TechStrength[]) => void
	query: string
	loading?: boolean
	techStrengths?: TechStrength[]
	isLoadingTechStrengths?: boolean
	showConfirmButton?: boolean
	showDownloadButton?: boolean
	onAddTechStrength?: (techStrength: TechStrength) => void
	onRemoveTechStrength?: (index: number) => void
}

export const TechCharacteristicsDialog = ({
	open,
	onOpenChange,
	onConfirm,
	query,
	loading = false,
	techStrengths,
	isLoadingTechStrengths = false,
	showConfirmButton = true,
	showDownloadButton = false,
	onAddTechStrength,
	onRemoveTechStrength,
}: TechCharacteristicsDialogProps) => {
	const { t } = useTranslation()
	const rows = techStrengths ?? []

	const [newName, setNewName] = useState("")
	const [newDescription, setNewDescription] = useState("")
	const [newApplications, setNewApplications] = useState("")
	const [showAddForm, setShowAddForm] = useState(false)

	const descriptionRef = useRef<HTMLInputElement>(null)
	const applicationsRef = useRef<HTMLInputElement>(null)

	const handleDownloadCsv = () => {
		if (rows.length === 0) return
		const csvRows = rows.map((row) => ({
			[t("research.techCharDialog.colTitle")]: row.strength_name ?? "",
			[t("research.techCharDialog.colDescription")]: row.description ?? "",
			[t("research.techCharDialog.colAdvantage")]:
				row.potential_applications ?? "",
		}))
		const filename = `tech_characteristics_${query || "export"}.csv`
		exportToCsv(filename, csvRows)
	}

	const handleAdd = () => {
		if (!newName.trim()) return
		onAddTechStrength?.({
			strength_name: newName.trim(),
			description: newDescription.trim(),
			potential_applications: newApplications.trim(),
		})
		setNewName("")
		setNewDescription("")
		setNewApplications("")
		setShowAddForm(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[720px] pt-6 pb-3">
				<DialogHeader>
					<DialogTitle>{t("research.techCharDialog.title")}</DialogTitle>
					<DialogDescription asChild>
						<div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
							{t("research.techCharDialog.searchQuery")}:{" "}
							<span className="font-normal text-blue-700">{query}</span>
						</div>
					</DialogDescription>
				</DialogHeader>

				<div className="overflow-hidden rounded-lg border-[1.5px] border-[#cddeff]">
					<div className="max-h-[400px] overflow-y-auto">
						<table className="w-full border-collapse">
							<thead className="sticky top-0 z-10">
								<tr className="bg-blue-50">
									<th className="px-4 py-2.5 text-left text-[13px] font-medium text-blue-700 w-[140px]">
										{t("research.techCharDialog.colTitle")}
									</th>
									<th className="px-4 py-2.5 text-left text-[13px] font-medium text-blue-700">
										{t("research.techCharDialog.colDescription")}
									</th>
									<th className="px-4 py-2.5 text-left text-[13px] font-medium text-blue-700 w-[180px]">
										{t("research.techCharDialog.colAdvantage")}
									</th>
									{onRemoveTechStrength && (
										<th className="px-2 py-2.5 w-[36px]" />
									)}
								</tr>
							</thead>
							<tbody className="bg-background">
								{isLoadingTechStrengths ? (
									Array.from({ length: 5 }).map((_, i) => (
										<tr
											key={`skeleton-${i}`}
											className={i < 4 ? "border-b border-border" : ""}
										>
											<td className="px-4 py-3">
												<div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
											</td>
											<td className="px-4 py-3">
												<div className="h-4 w-full animate-pulse rounded bg-gray-200" />
											</td>
											<td className="px-4 py-3">
												<div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
											</td>
											{onRemoveTechStrength && <td />}
										</tr>
									))
								) : rows.length > 0 ? (
									rows.map((row, index) => (
										<tr
											key={`${row.strength_name || "row"}-${index}`}
											className={
												index < rows.length - 1 ? "border-b border-border" : ""
											}
										>
											<td className="px-4 py-3 text-[13px] font-medium text-foreground align-middle">
												{row.strength_name}
											</td>
											<td className="px-4 py-3 text-[13px] text-foreground leading-relaxed">
												{row.description}
											</td>
											<td className="px-4 py-3 text-[13px] text-foreground leading-relaxed">
												{row.potential_applications}
											</td>
											{onRemoveTechStrength && (
												<td className="px-2 py-3 align-middle">
													<button
														type="button"
														onClick={() => onRemoveTechStrength(index)}
														className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
														title={t("research.techCharDialog.delete")}
													>
														<X className="h-3.5 w-3.5" />
													</button>
												</td>
											)}
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan={onRemoveTechStrength ? 4 : 3}
											className="px-4 py-6 text-center text-sm text-muted-foreground"
										>
											{t("research.techCharDialog.noCharacteristics")}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Manual add form */}
				{onAddTechStrength && (
					<div>
						{showAddForm ? (
							<div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
								<div className="grid grid-cols-[140px_1fr_180px] gap-2">
									<Input
										placeholder={t("research.techCharDialog.placeholderTitle")}
										value={newName}
										onChange={(e) => setNewName(e.target.value)}
										className="text-[13px] h-8"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault()
												descriptionRef.current?.focus()
											}
										}}
									/>
									<Input
										ref={descriptionRef}
										placeholder={t(
											"research.techCharDialog.placeholderDescription",
										)}
										value={newDescription}
										onChange={(e) => setNewDescription(e.target.value)}
										className="text-[13px] h-8"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault()
												applicationsRef.current?.focus()
											}
										}}
									/>
									<Input
										ref={applicationsRef}
										placeholder={t(
											"research.techCharDialog.placeholderAdvantage",
										)}
										value={newApplications}
										onChange={(e) => setNewApplications(e.target.value)}
										className="text-[13px] h-8"
										onKeyDown={(e) => {
											if (e.key === "Enter") handleAdd()
										}}
									/>
								</div>
								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setShowAddForm(false)
											setNewName("")
											setNewDescription("")
											setNewApplications("")
										}}
										className="h-7 text-xs"
									>
										{t("research.techCharDialog.cancel")}
									</Button>
									<Button
										size="sm"
										onClick={handleAdd}
										disabled={!newName.trim()}
										className="h-7 text-xs bg-[#2563eb] hover:bg-[#2563eb]/90"
									>
										{t("research.techCharDialog.add")}
									</Button>
								</div>
							</div>
						) : (
							!isLoadingTechStrengths && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowAddForm(true)}
									className="w-full h-8 text-xs text-muted-foreground"
								>
									<Plus className="h-3.5 w-3.5 mr-1" />
									{t("research.techCharDialog.addCharacteristic")}
								</Button>
							)
						)}
					</div>
				)}

				<div className="flex items-center justify-between pt-0">
					{showDownloadButton ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDownloadCsv}
							disabled={isLoadingTechStrengths || rows.length === 0}
							className="h-8 gap-1 text-xs text-gray-500 hover:text-gray-700"
						>
							<Download className="h-3.5 w-3.5" />
							{t("research.techCharDialog.downloadCsv")}
						</Button>
					) : (
						<div />
					)}
					{showConfirmButton && (
						<Button
							onClick={() => onConfirm(rows)}
							disabled={loading || isLoadingTechStrengths || rows.length === 0}
							className="bg-[#2563eb] hover:bg-[#2563eb]/90 disabled:bg-[#93bbfd] disabled:opacity-100"
						>
							{loading ? (
								<>
									<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
									{t("research.techCharDialog.exploring")}
								</>
							) : (
								<>
									{t("research.techCharDialog.confirmNext")}
									<ArrowRight className="ml-1.5 h-4 w-4" />
								</>
							)}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
