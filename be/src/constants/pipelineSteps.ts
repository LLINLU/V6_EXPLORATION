/** Progress labels written to the jobs.progress column during pipeline execution. */
export const PIPELINE_STEP = {
	GENERATE: "step:generate",
	VALIDATE: "step:validate",
	PERSIST: "step:persist",
} as const

export type PipelineStep = (typeof PIPELINE_STEP)[keyof typeof PIPELINE_STEP]
