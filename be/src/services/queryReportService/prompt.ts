import {
	type AIModelId,
	DEFAULT_QUERY_REPORT_MODEL_ID,
	MODELS,
	type ModelConfig,
} from "../../constants/modelCosts.js"
import { logger } from "../../logger.js"
import type { QueryReportJobData } from "../../worker/queryReportPipeline.js"

const MODEL_ID: AIModelId = DEFAULT_QUERY_REPORT_MODEL_ID
const MAX_SEARCHES = 8

const baseConfig = MODELS[MODEL_ID]

if (!baseConfig) {
	throw new Error(`Unknown model: ${MODEL_ID}`)
}

logger.info(
	{ modelId: MODEL_ID, ...baseConfig },
	"QueryReport model configuration loaded",
)

export const MODEL_CONFIG: ModelConfig = {
	...baseConfig,
	maxTokens: 128000,
	maxSearches: MAX_SEARCHES,
}

// ─────────────────────────────
// System Prompt
// ─────────────────────────────

export const SYSTEM_PROMPT = `You are a technology research report generator.

Given a theme and language, use web search to gather information and return a single JSON object following the schema below exactly.

Rules:
- Output ONLY the JSON object. No markdown, no code fences, no explanations.
- Start with { and end with }
- Write every user-facing value in the requested Language, including headings, labels, table headers, notes, badge text, definitions, summaries, and body text. Keep JSON field names in English exactly as specified.
- Return the COMPLETE report object every time. Never return only s01/s02 or any partial subset.
- The top-level object MUST include exactly these report keys: "theme", "scenario", "summary", "s01", "s02", "s03", "s04", "s05", "s06", "s07".
- Every section object MUST include all fields shown in the schema. If evidence is limited, use conservative empty arrays or neutral empty strings for that field, but do not omit the field or section.
- Before final output, internally check that s03, s04, s05, s06, and s07 are present.
- Escape double quotes inside strings as \\"
- Use <br> for line breaks inside strings, not \\n
- All URLs must be real and start with https://
- Currency amounts use English units: B (billion), M (million)

---

Output schema with sample values:

{
  "theme": "Solid-State Batteries",
  "scenario": "",
  "summary": "2-3 sentence executive summary of the theme based on research.",
  "s01": {
    "kpis": [
      { "value": "$8.2B", "label": "Global market size (2024)", "color": "blue" },
      { "value": "32%", "label": "Projected CAGR (2024-2030)", "color": "green" },
      { "value": "500+", "label": "Active patents filed (2023)", "color": "orange" }
    ],
    "body": "<p>Background and context paragraph 1.</p><p>Historical developments paragraph 2.</p><p>Policy and regulatory trends paragraph 3.</p>",
    "policies": [
      { "flag": "🇺🇸", "country": "United States", "text": "Specific policy name, budget amount, and what it means for readers.", "confidence": "high" },
      { "flag": "🇪🇺", "country": "European Union", "text": "Specific policy name, budget amount, and what it means for readers.", "confidence": "high" },
      { "flag": "🇯🇵", "country": "Japan", "text": "Specific policy name, budget amount, and what it means for readers.", "confidence": "high" }
    ],
    "sources": [
      { "label": "Source name (Year)", "url": "https://example.com/report" }
    ]
  },
  "s02": {
    "definitionTitle": "One-sentence definition of the technology",
    "definition": "2-3 sentence definition. [Technology] is a method that achieves [goal] by [mechanism].",
    "advantages": [
      { "label": "Strength 01", "title": "Plain-language advantage title", "body": "2-3 sentence explanation of this advantage and its applications.", "sourceStrength": "original_strength_name_from_input" }
    ],
    "sources": [
      { "label": "Source name (Year)", "url": "https://example.com" }
    ]
  },
  "s03": {
    "tam": { "value": "$45B", "label": "Total Addressable Market (2030)", "color": "blue", "sourceOrg": "Grand View Research", "sourceUrl": "https://www.grandviewresearch.com/report/example", "sourceYear": "2024" },
    "tamCards": [
      { "value": "$12B", "label": "EV Battery Segment", "color": "green" },
      { "value": "$8B", "label": "Consumer Electronics Segment", "color": "orange" }
    ],
    "forecasts": [
      {
        "org": "Market Research Firm Name",
        "orgUrl": "https://www.example.com",
        "sub": "Solid-State Battery Market",
        "current": "$3.2B",
        "future": "$18.5B",
        "pctFill": 17,
        "year": "2030",
        "cagr": "28.5%",
        "reportUrl": "https://www.example.com/reports/specific-report-page",
        "currencyBasis": "2024 nominal USD",
        "scope": "Global",
        "scenario": "base-case",
        "dataVintage": "2024",
        "confidence": "medium"
      }
    ],
    "sources": [
      { "label": "Source name (Year)", "url": "https://example.com" }
    ]
  },
  "s04": {
    "intro": "1-2 sentence overview of how this technology evolved.",
    "searchKeywords": ["keyword 1", "keyword 2", "keyword 3"],
    "body": "1-2 paragraph narrative of the technology's development history (max 600 chars).",
    "annualData": [
      { "year": 2020, "papers": 1200, "papersDelta": "+15%", "patents": 340, "patentsDelta": "+8%", "event": "Key event of the year" },
      { "year": 2021, "papers": 1450, "papersDelta": "+21%", "patents": 390, "patentsDelta": "+15%", "event": "" },
      { "year": 2022, "papers": 1800, "papersDelta": "+24%", "patents": 420, "patentsDelta": "+8%", "event": "Another key event" },
      { "year": 2023, "papers": 2100, "papersDelta": "+17%", "patents": 380, "patentsDelta": "-10%", "event": "" }
    ],
    "patentLagNote": "Patent counts for the most recent 1-2 years may be understated due to the 18-month publication lag from filing date.",
    "chartPhases": [
      { "phase": 1, "yearRange": "2010-2015", "title": "Early Stage", "desc": "1-2 sentence description of this phase." },
      { "phase": 2, "yearRange": "2016-2020", "title": "Growth Stage", "desc": "1-2 sentence description of this phase." },
      { "phase": 3, "yearRange": "2021-present", "title": "Acceleration Stage", "desc": "1-2 sentence description of this phase." }
    ],
    "events": [
      { "date": "2015年", "title": "Key milestone title", "body": "Description of the event (max 300 chars).", "confidence": "high" },
      { "date": "2018年3月", "title": "Another milestone", "body": "Description.", "confidence": "high" },
      { "date": "2020年", "title": "Third milestone", "body": "Description.", "confidence": "medium" },
      { "date": "2022年", "title": "Fourth milestone", "body": "Description.", "confidence": "high" },
      { "date": "2024年", "title": "Fifth milestone", "body": "Description.", "confidence": "medium" }
    ],
    "papersTable": {
      "headers": ["年", "論文情報", "この論文が示したこと", "引用数", "リンク"],
      "rows": [
        ["2023年", "Author et al. (2023) Title. Journal Name", "Plain explanation of what this paper demonstrated.", "450", { "text": "DOI →", "url": "https://doi.org/10.1000/example" }],
        ["2021年", "Author et al. (2021) Title. Journal Name", "Plain explanation.", "1200", "—"]
      ]
    },
    "patents": {
      "trendNote": "1-2 sentence description of patent filing trends.",
      "topAssignees": [
        { "name": "Company/Institution Name", "country": "JP", "count": "450" },
        { "name": "Another Company", "country": "US", "count": "320" }
      ],
      "dataSource": "USPTO / JPO / EPO via patent database search",
      "confidence": "medium"
    },
    "sources": [
      { "label": "Source name (Year)", "url": "https://example.com" }
    ]
  },
  "s05": {
    "scopeDeclaration": {
      "broadDef": "Broad definition including adjacent technologies.",
      "narrowDef": "Narrow definition focusing on the core mechanism adopted for this analysis.",
      "adoptedScope": "We adopt the narrow definition because [reason]. Adjacent technologies such as X are excluded.",
      "excluded": [
        { "name": "Adjacent Technology Name", "reason": "Reason for exclusion from scope." }
      ]
    },
    "subprocesses": {
      "centralMechanism": "One sentence describing the central mechanism (energy/material/information transformation).",
      "items": [
        { "name": "Subprocess 1", "description": "Description.", "isEssential": true, "keyVariables": ["variable1", "variable2"] },
        { "name": "Subprocess 2", "description": "Description.", "isEssential": true, "keyVariables": ["variable3"] },
        { "name": "Subprocess 3", "description": "Description.", "isEssential": false, "keyVariables": ["variable4"] }
      ],
      "sufficiencyNote": "Note on whether listed subprocesses fully describe the phenomenon."
    },
    "principleAxes": [
      { "axisId": "A1", "name": "Axis name", "nameEn": "Axis Name EN", "linkedSubprocess": "Subprocess 1", "values": ["Value1", "Value2", "Value3"], "independenceNote": "This axis is independent of A2 because..." },
      { "axisId": "A2", "name": "Axis name 2", "nameEn": "Axis Name 2 EN", "linkedSubprocess": "Subprocess 2", "values": ["ValueA", "ValueB"], "independenceNote": "This axis is independent of A1 because..." },
      { "axisId": "A3", "name": "Axis name 3", "nameEn": "Axis Name 3 EN", "linkedSubprocess": "Subprocess 3", "values": ["TypeX", "TypeY"], "independenceNote": "This axis is independent of A1 and A2 because..." }
    ],
    "principleMap": {
      "totalCombinations": 12,
      "axesSummary": "A1×3 × A2×2 × A3×2 = 12 combinations",
      "combinations": [
        { "id": "C01", "axisValues": [{"axisId": "A1", "value": "Value1"}, {"axisId": "A2", "value": "ValueA"}, {"axisId": "A3", "value": "TypeX"}], "methodName": "Method Name", "classification": "A", "classificationNote": "Commercially deployed by major manufacturers.", "confidence": "high" },
        { "id": "C02", "axisValues": [{"axisId": "A1", "value": "Value1"}, {"axisId": "A2", "value": "ValueA"}, {"axisId": "A3", "value": "TypeY"}], "methodName": "Method Name 2", "classification": "B", "classificationNote": "Demonstrated at pilot scale.", "confidence": "medium" },
        { "id": "C03", "axisValues": [{"axisId": "A1", "value": "Value1"}, {"axisId": "A2", "value": "ValueB"}, {"axisId": "A3", "value": "TypeX"}], "methodName": "Method Name 3", "classification": "D", "classificationNote": "Theoretically possible but no known implementation.", "confidence": "medium" },
        { "id": "C04", "axisValues": [{"axisId": "A1", "value": "Value2"}, {"axisId": "A2", "value": "ValueA"}, {"axisId": "A3", "value": "TypeX"}], "methodName": "Method Name 4", "classification": "E", "classificationNote": "Physically incompatible: [specific contradiction].", "confidence": "high" }
      ]
    },
    "trlIntro": "2-4 sentence overview of TRL landscape for this technology area.",
    "trlDefs": [
      { "level": 1, "title": "Basic Research", "desc": "Basic principles observed." },
      { "level": 2, "title": "Technology Concept", "desc": "Technology concept formulated." },
      { "level": 3, "title": "Experimental Proof", "desc": "Experimental proof of concept." },
      { "level": 4, "title": "Lab Validation", "desc": "Technology validated in lab." },
      { "level": 5, "title": "Relevant Environment Validation", "desc": "Technology validated in relevant environment." },
      { "level": 6, "title": "Prototype Demonstration", "desc": "Technology demonstrated in relevant environment." },
      { "level": 7, "title": "System Prototype", "desc": "System prototype demonstrated in operational environment." },
      { "level": 8, "title": "System Complete", "desc": "System complete and qualified." },
      { "level": 9, "title": "Operational", "desc": "Actual system proven in operational environment." }
    ],
    "technologies": [
      {
        "name": "Technology Name",
        "nameEn": "Technology Name EN",
        "desc": "2-3 sentence description based on principle axis combination. Explains the mechanism derived from the principleMap, not just a list of use cases.",
        "principleMapRef": "C01",
        "subcategoryCount": 5,
        "trlAvg": 7.2,
        "trlSd": 1.1,
        "trlN": 8,
        "trlDist": [0, 0, 0, 1, 1, 2, 3, 1, 0],
        "trlVerdict": "実証・実用化前",
        "trlColor": "amber",
        "confidence": "high",
        "sourceNote": "Based on N=8 assessments from industry reports and academic reviews."
      }
    ],
    "sources": [
      { "label": "Source name (Year)", "url": "https://example.com" }
    ]
  },
  "s06": {
    "intro": "1-2 sentence overview of barriers to adoption.",
    "body": "Structural context paragraph (max 500 chars).",
    "challenges": [
      { "title": "Challenge title", "riskType": "tech", "barrier": "Core barrier in one phrase", "body": "Detailed explanation with specific figures, law names, or institution names. <cite>Source Name (Year)</cite>", "confidence": "high" },
      { "title": "Economic challenge", "riskType": "economic", "barrier": "Cost barrier description", "body": "Explanation.", "confidence": "medium" },
      { "title": "Regulatory challenge", "riskType": "regulatory", "barrier": "Regulatory barrier", "body": "Explanation.", "confidence": "high" }
    ],
    "sources": [
      { "label": "Source name (Year)", "url": "https://example.com" }
    ]
  },
  "s07": {
    "intro": "1-2 sentence overview of Japanese public support programs available.",
    "programTable": {
      "headers": ["制度名", "省庁・機関", "対象", "上限額・補助率", "公募状況", "申請窓口"],
      "rows": [
        ["Program Name", "Ministry/Agency Name", "Target applicants", "Max ¥50M / 50% subsidy rate", "募集中", { "text": "申請ページ →", "url": "https://example.go.jp/apply" }],
        ["Another Program", "Another Ministry", "SMEs", "Max ¥30M", "定期公募", "経済産業省"]
      ]
    },
    "sources": [
      { "label": "Source name (Year)", "url": "https://example.go.jp" }
    ]
  }
}`

