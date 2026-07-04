import * as d3 from "d3"
import type { TreeNode } from "@/types/tree"
import type { MindMapConnection, MindMapNode, PathState } from "@/types/ui"

export type { MindMapConnection, MindMapNode } from "@/types/ui"

// Margin constants for better spacing
const MARGIN_TOP = 200 // Increased from 50 to 200 to position root node lower
const MARGIN_LEFT = 50 // Reduced from 300 to 50 to move root node to the LEFT side of canvas

type SelectedPath = Partial<PathState>

interface HierarchicalNode {
	id: string
	name: string
	description: string
	level: number
	levelName: string
	isSelected: boolean
	isCustom: boolean
	children_count?: number
	trl?: number
	children: HierarchicalNode[]
}

const findLastSelectedNode = (selectedPath: SelectedPath) => {
	// Add null safety check
	if (!selectedPath) return null

	if (selectedPath.level10) return { id: selectedPath.level10, level: 10 }
	if (selectedPath.level9) return { id: selectedPath.level9, level: 9 }
	if (selectedPath.level8) return { id: selectedPath.level8, level: 8 }
	if (selectedPath.level7) return { id: selectedPath.level7, level: 7 }
	if (selectedPath.level6) return { id: selectedPath.level6, level: 6 }
	if (selectedPath.level5) return { id: selectedPath.level5, level: 5 }
	if (selectedPath.level4) return { id: selectedPath.level4, level: 4 }
	if (selectedPath.level3) return { id: selectedPath.level3, level: 3 }
	if (selectedPath.level2) return { id: selectedPath.level2, level: 2 }
	if (selectedPath.level1) return { id: selectedPath.level1, level: 1 }
	return null
}

// ノードが展開されているかどうかを確認
const isNodeExpanded = (
	nodeId: string,
	expandedNodes?: Set<string>,
): boolean => {
	// expandedNodesが未定義の場合はrootとlevel1ノードを展開する（初期化前の状態）
	if (!expandedNodes) return nodeId === "root"

	// expandedNodesが空の場合はrootのみ展開された状態とする
	if (expandedNodes.size === 0) {
		return nodeId === "root"
	}

	// 通常の展開状態チェック
	return expandedNodes.has(nodeId)
}

// ノードデータを作成
const createHierarchicalNode = (
	item: TreeNode,
	level: number,
	levelName: string,
	lastSelectedNode: { id: string; level: number } | null,
	selectedNodeForHighlight?: string | null,
): HierarchicalNode => {
	// Check if this node is selected either by path navigation or by insight card click
	const isSelectedByPath =
		lastSelectedNode?.id === item.id && lastSelectedNode?.level === level
	const isSelectedByHighlight = selectedNodeForHighlight === item.id

	return {
		id: item.id,
		name: item.name,
		description: item.description || "",
		level,
		levelName,
		isSelected: isSelectedByPath || isSelectedByHighlight,
		isCustom: item.isCustom || false,
		children_count: item.children_count,
		trl: item.trl,
		children: [],
	}
}

