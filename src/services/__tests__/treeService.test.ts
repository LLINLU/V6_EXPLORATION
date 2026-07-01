import type { Tree } from "@/infrastructure/supabaseRepository"
import { supabase } from "@/integrations/supabase/client"
import { TreeService } from "@/services/treeService"
import type {
	IDatabaseRepository,
	IEdgeFunctionRepository,
} from "@/services/types"

// Mock supabase auth
jest.mock("@/integrations/supabase/client", () => ({
	supabase: {
		auth: {
			getUser: jest.fn(),
		},
	},
}))

describe("TreeService", () => {
	let mockEdgeFunctionRepo: IEdgeFunctionRepository
	let mockDatabaseRepo: IDatabaseRepository
	let mockGetUser: jest.Mock

	beforeEach(() => {
		mockEdgeFunctionRepo = {
			invokeDuplicateTree: jest.fn().mockResolvedValue(undefined),
			invokeGenerateTree: jest
				.fn()
				.mockResolvedValue({ data: null, error: null }),
			invokeResearchContext: jest
				.fn()
				.mockResolvedValue({ data: null, error: null }),
		}

		mockDatabaseRepo = {
			fetchTrees: jest.fn(),
			fetchTreeIds: jest.fn(),
			fetchTreeById: jest.fn(),
			fetchTreesByTeam: jest.fn(),
			fetchTreesBySearchQuery: jest.fn(),
			updateLastViewedAt: jest.fn(),
			updateSearchName: jest.fn(),
			deleteTree: jest.fn(),
			fetchNodeChildrenCounts: jest.fn(),
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
			checkDatabaseHealth: jest.fn(),
			fetchTreeMetadata: jest.fn(),
			fetchTreeNodes: jest.fn(),
		}

		mockGetUser = supabase.auth.getUser as jest.Mock
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-123" } },
		})
	})

	describe("duplicateTree", () => {
		it("should call edge function repository with correct parameters", () => {
			// Arrange
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)
			const treeId = "tree-123"
			const newName = "My New Tree"

			// Act
			service.duplicateTree(treeId, newName)

			// Assert
			expect(mockEdgeFunctionRepo.invokeDuplicateTree).toHaveBeenCalledWith(
				treeId,
				newName,
			)
			expect(mockEdgeFunctionRepo.invokeDuplicateTree).toHaveBeenCalledTimes(1)
		})

		it("should call edge function repository without newName when not provided", () => {
			// Arrange
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)
			const treeId = "tree-456"

			// Act
			service.duplicateTree(treeId)

			// Assert
			expect(mockEdgeFunctionRepo.invokeDuplicateTree).toHaveBeenCalledWith(
				treeId,
				undefined,
			)
		})
	})

	describe("fetchTrees", () => {
		it("should fetch trees with team_id from auth", async () => {
			// Arrange
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Tree 1",
					search_theme: "Theme 1",
					created_at: "2024-01-01",
					mode: "TED",
					user_id: "user-123",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]
			;(mockDatabaseRepo.fetchTrees as jest.Mock).mockResolvedValue(mockTrees)
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)

			// Act
			const result = await service.fetchTrees()

			// Assert
			expect(mockGetUser).toHaveBeenCalled()
			expect(mockDatabaseRepo.fetchTrees).toHaveBeenCalledWith({
				teamId: "user-123",
			})
			expect(result).toEqual(mockTrees)
		})

		it("should handle missing user_id", async () => {
			// Arrange
			mockGetUser.mockResolvedValue({ data: { user: null } })
			;(mockDatabaseRepo.fetchTrees as jest.Mock).mockResolvedValue([])
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)

			// Act
			await service.fetchTrees()

			// Assert
			expect(mockDatabaseRepo.fetchTrees).toHaveBeenCalledWith({
				teamId: undefined,
			})
		})
	})

	describe("fetchTreeIds", () => {
		it("should fetch tree IDs with team_id from auth", async () => {
			// Arrange
			const mockIds = ["tree-1", "tree-2"]
			;(mockDatabaseRepo.fetchTreeIds as jest.Mock).mockResolvedValue(mockIds)
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)

			// Act
			const result = await service.fetchTreeIds(10)

			// Assert
			expect(mockGetUser).toHaveBeenCalled()
			expect(mockDatabaseRepo.fetchTreeIds).toHaveBeenCalledWith({
				limit: 10,
				teamId: "user-123",
			})
			expect(result).toEqual(mockIds)
		})
	})

	describe("fetchTreesForPolling", () => {
		it("should fetch trees for polling with team_id", async () => {
			// Arrange
			const mockTrees: Tree[] = [
				{
					id: "tree-1",
					name: "Tree 1",
					search_theme: "Theme",
					created_at: "2024-01-01",
					mode: null,
					user_id: "user-123",
					description: null,
					last_viewed_at: null,
					layer_config: null,
					reasoning: null,
					scenario_inputs: null,
					team_id: null,
					updated_at: "2024-01-01",
				},
			]
			;(mockDatabaseRepo.fetchTrees as jest.Mock).mockResolvedValue(mockTrees)
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)

			// Act
			const result = await service.fetchTreesForPolling()

			// Assert
			expect(mockDatabaseRepo.fetchTrees).toHaveBeenCalledWith({
				teamId: "user-123",
			})
			expect(result).toEqual(mockTrees)
		})
	})

	describe("updateLastViewedAt", () => {
		it("should delegate to database repository", async () => {
			// Arrange
			const treeId = "tree-123"
			;(mockDatabaseRepo.updateLastViewedAt as jest.Mock).mockResolvedValue(
				undefined,
			)
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)

			// Act
			await service.updateLastViewedAt(treeId)

			// Assert
			expect(mockDatabaseRepo.updateLastViewedAt).toHaveBeenCalledWith(treeId)
			expect(mockDatabaseRepo.updateLastViewedAt).toHaveBeenCalledTimes(1)
		})

		it("should propagate errors from database repository", async () => {
			// Arrange
			const treeId = "tree-error"
			const error = new Error("Database error")
			;(mockDatabaseRepo.updateLastViewedAt as jest.Mock).mockRejectedValue(
				error,
			)
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)

			// Act & Assert
			await expect(service.updateLastViewedAt(treeId)).rejects.toThrow(
				"Database error",
			)
		})
	})

	describe("fetchNodeChildrenCounts", () => {
		it("should delegate to database repository", async () => {
			// Arrange
			const nodeIds = ["node-1", "node-2", "node-3"]
			const mockCounts = [
				{ id: "node-1", children_count: 5, name: "Node 1" },
				{ id: "node-2", children_count: 3, name: "Node 2" },
				{ id: "node-3", children_count: 0, name: "Node 3" },
			]
			;(
				mockDatabaseRepo.fetchNodeChildrenCounts as jest.Mock
			).mockResolvedValue(mockCounts)
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)

			// Act
			const result = await service.fetchNodeChildrenCounts(nodeIds)

			// Assert
			expect(mockDatabaseRepo.fetchNodeChildrenCounts).toHaveBeenCalledWith(
				nodeIds,
			)
			expect(result).toEqual(mockCounts)
		})

		it("should handle empty array", async () => {
			// Arrange
			;(
				mockDatabaseRepo.fetchNodeChildrenCounts as jest.Mock
			).mockResolvedValue([])
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)

			// Act
			const result = await service.fetchNodeChildrenCounts([])

			// Assert
			expect(mockDatabaseRepo.fetchNodeChildrenCounts).toHaveBeenCalledWith([])
			expect(result).toEqual([])
		})

		it("should propagate errors from database repository", async () => {
			// Arrange
			const nodeIds = ["node-1"]
			const error = new Error("Query failed")
			;(
				mockDatabaseRepo.fetchNodeChildrenCounts as jest.Mock
			).mockRejectedValue(error)
			const service = new TreeService(mockEdgeFunctionRepo, mockDatabaseRepo)

			// Act & Assert
			await expect(service.fetchNodeChildrenCounts(nodeIds)).rejects.toThrow(
				"Query failed",
			)
		})
	})
})