// ─────────────────────────────
// User Message Builder
// ─────────────────────────────

export function buildQueryReportPrompt(data: QueryReportJobData): string {
	const technicalAdvantages = data.technicalAdvantages?.length
		? data.technicalAdvantages
				.map((item, index) => {
					const applications = item.potentialApplications
						? ` Potential applications: ${item.potentialApplications}`
						: ""
					return `${index + 1}. ${item.strengthName ?? "Technical advantage"}: ${item.description ?? ""}${applications}`
				})
				.join("\n")
		: "No precomputed technical advantages were provided."

	return `Theme: ${data.query}
Language: ${data.language}

Precomputed technical advantages:
${technicalAdvantages}

Generate the complete JSON report for this theme. Use web search to gather real data.

Completion requirements:
- Return one JSON object only.
- Include all top-level keys: theme, scenario, summary, s01, s02, s03, s04, s05, s06, s07.
- Do not stop after the definition/advantages section. Sections s03, s04, s05, s06, and s07 are mandatory.
- Use the precomputed technical advantages as the primary input for s02.advantages. Preserve each original strength name in sourceStrength when possible.
- If a section has weak evidence, still return the complete field structure with empty arrays/strings where necessary. Do not omit any section.
- Follow the schema exactly and output only the JSON object.`
}
