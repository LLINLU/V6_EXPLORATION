/**
 * Admin / User Management Types
 *
 * Types for user, team, and system monitoring.
 */

// ── User Management ─────────────────────────────────

export interface User {
	user_id: string
	username: string
	email: string
	team_id: string
	team_name: string
	role: string
	created_at: string
}

export interface Team {
	id: string
	name: string
	description: string
	created_at: string
	created_by: string
	member_count?: number
	private?: boolean
}

export interface NewUser {
	username: string
	email: string
	teamId: string
	role: string
	password: string
}

export interface NewTeam {
	name: string
	description: string
}

// ── System Monitoring ───────────────────────────────

export interface TeamStats {
	team_id: string
	team_name?: string
	totalTrees: number
	totalNodes: number
	totalPapers: number
	totalUseCases: number
	recentSearches: Array<{
		search_theme: string
		created_at: string
		tree_id: string
		papers: number
		useCases: number
		nodes: number
		user_id: string
		user_email?: string
	}>
	lastActivity: string
}

export interface SystemStats {
	totalTrees: number
	totalNodes: number
	totalPapers: number
	totalUseCases: number
	activeUsers: number
	totalTeams: number
}

// ── CSV Export ───────────────────────────────────────

export interface UserCSVData {
	username: string
	email: string
	password: string
	teamName: string
	createdAt: string
}
