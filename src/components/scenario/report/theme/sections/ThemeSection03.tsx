"use client"

import { Info } from "lucide-react"
import { useState } from "react"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ThemeS03 } from "@/types/theme-report"
import { ThemeMemlabBadges } from "../ThemeMemlabBadges"
import { ThemeSectionHeader } from "../ThemeSectionHeader"

const DATA_TYPE_COLORS: Record<
	string,
	{ bg: string; text: string; dot: string }
> = {
	measured: {
		bg: "bg-emerald-50",
		text: "text-emerald-700",
		dot: "bg-emerald-500",
	},
	estimated: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
	assumed: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
}

function getDataTypeStyle(dataType: string) {
	const lower = dataType.toLowerCase()
	if (lower.includes("実測") || lower.includes("measured"))
		return DATA_TYPE_COLORS.measured
	if (lower.includes("推計") || lower.includes("estimated"))
		return DATA_TYPE_COLORS.estimated
	return DATA_TYPE_COLORS.assumed
}

/** Renders market values with unified purple color, smaller unit suffixes (B, 万, 兆), and de-emphasized parentheticals */
function MarketValue({
	value,
	className,
}: {
	value: string
	className?: string
}) {
	const parts = value.split(/(B|兆|万|（[^）]*）)/)
	return (
		<span className={`${className ?? ""} text-[#4f5fe0]`}>
			{parts.map((part, i) => {
				if (part === "B" || part === "兆" || part === "万") {
					return (
						<span
							key={i}
							className="text-[0.55em] font-semibold align-baseline ml-0.5 mr-0.5"
						>
							{part}
						</span>
					)
				}
				if (part.startsWith("（") && part.endsWith("）")) {
					return (
						<span
							key={i}
							className="text-[12px] font-normal text-gray-400 ml-1 align-middle"
						>
							{part}
						</span>
					)
				}
				return part
			})}
		</span>
	)
}

