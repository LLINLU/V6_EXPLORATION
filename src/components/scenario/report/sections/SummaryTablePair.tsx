import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { SummaryRow } from "@/types/report"

interface SummaryTablePairProps {
	marketRows: SummaryRow[]
	researchRows: SummaryRow[]
}

function MiniTable({ title, rows }: { title: string; rows: SummaryRow[] }) {
	return (
		<div className="flex-1 min-w-0">
			<h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
				{title}
			</h4>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-8 text-xs">#</TableHead>
						<TableHead className="text-xs">項目</TableHead>
						<TableHead className="text-xs text-right">値</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={row.index}>
							<TableCell className="text-xs text-gray-400">
								{row.index}
							</TableCell>
							<TableCell className="text-xs font-medium">{row.label}</TableCell>
							<TableCell className="text-xs text-right">{row.value}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}

export function SummaryTablePair({
	marketRows,
	researchRows,
}: SummaryTablePairProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<MiniTable title="市場・顧客" rows={marketRows} />
			<MiniTable title="研究・技術" rows={researchRows} />
		</div>
	)
}
