import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { MarketImpl } from "@/types/report"

interface ImplTableProps {
	items: MarketImpl[]
}

export function ImplTable({ items }: ImplTableProps) {
	if (items.length === 0) {
		return (
			<p className="text-xs text-gray-400 py-4 text-center">
				市場実装事例データがありません
			</p>
		)
	}

	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="text-xs w-8">#</TableHead>
						<TableHead className="text-xs">製品</TableHead>
						<TableHead className="text-xs">企業</TableHead>
						<TableHead className="text-xs w-16">ステージ</TableHead>
						<TableHead className="text-xs">リンク</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((item, i) => (
						<TableRow key={`${item.product}-${i}`}>
							<TableCell className="text-xs text-gray-400">{i + 1}</TableCell>
							<TableCell className="text-xs font-medium">
								{item.product}
							</TableCell>
							<TableCell className="text-xs">{item.company}</TableCell>
							<TableCell className="text-xs">
								<span
									className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
										item.stage === "commercial"
											? "bg-green-100 text-green-700"
											: "bg-blue-100 text-blue-700"
									}`}
								>
									{item.stage === "commercial" ? "商用" : "R&D"}
								</span>
							</TableCell>
							<TableCell className="text-xs">
								{(item.press_releases ?? item.urls ?? []).map((url, ui) => (
									<a
										key={ui}
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-500 hover:underline mr-2"
									>
										[{ui + 1}]
									</a>
								))}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