export function ThemeSection03({
	data,
	isExpanded = false,
	title,
	labels,
}: {
	data: ThemeS03
	isExpanded?: boolean
	title: string
	labels: {
		forecastComparison: string
		agency: string
		marketForecast: string
		forecastYear: string
		sam: string
		samCaveatAria: string
		measuredLegend: string
		estimatedLegend: string
		assumedLegend: string
		dataSource: string
		value: string
		note: string
	}
}) {
	const [openFactors, setOpenFactors] = useState<Set<number>>(
		() => new Set(data.samFactors.map((f) => f.id)),
	)

	return (
		<section id="theme-s03" className="scroll-mt-2">
			<ThemeSectionHeader num="03" title={title} />
			<ThemeMemlabBadges sources={data.sources} />

			{/* TAM cards (hero + sub-cards in one grid) */}
			<div
				className={`grid gap-3 mb-5 ${isExpanded ? "grid-cols-2" : "grid-cols-1"}`}
			>
				<div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2">
					<p className="text-[12px] text-gray-400 leading-snug">
						{data.tam.label}
					</p>
					<MarketValue
						value={data.tam.value}
						className="text-[18px] font-bold leading-none"
					/>
				</div>
				{data.tamCards?.map((c, i) => (
					<div
						key={i}
						className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2"
					>
						<p className="text-[12px] text-gray-400 leading-snug">{c.label}</p>
						<MarketValue
							value={c.value}
							className="text-[18px] font-bold leading-none"
						/>
					</div>
				))}
			</div>

			{/* Forecast table */}
			<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
				{labels.forecastComparison}
			</p>
			<div className="rounded-lg border border-gray-200 overflow-hidden mb-5">
				<table className="w-full">
					<thead>
						<tr className="bg-gray-50 border-b border-gray-200">
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
								{labels.agency}
							</th>
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium min-w-[160px]">
								{labels.marketForecast}
							</th>
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">
								{labels.forecastYear}
							</th>
							<th className="text-left px-3 py-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
								CAGR
							</th>
						</tr>
					</thead>
					<tbody>
						{data.forecasts.map((f, i) => (
							<tr key={i} className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}>
								<td className="px-3 py-2.5 align-top">
									<a
										href={f.reportUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="group text-[14px] font-semibold text-gray-900 hover:text-blue-600 transition-colors"
									>
										{f.org}
										<svg
											className="inline-block w-3 h-3 ml-1 align-middle text-blue-600 group-hover:text-blue-700 transition-colors"
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
									<p className="text-[12px] text-gray-400 mt-0.5">{f.sub}</p>
								</td>
								<td className="px-3 py-2.5 align-middle">
									<div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
										<div
											className="h-full bg-blue-500 rounded-full"
											style={{ width: `${f.pctFill}%` }}
										/>
									</div>
									<p className="text-[14px] text-gray-600">
										{f.current} → {f.future}
									</p>
								</td>
								<td className="px-3 py-2.5 align-middle text-[14px] text-gray-700 whitespace-nowrap">
									{f.year}
								</td>
								<td className="px-3 py-2.5 align-middle">
									<span className="text-[14px] text-gray-900">{f.cagr}</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* SAM */}
			<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
				{labels.sam}
			</p>
			<div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 flex flex-col gap-2">
				<p className="text-[12px] text-gray-400 leading-snug">
					{data.sam.label}
				</p>
				<MarketValue
					value={data.sam.value}
					className="text-[18px] font-bold leading-none"
				/>
				{data.sam.note && (
					<p className="text-[13px] text-gray-900">{data.sam.note}</p>
				)}
			</div>

			{/* SAM rationale */}
			<div className="px-4 py-2 mb-3">
				<p className="text-[14px] text-gray-600 leading-relaxed">
					{data.samRationale}
				</p>
			</div>

			{/* SAM Formula */}
			<div className="bg-blue-50 border border-blue-100 px-4 py-3 rounded-lg mb-3 flex items-center flex-wrap gap-x-2 gap-y-2 text-[14px] text-gray-800">
				<span className="flex items-center gap-1">
					<span className="font-semibold text-gray-900">SAM</span>
					{data.samCaveat && (
						<TooltipProvider delayDuration={150}>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										aria-label={labels.samCaveatAria}
										className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
									>
										<Info className="w-3.5 h-3.5" strokeWidth={2} />
									</button>
								</TooltipTrigger>
								<TooltipContent
									side="top"
									align="start"
									className="max-w-[260px] text-[12px] leading-relaxed whitespace-normal"
								>
									{data.samCaveat}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</span>
				<span className="text-gray-400">=</span>
				{data.samFactors.map((f, i) => (
					<span key={f.id} className="flex items-center gap-1.5">
						{i > 0 && <span className="text-gray-400 mr-1">×</span>}
						<span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-mono text-[11px] font-bold shrink-0">
							{f.id}
						</span>
						<span>{f.name}</span>
					</span>
				))}
			</div>

			{/* Data type legend */}
			<div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] font-mono mb-3">
				<span className="flex items-center gap-1.5">
					<span className="w-1.5 h-1.5 rounded-full bg-[rgba(91,225,180,1)] border border-[rgba(59,222,138,1)]" />
					<span className="text-gray-500">{labels.measuredLegend}</span>
				</span>
				<span className="flex items-center gap-1.5">
					<span className="w-1.5 h-1.5 rounded-full bg-[rgba(114,167,253,1)]" />
					<span className="text-gray-500">{labels.estimatedLegend}</span>
				</span>
				<span className="flex items-center gap-1.5">
					<span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,201,107,1)]" />
					<span className="text-gray-500">{labels.assumedLegend}</span>
				</span>
			</div>

			{/* SAM Factors accordion */}
			<div className="space-y-1.5 mb-3">
				{data.samFactors.map((f) => {
					const style = getDataTypeStyle(f.dataType)
					const isOpen = openFactors.has(f.id)
					return (
						<div
							key={f.id}
							className="border border-gray-200 rounded-lg overflow-hidden"
						>
							<button
								data-fold-toggle=""
								onClick={() =>
									setOpenFactors((prev) => {
										const next = new Set(prev)
										if (next.has(f.id)) next.delete(f.id)
										else next.add(f.id)
										return next
									})
								}
								className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors text-left"
							>
								<div className="flex items-center gap-2 min-w-0">
									<span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-mono text-[11px] font-bold shrink-0">
										{f.id}
									</span>
									<span className="text-[14px] font-medium text-gray-800 truncate">
										{f.name}
									</span>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<span className="text-[14px] font-medium text-gray-800">
										{f.value}
									</span>
									<span
										className={`font-mono text-[12px] px-2 py-0.5 rounded ${style.bg} ${style.text}`}
									>
										{f.dataType}
									</span>
									<svg
										className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
								</div>
							</button>
							{isOpen && (
								<div className="border-t border-gray-100 bg-white p-2">
									<div className="bg-gray-50 rounded-md px-3 py-2">
										<table className="w-full text-[13px]">
											<thead>
												<tr className="border-b border-gray-200">
													<th className="text-left py-1.5 pr-3 text-gray-500 font-medium">
														{labels.dataSource}
													</th>
													<th className="text-left py-1.5 pr-3 text-gray-500 font-medium">
														{labels.value}
													</th>
													<th className="text-left py-1.5 text-gray-500 font-medium">
														{labels.note}
													</th>
												</tr>
											</thead>
											<tbody>
												{f.sources.map((s, si) => (
													<tr
														key={si}
														className="border-b border-gray-100 last:border-0"
													>
														<td className="py-1.5 pr-3 text-gray-700">
															{s.url ? (
																<a
																	href={s.url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-[14px] font-semibold text-gray-900 leading-snug hover:text-blue-700 transition-colors"
																>
																	{s.name}
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
															) : (
																<span className="text-[14px] font-semibold text-gray-900">
																	{s.name}
																</span>
															)}
														</td>
														<td className="py-1.5 pr-3 text-[14px] text-gray-900">
															{s.value}
														</td>
														<td className="py-1.5 text-[14px] text-gray-900">
															{s.note}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}
						</div>
					)
				})}
			</div>
		</section>
	)
}
