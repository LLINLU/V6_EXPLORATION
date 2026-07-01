import { useState } from "react"
import type { TechnologyScore, TrlReportSection } from "@/types/report"
import { TrlBarChart } from "./TrlBarChart"
import { TrlScoreTable } from "./TrlScoreTable"

interface TrlAnalysisSectionProps {
	reportSections: TrlReportSection[]
	scores: TechnologyScore[]
}

export function TrlAnalysisSection({
	reportSections,
	scores,
}: TrlAnalysisSectionProps) {
	const [expandedTech, setExpandedTech] = useState<Set<string>>(new Set())

	const toggleTech = (name: string) => {
		setExpandedTech((prev) => {
			const next = new Set(prev)
			if (next.has(name)) next.delete(name)
			else next.add(name)
			return next
		})
	}

	return (
		<section id="report-trl-analysis" className="scroll-mt-4">
			<h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
				<span className="text-blue-600">2.</span> TRL分析
			</h2>

			{/* EU TRL Definition (collapsible) */}
			<details className="mb-4 border border-gray-200 rounded-lg">
				<summary className="cursor-pointer p-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
					EU TRL定義（クリックで展開）
				</summary>
				<div className="px-3 pb-3">
					<table className="w-full text-xs">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="py-1.5 text-left w-12">レベル</th>
								<th className="py-1.5 text-left">名称</th>
								<th className="py-1.5 text-left">説明</th>
							</tr>
						</thead>
						<tbody>
							{[
								["1", "基礎原理の確認", "基礎的な特性が確認された段階"],
								[
									"2",
									"技術コンセプトの策定",
									"技術コンセプトとアプリケーションが策定された段階",
								],
								["3", "概念実証", "実験的な概念実証が完了した段階"],
								["4", "ラボ環境検証", "実験室環境で技術が検証された段階"],
								["5", "関連環境検証", "関連する環境で技術が検証された段階"],
								[
									"6",
									"実証実験",
									"関連環境でシステム/サブシステムの実証が行われた段階",
								],
								[
									"7",
									"実運用環境実証",
									"実運用環境でシステムのプロトタイプが実証された段階",
								],
								[
									"8",
									"システム完成・検証",
									"実際のシステムが完成し検証された段階",
								],
								[
									"9",
									"実運用での実証",
									"実運用環境で実際のシステムが実証された段階",
								],
							].map(([level, name, desc]) => (
								<tr key={level} className="border-b border-gray-100">
									<td className="py-1.5 font-semibold text-blue-600">
										{level}
									</td>
									<td className="py-1.5">{name}</td>
									<td className="py-1.5 text-gray-500">{desc}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>

			{/* Report sections with collapsible technologies */}
			{reportSections.map((section, si) => (
				<div key={si} className="mb-4">
					<h4 className="text-sm font-semibold text-gray-800 mb-2">
						{section.heading}
					</h4>
					{section.summary && (
						<div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-3">
							<p className="text-xs text-gray-700 whitespace-pre-line">
								{section.summary}
							</p>
						</div>
					)}
					{section.technologies.map((tech) => (
						<div
							key={tech.name}
							className="border border-gray-200 rounded-lg mb-2"
						>
							<button
								type="button"
								onClick={() => toggleTech(`${si}-${tech.name}`)}
								className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between"
							>
								<span>{tech.name}</span>
								<span className="text-gray-400 text-[10px]">
									{expandedTech.has(`${si}-${tech.name}`) ? "▲" : "▼"}
								</span>
							</button>
							{expandedTech.has(`${si}-${tech.name}`) && (
								<div className="px-3 pb-3 border-t border-gray-100">
									<p className="text-xs text-gray-600 whitespace-pre-line mt-2">
										{tech.content}
									</p>
								</div>
							)}
						</div>
					))}
				</div>
			))}

			<TrlScoreTable scores={scores} />
			<TrlBarChart scores={scores} />
		</section>
	)
}
