import type { ScenarioReportData } from "@/types/report"

type PptxGenJS = any
type Slide = any
type TableCell = any
/* eslint-enable @typescript-eslint/no-explicit-any */

// Load pptxgenjs from browser bundle (avoids node:fs webpack error)
let _pptxLoaded = false
function loadPptxGenJS(): Promise<void> {
	if (_pptxLoaded && (window as any).PptxGenJS) return Promise.resolve()
	return new Promise((resolve, reject) => {
		if ((window as any).PptxGenJS) {
			_pptxLoaded = true
			resolve()
			return
		}
		const script = document.createElement("script")
		script.src = "/pptxgen.bundle.js"
		script.onload = () => {
			_pptxLoaded = true
			resolve()
		}
		script.onerror = () => reject(new Error("Failed to load pptxgenjs"))
		document.head.appendChild(script)
	})
}

// ── Design tokens (from 雛形.pptx) ──────────────────
const PRIMARY = "040446"
const ACCENT = "D3FE8A"
const WHITE = "FFFFFF"
const GRAY = "666666"
const LIGHT_GRAY = "F5F5F5"
const FONT_JP = "MS Gothic"
const FONT_EN = "Arial"
const SLIDE_W = 10.0
const SLIDE_H = 5.63
const MARGIN_L = 0.32 // ~288300 EMU
const MARGIN_T = 0.23
const CONTENT_T = 0.85 // below title + line
const CONTENT_W = SLIDE_W - MARGIN_L * 2
const FOOTER_TEXT = "Copyright \u00A9 2023 MEMORY LAB Inc. All Rights Reserved."
// Logo: 2048x2048 square PNG, displayed at template ratio
const LOGO_W = 1.2
const LOGO_H = 1.2

function addFooter(slide: Slide) {
	// Separator line
	slide.addShape("line", {
		x: MARGIN_L,
		y: SLIDE_H - 0.45,
		w: CONTENT_W,
		h: 0,
		line: { color: PRIMARY, width: 0.75 },
	})
	// Copyright
	slide.addText(FOOTER_TEXT, {
		x: MARGIN_L,
		y: SLIDE_H - 0.38,
		w: CONTENT_W,
		h: 0.25,
		fontSize: 7,
		fontFace: FONT_EN,
		color: PRIMARY,
	})
}

function addPageNumber(slide: Slide, slideNum: number) {
	slide.addText(String(slideNum), {
		x: SLIDE_W - 0.8,
		y: SLIDE_H - 0.38,
		w: 0.5,
		h: 0.25,
		fontSize: 8,
		fontFace: FONT_EN,
		color: GRAY,
		align: "right",
	})
}

function addTitle(slide: Slide, title: string) {
	slide.addText(title, {
		x: MARGIN_L,
		y: MARGIN_T,
		w: CONTENT_W,
		h: 0.5,
		fontSize: 18,
		fontFace: FONT_JP,
		color: PRIMARY,
		bold: true,
		shrinkText: true,
	})
	// Title underline
	slide.addShape("line", {
		x: MARGIN_L,
		y: 0.78,
		w: CONTENT_W,
		h: 0,
		line: { color: PRIMARY, width: 0.75 },
	})
}

// Slide counter for page numbers (cover + section dividers excluded)
let _slideCounter = 0

function addContentSlide(pptx: PptxGenJS, title: string): Slide {
	_slideCounter++
	const slide = pptx.addSlide()
	addTitle(slide, title)
	addFooter(slide)
	addPageNumber(slide, _slideCounter)
	return slide
}

function addSectionDivider(
	pptx: PptxGenJS,
	subtitle: string,
	title: string,
	description?: string,
) {
	const slide = pptx.addSlide()
	// Right half dark background
	slide.addShape("rect", {
		x: SLIDE_W / 2,
		y: 0,
		w: SLIDE_W / 2,
		h: SLIDE_H,
		fill: { color: PRIMARY },
	})
	// Subtitle (left side, English)
	slide.addText(subtitle, {
		x: 0.6,
		y: 1.6,
		w: 3.6,
		h: 0.4,
		fontSize: 12,
		fontFace: FONT_EN,
		color: GRAY,
	})
	// Title (left side)
	slide.addText(title, {
		x: 0.6,
		y: 2.0,
		w: 3.6,
		h: 0.7,
		fontSize: 22,
		fontFace: FONT_JP,
		color: PRIMARY,
		bold: true,
	})
	if (description) {
		slide.addText(description, {
			x: 0.6,
			y: 2.7,
			w: 3.6,
			h: 1.8,
			fontSize: 10,
			fontFace: FONT_EN,
			color: GRAY,
			valign: "top",
		})
	}
	addFooter(slide)
}

