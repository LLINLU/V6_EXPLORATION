export const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
}
/** CORS プリフライト応答 */ export function corsPreflightResponse() {
	return new Response("ok", {
		status: 200,
		headers: CORS_HEADERS,
	})
}
/** JSON エラーレスポンス */ export function jsonErrorResponse(
	message,
	status,
) {
	return new Response(
		JSON.stringify({
			error: message,
		}),
		{
			status,
			headers: {
				...CORS_HEADERS,
				"Content-Type": "application/json",
			},
		},
	)
}
/** SSE ストリーミングレスポンス */ export function sseStreamResponse(stream) {
	return new Response(stream, {
		status: 200,
		headers: {
			...CORS_HEADERS,
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	})
}
