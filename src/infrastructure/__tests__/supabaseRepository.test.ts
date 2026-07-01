import { SupabaseRepository } from "@/infrastructure/supabaseRepository"
import { supabase } from "@/integrations/supabase/client"

// Mock supabase client
jest.mock("@/integrations/supabase/client", () => ({
	supabase: {
		from: jest.fn(),
	},
}))

describe("SupabaseRepository", () => {
	let repository: SupabaseRepository
	let mockFrom: jest.Mock
	let mockSelect: jest.Mock
	let mockOrder: jest.Mock
	let mockEq: jest.Mock
	let mockLimit: jest.Mock
	let mockSingle: jest.Mock
	let mockUpdate: jest.Mock
	let mockNeq: jest.Mock

	beforeEach(() => {
		repository = new SupabaseRepository()

		mockSingle = jest.fn(() => ({ data: null, error: null }))
		mockLimit = jest.fn(() => ({ data: null, error: null }))
		mockEq = jest.fn(() => ({
			single: mockSingle,
			limit: mockLimit,
			order: mockOrder,
			data: null,
			error: null,
		}))
		mockOrder = jest.fn(() => ({
			eq: mockEq,
			limit: mockLimit,
			data: null,
			error: null,
		}))
		mockNeq = jest.fn(() => ({
			order: mockOrder,
			eq: mockEq,
			data: null,
			error: null,
		}))
		mockSelect = jest.fn(() => ({
			order: mockOrder,
			neq: mockNeq,
			eq: mockEq,
			data: null,
			error: null,
		}))
		mockUpdate = jest.fn(() => ({
			eq: mockEq,
			data: null,
			error: null,
		}))
		mockFrom = jest.fn(() => ({
			select: mockSelect,
			update: mockUpdate,
		}))

		;(supabase.from as jest.Mock) = mockFrom
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe("fetchTrees", () => {
		it("should fetch trees with default options", async () => {
			// Arrange
			const mockTrees = [
				{
					id: "tree-1",
					name: "Tree 1",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-1",
				},
			]
			mockOrder.mockReturnValue(
				Promise.resolve({ data: mockTrees, error: null }),
			)

			// Act
			const result = await repository.fetchTrees()

			// Assert
			expect(mockFrom).toHaveBeenCalledWith("technology_trees")
			expect(mockSelect).toHaveBeenCalledWith("*")
			expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false })
			expect(result).toEqual(mockTrees)
		})

		it("should fetch trees with team_id filter", async () => {
			// Arrange
			const mockTrees = [{ id: "tree-1" }]
			const teamId = "team-123"
			mockLimit.mockReturnValue({ data: mockTrees, error: null })

			// Act
			await repository.fetchTrees({ teamId })

			// Assert
			expect(mockEq).toHaveBeenCalledWith("user_id", teamId)
		})

		it("should throw error on database failure", async () => {
			// Arrange
			const dbError = { message: "Database error" }
			mockOrder.mockReturnValue(Promise.resolve({ data: null, error: dbError }))

			// Act & Assert
			await expect(repository.fetchTrees()).rejects.toThrow(
				"Failed to fetch trees: Database error",
			)
		})
	})

	describe("fetchTreeIds", () => {
		it("should fetch tree IDs with default options", async () => {
			// Arrange
			const mockData = [{ id: "tree-1" }, { id: "tree-2" }]
			mockLimit.mockReturnValue({ data: mockData, error: null })

			// Act
			const result = await repository.fetchTreeIds()

			// Assert
			expect(mockFrom).toHaveBeenCalledWith("technology_trees")
			expect(mockSelect).toHaveBeenCalledWith("id")
			expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false })
			expect(mockLimit).toHaveBeenCalledWith(10)
			expect(result).toEqual(["tree-1", "tree-2"])
		})

		it("should fetch tree IDs with team_id filter", async () => {
			// Arrange
			const teamId = "team-456"
			mockLimit.mockReturnValue({ data: [], error: null })

			// Act
			await repository.fetchTreeIds({ teamId })

			// Assert
			expect(mockEq).toHaveBeenCalledWith("user_id", teamId)
		})

		it("should return empty array when no data", async () => {
			// Arrange
			mockLimit.mockReturnValue({ data: null, error: null })

			// Act
			const result = await repository.fetchTreeIds()

			// Assert
			expect(result).toEqual([])
		})
	})

	describe("fetchTreeById", () => {
		it("should fetch tree by ID", async () => {
			// Arrange
			const mockTree = {
				id: "tree-abc",
				name: "Test Tree",
				search_theme: "Test",
				created_at: "2024-01-01",
				mode: null,
				user_id: "user-1",
			}
			mockSingle.mockReturnValue({ data: mockTree, error: null })

			// Act
			const result = await repository.fetchTreeById("tree-abc")

			// Assert
			expect(mockFrom).toHaveBeenCalledWith("technology_trees")
			expect(mockEq).toHaveBeenCalledWith("id", "tree-abc")
			expect(mockSingle).toHaveBeenCalled()
			expect(result).toEqual(mockTree)
		})

		it("should return null when tree not found", async () => {
			// Arrange
			mockSingle.mockReturnValue({
				data: null,
				error: { code: "PGRST116" },
			})

			// Act
			const result = await repository.fetchTreeById("nonexistent")

			// Assert
			expect(result).toBeNull()
		})

		it("should throw error on database failure", async () => {
			// Arrange
			mockSingle.mockReturnValue({
				data: null,
				error: { code: "OTHER", message: "DB error" },
			})

			// Act & Assert
			await expect(repository.fetchTreeById("tree-error")).rejects.toThrow(
				"Failed to fetch tree: DB error",
			)
		})
	})

	describe("fetchTreesByTeam", () => {
		it("should fetch team trees ordered by created_at", async () => {
			// Arrange
			const mockTrees = [
				{
					id: "tree-1",
					name: "Team Tree",
					search_theme: "Theme",
					created_at: "2024-01-01",
					mode: null,
					team_id: "team-123",
				},
			]
			mockEq.mockReturnValueOnce({ data: mockTrees, error: null })

			// Act
			const result = await repository.fetchTreesByTeam("team-123")

			// Assert
			expect(mockFrom).toHaveBeenCalledWith("technology_trees")
			expect(mockSelect).toHaveBeenCalledWith("*")
			expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false })
			expect(mockEq).toHaveBeenCalledWith("team_id", "team-123")
			expect(result).toEqual(mockTrees)
		})

		it("should return empty array when teamId is falsy", async () => {
			// Act
			const result = await repository.fetchTreesByTeam(undefined)

			// Assert
			expect(mockFrom).not.toHaveBeenCalled()
			expect(result).toEqual([])
		})

		it("should swallow missing table errors", async () => {
			// Arrange
			mockEq.mockReturnValueOnce({
				data: null,
				error: { message: 'relation "technology_trees" does not exist' },
			})

			// Act
			const result = await repository.fetchTreesByTeam("team-123")

			// Assert
			expect(result).toEqual([])
		})
	})

	describe("updateLastViewedAt", () => {
		it("should update last_viewed_at for a tree", async () => {
			// Arrange
			const treeId = "tree-123"
			mockEq.mockReturnValueOnce({ data: null, error: null })

			// Act
			await repository.updateLastViewedAt(treeId)

			// Assert
			expect(mockFrom).toHaveBeenCalledWith("technology_trees")
			expect(mockUpdate).toHaveBeenCalledWith(
				expect.objectContaining({
					last_viewed_at: expect.any(String),
				}),
			)
			expect(mockEq).toHaveBeenCalledWith("id", treeId)
		})

		it("should throw error on database failure", async () => {
			// Arrange
			const treeId = "tree-error"
			const dbError = { message: "Database error" }
			mockEq.mockReturnValueOnce({ data: null, error: dbError })

			// Act & Assert
			await expect(repository.updateLastViewedAt(treeId)).rejects.toThrow(
				"Failed to update last_viewed_at: Database error",
			)
		})
	})

	describe("Project Methods", () => {
		describe("createProject", () => {
			it("should create a project with required fields", async () => {
				// Arrange
				const mockProject = {
					id: "project-1",
					name: "Test Project",
					description: "Test Description",
					visibility: "private",
					team_id: null,
					creator_id: "user-1",
					created_at: "2024-01-01",
					updated_at: "2024-01-01",
				}
				const mockInsert = jest.fn(() => ({
					select: jest.fn(() => ({
						single: jest.fn(() => ({ data: mockProject, error: null })),
					})),
				}))
				mockFrom.mockReturnValue({ insert: mockInsert })

				// Act
				const result = await repository.createProject({
					name: "Test Project",
					description: "Test Description",
					visibility: "private",
					creatorId: "user-1",
				})

				// Assert
				expect(mockFrom).toHaveBeenCalledWith("projects")
				expect(mockInsert).toHaveBeenCalledWith({
					name: "Test Project",
					description: "Test Description",
					visibility: "private",
					team_id: undefined,
					creator_id: "user-1",
				})
				expect(result).toEqual(mockProject)
			})

			it("should throw error on database failure", async () => {
				// Arrange
				const dbError = { message: "Database error" }
				const mockInsert = jest.fn(() => ({
					select: jest.fn(() => ({
						single: jest.fn(() => ({ data: null, error: dbError })),
					})),
				}))
				mockFrom.mockReturnValue({ insert: mockInsert })

				// Act & Assert
				await expect(
					repository.createProject({
						name: "Test",
						visibility: "private",
						creatorId: "user-1",
					}),
				).rejects.toThrow("Failed to create project: Database error")
			})
		})

		describe("fetchProjects", () => {
			it("should fetch projects with default options", async () => {
				// Arrange
				const mockProjects = [
					{
						id: "project-1",
						name: "Project 1",
						visibility: "private",
						creator_id: "user-1",
					},
				]
				mockLimit.mockReturnValue({ data: mockProjects, error: null })

				// Act
				const result = await repository.fetchProjects()

				// Assert
				expect(mockFrom).toHaveBeenCalledWith("projects")
				expect(mockSelect).toHaveBeenCalledWith("*")
				expect(mockOrder).toHaveBeenCalledWith("created_at", {
					ascending: false,
				})
				expect(mockLimit).toHaveBeenCalledWith(50)
				expect(result).toEqual(mockProjects)
			})

			it("should filter by team_id", async () => {
				// Arrange
				mockLimit.mockReturnValue({ data: [], error: null })

				// Act
				await repository.fetchProjects({ teamId: "team-123" })

				// Assert
				expect(mockEq).toHaveBeenCalledWith("team_id", "team-123")
			})
		})

		describe("deleteProject", () => {
			it("should delete project", async () => {
				// Arrange
				const mockDelete = jest.fn(() => ({
					eq: jest.fn(() => ({ data: null, error: null })),
				}))
				mockFrom.mockReturnValue({ delete: mockDelete })

				// Act
				await repository.deleteProject("project-1")

				// Assert
				expect(mockFrom).toHaveBeenCalledWith("projects")
				expect(mockDelete).toHaveBeenCalled()
			})
		})

		describe("addTreeToProject", () => {
			it("should add tree to project", async () => {
				// Arrange
				const mockProjectTree = {
					project_id: "project-1",
					tree_id: "tree-1",
					position: 0,
				}
				const mockInsert = jest.fn(() => ({
					select: jest.fn(() => ({
						single: jest.fn(() => ({ data: mockProjectTree, error: null })),
					})),
				}))
				mockFrom.mockReturnValue({ insert: mockInsert })

				// Act
				const result = await repository.addTreeToProject("project-1", "tree-1")

				// Assert
				expect(mockFrom).toHaveBeenCalledWith("project_trees")
				expect(mockInsert).toHaveBeenCalledWith({
					project_id: "project-1",
					tree_id: "tree-1",
					position: 0,
				})
				expect(result).toEqual(mockProjectTree)
			})
		})

		describe("fetchProjectTreesWithDetails", () => {
			it("should fetch project trees with joined data", async () => {
				// Arrange
				const mockData = [
					{
						position: 0,
						tree: {
							id: "tree-1",
							name: "Tree 1",
						},
					},
					{
						position: 1,
						tree: {
							id: "tree-2",
							name: "Tree 2",
						},
					},
				]
				mockOrder.mockReturnValue({ data: mockData, error: null })

				// Act
				const result =
					await repository.fetchProjectTreesWithDetails("project-1")

				// Assert
				expect(mockFrom).toHaveBeenCalledWith("project_trees")
				expect(mockEq).toHaveBeenCalledWith("project_id", "project-1")
				expect(mockOrder).toHaveBeenCalledWith("position", { ascending: true })
				expect(result).toEqual(mockData)
			})

			it("should return empty array when no data", async () => {
				// Arrange
				mockOrder.mockReturnValue({ data: null, error: null })

				// Act
				const result =
					await repository.fetchProjectTreesWithDetails("project-empty")

				// Assert
				expect(result).toEqual([])
			})
		})

		describe("fetchProjectIdsForTree", () => {
			it("should fetch project IDs for a tree", async () => {
				// Arrange
				const mockData = [
					{ project_id: "project-1" },
					{ project_id: "project-2" },
					{ project_id: "project-3" },
				]
				mockEq.mockReturnValue({ data: mockData, error: null })

				// Act
				const result = await repository.fetchProjectIdsForTree("tree-1")

				// Assert
				expect(mockFrom).toHaveBeenCalledWith("project_trees")
				expect(mockSelect).toHaveBeenCalledWith("project_id")
				expect(mockEq).toHaveBeenCalledWith("tree_id", "tree-1")
				expect(result).toEqual(["project-1", "project-2", "project-3"])
			})

			it("should return empty array when no projects found", async () => {
				// Arrange
				mockEq.mockReturnValue({ data: null, error: null })

				// Act
				const result = await repository.fetchProjectIdsForTree("tree-empty")

				// Assert
				expect(result).toEqual([])
			})

			it("should throw error on database error", async () => {
				// Arrange
				mockEq.mockReturnValue({
					data: null,
					error: { message: "Database error" },
				})

				// Act & Assert
				await expect(
					repository.fetchProjectIdsForTree("tree-1"),
				).rejects.toThrow("Failed to fetch projects for tree: Database error")
			})
		})

		describe("fetchAllProjectTreeRelations", () => {
			it("should fetch all project-tree relations for a user", async () => {
				// Arrange
				const mockData = [
					{
						project_id: "project-1",
						tree_id: "tree-1",
						projects: { creator_id: "team-1" },
					},
					{
						project_id: "project-1",
						tree_id: "tree-2",
						projects: { creator_id: "team-1" },
					},
					{
						project_id: "project-2",
						tree_id: "tree-1",
						projects: { creator_id: "team-1" },
					},
				]
				mockEq.mockReturnValue({ data: mockData, error: null })

				// Act
				const result = await repository.fetchAllProjectTreeRelations("team-1")

				// Assert
				expect(mockFrom).toHaveBeenCalledWith("project_trees")
				expect(mockSelect).toHaveBeenCalledWith(
					expect.stringContaining("project_id"),
				)
				expect(mockSelect).toHaveBeenCalledWith(
					expect.stringContaining("tree_id"),
				)
				expect(mockSelect).toHaveBeenCalledWith(
					expect.stringContaining("projects!inner(creator_id, name)"),
				)
				expect(mockEq).toHaveBeenCalledWith("projects.creator_id", "team-1")
				expect(result).toEqual([
					{ project_id: "project-1", tree_id: "tree-1" },
					{ project_id: "project-1", tree_id: "tree-2" },
					{ project_id: "project-2", tree_id: "tree-1" },
				])
			})

			it("should return empty array when no relations found", async () => {
				// Arrange
				mockEq.mockReturnValue({ data: null, error: null })

				// Act
				const result =
					await repository.fetchAllProjectTreeRelations("team-empty")

				// Assert
				expect(result).toEqual([])
			})

			it("should throw error on database error", async () => {
				// Arrange
				mockEq.mockReturnValue({
					data: null,
					error: { message: "Database error" },
				})

				// Act & Assert
				await expect(
					repository.fetchAllProjectTreeRelations("team-1"),
				).rejects.toThrow(
					"Failed to fetch all project tree relations: Database error",
				)
			})
		})
	})

	describe("User Details Methods", () => {
		describe("fetchUserDetailsById", () => {
			it("should fetch user details by user ID", async () => {
				// Arrange
				const mockUserDetails = {
					user_id: "user-123",
					team_id: "team-456",
					username: "testuser",
					email: "test@example.com",
				}
				mockSingle.mockReturnValue({ data: mockUserDetails, error: null })

				// Act
				const result = await repository.fetchUserDetailsById("user-123")

				// Assert
				expect(mockFrom).toHaveBeenCalledWith("v_user_details")
				expect(mockSelect).toHaveBeenCalledWith("*")
				expect(mockEq).toHaveBeenCalledWith("user_id", "user-123")
				expect(mockSingle).toHaveBeenCalled()
				expect(result).toEqual(mockUserDetails)
			})

			it("should return null when user details not found", async () => {
				// Arrange
				mockSingle.mockReturnValue({
					data: null,
					error: { code: "PGRST116" },
				})

				// Act
				const result = await repository.fetchUserDetailsById("nonexistent")

				// Assert
				expect(result).toBeNull()
			})

			it("should throw error on database failure", async () => {
				// Arrange
				mockSingle.mockReturnValue({
					data: null,
					error: { code: "OTHER", message: "DB error" },
				})

				// Act & Assert
				await expect(
					repository.fetchUserDetailsById("user-error"),
				).rejects.toThrow("Failed to fetch user details: DB error")
			})
		})
	})

	describe("fetchNodeChildrenCounts", () => {
		let mockIn: jest.Mock

		beforeEach(() => {
			mockIn = jest.fn(() => ({
				order: mockOrder,
				data: null,
				error: null,
			}))
			mockSelect.mockReturnValue({
				in: mockIn,
				order: mockOrder,
				data: null,
				error: null,
			})
		})

		it("should fetch children counts for given node IDs", async () => {
			// Arrange
			const nodeIds = ["node-1", "node-2", "node-3"]
			const mockData = [
				{ id: "node-1", children_count: 5, name: "Node 1" },
				{ id: "node-2", children_count: 3, name: "Node 2" },
				{ id: "node-3", children_count: 0, name: "Node 3" },
			]

			mockOrder.mockReturnValue({ data: mockData, error: null })

			// Act
			const result = await repository.fetchNodeChildrenCounts(nodeIds)

			// Assert
			expect(mockFrom).toHaveBeenCalledWith("tree_nodes")
			expect(mockSelect).toHaveBeenCalledWith("id, children_count, name")
			expect(mockIn).toHaveBeenCalledWith("id", nodeIds)
			expect(mockOrder).toHaveBeenCalledWith("node_order", { ascending: true })
			expect(result).toEqual(mockData)
		})

		it("should return empty array when no node IDs provided", async () => {
			// Arrange
			const nodeIds: string[] = []

			// Act
			const result = await repository.fetchNodeChildrenCounts(nodeIds)

			// Assert
			expect(result).toEqual([])
			expect(mockFrom).not.toHaveBeenCalled()
		})

		it("should return empty array when database returns no data", async () => {
			// Arrange
			const nodeIds = ["node-1"]
			mockOrder.mockReturnValue({ data: null, error: null })

			// Act
			const result = await repository.fetchNodeChildrenCounts(nodeIds)

			// Assert
			expect(result).toEqual([])
		})

		it("should throw error when database query fails", async () => {
			// Arrange
			const nodeIds = ["node-1"]
			const mockError = { message: "Database connection failed" }
			mockOrder.mockReturnValue({ data: null, error: mockError })

			// Act & Assert
			await expect(repository.fetchNodeChildrenCounts(nodeIds)).rejects.toThrow(
				"Failed to fetch node children counts: Database connection failed",
			)
		})

		it("should handle nodes with zero children", async () => {
			// Arrange
			const nodeIds = ["node-1", "node-2"]
			const mockData = [
				{ id: "node-1", children_count: 0, name: "Node 1" },
				{ id: "node-2", children_count: 0, name: "Node 2" },
			]

			mockOrder.mockReturnValue({ data: mockData, error: null })

			// Act
			const result = await repository.fetchNodeChildrenCounts(nodeIds)

			// Assert
			expect(result).toEqual(mockData)
		})

		it("should handle nodes with varying children counts", async () => {
			// Arrange
			const nodeIds = ["node-1", "node-2", "node-3", "node-4"]
			const mockData = [
				{ id: "node-1", children_count: 0, name: "No children" },
				{ id: "node-2", children_count: 1, name: "One child" },
				{ id: "node-3", children_count: 5, name: "Five children" },
				{ id: "node-4", children_count: 10, name: "Ten children" },
			]

			mockOrder.mockReturnValue({ data: mockData, error: null })

			// Act
			const result = await repository.fetchNodeChildrenCounts(nodeIds)

			// Assert
			expect(result).toEqual(mockData)
			expect(result[0].children_count).toBe(0)
			expect(result[3].children_count).toBe(10)
		})

		it("should return data with correct structure", async () => {
			// Arrange
			const nodeIds = ["node-1"]
			const mockData = [{ id: "node-1", children_count: 3, name: "Node 1" }]

			mockOrder.mockReturnValue({ data: mockData, error: null })

			// Act
			const result = await repository.fetchNodeChildrenCounts(nodeIds)

			// Assert
			expect(result[0]).toHaveProperty("id")
			expect(result[0]).toHaveProperty("children_count")
			expect(result[0]).toHaveProperty("name")
			expect(typeof result[0].id).toBe("string")
			expect(typeof result[0].children_count).toBe("number")
			expect(typeof result[0].name).toBe("string")
		})
	})
})
