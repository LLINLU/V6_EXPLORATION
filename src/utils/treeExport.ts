import type { TreeNode } from "@/types/tree"

type LevelItems = Record<string, TreeNode[]>

interface FlatRow {
	n1: string
	d1: string
	n2: string
	d2: string
	n3: string
	d3: string
	n4: string
	d4: string
	n5: string
	d5: string
}

function buildRows(
	node: TreeNode,
	depth: number,
	path: TreeNode[],
	levelItems: LevelItems[],
	rows: Partial<FlatRow>[],
) {
	const currentPath = [...path, node]
	const children =
		depth < levelItems.length ? (levelItems[depth][node.id] ?? []) : []

	if (children.length === 0 || depth >= levelItems.length) {
		const row: Partial<FlatRow> = {}
		currentPath.forEach((n, i) => {
			if (i === 0) {
				row.n1 = n.name
				row.d1 = n.description ?? ""
			} else if (i === 1) {
				row.n2 = n.name
				row.d2 = n.description ?? ""
			} else if (i === 2) {
				row.n3 = n.name
				row.d3 = n.description ?? ""
			} else if (i === 3) {
				row.n4 = n.name
				row.d4 = n.description ?? ""
			} else if (i === 4) {
				row.n5 = n.name
				row.d5 = n.description ?? ""
			}
		})
		rows.push(row)
	} else {
		for (const child of children) {
			buildRows(child, depth + 1, currentPath, levelItems, rows)
		}
	}
}

function csvEscape(cell: string): string {
	const s = String(cell).replace(/"/g, '""')
	return s.search(/("|,|\n)/g) >= 0 ? `"${s}"` : s
}

export interface TreeExportLabels {
	query: string
	techElement: (n: number) => string
	description: string
}

export function exportTreeToCsv(
	query: string,
	level1Items: TreeNode[],
	level2Items: LevelItems,
	level3Items: LevelItems,
	level4Items: LevelItems,
	level5Items: LevelItems,
	labels: TreeExportLabels,
): void {
	const rows: Partial<FlatRow>[] = []
	const levelItems: LevelItems[] = [
		level2Items,
		level3Items,
		level4Items,
		level5Items,
	]

	for (const node of level1Items) {
		buildRows(node, 0, [], levelItems, rows)
	}

	if (rows.length === 0) return

	const d = labels.description
	const headers = [
		labels.query,
		labels.techElement(1),
		d,
		labels.techElement(2),
		d,
		labels.techElement(3),
		d,
		labels.techElement(4),
		d,
		labels.techElement(5),
		d,
	]

	const dataLines = rows.map((r) =>
		[
			query,
			r.n1 ?? "",
			r.d1 ?? "",
			r.n2 ?? "",
			r.d2 ?? "",
			r.n3 ?? "",
			r.d3 ?? "",
			r.n4 ?? "",
			r.d4 ?? "",
			r.n5 ?? "",
			r.d5 ?? "",
		]
			.map(csvEscape)
			.join(","),
	)

	const csvContent = [headers.join(","), ...dataLines].join("\n")
	const blob = new Blob([`﻿${csvContent}`], { type: "text/csv;charset=utf-8;" })
	const link = document.createElement("a")
	const url = URL.createObjectURL(blob)
	link.setAttribute("href", url)
	const date = new Date().toISOString().split("T")[0]
	const safeQuery = (query || "tree").replace(/[\\/:*?"<>|]/g, "_").slice(0, 40)
	link.setAttribute("download", `${safeQuery}_技術要素_${date}.csv`)
	link.style.visibility = "hidden"
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}
