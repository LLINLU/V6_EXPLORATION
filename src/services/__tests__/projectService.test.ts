import { supabase } from "@/integrations/supabase/client"
import { ProjectService } from "@/services/projectService"
import type { IDatabaseRepository } from "@/services/types"

// Mock supabase client
jest.mock("@/integrations/supabase/client", () => ({
	supabase: {
		auth: {
			getUser: jest.fn(),
		},
		from: jest.fn(),
	},
}))

describe("ProjectService", () => {
	let service: ProjectService
	let mockDatabaseRepo: jest.Mocked<IDatabaseRepository>

	beforeEach(() => {
		// Create mock database repository
		mockDatabaseRepo = {
			fetchTrees: jest.fn(),
			fetchTreeIds: jest.fn(),
			fetchTreeById: jest.fn(),
			fetchTreesByTeam: jest.fn(),
			fetchTreesBySearchQuery: jest.fn(),
			updateLastViewedAt: jest.fn(),
			updateSearchName: jest.fn(),
			deleteTree: jest.fn(),
			createProject: jest.fn(),
			fetchProjects: jest.fn(),
			fetchProjectsWithTreeCount: jest.fn(),
			fetchProjectById: jest.fn(),
			updateProject: jest.fn(),
			deleteProject: jest.fn(),
			updateProjectName: jest.fn(),
			addTreeToProject: jest.fn(),
			removeTreeFromProject: jest.fn(),
			fetchProjectTreesWithDetails: jest.fn(),
			fetchProjectIdsForTree: jest.fn(),
			fetchAllProjectTreeRelations: jest.fn(),
			updateProjectTreePosition: jest.fn(),
			fetchUserDetailsById: jest.fn(),
			fetchNodeChildrenCounts: jest.fn(),
			checkDatabaseHealth: jest.fn(),
			fetchTreeMetadata: jest.fn(),
			fetchTreeNodes: jest.fn(),
		}

		// Create service with mock repository
		service = new ProjectService(mockDatabaseRepo)

		// Mock supabase auth
		;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
			data: { user: { id: "user-123" } },
		})

		// Mock fetchUserDetailsById to return user details with team_id
		mockDatabaseRepo.fetchUserDetailsById.mockResolvedValue({
			user_id: "user-123",
			team_id: "team-456",
			username: "testuser",
			email: "test@example.com",
		} as any)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe("getUserDetails (private method behavior)", () => {
		it("should successfully get user details when user is authenticated", async () => {
			// Arrange
			const mockProjects: any[] = []
			mockDatabaseRepo.fetchProjects.mockResolvedValue(mockProjects)

			// Act
			await service.fetchProjects()

			// Assert
			expect(supabase.auth.getUser).toHaveBeenCalled()
			expect(mockDatabaseRepo.fetchUserDetailsById).toHaveBeenCalledWith(
				"user-123",
			)
		})

		it("should throw error when user is not authenticated", async () => {
			// Arrange
			;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
				data: { user: null },
			})

			// Act & Assert
			await expect(service.fetchProjects()).rejects.toThrow(
				"User not authenticated",
			)
			expect(mockDatabaseRepo.fetchUserDetailsById).not.toHaveBeenCalled()
		})

		it("should throw error when user details cannot be found", async () => {
			// Arrange
			mockDatabaseRepo.fetchUserDetailsById.mockResolvedValue(null)

			// Act & Assert
			await expect(service.fetchProjects()).rejects.toThrow(
				"User details not found",
			)
		})
	})

	describe("createProject", () => {
		it("should create a project with default visibility", async () => {
			// Arrange
			const mockProject = {
				id: "project-1",
				name: "Test Project",
				visibility: "private",
				team_id: "team-456",
				creator_id: "user-123",
			}
			mockDatabaseRepo.createProject.mockResolvedValue(mockProject as any)

			// Act
			const result = await service.createProject("Test Project")

			// Assert
			expect(mockDatabaseRepo.fetchUserDetailsById).toHaveBeenCalledWith(
				"user-123",
			)
			expect(mockDatabaseRepo.createProject).toHaveBeenCalledWith({
				name: "Test Project",
				description: undefined,
				visibility: "private",
				teamId: "team-456",
				creatorId: "user-123",
			})
			expect(result).toEqual(mockProject)
		})

		it("should create a project with custom options", async () => {
			// Arrange
			const mockProject = {
				id: "project-2",
				name: "Team Project",
				visibility: "team",
				team_id: "team-456",
			}
			mockDatabaseRepo.createProject.mockResolvedValue(mockProject as any)

			// Act
			await service.createProject("Team Project", {
				description: "A team project",
				visibility: "team",
			})

			// Assert
			expect(mockDatabaseRepo.createProject).toHaveBeenCalledWith({
				name: "Team Project",
				description: "A team project",
				visibility: "team",
				teamId: "team-456",
				creatorId: "user-123",
			})
		})

		it("should throw error when user not authenticated", async () => {
			// Arrange
			;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
				data: { user: null },
			})

			// Act & Assert
			await expect(service.createProject("Test")).rejects.toThrow(
				"User not authenticated",
			)
		})

		it("should throw error when user details not found", async () => {
			// Arrange
			mockDatabaseRepo.fetchUserDetailsById.mockResolvedValue(null)

			// Act & Assert
			await expect(service.createProject("Test")).rejects.toThrow(
				"User details not found",
			)
		})

		it("should throw error when team_id not found", async () => {
			// Arrange
			mockDatabaseRepo.fetchUserDetailsById.mockResolvedValue({
				user_id: "user-123",
				team_id: null,
			} as any)

			// Act & Assert
			await expect(service.createProject("Test")).rejects.toThrow(
				"Team ID not found",
			)
		})

		it("should throw error when user_id not found", async () => {
			// Arrange
			mockDatabaseRepo.fetchUserDetailsById.mockResolvedValue({
				user_id: null,
				team_id: "team-456",
			} as any)

			// Act & Assert
			await expect(service.createProject("Test")).rejects.toThrow(
				"User ID not found",
			)
		})
	})

	describe("fetchProjects", () => {
		it("should fetch projects with user team filter", async () => {
			// Arrange
			const mockProjects = [{ id: "project-1", name: "Project 1" }]
			mockDatabaseRepo.fetchProjects.mockResolvedValue(mockProjects as any)

			// Act
			const result = await service.fetchProjects()

			// Assert
			expect(mockDatabaseRepo.fetchUserDetailsById).toHaveBeenCalledWith(
				"user-123",
			)
			expect(mockDatabaseRepo.fetchProjects).toHaveBeenCalledWith({
				limit: 50,
				teamId: "team-456",
			})
			expect(result).toEqual(mockProjects)
		})

		it("should fetch projects with custom limit", async () => {
			// Arrange
			mockDatabaseRepo.fetchProjects.mockResolvedValue([])

			// Act
			await service.fetchProjects(10)

			// Assert
			expect(mockDatabaseRepo.fetchProjects).toHaveBeenCalledWith({
				limit: 10,
				teamId: "team-456",
			})
		})

		it("should throw error when user details not found", async () => {
			// Arrange
			mockDatabaseRepo.fetchUserDetailsById.mockResolvedValue(null)

			// Act & Assert
			await expect(service.fetchProjects()).rejects.toThrow(
				"User details not found",
			)
		})

		it("should throw error when team_id not found", async () => {
			// Arrange
			mockDatabaseRepo.fetchUserDetailsById.mockResolvedValue({
				user_id: "user-123",
				team_id: null,
			} as any)

			// Act & Assert
			await expect(service.fetchProjects()).rejects.toThrow("Team ID not found")
		})
	})

	describe("fetchProjectsWithTreeCount", () => {
		it("should fetch projects with tree count", async () => {
			// Arrange
			const mockProjects = [
				{ id: "project-1", name: "Project 1", tree_count: 3 },
				{ id: "project-2", name: "Project 2", tree_count: 5 },
			]
			mockDatabaseRepo.fetchProjectsWithTreeCount.mockResolvedValue(
				mockProjects as any,
			)

			// Act
			const result = await service.fetchProjectsWithTreeCount()

			// Assert
			expect(mockDatabaseRepo.fetchUserDetailsById).toHaveBeenCalledWith(
				"user-123",
			)
			expect(mockDatabaseRepo.fetchProjectsWithTreeCount).toHaveBeenCalledWith({
				limit: 50,
				teamId: "team-456",
			})
			expect(result).toEqual(mockProjects)
		})

		it("should fetch projects with custom limit", async () => {
			// Arrange
			mockDatabaseRepo.fetchProjectsWithTreeCount.mockResolvedValue([])

			// Act
			await service.fetchProjectsWithTreeCount(10)

			// Assert
			expect(mockDatabaseRepo.fetchProjectsWithTreeCount).toHaveBeenCalledWith({
				limit: 10,
				teamId: "team-456",
			})
		})

		it("should throw error when user details not found", async () => {
			// Arrange
			mockDatabaseRepo.fetchUserDetailsById.mockResolvedValue(null)

			// Act & Assert
			await expect(service.fetchProjectsWithTreeCount()).rejects.toThrow(
				"User details not found",
			)
		})

		it("should throw error when team_id not found", async () => {
			// Arrange
			mockDatabaseRepo.fetchUserDetailsById.mockResolvedValue({
				user_id: "user-123",
				team_id: null,
			} as any)

			// Act & Assert
			await expect(service.fetchProjectsWithTreeCount()).rejects.toThrow(
				"Team ID not found",
			)
		})
	})

	describe("fetchProjectById", () => {
		it("should fetch a single project", async () => {
			// Arrange
			const mockProject = { id: "project-1", name: "Test Project" }
			mockDatabaseRepo.fetchProjectById.mockResolvedValue(mockProject as any)

			// Act
			const result = await service.fetchProjectById("project-1")

			// Assert
			expect(mockDatabaseRepo.fetchProjectById).toHaveBeenCalledWith(
				"project-1",
			)
			expect(result).toEqual(mockProject)
		})
	})

	describe("updateProject", () => {
		it("should update a project", async () => {
			// Arrange
			const mockProject = { id: "project-1", name: "Updated Name" }
			mockDatabaseRepo.updateProject.mockResolvedValue(mockProject as any)

			// Act
			const result = await service.updateProject("project-1", {
				name: "Updated Name",
			})

			// Assert
			expect(mockDatabaseRepo.updateProject).toHaveBeenCalledWith("project-1", {
				name: "Updated Name",
			})
			expect(result).toEqual(mockProject)
		})
	})

	describe("deleteProject", () => {
		it("should delete a project", async () => {
			// Arrange
			mockDatabaseRepo.deleteProject.mockResolvedValue(undefined)

			// Act
			await service.deleteProject("project-1")

			// Assert
			expect(mockDatabaseRepo.deleteProject).toHaveBeenCalledWith("project-1")
		})
	})

	describe("addTreeToProject", () => {
		it("should add a tree to a project", async () => {
			// Arrange
			const mockProjectTree = {
				project_id: "project-1",
				tree_id: "tree-1",
				position: 0,
			}
			mockDatabaseRepo.addTreeToProject.mockResolvedValue(
				mockProjectTree as any,
			)

			// Act
			const result = await service.addTreeToProject("project-1", "tree-1")

			// Assert
			expect(mockDatabaseRepo.addTreeToProject).toHaveBeenCalledWith(
				"project-1",
				"tree-1",
				undefined,
			)
			expect(result).toEqual(mockProjectTree)
		})

		it("should add a tree with custom position", async () => {
			// Arrange
			mockDatabaseRepo.addTreeToProject.mockResolvedValue({} as any)

			// Act
			await service.addTreeToProject("project-1", "tree-1", 5)

			// Assert
			expect(mockDatabaseRepo.addTreeToProject).toHaveBeenCalledWith(
				"project-1",
				"tree-1",
				5,
			)
		})
	})

	describe("removeTreeFromProject", () => {
		it("should remove a tree from a project", async () => {
			// Arrange
			mockDatabaseRepo.removeTreeFromProject.mockResolvedValue(undefined)

			// Act
			await service.removeTreeFromProject("project-1", "tree-1")

			// Assert
			expect(mockDatabaseRepo.removeTreeFromProject).toHaveBeenCalledWith(
				"project-1",
				"tree-1",
			)
		})
	})

	describe("fetchTreesByProject", () => {
		it("should fetch and extract trees from project", async () => {
			// Arrange
			const mockProjectTrees = [
				{
					position: 0,
					tree: {
						id: "tree-1",
						name: "Tree 1",
						search_theme: "Theme 1",
						created_at: "2024-01-01",
					},
				},
				{
					position: 1,
					tree: {
						id: "tree-2",
						name: "Tree 2",
						search_theme: "Theme 2",
						created_at: "2024-01-02",
					},
				},
			]
			mockDatabaseRepo.fetchProjectTreesWithDetails.mockResolvedValue(
				mockProjectTrees as any,
			)

			// Act
			const result = await service.fetchTreesByProject("project-1")

			// Assert
			expect(
				mockDatabaseRepo.fetchProjectTreesWithDetails,
			).toHaveBeenCalledWith("project-1")
			expect(result).toEqual([
				mockProjectTrees[0].tree,
				mockProjectTrees[1].tree,
			])
		})

		it("should filter out null trees", async () => {
			// Arrange
			const mockProjectTrees = [
				{
					position: 0,
					tree: { id: "tree-1", name: "Tree 1" },
				},
				{
					position: 1,
					tree: null,
				},
			]
			mockDatabaseRepo.fetchProjectTreesWithDetails.mockResolvedValue(
				mockProjectTrees as any,
			)

			// Act
			const result = await service.fetchTreesByProject("project-1")

			// Assert
			expect(result).toHaveLength(1)
			expect(result[0]).toEqual({ id: "tree-1", name: "Tree 1" })
		})
	})

	describe("updateProjectTreePosition", () => {
		it("should update tree position in project", async () => {
			// Arrange
			mockDatabaseRepo.updateProjectTreePosition.mockResolvedValue(undefined)

			// Act
			await service.updateProjectTreePosition("project-1", "tree-1", 3)

			// Assert
			expect(mockDatabaseRepo.updateProjectTreePosition).toHaveBeenCalledWith(
				"project-1",
				"tree-1",
				3,
			)
		})
	})

	describe("fetchProjectWithTrees", () => {
		it("should fetch project with its trees", async () => {
			// Arrange
			const mockProject = {
				id: "project-1",
				name: "Test Project",
			}
			const mockProjectTrees = [
				{
					position: 0,
					tree: { id: "tree-1", name: "Tree 1" },
				},
				{
					position: 1,
					tree: { id: "tree-2", name: "Tree 2" },
				},
			]
			mockDatabaseRepo.fetchProjectById.mockResolvedValue(mockProject as any)
			mockDatabaseRepo.fetchProjectTreesWithDetails.mockResolvedValue(
				mockProjectTrees as any,
			)

			// Act
			const result = await service.fetchProjectWithTrees("project-1")

			// Assert
			expect(result).toEqual({
				...mockProject,
				trees: [mockProjectTrees[0].tree, mockProjectTrees[1].tree],
			})
		})

		it("should return null when project not found", async () => {
			// Arrange
			mockDatabaseRepo.fetchProjectById.mockResolvedValue(null)

			// Act
			const result = await service.fetchProjectWithTrees("nonexistent")

			// Assert
			expect(result).toBeNull()
			expect(
				mockDatabaseRepo.fetchProjectTreesWithDetails,
			).not.toHaveBeenCalled()
		})
	})

	describe("fetchProjectIdsForTree", () => {
		it("should fetch project IDs for a tree", async () => {
			// Arrange
			const mockProjectIds = ["project-1", "project-2", "project-3"]
			mockDatabaseRepo.fetchProjectIdsForTree.mockResolvedValue(mockProjectIds)

			// Act
			const result = await service.fetchProjectIdsForTree("tree-1")

			// Assert
			expect(mockDatabaseRepo.fetchProjectIdsForTree).toHaveBeenCalledWith(
				"tree-1",
			)
			expect(result).toEqual(mockProjectIds)
		})
	})

	describe("fetchAllProjectTreeRelations", () => {
		it("should fetch all project-tree relations for current team", async () => {
			// Arrange
			const mockRelations = [
				{ project_id: "project-1", tree_id: "tree-1" },
				{ project_id: "project-1", tree_id: "tree-2" },
				{ project_id: "project-2", tree_id: "tree-1" },
			]
			mockDatabaseRepo.fetchAllProjectTreeRelations.mockResolvedValue(
				mockRelations,
			)

			// Act
			const result = await service.fetchAllProjectTreeRelations()

			// Assert
			expect(supabase.auth.getUser).toHaveBeenCalled()
			expect(mockDatabaseRepo.fetchUserDetailsById).toHaveBeenCalledWith(
				"user-123",
			)
			expect(
				mockDatabaseRepo.fetchAllProjectTreeRelations,
			).toHaveBeenCalledWith("team-456")
			expect(result).toEqual(mockRelations)
		})

		it("should throw error when user not authenticated", async () => {
			// Arrange
			;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
				data: { user: null },
				error: null,
			})

			// Act & Assert
			await expect(service.fetchAllProjectTreeRelations()).rejects.toThrow(
				"User not authenticated",
			)
		})

		it("should throw error when user details not found", async () => {
			// Arrange
			mockDatabaseRepo.fetchUserDetailsById.mockResolvedValue(null)

			// Act & Assert
			await expect(service.fetchAllProjectTreeRelations()).rejects.toThrow(
				"User details not found",
			)
		})
	})
})
