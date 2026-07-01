import {
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SendMessageCommand,
	SQSClient,
} from "@aws-sdk/client-sqs"
import { env } from "../config/env.js"
import { logger } from "../logger.js"
import {
	runQueryReportPipeline,
	type QueryReportJobData,
} from "../worker/queryReportPipeline.js"
import { runScenarioReportPipeline } from "../worker/scenarioReportPipeline.js"

// AWS SDK v3 resolves credentials from the default provider chain (env vars,
// AWS_PROFILE → ~/.aws, ECS task role, EC2 IMDS) automatically. Don't pass
// `credentials` explicitly — the SDK handles the local-vs-prod split for us.
const client = new SQSClient({ region: env.AWS_REGION })

const QUEUE_URL = env.SQS_QUEUE_URL

export interface ReportJobData {
	jobId: string
	theme: string
	scenarioTitle: string
	scenarioDescription: string
	scenarioId: string
	userId: string
	language: string
}

type ScenarioReportQueueMessage = ReportJobData & {
	type?: "scenario-report"
}

type QueryReportQueueMessage = QueryReportJobData & {
	type: "query-report"
}

type QueueMessage = ScenarioReportQueueMessage | QueryReportQueueMessage

function getQueueMessageLogContext(data: QueueMessage) {
	if (data.type === "query-report") {
		return {
			type: data.type,
			jobId: data.jobId,
			queryId: data.queryId,
			query: data.query,
		}
	}

	return {
		type: data.type ?? "scenario-report",
		jobId: data.jobId,
		scenarioId: data.scenarioId,
		theme: data.theme,
	}
}

export async function enqueueReportJob(data: ReportJobData): Promise<void> {
	logger.info(
		{
			jobId: data.jobId,
			scenarioId: data.scenarioId,
			userId: data.userId,
			queueUrl: QUEUE_URL,
		},
		"queue::enqueueReportJob::sending to SQS",
	)
	await client.send(
		new SendMessageCommand({
			QueueUrl: QUEUE_URL,
			MessageBody: JSON.stringify({ ...data, type: "scenario-report" }),
			MessageGroupId: data.userId,
		}),
	)
	logger.info({ jobId: data.jobId }, "queue::enqueueReportJob::sent")
}

export async function enqueueQueryReportJob(
	data: QueryReportJobData,
): Promise<void> {
	logger.info(
		{
			jobId: data.jobId,
			queryId: data.queryId,
			userId: data.userId,
			queueUrl: QUEUE_URL,
		},
		"queue::enqueueQueryReportJob::sending to SQS",
	)
	await client.send(
		new SendMessageCommand({
			QueueUrl: QUEUE_URL,
			MessageBody: JSON.stringify({ ...data, type: "query-report" }),
			MessageGroupId: data.userId,
		}),
	)
	logger.info({ jobId: data.jobId }, "queue::enqueueQueryReportJob::sent")
}

export async function startWorker(): Promise<void> {
	logger.info({ queueUrl: QUEUE_URL }, "queue::startWorker::worker listening")
	poll()
}

async function poll(): Promise<void> {
	while (true) {
		try {
			const result = await client.send(
				new ReceiveMessageCommand({
					QueueUrl: QUEUE_URL,
					MaxNumberOfMessages: 10,
					WaitTimeSeconds: 20,
				}),
			)

			const messages = result.Messages ?? []
			if (messages.length > 0) {
				logger.info(
					{ count: messages.length },
					"queue::poll::messages received",
				)
			}

			for (const message of messages) {
				const rawBody = message.Body ?? "{}"
				logger.debug(
					{ rawBody: rawBody.slice(0, 500) },
					"queue::poll::raw message body",
				)
				const data: QueueMessage = JSON.parse(rawBody)
				logger.info(
					getQueueMessageLogContext(data),
					"queue::poll::processing message",
				)
				try {
					if (data.type === "query-report") {
						await runQueryReportPipeline(data)
					} else {
						await runScenarioReportPipeline(data)
					}
					await client.send(
						new DeleteMessageCommand({
							QueueUrl: QUEUE_URL,
							ReceiptHandle: message.ReceiptHandle ?? "",
						}),
					)
					logger.info(
						{ jobId: data.jobId },
						"queue::poll::message deleted from queue",
					)
				} catch (err) {
					logger.error(
						{ err, jobId: data.jobId },
						"queue::poll::job failed, message will redeliver",
					)
				}
			}
		} catch (err) {
			logger.error({ err }, "queue::poll::error, retrying in 5s")
			await new Promise((r) => setTimeout(r, 5000))
		}
	}
}
