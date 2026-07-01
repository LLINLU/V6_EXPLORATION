import { z } from "zod"
import { logger } from "../logger.js"

const source = z.object({ label: z.string() }).passthrough()

const queryReportSchema = z
	.object({
		theme: z.string(),
		summary: z.string(),
		s01: z
			.object({
				kpis: z.array(
					z
						.object({
							value: z.string(),
							label: z.string(),
							color: z.string(),
						})
						.passthrough(),
				),
				body: z.string(),
				policies: z.array(
					z.object({ country: z.string(), text: z.string() }).passthrough(),
				),
				sources: z.array(source),
			})
			.passthrough(),
		s02: z
			.object({
				definitionTitle: z.string(),
				definition: z.string(),
				advantages: z.array(
					z.object({ label: z.string(), title: z.string() }).passthrough(),
				),
				sources: z.array(source),
			})
			.passthrough(),
		s03: z
			.object({
				tam: z.object({ value: z.string() }).passthrough(),
				forecasts: z.array(z.object({ org: z.string() }).passthrough()),
				sources: z.array(source),
			})
			.passthrough(),
		s04: z
			.object({
				intro: z.string(),
				events: z.array(
					z.object({ date: z.string(), title: z.string() }).passthrough(),
				),
				sources: z.array(source),
			})
			.passthrough(),
		s05: z
			.object({
				scopeDeclaration: z
					.object({ broadDef: z.string(), narrowDef: z.string() })
					.passthrough(),
				trlDefs: z.array(
					z.object({ level: z.number(), title: z.string() }).passthrough(),
				),
				technologies: z.array(
					z
						.object({
							name: z.string(),
							trlDist: z.array(z.number()),
						})
						.passthrough(),
				),
				sources: z.array(source),
			})
			.passthrough(),
		s06: z
			.object({
				intro: z.string(),
				challenges: z.array(
					z.object({ title: z.string(), riskType: z.string() }).passthrough(),
				),
				sources: z.array(source),
			})
			.passthrough(),
		s07: z
			.object({
				intro: z.string(),
				programTable: z
					.object({
						headers: z.array(z.string()),
						rows: z.array(z.array(z.unknown())),
					})
					.passthrough(),
				sources: z.array(source),
			})
			.passthrough(),
	})
	.passthrough()

export function validateQueryReportSchema(
	raw: Record<string, unknown>,
): Record<string, unknown> {
	const result = queryReportSchema.safeParse(raw)
	if (!result.success) {
		logger.error(
			{ errors: result.error.errors },
			"queryReportValidate::validateQueryReportSchema::validation failed",
		)
		throw new Error(
			`Query report schema validation failed: ${result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")}`,
		)
	}
	logger.info(
		{ topLevelKeys: Object.keys(result.data) },
		"queryReportValidate::validateQueryReportSchema::passed",
	)
	return result.data
}