// ノードデータを階層化する
const buildHierarchyWithExpandState = (
	level1Items: TreeNode[],
	level2Items: Record<string, TreeNode[]>,
	level3Items: Record<string, TreeNode[]>,
	level4Items: Record<string, TreeNode[]>,
	level5Items: Record<string, TreeNode[]>,
	level6Items: Record<string, TreeNode[]>,
	level7Items: Record<string, TreeNode[]>,
	level8Items: Record<string, TreeNode[]>,
	level9Items: Record<string, TreeNode[]>,
	level10Items: Record<string, TreeNode[]>,
	levelNames: Record<string, string>,
	selectedPath: SelectedPath,
	query: string,
	expandedNodes?: Set<string>,
	selectedNodeForHighlight?: string | null,
): HierarchicalNode => {
	// レベルごとのノードデータを作成
	const allLevelItems = [
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
	]

	const lastSelectedNode = findLastSelectedNode(selectedPath)

	// ルートノードを作成
	const hierarchy: HierarchicalNode = {
		id: "root",
		name: query || "Research Query",
		description: "Your research query",
		level: 0,
		levelName: "Query",
		isSelected: false,
		isCustom: false,
		children: [],
	}

	// ノードデータを階層化する
	const buildLevelRecursively = (
		parentNode: HierarchicalNode,
		parentId: string,
		currentLevel: number,
	): void => {
		// 最大レベルを超えたら終了
		if (currentLevel > 10) return

		// 現在のレベルのノードデータを取得
		const currentLevelData = allLevelItems[currentLevel - 1]
		let itemsForParent: TreeNode[] = []

		if (currentLevel === 1) {
			if (isNodeExpanded("root", expandedNodes)) {
				itemsForParent = currentLevelData as TreeNode[]
			} else {
				itemsForParent = [] // rootがcollapseされている場合は子ノードを表示しない
			}
		} else {
			// level 2+のノードデータは親ノードのIDで取得
			const levelItemsRecord = currentLevelData as Record<string, TreeNode[]>
			itemsForParent = levelItemsRecord[parentId] || []
		}

		// 現在のレベルのノードデータを処理
		itemsForParent.forEach((item) => {
			const levelName =
				levelNames[`level${currentLevel}`] || `Level ${currentLevel}`
			const childNode = createHierarchicalNode(
				item,
				currentLevel,
				levelName,
				lastSelectedNode,
				selectedNodeForHighlight,
			)

			// そのノードが展開されている場合のみ子ノードを追加
			if (isNodeExpanded(item.id, expandedNodes)) {
				buildLevelRecursively(childNode, item.id, currentLevel + 1)
			}

			parentNode.children.push(childNode)
		})
	}

	// level 1からノードデータを階層化
	buildLevelRecursively(hierarchy, "root", 1)

	return hierarchy
}

// 元データで子ノードがあるかどうかを確認する
const hasChildrenInOriginalHierarchy = (
	nodeId: string,
	originalHierarchy: HierarchicalNode,
): boolean => {
	const findNodeAndCheckChildren = (
		node: HierarchicalNode,
	): boolean | undefined => {
		if (node.id === nodeId) {
			return node.children && node.children.length > 0
		}

		for (const child of node.children || []) {
			const result = findNodeAndCheckChildren(child)
			if (result !== undefined) {
				return result
			}
		}

		return undefined
	}

	const result = findNodeAndCheckChildren(originalHierarchy)
	return result === true
}

// 元データでの総子ノード数をカウントする
const countTotalChildrenInOriginalHierarchy = (
	nodeId: string,
	originalHierarchy: HierarchicalNode,
): number => {
	const findNodeAndCountChildren = (
		node: HierarchicalNode,
	): number | undefined => {
		if (node.id === nodeId) {
			const countDescendants = (n: HierarchicalNode): number => {
				let count = n.children ? n.children.length : 0
				if (n.children) {
					for (const child of n.children) {
						count += countDescendants(child)
					}
				}
				return count
			}
			return countDescendants(node)
		}

		for (const child of node.children || []) {
			const result = findNodeAndCountChildren(child)
			if (result !== undefined) {
				return result
			}
		}

		return undefined
	}

	const result = findNodeAndCountChildren(originalHierarchy)
	return result || 0
}

