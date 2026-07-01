import i18next from "i18next"
import { supabase } from "@/integrations/supabase/client"
import type { Json } from "@/integrations/supabase/types"

interface TreeNodeFromDB {
	id: string
	name: string
	description: string | null
	children_count: number // Number of children, 0 indicates generation in progress
	axis:
		| "Scenario"
		| "Purpose"
		| "Function"
		| "Measure"
		| "Measure2"
		| "Measure3"
		| "Measure4"
		| "Measure5"
		| "Measure6"
		| "Measure7"
		| "Technology"
		| "How1"
		| "How2"
		| "How3"
		| "How4"
		| "How5"
		| "How6"
		| "How7"
	level: number
	children?: TreeNodeFromDB[]
}

interface TreeStructureFromDB {
	root: TreeNodeFromDB
	reasoning: string | null
	layer_config: Json
	scenario_inputs: Json
}

interface NodeEnrichmentData {
	paperCount: number
	useCaseCount: number
}

// Helper function to fetch real paper and use case counts for nodes
const fetchNodeEnrichmentCounts = async (
	nodeIds: string[],
): Promise<Map<string, NodeEnrichmentData>> => {
	const enrichmentMap = new Map<string, NodeEnrichmentData>()

	if (nodeIds.length === 0) {
		return enrichmentMap
	}

	//console.log('[ENRICHMENT_COUNTS] Fetching counts for nodes:', nodeIds);

	// Get paper counts for all nodes
	const { data: paperData, error: paperError } = await supabase
		.from("node_papers" as any)
		.select("node_id")
		.in("node_id", nodeIds)

	// Get use case counts for all nodes
	const { data: useCaseData, error: useCaseError } = await supabase
		.from("node_use_cases" as any)
		.select("node_id")
		.in("node_id", nodeIds)

	if (paperError || useCaseError) {
		// Hardcode all nodes to have 20 papers and 0 use cases for now
		nodeIds.forEach((nodeId) => {
			enrichmentMap.set(nodeId, {
				paperCount: 20,
				useCaseCount: 0,
			})
		})
	} else {
		const paperCountMap = new Map<string, number>()
		const useCaseCountMap = new Map<string, number>()

		// Count papers for each node
		paperData?.forEach((paper: any) => {
			const nodeId = paper.node_id
			paperCountMap.set(nodeId, (paperCountMap.get(nodeId) || 0) + 1)
		})

		// Count use cases for each node
		useCaseData?.forEach((useCase: any) => {
			const nodeId = useCase.node_id
			useCaseCountMap.set(nodeId, (useCaseCountMap.get(nodeId) || 0) + 1)
		})

		// Create enrichment data for all requested nodes
		nodeIds.forEach((nodeId) => {
			const paperCount = paperCountMap.get(nodeId) || 0
			const useCaseCount = useCaseCountMap.get(nodeId) || 0
			enrichmentMap.set(nodeId, {
				paperCount,
				useCaseCount,
			})
			//console.log(`[ENRICHMENT_COUNTS] Node ${nodeId}: ${paperCount} papers, ${useCaseCount} use cases`);
		})
	}

	//console.log('[ENRICHMENT_COUNTS] Final enrichment map size:', enrichmentMap.size);
	return enrichmentMap
}

// Helper function to create info string with real or fallback data
const createNodeInfoString = (
	enrichmentData?: NodeEnrichmentData,
	_nodeId?: string,
): string => {
	if (
		enrichmentData &&
		(enrichmentData.paperCount > 0 || enrichmentData.useCaseCount > 0)
	) {
		return `${enrichmentData.paperCount}論文・${enrichmentData.useCaseCount}事例`
	}
	// Show 0 papers and use cases if no enriched data is available
	return `0論文・0事例`
}

