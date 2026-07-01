import type React from "react"
import type { MindMapConnection } from "@/utils/mindMapDataTransform"

interface MindMapConnectionsProps {
	connections: MindMapConnection[]
	layoutDirection: "horizontal" | "vertical"
	selectedNodeId?: string
}

export const MindMapConnections: React.FC<MindMapConnectionsProps> = ({
	connections,
	layoutDirection,
	selectedNodeId,
}) => {
	const createCurvedPath = (connection: MindMapConnection): string => {
		const { sourceX, sourceY, targetX, targetY } = connection

		if (layoutDirection === "horizontal") {
			// KEEP existing curved path logic unchanged for horizontal
			const midX = sourceX + (targetX - sourceX) / 2

			// Create a smooth bezier curve similar to D3 tree layouts
			return `M ${sourceX} ${sourceY} C ${midX} ${sourceY} ${midX} ${targetY} ${targetX} ${targetY}`
		} else {
			// NEW vertical curve logic only
			const midY = sourceY + (targetY - sourceY) / 2

			// Create vertical bezier curve
			return `M ${sourceX} ${sourceY} C ${sourceX} ${midY} ${targetX} ${midY} ${targetX} ${targetY}`
		}
	}

	// 選択されたノードの全ての子孫を見つける関数
	const findAllDescendants = (
		nodeId: string,
		connections: MindMapConnection[],
	): Set<string> => {
		const descendants = new Set<string>()
		const queue = [nodeId]

		while (queue.length > 0) {
			const currentNode = queue.shift()!

			// 現在のノードの直接の子を見つける
			connections.forEach((connection) => {
				if (connection.sourceId === currentNode) {
					const childId = connection.targetId
					if (!descendants.has(childId)) {
						descendants.add(childId)
						queue.push(childId) // 孫以降も探すためにキューに追加
					}
				}
			})
		}

		return descendants
	}

	// 選択されたノードの全ての先祖を見つける関数
	const findAllAncestors = (
		nodeId: string,
		connections: MindMapConnection[],
	): Set<string> => {
		const ancestors = new Set<string>()
		const queue = [nodeId]

		while (queue.length > 0) {
			const currentNode = queue.shift()!

			// 現在のノードの直接の親を見つける
			connections.forEach((connection) => {
				if (connection.targetId === currentNode) {
					const parentId = connection.sourceId
					if (!ancestors.has(parentId)) {
						ancestors.add(parentId)
						queue.push(parentId)
					}
				}
			})
		}

		return ancestors
	}

	// 選択されたノードの子孫と先祖を事前に計算してキャッシュ
	const descendants = selectedNodeId
		? findAllDescendants(selectedNodeId, connections)
		: new Set<string>()
	const ancestors = selectedNodeId
		? findAllAncestors(selectedNodeId, connections)
		: new Set<string>()

	// 選択されたノードの兄弟ノードとその子孫を見つける関数
	const findSiblingDescendants = (
		selectedNodeId: string,
		connections: MindMapConnection[],
	): Set<string> => {
		const siblingDescendants = new Set<string>()

		// 選択されたノードの直接の親を見つける
		const selectedNodeParent = connections.find(
			(conn) => conn.targetId === selectedNodeId,
		)?.sourceId

		if (!selectedNodeParent) return siblingDescendants

		// 親の直接の子ノード（兄弟ノード）を見つける
		const siblingNodes = connections
			.filter(
				(conn) =>
					conn.sourceId === selectedNodeParent &&
					conn.targetId !== selectedNodeId,
			)
			.map((conn) => conn.targetId)

		// 各兄弟ノードとその子孫を追加
		siblingNodes.forEach((siblingId) => {
			siblingDescendants.add(siblingId)
			const descendants = findAllDescendants(siblingId, connections)
			descendants.forEach((desc) => siblingDescendants.add(desc))
		})

		return siblingDescendants
	}

	// 選択されたノードの親から繋がっているエッジかどうかを判定する関数
	const isParentEdge = (connection: MindMapConnection): boolean => {
		if (!selectedNodeId) return false

		// 選択されたノードの直接の親を見つける
		const selectedNodeParent = connections.find(
			(conn) => conn.targetId === selectedNodeId,
		)?.sourceId

		if (!selectedNodeParent) return false

		// 兄弟ノードとその子孫を取得
		const siblingDescendants = findSiblingDescendants(
			selectedNodeId,
			connections,
		)

		// 以下のエッジをライトブルーにする：
		// 1. 親から出ているすべてのエッジ
		// 2. 兄弟ノードから出ているエッジ
		// 3. 兄弟ノードの子孫から出ているエッジ
		return (
			connection.sourceId === selectedNodeParent ||
			siblingDescendants.has(connection.sourceId)
		)
	}

	// 通常の選択ハイライト（ブルー）
	const isHighlightedEdge = (connection: MindMapConnection): boolean => {
		if (!selectedNodeId) return false

		return (
			// 選択されたノードから子孫へのエッジ
			(connection.sourceId === selectedNodeId &&
				descendants.has(connection.targetId)) ||
			// 先祖から選択されたノードへのエッジ
			(ancestors.has(connection.sourceId) &&
				(ancestors.has(connection.targetId) ||
					connection.targetId === selectedNodeId)) ||
			// 選択されたノードの子孫間のエッジ
			(descendants.has(connection.sourceId) &&
				descendants.has(connection.targetId))
		)
	}

	return (
		<svg
			className="absolute top-0 left-0 pointer-events-none"
			style={{
				width: "100%",
				height: "100%",
				overflow: "visible",
			}}
		>
			{connections.map((connection) => {
				const isHighlighted = isHighlightedEdge(connection)
				const isParent = isParentEdge(connection)

				// Determine color: regular highlight (blue) > parent edge (light blue) > default (gray)
				let strokeColor = "#64748b" // Default gray
				let strokeWidth = "2"
				let opacity = "0.6"
				let filter = "none"

				if (isHighlighted) {
					// Selected node path highlighting (blue)
					strokeColor = "#2563EB"
					strokeWidth = "3"
					opacity = "0.9"
					filter = "drop-shadow(0 0 4px rgba(37, 99, 235, 0.3))"
				} else if (isParent) {
					// Parent edges highlighting (light blue)
					strokeColor = "#60A5FA"
					strokeWidth = "2"
					opacity = "0.8"
				}

				return (
					<path
						key={connection.id}
						d={createCurvedPath(connection)}
						stroke={strokeColor}
						strokeWidth={strokeWidth}
						fill="none"
						opacity={opacity}
						className="transition-all duration-200"
						style={{ filter }}
					/>
				)
			})}
		</svg>
	)
}
