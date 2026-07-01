"use client"

import { type ReactNode, useState } from "react"

export interface ReportFoldableCardProps {
	/** Number badge content (e.g. "01", or a numeric id). Pass a string. */
	badge?: string
	/** Header title shown next to the badge. String or rich nodes. */
	title: ReactNode
	/** Optional right-aligned slot in the header (e.g. a value + datatype tag). */
	trailing?: ReactNode
	/** Whether the card starts open. Defaults to true. */
	defaultOpen?: boolean
	/** Body content shown when expanded */
	children: ReactNode
	className?: string
}

/**
 * Standard foldable card for report sections.
 *
 * Header is a clickable button with: optional number badge → title → optional
 * trailing slot → chevron. Body collapses on click.
 *
 * Use this for any list-of-items pattern in a report where each item has a
 * brief header and a longer body the reader may want to skim past.
 */
export function ReportFoldableCard({
	badge,
	title,
	trailing,
	defaultOpen = true,
	children,
	className = "",
}: ReportFoldableCardProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen)

	return (
		<div
			className={`rounded-lg border border-gray-200 overflow-hidden bg-white ${className}`}
		>
			<button
				data-fold-toggle=""
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				className={`w-full flex items-center gap-2 px-4 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left ${isOpen ? "border-b border-gray-100" : ""}`}
			>
				{badge && (
					<span className="flex items-center justify-center w-6 h-6 rounded bg-blue-50 text-blue-600 font-mono text-[11px] font-bold shrink-0">
						{badge}
					</span>
				)}
				<div className="flex-1 min-w-0 font-mono text-[13px] text-gray-600 leading-snug">
					{title}
				</div>
				{trailing && <div className="shrink-0">{trailing}</div>}
				<svg
					className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
					viewBox="0 0 16 16"
					fill="none"
				>
					<path
						d="M4 6l4 4 4-4"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>
			{isOpen && <div className="px-4 py-3 space-y-2">{children}</div>}
		</div>
	)
}
