import type { Project } from "@/infrastructure/supabaseRepository"

export interface ProjectStoreState {
	// Selected project for filtering
	selectedProjectId: string | null

	// Project list data
	projects: (Project & { tree_count?: number })[]
	projectsLoading: boolean
}

export interface ProjectStoreActions {
	// Selection management
	setSelectedProjectId: (projectId: string) => void
	clearSelectedProject: () => void

	// State setters
	setProjects: (projects: (Project & { tree_count?: number })[]) => void
	setProjectsLoading: (loading: boolean) => void

	// Async actions
	fetchProjects: (
		limit?: number,
	) => Promise<(Project & { tree_count?: number })[]>
}
