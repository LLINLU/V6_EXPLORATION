import { supabase } from "@/integrations/supabase/client"
import type {
	EnrichmentCompleteCallback,
	EnrichmentRefreshCallback,
	NodeClickEnrichmentCallback,
	NodeEnrichmentRequest,
	NodeEnrichmentResponse,
	NodeInfo,
	StreamingCallback,
	StreamingResponse,
	TypedStreamingCallback,
} from "@/types/enrichment"
import { enqueueEnrichment } from "./enrichmentQueue"

// Re-export types for backward compatibility
export type {
	NodeInfo,
	NodeEnrichmentRequest,
	NodeEnrichmentResponse,
	StreamingResponse,
	StreamingCallback,
	EnrichmentRefreshCallback,
	EnrichmentCompleteCallback,
	NodeClickEnrichmentCallback,
	TypedStreamingCallback,
}

// Global state to track loading nodes and prevent duplicate calls
const loadingNodes = new Set<string>()
const loadingPapers = new Set<string>()
const loadingPatents = new Set<string>()
const loadingUseCases = new Set<string>()
const loadingTrl = new Set<string>()
const enrichedNodes = new Set<string>()

// Helper type guard functions
export const isEnrichmentRefreshCallback = (
	callback: StreamingCallback | TypedStreamingCallback,
): callback is EnrichmentRefreshCallback => {
	return (
		typeof callback === "object" &&
		"type" in callback &&
		callback.type === "enrichment-refresh"
	)
}

export const isEnrichmentCompleteCallback = (
	callback: StreamingCallback | TypedStreamingCallback,
): callback is EnrichmentCompleteCallback => {
	return (
		typeof callback === "object" &&
		"type" in callback &&
		callback.type === "enrichment-complete"
	)
}

export const isNodeClickEnrichmentCallback = (
	callback: StreamingCallback | TypedStreamingCallback,
): callback is NodeClickEnrichmentCallback => {
	return (
		typeof callback === "object" &&
		"type" in callback &&
		callback.type === "node-click-enrichment"
	)
}

/**
 * Check if a node is currently being enriched
 */
export const isNodeLoading = (nodeId: string): boolean => {
	return loadingNodes.has(nodeId)
}

/**
 * Check if papers are currently being loaded for a node
 */
export const isPapersLoading = (nodeId: string): boolean => {
	return loadingPapers.has(nodeId)
}

/**
 * Check if patents are currently being loaded for a node
 */
export const isPatentsLoading = (nodeId: string): boolean => {
	return loadingPatents.has(nodeId)
}

/**
 * Check if use cases are currently being loaded for a node
 */
export const isUseCasesLoading = (nodeId: string): boolean => {
	return loadingUseCases.has(nodeId)
}

/**
 * Check if TRL is currently being loaded for a node
 */
export const isTrlLoading = (nodeId: string): boolean => {
	return loadingTrl.has(nodeId)
}

/**
 * Check if a node already has papers, patents, use cases, AND TRL data (complete enriched data)
 * Returns true only if all four types exist - if any type is missing, enrichment should still run
 */
export const hasNodeEnrichedData = async (nodeId: string): Promise<boolean> => {
	try {
		// First check our in-memory cache
		if (enrichedNodes.has(nodeId)) {
			return true
		}

		// Check database for existing data
		const [papersResult, patentsResult, useCasesResult, trlResult] =
			await Promise.all([
				supabase
					.from("node_papers")
					.select("id")
					.eq("node_id", nodeId)
					.limit(20),
				supabase
					.from("node_patents")
					.select("id")
					.eq("node_id", nodeId)
					.limit(20),
				supabase
					.from("node_use_cases")
					.select("id")
					.eq("node_id", nodeId)
					.limit(20),
				supabase
					.from("node_marketinfo")
					.select("id")
					.eq("node_id", nodeId)
					.limit(1),
			])

		const hasCompleteData = Boolean(
			papersResult.data &&
				papersResult.data.length > 0 &&
				patentsResult.data &&
				patentsResult.data.length > 0 &&
				useCasesResult.data &&
				useCasesResult.data.length > 0 &&
				trlResult.data &&
				trlResult.data.length > 0,
		)

		if (hasCompleteData) {
			enrichedNodes.add(nodeId)
		}

		return hasCompleteData
	} catch (error) {
		console.error("[NODE_ENRICHMENT] Error checking existing data:", error)
		return false
	}
}

