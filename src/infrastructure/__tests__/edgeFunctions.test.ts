import { EdgeFunctionRepository } from "@/infrastructure/edgeFunctions"
import { supabase } from "@/integrations/supabase/client"

// Mock supabase client
jest.mock("@/integrations/supabase/client", () => ({
	supabase: {
		functions: {
			invoke: jest.fn(),
		},
	},
}))

describe("EdgeFunctionRepository", () => {
	let repository: EdgeFunctionRepository
	let mockInvoke: jest.Mock

	beforeEach(() => {
		repository = new EdgeFunctionRepository()
		mockInvoke = supabase.functions.invoke as jest.Mock
		mockInvoke.mockClear()
		mockInvoke.mockResolvedValue({ data: null, error: null })
	})

	describe("invokeDuplicateTree", () => {
		it("should call supabase.functions.invoke with correct function name and body", () => {
			// Arrange
			const treeId = "tree-123"
			const newName = "My Duplicated Tree"

			// Act
			repository.invokeDuplicateTree(treeId, newName)

			// Assert
			expect(mockInvoke).toHaveBeenCalledWith("duplicate-tree", {
				body: {
					tree_id: treeId,
					new_name: newName,
				},
			})
		})

		it("should call supabase.functions.invoke without new_name when not provided", () => {
			// Arrange
			const treeId = "tree-456"

			// Act
			repository.invokeDuplicateTree(treeId)

			// Assert
			expect(mockInvoke).toHaveBeenCalledWith("duplicate-tree", {
				body: {
					tree_id: treeId,
					new_name: undefined,
				},
			})
		})

		it("should handle errors silently (fire-and-forget pattern)", async () => {
			// Arrange
			const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
			mockInvoke.mockRejectedValue(new Error("Network error"))

			// Act
			repository.invokeDuplicateTree("tree-789")

			// Wait for promise to settle
			await new Promise((resolve) => setTimeout(resolve, 0))

			// Assert
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"[invokeDuplicateTree] Error:",
				expect.any(Error),
			)

			// Cleanup
			consoleErrorSpy.mockRestore()
		})

		it("should not throw error even if supabase call fails", () => {
			// Arrange
			mockInvoke.mockRejectedValue(new Error("API error"))

			// Act & Assert
			expect(() => repository.invokeDuplicateTree("tree-abc")).not.toThrow()
		})

		it("should handle multiple calls correctly", () => {
			// Act
			repository.invokeDuplicateTree("tree-1", "Name 1")
			repository.invokeDuplicateTree("tree-2", "Name 2")
			repository.invokeDuplicateTree("tree-3")

			// Assert
			expect(mockInvoke).toHaveBeenCalledTimes(3)
			expect(mockInvoke).toHaveBeenNthCalledWith(1, "duplicate-tree", {
				body: { tree_id: "tree-1", new_name: "Name 1" },
			})
			expect(mockInvoke).toHaveBeenNthCalledWith(2, "duplicate-tree", {
				body: { tree_id: "tree-2", new_name: "Name 2" },
			})
			expect(mockInvoke).toHaveBeenNthCalledWith(3, "duplicate-tree", {
				body: { tree_id: "tree-3", new_name: undefined },
			})
		})
	})

	describe("fire-and-forget behavior", () => {
		it("should return immediately without waiting for response", () => {
			// Arrange
			const slowPromise = new Promise((resolve) => setTimeout(resolve, 1000))
			mockInvoke.mockReturnValue(slowPromise)

			// Act
			const startTime = Date.now()
			repository.invokeDuplicateTree("tree-slow")
			const endTime = Date.now()

			// Assert
			// Should return immediately (within 100ms)
			expect(endTime - startTime).toBeLessThan(100)
		})

		it("should not propagate errors to caller", async () => {
			// Arrange
			mockInvoke.mockRejectedValue(new Error("Edge function error"))
			const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

			// Act & Assert
			expect(() => repository.invokeDuplicateTree("tree-error")).not.toThrow()

			// Wait for error handling
			await new Promise((resolve) => setTimeout(resolve, 0))

			// Verify error was logged
			expect(consoleErrorSpy).toHaveBeenCalled()

			// Cleanup
			consoleErrorSpy.mockRestore()
		})
	})

	describe("request body format", () => {
		it("should satisfy DuplicateTreeRequest interface", () => {
			// Act
			repository.invokeDuplicateTree("tree-type-check", "Type Check Name")

			// Assert
			const callArgs = mockInvoke.mock.calls[0][1]
			expect(callArgs.body).toHaveProperty("tree_id")
			expect(callArgs.body).toHaveProperty("new_name")
			expect(typeof callArgs.body.tree_id).toBe("string")
			expect(
				typeof callArgs.body.new_name === "string" ||
					callArgs.body.new_name === undefined,
			).toBe(true)
		})
	})
})