function formatCurrency(value: number | null | undefined): string {
	if (value == null || !Number.isFinite(value)) return "\u2014"
	if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
	if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
	if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
	return `$${value}`
}

// ── Slide builders ──────────────────────────────────

function buildCoverSlide(pptx: PptxGenJS, data: ScenarioReportData) {
	const slide = pptx.addSlide()
	// Full background
	slide.addShape("rect", {
		x: 0,
		y: 0,
		w: SLIDE_W,
		h: SLIDE_H,
		fill: { color: PRIMARY },
	})
	// Logo (square image, preserve aspect ratio)
	slide.addImage({
		path: "/memorylab_logo.png",
		x: 0.6,
		y: 3.6,
		w: LOGO_W,
		h: LOGO_H,
	})
	// Title
	slide.addText(data.title, {
		x: MARGIN_L,
		y: 0.6,
		w: 6.4,
		h: 1.0,
		fontSize: 28,
		fontFace: FONT_JP,
		color: WHITE,
		bold: true,
	})
	// Subtitle
	slide.addText(data.subtitle ?? "Scenario Report", {
		x: MARGIN_L,
		y: 1.6,
		w: 6.4,
		h: 0.5,
		fontSize: 14,
		fontFace: FONT_EN,
		color: ACCENT,
	})
	// Date
	const today = new Date().toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "long",
		day: "numeric",
	})
	slide.addText(today, {
		x: 6.9,
		y: SLIDE_H - 0.6,
		w: 3.0,
		h: 0.4,
		fontSize: 11,
		fontFace: FONT_JP,
		color: ACCENT,
		align: "right",
	})
	// Footer
	slide.addText(FOOTER_TEXT, {
		x: MARGIN_L,
		y: SLIDE_H - 0.3,
		w: CONTENT_W,
		h: 0.2,
		fontSize: 7,
		fontFace: FONT_EN,
		color: ACCENT,
	})
}