// Helper function to create D3 nodes from hierarchical data
const createD3Nodes = (
	hierarchicalData: HierarchicalNode,
	layoutDirection: "horizontal" | "vertical" = "horizontal",
	originalHierarchy?: HierarchicalNode,
	expandedNodes?: Set<string>,
): MindMapNode[] => {
	const root = d3.hierarchy(hierarchicalData)

	// 初期化時（expandedNodesがundefined）は空配列を返し、全てのノードをexpandする
	if (
		!expandedNodes &&
		(!hierarchicalData.children || hierarchicalData.children.length === 0)
	) {
		return []
	}

	// rootノードがcollapseされている場合でも、rootノード自体は表示する
	if (!hierarchicalData.children || hierarchicalData.children.length === 0) {
		// rootノードのみを返す
		return [
			{
				id: hierarchicalData.id,
				name: hierarchicalData.name,
				description: hierarchicalData.description,
				level: hierarchicalData.level,
				levelName: hierarchicalData.levelName,
				x: MARGIN_LEFT,
				y: MARGIN_TOP,
				parentId: undefined,
				isSelected: hierarchicalData.isSelected,
				isCustom: hierarchicalData.isCustom,
				children_count: hierarchicalData.children_count,
				hasChildren: false,
				hasChildrenInOriginalData: originalHierarchy
					? hasChildrenInOriginalHierarchy(
							hierarchicalData.id,
							originalHierarchy,
						)
					: hierarchicalData.children && hierarchicalData.children.length > 0,
				isExpanded: isNodeExpanded(hierarchicalData.id, expandedNodes),
				totalChildrenCount: originalHierarchy
					? countTotalChildrenInOriginalHierarchy(
							hierarchicalData.id,
							originalHierarchy,
						)
					: hierarchicalData.children
						? hierarchicalData.children.length
						: 0,
			},
		]
	}

	if (layoutDirection === "horizontal") {
		// KEEP EXACTLY AS IS - don't change anything for horizontal layout
		const treeLayout = d3
			.tree()
			.nodeSize([50, 400]) // Keep current nodeSize for good horizontal spacing
			.separation((_a, _b) => {
				// Keep tight spacing for level 1 nodes (children of root)
				return 3
			})

		treeLayout(root as any)

		// Include ALL nodes including the root (depth 0) - KEEP current horizontal logic unchanged
		return root.descendants().map((node) => ({
			id: node.data.id,
			name: node.data.name,
			description: node.data.description,
			level: node.data.level,
			levelName: node.data.levelName,
			x: (node.y ?? 0) + MARGIN_LEFT, // Keep current horizontal logic
			y: (node.x ?? 0) + MARGIN_TOP, // Keep current horizontal logic
			parentId: node.parent ? node.parent.data.id : undefined,
			isSelected: node.data.isSelected,
			isCustom: node.data.isCustom,
			children_count: node.data.children_count,
			trl: node.data.trl,
			hasChildren: node.children && node.children.length > 0,
			hasChildrenInOriginalData: originalHierarchy
				? hasChildrenInOriginalHierarchy(node.data.id, originalHierarchy)
				: node.children && node.children.length > 0,
			isExpanded: isNodeExpanded(node.data.id, expandedNodes),
			totalChildrenCount: originalHierarchy
				? countTotalChildrenInOriginalHierarchy(node.data.id, originalHierarchy)
				: node.children
					? node.children.length
					: 0,
		}))
	} else {
		// IMPROVED vertical layout - increased spacing to prevent overlaps
		const treeLayout = d3
			.tree()
			.nodeSize([150, 200])
			.separation((_a, _b) => {
				// Level 1 nodes (children of root) - prevent overlap
				return 3
			})

		treeLayout(root as any)

		// NEW vertical coordinate mapping
		return root.descendants().map((node) => ({
			id: node.data.id,
			name: node.data.name,
			description: node.data.description,
			level: node.data.level,
			levelName: node.data.levelName,
			x: (node.x ?? 0) + MARGIN_LEFT,
			y: (node.y ?? 0) + MARGIN_TOP,
			parentId: node.parent ? node.parent.data.id : undefined,
			isSelected: node.data.isSelected,
			isCustom: node.data.isCustom,
			children_count: node.data.children_count,
			trl: node.data.trl,
			hasChildren: node.children && node.children.length > 0,
			hasChildrenInOriginalData: originalHierarchy
				? hasChildrenInOriginalHierarchy(node.data.id, originalHierarchy)
				: node.children && node.children.length > 0,
			isExpanded: isNodeExpanded(node.data.id, expandedNodes),
			totalChildrenCount: originalHierarchy
				? countTotalChildrenInOriginalHierarchy(node.data.id, originalHierarchy)
				: node.children
					? node.children.length
					: 0,
		}))
	}
}