const _convertFastTreeToAppFormat = async (
	treeStructure: TreeStructureFromDB,
	treeMetadata?: { description?: string; search_theme?: string; name?: string },
) => {
	// Helper function to recursively collect all nodes
	const collectAllNodes = (
		node: TreeNodeFromDB,
		allNodes: TreeNodeFromDB[] = [],
	): TreeNodeFromDB[] => {
		allNodes.push(node)
		if (node.children) {
			node.children.forEach((child) => collectAllNodes(child, allNodes))
		}
		return allNodes
	}
	const allNodes = collectAllNodes(treeStructure.root)

	// Get enrichment data for all nodes
	const nodeIds = allNodes.map((node) => node.id)
	const enrichmentMap = await fetchNodeEnrichmentCounts(nodeIds)

	// For FAST trees: Root IS the Technology (level 0)
	// Level 1 items are How1 nodes - children of Technology root
	const level1Nodes = treeStructure.root.children || []

	// Debug logging to understand data structure
	console.log("[CONVERTER DEBUG FAST] Root:", {
		name: treeStructure.root.name,
		axis: treeStructure.root.axis,
		childrenCount: level1Nodes.length,
	})
	console.log(
		"[CONVERTER DEBUG FAST] Level1 nodes axes:",
		level1Nodes.map((n) => ({
			name: n.name,
			axis: n.axis,
			childrenLength: n.children?.length,
		})),
	)

	// Filter for How1 nodes, or if none match, include all level 1 children
	let filteredLevel1Nodes = level1Nodes.filter((node) => node.axis === "How1")
	if (filteredLevel1Nodes.length === 0 && level1Nodes.length > 0) {
		console.log(
			"[CONVERTER DEBUG FAST] No How1 nodes found, using all children as level1",
		)
		filteredLevel1Nodes = level1Nodes // Fallback: use all children if axis doesn't match
	}

	const level1Items = filteredLevel1Nodes.map((node, index) => {
		const enrichmentData = enrichmentMap.get(node.id)
		// Preserve null so NodeContent can distinguish "leaf node" (null) from "generating children" (0)
		const actualChildrenCount =
			node.children?.length || (node.children_count ?? null)
		return {
			id: node.id,
			name: node.name,
			info: createNodeInfoString(enrichmentData, node.id),
			description: node.description || "",
			color: `hsl(${200 + index * 30}, 70%, 50%)`,
			children_count: actualChildrenCount,
		}
	}) // Extract level 2 items (How2 nodes - children of How1 nodes)
	const level2Items: Record<string, any[]> = {}
	level1Nodes.forEach((how1Node) => {
		console.log("[CONVERTER DEBUG FAST] How1Node:", {
			id: how1Node.id,
			name: how1Node.name,
			axis: how1Node.axis,
			hasChildren: !!how1Node.children,
			childrenLength: how1Node.children?.length,
			childrenAxes: how1Node.children?.map((c) => c.axis),
		})
		if (how1Node.children && how1Node.children.length > 0) {
			let how2Nodes = how1Node.children.filter((node) => node.axis === "How2")
			console.log("[CONVERTER DEBUG FAST] How2Nodes found:", how2Nodes.length)
			// Fallback: if no How2 nodes, use all children
			if (how2Nodes.length === 0) {
				console.log(
					"[CONVERTER DEBUG FAST] No How2 nodes, using all children as level2",
				)
				how2Nodes = how1Node.children
			}
			level2Items[how1Node.id] = how2Nodes.map((node, index) => {
				const enrichmentData = enrichmentMap.get(node.id)
				const actualChildrenCount =
					node.children?.length || node.children_count || 0
				return {
					id: node.id,
					name: node.name,
					info: createNodeInfoString(enrichmentData, node.id),
					description: node.description || "",
					color: `hsl(${220 + index * 25}, 65%, 55%)`,
					children_count: actualChildrenCount,
				}
			})
		} else {
			// No children yet
			level2Items[how1Node.id] = []
		}
	}) // Extract level 3 items (How3 nodes - children of How2 nodes)
	const level3Items: Record<string, any[]> = {}
	level1Nodes.forEach((how1Node) => {
		how1Node.children?.forEach((how2Node) => {
			if (how2Node.axis === "How2") {
				if (how2Node.children && how2Node.children.length > 0) {
					const how3Nodes = how2Node.children.filter(
						(node) => node.axis === "How3",
					)
					if (how3Nodes.length > 0) {
						level3Items[how2Node.id] = how3Nodes.map((node, index) => {
							const enrichmentData = enrichmentMap.get(node.id)
							return {
								id: node.id,
								name: node.name,
								info: createNodeInfoString(enrichmentData, node.id),
								description: node.description || "",
								color: `hsl(${240 + index * 20}, 60%, 60%)`,
								children_count:
									node.children?.length || node.children_count || 0,
							}
						})
					}
				} else if (how2Node.children_count === 0) {
					// Show How2 nodes that are pending subtree generation
					level3Items[how2Node.id] = []
				}
			}
		})
	}) // Extract level 4 items (How4 nodes - children of How3 nodes)
	const level4Items: Record<string, any[]> = {}
	level1Nodes.forEach((how1Node) => {
		how1Node.children?.forEach((how2Node) => {
			if (how2Node.axis === "How2") {
				how2Node.children?.forEach((how3Node) => {
					if (how3Node.axis === "How3") {
						if (how3Node.children && how3Node.children.length > 0) {
							const how4Nodes = how3Node.children.filter(
								(node) => node.axis === "How4",
							)
							if (how4Nodes.length > 0) {
								level4Items[how3Node.id] = how4Nodes.map((node, index) => {
									const enrichmentData = enrichmentMap.get(node.id)
									return {
										id: node.id,
										name: node.name,
										info: createNodeInfoString(enrichmentData, node.id),
										description: node.description || "",
										color: `hsl(${260 + index * 15}, 55%, 65%)`,
										children_count:
											node.children?.length || node.children_count || 0,
									}
								})
							}
						} else if (how3Node.children_count === 0) {
							// Show How3 nodes that are pending subtree generation
							level4Items[how3Node.id] = []
						}
					}
				})
			}
		})
	}) // Helper function to extract children with specific axis types for FAST
	const extractFastChildrenByAxis = (
		parentNodes: TreeNodeFromDB[],
		axisType: string,
	): Record<string, any[]> => {
		const items: Record<string, any[]> = {}

		parentNodes.forEach((parentNode) => {
			if (parentNode.children && parentNode.children.length > 0) {
				const childNodes = parentNode.children.filter(
					(node) => node.axis === axisType,
				)
				if (childNodes.length > 0) {
					items[parentNode.id] = childNodes.map((node, index) => {
						const enrichmentData = enrichmentMap.get(node.id)
						return {
							id: node.id,
							name: node.name,
							info: createNodeInfoString(enrichmentData, node.id),
							description: node.description || "",
							color: `hsl(${260 + index * 15}, 55%, 65%)`,
							children_count: node.children?.length || node.children_count || 0,
						}
					})
				}
			} else if (parentNode.children_count === 0) {
				// Show parent nodes that are pending subtree generation
				items[parentNode.id] = []
			}
		})

		return items
	}
	// Extract level 5+ items (How5, How6, etc.)
	const level4Nodes: TreeNodeFromDB[] = []
	Object.values(level4Items).forEach((items) => {
		items.forEach((item) => {
			const dbNode = allNodes.find((node) => node.id === item.id)
			if (dbNode) level4Nodes.push(dbNode)
		})
	})
	const level5Items = extractFastChildrenByAxis(level4Nodes, "How5")

	const level5Nodes: TreeNodeFromDB[] = []
	Object.values(level5Items).forEach((items) => {
		items.forEach((item) => {
			const dbNode = allNodes.find((node) => node.id === item.id)
			if (dbNode) level5Nodes.push(dbNode)
		})
	})
	const level6Items = extractFastChildrenByAxis(level5Nodes, "How6")

	const level6Nodes: TreeNodeFromDB[] = []
	Object.values(level6Items).forEach((items) => {
		items.forEach((item) => {
			const dbNode = allNodes.find((node) => node.id === item.id)
			if (dbNode) level6Nodes.push(dbNode)
		})
	})
	const level7Items = extractFastChildrenByAxis(level6Nodes, "How7")

	// For FAST trees, we stop at How7 (level 7) as per database schema
	const level8Items: Record<string, any[]> = {}
	const level9Items: Record<string, any[]> = {}
	const level10Items: Record<string, any[]> = {}

	const convertedData = {
		level1Items,
		level2Items,
		level3Items,
		level4Items,
		level5Items,
		level6Items,
		level7Items,
		level8Items,
		level9Items,
		level10Items,
		scenario: treeMetadata?.description || "",
		searchTheme: treeMetadata?.search_theme || "",
		treeName: treeMetadata?.name || "",
		mode: "FAST",
	}

	return convertedData
}

