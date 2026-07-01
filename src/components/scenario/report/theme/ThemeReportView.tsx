"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ThemeReportData } from "@/types/theme-report"
import { ThemeSection01 } from "./sections/ThemeSection01"
import { ThemeSection02 } from "./sections/ThemeSection02"
import { ThemeSection03 } from "./sections/ThemeSection03"
import { ThemeSection04 } from "./sections/ThemeSection04"
import { ThemeSection05 } from "./sections/ThemeSection05"
import { ThemeSection06 } from "./sections/ThemeSection06"
import { ThemeSection07 } from "./sections/ThemeSection07"
import { ThemeSection08 } from "./sections/ThemeSection08"
import { useThemeReportLabels } from "./themeReportLabels"

function ReadingGuide({
	labels,
}: {
	labels: ReturnType<typeof useThemeReportLabels>
}) {
	return (
		<div
			data-print-hide
			className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3"
		>
			<p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
				{labels.readingGuide}
			</p>
			{labels.guideGroups.map((g) => (
				<div key={g.label} className="bg-gray-50 rounded-md p-3">
					<p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-1">
						{g.label}
					</p>
					<p className="text-[13px] text-gray-600 leading-relaxed">{g.text}</p>
				</div>
			))}
		</div>
	)
}

interface ThemeReportViewProps {
	data: ThemeReportData
	isExpanded?: boolean
	printMode?: boolean
}