/**
 * Call the node enrichment edge function with streaming support
 */
export const callNodeEnrichmentStreaming = async (
	params: NodeEnrichmentRequest,
	callback: StreamingCallback,
): Promise<void> => {
	const { nodeId } = params

	// Check if already loading
	if (loadingNodes.has(nodeId)) {
		callback({
			type: "error",
			error: "Node enrichment already in progress",
			nodeId,
			timestamp: new Date().toISOString(),
		})
		return
	}

	// Mark as loading
	loadingNodes.add(nodeId)

	try {
		// Check what data already exists
		const [papersExist, patentsExist, useCasesExist, _trlExist] =
			await Promise.all([
				checkPapersExist(nodeId),
				checkPatentsExist(nodeId),
				checkUseCasesExist(nodeId),
				checkTrlExist(nodeId),
			])

		// Only call APIs for data that doesn't exist yet
		const promises: Promise<void>[] = []

		if (!papersExist) {
			loadingPapers.add(nodeId)

			import("@/hooks/useEnrichedData").then(({ triggerPapersStart }) => {
				triggerPapersStart(nodeId)
			})

			promises.push(callPapersEnrichment(params, callback))
		}

		if (!patentsExist) {
			loadingPatents.add(nodeId)

			import("@/hooks/useEnrichedData").then(({ triggerPatentsStart }) => {
				if (typeof triggerPatentsStart === "function") {
					triggerPatentsStart(nodeId)
				}
			})

			promises.push(callPatentsEnrichment(params, callback))
		}

		if (!useCasesExist) {
			loadingUseCases.add(nodeId)

			import("@/hooks/useEnrichedData").then(({ triggerUseCasesStart }) => {
				triggerUseCasesStart(nodeId)
			})

			promises.push(callUseCasesEnrichment(params, callback))
		}

		/*if (!trlExist) {
			loadingTrl.add(nodeId)

			import("@/hooks/useEnrichedData").then(({ triggerTrlStart }) => {
				if (typeof triggerTrlStart === "function") {
					triggerTrlStart(nodeId)
				}
			})

			promises.push(callTrlEnrichment(params, callback))
		}*/

		// If all data already exists, trigger completion immediately
		if (promises.length === 0) {
			callback({
				type: "complete",
				nodeId,
				timestamp: new Date().toISOString(),
			})
			enrichedNodes.add(nodeId)
			return
		}

		// Wait for any missing data to be fetched
		await Promise.allSettled(promises)

		// Add a small delay to ensure all callbacks have been processed
		setTimeout(() => {
			callback({
				type: "complete",
				nodeId,
				timestamp: new Date().toISOString(),
			})
		}, 100)

		// Mark as enriched when complete
		enrichedNodes.add(nodeId)
	} catch (error) {
		console.error("[NODE_ENRICHMENT_STREAMING] Error:", error)
		callback({
			type: "error",
			error: error instanceof Error ? error.message : "Unknown error occurred",
			nodeId,
			timestamp: new Date().toISOString(),
		})
	} finally {
		// Always remove from loading set
		loadingNodes.delete(nodeId)
	}
}

// ─── Check helpers ───────────────────────────────────────────────

const checkPapersExist = async (nodeId: string): Promise<boolean> => {
	try {
		const { count, error } = await supabase
			.from("node_papers")
			.select("id", { count: "exact", head: true })
			.eq("node_id", nodeId)

		if (error) return false

		return (count ?? 0) > 10
	} catch (error) {
		console.error("[CHECK_PAPERS] Error:", error)
		return false
	}
}

const checkPatentsExist = async (nodeId: string): Promise<boolean> => {
	try {
		const { count, error } = await supabase
			.from("node_patents")
			.select("id", { count: "exact", head: true })
			.eq("node_id", nodeId)

		if (error) return false

		return (count ?? 0) > 0
	} catch (error) {
		console.error("[CHECK_PATENTS] Error:", error)
		return false
	}
}