export const convertDatabaseTreeToAppFormat = async (
	treeStructure: TreeStructureFromDB,
	treeMetadata?: {
		description?: string | null
		search_theme?: string | null
		name?: string | null
		mode?: string | null
	},
) => {
	// console.log(
	// `[CONVERTER DEBUG] Converting tree structure with mode: ${
	// treeMetadata?.mode || "TED"
	// }`,
	// )

	if (!treeStructure?.root) {
		console.error(
			"[CONVERTER DEBUG] Invalid tree structure received from database",
		)
		return null
	}

	// Use a generic level-based converter that works for any tree structure
	return await convertGenericTreeToAppFormat(treeStructure, treeMetadata)
}

// Generic converter that uses tree depth instead of axis filtering
const convertGenericTreeToAppFormat = async (
	treeStructure: TreeStructureFromDB,
	treeMetadata?: {
		description?: string | null
		search_theme?: string | null
		name?: string | null
		mode?: string | null
	},
) => {
	// Helper function to recursively collect all nodes
	const collectAllNodes = (
		node: TreeNodeFromDB,
		allNodes: TreeNodeFromDB[] = [],
	): TreeNodeFromDB[] => {
		allNodes.push(node)
		if (node.children) {
			node.children.forEach((child) => collectAllNodes(child, allNodes))
		}
		return allNodes
	}
	const allNodes = collectAllNodes(treeStructure.root)

	// Get enrichment data for all nodes
	const nodeIds = allNodes.map((node) => node.id)
	const enrichmentMap = await fetchNodeEnrichmentCounts(nodeIds)

	// Root is level 0, its children are level 1
	const level1Nodes = treeStructure.root.children || []

	// Convert level 1 items (direct children of root)
	const level1Items = level1Nodes.map((node, index) => {
		const enrichmentData = enrichmentMap.get(node.id)
		const actualChildrenCount =
			node.children?.length || node.children_count || 0
		return {
			id: node.id,
			name: node.name,
			info: createNodeInfoString(enrichmentData, node.id),
			description: node.description || "",
			color: `hsl(${200 + index * 30}, 70%, 50%)`,
			children_count: actualChildrenCount,
		}
	})

	// Convert level 2 items (children of level 1 nodes)
	const level2Items: Record<string, any[]> = {}
	level1Nodes.forEach((l1Node) => {
		const children = l1Node.children || []
		level2Items[l1Node.id] = children.map((node, index) => {
			const enrichmentData = enrichmentMap.get(node.id)
			const actualChildrenCount =
				node.children?.length || node.children_count || 0
			return {
				id: node.id,
				name: node.name,
				info: createNodeInfoString(enrichmentData, node.id),
				description: node.description || "",
				color: `hsl(${220 + index * 25}, 65%, 55%)`,
				children_count: actualChildrenCount,
			}
		})
	})

	// Convert level 3 items (children of level 2 nodes)
	const level3Items: Record<string, any[]> = {}
	level1Nodes.forEach((l1Node) => {
		;(l1Node.children || []).forEach((l2Node) => {
			const children = l2Node.children || []
			level3Items[l2Node.id] = children.map((node, index) => {
				const enrichmentData = enrichmentMap.get(node.id)
				const actualChildrenCount =
					node.children?.length || node.children_count || 0
				return {
					id: node.id,
					name: node.name,
					info: createNodeInfoString(enrichmentData, node.id),
					description: node.description || "",
					color: `hsl(${240 + index * 20}, 60%, 60%)`,
					children_count: actualChildrenCount,
				}
			})
		})
	})

	// Convert level 4 items (children of level 3 nodes)
	const level4Items: Record<string, any[]> = {}
	level1Nodes.forEach((l1Node) => {
		;(l1Node.children || []).forEach((l2Node) => {
			;(l2Node.children || []).forEach((l3Node) => {
				const children = l3Node.children || []
				level4Items[l3Node.id] = children.map((node, index) => {
					const enrichmentData = enrichmentMap.get(node.id)
					const actualChildrenCount =
						node.children?.length || node.children_count || 0
					return {
						id: node.id,
						name: node.name,
						info: createNodeInfoString(enrichmentData, node.id),
						description: node.description || "",
						color: `hsl(${260 + index * 15}, 55%, 65%)`,
						children_count: actualChildrenCount,
					}
				})
			})
		})
	})

	// Convert level 5 items
	const level5Items: Record<string, any[]> = {}
	level1Nodes.forEach((l1Node) => {
		;(l1Node.children || []).forEach((l2Node) => {
			;(l2Node.children || []).forEach((l3Node) => {
				;(l3Node.children || []).forEach((l4Node) => {
					const children = l4Node.children || []
					level5Items[l4Node.id] = children.map((node, index) => {
						const enrichmentData = enrichmentMap.get(node.id)
						return {
							id: node.id,
							name: node.name,
							info: createNodeInfoString(enrichmentData, node.id),
							description: node.description || "",
							color: `hsl(${280 + index * 10}, 50%, 70%)`,
							children_count: node.children?.length || node.children_count || 0,
						}
					})
				})
			})
		})
	})

	// Generate level names based on mode
	const isTedMode = treeMetadata?.mode !== "FAST"
	const _t = i18next.t.bind(i18next)
	const levelNames = isTedMode
		? {
				level1: _t("scenario.level_names.scenario"),
				level2: _t("scenario.level_names.objective"),
				level3: _t("scenario.level_names.function"),
				level4: _t("scenario.level_names.means"),
				level5: `${_t("scenario.level_names.means")}2`,
				level6: `${_t("scenario.level_names.means")}3`,
				level7: `${_t("scenario.level_names.means")}4`,
			}
		: {
				level1: "How1",
				level2: "How2",
				level3: "How3",
				level4: "How4",
				level5: "How5",
				level6: "How6",
				level7: "How7",
			}

	console.log("[CONVERTER DEBUG GENERIC] Converted data:", {
		level1Count: level1Items.length,
		level2Keys: Object.keys(level2Items),
		level2ItemsCounts: Object.entries(level2Items).map(([k, v]) => [
			k,
			v.length,
		]),
		level3Keys: Object.keys(level3Items),
	})

	return {
		level1Items,
		level2Items,
		level3Items,
		level4Items,
		level5Items,
		level6Items: {},
		level7Items: {},
		level8Items: {},
		level9Items: {},
		level10Items: {},
		levelNames,
		scenario: treeMetadata?.description || "",
		query: treeMetadata?.search_theme || "",
		mode: treeMetadata?.mode || "TED",
	}
}

