import { describe, expect, it } from "vitest"
import { extractJsonFromText } from "../../src/services/scenarioReportService/index.js"

describe("extractJsonFromText", () => {
	it("parses plain JSON", () => {
		const result = extractJsonFromText(`{ "foo": "bar" }`)
		expect(result).toEqual({ foo: "bar" })
	})

	it("parses markdown JSON", () => {
		const result = extractJsonFromText(`
      \`\`\`json
      { "foo": "bar" }
      \`\`\`
    `)

		expect(result).toEqual({ foo: "bar" })
	})

	it("throws when no JSON exists", () => {
		expect(() => extractJsonFromText("hello")).toThrow("No JSON object found")
	})

	it("throws on invalid JSON", () => {
		expect(() => extractJsonFromText("{ invalid")).toThrow()
	})
})
