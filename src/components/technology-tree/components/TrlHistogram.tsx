import type React from "react"
import type { TrlHistogram as TrlHistogramData } from "@/hooks/useEnrichedData"

interface TrlHistogramProps {
	data: TrlHistogramData[]
	className?: string
}

export const TrlHistogram: React.FC<TrlHistogramProps> = ({
	data,
	className = "",
}) => {
	// Find the maximum count for scaling
	const maxCount = Math.max(...data.map((d) => d.count), 1)

	// Create full TRL range (1-9) with 0 counts for missing values
	const fullData = Array.from({ length: 9 }, (_, i) => {
		const trl = i + 1
		const existing = data.find((d) => d.trl === trl)
		return existing || { trl, count: 0 }
	})

	return (
		<div className={`flex flex-col gap-1 ${className}`}>
			<div className="flex items-end gap-1 h-16">
				{fullData.map((item) => {
					const height = item.count > 0 ? (item.count / maxCount) * 100 : 0
					return (
						<div
							key={item.trl}
							className="flex-1 flex flex-col items-center justify-end"
							title={`TRL ${item.trl}: ${item.count} items`}
						>
							<div className="w-full flex flex-col items-center">
								{/* Count label */}
								{item.count > 0 && (
									<span className="text-[10px] text-gray-600 mb-1">
										{item.count}
									</span>
								)}
								{/* Bar */}
								<div
									className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
									style={{
										height:
											height > 0 ? `${Math.max(height * 0.5, 4)}px` : "2px",
										backgroundColor: item.count > 0 ? undefined : "#e5e7eb",
									}}
								/>
							</div>
						</div>
					)
				})}
			</div>
			{/* X-axis labels */}
			<div className="flex gap-1">
				{fullData.map((item) => (
					<div key={item.trl} className="flex-1 text-center">
						<span className="text-[10px] text-gray-500">{item.trl}</span>
					</div>
				))}
			</div>
			<div className="text-center">
				<span className="text-[10px] text-gray-500">TRL分布</span>
			</div>
		</div>
	)
}
