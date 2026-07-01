import { useTranslation } from "react-i18next"
import {
	CartesianGrid,
	Line,
	LineChart,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts"
import { SelectedNodeInfo } from "@/components/technology-tree/components/SelectedNodeInfo"
import type { Scenario } from "@/types/scenario"

interface OverviewTabProps {
	scenario: Scenario
	mode?: "TED" | "FAST"
	enrichedPapers: any[]
	enrichedPatents: any[]
	enrichedUseCases: any[]
}

const formatCurrency = (value: number | null | undefined): string | null => {
	if (value == null) return null
	if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
	if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
	if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
	return `$${value.toLocaleString()}`
}

const isNA = (v: unknown) => v == null || v === "NA" || v === "N/A" || v === 0

const buildYearData = (
	items: any[],
	dateKey: string,
	fallbackKey?: string,
): { year: string; count: number }[] => {
	const map: Record<string, number> = {}
	for (const item of items) {
		const raw = item[dateKey] || (fallbackKey ? item[fallbackKey] : "") || ""
		const year = typeof raw === "number" ? raw : new Date(raw).getFullYear()
		if (!year || Number.isNaN(year)) continue
		map[year] = (map[year] || 0) + 1
	}
	return Object.entries(map)
		.map(([year, count]) => ({ year, count }))
		.sort((a, b) => a.year.localeCompare(b.year))
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
	scenario,
	mode,
	enrichedPapers,
	enrichedPatents,
	enrichedUseCases,
}) => {
	const { t } = useTranslation()
	const preanalyze = scenario.analysisData?.preanalyze
	const market = preanalyze?.market
	const tam = market?.tam
	const projection = market?.projection

	const hasTamValue = tam?.value != null && tam.value !== 0
	const hasCagrValue =
		(projection?.cagr_percent != null && projection.cagr_percent !== 0) ||
		(tam?.cagr &&
			tam.cagr !== "NA" &&
			tam.cagr !== "N/A" &&
			tam.cagr !== "0" &&
			tam.cagr !== 0)

	const hasMarketData =
		(tam?.value != null && !isNA(tam.value)) ||
		(tam?.market_name && !isNA(tam.market_name)) ||
		(projection?.cagr_percent != null && !isNA(projection.cagr_percent)) ||
		(tam?.cagr && !isNA(tam.cagr))

	const projectionYears = projection?.projections
		? Object.entries(projection.projections)
				.map(([year, val]) => ({ year, value: Number(val) }))
				.filter((p) => !Number.isNaN(p.value))
				.sort((a, b) => a.year.localeCompare(b.year))
		: []

	// Tech characteristics
	const techChars = scenario.techCharacteristics
	const techStrength = (scenario.analysisData as any)?.technology_strength
	const techItems: { name: string }[] = []

	if (Array.isArray(techChars) && techChars.length > 0) {
		for (const item of techChars) {
			if (typeof item === "string") techItems.push({ name: item })
			else if (item && typeof item === "object")
				techItems.push({ name: item.name || item.label || "" })
		}
	} else if (Array.isArray(techStrength) && techStrength.length > 0) {
		for (const ts of techStrength) {
			techItems.push({ name: ts.strength_name ?? "" })
		}
	}
	const filteredTechItems = techItems.filter((i) => i.name)

	// Year trend charts
	const papersData = buildYearData(enrichedPapers, "date")
	const patentsData = buildYearData(
		enrichedPatents,
		"earliest_priority_date",
		"created_at",
	)
	const casesData = buildYearData(enrichedUseCases, "year", "created_at")

	const trendCharts = [
		{
			data: papersData,
			label: t("tech.tab_papers"),
			color: "#4ab7ff",
			total: enrichedPapers.length,
		},
		{
			data: patentsData,
			label: t("tech.tab_patents"),
			color: "#aca7ff",
			total: enrichedPatents.length,
		},
		{
			data: casesData,
			label: t("tech.tab_cases"),
			color: "#00e5bb",
			total: enrichedUseCases.length,
		},
	].filter((c) => c.data.length > 0)

	return (
		<div className="-mx-4">
			<SelectedNodeInfo
				title={scenario.name}
				description={scenario.description}
				level={1}
				mode={mode}
				nodeId={scenario.id}
			/>

			{/* Technology Characteristics */}
			{filteredTechItems.length > 0 && (
				<div className="mx-4 mt-4">
					<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
						{t("scenario.tech_char.title")}
					</h3>
					<div className="flex flex-wrap gap-1.5">
						{filteredTechItems.map((item, i) => (
							<span
								key={i}
								className="inline-block bg-blue-100 text-blue-700 rounded-md px-2 py-1 text-xs font-medium"
							>
								{item.name}
							</span>
						))}
					</div>
				</div>
			)}

			{/* TAM / CAGR cards */}
			<div className="mx-4 mt-4 grid grid-cols-2 gap-2">
				<div className="bg-white rounded-md px-2.5 py-1.5 border border-gray-100">
					<div className="flex items-baseline justify-between">
						<span className="text-[10px] font-medium text-gray-500 uppercase">
							TAM
						</span>
						{hasTamValue && tam?.year && (
							<span className="text-[10px] text-gray-400">
								{t("scenario.market.year_suffix", { year: tam.year })}
							</span>
						)}
					</div>
					{hasTamValue ? (
						<p className="text-base font-bold ai-gradient-text">
							{(() => {
								const formatted = formatCurrency(tam?.value)
								if (!formatted) return null
								return (
									<>
										<span className="text-sm">$</span>
										{formatted.slice(1)}
									</>
								)
							})()}
						</p>
					) : (
						<p className="text-xs text-gray-400 mt-1">{t("common.no_data")}</p>
					)}
				</div>

				<div className="bg-white rounded-md px-2.5 py-1.5 border border-gray-100">
					<div className="flex items-baseline justify-between">
						<span className="text-[10px] font-medium text-gray-500 uppercase">
							CAGR
						</span>
						{tam?.cagr_start_year != null &&
							tam?.cagr_end_year != null &&
							tam.cagr_start_year !== 0 &&
							tam.cagr_end_year !== 0 && (
								<span className="text-[10px] text-gray-400">
									{tam.cagr_start_year}–{tam.cagr_end_year}
								</span>
							)}
					</div>
					{hasCagrValue ? (
						<p className="text-base font-bold ai-gradient-text">
							{projection?.cagr_percent != null ? (
								<>
									{Number(projection.cagr_percent).toFixed(1)}
									<span className="text-sm">%</span>
								</>
							) : (
								tam?.cagr
							)}
						</p>
					) : (
						<p className="text-xs text-gray-400 mt-1">{t("common.no_data")}</p>
					)}
				</div>
			</div>

			{/* Preanalyze market detail */}
			{tam && projection && hasMarketData && (
				<div className="mx-4 mt-4 space-y-3">
					<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
						{t("scenario.market.overview_title")}
					</h3>
					<div className="bg-[#f9fafb] rounded-lg p-4 space-y-3">
						{tam?.market_name && !isNA(tam.market_name) && (
							<div>
								<span className="text-xs font-medium text-gray-500">
									{t("scenario.market.name_label")}
								</span>
								<p className="text-sm font-semibold text-gray-800 mt-0.5">
									{tam.market_name}
								</p>
							</div>
						)}
						{tam?.market_definition && !isNA(tam.market_definition) && (
							<div>
								<span className="text-xs font-medium text-gray-500">
									{t("scenario.market.definition_label")}
								</span>
								<p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
									{tam.market_definition}
								</p>
							</div>
						)}
						{projectionYears.length > 0 && (
							<div>
								<span className="text-xs font-medium text-gray-500 mb-1 block">
									{t("scenario.market.size_projection_label")}
								</span>
								<ResponsiveContainer width="100%" height={140}>
									<LineChart
										data={projectionYears}
										margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="#e5e7eb"
											vertical={false}
										/>
										<XAxis
											dataKey="year"
											tick={{ fontSize: 10, fill: "#9ca3af" }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											tick={{ fontSize: 10, fill: "#9ca3af" }}
											axisLine={false}
											tickLine={false}
											tickFormatter={(v: number) => {
												if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
												if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
												return `$${v}`
											}}
										/>
										<RechartsTooltip
											contentStyle={{
												fontSize: 12,
												borderRadius: 8,
												border: "1px solid #e5e7eb",
											}}
											formatter={(value: number) => [
												formatCurrency(value),
												t("scenario.market.size_label"),
											]}
										/>
										<Line
											type="monotone"
											dataKey="value"
											name={t("scenario.market.size_label")}
											stroke="#3b82f6"
											strokeWidth={2}
											dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
											activeDot={{ r: 5, strokeWidth: 0 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						)}
						{tam?.source_url && (
							<div>
								<span className="text-xs font-medium text-gray-500">
									{t("scenario.market.source_label")}
								</span>
								<a
									href={tam.source_url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs text-blue-500 hover:underline mt-0.5 block truncate"
								>
									{tam.source_url}
								</a>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Year-based trend charts */}
			{trendCharts.length > 0 && (
				<div className="mx-4 mt-4 space-y-4">
					<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
						{t("scenario.market.trend_by_year_title")}
					</h3>
					{trendCharts.map((chart) => (
						<div key={chart.label} className="bg-[#f9fafb] rounded-lg p-3">
							<div className="flex items-center justify-between mb-1">
								<span className="text-xs font-medium text-gray-600">
									{chart.label}
								</span>
								<span className="text-xs text-gray-400">
									{t("scenario.market.count_items", { count: chart.total })}
								</span>
							</div>
							<ResponsiveContainer width="100%" height={120}>
								<LineChart
									data={chart.data}
									margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="#e5e7eb"
										vertical={false}
									/>
									<XAxis
										dataKey="year"
										tick={{ fontSize: 10, fill: "#9ca3af" }}
										axisLine={false}
										tickLine={false}
									/>
									<YAxis
										tick={{ fontSize: 10, fill: "#9ca3af" }}
										allowDecimals={false}
										axisLine={false}
										tickLine={false}
									/>
									<RechartsTooltip
										contentStyle={{
											fontSize: 12,
											borderRadius: 8,
											border: "1px solid #e5e7eb",
										}}
										itemStyle={{ color: "#6b7280" }}
									/>
									<Line
										type="monotone"
										dataKey="count"
										name={chart.label}
										stroke={chart.color}
										strokeWidth={2}
										dot={{ r: 2.5, fill: chart.color, strokeWidth: 0 }}
										activeDot={{ r: 4, strokeWidth: 0 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
