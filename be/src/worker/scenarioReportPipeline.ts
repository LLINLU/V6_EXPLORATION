import { JOB_STATUS } from "../constants/jobStatus.js"
import { PIPELINE_STEP } from "../constants/pipelineSteps.js"
import { logger } from "../logger.js"
import type { ReportJobData } from "../queue/index.js"
import { generateScenarioReport } from "../services/scenarioReportService/index.js"
import { updateScenarioReportJobStatus } from "../services/scenarioReportService/scenarioReportJobService.js"
import { saveScenarioReportResult } from "../services/scenarioReportService/scenarioReportResultService.js"
import { recordScenarioReportUsage } from "../services/scenarioReportService/scenarioReportUsageService.js"
import { validateScenarioReportSchema } from "./scenarioReportValidate.js"

export async function runScenarioReportPipeline(
	data: ReportJobData,
): Promise<void> {
	const { jobId, scenarioId } = data

	logger.info(
		{
			jobId,
			scenarioId,
			theme: data.theme,
			scenario: data.scenarioTitle,
			language: data.language,
			userId: data.userId,
		},
		"scenarioReportPipeline::runScenarioReportPipeline::started",
	)

	try {
		await updateScenarioReportJobStatus(
			jobId,
			JOB_STATUS.RUNNING,
			PIPELINE_STEP.GENERATE,
		)
		logger.info(
			{ jobId, scenarioId },
			"scenarioReportPipeline::runScenarioReportPipeline::[1/3] calling Anthropic",
		)

		const generated = await generateScenarioReport(data)
		logger.info(
			{
				jobId,
				scenarioId,
				promptTokens: generated.usage.promptTokens,
				completionTokens: generated.usage.completionTokens,
				costUsd: generated.usage.costUsd,
			},
			"scenarioReportPipeline::runScenarioReportPipeline::[1/3] generation complete",
		)

		await updateScenarioReportJobStatus(
			jobId,
			JOB_STATUS.RUNNING,
			PIPELINE_STEP.VALIDATE,
		)
		logger.info(
			{ jobId, scenarioId },
			"scenarioReportPipeline::runScenarioReportPipeline::[2/3] validating schema",
		)

		const validated = validateScenarioReportSchema(generated.report)
		logger.info(
			{ jobId, scenarioId, topLevelKeys: Object.keys(validated) },
			"scenarioReportPipeline::runScenarioReportPipeline::[2/3] validation passed",
		)

		await updateScenarioReportJobStatus(
			jobId,
			JOB_STATUS.RUNNING,
			PIPELINE_STEP.PERSIST,
		)
		logger.info(
			{ jobId, scenarioId },
			"scenarioReportPipeline::runScenarioReportPipeline::[3/3] saving result",
		)

		await saveScenarioReportResult(jobId, scenarioId, validated)
		await recordScenarioReportUsage(
			jobId,
			"generate",
			generated.usage.promptTokens,
			generated.usage.completionTokens,
			generated.usage.costUsd,
		)
		logger.info(
			{ jobId, scenarioId },
			"scenarioReportPipeline::runScenarioReportPipeline::[3/3] result saved",
		)

		await updateScenarioReportJobStatus(jobId, JOB_STATUS.DONE)
		logger.info(
			{ jobId, scenarioId },
			"scenarioReportPipeline::runScenarioReportPipeline::done",
		)
	} catch (err) {
		logger.error(
			{ err, jobId, scenarioId },
			"scenarioReportPipeline::runScenarioReportPipeline::failed",
		)
		await updateScenarioReportJobStatus(
			jobId,
			JOB_STATUS.FAILED,
			err instanceof Error ? err.message : String(err),
		)
		throw err
	}
}
