import { ChevronDown, ChevronUp } from "lucide-react"
import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

const SUMMARY_TRUNCATE_HEIGHT = 200

function normalizeMarkdown(content: string): string {
	return content
		.replace(/<div[^>]*>/gi, "\n\n")
		.replace(/<\/div>/gi, "\n\n")
		.replace(/([^\n#])(#{1,6} )/g, "$1\n\n$2")
		.replace(/\n{3,}/g, "\n\n")
		.trim()
}

const GENERIC_LINK_TEXTS = new Set([
	"こちら",
	"詳細はこちら",
	"こちらをご覧ください",
	"詳細",
	"here",
	"click here",
	"read more",
])

function extractDomain(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "")
	} catch {
		return url
	}
}

function resolveSourceName(text: string, url: string): string {
	const cleaned = text.replace(/<[^>]+>/g, "").trim()
	// Use domain if text is generic, too long, or is just a raw URL
	if (
		!cleaned ||
		GENERIC_LINK_TEXTS.has(cleaned) ||
		cleaned.length > 60 ||
		cleaned.startsWith("http")
	) {
		return extractDomain(url)
	}
	return cleaned
}

function sanitizeUrl(url: string): string | undefined {
	try {
		const { protocol } = new URL(url)
		return protocol === "https:" || protocol === "http:" ? url : undefined
	} catch {
		return undefined
	}
}

interface Citation {
	url: string
	sourceName: string
}

function processCitations(content: string): {
	processed: string
	citations: Citation[]
} {
	const citations: Citation[] = []
	const urlToIdx = new Map<string, number>()

	function addCitation(url: string, sourceName: string): string {
		if (!urlToIdx.has(url)) {
			urlToIdx.set(url, citations.length + 1)
			citations.push({ url, sourceName })
		}
		return `[${urlToIdx.get(url)}]`
	}

	// Handle HTML anchor tags optionally wrapped in Japanese 「」 quotes:
	// 「<a href="url">text</a>」→ [N]  or  <a href="url">text</a> → [N]
	let processed = content.replace(
		/「?<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>」?/gi,
		(_, url, innerText) => addCitation(url, resolveSourceName(innerText, url)),
	)

	// Handle markdown links: [text](url)
	processed = processed.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (_, text, url) =>
		addCitation(url, resolveSourceName(text, url)),
	)

	return { processed, citations }
}

interface ExpandableSummaryProps {
	content: string
	className?: string
}

export const ExpandableSummary: React.FC<ExpandableSummaryProps> = ({
	content,
	className,
}) => {
	const [isExpanded, setIsExpanded] = useState(false)
	const [needsTruncation, setNeedsTruncation] = useState(false)
	const contentRef = useRef<HTMLDivElement>(null)

	const { processed, citations } = useMemo(
		() => processCitations(normalizeMarkdown(content)),
		[content],
	)

	// biome-ignore lint/correctness/useExhaustiveDependencies: content triggers re-measurement when prop changes
	useEffect(() => {
		if (contentRef.current) {
			setNeedsTruncation(
				contentRef.current.scrollHeight > SUMMARY_TRUNCATE_HEIGHT,
			)
		}
	}, [content])

	return (
		<div>
			<div
				ref={contentRef}
				className={`transition-all ${className ?? ""}`}
				style={
					!isExpanded && needsTruncation
						? { maxHeight: SUMMARY_TRUNCATE_HEIGHT, overflow: "hidden" }
						: undefined
				}
			>
				<div
					className="
						prose prose-sm max-w-none
						text-sm text-gray-700
						leading-7
						prose-headings:text-sm prose-headings:font-semibold prose-headings:text-gray-900
						prose-headings:mt-4 prose-headings:mb-1.5
						prose-strong:text-gray-900 prose-strong:font-semibold
						prose-p:my-2 prose-p:leading-7
						prose-ul:my-1 prose-li:my-0.5
					"
				>
					<ReactMarkdown
						components={{
							p: ({ children }) => (
								<p>{renderWithCitationSuperscripts(children, citations)}</p>
							),
							li: ({ children }) => (
								<li>{renderWithCitationSuperscripts(children, citations)}</li>
							),
						}}
					>
						{processed}
					</ReactMarkdown>
				</div>

				{citations.length > 0 && (
					<div className="mt-4 pt-3 border-t border-gray-200">
						<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
							出典
						</p>
						<ol className="space-y-1 list-none p-0 m-0">
							{citations.map((c, i) => (
								<li
									key={c.url}
									className="flex gap-2 items-start text-xs text-gray-500"
								>
									<span className="shrink-0 font-semibold text-gray-400 tabular-nums">
										[{i + 1}]
									</span>
									{sanitizeUrl(c.url) && (
										<a
											href={sanitizeUrl(c.url)}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-500 hover:text-blue-700 hover:underline break-all leading-5"
										>
											{c.sourceName}
										</a>
									)}
								</li>
							))}
						</ol>
					</div>
				)}
			</div>

			{needsTruncation && (
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
				>
					{isExpanded ? (
						<>
							Show less <ChevronUp size={14} />
						</>
					) : (
						<>
							Show more <ChevronDown size={14} />
						</>
					)}
				</button>
			)}
		</div>
	)
}

function renderWithCitationSuperscripts(
	children: React.ReactNode,
	citations: Citation[],
): React.ReactNode {
	if (typeof children === "string") {
		return splitWithCitations(children, citations)
	}
	if (Array.isArray(children)) {
		return children.map((child, i) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: static render, no reorder
			<span key={i}>{renderWithCitationSuperscripts(child, citations)}</span>
		))
	}
	return children
}

function splitWithCitations(
	text: string,
	citations: Citation[],
): React.ReactNode {
	const parts = text.split(/(\[\d+\])/g)
	if (parts.length === 1) return text
	return parts.map((part, i) => {
		const match = part.match(/^\[(\d+)\]$/)
		if (match) {
			const idx = Number.parseInt(match[1], 10) - 1
			const citation = citations[idx]
			const safeUrl = citation ? sanitizeUrl(citation.url) : undefined
			return safeUrl ? (
				// biome-ignore lint/suspicious/noArrayIndexKey: static render, no reorder
				<a
					key={i}
					href={safeUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="no-underline"
				>
					<sup className="text-blue-500 font-medium text-[10px] ml-0.5 hover:text-blue-700">
						[{match[1]}]
					</sup>
				</a>
			) : (
				// biome-ignore lint/suspicious/noArrayIndexKey: static render, no reorder
				<sup key={i} className="text-blue-500 font-medium text-[10px] ml-0.5">
					[{match[1]}]
				</sup>
			)
		}
		return part
	})
}