function buildExecutiveSummarySlide(pptx: PptxGenJS, data: ScenarioReportData) {
	const narrative = data.executiveSummary.narrative
	if (!narrative) return

	addSectionDivider(pptx, "SECTION 01", "Executive Summary")

	// Narrative slide
	const slide = addContentSlide(
		pptx,
		"\u30A8\u30B0\u30BC\u30AF\u30C6\u30A3\u30D6\u30B5\u30DE\u30EA\u30FC",
	)
	slide.addText(narrative, {
		x: MARGIN_L,
		y: CONTENT_T,
		w: CONTENT_W,
		h: SLIDE_H - CONTENT_T - 0.6,
		fontSize: 10,
		fontFace: FONT_JP,
		color: "333333",
		valign: "top",
		lineSpacingMultiple: 1.4,
	})

	// KPI summary cards slide
	if (data.kpiItems?.length) {
		const kpiSlide = addContentSlide(pptx, "\u6982\u8981\u6307\u6A19")
		const cols = Math.min(data.kpiItems.length, 4)
		const cardW = (CONTENT_W - 0.2 * (cols - 1)) / cols
		data.kpiItems.slice(0, 8).forEach((kpi, i) => {
			const col = i % cols
			const row = Math.floor(i / cols)
			const x = MARGIN_L + col * (cardW + 0.2)
			const y = CONTENT_T + row * 1.3
			kpiSlide.addShape("rect", {
				x,
				y,
				w: cardW,
				h: 1.1,
				fill: { color: LIGHT_GRAY },
				rectRadius: 0.08,
			})
			kpiSlide.addText(kpi.label, {
				x: x + 0.1,
				y: y + 0.08,
				w: cardW - 0.2,
				h: 0.28,
				fontSize: 9,
				fontFace: FONT_JP,
				color: GRAY,
				bold: true,
			})
			kpiSlide.addText(kpi.value, {
				x: x + 0.1,
				y: y + 0.38,
				w: cardW - 0.2,
				h: 0.55,
				fontSize: 16,
				fontFace: FONT_EN,
				color: PRIMARY,
				bold: true,
				shrinkText: true,
			})
		})
	}

	// TAM vs SAM comparison bar chart in summary
	const m = data.market
	if (m.tamNumber && m.samNumber) {
		const chartSlide = addContentSlide(
			pptx,
			"\u5E02\u5834\u898F\u6A21\u6982\u8981",
		)
		chartSlide.addChart(
			"bar",
			[
				{
					name: "\u5E02\u5834\u898F\u6A21",
					labels: ["TAM", "SAM"],
					values: [m.tamNumber, m.samNumber],
				},
			],
			{
				x: MARGIN_L,
				y: CONTENT_T,
				w: CONTENT_W * 0.6,
				h: SLIDE_H - CONTENT_T - 0.7,
				showValue: true,
				dataLabelFontSize: 10,
				dataLabelFontFace: FONT_EN,
				dataLabelColor: WHITE,
				dataLabelPosition: "inEnd",
				catAxisLabelFontSize: 11,
				catAxisLabelFontFace: FONT_EN,
				catAxisLabelColor: "333333",
				valAxisLabelFontSize: 8,
				valAxisLabelFontFace: FONT_EN,
				valAxisLabelColor: "666666",
				chartColors: [PRIMARY],
				valAxisNumFmt: "$#,##0,,M",
			},
		)
		// Text annotations on right
		const infoX = MARGIN_L + CONTENT_W * 0.65
		const infoW = CONTENT_W * 0.33
		const items = [
			{
				label: "TAM",
				value: m.globalTam?.value ?? formatCurrency(m.tamNumber),
			},
			{
				label: "SAM",
				value: m.globalSam?.value ?? formatCurrency(m.samNumber),
			},
			{ label: "CAGR", value: m.globalCagr?.value || "\u2014" },
		]
		items.forEach((item, i) => {
			chartSlide.addText(item.label, {
				x: infoX,
				y: CONTENT_T + 0.1 + i * 0.9,
				w: infoW,
				h: 0.25,
				fontSize: 10,
				fontFace: FONT_EN,
				color: GRAY,
				bold: true,
			})
			chartSlide.addText(String(item.value), {
				x: infoX,
				y: CONTENT_T + 0.35 + i * 0.9,
				w: infoW,
				h: 0.4,
				fontSize: 16,
				fontFace: FONT_EN,
				color: PRIMARY,
				bold: true,
				shrinkText: true,
			})
		})
	}
}

