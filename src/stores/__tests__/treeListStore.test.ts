import { act, renderHook } from "@testing-library/react"
import type { Tree } from "@/infrastructure/supabaseRepository"
import { treeService } from "@/services/treeService"
import { useTreeListStore } from "@/stores/treeListStore"

// Mock treeService
jest.mock("@/services/treeService", () => ({
	treeService: {
		fetchTrees: jest.fn(),
		fetchTreesByTeam: jest.fn(),
	},
}))

// Mock projectService
jest.mock("@/services/projectService", () => ({
	projectService: {
		fetchTreesByProject: jest.fn(),
	},
}))

// Mock cleanupName
jest.mock("@/hooks/tree/utils/stringCleaner", () => ({
	cleanupName: jest.fn((name: string) => name.replace("Search Theme: ", "")),
}))

describe("useTreeListStore", () => {
	beforeEach(() => {
		// Reset store state before each test
		const { result } = renderHook(() => useTreeListStore())
		act(() => {
			result.current.setTrees([])
			result.current.setTreesLoading(false)
			result.current.setPollingTreeId(null)
			result.current.setSearchQuery("")
		})
		jest.clearAllMocks()
	})

	describe("fetchTreesByProject", () => {
		it("should fetch trees for a specific project", async () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Project Tree 1",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					updated_at: "2024-01-01",
					last_viewed_at: "2024-01-01",
					description: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
				},
				{
					id: "tree-2",
					name: "Project Tree 2",
					search_theme: "Theme 2",
					created_at: "2024-01-02",
					mode: "FAST",
					user_id: "user-1",
					updated_at: "2024-01-02",
					last_viewed_at: null,
					description: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
				},
			]
			const { projectService } = await import("@/services/projectService")
			;(projectService.fetchTreesByProject as jest.Mock).mockResolvedValue(
				mockTrees,
			)

			let fetchedTrees: Tree[] = []
			await act(async () => {
				fetchedTrees = await result.current.fetchTreesByProject("project-123")
			})

			expect(projectService.fetchTreesByProject).toHaveBeenCalledWith(
				"project-123",
			)
			expect(result.current.treesLoading).toBe(false)
			expect(result.current.trees).toHaveLength(2)
			expect(result.current.trees[0].name).toBe("Project Tree 1")
			expect(fetchedTrees).toEqual(result.current.trees)
		})

		it("should prevent multiple simultaneous calls for project", async () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Tree 1",
					search_theme: "Theme",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			// Set loading state
			act(() => {
				result.current.setTreesLoading(true)
				result.current.setTrees(mockTrees)
			})

			let fetchedTrees: Tree[] = []
			await act(async () => {
				fetchedTrees = await result.current.fetchTreesByProject("project-123")
			})

			const { projectService } = await import("@/services/projectService")
			expect(projectService.fetchTreesByProject).not.toHaveBeenCalled()
			expect(fetchedTrees).toEqual(mockTrees) // Returns existing trees
		})

		it("should handle fetch errors for project", async () => {
			const { result } = renderHook(() => useTreeListStore())
			const consoleError = jest.spyOn(console, "error").mockImplementation()
			const { projectService } = await import("@/services/projectService")
			;(projectService.fetchTreesByProject as jest.Mock).mockRejectedValue(
				new Error("Fetch error"),
			)

			let fetchedTrees: Tree[] = []
			await act(async () => {
				fetchedTrees = await result.current.fetchTreesByProject("project-123")
			})

			expect(consoleError).toHaveBeenCalledWith(
				"Failed to fetch trees by project:",
				expect.any(Error),
			)
			expect(result.current.trees).toEqual([])
			expect(result.current.treesLoading).toBe(false)
			expect(fetchedTrees).toEqual([])

			consoleError.mockRestore()
		})
	})

	describe("Initial state", () => {
		it("should have correct initial state", () => {
			const { result } = renderHook(() => useTreeListStore())

			expect(result.current.trees).toEqual([])
			expect(result.current.treesLoading).toBe(false)
			expect(result.current.pollingTreeId).toBeNull()
		})
	})

	describe("State setters", () => {
		it("should set trees", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Test Tree",
					search_theme: "Theme",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			expect(result.current.trees).toEqual(mockTrees)
		})

		it("should set treesLoading", () => {
			const { result } = renderHook(() => useTreeListStore())

			act(() => {
				result.current.setTreesLoading(true)
			})

			expect(result.current.treesLoading).toBe(true)

			act(() => {
				result.current.setTreesLoading(false)
			})

			expect(result.current.treesLoading).toBe(false)
		})

		it("should set pollingTreeId", () => {
			const { result } = renderHook(() => useTreeListStore())

			act(() => {
				result.current.setPollingTreeId("tree-123")
			})

			expect(result.current.pollingTreeId).toBe("tree-123")

			act(() => {
				result.current.setPollingTreeId(null)
			})

			expect(result.current.pollingTreeId).toBeNull()
		})
	})

	describe("fetchTrees", () => {
		it("should fetch trees successfully", async () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Search Theme: Tree 1",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					updated_at: "2024-01-01",
					last_viewed_at: "2024-01-01",
					description: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
				},
				{
					id: "tree-2",
					name: "Tree 2",
					search_theme: "Theme 2",
					created_at: "2024-01-02",
					mode: "FAST",
					user_id: "user-1",
					updated_at: "2024-01-02",
					last_viewed_at: null,
					description: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
				},
			]
			;(treeService.fetchTrees as jest.Mock).mockResolvedValue(mockTrees)

			let fetchedTrees: Tree[] = []
			await act(async () => {
				fetchedTrees = await result.current.fetchTrees()
			})

			expect(treeService.fetchTrees).toHaveBeenCalledWith()
			expect(result.current.treesLoading).toBe(false)
			expect(result.current.trees).toHaveLength(2)
			expect(result.current.trees[0].name).toBe("Tree 1")
			expect(result.current.trees[1].mode).toBe("FAST")
			expect(fetchedTrees).toEqual(result.current.trees)
		})
	})

	describe("Helper actions", () => {
		it("should add tree to the beginning of the list", () => {
			const { result } = renderHook(() => useTreeListStore())
			const existingTree: Tree = {
				id: "tree-1",
				name: "Tree 1",
				search_theme: "Theme 1",
				created_at: "2024-01-01",
				mode: "TED",
				user_id: "user-1",
				description: null,
				last_viewed_at: null,
				layer_config: null,
				reasoning: null,
				scenario_inputs: null,
				team_id: null,
				updated_at: "2024-01-01",
			}
			const newTree: Tree = {
				id: "tree-2",
				name: "Tree 2",
				search_theme: "Theme 2",
				created_at: "2024-01-02",
				mode: "FAST",
				user_id: "user-1",
				description: null,
				last_viewed_at: null,
				layer_config: null,
				reasoning: null,
				scenario_inputs: null,
				team_id: null,
				updated_at: "2024-01-01",
			}

			act(() => {
				result.current.setTrees([existingTree])
			})

			act(() => {
				result.current.addTree(newTree)
			})

			expect(result.current.trees).toHaveLength(2)
			expect(result.current.trees[0]).toEqual(newTree)
			expect(result.current.trees[1]).toEqual(existingTree)
		})

		it("should update tree by id", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Tree 1",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					last_viewed_at: null,
					description: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
				{
					id: "tree-2",
					name: "Tree 2",
					search_theme: "Theme 2",
					created_at: "2024-01-02",
					mode: "FAST",
					user_id: "user-1",
					last_viewed_at: null,
					description: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.updateTree("tree-1", {
					last_viewed_at: "2024-01-03",
					name: "Updated Tree 1",
				})
			})

			expect(result.current.trees[0].last_viewed_at).toBe("2024-01-03")
			expect(result.current.trees[0].name).toBe("Updated Tree 1")
			expect(result.current.trees[1].last_viewed_at).toBeNull()
		})

		it("should not update if tree id does not exist", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Tree 1",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.updateTree("tree-999", {
					name: "Nonexistent Tree",
				})
			})

			expect(result.current.trees).toHaveLength(1)
			expect(result.current.trees[0].name).toBe("Tree 1")
		})

		it("should remove tree by id", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Tree 1",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
				{
					id: "tree-2",
					name: "Tree 2",
					search_theme: "Theme 2",
					created_at: "2024-01-02",
					mode: "FAST",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.removeTree("tree-1")
			})

			expect(result.current.trees).toHaveLength(1)
			expect(result.current.trees[0].id).toBe("tree-2")
		})

		it("should not fail when removing nonexistent tree", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Tree 1",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.removeTree("tree-999")
			})

			expect(result.current.trees).toHaveLength(1)
			expect(result.current.trees[0].id).toBe("tree-1")
		})
	})

	describe("Search functionality", () => {
		it("should have correct initial search state", () => {
			const { result } = renderHook(() => useTreeListStore())

			expect(result.current.searchQuery).toBe("")
			expect(result.current.isSearching()).toBe(false)
		})

		it("should set search query", () => {
			const { result } = renderHook(() => useTreeListStore())

			act(() => {
				result.current.setSearchQuery("test query")
			})

			expect(result.current.searchQuery).toBe("test query")
			expect(result.current.isSearching()).toBe(true)
		})

		it("should clear search query", () => {
			const { result } = renderHook(() => useTreeListStore())

			act(() => {
				result.current.setSearchQuery("test query")
			})

			expect(result.current.searchQuery).toBe("test query")

			act(() => {
				result.current.clearSearch()
			})

			expect(result.current.searchQuery).toBe("")
			expect(result.current.isSearching()).toBe(false)
		})

		it("should filter trees by name (case-insensitive)", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "React Application",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
				{
					id: "tree-2",
					name: "Vue Dashboard",
					search_theme: "Theme 2",
					created_at: "2024-01-02",
					mode: "FAST",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
				{
					id: "tree-3",
					name: "Angular Project",
					search_theme: "Theme 3",
					created_at: "2024-01-03",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.setSearchQuery("react")
			})

			const filtered = result.current.filteredTrees()
			expect(filtered).toHaveLength(1)
			expect(filtered[0].id).toBe("tree-1")
		})

		it("should be case-insensitive when filtering", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "React Application",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.setSearchQuery("REACT")
			})

			const filtered = result.current.filteredTrees()
			expect(filtered).toHaveLength(1)
			expect(filtered[0].id).toBe("tree-1")
		})

		it("should return all trees when search query is empty", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Tree 1",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
				{
					id: "tree-2",
					name: "Tree 2",
					search_theme: "Theme 2",
					created_at: "2024-01-02",
					mode: "FAST",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.setSearchQuery("")
			})

			const filtered = result.current.filteredTrees()
			expect(filtered).toHaveLength(2)
		})

		it("should return all trees when search query is whitespace", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Tree 1",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.setSearchQuery("   ")
			})

			const filtered = result.current.filteredTrees()
			expect(filtered).toHaveLength(1)
			expect(result.current.isSearching()).toBe(false)
		})

		it("should return empty array when no matches found", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "React Application",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.setSearchQuery("Vue")
			})

			const filtered = result.current.filteredTrees()
			expect(filtered).toHaveLength(0)
			expect(result.current.hasResults()).toBe(false)
		})

		it("should handle partial matches", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "React Application Development",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
				{
					id: "tree-2",
					name: "React Native Mobile App",
					search_theme: "Theme 2",
					created_at: "2024-01-02",
					mode: "FAST",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
				{
					id: "tree-3",
					name: "Vue Dashboard",
					search_theme: "Theme 3",
					created_at: "2024-01-03",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.setSearchQuery("app")
			})

			const filtered = result.current.filteredTrees()
			expect(filtered).toHaveLength(2)
			expect(filtered[0].id).toBe("tree-1")
			expect(filtered[1].id).toBe("tree-2")
		})

		it("should correctly report hasResults", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "React Application",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			// With results
			act(() => {
				result.current.setSearchQuery("react")
			})
			expect(result.current.hasResults()).toBe(true)

			// Without results
			act(() => {
				result.current.setSearchQuery("vue")
			})
			expect(result.current.hasResults()).toBe(false)
		})

		it("should trim search query when filtering", () => {
			const { result } = renderHook(() => useTreeListStore())
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "React Application",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]

			act(() => {
				result.current.setTrees(mockTrees)
			})

			act(() => {
				result.current.setSearchQuery("  react  ")
			})

			const filtered = result.current.filteredTrees()
			expect(filtered).toHaveLength(1)
			expect(filtered[0].id).toBe("tree-1")
		})
	})
})
