import { createElement } from "react"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import { QueryReportView } from "@/components/scenario/report/query/QueryReportView"
import type { QueryReportData } from "@/types/query-report"

function getReportStyles(): string {
	return Array.from(document.styleSheets)
		.map((sheet) => {
			try {
				return Array.from(sheet.cssRules)
					.map((rule) => rule.cssText)
					.join("\n")
			} catch {
				return sheet.href ? `@import url("${sheet.href}")` : ""
			}
		})
		.join("\n")
}

const PRINT_CSS = `
	@page { margin: 10mm 15mm; }
	@media print {
	  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
	  thead { display: table-header-group; }
	  section { break-inside: auto; page-break-inside: auto; }
	  section[id^="query-s"] {
	    break-before: page;
	    page-break-before: always;
	  }
	  article, tr, summary, li { break-inside: avoid; page-break-inside: avoid; }
	  details { break-inside: auto; page-break-inside: auto; }
	  #query-s05 [class*="rounded"][class*="border"],
	  #query-s05 .grid > *,
	  #query-s06 [class*="rounded"][class*="border"],
	  #query-s07 tr {
	    break-inside: avoid;
	    page-break-inside: avoid;
	  }
	  #query-s05 details { overflow: visible !important; }
	  h1, h2, h3, h4, p {
	    orphans: 3;
	    widows: 3;
	  }
	  .overflow-x-auto, .overflow-hidden { overflow: visible !important; }
	  table { width: 100% !important; min-width: 0 !important; table-layout: fixed !important; }
	  th, td { white-space: normal !important; overflow-wrap: anywhere !important; word-break: normal !important; }
	  a { color: #2563eb !important; text-decoration: underline !important; }
	  .border-t.border-gray-100 { display: none !important; }
	  .query-report-print-toc { break-inside: avoid; page-break-inside: avoid; }
	  .query-report-print-toc a { text-decoration: none !important; }
	  .query-report-screen-link-icon { display: none !important; }
	  .query-report-print-link { display: inline !important; }
	  #query-s07 table { font-size: 10px !important; line-height: 1.35 !important; }
	  #query-s07 th, #query-s07 td { padding: 5px 6px !important; vertical-align: top !important; }
	  #query-s07 th:nth-child(1), #query-s07 td:nth-child(1) { width: 18% !important; }
	  #query-s07 th:nth-child(2), #query-s07 td:nth-child(2) { width: 24% !important; }
	  #query-s07 th:nth-child(3), #query-s07 td:nth-child(3) { width: 14% !important; }
	  #query-s07 th:nth-child(4), #query-s07 td:nth-child(4) { width: 18% !important; }
	  #query-s07 th:nth-child(5), #query-s07 td:nth-child(5) { width: 12% !important; }
	  #query-s07 th:nth-child(6), #query-s07 td:nth-child(6) { width: 8% !important; text-align: center !important; }
	  #query-s07 .whitespace-nowrap { white-space: normal !important; }
	  body::after {
	    content: "Memory AI により作成";
    position: fixed;
    bottom: 6mm;
    right: 10mm;
    font-size: 8px;
    font-family: monospace;
    color: #9ca3af;
    letter-spacing: 0.04em;
  }
}
`

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
}

function buildReportHtml(innerHTML: string, styles: string, title: string) {
	return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${styles}${PRINT_CSS}</style></head><body style="margin:0;padding:24px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif">${innerHTML}</body></html>`
}

function safeFileName(value: string) {
	return value.trim().replace(/[\\/:*?"<>|]/g, "_") || "query_report"
}

function renderQueryReportHtml(data: QueryReportData): string {
	const container = document.createElement("div")
	container.style.cssText =
		"position:absolute;left:-9999px;top:-9999px;width:900px"
	document.body.appendChild(container)

	const root = createRoot(container)
	flushSync(() => {
		root.render(
			createElement(QueryReportView, {
				data,
				isExpanded: true,
				printMode: true,
			}),
		)
	})

	const html = container.innerHTML
	root.unmount()
	document.body.removeChild(container)
	return html
}

function printWhenReady(win: Window) {
	const startPrint = () => {
		win.requestAnimationFrame(() => {
			win.requestAnimationFrame(() => {
				if (win.closed) return

				const fallbackClose = win.setTimeout(() => {
					if (!win.closed) win.close()
				}, 30000)

				win.addEventListener(
					"afterprint",
					() => {
						win.clearTimeout(fallbackClose)
						if (!win.closed) win.close()
					},
					{ once: true },
				)

				win.focus()
				win.print()
			})
		})
	}

	if (win.document.readyState === "complete") {
		startPrint()
	} else {
		win.addEventListener("load", startPrint, { once: true })
	}
}

export function downloadQueryReportAsPdf(
	data: QueryReportData | null | undefined,
	win: Window | null,
) {
	if (!data || !win) return

	const innerHTML = renderQueryReportHtml(data)
	const title = data.theme || "Query Report"
	win.document.open()
	win.document.write(buildReportHtml(innerHTML, getReportStyles(), title))
	win.document.close()
	printWhenReady(win)
}

export function downloadQueryReportAsHtml(
	data: QueryReportData | null | undefined,
) {
	if (!data) return

	const title = data.theme || "Query Report"
	const innerHTML = renderQueryReportHtml(data)
	const html = buildReportHtml(innerHTML, getReportStyles(), title)
	const blob = new Blob([html], { type: "text/html;charset=utf-8" })
	const url = URL.createObjectURL(blob)
	const link = document.createElement("a")
	const date = new Date().toISOString().split("T")[0]
	link.href = url
	link.download = `${safeFileName(title)}_query_report_${date}.html`
	link.click()
	URL.revokeObjectURL(url)
}
