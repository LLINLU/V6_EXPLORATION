/**
 * TRL Modal - displays all technologies and their TRL for a scenario.
 * Opened when user clicks the TRL cell in the table.
 */

import { useTranslation } from "react-i18next"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import type { Scenario } from "@/types/scenario"
import { getTRLDescription, TRLIndicator } from "./TRLIndicator"

interface TRLModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	scenario: Scenario | null
}

export function TRLModal({ open, onOpenChange, scenario }: TRLModalProps) {
	const { t } = useTranslation()
	const metrics = scenario?.metrics
	const technologiesTrl = metrics?.technologiesTrl
	const hasMultiple = technologiesTrl && technologiesTrl.length > 0
	const trlBreakdown = metrics?.trlBreakdown

	if (open) {
		console.log("TRL Modal Data:", {
			technologiesTrl,
			trlBreakdown,
		})
	}
	// Use real data when available, otherwise show empty state
	const tableRows = hasMultiple
		? technologiesTrl?.map((item) => {
				const desc = getTRLDescription(item.trl.trl_score, t)
				return {
					name: item.name,
					explanation: item.description,
					trl: item.trl.trl_score,
					interpretation: desc.title,
				}
			})
		: []

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[900px] w-[90vw] min-h-[400px] max-h-[90vh] flex flex-col p-0 z-[100]">
				<DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
					<DialogTitle className="h-8 text-base font-medium pr-8">
						TRL{scenario ? ` — ${scenario.name}` : ""}
					</DialogTitle>
				</DialogHeader>

				<div className="p-4 overflow-y-auto flex-1 min-h-0">
					{!scenario ? (
						<p className="text-sm text-gray-500">
							{t("scenario.trl_modal.no_scenario")}
						</p>
					) : tableRows.length === 0 && !trlBreakdown ? (
						<div className="flex flex-col items-center justify-center py-12 text-gray-500">
							<p className="text-sm">{t("scenario.trl_modal.no_data")}</p>
							<p className="text-xs mt-1 text-gray-400">
								{t("scenario.trl_modal.no_data_hint")}
							</p>
						</div>
					) : (
						<>
							<p className="text-sm text-gray-600 mb-3">
								{t("scenario.trl_modal.description")}
							</p>
							<div className="border border-gray-200 rounded-lg overflow-hidden">
								<table className="w-full text-sm">
									<thead>
										<tr className="bg-gray-50 border-b border-gray-200">
											<th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[22%]">
												{t("scenario.trl_modal.col_tech_name")}
											</th>
											<th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[33%]">
												{t("scenario.trl_modal.col_summary")}
											</th>
											<th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[10%]">
												TRL
											</th>
											<th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[35%]">
												{t("scenario.trl_modal.col_interpretation")}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{tableRows.map((row, idx) => (
											<tr key={`${row.name}-${idx}`} className="bg-white">
												<td className="py-2.5 px-3 text-gray-900 font-medium">
													{row.name}
												</td>
												<td className="py-2.5 px-3 text-gray-600">
													{row.explanation || "—"}
												</td>
												<td className="py-2.5 px-3">
													<div className="flex items-center gap-1.5">
														<TRLIndicator level={row.trl} />
														<span className="text-gray-700">{row.trl}</span>
													</div>
												</td>
												<td className="py-2.5 px-3 text-gray-600">
													{row.interpretation}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{!hasMultiple && trlBreakdown && (
								<div className="mt-4 rounded-lg bg-[#F5F9FF] p-4 border border-blue-50">
									<h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
										{t("scenario.trl_modal.breakdown_title")}
									</h4>
									<div className="flex flex-wrap gap-3 text-sm text-gray-700">
										<span className="inline-flex items-center gap-1">
											<span className="text-blue-600">
												📄 {t("scenario.trl_modal.papers")}:
											</span>{" "}
											{trlBreakdown.paperContribution?.toFixed(1) ?? "—"}
										</span>
										<span className="inline-flex items-center gap-1">
											<span className="text-orange-600">
												📋 {t("scenario.trl_modal.patents")}:
											</span>{" "}
											{trlBreakdown.patentContribution?.toFixed(1) ?? "—"}
										</span>
									</div>
									{trlBreakdown.reasoning && (
										<p className="text-xs text-gray-600 mt-2 pt-2 border-t border-blue-100 leading-relaxed">
											{trlBreakdown.reasoning}
										</p>
									)}
								</div>
							)}
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
