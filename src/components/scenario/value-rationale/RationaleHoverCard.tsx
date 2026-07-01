import { useTranslation } from "react-i18next"
import type { RationaleHoverCardProps } from "./types"

export function RationaleHoverCard({
	summary,
	metricName,
	onClickDetails,
	cagrInfo,
}: RationaleHoverCardProps) {
	const { t } = useTranslation()
	return (
		<div
			className="w-[320px] bg-white border border-gray-200 rounded-lg shadow-xl cursor-pointer overflow-hidden"
			onClick={onClickDetails}
		>
			{/* CAGR Category Section (if provided) */}
			{cagrInfo && (
				<div className="p-4 border-b border-gray-100">
					<div className="flex items-center gap-2 mb-2">
						<div
							className="w-2 h-2 rounded-full"
							style={{ backgroundColor: cagrInfo.color }}
						/>
						<span className="font-medium text-sm text-gray-900">
							{cagrInfo.title}
						</span>
					</div>
					<p className="text-xs text-gray-600 leading-relaxed mb-2">
						{cagrInfo.description}
					</p>
					<div className="flex justify-between items-center">
						<span className="text-xs text-gray-500">
							{t("rationale.category")}:{" "}
							<span className="font-medium" style={{ color: cagrInfo.color }}>
								{cagrInfo.category}
							</span>
						</span>
						{cagrInfo.value !== null && cagrInfo.value !== undefined && (
							<span
								className="text-xs font-medium"
								style={{ color: cagrInfo.color }}
							>
								CAGR: {cagrInfo.value}%
							</span>
						)}
					</div>
				</div>
			)}

			{/* Rationale Section */}
			<div className="p-4 bg-[#F5F9FF]">
				<div className="text-xs font-medium text-gray-500 mb-2">
					{t("rationale.basis", { metricName })}
				</div>
				<p className="text-[13px] leading-relaxed text-gray-700 mb-3">
					{summary}
				</p>
				<div className="text-xs text-blue-500 hover:text-blue-600 transition-colors font-medium">
					{t("rationale.view_details")}
				</div>
			</div>
		</div>
	)
}
