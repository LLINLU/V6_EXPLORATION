import { Fragment, type ReactNode } from "react"
import type { ThemeReportSource } from "@/types/theme-report"

const CITATION_REGEX = /\[\[cite:([^\]]+)\]\]/g

/** Inline external-link icon used wherever a citation marker is replaced. */
function CitationIcon() {
	return (
		<svg
			className="inline-block w-2.5 h-2.5 ml-0.5 align-middle"
			viewBox="0 0 12 12"
			fill="none"
		>
			<path
				d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5"
				stroke="currentColor"
				strokeWidth="1.2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

/** Render plain text, replacing [[cite:id]] markers with inline link icons. */
export function CitedText({
	text,
	sources,
}: {
	text: string
	sources: ThemeReportSource[]
}): ReactNode {
	const parts = text.split(CITATION_REGEX)
	return (
		<>
			{parts.map((part, i) => {
				if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
				const src = sources.find((s) => s.id === part)
				if (!src?.url) return null
				return (
					<a
						key={i}
						href={src.url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
						title={src.label}
					>
						<CitationIcon />
					</a>
				)
			})}
		</>
	)
}

/** Replace [[cite:id]] markers in HTML with inline anchor tags carrying the link icon. */
export function injectCitationsIntoHtml(
	html: string,
	sources: ThemeReportSource[],
): string {
	return html.replace(CITATION_REGEX, (_, id: string) => {
		const src = sources.find((s) => s.id === id)
		if (!src?.url) return ""
		const safeUrl = src.url.replace(/"/g, "&quot;")
		const safeTitle = (src.label ?? "").replace(/"/g, "&quot;")
		return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" title="${safeTitle}" class="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"><svg class="inline-block w-2.5 h-2.5 ml-0.5 align-middle" viewBox="0 0 12 12" fill="none"><path d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`
	})
}
