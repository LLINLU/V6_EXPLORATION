export type JobStatus = "queued" | "running" | "done" | "failed"

export const JOB_STATUS = {
	QUEUED: "queued",
	RUNNING: "running",
	DONE: "done",
	FAILED: "failed",
} as const satisfies Record<string, JobStatus>
