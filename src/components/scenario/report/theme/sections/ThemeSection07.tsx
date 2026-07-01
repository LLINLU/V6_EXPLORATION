"use client"

import { ChevronUp } from "lucide-react"
import { useState } from "react"
import type {
	ThemePaper,
	ThemeS07,
	ThemeTechnology,
} from "@/types/theme-report"
import { THEME_TRL_DEFS } from "../constants"
import { ThemeMemlabBadges } from "../ThemeMemlabBadges"
import { ThemeSectionHeader } from "../ThemeSectionHeader"

function getTrlBandColor(avg: number) {
	if (avg >= 6.0) return { text: "text-emerald-500", bar: "bg-emerald-400" }
	if (avg >= 4.0) return { text: "text-blue-500", bar: "bg-blue-400" }
	return { text: "text-amber-500", bar: "bg-amber-400" }
}

function TrlMiniHistogram({
	dist,
	barColor,
}: {
	dist: number[]
	barColor: string
}) {
	const max = Math.max(...dist, 1)
	return (
		<div className="flex items-end gap-0.5 h-8 w-full">
			{dist.map((v, i) => (
				<div
					key={i}
					className={`flex-1 ${barColor} rounded-sm min-h-[2px]`}
					style={{ height: `${(v / max) * 100}%` }}
				/>
			))}
		</div>
	)
}

function PaperItem({ paper }: { paper: ThemePaper }) {
	return (
		<li className="bg-gray-50 rounded-md px-4 py-3">
			<div className="flex items-baseline gap-2 mb-0.5">
				<span className="font-mono text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded shrink-0">
					{paper.year}
				</span>
				<a
					href={paper.url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-[13px] font-semibold text-gray-900 leading-snug hover:text-blue-700 transition-colors"
				>
					{paper.title}
					<svg
						className="inline-block w-2.5 h-2.5 ml-1 align-middle text-blue-600"
						viewBox="0 0 12 12"
						fill="none"
					>
						<path
							d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5"
							stroke="currentColor"
							strokeWidth="1.2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</a>
			</div>
			{paper.authors && (
				<p className="text-[12px] text-gray-500 leading-snug">
					{paper.authors}
				</p>
			)}
			{paper.journal && (
				<p className="text-[12px] text-gray-500 italic leading-snug">
					{paper.journal}
				</p>
			)}
			{paper.summary && (
				<p className="text-[13px] text-gray-600 leading-relaxed mt-1">
					{paper.summary}
				</p>
			)}
		</li>
	)
}

function PaperGroup({ label, items }: { label: string; items: ThemePaper[] }) {
	if (!items?.length) return null
	return (
		<div className="mt-3">
			<p className="text-[12px] font-mono text-gray-900 mb-1.5">{label}</p>
			<ul className="space-y-1.5">
				{items.map((p, i) => (
					<PaperItem key={i} paper={p} />
				))}
			</ul>
		</div>
	)
}

function TechCard({
	tech,
	index,
	printMode = false,
	labels,
}: {
	tech: ThemeTechnology
	index: number
	printMode?: boolean
	labels: ThemeSection07Labels
}) {
	const [showLit, setShowLit] = useState(printMode || index === 0)
	const band = getTrlBandColor(tech.trlAvg)
	const hasLiterature =
		(tech.reviewPapers?.length ?? 0) > 0 ||
		(tech.keyPapers?.length ?? 0) > 0 ||
		(tech.patents?.length ?? 0) > 0

	const toggle = () => setShowLit((v) => !v)

	return (
		<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
			<div
				data-tech-toggle=""
				onClick={hasLiterature ? toggle : undefined}
				onKeyDown={
					hasLiterature
						? (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault()
									toggle()
								}
							}
						: undefined
				}
				role={hasLiterature ? "button" : undefined}
				tabIndex={hasLiterature ? 0 : undefined}
				aria-expanded={hasLiterature ? showLit : undefined}
				aria-label={
					hasLiterature
						? showLit
							? labels.collapseLiterature
							: labels.showLiterature
						: undefined
				}
				className={`px-5 py-4 ${hasLiterature ? "cursor-pointer hover:bg-gray-50/50 transition-colors focus:outline-none focus-visible:bg-gray-50/50" : ""}`}
			>
				{/* Header: CORE TECH 0N label + chevron toggle on the same row */}
				<div className="flex items-center justify-between mb-2">
					<p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
						CORE TECH {String(index + 1).padStart(2, "0")}
					</p>
					{hasLiterature && (
						<ChevronUp
							className={`w-4 h-4 text-gray-400 transition-transform ${showLit ? "" : "rotate-180"}`}
							strokeWidth={2}
						/>
					)}
				</div>

				<div className="grid gap-4 grid-cols-1 sm:grid-cols-[7fr_3fr]">
					<div className="min-w-0">
						<p className="text-[16px] font-bold text-gray-900 leading-snug mb-0.5">
							{tech.name}
						</p>
						<p className="font-mono text-[11px] text-gray-400 mb-2">
							{tech.nameEn}
						</p>
						<p className="text-[14px] text-gray-600 leading-relaxed">
							{tech.desc}
						</p>
					</div>

					<div className="flex flex-col">
						<div className="flex items-baseline justify-end gap-1 mb-1.5">
							<span
								className={`text-[28px] font-bold leading-none ${band.text}`}
							>
								{tech.trlAvg.toFixed(1)}
							</span>
							<span className="font-mono text-[11px] text-gray-400">
								±{tech.trlSd.toFixed(1)}
							</span>
						</div>
						<TrlMiniHistogram dist={tech.trlDist} barColor={band.bar} />
					</div>
				</div>
			</div>

			{hasLiterature && showLit && (
				<div
					data-tech-lit=""
					className="px-5 pb-4 pt-3 border-t border-gray-100"
				>
					<PaperGroup label={labels.reviewPapers} items={tech.reviewPapers} />
					<PaperGroup label={labels.keyPapers} items={tech.keyPapers} />
					<PaperGroup label={labels.patents} items={tech.patents} />
				</div>
			)}
		</div>
	)
}

