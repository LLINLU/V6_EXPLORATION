"use client"

import { useMemo, useState } from "react"
import type { QueryRiskType, QueryS06 } from "@/types/query-report"
import { ConfidenceBadge } from "../ConfidenceBadge"
import { QUERY_PROSE_CLASS } from "../proseClasses"
import { QuerySectionHeader } from "../QuerySectionHeader"
import { QuerySources } from "../QuerySources"
import { useQueryReportLabels } from "../queryReportLabels"

const RISK_STYLES: Record<
	QueryRiskType,
	{ bg: string; tab: string; chip: string }
> = {
	// Soft analogous pastel family — same faint translucent tier (~5% tint),
	// different hues. `bg` tints the card body to match its filter tab,
	// `chip` is the readable hover label. Clear of the semantic green/amber/red.
	tech: {
		bg: "bg-violet-500/5",
		tab: "bg-violet-500/5 text-violet-700 border-violet-500/10",
		chip: "bg-white text-violet-700 border-violet-300",
	},
	economic: {
		bg: "bg-sky-500/5",
		tab: "bg-sky-500/5 text-sky-700 border-sky-500/10",
		chip: "bg-white text-sky-700 border-sky-300",
	},
	regulatory: {
		bg: "bg-pink-500/5",
		tab: "bg-pink-500/5 text-pink-700 border-pink-500/10",
		chip: "bg-white text-pink-700 border-pink-300",
	},
	social: {
		bg: "bg-indigo-500/5",
		tab: "bg-indigo-500/5 text-indigo-700 border-indigo-500/10",
		chip: "bg-white text-indigo-700 border-indigo-300",
	},
	geopolitical: {
		bg: "bg-fuchsia-500/5",
		tab: "bg-fuchsia-500/5 text-fuchsia-700 border-fuchsia-500/10",
		chip: "bg-white text-fuchsia-700 border-fuchsia-300",
	},
}

const RISK_ORDER: QueryRiskType[] = [
	"tech",
	"economic",
	"regulatory",
	"social",
	"geopolitical",
]

export function QuerySection06({
	data,
	isExpanded = false,
}: {
	data: QueryS06
	isExpanded?: boolean
}) {
	const labels = useQueryReportLabels()
	const presentTypes = useMemo(() => {
		const set = new Set<QueryRiskType>()
		data.challenges?.forEach((c) => set.add(c.riskType))
		return RISK_ORDER.filter((t) => set.has(t))
	}, [data.challenges])

	const tally = useMemo(() => {
		const t: Partial<Record<QueryRiskType, number>> = {}
		data.challenges?.forEach((c) => {
			t[c.riskType] = (t[c.riskType] ?? 0) + 1
		})
		return t
	}, [data.challenges])

	const [activeTypes, setActiveTypes] = useState<Set<QueryRiskType>>(
		() => new Set(presentTypes),
	)
	const toggleType = (k: QueryRiskType) =>
		setActiveTypes((prev) => {
			const next = new Set(prev)
			if (next.has(k)) next.delete(k)
			else next.add(k)
			return next
		})

	const visibleChallenges =
		data.challenges?.filter((c) => activeTypes.has(c.riskType)) ?? []

	return (
		<section id="query-s06" className="scroll-mt-2">
			<QuerySectionHeader num="06" title={labels.section06.title} />

			{/* Intro */}
			{data.intro && (
				<div className="bg-blue-50 rounded-lg p-3 mb-4">
					<p className="font-mono text-[12px] uppercase tracking-widest text-blue-600 mb-1 inline-flex items-center gap-1.5">
						<svg
							className="w-3.5 h-3.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" />
						</svg>
						{labels.sectionPoint}
					</p>
					<p className="text-[14px] text-gray-700 leading-relaxed">
						{data.intro}
					</p>
				</div>
			)}

			{/* Body */}
			{data.body && (
				<div
					className={`${QUERY_PROSE_CLASS} mb-5`}
					dangerouslySetInnerHTML={{ __html: data.body }}
				/>
			)}

			{/* Challenges */}
			{data.challenges?.length > 0 && (
				<>
					<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
						{labels.section06.mainChallenges}
					</p>
					{presentTypes.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mb-3">
							{presentTypes.map((k) => {
								const s = RISK_STYLES[k]
								const isActive = activeTypes.has(k)
								return (
									<button
										key={k}
										type="button"
										onClick={() => toggleType(k)}
										aria-pressed={isActive}
										className={`text-[12px] px-2.5 py-1 rounded border transition ${s.tab} ${
											isActive
												? "hover:brightness-95"
												: "opacity-40 hover:opacity-80"
										}`}
									>
										{labels.section06.risk[k]} × {tally[k] ?? 0}
									</button>
								)
							})}
						</div>
					)}
					<div
						className={`grid gap-3 mb-2 ${isExpanded ? "grid-cols-2" : "grid-cols-1"}`}
					>
						{visibleChallenges.map((c, i) => {
							const s = RISK_STYLES[c.riskType]
							return (
								<div
									key={i}
									className="bg-white rounded-lg border border-gray-200 p-5"
								>
									<div className="flex items-center gap-2 mb-3 flex-wrap">
										<p className="text-[12px] font-bold text-gray-900">
											{c.title}
										</p>
										<span
											className={`inline-block text-[10px] px-2 py-0.5 rounded border shadow-sm whitespace-nowrap ${s.chip}`}
										>
											{labels.section06.risk[c.riskType]}
										</span>
										<span className="ml-auto">
											<ConfidenceBadge value={c.confidence} />
										</span>
									</div>
									<p className="text-[12px] text-gray-900 italic font-mono mb-4 leading-relaxed">
										<span className="not-italic">
											{labels.section06.barrier}
										</span>
										{c.barrier}
									</p>
									<div
										className={`${QUERY_PROSE_CLASS} bg-gray-50 rounded-lg px-4 py-3`}
										dangerouslySetInnerHTML={{ __html: c.body }}
									/>
								</div>
							)
						})}
					</div>
				</>
			)}

			<QuerySources sources={data.sources} />
		</section>
	)
}
