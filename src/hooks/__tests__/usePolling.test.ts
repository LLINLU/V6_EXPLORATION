import { renderHook, waitFor } from "@testing-library/react"
import { poll, usePolling } from "../usePolling"

describe("poll (standalone function)", () => {
	it("should return data when condition is met", async () => {
		let callCount = 0
		const mockPollFn = jest.fn(async () => {
			callCount++
			return callCount >= 3 ? "success" : null
		})

		const result = await poll({
			pollFn: mockPollFn,
			shouldStop: (data) => data !== null,
			interval: 10, // Short interval for fast tests
			maxAttempts: 10,
		})

		expect(result).toBe("success")
		expect(mockPollFn).toHaveBeenCalledTimes(3)
	})

	it("should return null when max attempts reached", async () => {
		const mockPollFn = jest.fn(async () => null)

		const result = await poll({
			pollFn: mockPollFn,
			shouldStop: (data) => data !== null,
			interval: 10,
			maxAttempts: 3,
		})

		expect(result).toBeNull()
		expect(mockPollFn).toHaveBeenCalledTimes(3)
	})

	it("should call onProgress callback on each poll", async () => {
		const mockPollFn = jest.fn(async () => "data")
		const onProgress = jest.fn()

		await poll({
			pollFn: mockPollFn,
			shouldStop: (data) => data === "data",
			interval: 10,
			maxAttempts: 5,
			onProgress,
		})

		expect(onProgress).toHaveBeenCalledWith(0, "data")
	})

	it("should not wait on first attempt", async () => {
		const startTime = Date.now()
		const mockPollFn = jest.fn(async () => "immediate")

		const result = await poll({
			pollFn: mockPollFn,
			shouldStop: (data) => data !== null,
			interval: 5000, // Long interval
			maxAttempts: 1,
		})

		const elapsed = Date.now() - startTime

		expect(result).toBe("immediate")
		expect(elapsed).toBeLessThan(1000) // Should return quickly without waiting
	})

	it("should handle complex data types", async () => {
		interface TestData {
			id: string
			status: string
		}

		let attempt = 0
		const mockPollFn = jest.fn(async (): Promise<TestData | null> => {
			attempt++
			if (attempt >= 2) {
				return { id: "123", status: "completed" }
			}
			return null
		})

		const result = await poll<TestData>({
			pollFn: mockPollFn,
			shouldStop: (data) => data?.status === "completed",
			interval: 10,
			maxAttempts: 5,
		})

		expect(result).toEqual({ id: "123", status: "completed" })
		expect(mockPollFn).toHaveBeenCalledTimes(2)
	})

	it("should use custom interval and maxAttempts", async () => {
		const mockPollFn = jest.fn(async () => null)

		const result = await poll({
			pollFn: mockPollFn,
			shouldStop: () => false,
			interval: 10,
			maxAttempts: 2,
		})

		expect(result).toBeNull()
		expect(mockPollFn).toHaveBeenCalledTimes(2)
	})

	it("should wait for interval between polls", async () => {
		const startTime = Date.now()
		let callCount = 0

		const mockPollFn = jest.fn(async () => {
			callCount++
			return callCount >= 3 ? "done" : null
		})

		await poll({
			pollFn: mockPollFn,
			shouldStop: (data) => data !== null,
			interval: 50, // 50ms between polls
			maxAttempts: 5,
		})

		const elapsed = Date.now() - startTime

		// Should have waited at least 2 intervals (10ms tolerance for timer imprecision)
		expect(elapsed).toBeGreaterThanOrEqual(90)
		expect(mockPollFn).toHaveBeenCalledTimes(3)
	})

	it("should continue polling after errors", async () => {
		let callCount = 0
		const mockPollFn = jest.fn(async () => {
			callCount++
			if (callCount < 2) {
				throw new Error("Test error")
			}
			return "success"
		})

		// Note: poll() doesn't have error handling built-in
		// This test would need error handling in the pollFn itself
		const mockPollFnWithErrorHandling = jest.fn(async () => {
			try {
				return await mockPollFn()
			} catch {
				return null
			}
		})

		const result = await poll({
			pollFn: mockPollFnWithErrorHandling,
			shouldStop: (data) => data !== null,
			interval: 10,
			maxAttempts: 5,
		})

		expect(result).toBe("success")
		expect(mockPollFn).toHaveBeenCalledTimes(2)
	})
})

