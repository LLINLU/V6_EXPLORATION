import { JOB_STATUS } from "../constants/jobStatus.js"
import { PIPELINE_STEP } from "../constants/pipelineSteps.js"
import { logger } from "../logger.js"
import { generateQueryReport } from "../services/queryReportService/index.js"
import { updateQueryReportJobStatus } from "../services/queryReportService/queryReportJobService.js"
import { saveQueryReportResult } from "../services/queryReportService/queryReportResultService.js"
import { recordQueryReportUsage } from "../services/queryReportService/queryReportUsageService.js"
import { getTechnicalAdvantagesForQuery } from "../services/queryReportService/queryTechnicalAdvantageService.js"
import { validateQueryReportSchema } from "./queryReportValidate.js"

export interface QueryReportJobData {
	jobId: string
	queryId: string
	query: string
	userId: string
	language: string
	technicalAdvantages?: Array<{
		strengthName: string | null
		description: string | null
		potentialApplications: string | null
	}>
}

const QUERY_REPORT_FAILURE_MESSAGE =
	"Report generation failed. Please try again."

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value)
}

function withDefaults<T extends Record<string, unknown>>(
	value: unknown,
	defaults: T,
): T {
	const source = asRecord(value)
	const merged: Record<string, unknown> = { ...defaults }

	for (const [key, sourceValue] of Object.entries(source)) {
		const defaultValue = merged[key]
		merged[key] =
			isRecord(defaultValue) && isRecord(sourceValue)
				? withDefaults(sourceValue, defaultValue)
				: sourceValue
	}

	return merged as T
}

function normalizeQueryReport(report: Record<string, unknown>) {
	return {
		theme: typeof report.theme === "string" ? report.theme : "",
		scenario: typeof report.scenario === "string" ? report.scenario : "",
		summary: typeof report.summary === "string" ? report.summary : "",
		s01: withDefaults(report.s01, {
			kpis: [],
			body: "",
			policies: [],
			sources: [],
		}),
		s02: withDefaults(report.s02, {
			definitionTitle: "",
			definition: "",
			advantages: [],
			sources: [],
		}),
		s03: withDefaults(report.s03, {
			tam: {
				value: "",
				label: "",
				color: "blue",
				sourceOrg: "",
				sourceUrl: "",
				sourceYear: "",
			},
			tamCards: [],
			forecasts: [],
			sources: [],
		}),
		s04: withDefaults(report.s04, {
			intro: "",
			searchKeywords: [],
			body: "",
			annualData: [],
			patentLagNote: "",
			chartPhases: [],
			events: [],
			papersTable: { headers: [], rows: [] },
			patents: {
				trendNote: "",
				topAssignees: [],
				dataSource: "",
			},
			sources: [],
		}),
		s05: withDefaults(report.s05, {
			scopeDeclaration: {
				broadDef: "",
				narrowDef: "",
				adoptedScope: "",
				excluded: [],
			},
			subprocesses: {
				centralMechanism: "",
				items: [],
				sufficiencyNote: "",
			},
			principleAxes: [],
			principleMap: {
				totalCombinations: 0,
				axesSummary: "",
				combinations: [],
			},
			trlIntro: "",
			trlDefs: [
				{ level: 1, title: "", desc: "" },
				{ level: 2, title: "", desc: "" },
				{ level: 3, title: "", desc: "" },
				{ level: 4, title: "", desc: "" },
				{ level: 5, title: "", desc: "" },
				{ level: 6, title: "", desc: "" },
				{ level: 7, title: "", desc: "" },
				{ level: 8, title: "", desc: "" },
				{ level: 9, title: "", desc: "" },
			],
			technologies: [],
			sources: [],
		}),
		s06: withDefaults(report.s06, {
			intro: "",
			body: "",
			challenges: [],
			sources: [],
		}),
		s07: withDefaults(report.s07, {
			intro: "",
			programTable: { headers: [], rows: [] },
			sources: [],
		}),
	}
}

export async function runQueryReportPipeline(
	data: QueryReportJobData,
): Promise<void> {
	const { jobId, queryId } = data

	logger.info(
		{
			jobId,
			queryId,
			query: data.query,
			language: data.language,
			userId: data.userId,
		},
		"queryReportPipeline::runQueryReportPipeline::started",
	)

	try {
		await updateQueryReportJobStatus(
			jobId,
			JOB_STATUS.RUNNING,
			PIPELINE_STEP.GENERATE,
		)
		logger.info(
			{ jobId, queryId },
			"queryReportPipeline::runQueryReportPipeline::loading technical advantages",
		)

		const databaseTechnicalAdvantages =
			await getTechnicalAdvantagesForQuery(queryId, data.userId)
		const technicalAdvantages = databaseTechnicalAdvantages.length
			? databaseTechnicalAdvantages
			: (data.technicalAdvantages ?? [])
		logger.info(
			{
				jobId,
				queryId,
				technicalAdvantages: technicalAdvantages.length,
				source: databaseTechnicalAdvantages.length
					? "database"
					: data.technicalAdvantages?.length
						? "request_fallback"
						: "none",
			},
			"queryReportPipeline::runQueryReportPipeline::technical advantages loaded",
		)

		logger.info(
			{ jobId, queryId },
			"queryReportPipeline::runQueryReportPipeline::[1/3] calling Anthropic",
		)

		const generated = await generateQueryReport({
			...data,
			technicalAdvantages,
		})
		logger.info(
			{
				jobId,
				queryId,
				promptTokens: generated.usage.promptTokens,
				completionTokens: generated.usage.completionTokens,
				costUsd: generated.usage.costUsd,
			},
			"queryReportPipeline::runQueryReportPipeline::[1/3] generation complete",
		)

		await updateQueryReportJobStatus(
			jobId,
			JOB_STATUS.RUNNING,
			PIPELINE_STEP.VALIDATE,
		)
		logger.info(
			{ jobId, queryId },
			"queryReportPipeline::runQueryReportPipeline::[2/3] validating schema",
		)

		const normalized = normalizeQueryReport(generated.report)
		const validated = validateQueryReportSchema(normalized)
		logger.info(
			{ jobId, queryId, topLevelKeys: Object.keys(validated) },
			"queryReportPipeline::runQueryReportPipeline::[2/3] validation passed",
		)

		await updateQueryReportJobStatus(
			jobId,
			JOB_STATUS.RUNNING,
			PIPELINE_STEP.PERSIST,
		)
		logger.info(
			{ jobId, queryId },
			"queryReportPipeline::runQueryReportPipeline::[3/3] saving result",
		)

		await saveQueryReportResult(jobId, queryId, validated)
		await recordQueryReportUsage(
			jobId,
			"generate",
			generated.usage.promptTokens,
			generated.usage.completionTokens,
			generated.usage.costUsd,
		)
		logger.info(
			{ jobId, queryId },
			"queryReportPipeline::runQueryReportPipeline::[3/3] result saved",
		)

		await updateQueryReportJobStatus(jobId, JOB_STATUS.DONE)
		logger.info(
			{ jobId, queryId },
			"queryReportPipeline::runQueryReportPipeline::done",
		)
	} catch (err) {
		logger.error(
			{ err, jobId, queryId },
			"queryReportPipeline::runQueryReportPipeline::failed",
		)
		await updateQueryReportJobStatus(
			jobId,
			JOB_STATUS.FAILED,
			QUERY_REPORT_FAILURE_MESSAGE,
		)
		throw err
	}
}
