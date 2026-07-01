"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"
import type {
	QueryClassification,
	QueryS05,
	QueryTechnology,
} from "@/types/query-report"
import { QuerySectionHeader } from "../QuerySectionHeader"
import { QuerySources } from "../QuerySources"
import { useQueryReportLabels } from "../queryReportLabels"

const CLS_STYLES: Record<
	QueryClassification,
	{ bg: string; text: string; border: string }
> = {
	A: {
		bg: "bg-emerald-50",
		text: "text-emerald-700",
		border: "border-emerald-200",
	},
	B: {
		bg: "bg-amber-50",
		text: "text-amber-700",
		border: "border-amber-200",
	},
	C: {
		bg: "bg-blue-50",
		text: "text-blue-700",
		border: "border-blue-200",
	},
	D: {
		bg: "bg-violet-50",
		text: "text-violet-700",
		border: "border-violet-200",
	},
	E: {
		bg: "bg-red-50",
		text: "text-red-700",
		border: "border-red-200",
	},
}

const TRL_COLOR_BG: Record<string, string> = {
	green: "bg-emerald-500",
	amber: "bg-amber-500",
	blue: "bg-blue-500",
}

const TRL_COLOR_PILL: Record<string, string> = {
	green: "bg-emerald-100 text-emerald-700",
	amber: "bg-amber-100 text-amber-700",
	blue: "bg-blue-100 text-blue-700",
}

// TRL level → maturity band, aligned with the tech-card TRL colors below
function trlBand(level: number): "green" | "amber" | "blue" {
	if (level >= 7) return "green"
	if (level >= 4) return "amber"
	return "blue"
}

// Split a source note into its title and the URL embedded in it, dropping any
// trailing "関連サーベイ:" / "関連文献:" label and dangling punctuation.
function parseSourceNote(note: string): { title: string; url?: string } {
	const m = note.match(/https?:\/\/\S+/)
	if (!m) return { title: note }
	const title = note
		.slice(0, m.index)
		.replace(/(関連サーベイ|関連文献)\s*[:：]?\s*$/, "")
		.replace(/[。、\s]+$/, "")
		.trim()
	return { title: title || note, url: m[0] }
}

function TrlHistogram({ dist, color }: { dist: number[]; color: string }) {
	const max = Math.max(...dist, 1)
	return (
		<div className="flex items-end gap-0.5 h-10 w-full">
			{dist.map((n, i) => (
				<div
					key={i}
					className="flex-1 flex flex-col items-center gap-0.5 min-w-0"
					title={`TRL ${i + 1}: ${n}件`}
				>
					<div
						className={`w-full rounded-sm ${n > 0 ? TRL_COLOR_BG[color] : "bg-gray-100"}`}
						style={{ height: `${(n / max) * 32 + (n > 0 ? 2 : 1)}px` }}
					/>
					<span className="font-mono text-[8px] text-gray-400">{i + 1}</span>
				</div>
			))}
		</div>
	)
}

function TechCard({
	tech,
	principleMapRefLabel,
}: {
	tech: QueryTechnology
	principleMapRefLabel: string
}) {
	const source = tech.sourceNote ? parseSourceNote(tech.sourceNote) : null
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
			<div className="flex items-start justify-between gap-2 mb-2.5">
				<div className="min-w-0">
					<p className="text-[12px] font-bold text-gray-900 leading-snug">
						{tech.name}
					</p>
					<p className="text-[12px] text-gray-400 italic mt-0.5">
						{tech.nameEn}
					</p>
				</div>
				<span
					className={`font-mono text-[10px] px-2 py-0.5 rounded-lg ${TRL_COLOR_PILL[tech.trlColor]} shrink-0`}
				>
					{tech.trlVerdict}
				</span>
			</div>
			<p className="font-mono text-[12px] text-gray-400 mb-3">
				{principleMapRefLabel}
				<span className="text-blue-600 ml-1">{tech.principleMapRef}</span>
			</p>
			<p className="text-[14px] text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-4 py-3 mb-6">
				{tech.desc}
			</p>

			{/* TRL row */}
			<div className="flex items-center gap-3 mb-1">
				<div className="flex-1 min-w-0">
					<TrlHistogram dist={tech.trlDist} color={tech.trlColor} />
				</div>
				<div className="text-right shrink-0">
					<p className="font-mono text-[14px] font-bold text-gray-900 leading-none">
						TRL {tech.trlAvg.toFixed(1)}
					</p>
					<p className="font-mono text-[10px] text-gray-400 mt-1">
						SD ±{tech.trlSd} / N={tech.trlN}
					</p>
				</div>
			</div>

			{source &&
				(source.url ? (
					<a
						href={source.url}
						target="_blank"
						rel="noopener noreferrer"
						className="group inline-flex items-start gap-1 max-w-full mt-2 font-mono text-[10px] bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded hover:bg-gray-100 transition-colors"
					>
						<span className="min-w-0 break-words">{source.title}</span>
						<svg
							className="w-2.5 h-2.5 mt-0.5 shrink-0 text-blue-600 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
							viewBox="0 0 12 12"
							fill="none"
						>
							<path
								d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</a>
				) : (
					<p className="text-[11px] text-gray-500 italic leading-relaxed mt-1 break-words">
						{source.title}
					</p>
				))}
		</div>
	)
}

