import { Info } from "lucide-react"
import type { ReactNode } from "react"

type LabelTone = "red" | "blue" | "emerald" | "amber" | "neutral"

const LABEL_STYLES: Record<LabelTone, string> = {
	red: "text-[rgba(230,112,112,1)] bg-red-50",
	blue: "text-blue-700 bg-blue-50",
	emerald: "text-emerald-700 bg-emerald-50",
	amber: "text-amber-700 bg-amber-50",
	neutral: "text-gray-600 bg-gray-100",
}

export interface ReportInfoCalloutProps {
	/** Optional pill label shown above the body (e.g. "現状手法の限界") */
	label?: string
	/** Tone of the pill label. Defaults to neutral. */
	labelTone?: LabelTone
	/** Show the info icon at the start of the body row. Defaults to false. */
	showInfoIcon?: boolean
	/** Body content — string or rich nodes */
	children: ReactNode
	className?: string
}

/**
 * Standard report callout: gray card with optional pill label and info icon.
 *
 * Use this for any short, soft-emphasis paragraph inside a report section
 * (structural barriers, current-state limits, proposed solutions, caveats).
 * Replaces ad-hoc `bg-gray-50 rounded-md ...` blocks.
 */
export function ReportInfoCallout({
	label,
	labelTone = "neutral",
	showInfoIcon = false,
	children,
	className = "",
}: ReportInfoCalloutProps) {
	return (
		<div className={`bg-gray-50 rounded-md px-3 py-2 ${className}`}>
			{label && (
				<p
					className={`w-fit font-mono text-[12px] px-2 py-0.5 rounded-full mb-1.5 ${LABEL_STYLES[labelTone]}`}
				>
					{label}
				</p>
			)}
			<div className="flex gap-2 text-[14px] text-gray-700 leading-relaxed">
				{showInfoIcon && (
					<Info
						className="w-4 h-4 mt-0.5 shrink-0 text-gray-400"
						strokeWidth={2}
					/>
				)}
				<div className="flex-1">{children}</div>
			</div>
		</div>
	)
}
