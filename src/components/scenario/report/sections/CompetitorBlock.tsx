import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { TechnicalCompetitorData } from "@/types/report"

interface CompetitorBlockProps {
	data: TechnicalCompetitorData
	index: number
}

export function CompetitorBlock({ data, index }: CompetitorBlockProps) {
	return (
		<div className="border border-gray-200 rounded-lg p-4">
			<div className="flex items-center gap-2 mb-2">
				<span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
					{index + 1}
				</span>
				<h4 className="text-sm font-semibold text-gray-800">
					{data.technology_name}
					{data.technology_name_ja && (
						<span className="text-gray-400 ml-1 font-normal">
							({data.technology_name_ja})
						</span>
					)}
				</h4>
			</div>

			<p className="text-xs text-gray-500 mb-3">
				ユニーク企業: {data.unique_companies} | 分析対象:{" "}
				{data.analyzed_companies}
			</p>

			{data.competitors.length > 0 && (
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-xs w-10">順位</TableHead>
								<TableHead className="text-xs">企業名</TableHead>
								<TableHead className="text-xs">国</TableHead>
								<TableHead className="text-xs text-right">特許数</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.competitors.map((c) => (
								<TableRow key={`${c.rank}-${c.company_name}`}>
									<TableCell className="text-xs text-gray-400">
										{c.rank}
									</TableCell>
									<TableCell className="text-xs font-medium">
										{c.company_name}
									</TableCell>
									<TableCell className="text-xs">{c.country}</TableCell>
									<TableCell className="text-xs text-right">
										{c.patent_count}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	)
}
