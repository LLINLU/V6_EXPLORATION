CREATE TABLE "query_report_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"progress" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"user_id" uuid NOT NULL,
	"query_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "query_report_jobs_status_check" CHECK ("query_report_jobs"."status" IN ('queued', 'running', 'done', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "query_report_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"query_id" uuid NOT NULL,
	"result_json" jsonb NOT NULL,
	"validated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_report_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"input_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_report_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"step" text NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(10, 6) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "query_report_results" ADD CONSTRAINT "query_report_results_job_id_query_report_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."query_report_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "query_report_requests" ADD CONSTRAINT "query_report_requests_job_id_query_report_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."query_report_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "query_report_usage" ADD CONSTRAINT "query_report_usage_job_id_query_report_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."query_report_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_query_report_jobs_query_id" ON "query_report_jobs" USING btree ("query_id");--> statement-breakpoint
CREATE INDEX "idx_query_report_jobs_status" ON "query_report_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_query_report_jobs_user_created" ON "query_report_jobs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_query_report_active_job" ON "query_report_jobs" USING btree ("query_id","user_id") WHERE "query_report_jobs"."status" IN ('queued', 'running');--> statement-breakpoint
CREATE INDEX "idx_query_report_results_job_id" ON "query_report_results" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_query_report_results_query_id" ON "query_report_results" USING btree ("query_id");--> statement-breakpoint
CREATE INDEX "idx_query_report_requests_job_id" ON "query_report_requests" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_query_report_usage_job_id" ON "query_report_usage" USING btree ("job_id");