export function QuerySection05({
	data,
	isExpanded = false,
	printMode = false,
}: {
	data: QueryS05
	isExpanded?: boolean
	printMode?: boolean
}) {
	const labels = useQueryReportLabels()
	const [scopeOpen, setScopeOpen] = useState(true)
	const [subOpen, setSubOpen] = useState(false)
	const [axesOpen, setAxesOpen] = useState(false)
	const [mapOpen, setMapOpen] = useState(false)
	const [trlDefOpen, setTrlDefOpen] = useState(false)
	const [mapFilter, setMapFilter] = useState<Set<QueryClassification>>(
		new Set(),
	)
	const toggleFilter = (k: QueryClassification) =>
		setMapFilter((prev) => {
			const next = new Set(prev)
			if (next.has(k)) next.delete(k)
			else next.add(k)
			return next
		})
	const hasActiveFilter = mapFilter.size > 0
	const classificationLabels: Record<QueryClassification, string> = {
		A: labels.section05.commercialized,
		B: labels.section05.demonstrated,
		C: labels.section05.basicResearch,
		D: labels.section05.blank,
		E: labels.section05.notViable,
	}

	// Classification tally
	const tally: Record<QueryClassification, number> = {
		A: 0,
		B: 0,
		C: 0,
		D: 0,
		E: 0,
	}
	data.principleMap.combinations.forEach((c) => {
		tally[c.classification]++
	})

	return (
		<section id="query-s05" className="scroll-mt-2">
			<QuerySectionHeader num="05" title={labels.section05.title} />

			{/* Scope declaration */}
			<details
				open={scopeOpen}
				onToggle={(e) => setScopeOpen((e.target as HTMLDetailsElement).open)}
				className="bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden"
			>
				<summary className="cursor-pointer px-4 py-3 text-[13px] font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
					<span>{labels.section05.scope}</span>
					<ChevronDown
						className={`w-4 h-4 text-gray-400 transition-transform ${scopeOpen ? "rotate-180" : ""}`}
					/>
				</summary>
				<div className="px-4 py-3 border-t border-gray-100 space-y-3">
					<div
						className={`grid gap-2 ${isExpanded ? "grid-cols-2" : "grid-cols-1"}`}
					>
						<div className="bg-gray-50 rounded p-3">
							<p className="font-mono text-[12px] uppercase tracking-widest text-gray-400 mb-1">
								{labels.section05.broadDef}
							</p>
							<p className="text-[14px] text-gray-700 leading-relaxed">
								{data.scopeDeclaration.broadDef}
							</p>
						</div>
						<div className="bg-gray-50 rounded p-3">
							<p className="font-mono text-[12px] uppercase tracking-widest text-gray-400 mb-1">
								{labels.section05.narrowDef}
							</p>
							<p className="text-[14px] text-gray-700 leading-relaxed">
								{data.scopeDeclaration.narrowDef}
							</p>
						</div>
					</div>
					<div className="bg-gray-50 rounded p-3">
						<p className="font-mono text-[12px] uppercase tracking-widest text-gray-400 mb-1">
							{labels.section05.adoptedScope}
						</p>
						<p className="text-[14px] text-gray-700 leading-relaxed">
							{data.scopeDeclaration.adoptedScope}
						</p>
					</div>
					{data.scopeDeclaration.excluded?.length > 0 && (
						<div>
							<p className="font-mono text-[12px] uppercase tracking-widest text-gray-400 mb-1.5">
								{labels.section05.excluded}
							</p>
							<ul className="space-y-1">
								{data.scopeDeclaration.excluded.map((x, i) => (
									<li
										key={i}
										className="text-[14px] text-gray-700 bg-gray-50 rounded px-3 py-2"
									>
										<span className="font-semibold">{x.name}</span>
										<span className="text-gray-500"> — {x.reason}</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</details>

			{/* Subprocesses */}
			<details
				open={printMode || subOpen}
				onToggle={(e) => setSubOpen((e.target as HTMLDetailsElement).open)}
				className="bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden"
			>
				<summary className="cursor-pointer px-4 py-3 text-[13px] font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
					<span>{labels.section05.mechanismAndSubprocess}</span>
					<ChevronDown
						className={`w-4 h-4 text-gray-400 transition-transform ${printMode || subOpen ? "rotate-180" : ""}`}
					/>
				</summary>
				<div className="px-4 py-3 border-t border-gray-100 space-y-2">
					<div className="bg-blue-50 border border-blue-100 text-gray-900 rounded p-3 mb-2">
						<p className="font-mono text-[12px] uppercase tracking-widest text-blue-600 mb-1">
							{labels.section05.centralMechanism}
						</p>
						<p className="text-[14px] leading-relaxed">
							{data.subprocesses.centralMechanism}
						</p>
					</div>
					{data.subprocesses.items.map((item, i) => (
						<div
							key={i}
							className="bg-gray-50 rounded border border-gray-200 p-3"
						>
							<div className="flex items-center gap-2 mb-1">
								<span className="font-mono text-[10px] text-blue-600 font-bold">
									{String(i + 1).padStart(2, "0")}
								</span>
								<p className="text-[12px] font-bold text-gray-900">
									{item.name}
								</p>
								<span
									className={`font-mono text-[9px] px-1.5 py-0.5 rounded ml-auto ${
										item.isEssential
											? "bg-emerald-100 text-emerald-700"
											: "bg-gray-200 text-gray-600"
									}`}
								>
									{item.isEssential
										? labels.section05.required
										: labels.section05.optional}
								</span>
							</div>
							<p className="text-[14px] text-gray-600 leading-relaxed mb-1.5">
								{item.description}
							</p>
							<div className="flex flex-wrap gap-1">
								{item.keyVariables.map((v, j) => (
									<span
										key={j}
										className="font-mono text-[12px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded"
									>
										{v}
									</span>
								))}
							</div>
						</div>
					))}
					{data.subprocesses.sufficiencyNote && (
						<p className="text-[12px] text-gray-500 italic leading-relaxed">
							{data.subprocesses.sufficiencyNote}
						</p>
					)}
				</div>
			</details>

			{/* Principle axes */}
			<details
				open={printMode || axesOpen}
				onToggle={(e) => setAxesOpen((e.target as HTMLDetailsElement).open)}
				className="bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden"
			>
				<summary className="cursor-pointer px-4 py-3 text-[13px] font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
					<span>{labels.section05.principleAxes}</span>
					<ChevronDown
						className={`w-4 h-4 text-gray-400 transition-transform ${printMode || axesOpen ? "rotate-180" : ""}`}
					/>
				</summary>
				<div className="px-4 py-3 border-t border-gray-100 space-y-2">
					<div
						className={`grid gap-2 ${isExpanded ? "grid-cols-3" : "grid-cols-1"}`}
					>
						{data.principleAxes.map((axis) => (
							<div
								key={axis.axisId}
								className="bg-white border border-gray-200 rounded p-3"
							>
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono text-[10px] text-blue-600 font-bold">
										{axis.axisId}
									</span>
									<p className="text-[12px] font-bold text-gray-900">
										{axis.name}
									</p>
								</div>
								<p className="font-mono text-[12px] uppercase tracking-widest text-gray-400 mb-0.5">
									{labels.section05.linkedSubprocess}
								</p>
								<p className="text-[14px] text-gray-600 mb-1.5">
									{axis.linkedSubprocess}
								</p>
								<div className="flex flex-wrap gap-1 mb-1.5">
									{axis.values.map((v, i) => (
										<span
											key={i}
											className="text-[11px] bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded"
										>
											{v}
										</span>
									))}
								</div>
								<p className="text-[12px] text-gray-700 leading-relaxed bg-gray-50 rounded px-3 py-2 mt-2">
									{axis.independenceNote}
								</p>
							</div>
						))}
					</div>
				</div>
			</details>

			{/* Principle map (combinations) */}
			<details
				open={printMode || mapOpen}
				onToggle={(e) => setMapOpen((e.target as HTMLDetailsElement).open)}
				className="bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden"
			>
				<summary className="cursor-pointer px-4 py-3 text-[13px] font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
					<span>
						{labels.section05.principleMap}（
						{data.principleMap.totalCombinations}{" "}
						{labels.section05.combinations}）
					</span>
					<ChevronDown
						className={`w-4 h-4 text-gray-400 transition-transform ${printMode || mapOpen ? "rotate-180" : ""}`}
					/>
				</summary>
				<div className="px-4 py-3 border-t border-gray-100">
					<p className="text-[12px] text-gray-500 mb-2 font-mono">
						{data.principleMap.axesSummary}
					</p>
					{/* Tally legend — clickable filter group */}
					<div className="flex flex-wrap gap-1.5 mb-3">
						{(["A", "B", "C", "D", "E"] as QueryClassification[]).map((k) => {
							const s = CLS_STYLES[k]
							const isActive = mapFilter.has(k)
							return (
								<button
									key={k}
									type="button"
									onClick={() => toggleFilter(k)}
									aria-pressed={isActive}
									className={`text-[12px] px-2.5 py-1 rounded border transition ${s.bg} ${s.text} ${s.border} ${
										hasActiveFilter && !isActive
											? "opacity-40 hover:opacity-80"
											: "hover:brightness-95"
									}`}
								>
									{classificationLabels[k]} × {tally[k]}
								</button>
							)
						})}
					</div>
					{/* Combinations — revealed by the selected classifications */}
					{printMode || hasActiveFilter ? (
						<div
							className={`grid gap-1.5 ${isExpanded ? "grid-cols-2" : "grid-cols-1"}`}
						>
							{data.principleMap.combinations
								.filter(
									(c) =>
										printMode ||
										!hasActiveFilter ||
										mapFilter.has(c.classification),
								)
								.map((c) => {
									const s = CLS_STYLES[c.classification]
									return (
										<div
											key={c.id}
											className={`flex items-start gap-2 p-2 rounded border ${s.border} ${s.bg}`}
										>
											<span
												className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${s.bg} ${s.text} border ${s.border}`}
											>
												{c.id}・{c.classification}
											</span>
											<div className="min-w-0">
												<p className="text-[12px] font-semibold text-gray-900 leading-snug">
													{c.methodName}
												</p>
												<p className="text-[14px] text-gray-600 leading-snug mt-0.5">
													{c.classificationNote}
												</p>
											</div>
										</div>
									)
								})}
						</div>
					) : (
						<p className="text-[12px] text-gray-400 italic py-2">
							{labels.section05.selectBadge}
						</p>
					)}
				</div>
			</details>

			{/* TRL definitions */}
			<details
				open={printMode || trlDefOpen}
				onToggle={(e) => setTrlDefOpen((e.target as HTMLDetailsElement).open)}
				className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden"
			>
				<summary className="cursor-pointer px-4 py-3 text-[13px] font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
					<span>{labels.section05.trlDefs}</span>
					<ChevronDown
						className={`w-4 h-4 text-gray-400 transition-transform ${printMode || trlDefOpen ? "rotate-180" : ""}`}
					/>
				</summary>
				<div className="px-4 py-3 border-t border-gray-100 space-y-2.5">
					{data.trlDefs.map((d) => (
						<div
							key={d.level}
							className="flex items-baseline gap-2 text-[12px] text-gray-700"
						>
							<span
								className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded w-12 text-center shrink-0 ${TRL_COLOR_PILL[trlBand(d.level)]}`}
							>
								TRL {d.level}
							</span>
							<span className="font-semibold">{d.title}</span>
							<span className="text-gray-500">— {d.desc}</span>
						</div>
					))}
				</div>
			</details>

			{/* TRL intro + technology cards */}
			{data.trlIntro && (
				<p className="text-[14px] text-gray-700 leading-relaxed mb-3">
					{data.trlIntro}
				</p>
			)}
			<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
				{labels.section05.trlAssessment}
			</p>
			<div
				className={`grid gap-3 mb-2 ${isExpanded ? "grid-cols-2" : "grid-cols-1"}`}
			>
				{data.technologies.map((tech, i) => (
					<TechCard
						key={i}
						tech={tech}
						principleMapRefLabel={labels.section05.principleMapRef}
					/>
				))}
			</div>

			<QuerySources sources={data.sources} />
		</section>
	)
}
