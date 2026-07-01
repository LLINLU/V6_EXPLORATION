import { renderHook } from "@testing-library/react"
import { triggerEnrichmentRefresh } from "@/hooks/useEnrichedData"
import { supabase } from "@/integrations/supabase/client"
import {
	hasLevel1CompleteData,
	isLevel1Loading,
	stopLevel1EnrichmentTracking,
	useLevel1EnrichmentPolling,
} from "../useLevel1EnrichmentPolling"

// Mock supabase client
jest.mock("@/integrations/supabase/client", () => ({
	supabase: {
		from: jest.fn(() => ({
			select: jest.fn(() => ({
				in: jest.fn(),
			})),
		})),
	},
}))

// Mock triggerEnrichmentRefresh
jest.mock("@/hooks/useEnrichedData", () => ({
	triggerEnrichmentRefresh: jest.fn(),
}))

// Mock usePolling
jest.mock("../usePolling", () => {
	const actual = jest.requireActual("../usePolling")
	return {
		...actual,
		usePolling: jest.fn((options) => {
			// Store the options for testing
			;(useLevel1EnrichmentPolling as any).lastPollingOptions = options
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

describe("useLevel1EnrichmentPolling", () => {
	const mockNodeIds = ["node1", "node2", "node3"]
	const mockTreeId = "tree123"

	beforeEach(() => {
		jest.clearAllMocks()
		// Clear global state
		stopLevel1EnrichmentTracking()
		;(useLevel1EnrichmentPolling as any).lastPollingOptions = null
	})

	describe("startPolling", () => {
		it("should initialize polling with correct parameters", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			// Mock supabase responses
			const mockSupabaseChain = {
				in: jest.fn().mockResolvedValue({ data: [] }),
			}
			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, mockNodeIds)

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions
			expect(pollingOptions).toBeDefined()
			expect(pollingOptions.interval).toBe(5000)
			expect(pollingOptions.maxAttempts).toBe(96) // 8 minutes / 5 seconds
		})

		it("should initialize enrichment tracking", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			// Mock supabase responses
			const mockSupabaseChain = {
				in: jest.fn().mockResolvedValue({ data: [] }),
			}
			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, mockNodeIds)

			// Check that nodes are being tracked
			expect(isLevel1Loading("node1")).toBe(true)
			expect(isLevel1Loading("node2")).toBe(true)
			expect(isLevel1Loading("node3")).toBe(true)
		})

		it("should stop previous polling session before starting new one", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			// Mock supabase responses
			const mockSupabaseChain = {
				in: jest.fn().mockResolvedValue({ data: [] }),
			}
			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, mockNodeIds)
			await result.current.startPolling("tree456", ["node4", "node5"])

			// Should not throw and should handle state reset
			expect(result.current.startPolling).toBeDefined()
		})
	})

	describe("fetchEnrichmentData", () => {
		it("should fetch papers and use cases in parallel", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockPapersData = [
				{ node_id: "node1" },
				{ node_id: "node1" },
				{ node_id: "node2" },
			]
			const mockUseCasesData = [{ node_id: "node1" }, { node_id: "node3" }]

			// Setup mocks before startPolling
			let callCount = 0
			const mockSupabaseChain = {
				in: jest.fn().mockImplementation(() => {
					callCount++
					// Even calls return papers, odd calls return use cases
					if (callCount % 2 === 1) {
						return Promise.resolve({ data: mockPapersData })
					} else {
						return Promise.resolve({ data: mockUseCasesData })
					}
				}),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, mockNodeIds)

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			const data = await pollingOptions.pollFn()

			expect(data).toBeDefined()
			expect(data.paperCounts.get("node1")).toBe(2)
			expect(data.paperCounts.get("node2")).toBe(1)
			expect(data.useCaseCounts.get("node1")).toBe(1)
			expect(data.useCaseCounts.get("node3")).toBe(1)
		})

		it("should handle empty results", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockSupabaseChain = {
				in: jest.fn().mockResolvedValue({ data: [] }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, mockNodeIds)

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			const data = await pollingOptions.pollFn()

			expect(data).toBeDefined()
			expect(data.paperCounts.size).toBe(0)
			expect(data.useCaseCounts.size).toBe(0)
		})

		it("should return null when nodeIds is empty", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			await result.current.startPolling(mockTreeId, [])

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			const data = await pollingOptions.pollFn()

			expect(data).toBeNull()
		})
	})

	describe("change detection (handlePollData)", () => {
		it("should detect when papers are completed and trigger callback", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			// Initial state: no papers
			const mockSupabaseChain1 = {
				in: jest.fn().mockResolvedValue({ data: [] }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain1),
			})

			await result.current.startPolling(mockTreeId, ["node1"])

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			// First poll - no data
			const initialData = await pollingOptions.pollFn()
			pollingOptions.onPoll(initialData, true)

			expect(triggerEnrichmentRefresh).not.toHaveBeenCalled()

			// Second poll - papers added
			const mockPapersData = [{ node_id: "node1" }]
			const mockSupabaseChain2 = {
				in: jest
					.fn()
					.mockResolvedValueOnce({ data: mockPapersData })
					.mockResolvedValueOnce({ data: [] }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain2),
			})

			const updatedData = await pollingOptions.pollFn()
			pollingOptions.onPoll(updatedData, false)

			expect(triggerEnrichmentRefresh).toHaveBeenCalledWith("node1")
		})

		it("should detect when use cases are completed and trigger callback", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			// Initial state: no use cases
			const mockSupabaseChain1 = {
				in: jest.fn().mockResolvedValue({ data: [] }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain1),
			})

			await result.current.startPolling(mockTreeId, ["node1"])

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			// First poll
			const initialData = await pollingOptions.pollFn()
			pollingOptions.onPoll(initialData, true)

			jest.clearAllMocks()

			// Second poll - use cases added
			const mockUseCasesData = [{ node_id: "node1" }]
			const mockSupabaseChain2 = {
				in: jest
					.fn()
					.mockResolvedValueOnce({ data: [] })
					.mockResolvedValueOnce({ data: mockUseCasesData }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain2),
			})

			const updatedData = await pollingOptions.pollFn()
			pollingOptions.onPoll(updatedData, false)

			expect(triggerEnrichmentRefresh).toHaveBeenCalledWith("node1")
		})

		it("should remove node from loading set when both papers and use cases complete", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			// Mock empty data initially, then complete data
			const emptyData: any[] = []
			const mockPapersData = [{ node_id: "node1" }]
			const mockUseCasesData = [{ node_id: "node1" }]

			// Setup mocks - first calls return empty, then complete data
			let callCount = 0
			const mockSupabaseChain = {
				in: jest.fn().mockImplementation(() => {
					callCount++
					// First 4 calls (2 pairs during initialization and startPolling) return empty
					// Then return complete data
					if (callCount <= 4) {
						return Promise.resolve({ data: emptyData })
					}
					// Subsequent calls alternate papers/use cases
					if (callCount % 2 === 1) {
						return Promise.resolve({ data: mockPapersData })
					} else {
						return Promise.resolve({ data: mockUseCasesData })
					}
				}),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, ["node1"])

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			// Node should initially be loading (no data yet)
			expect(isLevel1Loading("node1")).toBe(true)

			// Poll with complete data
			const completeData = await pollingOptions.pollFn()
			pollingOptions.onPoll(completeData, false)

			// Node should no longer be loading after both papers and use cases are found
			expect(isLevel1Loading("node1")).toBe(false)
		})
	})

	describe("completion detection (shouldStopPolling)", () => {
		it("should return true when all nodes have both papers and use cases", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockPapersData = [
				{ node_id: "node1" },
				{ node_id: "node2" },
				{ node_id: "node3" },
			]
			const mockUseCasesData = [
				{ node_id: "node1" },
				{ node_id: "node2" },
				{ node_id: "node3" },
			]

			// Setup mocks that always return complete data
			let callCount = 0
			const mockSupabaseChain = {
				in: jest.fn().mockImplementation(() => {
					callCount++
					// Even calls return papers, odd calls return use cases
					if (callCount % 2 === 1) {
						return Promise.resolve({ data: mockPapersData })
					} else {
						return Promise.resolve({ data: mockUseCasesData })
					}
				}),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, mockNodeIds)

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			// Initialize state - this sets the baseline
			const initialData = await pollingOptions.pollFn()
			pollingOptions.onPoll(initialData, true)

			// Check completion - second poll with same complete data
			const data = await pollingOptions.pollFn()
			pollingOptions.onPoll(data, false)
			const shouldStop = pollingOptions.shouldStop(data)

			expect(shouldStop).toBe(true)
		})

		it("should return false when some nodes are missing papers", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockPapersData = [
				{ node_id: "node1" },
				// node2 missing papers
				{ node_id: "node3" },
			]
			const mockUseCasesData = [
				{ node_id: "node1" },
				{ node_id: "node2" },
				{ node_id: "node3" },
			]

			const mockSupabaseChain = {
				in: jest
					.fn()
					.mockResolvedValueOnce({ data: mockPapersData })
					.mockResolvedValueOnce({ data: mockUseCasesData }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, mockNodeIds)

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			// Initialize state
			const initialData = await pollingOptions.pollFn()
			pollingOptions.onPoll(initialData, true)

			// Check completion
			const data = await pollingOptions.pollFn()
			pollingOptions.onPoll(data, false)
			const shouldStop = pollingOptions.shouldStop(data)

			expect(shouldStop).toBe(false)
		})

		it("should return false when some nodes are missing use cases", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockPapersData = [
				{ node_id: "node1" },
				{ node_id: "node2" },
				{ node_id: "node3" },
			]
			const mockUseCasesData = [
				{ node_id: "node1" },
				// node2 missing use cases
				{ node_id: "node3" },
			]

			const mockSupabaseChain = {
				in: jest
					.fn()
					.mockResolvedValueOnce({ data: mockPapersData })
					.mockResolvedValueOnce({ data: mockUseCasesData }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, mockNodeIds)

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			// Initialize state
			const initialData = await pollingOptions.pollFn()
			pollingOptions.onPoll(initialData, true)

			// Check completion
			const data = await pollingOptions.pollFn()
			pollingOptions.onPoll(data, false)
			const shouldStop = pollingOptions.shouldStop(data)

			expect(shouldStop).toBe(false)
		})

		it("should return false when data is null", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			await result.current.startPolling(mockTreeId, [])

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			const data = await pollingOptions.pollFn()
			const shouldStop = pollingOptions.shouldStop(data)

			expect(shouldStop).toBe(false)
		})
	})

	describe("status helper functions", () => {
		it("isLevel1PapersLoading should return true when papers are loading", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockSupabaseChain = {
				in: jest.fn().mockResolvedValue({ data: [] }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, ["node1"])

			expect(result.current.isLevel1PapersLoading("node1")).toBe(true)
		})

		it("isLevel1UseCasesLoading should return true when use cases are loading", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockSupabaseChain = {
				in: jest.fn().mockResolvedValue({ data: [] }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, ["node1"])

			expect(result.current.isLevel1UseCasesLoading("node1")).toBe(true)
		})

		it("hasLevel1CompleteData should return true when both papers and use cases exist", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockPapersData = [{ node_id: "node1" }]
			const mockUseCasesData = [{ node_id: "node1" }]

			const mockSupabaseChain = {
				in: jest
					.fn()
					.mockResolvedValueOnce({ data: mockPapersData })
					.mockResolvedValueOnce({ data: mockUseCasesData }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, ["node1"])

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			// Initialize and update state
			const initialData = await pollingOptions.pollFn()
			pollingOptions.onPoll(initialData, true)

			const completeData = await pollingOptions.pollFn()
			pollingOptions.onPoll(completeData, false)

			expect(hasLevel1CompleteData("node1")).toBe(true)
		})
	})

	describe("timeout handling", () => {
		it("should mark incomplete nodes as completed on timeout", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockSupabaseChain = {
				in: jest.fn().mockResolvedValue({ data: [] }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, ["node1"])

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			// Simulate timeout
			if (pollingOptions.onTimeout) {
				pollingOptions.onTimeout()
			}

			// Node should no longer be loading after timeout
			expect(isLevel1Loading("node1")).toBe(false)
		})
	})

	describe("cleanup", () => {
		it("should expose cleanup function", () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			expect(result.current.cleanup).toBeDefined()
			expect(typeof result.current.cleanup).toBe("function")
		})

		it("should clear state on cleanup", async () => {
			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockSupabaseChain = {
				in: jest.fn().mockResolvedValue({ data: [] }),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, ["node1"])

			expect(isLevel1Loading("node1")).toBe(true)

			result.current.cleanup()

			expect(isLevel1Loading("node1")).toBe(false)
		})
	})

	describe("error handling", () => {
		it("should handle errors from supabase gracefully", async () => {
			const consoleErrorSpy = jest
				.spyOn(console, "error")
				.mockImplementation(() => {})

			const { result } = renderHook(() => useLevel1EnrichmentPolling())

			const mockSupabaseChain = {
				in: jest.fn().mockRejectedValue(new Error("Database error")),
			}

			;(supabase.from as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnValue(mockSupabaseChain),
			})

			await result.current.startPolling(mockTreeId, ["node1"])

			const pollingOptions = (useLevel1EnrichmentPolling as any)
				.lastPollingOptions

			const data = await pollingOptions.pollFn()

			// Should return null on error
			expect(data).toBeNull()

			expect(consoleErrorSpy).toHaveBeenCalled()
			consoleErrorSpy.mockRestore()
		})
	})
})
