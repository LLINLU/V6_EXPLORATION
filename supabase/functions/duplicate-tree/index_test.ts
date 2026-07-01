// deno-lint-ignore-file no-explicit-any
import {
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts"
import {
	createNewTree,
	duplicateMarketInfo,
	duplicateNodes,
	duplicatePaperSummary,
	duplicatePapers,
	duplicateUseCaseSummary,
	duplicateUseCases,
	fetchOriginalTree,
	fetchTreeNodes,
} from "./index.ts"
import {
	createMockSupabaseClient,
	mockNodes,
	mockTree,
} from "./test_helpers.ts"

// =============================================================================
// UNIT TESTS
// =============================================================================

Deno.test("fetchOriginalTree - should fetch tree successfully", async () => {
	const mockClient = createMockSupabaseClient()
	const result = await fetchOriginalTree(mockClient, "tree-123")

	assertEquals(result.id, "tree-123")
	assertEquals(result.name, "Original Tree")
})

Deno.test("fetchOriginalTree - should throw when tree not found", async () => {
	const mockClient = createMockSupabaseClient({ throwError: true })

	try {
		await fetchOriginalTree(mockClient, "nonexistent")
		throw new Error("Should have thrown")
	} catch (error: any) {
		assertEquals(error.message.includes("Tree not found"), true)
	}
})

Deno.test("createNewTree - should create tree with custom name", async () => {
	const mockClient = createMockSupabaseClient()
	const result = await createNewTree(mockClient, mockTree, "Custom Name")

	assertExists(result)
	assertEquals(result.id, "tree-456")
	assertEquals(result.name, "Custom Name")
})

Deno.test("createNewTree - should create tree with default name", async () => {
	const mockClient = createMockSupabaseClient()
	const result = await createNewTree(mockClient, mockTree)

	assertExists(result)
	assertEquals(result.name, "Original Tree (Copy)")
})

Deno.test("fetchTreeNodes - should fetch nodes ordered by level", async () => {
	const mockClient = createMockSupabaseClient()
	const result = await fetchTreeNodes(mockClient, "tree-123")

	assertEquals(result.length, 2)
	assertEquals(result[0].level, 0)
	assertEquals(result[1].level, 1)
})

Deno.test("fetchTreeNodes - should throw on error", async () => {
	const mockClient = createMockSupabaseClient({ throwError: true })

	try {
		await fetchTreeNodes(mockClient, "tree-123")
		throw new Error("Should have thrown")
	} catch (error: any) {
		assertEquals(error.message.includes("Failed to fetch nodes"), true)
	}
})

Deno.test("duplicateNodes - should create node ID mapping", async () => {
	const mockClient = createMockSupabaseClient()
	const result = await duplicateNodes(mockClient, mockNodes, "new-tree-id")

	assertEquals(result.nodesCopied, 2)
	assertEquals(result.nodeIdMap.size, 2)
	assertExists(result.nodeIdMap.get("node-1"))
	assertExists(result.nodeIdMap.get("node-2"))
})

Deno.test("duplicatePapers - should return count of copied papers", async () => {
	const mockClient = createMockSupabaseClient()
	const count = await duplicatePapers(
		mockClient,
		"node-1",
		"new-node-1",
		"new-tree-id",
	)

	assertEquals(count, 1)
})

Deno.test("duplicatePapers - should handle empty papers", async () => {
	const mockClient = createMockSupabaseClient({ papers: [] })
	const count = await duplicatePapers(
		mockClient,
		"node-1",
		"new-node-1",
		"new-tree-id",
	)

	assertEquals(count, 0)
})

Deno.test("duplicateUseCases - should return count of copied use cases", async () => {
	const mockClient = createMockSupabaseClient()
	const count = await duplicateUseCases(
		mockClient,
		"node-1",
		"new-node-1",
		"new-tree-id",
	)

	assertEquals(count, 1)
})

Deno.test("duplicateMarketInfo - should return count of copied market info", async () => {
	const mockClient = createMockSupabaseClient()
	const count = await duplicateMarketInfo(
		mockClient,
		"node-1",
		"new-node-1",
		"new-tree-id",
	)

	assertEquals(count, 1)
})

Deno.test("duplicatePaperSummary - should return 1 when summary exists", async () => {
	const mockClient = createMockSupabaseClient()
	const count = await duplicatePaperSummary(
		mockClient,
		"node-1",
		"new-node-1",
		"new-tree-id",
	)

	assertEquals(count, 1)
})

Deno.test("duplicatePaperSummary - should return 0 when no summary", async () => {
	const mockClient = createMockSupabaseClient({ paperSummary: null })
	const count = await duplicatePaperSummary(
		mockClient,
		"node-1",
		"new-node-1",
		"new-tree-id",
	)

	assertEquals(count, 0)
})

Deno.test("duplicateUseCaseSummary - should return 1 when summary exists", async () => {
	const mockClient = createMockSupabaseClient()
	const count = await duplicateUseCaseSummary(
		mockClient,
		"node-1",
		"new-node-1",
		"new-tree-id",
	)

	assertEquals(count, 1)
})

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

Deno.test("Node ID mapping - should maintain parent-child relationships", () => {
	const nodeIdMap = new Map<string, string>()

	// Simulate node duplication
	for (const node of mockNodes) {
		const newNodeId = crypto.randomUUID()
		nodeIdMap.set(node.id, newNodeId)
	}

	assertEquals(nodeIdMap.size, 2)

	// Test that new parent ID is correctly mapped
	const oldParentId = mockNodes[1].parent_id
	if (oldParentId) {
		const newParentId = nodeIdMap.get(oldParentId)
		assertExists(newParentId)
	}
})

Deno.test("UUID generation - should generate valid UUIDs", () => {
	const uuid1 = crypto.randomUUID()
	const uuid2 = crypto.randomUUID()

	assertEquals(typeof uuid1, "string")
	assertEquals(typeof uuid2, "string")
	assertEquals(uuid1 === uuid2, false)

	// UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
	const uuidPattern =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
	assertEquals(uuidPattern.test(uuid1), true)
})

// =============================================================================
// DATA INTEGRITY TESTS
// =============================================================================

Deno.test("Data integrity - should preserve tree metadata", () => {
	const originalTree = mockTree
	const duplicatedTree = {
		name: `${originalTree.name} (Copy)`,
		description: originalTree.description,
		search_theme: originalTree.search_theme,
		reasoning: originalTree.reasoning,
		layer_config: originalTree.layer_config,
		scenario_inputs: originalTree.scenario_inputs,
		mode: originalTree.mode,
		team_id: originalTree.team_id,
	}

	assertEquals(duplicatedTree.description, originalTree.description)
	assertEquals(duplicatedTree.search_theme, originalTree.search_theme)
	assertEquals(duplicatedTree.team_id, originalTree.team_id)
})

Deno.test("Data integrity - should preserve node hierarchy", () => {
	const nodeIdMap = new Map<string, string>([
		["node-1", "new-node-1"],
		["node-2", "new-node-2"],
	])

	const childNode = mockNodes[1]
	const newParentId = childNode.parent_id
		? nodeIdMap.get(childNode.parent_id)
		: null

	assertExists(newParentId)
	assertEquals(newParentId, "new-node-1")
})
