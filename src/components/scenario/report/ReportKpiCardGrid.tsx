import type { KpiItem } from "@/types/report"
import { KPI_COLORS } from "./charts/chartConfig"

interface ReportKpiCardGridProps {
	items: KpiItem[]
}

export function ReportKpiCardGrid({ items }: ReportKpiCardGridProps) {
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
			{items.map((item, i) => (
				<div
					key={item.label}
					className="bg-white rounded-lg shadow-sm border border-gray-100 p-3"
					style={{
						borderLeft: `4px solid ${KPI_COLORS[i % KPI_COLORS.length]}`,
					}}
				>
					<p className="text-xs text-gray-500 mb-1">{item.label}</p>
					<p className="text-sm font-semibold text-gray-900">{item.value}</p>
				</div>
			))}
		</div>
	)
}
