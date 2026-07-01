"use client"

import { useEffect, useState } from "react"
import type { QueryReportData } from "@/types/query-report"
import { useQueryReportLabels } from "./queryReportLabels"
import { QuerySection01 } from "./sections/QuerySection01"
import { QuerySection02 } from "./sections/QuerySection02"
import { QuerySection03 } from "./sections/QuerySection03"
import { QuerySection04 } from "./sections/QuerySection04"
import { QuerySection05 } from "./sections/QuerySection05"
import { QuerySection06 } from "./sections/QuerySection06"
import { QuerySection07 } from "./sections/QuerySection07"

type QueryReportSectionLabel = ReturnType<
	typeof useQueryReportLabels
>["sections"][number]

function useActiveSection(sections: QueryReportSectionLabel[]) {
	const [activeId, setActiveId] = useState<string>(sections[0].id)
	useEffect(() => {
		const observers: IntersectionObserver[] = []
		sections.forEach(({ id }) => {
			const el = document.getElementById(id)
			if (!el) return
			const obs = new IntersectionObserver(
				([entry]) => {
					if (entry.isIntersecting) setActiveId(id)
				},
				{ rootMargin: "-10% 0px -75% 0px", threshold: 0 },
			)
			obs.observe(el)
			observers.push(obs)
		})
		return () => observers.forEach((o) => o.disconnect())
	}, [sections])
	return activeId
}

function scrollTo(id: string) {
	document
		.getElementById(id)
		?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function FullscreenToc({
	activeId,
	sections,
}: {
	activeId: string
	sections: QueryReportSectionLabel[]
}) {
	return (
		<div className="sticky top-8 self-start shrink-0 w-44">
			<p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-3 pl-3">
				Contents
			</p>
			<nav className="space-y-0.5">
				{sections.map((s) => {
					const isActive = activeId === s.id
					return (
						<button
							key={s.id}
							type="button"
							onClick={() => scrollTo(s.id)}
							className={`w-full text-left py-1.5 pl-3 border-l-2 transition-all ${
								isActive
									? "border-blue-500 text-gray-900"
									: "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							<span
								className={`text-[13px] leading-snug block ${isActive ? "font-medium" : ""}`}
							>
								{s.labelFull}
							</span>
						</button>
					)
				})}
			</nav>
		</div>
	)
}

function PanelToc({
	activeId,
	sections,
	title,
}: {
	activeId: string
	sections: QueryReportSectionLabel[]
	title: string
}) {
	return (
		<div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-5">
			<p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-2.5">
				{title}
			</p>
			<ol className="space-y-1">
				{sections.map((s, i) => {
					const isActive = activeId === s.id
					return (
						<li key={s.id}>
							<button
								type="button"
								onClick={() => scrollTo(s.id)}
								className={`w-full text-sm text-left flex items-baseline gap-2 py-0.5 transition-colors ${
									isActive
										? "text-blue-600"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								<span
									className={`font-mono text-[10px] shrink-0 tabular-nums ${isActive ? "text-blue-500 font-bold" : "text-gray-400"}`}
								>
									{i + 1}.
								</span>
								<span
									className={`text-[14px] leading-snug ${isActive ? "font-semibold" : ""}`}
								>
									{s.labelFull}
								</span>
							</button>
						</li>
					)
				})}
			</ol>
		</div>
	)
}

function PrintToc({
	sections,
	title,
}: {
	sections: QueryReportSectionLabel[]
	title: string
}) {
	return (
		<div className="query-report-print-toc bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 mb-8">
			<p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-3">
				{title}
			</p>
			<ol className="grid grid-cols-2 gap-x-6 gap-y-2">
				{sections.map((s) => (
					<li key={s.id}>
						<a
							href={`#${s.id}`}
							className="flex items-baseline gap-2 text-gray-700 hover:text-blue-600"
						>
							<span className="font-mono text-[10px] text-blue-500 shrink-0 tabular-nums">
								{s.num}
							</span>
							<span className="text-[13px] leading-snug">{s.labelFull}</span>
						</a>
					</li>
				))}
			</ol>
		</div>
	)
}

function ReadingGuide({ title, body }: { title: string; body: string }) {
	return (
		<div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
			<p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-2">
				{title}
			</p>
			<p className="text-[13px] text-gray-600 leading-relaxed">{body}</p>
		</div>
	)
}

interface QueryReportViewProps {
	data: QueryReportData
	isExpanded?: boolean
	printMode?: boolean
}

export function QueryReportView({
	data,
	isExpanded = false,
	printMode = false,
}: QueryReportViewProps) {
	const labels = useQueryReportLabels()
	const activeId = useActiveSection(labels.sections)

	const sections = (
		<div className="space-y-8">
			{!printMode && (
				<ReadingGuide
					title={labels.readingGuideTitle}
					body={labels.readingGuide}
				/>
			)}
			<QuerySection01 data={data.s01} isExpanded={isExpanded} />
			<div className="border-t border-gray-100" />
			<QuerySection02 data={data.s02} isExpanded={isExpanded} />
			<div className="border-t border-gray-100" />
			<QuerySection03 data={data.s03} isExpanded={isExpanded} />
			<div className="border-t border-gray-100" />
			<QuerySection04 data={data.s04} isExpanded={isExpanded} />
			<div className="border-t border-gray-100" />
			<QuerySection05
				data={data.s05}
				isExpanded={isExpanded}
				printMode={printMode}
			/>
			<div className="border-t border-gray-100" />
			<QuerySection06 data={data.s06} isExpanded={isExpanded} />
			<div className="border-t border-gray-100" />
			<QuerySection07 data={data.s07} />
			<div className="h-8" />
		</div>
	)

	return (
		<div className="min-h-0">
			{isExpanded ? (
				<div className="flex items-start gap-6">
					{!printMode && (
						<FullscreenToc activeId={activeId} sections={labels.sections} />
					)}
					<div className="flex-1 min-w-0">
						<div className="max-w-[680px] xl:max-w-[820px] 2xl:max-w-[960px] mx-auto">
							{/* Hero */}
							<div className="pt-8 pb-6 mb-6 border-b border-gray-100">
								<p className="font-mono text-[10px] uppercase tracking-widest text-blue-600 mb-2">
									{labels.queryReportTitle}
								</p>
								<h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
									{data.theme}
								</h1>
								<p className="text-[15px] text-gray-700 mb-3">
									{data.scenario}
								</p>
								<p className="text-[15px] text-gray-500 leading-relaxed border-l-4 border-blue-200 pl-4">
									{data.summary}
								</p>
							</div>
							{printMode && (
								<PrintToc sections={labels.sections} title={labels.toc} />
							)}
							{sections}
						</div>
					</div>
				</div>
			) : (
				<>
					<div className="px-1 pt-1 pb-4 mb-4 border-b border-gray-100">
						<p className="font-mono text-[10px] uppercase tracking-widest text-blue-600 mb-2">
							Query Report
						</p>
						<h1 className="text-base font-bold text-gray-900 leading-snug mb-2">
							{data.theme}
						</h1>
						<p className="text-[14px] text-black mb-3">{data.scenario}</p>
						<p className="text-[14px] text-gray-500 leading-relaxed border-l-4 border-blue-200 pl-4">
							{data.summary}
						</p>
					</div>
					<PanelToc
						activeId={activeId}
						sections={labels.sections}
						title={labels.toc}
					/>
					{sections}
				</>
			)}
		</div>
	)
}