function useActiveSection(sectionIds: string[]) {
	const [activeId, setActiveId] = useState<string>(sectionIds[0] ?? "")
	useEffect(() => {
		const observers: IntersectionObserver[] = []
		sectionIds.forEach((id) => {
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
	}, [sectionIds])
	return activeId
}

function scrollTo(id: string) {
	document
		.getElementById(id)
		?.scrollIntoView({ behavior: "smooth", block: "start" })
}

// ── Panel TOC: vertical numbered list, auto-collapses on scroll ──────────────
function PanelToc({
	activeId,
	labels,
}: {
	activeId: string
	labels: ReturnType<typeof useThemeReportLabels>
}) {
	const [collapsed, setCollapsed] = useState(false)
	const [manuallyExpanded, setManuallyExpanded] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const getScrollParent = (el: HTMLElement | null): HTMLElement | Window => {
			if (!el) return window
			const { overflow, overflowY } = window.getComputedStyle(el)
			if (/(auto|scroll)/.test(overflow + overflowY)) return el
			return getScrollParent(el.parentElement)
		}
		const scrollParent = getScrollParent(ref.current?.parentElement ?? null)

		const onScroll = () => {
			const s01 = document.getElementById("theme-s01")
			if (!s01) return
			const containerTop =
				scrollParent === window
					? 0
					: (scrollParent as HTMLElement).getBoundingClientRect().top
			const s01Top = s01.getBoundingClientRect().top
			const reachedS01 = s01Top <= containerTop + 8

			if (reachedS01) {
				if (!manuallyExpanded) setCollapsed(true)
			} else {
				setCollapsed(false)
				setManuallyExpanded(false)
			}
		}

		scrollParent.addEventListener("scroll", onScroll, { passive: true })
		return () => scrollParent.removeEventListener("scroll", onScroll)
	}, [manuallyExpanded])

	const toggle = () => {
		if (collapsed) {
			setCollapsed(false)
			setManuallyExpanded(true)
		} else {
			setCollapsed(true)
			setManuallyExpanded(false)
		}
	}

	return (
		<div data-print-hide ref={ref} className="sticky top-0 z-10 mb-5">
			{collapsed ? (
				<button
					onClick={toggle}
					className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors"
				>
					<span className="font-mono text-[12px] text-gray-400 uppercase tracking-widest">
						{labels.contents}
					</span>
					<svg
						className="w-3.5 h-3.5 text-gray-400"
						viewBox="0 0 16 16"
						fill="none"
					>
						<path
							d="M4 6l4 4 4-4"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
			) : (
				<div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
					<div className="flex items-center justify-between mb-2.5">
						<p className="font-mono text-[12px] text-gray-400 uppercase tracking-widest">
							{labels.contents}
						</p>
						<button
							onClick={toggle}
							className="text-gray-400 hover:text-gray-600 transition-colors"
						>
							<svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
								<path
									d="M4 10l4-4 4 4"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>
					</div>
					<ol className="space-y-1">
						{labels.sections.map((s, i) => {
							const isActive = activeId === s.id
							return (
								<li key={s.id}>
									<button
										data-section-id={s.id}
										onClick={() => scrollTo(s.id)}
										className={`w-full text-sm text-left flex items-baseline gap-2 py-0.5 transition-colors group ${
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
											className={`text-[14px] leading-snug ${isActive ? "font-semibold" : "group-hover:underline underline-offset-2"}`}
										>
											{s.labelFull}
										</span>
									</button>
								</li>
							)
						})}
					</ol>
				</div>
			)}
		</div>
	)
}

// ── Full-screen TOC: Substack-style sticky left nav ──────────────────────────
function FullscreenToc({
	activeId,
	labels,
}: {
	activeId: string
	labels: ReturnType<typeof useThemeReportLabels>
}) {
	return (
		<div data-print-hide className="sticky top-8 self-start shrink-0 w-44">
			<p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-3 pl-3">
				{labels.contents}
			</p>
			<nav className="space-y-0.5">
				{labels.sections.map((s) => {
					const isActive = activeId === s.id
					return (
						<button
							key={s.id}
							data-section-id={s.id}
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

// ── Main view ─────────────────────────────────────────────────────────────────
export function ThemeReportView({
	data,
	isExpanded = false,
	printMode = false,
}: ThemeReportViewProps) {
	const labels = useThemeReportLabels()
	const sectionIds = useMemo(
		() => labels.sections.map((section) => section.id),
		[labels.sections],
	)
	const activeId = useActiveSection(sectionIds)

	const sections = (
		<div className="space-y-8">
			{!printMode && <ReadingGuide labels={labels} />}
			<ThemeSection01
				data={data.s01}
				isExpanded={isExpanded}
				title={labels.sections[0].labelFull}
			/>
			<div className="border-t border-gray-100" />
			<ThemeSection02
				data={data.s02}
				isExpanded={isExpanded}
				title={labels.sections[1].labelFull}
				labels={labels.s02}
			/>
			<div className="border-t border-gray-100" />
			<ThemeSection03
				data={data.s03}
				isExpanded={isExpanded}
				title={labels.sections[2].labelFull}
				labels={labels.s03}
			/>
			<div className="border-t border-gray-100" />
			<ThemeSection04
				data={data.s04}
				isExpanded={isExpanded}
				title={labels.sections[3].labelFull}
			/>
			<div className="border-t border-gray-100" />
			<ThemeSection05
				data={data.s05}
				isExpanded={isExpanded}
				title={labels.sections[4].labelFull}
				labels={labels.s05}
			/>
			<div className="border-t border-gray-100" />
			<ThemeSection06
				data={data.s06}
				isExpanded={isExpanded}
				title={labels.sections[5].labelFull}
				labels={labels.s06}
			/>
			<div className="border-t border-gray-100" />
			<ThemeSection07
				data={data.s07}
				isExpanded={isExpanded}
				printMode={printMode}
				title={labels.sections[6].labelFull}
				labels={labels.s07}
			/>
			<div className="border-t border-gray-100" />
			<ThemeSection08
				data={data.s08}
				isExpanded={isExpanded}
				printMode={printMode}
				title={labels.sections[7].labelFull}
				labels={labels.s08}
			/>
			<div className="h-8" />
		</div>
	)

	return (
		<div className="min-h-0">
			{isExpanded ? (
				/* ── Full-screen: Substack-style layout ── */
				<div className="flex items-start">
					{/* Left sticky TOC */}
					{!printMode && <FullscreenToc activeId={activeId} labels={labels} />}

					{/* Centered content column ~70% */}
					<div className="flex-1 min-w-0">
						<div className="max-w-[680px] xl:max-w-[820px] 2xl:max-w-[960px] mx-auto">
							{/* Hero */}
							<div className="pt-8 pb-6 mb-6 border-b border-gray-100">
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

							{sections}
						</div>
					</div>
				</div>
			) : (
				/* ── Side panel: stacked layout ── */
				<>
					{/* Hero */}
					<div className="px-1 pt-1 pb-4 mb-4 border-b border-gray-100">
						<h1 className="text-base font-bold text-gray-900 leading-snug mb-2">
							{data.theme}
						</h1>
						<p className="text-[14px] text-black mb-3 [font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif]">
							{data.scenario}
						</p>
						<p className="text-[14px] text-gray-500 leading-relaxed border-l-4 border-blue-200 pl-4">
							{data.summary}
						</p>
					</div>

					<PanelToc activeId={activeId} labels={labels} />
					{sections}
				</>
			)}
		</div>
	)
}
