import { Doughnut } from "react-chartjs-2"
import type { MarketSegment } from "@/types/report"
import { SEGMENT_COLORS } from "../charts/chartConfig"
import "../charts/chartConfig" // ensure registration

interface SegmentDonutChartProps {
	segments: MarketSegment[]
}

export function SegmentDonutChart({ segments }: SegmentDonutChartProps) {
	const data = {
		labels: segments.map((s) => s.segment_name),
		datasets: [
			{
				data: segments.map((s) => s.share_percent),
				backgroundColor: segments.map(
					(_, i) => SEGMENT_COLORS[i % SEGMENT_COLORS.length],
				),
				borderWidth: 1,
				borderColor: "#fff",
			},
		],
	}

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: "bottom" as const,
				labels: { font: { size: 10 }, boxWidth: 12 },
			},
			tooltip: {
				callbacks: {
					label: (ctx: { label: string; raw: unknown }) =>
						`${ctx.label}: ${ctx.raw}%`,
				},
			},
		},
	}

	return (
		<div className="border border-gray-200 rounded-lg p-3">
			<h5 className="text-xs font-semibold text-gray-500 mb-2">
				セグメント分布
			</h5>
			<div style={{ height: 180 }}>
				<Doughnut data={data} options={options} />
			</div>
		</div>
	)
}
