import { useTranslation } from "react-i18next"

export type ThemeReportSectionId =
	| "theme-s01"
	| "theme-s02"
	| "theme-s03"
	| "theme-s04"
	| "theme-s05"
	| "theme-s06"
	| "theme-s07"
	| "theme-s08"

type ThemeReportLabels = {
	contents: string
	readingGuide: string
	sections: Array<{
		id: ThemeReportSectionId
		num: string
		label: string
		labelFull: string
	}>
	guideGroups: Array<{ label: string; text: string }>
	s02: {
		advantages: string
		customers: string
	}
	s03: {
		forecastComparison: string
		agency: string
		marketForecast: string
		forecastYear: string
		sam: string
		samCaveatAria: string
		measuredLegend: string
		estimatedLegend: string
		assumedLegend: string
		dataSource: string
		value: string
		note: string
	}
	s05: {
		currentIssues: string
		approach: string
		limitation: string
		barrierType: string
	}
	s06: {
		currentLimit: string
		solution: string
	}
	s07: {
		collapseLiterature: string
		showLiterature: string
		reviewPapers: string
		keyPapers: string
		patents: string
		trlDefinition: string
		level: string
		title: string
		definition: string
		bands: string[]
	}
	s08: {
		tabs: {
			competitors: string
			collaborators: string
			researchers: string
		}
		tableHeaders: {
			competitors: readonly string[]
			collaborators: readonly string[]
			researchers: readonly string[]
		}
	}
}

const JA_LABELS: ThemeReportLabels = {
	contents: "目次",
	readingGuide: "読み方ガイド",
	sections: [
		{ id: "theme-s01", num: "01", label: "背景", labelFull: "シナリオの背景" },
		{ id: "theme-s02", num: "02", label: "定義", labelFull: "シナリオの定義" },
		{ id: "theme-s03", num: "03", label: "市場", labelFull: "市場規模予測" },
		{
			id: "theme-s04",
			num: "04",
			label: "規制",
			labelFull: "規制・制度上の課題",
		},
		{ id: "theme-s05", num: "05", label: "現状", labelFull: "現状アプローチ" },
		{ id: "theme-s06", num: "06", label: "優位性", labelFull: "技術の優位性" },
		{ id: "theme-s07", num: "07", label: "TRL", labelFull: "技術の成熟度" },
		{
			id: "theme-s08",
			num: "08",
			label: "プレイヤー",
			labelFull: "プレイヤー分析",
		},
	],
	guideGroups: [
		{
			label: "I",
			text: "セクション01〜04では、本シナリオの社会的要請（01）、本技術が何を実現するか（02）、市場規模（03）、商業展開を阻む規制の壁（04）を順に把握できます。この4セクションを読むことで、なぜ今この技術が必要とされ、どの市場が取れるかの全体像が見えます。",
		},
		{
			label: "II",
			text: "セクション05〜07では、現行手法の限界（05）、本技術による突破口（06）、各要素技術の成熟段階（07）を示します。競合技術との差分と参入タイミングの妥当性をここで判断できます。",
		},
		{
			label: "III",
			text: "セクション08では、エコシステムの主要プレイヤーを俯瞰します。競合企業・共同研究機関・主要研究者の3軸で「誰がいるか」の土地勘を得ることが目的です。",
		},
	],
	s02: {
		advantages: "優位性",
		customers: "想定顧客",
	},
	s03: {
		forecastComparison: "主要市場予測の比較",
		agency: "調査機関",
		marketForecast: "市場規模予測",
		forecastYear: "予測年",
		sam: "SAM — 獲得可能な市場",
		samCaveatAria: "SAM 試算の補足",
		measuredLegend: "実測値（国際機関・査読論文の観測データ）",
		estimatedLegend: "推計値（市場調査機関のモデル推計）",
		assumedLegend: "想定値（独自試算・前提条件あり）",
		dataSource: "データソース",
		value: "数値",
		note: "備考",
	},
	s05: {
		currentIssues: "現状の課題",
		approach: "アプローチ",
		limitation: "限界・課題",
		barrierType: "障壁タイプ",
	},
	s06: {
		currentLimit: "現状手法の限界",
		solution: "本技術による解決",
	},
	s07: {
		collapseLiterature: "文献を折りたたむ",
		showLiterature: "文献を表示",
		reviewPapers: "レビュー論文",
		keyPapers: "代表論文",
		patents: "特許",
		trlDefinition: "EU TRL 定義 (TRL 1〜9)",
		level: "レベル",
		title: "タイトル",
		definition: "定義",
		bands: [
			"TRL 6.0以上 (実証済)",
			"TRL 4.0〜5.9 (関連環境実証)",
			"TRL 3.9以下 (概念実証)",
		],
	},
	s08: {
		tabs: {
			competitors: "競合企業",
			collaborators: "協力機関",
			researchers: "主要研究者",
		},
		tableHeaders: {
			competitors: ["企業名", "国", "主な製品", "注目ポイント"],
			collaborators: ["機関名", "種類", "関連領域", "注目ポイント"],
			researchers: ["氏名", "所属", "専門", "注目ポイント"],
		},
	},
}