function buildMarketSlides(pptx: PptxGenJS, data: ScenarioReportData) {
	const m = data.market
	if (!m.globalTam?.value && !m.globalSam?.value && !m.rawSummary) return

	addSectionDivider(
		pptx,
		"SECTION 02",
		"\u5E02\u5834\u5206\u6790",
		"Market Analysis",
	)

	// KPI cards slide (no rawSummary on this slide to avoid overlap)
	const slide = addContentSlide(pptx, "\u5E02\u5834\u898F\u6A21")
	const cards = [
		{
			label: "TAM",
			value: m.globalTam?.value ?? formatCurrency(m.tamNumber),
			desc: m.globalTam?.description ?? "",
		},
		{
			label: "SAM",
			value: m.globalSam?.value ?? formatCurrency(m.samNumber),
			desc: m.globalSam?.description ?? "",
		},
		{
			label: "CAGR",
			value:
				typeof m.globalCagr === "object"
					? m.globalCagr?.value
					: m.globalCagr || "\u2014",
			desc: "",
		},
	]

	cards.forEach((card, i) => {
		const x = MARGIN_L + i * 3.1
		slide.addShape("rect", {
			x,
			y: CONTENT_T,
			w: 2.9,
			h: 1.6,
			fill: { color: LIGHT_GRAY },
			rectRadius: 0.08,
		})
		slide.addText(card.label, {
			x: x + 0.15,
			y: CONTENT_T + 0.1,
			w: 2.6,
			h: 0.3,
			fontSize: 10,
			fontFace: FONT_EN,
			color: GRAY,
			bold: true,
		})
		slide.addText(String(card.value), {
			x: x + 0.15,
			y: CONTENT_T + 0.4,
			w: 2.6,
			h: 0.5,
			fontSize: 18,
			fontFace: FONT_EN,
			color: PRIMARY,
			bold: true,
			shrinkText: true,
		})
		if (card.desc) {
			slide.addText(card.desc, {
				x: x + 0.15,
				y: CONTENT_T + 0.95,
				w: 2.6,
				h: 0.55,
				fontSize: 7,
				fontFace: FONT_JP,
				color: GRAY,
				valign: "top",
			})
		}
	})

	// Market summary on its own slide (prevents overlap)
	if (m.rawSummary) {
		const summarySlide = addContentSlide(pptx, "\u5E02\u5834\u6982\u8981")
		summarySlide.addText(m.rawSummary, {
			x: MARGIN_L,
			y: CONTENT_T,
			w: CONTENT_W,
			h: SLIDE_H - CONTENT_T - 0.6,
			fontSize: 9,
			fontFace: FONT_JP,
			color: "333333",
			valign: "top",
			lineSpacingMultiple: 1.3,
		})
	}

	// TAM vs SAM bar chart
	if (m.tamNumber || m.samNumber) {
		const chartSlide = addContentSlide(pptx, "TAM / SAM \u6BD4\u8F03")
		chartSlide.addChart(
			"bar",
			[
				{
					name: "\u5E02\u5834\u898F\u6A21",
					labels: ["TAM", "SAM"],
					values: [m.tamNumber || 0, m.samNumber || 0],
				},
			],
			{
				x: MARGIN_L,
				y: CONTENT_T,
				w: CONTENT_W,
				h: SLIDE_H - CONTENT_T - 0.7,
				showValue: true,
				dataLabelFontSize: 10,
				dataLabelFontFace: FONT_EN,
				dataLabelColor: WHITE,
				dataLabelPosition: "inEnd",
				catAxisLabelFontSize: 11,
				catAxisLabelFontFace: FONT_EN,
				catAxisLabelColor: "333333",
				valAxisLabelFontSize: 8,
				valAxisLabelFontFace: FONT_EN,
				valAxisLabelColor: "666666",
				chartColors: [PRIMARY],
				valAxisNumFmt: "$#,##0,,M",
			},
		)
	}

	// Market segments pie chart
	if (m.segments?.length) {
		const segSlide = addContentSlide(
			pptx,
			"\u30DE\u30FC\u30B1\u30C3\u30C8\u30BB\u30B0\u30E1\u30F3\u30C8",
		)
		const segColors = [
			"040446",
			"1A237E",
			"283593",
			"3949AB",
			"5C6BC0",
			"7986CB",
			"9FA8DA",
			"C5CAE9",
		]
		segSlide.addChart(
			"pie",
			[
				{
					name: "\u30BB\u30B0\u30E1\u30F3\u30C8",
					labels: m.segments.map((s) => s.segment_name),
					values: m.segments.map((s) => s.share_percent),
				},
			],
			{
				x: MARGIN_L,
				y: CONTENT_T,
				w: CONTENT_W * 0.55,
				h: SLIDE_H - CONTENT_T - 0.7,
				showPercent: true,
				showLegend: true,
				legendPos: "b",
				legendFontSize: 8,
				legendFontFace: FONT_JP,
				dataLabelFontSize: 9,
				dataLabelFontFace: FONT_EN,
				dataLabelColor: WHITE,
				chartColors: segColors.slice(0, m.segments.length),
			},
		)
		// Segment details table on right
		const tblX = MARGIN_L + CONTENT_W * 0.58
		const tblW = CONTENT_W * 0.4
		const segHeader = [
			{
				text: "\u30BB\u30B0\u30E1\u30F3\u30C8",
				options: {
					bold: true,
					fontSize: 8,
					color: WHITE,
					fill: { color: PRIMARY },
				},
			},
			{
				text: "%",
				options: {
					bold: true,
					fontSize: 8,
					color: WHITE,
					fill: { color: PRIMARY },
					align: "center" as const,
				},
			},
			{
				text: "\u898F\u6A21",
				options: {
					bold: true,
					fontSize: 8,
					color: WHITE,
					fill: { color: PRIMARY },
					align: "center" as const,
				},
			},
		] as TableCell[]
		const segRows = m.segments.map(
			(s) =>
				[
					{ text: s.segment_name, options: { fontSize: 7 } },
					{
						text: `${s.share_percent}%`,
						options: { fontSize: 7, align: "center" as const },
					},
					{
						text: s.estimated_size,
						options: { fontSize: 7, align: "center" as const },
					},
				] as TableCell[],
		)
		segSlide.addTable([segHeader, ...segRows], {
			x: tblX,
			y: CONTENT_T,
			w: tblW,
			colW: [tblW * 0.45, tblW * 0.2, tblW * 0.35],
			fontSize: 7,
			fontFace: FONT_JP,
			color: "333333",
			border: { type: "solid", pt: 0.5, color: "CCCCCC" },
			rowH: 0.28,
		})
	}
}

