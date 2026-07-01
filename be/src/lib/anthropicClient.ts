import Anthropic from "@anthropic-ai/sdk"
import { env } from "../config/env.js"
import { logger } from "../logger.js"

let client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
	if (client) return client

	const apiKey = env.ANTHROPIC_API_KEY

	if (!apiKey.startsWith("sk-ant-")) {
		logger.error(
			{ keyPrefix: `${apiKey.slice(0, 10)}...` },
			"anthropicClient::getAnthropicClient::key does not start with 'sk-ant-' — likely invalid or misconfigured",
		)
	}

	client = new Anthropic({ apiKey })

	logger.info(
		{ keyPrefix: `${apiKey.slice(0, 20)}...`, keyLength: apiKey.length },
		"anthropicClient::getAnthropicClient::client initialized",
	)

	return client
}
