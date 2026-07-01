import type { ThemeReportSource } from "@/types/theme-report"

interface ThemeMemlabBadgesProps {
	sources: ThemeReportSource[]
}

export function ThemeMemlabBadges({ sources }: ThemeMemlabBadgesProps) {
	const memlabSources = sources?.filter((s) => s.type === "memlab") ?? []
	if (!memlabSources.length) return null

	return (
		<div className="mb-4 flex flex-wrap gap-2">
			{memlabSources.map((s, i) => (
				<span
					key={i}
					className="inline-flex items-center gap-1 px-4 py-1 rounded bg-purple-50 border border-purple-200 text-purple-700 font-mono text-[10px] font-medium"
				>
					<span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
					{s.label}
				</span>
			))}
		</div>
	)
}
