import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	Title,
	Tooltip,
} from "chart.js"

// Register Chart.js components globally
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
)

export const COLORS = {
	primary: "#3498DB",
	bottleneck: "#E74C3C",
	feasible: "#2ECC71",
	accent: "#F39C12",
	secondary: "#9B59B6",
	dark: "#2C3E50",
	orange: "#E67E22",
	lightBg: "#f8f9fa",
	white: "#ffffff",
	muted: "#888888",
	border: "#dee2e6",
} as const

export const KPI_COLORS = [
	COLORS.primary,
	COLORS.bottleneck,
	COLORS.feasible,
	COLORS.accent,
	COLORS.secondary,
	COLORS.bottleneck,
	COLORS.orange,
	COLORS.dark,
] as const

export const SEGMENT_COLORS = [
	COLORS.primary,
	COLORS.bottleneck,
	COLORS.feasible,
	COLORS.accent,
	COLORS.secondary,
] as const

export const CHART_COLORS = {
	article: "rgba(52, 152, 219, 0.7)",
	articleBorder: "rgba(52, 152, 219, 1)",
	patent: "rgba(46, 204, 113, 0.7)",
	patentBorder: "rgba(46, 204, 113, 1)",
	tam: "rgba(52, 152, 219, 0.7)",
	tamBorder: "rgba(52, 152, 219, 1)",
	sam: "rgba(231, 76, 60, 0.7)",
	samBorder: "rgba(231, 76, 60, 1)",
} as const
