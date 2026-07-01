"use client"

import { useState } from "react"
import type { ThemeS08 } from "@/types/theme-report"
import { ReportTabs } from "../../primitives"
import { ThemeMemlabBadges } from "../ThemeMemlabBadges"
import { ThemeSectionHeader } from "../ThemeSectionHeader"

type PlayerKey = "competitors" | "collaborators" | "researchers"

type ThemeSection08Labels = {
	tabs: Record<PlayerKey, string>
	tableHeaders: Record<PlayerKey, readonly string[]>
}

function PlayerTable({
	headers,
	rows,
}: {
	headers: readonly string[]
	rows: string[][]
}) {
	return (
		<div className="rounded-lg border border-gray-200 overflow-hidden">
			<table className="w-full">
				<thead>
					<tr className="bg-gray-50 border-b border-gray-200">
						{headers.map((h, i) => (
							<th
								key={i}
								className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium"
							>
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, ri) => (
						<tr key={ri} className={ri % 2 === 1 ? "bg-gray-50" : "bg-white"}>
							{row.map((cell, ci) => (
								<td
									key={ci}
									className={`px-3 py-2.5 align-top text-[14px] leading-relaxed ${ci === 0 ? "font-semibold text-gray-900" : "text-gray-600"} ${ci === row.length - 1 ? "text-gray-500" : ""}`}
								>
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export function ThemeSection08({
	data,
	isExpanded: _isExpanded = false,
	printMode = false,
	title,
	labels,
}: {
	data: ThemeS08
	isExpanded?: boolean
	printMode?: boolean
	title: string
	labels: ThemeSection08Labels
}) {
	const [activeTab, setActiveTab] = useState<PlayerKey>("competitors")

	const rowMap: Record<PlayerKey, string[][]> = {
		competitors: data.competitors.rows,
		collaborators: data.collaborators.rows,
		researchers: data.researchers.rows,
	}

	const tabs = [
		{
			key: "competitors" as const,
			label: labels.tabs.competitors,
			count: rowMap.competitors.length,
		},
		{
			key: "collaborators" as const,
			label: labels.tabs.collaborators,
			count: rowMap.collaborators.length,
		},
		{
			key: "researchers" as const,
			label: labels.tabs.researchers,
			count: rowMap.researchers.length,
		},
	]

	if (printMode) {
		return (
			<section id="theme-s08" className="scroll-mt-2">
				<ThemeSectionHeader num="08" title={title} />
				<ThemeMemlabBadges sources={data.sources} />
				<div data-section08-tabs="">
					{tabs.map((tab) => (
						<div
							key={tab.key}
							data-player-section={tab.key}
							data-player-label={tab.label}
							className="mb-6"
						>
							<p
								data-player-heading=""
								className="font-mono text-[11px] text-gray-400 uppercase tracking-widest mb-2"
							>
								{tab.label}
							</p>
							<PlayerTable
								headers={labels.tableHeaders[tab.key]}
								rows={rowMap[tab.key]}
							/>
						</div>
					))}
				</div>
			</section>
		)
	}

	return (
		<section id="theme-s08" className="scroll-mt-2">
			<ThemeSectionHeader num="08" title={title} />
			<ThemeMemlabBadges sources={data.sources} />

			<ReportTabs
				tabs={tabs}
				activeKey={activeTab}
				onChange={setActiveTab}
				className="mb-3"
			/>

			<PlayerTable
				headers={labels.tableHeaders[activeTab]}
				rows={rowMap[activeTab]}
			/>
		</section>
	)
}
