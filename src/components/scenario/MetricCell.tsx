import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

type MetricStatus = "idle" | "running" | "done" | "error"

interface StatusDetail {
	label: string
	status: string
	message?: string
}

interface MetricCellProps {
	value: React.ReactNode
	hasData: boolean
	status?: MetricStatus
	statusDetails?: StatusDetail[]
	onClick?: (e: React.MouseEvent) => void
	className?: string
}

export function MetricCell({
	value,
	hasData,
	status = "idle",
	statusDetails,
	onClick,
	className = "",
}: MetricCellProps) {
	const { t } = useTranslation()
	const [popoverOpen, setPopoverOpen] = useState(false)

	// Running state: show spinner with popover
	if (status === "running") {
		return (
			<td className={`px-4 py-4 ${className}`}>
				<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
							onClick={(e) => {
								e.stopPropagation()
								setPopoverOpen(true)
							}}
						>
							<Loader2 className="h-4 w-4 animate-spin" />
							<span>{t("scenario.metric_cell.fetching")}</span>
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-72 p-3" side="bottom" align="start">
						<div className="space-y-2">
							<p className="text-sm font-medium text-gray-900">
								{t("scenario.metric_cell.fetch_status")}
							</p>
							{statusDetails && statusDetails.length > 0 ? (
								<ul className="space-y-1.5">
									{statusDetails.map((detail, i) => (
										<li
											key={i}
											className="text-xs text-gray-600 flex items-start gap-1.5"
										>
											<span
												className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
													detail.status === "completed"
														? "bg-green-500"
														: detail.status === "failed"
															? "bg-red-500"
															: detail.status === "running"
																? "bg-blue-500 animate-pulse"
																: "bg-gray-300"
												}`}
											/>
											<div>
												<span className="font-medium">{detail.label}</span>
												<span className="text-gray-400 ml-1">
													({detail.status})
												</span>
												{detail.message && (
													<p className="text-gray-400 mt-0.5">
														{detail.message}
													</p>
												)}
											</div>
										</li>
									))}
								</ul>
							) : (
								<p className="text-xs text-gray-500">
									{t("scenario.metric_cell.fetching_data")}
								</p>
							)}
						</div>
					</PopoverContent>
				</Popover>
			</td>
		)
	}

	// No data: show N/A with tooltip
	if (!hasData) {
		return (
			<td className={`px-4 py-4 cursor-pointer ${className}`} onClick={onClick}>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span
								className="text-sm text-gray-400"
								style={{ fontWeight: 400 }}
							>
								N/A
							</span>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="max-w-[220px] text-center">
							<p className="text-xs">
								{t("scenario.metric_cell.no_data_tooltip")}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</td>
		)
	}

	// Has data: show value
	return (
		<td className={`px-4 py-4 cursor-pointer ${className}`} onClick={onClick}>
			{value}
		</td>
	)
}
