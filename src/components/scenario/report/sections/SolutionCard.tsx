import type { CitedSource } from "@/types/report"

interface SolutionCardProps {
	title: string
	text: string
	sources: CitedSource[]
}

export function SolutionCard({ title, text, sources }: SolutionCardProps) {
	return (
		<div className="border border-gray-200 rounded-lg p-4">
			<h5 className="text-sm font-semibold text-gray-800 mb-2">{title}</h5>
			<p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
				{text}
			</p>
			{sources.length > 0 && (
				<div className="mt-2 pt-2 border-t border-gray-100">
					<p className="text-[10px] text-gray-400 mb-1">出典:</p>
					<div className="flex flex-wrap gap-1">
						{sources.map((src) => (
							<a
								key={src.index}
								href={src.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-[10px] text-blue-500 hover:underline"
								title={src.title}
							>
								[{src.index}]
							</a>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
