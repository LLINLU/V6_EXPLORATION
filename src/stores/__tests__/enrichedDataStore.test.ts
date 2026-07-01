import { enrichmentEventBus, useEnrichedDataStore } from "../enrichedDataStore"
import "@testing-library/jest-dom"

// Mock Supabase
jest.mock("@/integrations/supabase/client", () => ({
	supabase: {
		from: jest.fn(() => ({
			select: jest.fn(() => ({
				eq: jest.fn(() => ({
					data: [],
					error: null,
					maybeSingle: jest.fn(() =>
						Promise.resolve({
							data: null,
							error: { code: "PGRST116", message: "No rows found" },
						}),
					),
					single: jest.fn(() =>
						Promise.resolve({
							data: null,
							error: null,
						}),
					),
				})),
			})),
		})),
	},
}))

// Mock enrichmentQueue
jest.mock("@/services/enrichmentQueue", () => ({
	getEnrichmentStatus: jest.fn(() => "idle"),
}))

describe("enrichedDataStore", () => {
	beforeEach(() => {
		// Reset store before each test
		useEnrichedDataStore.setState({
			data: {},
			loading: {},
			error: {},
			subscribers: {},
			pollingIntervals: {},
			pendingRefresh: {},
		})
	})

	afterEach(() => {
		// Clear all intervals
		const state = useEnrichedDataStore.getState()
		Object.values(state.pollingIntervals).forEach(clearInterval)
	})

	describe("subscribeToNode", () => {
		it("initializes data for new node", () => {
			const store = useEnrichedDataStore.getState()
			store.subscribeToNode("test-node-1")

			const state = useEnrichedDataStore.getState()
			expect(state.subscribers["test-node-1"]).toBe(1)
			expect(state.data["test-node-1"]).toBeDefined()
			expect(state.data["test-node-1"].papers).toEqual([])
			expect(state.data["test-node-1"].useCases).toEqual([])
		})

		it("increments subscriber count", () => {
			const store = useEnrichedDataStore.getState()
			store.subscribeToNode("test-node-1")
			store.subscribeToNode("test-node-1")

			const state = useEnrichedDataStore.getState()
			expect(state.subscribers["test-node-1"]).toBe(2)
		})
	})

	describe("unsubscribeFromNode", () => {
		it("decrements subscriber count", () => {
			const store = useEnrichedDataStore.getState()
			store.subscribeToNode("test-node-1")
			store.subscribeToNode("test-node-1")
			store.unsubscribeFromNode("test-node-1")

			const state = useEnrichedDataStore.getState()
			expect(state.subscribers["test-node-1"]).toBe(1)
		})

		it("keeps cached data when last subscriber leaves", () => {
			const store = useEnrichedDataStore.getState()
			store.subscribeToNode("test-node-1")
			useEnrichedDataStore.setState({
				data: {
					"test-node-1": {
						papers: [
							{
								id: "paper-1",
								node_id: "test-node-1",
								title: "Cached paper",
							},
						] as any,
						patents: [],
						useCases: [],
						trlData: { statistics: null, hist_data: null },
					},
				},
			})
			store.unsubscribeFromNode("test-node-1")

			const state = useEnrichedDataStore.getState()
			expect(state.subscribers["test-node-1"]).toBeUndefined()
			expect(state.data["test-node-1"].papers).toHaveLength(1)
			expect(state.loading["test-node-1"]).toBeUndefined()
		})
	})

	describe("setLoadingState", () => {
		it("sets loading state for specific type", () => {
			const store = useEnrichedDataStore.getState()
			store.subscribeToNode("test-node-1")
			store.setLoadingState("test-node-1", "papers", true)

			const state = useEnrichedDataStore.getState()
			expect(state.loading["test-node-1"].papers).toBe(true)
			expect(state.loading["test-node-1"].useCases).toBe(false)
		})
	})

	describe("enrichmentEventBus", () => {
		it("allows subscribing to events", () => {
			const listener = jest.fn()
			const unsubscribe = enrichmentEventBus.subscribe(listener)

			enrichmentEventBus.emit("test-node-1")
			expect(listener).toHaveBeenCalledWith("test-node-1")

			unsubscribe()
			enrichmentEventBus.emit("test-node-2")
			expect(listener).toHaveBeenCalledTimes(1) // Still only called once
		})

		it("notifies all subscribers", () => {
			const listener1 = jest.fn()
			const listener2 = jest.fn()

			enrichmentEventBus.subscribe(listener1)
			enrichmentEventBus.subscribe(listener2)

			enrichmentEventBus.emit("test-node-1")

			expect(listener1).toHaveBeenCalledWith("test-node-1")
			expect(listener2).toHaveBeenCalledWith("test-node-1")
		})
	})
})