function buildTrlSlides(pptx: PptxGenJS, data: ScenarioReportData) {
	const scores = data.trl.scores
	if (!scores || scores.length === 0) return

	addSectionDivider(
		pptx,
		"SECTION 03",
		"TRL\u5206\u6790",
		"Technology Readiness Level",
	)

	// TRL scores table
	const slide = addContentSlide(pptx, "TRL\u30B9\u30B3\u30A2")

	const headerRow = [
		{
			text: "\u6280\u8853\u540D",
			options: {
				bold: true,
				fontSize: 9,
				color: WHITE,
				fill: { color: PRIMARY },
			},
		},
		{
			text: "\u7DCF\u5408TRL",
			options: {
				bold: true,
				fontSize: 9,
				color: WHITE,
				fill: { color: PRIMARY },
			},
		},
		{
			text: "\u8AD6\u6587TRL",
			options: {
				bold: true,
				fontSize: 9,
				color: WHITE,
				fill: { color: PRIMARY },
			},
		},
		{
			text: "\u7279\u8A31TRL",
			options: {
				bold: true,
				fontSize: 9,
				color: WHITE,
				fill: { color: PRIMARY },
			},
		},
		{
			text: "\u5E02\u5834TRL",
			options: {
				bold: true,
				fontSize: 9,
				color: WHITE,
				fill: { color: PRIMARY },
			},
		},
		{
			text: "\u5206\u985E",
			options: {
				bold: true,
				fontSize: 9,
				color: WHITE,
				fill: { color: PRIMARY },
			},
		},
	] as TableCell[]

	const dataRows = scores.slice(0, 12).map(
		(s: any) =>
			[
				{ text: String(s.technology_name ?? ""), options: { fontSize: 8 } },
				{
					text: String(s.integrated_trl ?? "\u2014"),
					options: { fontSize: 8, align: "center" as const },
				},
				{
					text: String(s.article_trl ?? "\u2014"),
					options: { fontSize: 8, align: "center" as const },
				},
				{
					text: String(s.patent_trl ?? "\u2014"),
					options: { fontSize: 8, align: "center" as const },
				},
				{
					text: String(s.market_trl ?? "\u2014"),
					options: { fontSize: 8, align: "center" as const },
				},
				{
					text: String(s.category ?? ""),
					options: { fontSize: 8, align: "center" as const },
				},
			] as TableCell[],
	)

	slide.addTable([headerRow, ...dataRows], {
		x: MARGIN_L,
		y: CONTENT_T,
		w: CONTENT_W,
		colW: [3.0, 1.2, 1.2, 1.2, 1.2, 1.6],
		fontSize: 8,
		fontFace: FONT_JP,
		color: "333333",
		border: { type: "solid", pt: 0.5, color: "CCCCCC" },
		rowH: 0.35,
		autoPage: true,
		autoPageRepeatHeader: true,
	})
}