const EN_LABELS: ThemeReportLabels = {
	contents: "Contents",
	readingGuide: "Reading Guide",
	sections: [
		{
			id: "theme-s01",
			num: "01",
			label: "Background",
			labelFull: "Scenario Background",
		},
		{
			id: "theme-s02",
			num: "02",
			label: "Definition",
			labelFull: "Scenario Definition",
		},
		{
			id: "theme-s03",
			num: "03",
			label: "Market",
			labelFull: "Market Size Projection",
		},
		{
			id: "theme-s04",
			num: "04",
			label: "Regulation",
			labelFull: "Regulatory & Institutional Challenges",
		},
		{
			id: "theme-s05",
			num: "05",
			label: "Approaches",
			labelFull: "Current Approaches",
		},
		{
			id: "theme-s06",
			num: "06",
			label: "Advantages",
			labelFull: "Technology Advantages",
		},
		{
			id: "theme-s07",
			num: "07",
			label: "TRL",
			labelFull: "Technology Readiness Level",
		},
		{
			id: "theme-s08",
			num: "08",
			label: "Players",
			labelFull: "Player Analysis",
		},
	],
	guideGroups: [
		{
			label: "I",
			text: "Sections 01-04 cover the social need behind the scenario, what the technology enables, market size, and regulatory barriers to commercialization. Together they frame why this technology matters now and which markets it can address.",
		},
		{
			label: "II",
			text: "Sections 05-07 connect the limits of current approaches, the breakthrough enabled by this technology, and the maturity of each technical element. Use this group to judge differentiation and entry timing.",
		},
		{
			label: "III",
			text: "Section 08 maps the ecosystem across competitors, collaborators, and key researchers so you can quickly understand who is active in the space.",
		},
	],
	s02: {
		advantages: "Advantages",
		customers: "Target Customers",
	},
	s03: {
		forecastComparison: "Market Forecast Comparison",
		agency: "Research Firm",
		marketForecast: "Market Forecast",
		forecastYear: "Forecast Year",
		sam: "SAM — Serviceable Available Market",
		samCaveatAria: "SAM estimate note",
		measuredLegend:
			"Measured data from international organizations or peer-reviewed observations",
		estimatedLegend: "Estimated data from market research models",
		assumedLegend:
			"Assumed values based on proprietary estimates or stated assumptions",
		dataSource: "Sources",
		value: "Value",
		note: "Notes",
	},
	s05: {
		currentIssues: "Current Issues",
		approach: "Approach",
		limitation: "Limitations / Issues",
		barrierType: "Barrier Type",
	},
	s06: {
		currentLimit: "Current Approach Limitation",
		solution: "Solution Enabled by This Technology",
	},
	s07: {
		collapseLiterature: "Collapse literature",
		showLiterature: "Show literature",
		reviewPapers: "Review Papers",
		keyPapers: "Key Papers",
		patents: "Patents",
		trlDefinition: "EU TRL Definitions (TRL 1-9)",
		level: "Level",
		title: "Title",
		definition: "Definition",
		bands: [
			"TRL 6.0+ (demonstrated)",
			"TRL 4.0-5.9 (validated in relevant environment)",
			"TRL 3.9 or below (proof of concept)",
		],
	},
	s08: {
		tabs: {
			competitors: "Competitors",
			collaborators: "Collaborators",
			researchers: "Key Researchers",
		},
		tableHeaders: {
			competitors: ["Company", "Country", "Main Products", "Key Points"],
			collaborators: ["Institution", "Type", "Related Area", "Key Points"],
			researchers: ["Name", "Affiliation", "Specialty", "Key Points"],
		},
	},
}

export function getThemeReportLabels(language: string): ThemeReportLabels {
	return language === "en" ? EN_LABELS : JA_LABELS
}

export function useThemeReportLabels(): ThemeReportLabels {
	const { i18n } = useTranslation()
	return getThemeReportLabels(i18n.language)
}
