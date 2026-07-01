CREATE TYPE "public"."axis_type" AS ENUM('Root', 'Scenario', 'Purpose', 'Function', 'Measure', 'Measure2', 'Measure3', 'Measure4', 'Measure5', 'Measure6', 'Measure7', 'Technology', 'How1', 'How2', 'How3', 'How4', 'How5', 'How6', 'How7');--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"privacy_setting" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams_members" (
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technology_trees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"search_theme" text NOT NULL,
	"mode" text,
	"reasoning" text,
	"scenario_inputs" jsonb,
	"layer_config" jsonb,
	"team_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_viewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tree_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"tree_id" uuid,
	"parent_id" text,
	"name" text NOT NULL,
	"description" text,
	"level" integer NOT NULL,
	"axis" "axis_type" NOT NULL,
	"path" text,
	"node_order" integer,
	"children_count" integer,
	"team_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_papers" (
	"id" text PRIMARY KEY NOT NULL,
	"node_id" text NOT NULL,
	"tree_id" uuid NOT NULL,
	"title" text NOT NULL,
	"authors" text NOT NULL,
	"abstract" text NOT NULL,
	"journal" text NOT NULL,
	"date" text,
	"citations" integer DEFAULT 0 NOT NULL,
	"doi" text,
	"url" text,
	"region" text NOT NULL,
	"score" numeric,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"team_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_papers_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" text NOT NULL,
	"tree_id" uuid NOT NULL,
	"query" text NOT NULL,
	"summary" text NOT NULL,
	"papers_count" integer DEFAULT 0 NOT NULL,
	"team_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_use_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" text NOT NULL,
	"tree_id" uuid NOT NULL,
	"product" text NOT NULL,
	"description" text NOT NULL,
	"company" text[] DEFAULT '{}'::text[] NOT NULL,
	"press_releases" text[] DEFAULT '{}'::text[] NOT NULL,
	"year" integer,
	"team_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_usecases_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" text NOT NULL,
	"tree_id" uuid NOT NULL,
	"query" text NOT NULL,
	"summary" text NOT NULL,
	"usecases_count" integer DEFAULT 0 NOT NULL,
	"team_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_marketinfo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" text NOT NULL,
	"tree_id" uuid NOT NULL,
	"market_trl" jsonb,
	"paper_trl" jsonb,
	"hist_data" jsonb,
	"statistics" jsonb,
	"team_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" text NOT NULL,
	"tree_id" uuid NOT NULL,
	"node_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_use_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"use_case_id" uuid NOT NULL,
	"tree_id" uuid NOT NULL,
	"node_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_trees" (
	"project_id" uuid NOT NULL,
	"tree_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "project_trees_project_id_tree_id_pk" PRIMARY KEY("project_id","tree_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"creator_id" uuid NOT NULL,
	"visibility" text NOT NULL,
	"team_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_release_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"release_id" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyword_axes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid,
	"user_id" uuid NOT NULL,
	"team_id" uuid,
	"query" text NOT NULL,
	"axes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"selected_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "node_analysis_node_id_unique" UNIQUE("node_id")
);
--> statement-breakpoint
CREATE TABLE "node_patents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" text NOT NULL,
	"family_id" text,
	"title" text NOT NULL,
	"abstract" text,
	"earliest_priority_date" text,
	"countries" jsonb,
	"ipc_prefixes" jsonb,
	"ipc_subclasses" jsonb,
	"cpc" jsonb,
	"similarity_score" numeric,
	"assignee" jsonb,
	"inventor" jsonb,
	"publication_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technical_strengths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL,
	"ordinal" integer,
	"strength_name" text,
	"strength_name_t" text,
	"description" text,
	"description_t" text,
	"potential_applications" text,
	"potential_applications_t" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scenario_report_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"section_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"progress" integer DEFAULT 0,
	"raw_data" jsonb,
	"transformed_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scenario_report_sections_report_section_unique" UNIQUE("report_id","section_type"),
	CONSTRAINT "scenario_report_sections_type_check" CHECK ("scenario_report_sections"."section_type" IN ('trl','market','social_issue','technical_competitors','executive_summary','research_landscape','market_implementations')),
	CONSTRAINT "scenario_report_sections_status_check" CHECK ("scenario_report_sections"."status" IN ('pending','running','done','error'))
);
--> statement-breakpoint
CREATE TABLE "scenario_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" text NOT NULL,
	"tree_id" uuid NOT NULL,
	"scenario_name" text NOT NULL,
	"scenario_description" text,
	"user_query" text NOT NULL,
	"user_context" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"search_status" text DEFAULT 'pending' NOT NULL,
	"articles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"patents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"markets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"technologies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"team_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scenario_reports_status_check" CHECK ("scenario_reports"."status" IN ('pending','searching','search_done','analyzing','done','error')),
	CONSTRAINT "scenario_reports_search_status_check" CHECK ("scenario_reports"."search_status" IN ('pending','running','done','error'))
);
--> statement-breakpoint
ALTER TABLE "teams_members" ADD CONSTRAINT "teams_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_trees" ADD CONSTRAINT "technology_trees_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_nodes" ADD CONSTRAINT "tree_nodes_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_nodes" ADD CONSTRAINT "tree_nodes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_papers" ADD CONSTRAINT "node_papers_node_id_tree_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."tree_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_papers" ADD CONSTRAINT "node_papers_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_papers" ADD CONSTRAINT "node_papers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_papers_summary" ADD CONSTRAINT "node_papers_summary_node_id_tree_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."tree_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_papers_summary" ADD CONSTRAINT "node_papers_summary_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_papers_summary" ADD CONSTRAINT "node_papers_summary_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_use_cases" ADD CONSTRAINT "node_use_cases_node_id_tree_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."tree_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_use_cases" ADD CONSTRAINT "node_use_cases_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_use_cases" ADD CONSTRAINT "node_use_cases_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_usecases_summary" ADD CONSTRAINT "node_usecases_summary_node_id_tree_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."tree_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_usecases_summary" ADD CONSTRAINT "node_usecases_summary_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_usecases_summary" ADD CONSTRAINT "node_usecases_summary_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_marketinfo" ADD CONSTRAINT "node_marketinfo_node_id_tree_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."tree_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_marketinfo" ADD CONSTRAINT "node_marketinfo_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_marketinfo" ADD CONSTRAINT "node_marketinfo_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_papers" ADD CONSTRAINT "saved_papers_paper_id_node_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."node_papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_papers" ADD CONSTRAINT "saved_papers_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_papers" ADD CONSTRAINT "saved_papers_node_id_tree_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."tree_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_papers" ADD CONSTRAINT "saved_papers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_use_cases" ADD CONSTRAINT "saved_use_cases_use_case_id_node_use_cases_id_fk" FOREIGN KEY ("use_case_id") REFERENCES "public"."node_use_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_use_cases" ADD CONSTRAINT "saved_use_cases_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_use_cases" ADD CONSTRAINT "saved_use_cases_node_id_tree_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."tree_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_use_cases" ADD CONSTRAINT "saved_use_cases_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_trees" ADD CONSTRAINT "project_trees_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_trees" ADD CONSTRAINT "project_trees_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_axes" ADD CONSTRAINT "keyword_axes_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_axes" ADD CONSTRAINT "keyword_axes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_strengths" ADD CONSTRAINT "technical_strengths_tree_id_technology_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."technology_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_report_sections" ADD CONSTRAINT "scenario_report_sections_report_id_scenario_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."scenario_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_teams_members_user_id" ON "teams_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_trees_team_id" ON "technology_trees" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_trees_user_id" ON "technology_trees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_nodes_tree_id" ON "tree_nodes" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_nodes_parent_id" ON "tree_nodes" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_nodes_tree_level" ON "tree_nodes" USING btree ("tree_id","level");--> statement-breakpoint
CREATE INDEX "idx_papers_node_id" ON "node_papers" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_papers_tree_id" ON "node_papers" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_papers_summary_node_id" ON "node_papers_summary" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_papers_summary_tree_id" ON "node_papers_summary" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_usecases_node_id" ON "node_use_cases" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_usecases_tree_id" ON "node_use_cases" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_usecases_summary_node_id" ON "node_usecases_summary" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_usecases_summary_tree_id" ON "node_usecases_summary" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_marketinfo_node_id" ON "node_marketinfo" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_marketinfo_tree_id" ON "node_marketinfo" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_saved_papers_user_id" ON "saved_papers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_papers_tree_id" ON "saved_papers" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_saved_usecases_user_id" ON "saved_use_cases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_usecases_tree_id" ON "saved_use_cases" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_projects_team_id" ON "projects" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_projects_creator_id" ON "projects" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_release_views_user_id" ON "user_release_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_keyword_axes_tree_id" ON "keyword_axes" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_keyword_axes_user_id" ON "keyword_axes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_keyword_axes_team_id" ON "keyword_axes" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_keyword_axes_query" ON "keyword_axes" USING btree ("query");--> statement-breakpoint
CREATE INDEX "idx_node_patents_node_id" ON "node_patents" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_technical_strengths_tree_id" ON "technical_strengths" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_report_sections_report_id" ON "scenario_report_sections" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_scenario_reports_tree_scenario" ON "scenario_reports" USING btree ("tree_id","scenario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_scenario_reports_unique_active" ON "scenario_reports" USING btree ("tree_id","scenario_id") WHERE "scenario_reports"."status" != 'error';