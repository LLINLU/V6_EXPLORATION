import type { QueuedEnrichmentRequest } from "../enrichmentQueue"
import { ENRICHMENT_STATUS } from "../enrichmentStatus"
import "@testing-library/jest-dom"

describe("enrichmentQueue", () => {
	describe("ENRICHMENT_STATUS", () => {
		it("has all required status values", () => {
			expect(ENRICHMENT_STATUS.WAITING).toBe("waiting")
			expect(ENRICHMENT_STATUS.FETCHING).toBe("fetching")
			expect(ENRICHMENT_STATUS.DONE).toBe("done")
			expect(ENRICHMENT_STATUS.ERROR).toBe("error")
			expect(ENRICHMENT_STATUS.TIMEOUT).toBe("timeout")
		})
	})

	describe("QueuedEnrichmentRequest", () => {
		it("has correct structure for papers type", () => {
			const mockRequest: QueuedEnrichmentRequest = {
				nodeId: "node1",
				nodeName: "Test Node",
				type: "papers",
				params: { query: "test" },
				callback: jest.fn(),
				timestamp: Date.now(),
			}

			expect(mockRequest.nodeId).toBe("node1")
			expect(mockRequest.type).toBe("papers")
			expect(mockRequest.callback).toBeDefined()
		})

		it("has correct structure for useCases type", () => {
			const mockRequest: QueuedEnrichmentRequest = {
				nodeId: "node2",
				nodeName: "Test Node 2",
				type: "useCases",
				params: {},
				callback: jest.fn(),
				timestamp: Date.now(),
			}

			expect(mockRequest.type).toBe("useCases")
		})

		it("has correct structure for trl type", () => {
			const mockRequest: QueuedEnrichmentRequest = {
				nodeId: "node3",
				nodeName: "Test Node 3",
				type: "trl",
				params: {},
				callback: jest.fn(),
				timestamp: Date.now(),
			}

			expect(mockRequest.type).toBe("trl")
		})

		it("can have optional startTime", () => {
			const mockRequest: QueuedEnrichmentRequest = {
				nodeId: "node1",
				nodeName: "Test Node",
				type: "papers",
				params: {},
				callback: jest.fn(),
				timestamp: Date.now(),
				startTime: Date.now() - 5000,
			}

			expect(mockRequest.startTime).toBeDefined()
			expect(Date.now() - mockRequest.startTime!).toBeGreaterThan(0)
		})

		it("can have optional apiCallStarted flag", () => {
			const mockRequest: QueuedEnrichmentRequest = {
				nodeId: "node1",
				nodeName: "Test Node",
				type: "papers",
				params: {},
				callback: jest.fn(),
				timestamp: Date.now(),
				apiCallStarted: true,
			}

			expect(mockRequest.apiCallStarted).toBe(true)
		})
	})
})
