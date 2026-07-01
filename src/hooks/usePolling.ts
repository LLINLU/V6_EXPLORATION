import { useCallback, useRef, useState } from "react"
import type {
	PollingControls,
	PollingOptions,
	PollingState,
} from "@/types/services"

export type { PollingOptions, PollingState, PollingControls }

/**
 * Standalone polling function that can be used without React hooks
 */
export async function poll<T>(options: {
	pollFn: () => Promise<T | null>
	shouldStop: (data: T | null) => boolean
	interval?: number
	maxAttempts?: number
	onProgress?: (attempt: number, data: T | null) => void
}): Promise<T | null> {
	const {
		pollFn,
		shouldStop,
		interval = 1000,
		maxAttempts = 30,
		onProgress,
	} = options

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		// Wait for interval (skip on first attempt)
		if (attempt > 0) {
			await new Promise((resolve) => setTimeout(resolve, interval))
		}

		// Poll for data
		const data = await pollFn()

		// Report progress
		if (onProgress) {
			onProgress(attempt, data)
		}

		// Check if we should stop
		if (shouldStop(data)) {
			return data
		}
	}

	// Timeout - max attempts reached
	return null
}

/**
 * Generic polling hook for efficient data polling with timeout and error handling
 *
 */
export function usePolling<T>({
	pollFn,
	shouldStop,
	interval = 1000,
	maxAttempts = 30,
	onPoll,
	onSuccess,
	onTimeout,
	onError,
}: PollingOptions<T>): PollingControls<T> {
	const [state, setState] = useState<PollingState<T>>({
		isPolling: false,
		data: null,
		attempt: 0,
		error: null,
	})

	const abortControllerRef = useRef<AbortController | null>(null)

	const stopPolling = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
			abortControllerRef.current = null
		}
		setState((prev) => ({ ...prev, isPolling: false }))
	}, [])

	const reset = useCallback(() => {
		stopPolling()
		setState({
			isPolling: false,
			data: null,
			attempt: 0,
			error: null,
		})
	}, [stopPolling])

	const startPolling = useCallback(async (): Promise<T | null> => {
		// Reset state
		setState({
			isPolling: true,
			data: null,
			attempt: 0,
			error: null,
		})

		// Create abort controller for cancellation
		const abortController = new AbortController()
		abortControllerRef.current = abortController

		try {
			for (let attempt = 0; attempt < maxAttempts; attempt++) {
				// Check if aborted
				if (abortController.signal.aborted) {
					return null
				}

				// Update attempt count
				setState((prev) => ({ ...prev, attempt }))

				// Wait for interval (skip on first attempt)
				if (attempt > 0) {
					await new Promise((resolve) => setTimeout(resolve, interval))
				}

				// Check abort again after waiting
				if (abortController.signal.aborted) {
					return null
				}

				// Poll for data
				try {
					const data = await pollFn()

					// Update state with latest data
					setState((prev) => ({ ...prev, data }))

					// Call onPoll callback with data and isInitial flag
					if (onPoll) {
						onPoll(data, attempt === 0)
					}

					// Check if we should stop
					if (shouldStop(data)) {
						setState((prev) => ({ ...prev, isPolling: false }))
						if (data && onSuccess) {
							onSuccess(data)
						}
						abortControllerRef.current = null
						return data
					}
				} catch (error) {
					const err =
						error instanceof Error ? error : new Error("Polling error")
					console.error("Polling error:", err)

					if (onError) {
						onError(err)
					}

					// Continue polling even on error (unless aborted)
					if (abortController.signal.aborted) {
						setState((prev) => ({
							...prev,
							isPolling: false,
							error: err,
						}))
						abortControllerRef.current = null
						return null
					}
				}
			}

			// Timeout - max attempts reached
			setState((prev) => ({ ...prev, isPolling: false }))
			if (onTimeout) {
				onTimeout()
			}
			abortControllerRef.current = null
			return null
		} catch (error) {
			const err = error instanceof Error ? error : new Error("Unknown error")
			setState((prev) => ({
				...prev,
				isPolling: false,
				error: err,
			}))
			if (onError) {
				onError(err)
			}
			abortControllerRef.current = null
			return null
		}
	}, [
		pollFn,
		shouldStop,
		interval,
		maxAttempts,
		onPoll,
		onSuccess,
		onTimeout,
		onError,
	])

	return {
		startPolling,
		stopPolling,
		reset,
		state,
	}
}
