import { Bar } from "react-chartjs-2"
import type { TechnologyScore } from "@/types/report"
import { COLORS } from "../charts/chartConfig"
import "../charts/chartConfig" // ensure registration

interface TrlBarChartProps {
	scores: TechnologyScore[]
}

export function TrlBarChart({ scores }: TrlBarChartProps) {
	const data = {
		labels: scores.map((s) => s.technology_name),
		datasets: [
			{
				label: "統合TRL",
				data: scores.map((s) => s.integrated_trl),
				backgroundColor: scores.map((s) =>
					s.category === "bottleneck" ? COLORS.bottleneck : COLORS.feasible,
				),
				borderWidth: 0,
				barThickness: 20,
			},
		],
	}

	const options = {
		indexAxis: "y" as const,
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			x: {
				min: 0,
				max: 9,
				ticks: { stepSize: 1, font: { size: 10 } },
				title: { display: true, text: "TRL Level", font: { size: 10 } },
			},
			y: {
				ticks: { font: { size: 10 } },
			},
		},
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					label: (ctx: { raw: unknown }) => `TRL ${ctx.raw}`,
				},
			},
		},
	}

	const height = Math.max(160, scores.length * 36)

	return (
		<div style={{ height }}>
			<Bar data={data} options={options} />
		</div>
	)
}
