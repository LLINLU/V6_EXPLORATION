import { z } from "zod"
import { logger } from "../logger.js"

const source = z.object({ label: z.string(), url: z.string() }).passthrough()

const reportSchema = z
	.object({
		theme: z.string(),
		scenario: z.string(),
		summary: z.string(),
		guide: z
			.object({
				groups: z
					.array(
						z.object({ label: z.string(), desc: z.string() }).passthrough(),
					)
					.min(1),
			})
			.passthrough(),
		s01: z
			.object({
				kpis: z.array(
					z
						.object({ value: z.string(), label: z.string(), color: z.string() })
						.passthrough(),
				),
				body: z.string(),
				policies: z.array(
					z
						.object({ flag: z.string(), country: z.string(), text: z.string() })
						.passthrough(),
				),
				sources: z.array(source),
			})
			.passthrough(),
		s02: z
			.object({
				definition: z.string(),
				advantages: z.array(
					z.object({ title: z.string(), desc: z.string() }).passthrough(),
				),
				customers: z.array(
					z
						.object({ label: z.string(), title: z.string(), desc: z.string() })
						.passthrough(),
				),
				sources: z.array(source),
			})
			.passthrough(),
		s03: z
			.object({
				tam: z.object({ value: z.string(), label: z.string() }).passthrough(),
				sam: z.object({ value: z.string(), label: z.string() }).passthrough(),
				sources: z.array(source),
			})
			.passthrough(),
		s04: z
			.object({
				intro: z.string(),
				issues: z.array(
					z
						.object({
							title: z.string(),
							category: z.string(),
							desc: z.string(),
						})
						.passthrough(),
				),
				sources: z.array(source),
			})
			.passthrough(),
		s05: z
			.object({
				approaches: z.array(
					z.object({ title: z.string(), desc: z.string() }).passthrough(),
				),
				issues: z.array(
					z
						.object({ approach: z.string(), limitation: z.string() })
						.passthrough(),
				),
				sources: z.array(source),
			})
			.passthrough(),
		s06: z
			.object({
				intro: z.string(),
				comparison: z.array(
					z
						.object({
							issue: z.string(),
							currentLimit: z.string(),
							solution: z.string(),
						})
						.passthrough(),
				),
				sources: z.array(source),
			})
			.passthrough(),
		s07: z
			.object({
				coreTech: z
					.object({ name: z.string(), desc: z.string() })
					.passthrough(),
				trlDefs: z.array(
					z
						.object({ level: z.number(), title: z.string(), desc: z.string() })
						.passthrough(),
				),
				technologies: z.array(
					z.object({ name: z.string(), trlAvg: z.number() }).passthrough(),
				),
				sources: z.array(z.object({ label: z.string() }).passthrough()),
			})
			.passthrough(),
		s08: z
			.object({
				competitors: z
					.object({
						headers: z.array(z.string()),
						rows: z.array(z.array(z.string())),
					})
					.passthrough(),
				collaborators: z
					.object({
						headers: z.array(z.string()),
						rows: z.array(z.array(z.string())),
					})
					.passthrough(),
				researchers: z
					.object({
						headers: z.array(z.string()),
						rows: z.array(z.array(z.string())),
					})
					.passthrough(),
				sources: z.array(z.object({ label: z.string() }).passthrough()),
			})
			.passthrough(),
	})
	.passthrough()

export function validateScenarioReportSchema(
	data: unknown,
): Record<string, unknown> {
	const result = reportSchema.safeParse(data)
	if (!result.success) {
		const topLevelKeys =
			data && typeof data === "object" ? Object.keys(data) : []
		logger.error(
			{
				errors: result.error.errors,
				topLevelKeys,
				dataPreview: JSON.stringify(data).slice(0, 500),
			},
			"scenarioReportValidate::validateScenarioReportSchema::schema validation failed",
		)
		throw result.error
	}
	return result.data as Record<string, unknown>
}
