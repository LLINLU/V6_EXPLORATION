import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

export const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders })
	}

	try {
		console.log("Checking API health...")

		// Call the actual health endpoint
		const healthResponse = await fetch(
			"https://search-api.memoryai.jp/health",
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		)

		const isHealthy = healthResponse.ok
		const responseData = isHealthy
			? await healthResponse.json().catch(() => ({}))
			: null

		return new Response(
			JSON.stringify({
				healthy: isHealthy,
				status: healthResponse.status,
				data: responseData,
				timestamp: new Date().toISOString(),
			}),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
				status: 200,
			},
		)
	} catch (error) {
		console.error("Health check failed:", error)

		return new Response(
			JSON.stringify({
				healthy: false,
				error: error.message,
				timestamp: new Date().toISOString(),
			}),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
				status: 200,
			},
		)
	}
})
