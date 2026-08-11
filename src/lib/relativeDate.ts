export function formatDayLabel(
	date: Date,
	todayLabel: string,
	yesterdayLabel: string,
): string {
	const now = new Date()
	const startOfDay = (d: Date) =>
		new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
	const diffDays = Math.round(
		(startOfDay(now) - startOfDay(date)) / (24 * 60 * 60 * 1000),
	)
	if (diffDays === 0) return todayLabel
	if (diffDays === 1) return yesterdayLabel
	return date.toLocaleDateString()
}
