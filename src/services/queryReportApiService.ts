import { apiClient } from "@/lib/apiClient"
import type { QueryReportData } from "@/types/query-report"

export type QueryReportStatus =
	| "queued"
	| "running"
	| "done"
	| "failed"
	| "not_found"

export interface CreateQueryReportRequest {
	query_id: string
	query: string
	language: string
	technicalAdvantages?: Array<{
		strengthName: string | null
		description: string | null
		potentialApplications: string | null
	}>
}

export interface CreateQueryReportResponse {
	job_id: string
	status: "queued"
}

export interface QueryReportResponse {
	query_id: string
	job_id: string | null
	status: QueryReportStatus
	progress: string | null
	job_created_at: string | null
	job_updated_at: string | null
	job_elapsed_sec: number | null
	data: QueryReportData | Record<string, never>
	message: string
}

export const queryReportApiService = {
	createReport: (body: CreateQueryReportRequest, signal?: AbortSignal) =>
		apiClient.post<CreateQueryReportResponse>("/query-report", body, {
			signal,
		}),

	getReport: (queryId: string, signal?: AbortSignal) =>
		apiClient.get<QueryReportResponse>(
			`/query-report/${encodeURIComponent(queryId)}`,
			{ signal },
		),
}
