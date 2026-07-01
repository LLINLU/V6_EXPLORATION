/**
 * Export data to CSV file
 * Handles array fields by joining with semicolon
 * Adds BOM for proper UTF-8 encoding
 */
export function exportToCsv(filename: string, rows: object[]): void {
	if (!rows || rows.length === 0) {
		alert("エクスポートするデータがありません。")
		return
	}

	const separator = ","
	const keys = Object.keys(rows[0])
	const csvContent =
		keys.join(separator) +
		"\n" +
		rows
			.map((row) => {
				return keys
					.map((k) => {
						let cell =
							(row as any)[k] === null || (row as any)[k] === undefined
								? ""
								: (row as any)[k]
						cell = Array.isArray(cell) ? cell.join("; ") : cell
						let cellString = String(cell).replace(/"/g, '""')
						if (cellString.search(/("|,|\n)/g) >= 0) {
							cellString = `"${cellString}"`
						}
						return cellString
					})
					.join(separator)
			})
			.join("\n")

	const blob = new Blob([`\uFEFF${csvContent}`], {
		type: "text/csv;charset=utf-8;",
	})
	const link = document.createElement("a")
	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob)
		link.setAttribute("href", url)
		link.setAttribute("download", filename)
		link.style.visibility = "hidden"
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}
}
