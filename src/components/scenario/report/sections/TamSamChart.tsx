import { Bar } from "react-chartjs-2"
import { CHART_COLORS } from "../charts/chartConfig"
import "../charts/chartConfig" // ensure registration

interface TamSamChartProps {
	tamValue: number
	samValue: number
}

export function TamSamChart({ tamValue, samValue }: TamSamChartProps) {
	const data = {
		labels: ["TAM", "SAM"],
		datasets: [
			{
				data: [tamValue, samValue],
				backgroundColor: [CHART_COLORS.tam, CHART_COLORS.sam],
				borderColor: [CHART_COLORS.tamBorder, CHART_COLORS.samBorder],
				borderWidth: 1,
				barThickness: 28,
			},
		],
	}

	const options = {
		indexAxis: "y" as const,
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			x: {
				beginAtZero: true,
				ticks: { font: { size: 10 } },
				title: { display: true, text: "USD Billions", font: { size: 10 } },
			},
			y: {
				ticks: { font: { size: 11, weight: "bold" as const } },
			},
		},
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					label: (ctx: { raw: unknown }) => `$${ctx.raw}B`,
				},
			},
		},
	}

	return (
		<div className="border border-gray-200 rounded-lg p-3">
			<h5 className="text-xs font-semibold text-gray-500 mb-2">
				TAMとSAMの比較
			</h5>
			<div style={{ height: 120 }}>
				<Bar data={data} options={options} />
			</div>
		</div>
	)
}