describe("usePolling (React hook)", () => {
	it("should start polling and return data on success", async () => {
		let callCount = 0
		const mockPollFn = jest.fn(async () => {
			callCount++
			return callCount >= 2 ? "success" : null
		})

		const onSuccess = jest.fn()

		const { result } = renderHook(() =>
			usePolling({
				pollFn: mockPollFn,
				shouldStop: (data) => data !== null,
				interval: 10,
				maxAttempts: 5,
				onSuccess,
			}),
		)

		expect(result.current.state.isPolling).toBe(false)

		// Start polling and wait for it to complete
		let pollResult: string | null = null
		await waitFor(
			async () => {
				if (!pollResult) {
					pollResult = await result.current.startPolling()
				}
				expect(result.current.state.isPolling).toBe(false)
				expect(pollResult).toBe("success")
			},
			{ timeout: 1000 },
		)

		expect(onSuccess).toHaveBeenCalledWith("success")
		expect(result.current.state.data).toBe("success")
	})

	it("should handle timeout", async () => {
		const mockPollFn = jest.fn(async () => null)
		const onTimeout = jest.fn()

		const { result } = renderHook(() =>
			usePolling({
				pollFn: mockPollFn,
				shouldStop: (data) => data !== null,
				interval: 10,
				maxAttempts: 2,
				onTimeout,
			}),
		)

		const pollPromise = result.current.startPolling()

		await waitFor(
			() => {
				expect(result.current.state.isPolling).toBe(false)
			},
			{ timeout: 1000 },
		)

		const pollResult = await pollPromise

		expect(pollResult).toBeNull()
		expect(onTimeout).toHaveBeenCalled()
		expect(result.current.state.data).toBeNull()
	})

	it("should stop polling when stopPolling is called", async () => {
		const mockPollFn = jest.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 50))
			return null
		})

		const { result } = renderHook(() =>
			usePolling({
				pollFn: mockPollFn,
				shouldStop: () => false,
				interval: 10,
				maxAttempts: 100,
			}),
		)

		// Start polling
		result.current.startPolling()

		// Wait a bit for polling to start
		await waitFor(() => {
			expect(result.current.state.isPolling).toBe(true)
		})

		// Stop polling
		result.current.stopPolling()

		await waitFor(() => {
			expect(result.current.state.isPolling).toBe(false)
		})

		// Should not have run many polls
		expect(mockPollFn.mock.calls.length).toBeLessThan(10)
	})

	it("should reset state", async () => {
		const mockPollFn = jest.fn(async () => "data")

		const { result } = renderHook(() =>
			usePolling({
				pollFn: mockPollFn,
				shouldStop: (data) => data !== null,
				interval: 10,
				maxAttempts: 5,
			}),
		)

		// Start and complete polling
		await result.current.startPolling()

		await waitFor(() => {
			expect(result.current.state.data).toBe("data")
		})

		// Reset
		await waitFor(() => {
			result.current.reset()
			expect(result.current.state.isPolling).toBe(false)
			expect(result.current.state.data).toBeNull()
			expect(result.current.state.attempt).toBe(0)
			expect(result.current.state.error).toBeNull()
		})
	})

	it("should handle errors and call onError callback", async () => {
		const mockError = new Error("Test error")
		const mockPollFn = jest.fn(async () => {
			throw mockError
		})
		const onError = jest.fn()

		const { result } = renderHook(() =>
			usePolling({
				pollFn: mockPollFn,
				shouldStop: () => false,
				interval: 10,
				maxAttempts: 2,
				onError,
			}),
		)

		await result.current.startPolling()

		await waitFor(
			() => {
				expect(onError).toHaveBeenCalled()
			},
			{ timeout: 1000 },
		)

		// Should have been called with an error
		expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
	})

	it("should update attempt count during polling", async () => {
		let callCount = 0
		const mockPollFn = jest.fn(async () => {
			callCount++
			return callCount >= 3 ? "done" : null
		})

		const { result } = renderHook(() =>
			usePolling({
				pollFn: mockPollFn,
				shouldStop: (data) => data !== null,
				interval: 10,
				maxAttempts: 5,
			}),
		)

		result.current.startPolling()

		// Wait for attempts to increment
		await waitFor(
			() => {
				expect(result.current.state.attempt).toBeGreaterThan(0)
			},
			{ timeout: 500 },
		)

		// Wait for completion
		await waitFor(
			() => {
				expect(result.current.state.isPolling).toBe(false)
			},
			{ timeout: 1000 },
		)

		expect(result.current.state.data).toBe("done")
	})

	it("should handle multiple sequential polls", async () => {
		let callCount = 0
		const mockPollFn = jest.fn(async () => {
			callCount++
			return callCount >= 2 ? `result-${callCount}` : null
		})

		const { result } = renderHook(() =>
			usePolling({
				pollFn: mockPollFn,
				shouldStop: (data) => data !== null,
				interval: 10,
				maxAttempts: 5,
			}),
		)

		// First poll
		const result1 = await result.current.startPolling()
		expect(result1).toBe("result-2")

		// Reset for second poll
		callCount = 0
		result.current.reset()

		// Second poll
		const result2 = await result.current.startPolling()
		expect(result2).toBe("result-2")

		expect(mockPollFn).toHaveBeenCalledTimes(4) // 2 calls per poll
	})
})
