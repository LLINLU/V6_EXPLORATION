import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

/** upstream API エラーを区別するためのカスタムエラー */ export class SearchAPIError extends Error {
	constructor(message) {
		super(message)
		this.name = "SearchAPIError"
	}
}
/* ====== SSE stream parser ====== */ /**
 * SSE ストリームを行単位でパースし、各イベントを callback で通知する。
 * 最終 result の markets 配列を返す。
 */ async function consumeSSEStream(reader, onProgress) {
	const decoder = new TextDecoder()
	let buffer = ""
	let resultMarkets = []
	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		buffer += decoder.decode(value, {
			stream: true,
		})
		const lines = buffer.split("\n")
		buffer = lines.pop() ?? ""
		for (const line of lines) {
			const trimmed = line.trim()
			if (!trimmed.startsWith("data:")) continue
			const jsonStr = trimmed.slice(5).trim()
			if (!jsonStr) continue
			let parsed
			try {
				parsed = JSON.parse(jsonStr)
			} catch {
				continue // 不正な JSON は無視
			}
			switch (parsed.type) {
				case "progress":
					onProgress(parsed)
					break
				case "result":
					resultMarkets = parsed.data?.markets ?? []
					break
				case "error":
					throw new SearchAPIError(
						parsed.message_en ?? parsed.message_ja ?? "Search API error",
					)
			}
		}
	}
	return resultMarkets
}
/* ====== Public API ====== */ /**
 * search_market_impl SSE エンドポイントを呼び出し、
 * progress を onProgress で中継しながら最終結果の markets を返す。
 */ export async function searchMarketImpls(
	query,
	language,
	scenarioName,
	scenarioDescription,
	userContext,
	onProgress,
) {
	const apiEndpoint = getSearchApiBaseUrl("stg")
	const params = new URLSearchParams({
		query,
		language,
	})
	if (scenarioName) params.set("scenario_name", scenarioName)
	if (scenarioDescription)
		params.set("scenario_description", scenarioDescription)
	if (userContext) params.set("user_context", userContext)
	const url = `${apiEndpoint}/v5/search_market_impl?${params.toString()}`
	const res = await fetch(url, {
		method: "GET",
		headers: {
			Authorization: makeBasicAuthHeader(),
		},
	})
	if (!res.ok) {
		const text = await res.text()
		throw new SearchAPIError(`search_market_impl API ${res.status}: ${text}`)
	}
	const reader = res.body?.getReader()
	if (!reader) throw new SearchAPIError("No response body from search API")
	return consumeSSEStream(reader, onProgress)
}
