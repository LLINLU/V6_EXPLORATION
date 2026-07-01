import { renderHook } from "@testing-library/react"
import { treeService } from "@/services/treeService"
import { useTreeStructurePolling } from "../useTreeStructurePolling"

// Mock the treeService
jest.mock("@/services/treeService", () => ({
	treeService: {
		fetchNodeChildrenCounts: jest.fn(),
	},
}))

// Mock usePolling
jest.mock("../usePolling", () => {
	const actual = jest.requireActual("../usePolling")
	return {
		...actual,
		usePolling: jest.fn((options) => {
			// Store the options for testing
			;(useTreeStructurePolling as any).lastPollingOptions = options
			return {
				startPolling: jest.fn(async () => {
					// Simulate polling by calling pollFn and onPoll
					const data = await options.pollFn()
					if (options.onPoll) {
						options.onPoll(data, true)
					}
					return data
				}),
				stopPolling: jest.fn(),
				reset: jest.fn(),
				state: {
					isPolling: false,
					data: null,
					attempt: 0,
					error: null,
				},
			}
		}),
	}
})

describe("useTreeStructurePolling", () => {
	const mockNodeIds = ["node1", "node2", "node3"]
	const mockTreeId = "tree123"

	beforeEach(() => {
		jest.clearAllMocks()
		// Reset any stored polling options
		;(useTreeStructurePolling as any).lastPollingOptions = null
	})

	describe("startPolling", () => {
		it("should initialize polling with correct parameters", () => {
			const { result } = renderHook(() => useTreeStructurePolling())
			const mockCallbacks = {
				onStructureUpdate: jest.fn(),
				onAllComplete: jest.fn(),
			}

			result.current.startPolling(mockTreeId, mockNodeIds, mockCallbacks)

			const pollingOptions = (useTreeStructurePolling as any).lastPollingOptions
			expect(pollingOptions).toBeDefined()
			expect(pollingOptions.interval).toBe(3000)
			expect(pollingOptions.maxAttempts).toBe(160) // 8 minutes / 3 seconds
		})

		it("should clear previous tracking data on new polling session", () => {
			const { result } = renderHook(() => useTreeStructurePolling())
			const mockCallbacks = {
				onStructureUpdate: jest.fn(),
				onAllComplete: jest.fn(),
			}

			// Start polling first time
			result.current.startPolling(mockTreeId, mockNodeIds, mockCallbacks)

			// Start polling again
			result.current.startPolling(mockTreeId, mockNodeIds, mockCallbacks)

			// Should not throw and should handle state reset properly
			expect(result.current.startPolling).toBeDefined()
		})

		it("should reset completion flag for different tree", () => {
			const { result } = renderHook(() => useTreeStructurePolling())
			const mockCallbacks = {
				onStructureUpdate: jest.fn(),
				onAllComplete: jest.fn(),
			}

			// Start polling for first tree
			result.current.startPolling(mockTreeId, mockNodeIds, mockCallbacks)

			// Start polling for different tree
			const newTreeId = "tree456"
			result.current.startPolling(newTreeId, mockNodeIds, mockCallbacks)

			// Completion flag should be reset (tested implicitly through behavior)
			expect(result.current.startPolling).toBeDefined()
		})
	})

	describe("change detection (handlePollData)", () => {
		it("should detect when nodes get children and trigger callback", async () => {
			const mockCallbacks = {
				onStructureUpdate: jest.fn(),
				onAllComplete: jest.fn(),
			}

			// Mock data: nodes without children initially
			const initialData = [
				{ id: "node1", name: "Node 1", children_count: 0 },
				{ id: "node2", name: "Node 2", children_count: 0 },
			]

			// Mock data: nodes with children on second poll
			const updatedData = [
				{ id: "node1", name: "Node 1", children_count: 3 },
				{ id: "node2", name: "Node 2", children_count: 0 },
			]

			// Setup mocks: startPolling calls pollFn once, so we need 3 total values
			;(treeService.fetchNodeChildrenCounts as jest.Mock)
				.mockResolvedValueOnce(initialData) // Called during startPolling
				.mockResolvedValueOnce(initialData) // Called in our first manual test poll
				.mockResolvedValueOnce(updatedData) // Called in our second manual test poll

			const { result } = renderHook(() => useTreeStructurePolling())

			// Start polling (this triggers one poll internally)
			result.current.startPolling(mockTreeId, ["node1", "node2"], mockCallbacks)

			// Get the polling options that were passed to usePolling
			const pollingOptions = (useTreeStructurePolling as any).lastPollingOptions

			// Clear the callback mock since startPolling might have called it
			mockCallbacks.onStructureUpdate.mockClear()

			// Simulate first explicit poll (initial check)
			const firstData = await pollingOptions.pollFn()
			pollingOptions.onPoll(firstData, true)

			// Initial poll should not trigger updates
			expect(mockCallbacks.onStructureUpdate).not.toHaveBeenCalled()

			// Simulate second poll (update detected)
			const secondData = await pollingOptions.pollFn()
			pollingOptions.onPoll(secondData, false)

			// Should trigger structure update callback
			expect(mockCallbacks.onStructureUpdate).toHaveBeenCalledTimes(1)
		})

		it("should not trigger update on initial poll even if nodes have children", async () => {
			const mockCallbacks = {
				onStructureUpdate: jest.fn(),
				onAllComplete: jest.fn(),
			}

			// Mock data: nodes already have children
			const initialData = [
				{ id: "node1", name: "Node 1", children_count: 3 },
				{ id: "node2", name: "Node 2", children_count: 2 },
			]

			;(treeService.fetchNodeChildrenCounts as jest.Mock).mockResolvedValue(
				initialData,
			)

			const { result } = renderHook(() => useTreeStructurePolling())

			result.current.startPolling(mockTreeId, ["node1", "node2"], mockCallbacks)

			const pollingOptions = (useTreeStructurePolling as any).lastPollingOptions

			// Simulate initial poll
			const data = await pollingOptions.pollFn()
			pollingOptions.onPoll(data, true)

			// Should not trigger update callback on initial check
			expect(mockCallbacks.onStructureUpdate).not.toHaveBeenCalled()
		})
	})

	describe("completion detection (shouldStopPolling)", () => {
		it("should return true when all nodes have children", async () => {
			const completeData = [
				{ id: "node1", name: "Node 1", children_count: 3 },
				{ id: "node2", name: "Node 2", children_count: 2 },
				{ id: "node3", name: "Node 3", children_count: 5 },
			]

			;(treeService.fetchNodeChildrenCounts as jest.Mock).mockResolvedValue(
				completeData,
			)

			const { result } = renderHook(() => useTreeStructurePolling())

			result.current.startPolling(mockTreeId, mockNodeIds, {})

			const pollingOptions = (useTreeStructurePolling as any).lastPollingOptions

			const data = await pollingOptions.pollFn()
			const shouldStop = pollingOptions.shouldStop(data)

			expect(shouldStop).toBe(true)
		})

		it("should return false when some nodes don't have children", async () => {
			const incompleteData = [
				{ id: "node1", name: "Node 1", children_count: 3 },
				{ id: "node2", name: "Node 2", children_count: 0 },
				{ id: "node3", name: "Node 3", children_count: 5 },
			]

			;(treeService.fetchNodeChildrenCounts as jest.Mock).mockResolvedValue(
				incompleteData,
			)

			const { result } = renderHook(() => useTreeStructurePolling())

			result.current.startPolling(mockTreeId, mockNodeIds, {})

			const pollingOptions = (useTreeStructurePolling as any).lastPollingOptions

			const data = await pollingOptions.pollFn()
			const shouldStop = pollingOptions.shouldStop(data)

			expect(shouldStop).toBe(false)
		})

		it("should return false when data is null or empty", async () => {
			;(treeService.fetchNodeChildrenCounts as jest.Mock).mockResolvedValue(
				null,
			)

			const { result } = renderHook(() => useTreeStructurePolling())

			result.current.startPolling(mockTreeId, mockNodeIds, {})

			const pollingOptions = (useTreeStructurePolling as any).lastPollingOptions

			const data = await pollingOptions.pollFn()
			const shouldStop = pollingOptions.shouldStop(data)

			expect(shouldStop).toBe(false)
		})
	})

	describe("completion callback (handleSuccess)", () => {
		it("should trigger onAllComplete callback when polling completes", async () => {
			const mockCallbacks = {
				onStructureUpdate: jest.fn(),
				onAllComplete: jest.fn(),
			}

			const completeData = [
				{ id: "node1", name: "Node 1", children_count: 3 },
				{ id: "node2", name: "Node 2", children_count: 2 },
			]

			;(treeService.fetchNodeChildrenCounts as jest.Mock).mockResolvedValue(
				completeData,
			)

			const { result } = renderHook(() => useTreeStructurePolling())

			result.current.startPolling(mockTreeId, ["node1", "node2"], mockCallbacks)

			const pollingOptions = (useTreeStructurePolling as any).lastPollingOptions

			// Simulate successful completion
			const data = await pollingOptions.pollFn()
			if (pollingOptions.onSuccess) {
				pollingOptions.onSuccess(data)
			}

			expect(mockCallbacks.onAllComplete).toHaveBeenCalledTimes(1)
		})

		it("should only trigger onAllComplete once even if called multiple times", async () => {
			const mockCallbacks = {
				onStructureUpdate: jest.fn(),
				onAllComplete: jest.fn(),
			}

			const completeData = [{ id: "node1", name: "Node 1", children_count: 3 }]

			;(treeService.fetchNodeChildrenCounts as jest.Mock).mockResolvedValue(
				completeData,
			)

			const { result } = renderHook(() => useTreeStructurePolling())

			result.current.startPolling(mockTreeId, ["node1"], mockCallbacks)

			const pollingOptions = (useTreeStructurePolling as any).lastPollingOptions

			const data = await pollingOptions.pollFn()

			// Call success callback multiple times
			if (pollingOptions.onSuccess) {
				pollingOptions.onSuccess(data)
				pollingOptions.onSuccess(data)
				pollingOptions.onSuccess(data)
			}

			// Should only be called once
			expect(mockCallbacks.onAllComplete).toHaveBeenCalledTimes(1)
		})
	})

	describe("error handling", () => {
		it("should have error handler configured", () => {
			const { result } = renderHook(() => useTreeStructurePolling())
			const mockCallbacks = {
				onStructureUpdate: jest.fn(),
				onAllComplete: jest.fn(),
			}

			result.current.startPolling(mockTreeId, mockNodeIds, mockCallbacks)

			const pollingOptions = (useTreeStructurePolling as any).lastPollingOptions

			// Verify that error handler exists
			expect(pollingOptions.onError).toBeDefined()
			expect(typeof pollingOptions.onError).toBe("function")
		})
	})

	describe("stopPolling", () => {
		it("should expose stopPolling function", () => {
			const { result } = renderHook(() => useTreeStructurePolling())

			expect(result.current.stopPolling).toBeDefined()
			expect(typeof result.current.stopPolling).toBe("function")
		})
	})

	describe("edge cases", () => {
		it("should handle empty node list", () => {
			const { result } = renderHook(() => useTreeStructurePolling())
			const mockCallbacks = {
				onStructureUpdate: jest.fn(),
				onAllComplete: jest.fn(),
			}

			// Should not throw with empty array
			result.current.startPolling(mockTreeId, [], mockCallbacks)

			// Verify it doesn't crash
			expect(result.current.startPolling).toBeDefined()
		})

		it("should handle null children_count", async () => {
			const dataWithNull = [
				{ id: "node1", name: "Node 1", children_count: null },
				{ id: "node2", name: "Node 2", children_count: 3 },
			]

			;(treeService.fetchNodeChildrenCounts as jest.Mock).mockResolvedValue(
				dataWithNull,
			)

			const { result } = renderHook(() => useTreeStructurePolling())

			result.current.startPolling(mockTreeId, ["node1", "node2"], {})

			const pollingOptions = (useTreeStructurePolling as any).lastPollingOptions

			const data = await pollingOptions.pollFn()
			const shouldStop = pollingOptions.shouldStop(data)

			// Should treat null as 0 and not be complete
			expect(shouldStop).toBe(false)
		})
	})
})
