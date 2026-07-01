import { create } from "zustand"
import { useTreeListStore } from "@/stores/treeListStore"
import * as actions from "./actions"
import type { ProjectStoreActions, ProjectStoreState } from "./types"

/**
 * Project Store
 *
 * Manages the selected project for filtering trees in the sidebar.
 * This store handles:
 * - Selected project ID for filtering search results
 * - List of available projects
 * - Project loading state
 *
 * Use this store when:
 * - Selecting a project to filter tree searches
 * - Displaying available projects in dropdown
 * - Filtering trees by project in SidebarSearches
 */

export const useProjectStore = create<ProjectStoreState & ProjectStoreActions>(
	(set, get) => ({
		// Initial state
		selectedProjectId: null,
		projects: [],
		projectsLoading: false,

		// Selection management
		setSelectedProjectId: (projectId) => {
			set({ selectedProjectId: projectId })
			useTreeListStore.getState().fetchTreesByProject(projectId)
		},
		clearSelectedProject: () => {
			set({ selectedProjectId: null })
			useTreeListStore.getState().fetchTrees()
		},

		// State setters
		setProjects: (projects) => set({ projects }),
		setProjectsLoading: (loading) => set({ projectsLoading: loading }),

		// Async actions
		fetchProjects: async (limit) => {
			return await actions.fetchProjects(get, set, limit)
		},
	}),
)

// Re-export types
export type { ProjectStoreActions, ProjectStoreState } from "./types"