function buildResearchSlides(pptx: PptxGenJS, data: ScenarioReportData) {
	const r = data.research
	if (!r.articleYearlyData?.length && !r.patentYearlyData?.length) return

	addSectionDivider(
		pptx,
		"SECTION 04",
		"\u7814\u7A76\u52D5\u5411",
		"Research Landscape",
	)

	// Article yearly chart
	if (r.articleYearlyData?.length) {
		const slide = addContentSlide(pptx, "\u8AD6\u6587\u52D5\u5411")
		if (r.articleCommentary) {
			slide.addText(r.articleCommentary, {
				x: MARGIN_L,
				y: CONTENT_T,
				w: CONTENT_W,
				h: 0.4,
				fontSize: 10,
				fontFace: FONT_JP,
				color: "333333",
			})
		}
		const chartData = [
			{
				name: "\u8AD6\u6587\u6570",
				labels: r.articleYearlyData.map((d) => String(d.year)),
				values: r.articleYearlyData.map((d) => d.count),
			},
		]
		slide.addChart("bar", chartData, {
			x: MARGIN_L,
			y: CONTENT_T + 0.5,
			w: CONTENT_W,
			h: SLIDE_H - CONTENT_T - 1.2,
			showValue: true,
			dataLabelFontSize: 8,
			dataLabelFontFace: FONT_EN,
			dataLabelColor: PRIMARY,
			catAxisLabelFontSize: 8,
			catAxisLabelFontFace: FONT_EN,
			catAxisLabelColor: "444444",
			valAxisLabelFontSize: 8,
			valAxisLabelFontFace: FONT_EN,
			valAxisLabelColor: "444444",
			chartColors: [PRIMARY],
		})
	}

	// Patent yearly chart
	if (r.patentYearlyData?.length) {
		const slide = addContentSlide(pptx, "\u7279\u8A31\u52D5\u5411")
		if (r.patentCommentary) {
			slide.addText(r.patentCommentary, {
				x: MARGIN_L,
				y: CONTENT_T,
				w: CONTENT_W,
				h: 0.4,
				fontSize: 10,
				fontFace: FONT_JP,
				color: "333333",
			})
		}
		const chartData = [
			{
				name: "\u7279\u8A31\u6570",
				labels: r.patentYearlyData.map((d) => String(d.year)),
				values: r.patentYearlyData.map((d) => d.count),
			},
		]
		slide.addChart("bar", chartData, {
			x: MARGIN_L,
			y: CONTENT_T + 0.5,
			w: CONTENT_W,
			h: SLIDE_H - CONTENT_T - 1.2,
			showValue: true,
			dataLabelFontSize: 8,
			dataLabelFontFace: FONT_EN,
			dataLabelColor: "1B5E20",
			catAxisLabelFontSize: 8,
			catAxisLabelFontFace: FONT_EN,
			catAxisLabelColor: "444444",
			valAxisLabelFontSize: 8,
			valAxisLabelFontFace: FONT_EN,
			valAxisLabelColor: "444444",
			chartColors: ["1B5E20"],
		})
	}

	// Top journals
	if (r.topJournals?.length) {
		const slide = addContentSlide(
			pptx,
			"\u4E3B\u8981\u30B8\u30E3\u30FC\u30CA\u30EB",
		)
		const headerRow = [
			{
				text: "\u30B8\u30E3\u30FC\u30CA\u30EB\u540D",
				options: {
					bold: true,
					fontSize: 9,
					color: WHITE,
					fill: { color: PRIMARY },
				},
			},
			{
				text: "\u8AD6\u6587\u6570",
				options: {
					bold: true,
					fontSize: 9,
					color: WHITE,
					fill: { color: PRIMARY },
					align: "center" as const,
				},
			},
		] as TableCell[]
		const rows = r.topJournals.map(
			(j) =>
				[
					{ text: j.name, options: { fontSize: 8 } },
					{
						text: String(j.count),
						options: { fontSize: 8, align: "center" as const },
					},
				] as TableCell[],
		)
		slide.addTable([headerRow, ...rows], {
			x: MARGIN_L,
			y: CONTENT_T,
			w: CONTENT_W,
			colW: [7.5, 1.9],
			fontSize: 8,
			fontFace: FONT_JP,
			color: "333333",
			border: { type: "solid", pt: 0.5, color: "CCCCCC" },
			rowH: 0.35,
		})
	}
}

function truncateTitle(title: string, maxLen = 40): string {
	if (title.length <= maxLen) return title
	return `${title.slice(0, maxLen - 1)}\u2026`
}

function buildSocialIssuesSlides(pptx: PptxGenJS, data: ScenarioReportData) {
	const si = data.socialIssues
	if (!si.solutions?.length) return

	addSectionDivider(
		pptx,
		"SECTION 05",
		"\u793E\u4F1A\u8AB2\u984C",
		"Social Issues",
	)

	// Each solution on its own slide
	for (const sol of si.solutions) {
		const titleText = truncateTitle(sol.title || "\u793E\u4F1A\u8AB2\u984C")
		const slide = addContentSlide(pptx, titleText)
		slide.addText(sol.text, {
			x: MARGIN_L,
			y: CONTENT_T,
			w: CONTENT_W,
			h: SLIDE_H - CONTENT_T - 0.6,
			fontSize: 9,
			fontFace: FONT_JP,
			color: "333333",
			valign: "top",
			lineSpacingMultiple: 1.3,
		})
	}
}

