import { describe, expect, it } from "vitest"
import { validateScenarioReportSchema } from "./scenarioReportValidate.js"

const validReport = {
	theme: "Aerial Haptics",
	scenario: "Non-contact rehab",
	summary: "A summary",
	guide: { groups: [{ label: "G1", desc: "D1" }] },
	s01: {
		kpis: [{ value: "10", label: "KPI", color: "#fff" }],
		body: "body text",
		policies: [{ flag: "🇯🇵", country: "Japan", text: "Policy text" }],
		sources: [{ label: "Source", url: "https://example.com" }],
	},
	s02: {
		definition: "def",
		advantages: [{ title: "Adv", desc: "desc" }],
		customers: [{ label: "C", title: "T", desc: "D" }],
		sources: [{ label: "Source", url: "https://example.com" }],
	},
	s03: {
		tam: { value: "$1B", label: "TAM" },
		sam: { value: "$100M", label: "SAM" },
		sources: [{ label: "Source", url: "https://example.com" }],
	},
	s04: {
		intro: "intro",
		issues: [{ title: "Issue", category: "Cat", desc: "desc" }],
		sources: [{ label: "Source", url: "https://example.com" }],
	},
	s05: {
		approaches: [{ title: "App", desc: "desc" }],
		issues: [{ approach: "App", limitation: "Limit" }],
		sources: [{ label: "Source", url: "https://example.com" }],
	},
	s06: {
		intro: "intro",
		comparison: [{ issue: "Issue", currentLimit: "Limit", solution: "Sol" }],
		sources: [{ label: "Source", url: "https://example.com" }],
	},
	s07: {
		coreTech: { name: "Tech", desc: "desc" },
		trlDefs: [{ level: 1, title: "TRL1", desc: "desc" }],
		technologies: [{ name: "Tech", trlAvg: 4.5 }],
		sources: [{ label: "MEMORY LAB 調査結果" }],
	},
	s08: {
		competitors: {
			headers: ["企業名", "国", "主な製品", "注目ポイント"],
			rows: [["A", "B", "C", "D"]],
		},
		collaborators: {
			headers: ["機関名", "種類", "関連領域", "注目ポイント"],
			rows: [],
		},
		researchers: {
			headers: ["氏名", "所属", "専門", "注目ポイント"],
			rows: [],
		},
		sources: [{ label: "Source" }],
	},
}

describe("validateScenarioReportSchema", () => {
	it("accepts a valid report", () => {
		expect(() => validateScenarioReportSchema(validReport)).not.toThrow()
	})

	it("passes through extra fields", () => {
		const withExtra = { ...validReport, extraTopLevel: true }
		const result = validateScenarioReportSchema(withExtra) as any
		expect(result.extraTopLevel).toBe(true)
	})

	it("rejects missing top-level sections", () => {
		const { s01: _s01, ...withoutS01 } = validReport
		expect(() => validateScenarioReportSchema(withoutS01)).toThrow()
	})

	it("rejects missing required string fields", () => {
		const bad = { ...validReport, theme: undefined }
		expect(() => validateScenarioReportSchema(bad)).toThrow()
	})

	it("rejects non-object input", () => {
		expect(() => validateScenarioReportSchema("string")).toThrow()
		expect(() => validateScenarioReportSchema(null)).toThrow()
		expect(() => validateScenarioReportSchema(123)).toThrow()
		expect(() => validateScenarioReportSchema(undefined)).toThrow()
	})
})
