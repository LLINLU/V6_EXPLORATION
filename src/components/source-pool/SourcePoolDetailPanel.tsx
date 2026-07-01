/**
 * Source Pool Detail Panel Component
 * Displays detailed list of papers, patents, or implementations with CSV export
 */

import { Download, X } from "lucide-react"
import type React from "react"
import { Button } from "@/components/ui/button"
import type {
	AcademicPaper,
	MarketImplementation,
	Patent,
} from "@/types/sourcePool"
import { exportToCsv } from "@/utils/csvExport"

type DetailType = "papers" | "patents" | "implementations"

interface SourcePoolDetailPanelProps {
	isOpen: boolean
	type: DetailType | null
	data: AcademicPaper[] | Patent[] | MarketImplementation[]
	query: string
	onClose: () => void
}

const titles: Record<DetailType, string> = {
	papers: "研究論文リスト",
	patents: "関連特許リスト",
	implementations: "市場実装例リスト",
}

const headers: Record<DetailType, string[]> = {
	papers: ["Year", "Title", "Authors"],
	patents: ["Year", "Title"],
	implementations: ["Year", "Name", "Summary"],
}

export const SourcePoolDetailPanel: React.FC<SourcePoolDetailPanelProps> = ({
	isOpen,
	type,
	data,
	query,
	onClose,
}) => {
	if (!isOpen || !type) return null

	const handleExport = () => {
		const simplifiedData = data.map((item) => {
			if (type === "papers") {
				const p = item as AcademicPaper
				return {
					year: p.year,
					title: p.title,
					authors: p.authors.join("; "),
					link: p.link,
				}
			}
			if (type === "patents") {
				const p = item as Patent
				return {
					year: p.year,
					title: p.title,
					link: p.link,
				}
			}
			if (type === "implementations") {
				const p = item as MarketImplementation
				return {
					year: p.year,
					name: p.name,
					summary: p.summary,
					link: p.link,
				}
			}
			return {}
		})
		exportToCsv(`${query}_${type}.csv`, simplifiedData)
	}

	const renderRow = (item: any, index: number) => {
		switch (type) {
			case "papers": {
				const paper = item as AcademicPaper
				return (
					<tr
						key={index}
						className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
					>
						<td className="px-4 py-3 text-gray-600">{paper.year || "N/A"}</td>
						<td className="px-4 py-3">
							<a
								href={paper.link}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-800 hover:underline"
							>
								{paper.title}
							</a>
						</td>
						<td className="px-4 py-3 text-gray-600">
							{paper.authors.join(", ")}
						</td>
					</tr>
				)
			}
			case "patents": {
				const patent = item as Patent
				return (
					<tr
						key={index}
						className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
					>
						<td className="px-4 py-3 text-gray-600">{patent.year || "N/A"}</td>
						<td className="px-4 py-3">
							<a
								href={patent.link}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-800 hover:underline"
							>
								{patent.title}
							</a>
						</td>
					</tr>
				)
			}
			case "implementations": {
				const impl = item as MarketImplementation
				return (
					<tr
						key={index}
						className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
					>
						<td className="px-4 py-3 text-gray-600">{impl.year || "N/A"}</td>
						<td className="px-4 py-3">
							<a
								href={impl.link}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-800 hover:underline"
							>
								{impl.name}
							</a>
						</td>
						<td className="px-4 py-3 text-gray-600">{impl.summary}</td>
					</tr>
				)
			}
			default:
				return null
		}
	}

	return (
		<div
			className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
			onClick={onClose}
		>
			<div
				className="bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-4xl h-[90vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
					<h2
						className="text-base font-medium text-gray-900"
						style={{ fontSize: "1rem", fontWeight: 500 }}
					>
						{titles[type]}
					</h2>
					<div className="flex items-center gap-2">
						<Button
							onClick={handleExport}
							variant="outline"
							size="sm"
							className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
						>
							<Download className="h-4 w-4 mr-2" />
							CSVエクスポート
						</Button>
						<Button
							onClick={onClose}
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</header>
				<main className="flex-grow overflow-y-auto">
					<table className="w-full text-sm text-left text-gray-900">
						<thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 border-b border-gray-200">
							<tr>
								{headers[type].map((h) => (
									<th key={h} scope="col" className="px-4 py-3 font-medium">
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>{data.map(renderRow)}</tbody>
					</table>
				</main>
			</div>
		</div>
	)
}
