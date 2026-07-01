// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

interface SectionRequest {
	reportId: string
	sectionType: string
}

const ALL_SUPPORTED_SECTIONS = [
	"trl",
	"market",
	"social_issue",
	"technical_competitors",
	"executive_summary",
	"research_landscape",
	"market_implementations",
]

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
}

// ── Main Handler ──
// Thin Edge Function: reset section status to 'pending' only.
// The Render Background Worker (Rails + GoodJob) will detect the
// pending section and re-process it.

Deno.serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { status: 200, headers: CORS })
	}

	try {
		const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
		const SUPABASE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
		if (!SUPABASE_URL || !SUPABASE_ROLE_KEY) {
			throw new Error("Server mis-config (Supabase env vars)")
		}

		const sb = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY, {
			auth: { autoRefreshToken: false, persistSession: false },
		})

		// Authenticate user via JWT
		const authHeader = req.headers.get("Authorization")
		if (!authHeader) {
			return new Response(
				JSON.stringify({ error: "Missing Authorization header" }),
				{
					status: 401,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}
		const token = authHeader.replace("Bearer ", "")
		const {
			data: { user },
			error: authError,
		} = await sb.auth.getUser(token)

		if (authError || !user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { ...CORS, "Content-Type": "application/json" },
			})
		}

		const { reportId, sectionType } = (await req.json()) as SectionRequest

		if (!reportId || !sectionType) {
			return new Response(
				JSON.stringify({
					error: "Missing required parameters: reportId, sectionType",
				}),
				{
					status: 400,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		if (!ALL_SUPPORTED_SECTIONS.includes(sectionType)) {
			return new Response(
				JSON.stringify({
					error: `Unsupported section type: ${sectionType}. Supported: ${ALL_SUPPORTED_SECTIONS.join(", ")}`,
				}),
				{
					status: 400,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		// Verify report exists
		const { data: report, error: reportError } = await sb
			.from("scenario_reports")
			.select("id")
			.eq("id", reportId)
			.single()

		if (reportError || !report) {
			return new Response(
				JSON.stringify({ error: `Report not found: ${reportId}` }),
				{
					status: 404,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		// Reset section status to 'pending' — Worker will pick it up
		const now = new Date().toISOString()
		await sb
			.from("scenario_report_sections")
			.update({
				status: "pending",
				error_message: null,
				progress: 0,
				updated_at: now,
			})
			.eq("report_id", reportId)
			.eq("section_type", sectionType)

		console.log(
			`[ReportSection] Reset ${sectionType} to pending for report=${reportId}. Worker will re-process.`,
		)

		return new Response(
			JSON.stringify({
				accepted: true,
				reportId,
				sectionType,
				status: "pending",
			}),
			{
				status: 202,
				headers: { ...CORS, "Content-Type": "application/json" },
			},
		)
	} catch (err: any) {
		console.error("[ReportSection] Error:", err.message)
		return new Response(JSON.stringify({ error: err.message ?? "unknown" }), {
			status: 500,
			headers: { ...CORS, "Content-Type": "application/json" },
		})
	}
})