function buildTechCompetitorsSlides(pptx: PptxGenJS, data: ScenarioReportData) {
	const tc = data.technicalCompetitors
	if (!tc?.length) return

	addSectionDivider(
		pptx,
		"SECTION 06",
		"\u6280\u8853\u7AF6\u5408",
		"Technical Competitors",
	)

	for (const tech of tc) {
		const slide = addContentSlide(pptx, tech.technology_name)
		slide.addText(
			`\u30E6\u30CB\u30FC\u30AF\u4F01\u696D\u6570: ${tech.unique_companies}  |  \u5206\u6790\u4F01\u696D\u6570: ${tech.analyzed_companies}`,
			{
				x: MARGIN_L,
				y: CONTENT_T,
				w: CONTENT_W,
				h: 0.35,
				fontSize: 10,
				fontFace: FONT_JP,
				color: GRAY,
			},
		)

		if (tech.competitors?.length) {
			const headerRow = [
				{
					text: "#",
					options: {
						bold: true,
						fontSize: 9,
						color: WHITE,
						fill: { color: PRIMARY },
						align: "center" as const,
					},
				},
				{
					text: "\u4F01\u696D\u540D",
					options: {
						bold: true,
						fontSize: 9,
						color: WHITE,
						fill: { color: PRIMARY },
					},
				},
				{
					text: "\u56FD",
					options: {
						bold: true,
						fontSize: 9,
						color: WHITE,
						fill: { color: PRIMARY },
						align: "center" as const,
					},
				},
				{
					text: "\u7279\u8A31\u6570",
					options: {
						bold: true,
						fontSize: 9,
						color: WHITE,
						fill: { color: PRIMARY },
						align: "center" as const,
					},
				},
			] as TableCell[]

			const rows = tech.competitors.slice(0, 15).map(
				(c) =>
					[
						{
							text: String(c.rank),
							options: { fontSize: 8, align: "center" as const },
						},
						{ text: c.company_name, options: { fontSize: 8 } },
						{
							text: c.country,
							options: { fontSize: 8, align: "center" as const },
						},
						{
							text: String(c.patent_count),
							options: { fontSize: 8, align: "center" as const },
						},
					] as TableCell[],
			)

			slide.addTable([headerRow, ...rows], {
				x: MARGIN_L,
				y: CONTENT_T + 0.4,
				w: CONTENT_W,
				colW: [0.5, 5.0, 1.5, 1.4],
				fontSize: 8,
				fontFace: FONT_JP,
				color: "333333",
				border: { type: "solid", pt: 0.5, color: "CCCCCC" },
				rowH: 0.32,
				autoPage: true,
				autoPageRepeatHeader: true,
			})
		}
	}
}

function buildEndSlide(pptx: PptxGenJS) {
	const slide = pptx.addSlide()
	slide.addShape("rect", {
		x: 0,
		y: 0,
		w: SLIDE_W,
		h: SLIDE_H,
		fill: { color: PRIMARY },
	})
	slide.addImage({
		path: "/memorylab_logo.png",
		x: (SLIDE_W - 2.0) / 2,
		y: (SLIDE_H - 2.0) / 2,
		w: 2.0,
		h: 2.0,
	})
	slide.addText(FOOTER_TEXT, {
		x: MARGIN_L,
		y: SLIDE_H - 0.3,
		w: CONTENT_W,
		h: 0.2,
		fontSize: 7,
		fontFace: FONT_EN,
		color: ACCENT,
	})
}

// ── Main export ─────────────────────────────────────

export async function generateReportPptx(
	data: ScenarioReportData,
): Promise<void> {
	await loadPptxGenJS()
	const PptxGenJSClass = (window as any).PptxGenJS
	const pptx = new PptxGenJSClass()
	pptx.defineLayout({ name: "MEMORY", width: SLIDE_W, height: SLIDE_H })
	pptx.layout = "MEMORY"
	pptx.author = "MemoryAI"
	pptx.subject = data.title
	_slideCounter = 0 // reset page counter

	buildCoverSlide(pptx, data)
	buildExecutiveSummarySlide(pptx, data)
	buildMarketSlides(pptx, data)
	buildTrlSlides(pptx, data)
	buildResearchSlides(pptx, data)
	buildSocialIssuesSlides(pptx, data)
	buildTechCompetitorsSlides(pptx, data)
	buildEndSlide(pptx)

	const fileName = `${data.title.replace(/[\\/:*?"<>|]/g, "_")}_report.pptx`
	await pptx.writeFile({ fileName })
}
