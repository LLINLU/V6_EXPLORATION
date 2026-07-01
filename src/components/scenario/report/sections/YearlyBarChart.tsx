import { Bar } from "react-chartjs-2"
import type { YearlyCount } from "@/types/report"
import "../charts/chartConfig" // ensure registration

interface YearlyBarChartProps {
	yearlyData: YearlyCount[]
	color: string
	borderColor: string
	label: string
}

export function YearlyBarChart({
	yearlyData,
	color,
	borderColor,
	label,
}: YearlyBarChartProps) {
	const data = {
		labels: yearlyData.map((d) => String(d.year)),
		datasets: [
			{
				label,
				data: yearlyData.map((d) => d.count),
				backgroundColor: color,
				borderColor,
				borderWidth: 1,
			},
		],
	}

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			x: {
				ticks: { font: { size: 9 }, maxRotation: 45 },
			},
			y: {
				beginAtZero: true,
				ticks: { font: { size: 10 } },
			},
		},
		plugins: {
			legend: { display: false },
		},
	}

	return (
		<div style={{ height: 180 }}>
			<Bar data={data} options={options} />
		</div>
	)
}
