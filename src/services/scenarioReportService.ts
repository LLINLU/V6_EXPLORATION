import { supabase } from "@/integrations/supabase/client"
import type {
	ReportGenerationRequest,
	ReportRecord,
	ReportSectionRecord,
	ReportStatusResponse,
} from "@/types/report"

export type {
	ReportGenerationRequest,
	ReportRecord,
	ReportSectionRecord,
	ReportStatusResponse,
}

// ── Untyped DB access ───────────────────────────────
// scenario_reports and scenario_report_sections are new tables not yet
// in the auto-generated Supabase types. After running `npm run generate-types`
// these helpers can be replaced with direct supabase.from() calls.

// biome-ignore lint/suspicious/noExplicitAny: tables not yet in auto-generated types
function fromTable(table: string): any {
	// biome-ignore lint/suspicious/noExplicitAny: tables not yet in auto-generated types
	return (supabase as any).from(table)
}

// ── Service Functions ───────────────────────────────

/**
 * Check for an existing report for the given tree/scenario combination.
 */
export async function fetchExistingReport(
	treeId: string,
	scenarioId: string,
): Promise<ReportRecord | null> {
	const { data, error } = await fromTable("scenario_reports")
		.select("*")
		.eq("tree_id", treeId)
		.eq("scenario_id", scenarioId)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle()

	if (error) {
		console.error("[ReportService] fetchExistingReport error:", error)
		return null
	}

	return data as ReportRecord | null
}

/**
 * Trigger report generation via the Edge Function (fire-and-forget).
 */
export async function triggerReportGeneration(
	_request: ReportGenerationRequest,
): Promise<{ reportId: string; status: string }> {
	return {
		reportId: "mock-report-id",
		status: "pending",
	}
	/*
	TODO: Implement actual Edge Function call when backend is ready. For now, return mock response.
	const { data, error } = await supabase.functions.invoke(
		"scenario-report-generate",
		{ body: request },
	)

	if (error) {
		throw new Error(`Failed to trigger report generation: ${error.message}`)
	}

	return {
		reportId: data.reportId,
		status: data.status,
	}*/
}

/**
 * Fetch current report status and all section statuses.
 */
export async function fetchReportStatus(
	reportId: string,
): Promise<ReportStatusResponse | null> {
	const [reportResult, sectionsResult] = await Promise.all([
		fromTable("scenario_reports").select("*").eq("id", reportId).single(),
		fromTable("scenario_report_sections")
			.select("*")
			.eq("report_id", reportId)
			.order("created_at", { ascending: true }),
	])

	if (reportResult.error || !reportResult.data) {
		console.error(
			"[ReportService] fetchReportStatus error:",
			reportResult.error,
		)
		return null
	}

	return {
		report: reportResult.data as ReportRecord,
		sections: (sectionsResult.data ?? []) as ReportSectionRecord[],
	}
}

/**
 * Fetch only report sections for a given report.
 */
export async function fetchReportSections(
	reportId: string,
): Promise<ReportSectionRecord[]> {
	const { data, error } = await fromTable("scenario_report_sections")
		.select("*")
		.eq("report_id", reportId)
		.order("created_at", { ascending: true })

	if (error) {
		console.error("[ReportService] fetchReportSections error:", error)
		return []
	}

	return (data ?? []) as ReportSectionRecord[]
}

/**
 * Retry a single section via the Edge Function.
 * The Edge Function resets the section status to 'pending',
 * and the Background Worker picks it up for re-processing.
 */
export async function retryReportSection(
	reportId: string,
	sectionType: string,
): Promise<void> {
	const { error } = await supabase.functions.invoke("scenario-report-section", {
		body: { reportId, sectionType },
	})

	if (error) {
		throw new Error(
			`Failed to trigger section ${sectionType}: ${error.message}`,
		)
	}
}
