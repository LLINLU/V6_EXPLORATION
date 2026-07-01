import type { Project } from "@/infrastructure/supabaseRepository"
import { projectService } from "@/services/projectService"
import type { ProjectStoreState } from "./types"

/**
 * Fetch projects and update store
 */
export async function fetchProjects(
	get: () => ProjectStoreState,
	set: (state: Partial<ProjectStoreState>) => void,
	limit = 50,
): Promise<(Project & { tree_count?: number })[]> {
	const { projectsLoading } = get()

	// Prevent multiple simultaneous calls
	if (projectsLoading) {
		return get().projects
	}

	try {
		set({ projectsLoading: true })

		const data = await projectService.fetchProjectsWithTreeCount(limit)
		const result = data || []
		set({ projects: result })
		return result
	} catch (error) {
		console.error("Failed to fetch projects:", error)
		set({ projects: [] })
		return []
	} finally {
		set({ projectsLoading: false })
	}
}