const checkUseCasesExist = async (nodeId: string): Promise<boolean> => {
	try {
		const { count, error } = await supabase
			.from("node_use_cases")
			.select("id", { count: "exact", head: true })
			.eq("node_id", nodeId)

		if (error) return false

		return (count ?? 0) > 0
	} catch (error) {
		console.error("[CHECK_USECASES] Error:", error)
		return false
	}
}

const checkTrlExist = async (nodeId: string): Promise<boolean> => {
	try {
		const { count, error } = await supabase
			.from("node_marketinfo" as any)
			.select("id", { count: "exact", head: true })
			.eq("node_id", nodeId)

		if (error) return false

		return (count ?? 0) > 0
	} catch (error) {
		console.error("[CHECK_TRL] Error:", error)
		return false
	}
}

// ─── Enrichment callers ──────────────────────────────────────────

const callPapersEnrichment = async (
	params: NodeEnrichmentRequest,
	callback: StreamingCallback,
): Promise<void> => {
	const { nodeId, enrichNode } = params

	enqueueEnrichment(nodeId, enrichNode, "papers", params, (response) => {
		if (response.type === "error") {
			console.error(
				"[PAPERS_ENRICHMENT] Papers enrichment error:",
				response.error,
			)
			callback(response)
		} else {
			callback({
				type: "papers",
				data: {
					count: response.data?.count || 0,
					saved: response.data?.saved || false,
					response: response.data,
				},
				nodeId,
				timestamp: new Date().toISOString(),
			})
		}

		loadingPapers.delete(nodeId)
	})
}

const callPatentsEnrichment = async (
	params: NodeEnrichmentRequest,
	callback: StreamingCallback,
): Promise<void> => {
	const { nodeId, enrichNode } = params

	enqueueEnrichment(nodeId, enrichNode, "patents", params, (response) => {
		if (response.type === "error") {
			console.error(
				"[PATENTS_ENRICHMENT] Patents enrichment error:",
				response.error,
			)
			callback(response)
		} else {
			callback({
				type: "patents",
				data: {
					count: response.data?.count || 0,
					saved: response.data?.saved || false,
					response: response.data,
				},
				nodeId,
				timestamp: new Date().toISOString(),
			})
		}

		loadingPatents.delete(nodeId)
	})
}

const callUseCasesEnrichment = async (
	params: NodeEnrichmentRequest,
	callback: StreamingCallback,
): Promise<void> => {
	const { nodeId, enrichNode } = params

	enqueueEnrichment(nodeId, enrichNode, "useCases", params, (response) => {
		if (response.type === "error") {
			console.error(
				"[USECASES_ENRICHMENT] Use cases enrichment error:",
				response.error,
			)
			callback(response)
		} else {
			callback({
				type: "useCases",
				data: {
					count: response.data?.count || 0,
					saved: response.data?.saved || false,
					response: response.data,
				},
				nodeId,
				timestamp: new Date().toISOString(),
			})
		}

		loadingUseCases.delete(nodeId)
	})
}

const _callTrlEnrichment = async (
	params: NodeEnrichmentRequest,
	callback: StreamingCallback,
): Promise<void> => {
	const { nodeId, enrichNode } = params

	enqueueEnrichment(nodeId, enrichNode, "trl", params, (response) => {
		if (response.type === "error") {
			console.error("[TRL_ENRICHMENT] TRL calculation error:", response.error)
			callback(response)
		} else {
			callback({
				type: "trl",
				data: {
					count: response.data?.count || 0,
					saved: response.data?.saved || false,
					response: response.data,
				},
				nodeId,
				timestamp: new Date().toISOString(),
			})
		}

		loadingTrl.delete(nodeId)
	})
}

// ─── Tree helpers (unchanged) ────────────────────────────────────

/**
 * Build parent titles array based on the selected path and tree data
 * Maximum of 4 parent nodes are included
 */
export const buildParentTitles = (
	level: string,
	_nodeId: string,
	selectedPath: any,
	treeData: any,
): string[] => {
	try {
		const parentTitles: string[] = []
		const levels = [
			"level1",
			"level2",
			"level3",
			"level4",
			"level5",
			"level6",
			"level7",
			"level8",
			"level9",
			"level10",
		]
		const targetLevelIndex = levels.indexOf(level)

		for (let i = 0; i < targetLevelIndex && i < 4; i++) {
			const currentLevel = levels[i]
			const parentNodeId = selectedPath[currentLevel]

			if (!parentNodeId) break

			const parentTitle = getNodeTitle(currentLevel, parentNodeId, treeData)
			if (parentTitle) {
				parentTitles.push(parentTitle)
			}
		}

		return parentTitles
	} catch (error) {
		console.error("Error building parent titles:", error)
		return []
	}
}