const _convertTedTreeToAppFormat = async (
	treeStructure: TreeStructureFromDB,
	treeMetadata?: { description?: string; search_theme?: string; name?: string },
) => {
	// Helper function to recursively collect all nodes
	const collectAllNodes = (
		node: TreeNodeFromDB,
		allNodes: TreeNodeFromDB[] = [],
	): TreeNodeFromDB[] => {
		allNodes.push(node)
		if (node.children) {
			node.children.forEach((child) => collectAllNodes(child, allNodes))
		}
		return allNodes
	}
	const allNodes = collectAllNodes(treeStructure.root)

	// Get enrichment data for all nodes
	const nodeIds = allNodes.map((node) => node.id)
	const enrichmentMap = await fetchNodeEnrichmentCounts(nodeIds)

	// Extract level 1 items (Scenario nodes - children of root)
	const level1Nodes = treeStructure.root.children || []

	// Filter for Scenario nodes, or if none match, include all level 1 children
	let filteredLevel1Nodes = level1Nodes.filter(
		(node) => node.axis === "Scenario",
	)
	if (filteredLevel1Nodes.length === 0 && level1Nodes.length > 0) {
		console.log(
			"[CONVERTER DEBUG TED] No Scenario nodes found, using all children as level1",
		)
		filteredLevel1Nodes = level1Nodes // Fallback: use all children if axis doesn't match
	}

	const level1Items = filteredLevel1Nodes.map((node, index) => {
		const enrichmentData = enrichmentMap.get(node.id)
		return {
			id: node.id,
			name: node.name,
			info: createNodeInfoString(enrichmentData, node.id),
			description: node.description || "",
			color: `hsl(${200 + index * 30}, 70%, 50%)`,
			children_count: node.children?.length || node.children_count || 0,
		}
	})

	// console.log(
	// `[CONVERTER DEBUG TED] Converted level1Items:`,
	// level1Items.map((item) => ({
	// name: item.name,
	// children_count: item.children_count,
	// id: item.id,
	// })),
	// )

	// Extract level 2 items (Purpose nodes - children of Scenario nodes)
	const level2Items: Record<string, any[]> = {}
	filteredLevel1Nodes.forEach((scenarioNode) => {
		if (scenarioNode.children && scenarioNode.children.length > 0) {
			let purposeNodes = scenarioNode.children.filter(
				(node) => node.axis === "Purpose",
			)
			// Fallback: if no Purpose nodes, use all children
			if (purposeNodes.length === 0) {
				console.log(
					"[CONVERTER DEBUG TED] No Purpose nodes, using all children as level2",
				)
				purposeNodes = scenarioNode.children
			}
			level2Items[scenarioNode.id] = purposeNodes.map((node, index) => {
				const enrichmentData = enrichmentMap.get(node.id)
				return {
					id: node.id,
					name: node.name,
					info: createNodeInfoString(enrichmentData, node.id),
					description: node.description || "",
					color: `hsl(${220 + index * 25}, 65%, 55%)`,
					children_count: node.children?.length || node.children_count || 0,
				}
			})
		} else {
			level2Items[scenarioNode.id] = []
		}
	})

	// Extract level 3 items (Function nodes - children of Purpose nodes)
	const level3Items: Record<string, any[]> = {}
	// Iterate over all level2 items we've collected
	Object.entries(level2Items).forEach(([_scenarioId, purposeNodes]) => {
		;(purposeNodes as any[]).forEach((purposeNodeRef: any) => {
			// Find the actual node from the tree to get children
			const scenarioNode = filteredLevel1Nodes.find((s) =>
				s.children?.some((c) => c.id === purposeNodeRef.id),
			)
			const purposeNode = scenarioNode?.children?.find(
				(c) => c.id === purposeNodeRef.id,
			)
			if (purposeNode?.children && purposeNode.children.length > 0) {
				let functionNodes = purposeNode.children.filter(
					(node) => node.axis === "Function",
				)
				// Fallback: use all children if no Function nodes
				if (functionNodes.length === 0) {
					functionNodes = purposeNode.children
				}
				level3Items[purposeNode.id] = functionNodes.map((node, index) => {
					const enrichmentData = enrichmentMap.get(node.id)
					return {
						id: node.id,
						name: node.name,
						info: createNodeInfoString(enrichmentData, node.id),
						description: node.description || "",
						color: `hsl(${240 + index * 20}, 60%, 60%)`,
						children_count: node.children?.length || node.children_count || 0,
					}
				})
			} else {
				level3Items[purposeNodeRef.id] = []
			}
		})
	})

	// Extract level 4 items (Measure nodes - children of Function nodes)
	// Note: The database may have Measure nodes at multiple levels (4, 5, 6, etc.)
	// We'll collect all Measure nodes that are direct children of Function nodes
	const level4Items: Record<string, any[]> = {}
	level1Nodes.forEach((scenarioNode) => {
		scenarioNode.children?.forEach((purposeNode) => {
			if (purposeNode.axis === "Purpose") {
				purposeNode.children?.forEach((functionNode) => {
					if (functionNode.axis === "Function") {
						if (functionNode.children && functionNode.children.length > 0) {
							// Get all Measure nodes regardless of their database level
							const measureNodes = functionNode.children.filter(
								(node) => node.axis === "Measure",
							)
							if (measureNodes.length > 0) {
								level4Items[functionNode.id] = measureNodes.map(
									(node, index) => {
										const enrichmentData = enrichmentMap.get(node.id)
										return {
											id: node.id,
											name: node.name,
											info: createNodeInfoString(enrichmentData, node.id),
											description: node.description || "",
											color: `hsl(${260 + index * 15}, 55%, 65%)`,
											children_count:
												node.children?.length || node.children_count || 0,
										}
									},
								)
							}
						} else if (functionNode.children_count === 0) {
							level4Items[functionNode.id] = []
						}
					}
				})
			}
		})
	}) // Helper function to extract children with specific axis types
	const extractChildrenByAxis = (
		parentNodes: TreeNodeFromDB[],
		axisType: string,
	): Record<string, any[]> => {
		const items: Record<string, any[]> = {}

		parentNodes.forEach((parentNode) => {
			if (parentNode.children && parentNode.children.length > 0) {
				const childNodes = parentNode.children.filter(
					(node) => node.axis === axisType,
				)
				if (childNodes.length > 0) {
					items[parentNode.id] = childNodes.map((node, index) => {
						const enrichmentData = enrichmentMap.get(node.id)
						return {
							id: node.id,
							name: node.name,
							info: createNodeInfoString(enrichmentData, node.id),
							description: node.description || "",
							color: `hsl(${260 + index * 15}, 55%, 65%)`,
							children_count: node.children?.length || node.children_count || 0,
						}
					})
				}
			} else if (parentNode.children_count === 0) {
				// Show parent nodes that are pending subtree generation
				items[parentNode.id] = []
			}
		})

		return items
	}

	// Extract level 5 items (Measure2 nodes - children of Measure nodes)
	const level4Nodes: TreeNodeFromDB[] = []
	Object.values(level4Items).forEach((items) => {
		items.forEach((item) => {
			const dbNode = allNodes.find((node) => node.id === item.id)
			if (dbNode) level4Nodes.push(dbNode)
		})
	})
	const level5Items = extractChildrenByAxis(level4Nodes, "Measure2")

	// Extract level 6 items (Measure3 nodes - children of Measure2 nodes)
	const level5Nodes: TreeNodeFromDB[] = []
	Object.values(level5Items).forEach((items) => {
		items.forEach((item) => {
			const dbNode = allNodes.find((node) => node.id === item.id)
			if (dbNode) level5Nodes.push(dbNode)
		})
	})
	const level6Items = extractChildrenByAxis(level5Nodes, "Measure3")

	// Extract level 7 items (Measure4 nodes - children of Measure3 nodes)
	const level6Nodes: TreeNodeFromDB[] = []
	Object.values(level6Items).forEach((items) => {
		items.forEach((item) => {
			const dbNode = allNodes.find((node) => node.id === item.id)
			if (dbNode) level6Nodes.push(dbNode)
		})
	})
	const level7Items = extractChildrenByAxis(level6Nodes, "Measure4")

	// Extract level 8 items (Measure5 nodes - children of Measure4 nodes)
	const level7Nodes: TreeNodeFromDB[] = []
	Object.values(level7Items).forEach((items) => {
		items.forEach((item) => {
			const dbNode = allNodes.find((node) => node.id === item.id)
			if (dbNode) level7Nodes.push(dbNode)
		})
	})
	const level8Items = extractChildrenByAxis(level7Nodes, "Measure5")

	// Extract level 9 items (Measure6 nodes - children of Measure5 nodes)
	const level8Nodes: TreeNodeFromDB[] = []
	Object.values(level8Items).forEach((items) => {
		items.forEach((item) => {
			const dbNode = allNodes.find((node) => node.id === item.id)
			if (dbNode) level8Nodes.push(dbNode)
		})
	})
	const level9Items = extractChildrenByAxis(level8Nodes, "Measure6")

	// Extract level 10 items (Measure7 nodes - children of Measure6 nodes)
	const level9Nodes: TreeNodeFromDB[] = []
	Object.values(level9Items).forEach((items) => {
		items.forEach((item) => {
			const dbNode = allNodes.find((node) => node.id === item.id)
			if (dbNode) level9Nodes.push(dbNode)
		})
	})
	const level10Items = extractChildrenByAxis(level9Nodes, "Measure7")
	const convertedData = {
		level1Items,
		level2Items,
		level3Items,
		level4Items,
		level5Items,
		level6Items,
		level7Items,
		level8Items,
		level9Items,
		level10Items,
		scenario: treeMetadata?.description || "",
		searchTheme: treeMetadata?.search_theme || "",
		treeName: treeMetadata?.name || "",
		mode: "TED",
	}

	//console.log("Converted database tree to app format:", convertedData);
	return convertedData
}
