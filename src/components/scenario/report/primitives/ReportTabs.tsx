"use client"

export interface ReportTab<K extends string = string> {
	key: K
	label: string
	count?: number
}

export interface ReportTabsProps<K extends string = string> {
	tabs: readonly ReportTab<K>[]
	activeKey: K
	onChange: (key: K) => void
	className?: string
}

/**
 * Standard report tab strip — blue-outlined container, blue-filled active tab.
 *
 * Use this for any tabbed view inside a report (player categories,
 * paper/use-case toggles, etc.). Pass `count` on each tab to show a count in
 * parens after the label.
 */
export function ReportTabs<K extends string = string>({
	tabs,
	activeKey,
	onChange,
	className = "",
}: ReportTabsProps<K>) {
	return (
		<div
			className={`flex gap-1 border border-blue-200 p-1 rounded-lg w-fit ${className}`}
		>
			{tabs.map((tab) => {
				const isActive = activeKey === tab.key
				return (
					<button
						key={tab.key}
						type="button"
						onClick={() => onChange(tab.key)}
						className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-all ${
							isActive
								? "bg-blue-50 text-blue-600"
								: "text-gray-600 hover:text-gray-800"
						}`}
					>
						{tab.label}
						{typeof tab.count === "number" && (
							<span className="text-[12px] opacity-80 ml-1">({tab.count})</span>
						)}
					</button>
				)
			})}
		</div>
	)
}