export const buildParentInfo = (
	treeMode: string,
	level: string,
	_nodeId: string,
	selectedPath: any,
	treeData: any,
): NodeInfo[] => {
	try {
		const parentNodes: NodeInfo[] = []
		const levels = [
			"level1",
			"level2",
			"level3",
			"level4",
			"level5",
			"level6",
			"level7",
			"level8",
			"level9",
			"level10",
		]
		const targetLevelIndex = levels.indexOf(level)

		for (let i = 0; i < targetLevelIndex && i < 4; i++) {
			const currentLevel = levels[i]
			const parentNodeId = selectedPath[currentLevel]

			if (!parentNodeId) break

			const parentNode = getNodeInfo(
				treeMode,
				currentLevel,
				parentNodeId,
				treeData,
			)
			if (parentNode) {
				parentNodes.push(parentNode)
			}
		}

		return parentNodes
	} catch (error) {
		console.error("Error building parent titles:", error)
		return []
	}
}

const getNodeTitle = (level: string, nodeId: string, treeData: any): string => {
	try {
		if (level === "level1") {
			const node = treeData?.level1Items?.find(
				(item: any) => item.id === nodeId,
			)
			return node?.name || ""
		}

		const levelKey = `${level}Items`
		if (treeData?.[levelKey]) {
			for (const [_parentId, items] of Object.entries(treeData[levelKey])) {
				if (Array.isArray(items)) {
					const foundNode = items.find((item: any) => item.id === nodeId)
					if (foundNode) return foundNode.name || ""
				}
			}
		}

		return ""
	} catch (error) {
		console.error(
			`[GET_NODE_TITLE] Error getting title for ${level}:${nodeId}:`,
			error,
		)
		return ""
	}
}

const getLevelLabel = (labels: any, level: string): string => {
	return (
		(typeof labels === "object" && labels[level as keyof typeof labels]) ||
		level
	)
}

const getNodeInfo = (
	treeMode: string,
	level: string,
	nodeId: string,
	treeData: any,
): NodeInfo | null => {
	const labels =
		treeMode === "FAST"
			? {
					level1: "How1",
					level2: "How2",
					level3: "How3",
					level4: "How4",
					level5: "How5",
					level6: "How6",
					level7: "How7",
					level8: "How8",
					level9: "How9",
					level10: "How10",
				}
			: treeMode === "TED"
				? {
						level1: "シナリオ",
						level2: "目的",
						level3: "機能",
						level4: "手段",
						level5: "手段2",
						level6: "手段3",
						level7: "手段4",
						level8: "手段5",
						level9: "手段6",
						level10: "手段7",
					}
				: []

	try {
		if (level === "level1") {
			const node = treeData?.level1Items?.find(
				(item: any) => item.id === nodeId,
			)
			if (node) {
				return {
					name: node.name,
					description: node.description,
					level: getLevelLabel(labels, level),
				}
			}
			return null
		}

		const levelKey = `${level}Items`
		if (treeData?.[levelKey]) {
			for (const items of Object.values(treeData[levelKey])) {
				if (Array.isArray(items)) {
					const foundNode = items.find((item: any) => item.id === nodeId)
					if (foundNode) {
						return {
							name: foundNode.name,
							description: foundNode.description,
							level: getLevelLabel(labels, level),
						}
					}
				}
			}
		}

		return null
	} catch (error) {
		console.error(
			`[GET_NODE_TITLE] Error getting title for ${level}:${nodeId}:`,
			error,
		)
		return null
	}
}

/**
 * Get node details (title and description) from the tree data
 */