// Helper function to create connections from D3 hierarchy
const createD3Connections = (
	hierarchicalData: HierarchicalNode,
	layoutDirection: "horizontal" | "vertical" = "horizontal",
): MindMapConnection[] => {
	if (!hierarchicalData.children || hierarchicalData.children.length === 0) {
		return []
	}

	const root = d3.hierarchy(hierarchicalData)

	if (layoutDirection === "horizontal") {
		// KEEP ALL CURRENT CONNECTION LOGIC UNCHANGED for horizontal
		const treeLayout = d3
			.tree()
			.nodeSize([50, 400]) // Keep current nodeSize for good horizontal spacing
			.separation((_a, _b) => {
				// Keep tight spacing for level 1 nodes (children of root)
				return 3
			})

		treeLayout(root as any)

		const connections: MindMapConnection[] = []

		// Include ALL connections including from root - KEEP existing logic
		root.links().forEach((link) => {
			const sourceNodeWidth = 280
			const sourceNodeHeight = 100
			const targetNodeHeight = 100

			// Calculate connection points with proper centering - KEEP existing logic
			const sourceX = (link.source.y ?? 0) + MARGIN_LEFT + sourceNodeWidth // Use new left margin
			const sourceY = (link.source.x ?? 0) + MARGIN_TOP + sourceNodeHeight / 2 // Use correct height for centering
			const targetX = (link.target.y ?? 0) + MARGIN_LEFT // Use new left margin
			const targetY = (link.target.x ?? 0) + MARGIN_TOP + targetNodeHeight / 2 // Use correct target height

			connections.push({
				id: `${link.source.data.id}-${link.target.data.id}`,
				sourceId: link.source.data.id,
				targetId: link.target.data.id,
				sourceX,
				sourceY,
				targetX,
				targetY,
			})
		})

		return connections
	} else {
		// IMPROVED vertical connection logic with better spacing
		const treeLayout = d3
			.tree()
			.nodeSize([150, 200])
			.separation((_a, _b) => {
				return 3
			})

		treeLayout(root as any)

		const connections: MindMapConnection[] = []

		// NEW vertical connections - layout-aware dimensions
		root.links().forEach((link) => {
			const sourceNodeWidth = 260 // 縦方向のレイアウトの幅（matches getNodeWidth）
			const sourceNodeHeight = 90
			const targetNodeWidth = 260

			// Bottom edge of source to top edge of target
			const sourceX = (link.source.x ?? 0) + MARGIN_LEFT + sourceNodeWidth / 2 // Center horizontally
			const sourceY = (link.source.y ?? 0) + MARGIN_TOP + sourceNodeHeight // Bottom edge
			const targetX = (link.target.x ?? 0) + MARGIN_LEFT + targetNodeWidth / 2 // Center horizontally
			const targetY = (link.target.y ?? 0) + MARGIN_TOP // Top edge

			connections.push({
				id: `${link.source.data.id}-${link.target.data.id}`,
				sourceId: link.source.data.id,
				targetId: link.target.data.id,
				sourceX,
				sourceY,
				targetX,
				targetY,
			})
		})

		return connections
	}
}

export const transformToMindMapData = (
	level1Items: TreeNode[],
	level2Items: Record<string, TreeNode[]>,
	level3Items: Record<string, TreeNode[]>,
	level4Items: Record<string, TreeNode[]>,
	level5Items: Record<string, TreeNode[]>,
	level6Items: Record<string, TreeNode[]>,
	level7Items: Record<string, TreeNode[]>,
	level8Items: Record<string, TreeNode[]>,
	level9Items: Record<string, TreeNode[]>,
	level10Items: Record<string, TreeNode[]>,
	levelNames: Record<string, string>,
	selectedPath: SelectedPath,
	query: string = "Research Query",
	layoutDirection: "horizontal" | "vertical" = "horizontal",
	expandedNodes?: Set<string>,
	selectedNodeForHighlight?: string | null,
) => {
	const originalHierarchicalData = buildHierarchyWithExpandState(
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
		levelNames,
		selectedPath,
		query,
		undefined, // 展開状態を取得しない（展開状態はexpandedNodesで取得する）
		selectedNodeForHighlight,
	)

	// Build filtered hierarchical data structure with expand state
	// デフォルトで全展開：expandedNodesがundefinedまたは空の場合はundefinedを渡す
	const effectiveExpandedNodes =
		!expandedNodes || expandedNodes.size === 0 ? undefined : expandedNodes

	const hierarchicalData = buildHierarchyWithExpandState(
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
		levelNames,
		selectedPath,
		query,
		effectiveExpandedNodes,
		selectedNodeForHighlight,
	)

	// Create nodes and connections using D3 tree layout with layout direction
	const nodes = createD3Nodes(
		hierarchicalData,
		layoutDirection,
		originalHierarchicalData,
		effectiveExpandedNodes,
	)
	const connections = createD3Connections(hierarchicalData, layoutDirection)

	return { nodes, connections }
}
