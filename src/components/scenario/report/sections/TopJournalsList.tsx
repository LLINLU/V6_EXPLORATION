import type { JournalEntry } from "@/types/report"

interface TopJournalsListProps {
	journals: JournalEntry[]
}

export function TopJournalsList({ journals }: TopJournalsListProps) {
	if (journals.length === 0) return null

	return (
		<div>
			<h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
				主要ジャーナル・学会
			</h4>
			<ol className="space-y-1">
				{journals.map((j, i) => (
					<li key={j.name} className="flex items-center gap-2 text-xs">
						<span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
							{i + 1}
						</span>
						<span className="text-gray-700 flex-1">{j.name}</span>
						<span className="text-gray-400 font-mono">{j.count}件</span>
					</li>
				))}
			</ol>
		</div>
	)
}