export const getNodeDetails = (
	level: string,
	nodeId: string,
	selectedPath: any,
	treeData: any,
): { title: string; description: string } => {
	try {
		let nodeTitle = ""
		let nodeDescription = ""

		if (level === "level1") {
			const node = treeData?.level1Items?.find(
				(item: any) => item.id === nodeId,
			)
			nodeTitle = node?.name || ""
			nodeDescription = node?.description || ""
		} else {
			const levels = [
				"level1",
				"level2",
				"level3",
				"level4",
				"level5",
				"level6",
				"level7",
				"level8",
				"level9",
				"level10",
			]
			const targetLevelIndex = levels.indexOf(level)

			if (targetLevelIndex > 0) {
				const parentLevel = levels[targetLevelIndex - 1]
				const parentNodeId = selectedPath[parentLevel]
				const levelKey = `${level}Items`

				const parentItems = treeData?.[levelKey]?.[parentNodeId] || []
				const node = parentItems.find((item: any) => item.id === nodeId)
				nodeTitle = node?.name || ""
				nodeDescription = node?.description || ""

				if (!node && treeData?.[levelKey]) {
					for (const [_parentId, items] of Object.entries(treeData[levelKey])) {
						if (Array.isArray(items)) {
							const foundNode = items.find((item: any) => item.id === nodeId)
							if (foundNode) {
								nodeTitle = foundNode.name || ""
								nodeDescription = foundNode.description || ""
								break
							}
						}
					}
				}

				if (!nodeTitle && !nodeDescription) {
					const allLevelKeys = [
						"level1Items",
						"level2Items",
						"level3Items",
						"level4Items",
						"level5Items",
						"level6Items",
						"level7Items",
						"level8Items",
						"level9Items",
						"level10Items",
					]

					for (const lk of allLevelKeys) {
						if (!treeData?.[lk]) continue

						if (lk === "level1Items") {
							const foundNode = treeData[lk].find(
								(item: any) => item.id === nodeId,
							)
							if (foundNode) {
								nodeTitle = foundNode.name || ""
								nodeDescription = foundNode.description || ""
								break
							}
						} else {
							for (const [_parentId, items] of Object.entries(treeData[lk])) {
								if (Array.isArray(items)) {
									const foundNode = items.find(
										(item: any) => item.id === nodeId,
									)
									if (foundNode) {
										nodeTitle = foundNode.name || ""
										nodeDescription = foundNode.description || ""
										break
									}
								}
							}
							if (nodeTitle) break
						}
					}
				}
			}
		}

		return { title: nodeTitle, description: nodeDescription }
	} catch (error) {
		console.error("Error getting node details:", error)
		return { title: "", description: "" }
	}
}

/**
 * Create a properly formatted NodeEnrichmentRequest for the new API structure
 */
export const createEnrichmentRequest = (
	nodeId: string,
	treeId: string,
	level: string,
	selectedPath: any,
	treeData: any,
	query: string,
	treeType: string,
	team_id?: string | null,
): NodeEnrichmentRequest => {
	try {
		const { title: enrichNode } = getNodeDetails(
			level,
			nodeId,
			selectedPath,
			treeData,
		)

		const parentNodes = buildParentInfo(
			treeData?.mode || "TED",
			level,
			nodeId,
			selectedPath,
			treeData,
		)

		return {
			nodeId,
			treeId,
			enrichNode,
			query,
			parentNodes,
			treeType,
			team_id,
		}
	} catch (error) {
		console.error("Error creating request:", error)
		throw error
	}
}

/**
 * Enrich a node with the new API structure - main entry point for UI
 */
export const enrichNodeWithNewStructure = async (
	nodeId: string,
	treeId: string,
	level: string,
	selectedPath: any,
	treeData: any,
	query: string,
	treeType: string,
	callback: StreamingCallback,
	team_id?: string | null,
	overrideTitle?: string,
): Promise<void> => {
	try {
		const enrichmentRequest = createEnrichmentRequest(
			nodeId,
			treeId,
			level,
			selectedPath,
			treeData,
			query,
			treeType,
			team_id,
		)

		if (overrideTitle) {
			enrichmentRequest.enrichNode = overrideTitle
		}

		await callNodeEnrichmentStreaming(enrichmentRequest, callback)
	} catch (error) {
		console.error("[ENRICH_NODE_NEW_STRUCTURE] Error:", error)
		callback({
			type: "error",
			error: error instanceof Error ? error.message : "Unknown error occurred",
			nodeId,
			timestamp: new Date().toISOString(),
		})
	}
}
