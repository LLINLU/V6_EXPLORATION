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
import { getTRLDescription } from "./TRLIndicator"

const TRL_SEGMENT_COLORS = ["#fecaca","#fed7aa","#fef08a","#d9f99d","#bbf7d0","#99f6e4","#a5f3fc","#bae6fd","#bfdbfe"]

function TrlDots({ level }: { level: number }) {
	return (
		<div className="flex items-center gap-1">
			{Array.from({ length: 9 }, (_, i) => {
				const filled = i < level
				return (
					<div
						key={i}
						className="rounded-full shrink-0"
						style={{
							width: filled ? 10 : 7,
							height: filled ? 10 : 7,
							background: filled ? TRL_SEGMENT_COLORS[i] : "#e5e7eb",
						}}
					/>
				)
			})}
			<span className="text-sm text-gray-400 ml-1 tabular-nums">{level}</span>
		</div>
	)
}

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
	const DUMMY_TECHS = [
		{ name: "コアアルゴリズム", explanation: "本シナリオの中心となる計算・推論アルゴリズム。精度と処理速度のトレードオフを最適化する。", trl: 5 },
		{ name: "データ収集・前処理基盤", explanation: "学習・評価に必要なデータを収集し、ノイズ除去・正規化・ラベリングを行うパイプライン。", trl: 7 },
		{ name: "統合インターフェース", explanation: "既存システムやワークフローへの接続を担うAPIおよびUI層。ユーザーの操作性を左右する。", trl: 6 },
		{ name: "評価・検証フレームワーク", explanation: "実環境での性能を定量化するベンチマーク体系。規制要件への適合性確認にも用いる。", trl: 4 },
	]

	// Use real data when available, otherwise fall back to dummy for design exploration
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
		: DUMMY_TECHS.map((item) => {
				const desc = getTRLDescription(item.trl, t)
				return {
					name: item.name,
					explanation: item.explanation,
					trl: item.trl,
					interpretation: desc.title,
				}
			})

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
					) : false ? (
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
											<th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[25%]">
												{t("scenario.trl_modal.col_tech_name")}
											</th>
											<th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[45%]">
												{t("scenario.trl_modal.col_summary")}
											</th>
											<th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[30%]">
												TRL
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
													{row.trl != null && <TrlDots level={row.trl} />}
													{row.interpretation && (
														<div className="text-xs text-gray-500 mt-1">{row.interpretation}</div>
													)}
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