const TRL_BAND_COLORS = [
	{
		color: "bg-[rgba(91,225,180,1)] border border-[rgba(59,222,138,1)]",
	},
	{
		color:
			"bg-[rgba(114,167,253,1)] border-[0.5px] border-transparent [border-image:none]",
	},
	{
		color:
			"bg-[rgba(255,201,107,1)] border-[0.5px] border-transparent [border-image:none]",
	},
] as const

type ThemeSection07Labels = {
	collapseLiterature: string
	showLiterature: string
	reviewPapers: string
	keyPapers: string
	patents: string
	trlDefinition: string
	level: string
	title: string
	definition: string
	bands: string[]
}

function TrlBandDots({ labels }: { labels: ThemeSection07Labels }) {
	return (
		<div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono">
			{TRL_BAND_COLORS.map((b, index) => (
				<span key={labels.bands[index]} className="flex items-center gap-1.5">
					<span className={`w-1.5 h-1.5 rounded-full ${b.color}`} />
					<span className="text-gray-500 normal-case tracking-normal">
						{labels.bands[index]}
					</span>
				</span>
			))}
		</div>
	)
}

function TrlDefinitionsCard({
	printMode = false,
	labels,
}: {
	printMode?: boolean
	labels: ThemeSection07Labels
}) {
	const [expanded, setExpanded] = useState(printMode)
	return (
		<div className="rounded-lg border border-gray-200 overflow-hidden mb-5">
			<button
				data-trl-toggle=""
				onClick={() => setExpanded(!expanded)}
				className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
			>
				<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
					<span className="font-mono text-[10px] text-gray-500 normal-case tracking-normal">
						{labels.trlDefinition}
					</span>
					<div className="flex items-center gap-3">
						<TrlBandDots labels={labels} />
						<svg
							className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${expanded ? "" : "rotate-180"}`}
							viewBox="0 0 12 12"
							fill="none"
						>
							<path
								d="M3 8l3-3 3 3"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
				</div>
			</button>
			{expanded && (
				<div className="border-t border-gray-200">
					<div className="grid grid-cols-[80px_minmax(0,1fr)_minmax(0,2.2fr)] bg-blue-50/60">
						<div className="px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
							{labels.level}
						</div>
						<div className="px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
							{labels.title}
						</div>
						<div className="px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
							{labels.definition}
						</div>
					</div>
					{THEME_TRL_DEFS.map((def, i) => (
						<div
							key={def.level}
							className={`grid grid-cols-[80px_minmax(0,1fr)_minmax(0,2.2fr)] ${i % 2 === 1 ? "bg-gray-50" : "bg-white"}`}
						>
							<div className="px-3 py-2 font-mono text-[12px] font-bold text-blue-600">
								TRL {def.level}
							</div>
							<div className="px-3 py-2 text-[13px] text-gray-800 font-medium">
								{def.title}
							</div>
							<div className="px-3 py-2 text-[13px] text-gray-600 leading-relaxed">
								{def.desc}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export function ThemeSection07({
	data,
	isExpanded: _isExpanded = false,
	printMode = false,
	title,
	labels,
}: {
	data: ThemeS07
	isExpanded?: boolean
	printMode?: boolean
	title: string
	labels: ThemeSection07Labels
}) {
	return (
		<section id="theme-s07" className="scroll-mt-2">
			<ThemeSectionHeader num="07" title={title} />
			<ThemeMemlabBadges sources={data.sources} />

			{data.intro && (
				<p className="text-[14px] text-gray-700 leading-relaxed mb-4">
					{data.intro}
				</p>
			)}

			<TrlDefinitionsCard printMode={printMode} labels={labels} />

			<div className="grid gap-3 mb-4 grid-cols-1">
				{data.technologies.map((tech, i) => (
					<TechCard
						key={i}
						tech={tech}
						index={i}
						printMode={printMode}
						labels={labels}
					/>
				))}
			</div>
		</section>
	)
}
