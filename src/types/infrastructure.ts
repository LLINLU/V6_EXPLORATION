/**
 * Infrastructure Layer Types
 *
 * Types for repository operations, edge functions, and database queries.
 */

import type { Database } from "@/integrations/supabase/types"

// ── Database Row Types (re-exports from auto-generated types) ──

export type Tree = Database["public"]["Tables"]["technology_trees"]["Row"]
export type Project = Database["public"]["Tables"]["projects"]["Row"]
export type ProjectTree = Database["public"]["Tables"]["project_trees"]["Row"]
export type UserDetails = Database["public"]["Views"]["v_user_details"]["Row"]

// ── Tree Repository ─────────────────────────────────

export interface TreeListOptions {
	limit?: number
	orderBy?: "created_at" | "name"
	ascending?: boolean
	teamId?: string
}

export interface TreeIdsOptions {
	limit?: number
	teamId?: string
}

export interface TreeSearchOptions {
	userId?: string
	limit?: number
	search?: string
}

// ── Project Repository ──────────────────────────────

export interface CreateProjectInput {
	name: string
	description?: string
	visibility: "private" | "team" | "public"
	teamId?: string
	creatorId: string
}

export interface UpdateProjectInput {
	name?: string
	description?: string
	visibility?: "private" | "team" | "public"
	teamId?: string
}

export interface ProjectListOptions {
	limit?: number
	orderBy?: "created_at" | "name"
	ascending?: boolean
	teamId?: string
	creatorId?: string
}

export interface ProjectWithTrees extends Project {
	trees?: Tree[]
}

export interface ProjectWithTreeCount extends Project {
	tree_count: number
}

// ── Node Query ──────────────────────────────────────

export interface NodeChildrenCountRow {
	id: string
	children_count: number | null
	name: string
}

// ── Edge Functions ──────────────────────────────────

export interface DuplicateTreeRequest {
	tree_id: string
	new_name?: string
}

export interface DuplicateTreeResponse {
	success: boolean
	new_tree_id?: string
	error?: string
	stats?: {
		nodes_copied: number
		papers_copied: number
		use_cases_copied: number
		marketinfo_copied: number
		papers_summary_copied: number
		usecases_summary_copied: number
	}
}
