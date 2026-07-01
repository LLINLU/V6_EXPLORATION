export function getSearchApiBaseUrl(target: "stg" | "temp" | "prod"): string {
	let url: string
	if (target === "stg") {
		url =
			Deno.env.get("SEARCH_API_STG_URL") || "https://search-api.stg.memoryai.jp"
	} else if (target === "temp") {
		url =
			Deno.env.get("SEARCH_API_TEMP_URL") || "https://search-api.memoryai.jp"
	} else {
		url =
			Deno.env.get("SEARCH_API_PROD_URL") || "https://search-api.memoryai.jp"
	}
	return url.replace(/\/+$/, "")
}

export function makeBasicAuthHeader(): string {
	const user = Deno.env.get("SEARCH_API_USER") ?? "admin"
	const pass = Deno.env.get("SEARCH_API_PASS") ?? "adminpassword"
	return `Basic ${btoa(`${user}:${pass}`)}`
}
