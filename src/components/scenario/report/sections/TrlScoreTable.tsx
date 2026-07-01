import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { SourceDetail, TechnologyScore } from "@/types/report"
import { COLORS } from "../charts/chartConfig"

interface TrlScoreTableProps {
	scores: TechnologyScore[]
}

const SOURCE_LABELS: Record<string, string> = {
	article: "論文",
	patent: "特許",
	market: "市場",
}

function _ReasoningContent({
	detail,
	source,
	value,
}: {
	detail: SourceDetail | undefined
	source: string
	value: number | null
}) {
	return (
		<div>
			<div className="flex items-center gap-2 mb-2">
				<span className="text-xs font-semibold text-blue-600">
					{SOURCE_LABELS[source] ?? source} TRL 導出根拠
				</span>
			</div>
			<div className="text-xs text-gray-600 mb-2">
				<span className="font-medium">スコア: </span>
				{detail?.trl_score ?? value ?? "—"}
			</div>
			{detail?.reasoning ? (
				<p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
					{detail.reasoning}
				</p>
			) : (
				<p className="text-xs text-gray-400 italic">根拠情報なし</p>
			)}
			{detail?.item_count != null && (
				<div className="mt-2 text-[10px] text-gray-400">
					参照ソース数: {detail.item_count}
				</div>
			)}
		</div>
	)
}

function TrlCellWithPopover({
	value,
	detail,
	source,
}: {
	value: number | null
	detail: SourceDetail | undefined
	source: string
}) {
	// Always show popover if we have a value or detail
	const hasContent = value !== null || detail != null

	if (!hasContent) {
		return <span className="text-gray-300">—</span>
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="underline decoration-dotted underline-offset-2 cursor-pointer hover:text-blue-600"
				>
					{value ?? "—"}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-80" side="bottom" align="center">
				{/*<ReasoningContent detail={detail} source={source} value={value} />*/}
			</PopoverContent>
		</Popover>
	)
}

export function TrlScoreTable({ scores }: TrlScoreTableProps) {
	return (
		<div className="mb-4">
			<h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
				技術別TRLスコア
			</h4>
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="text-xs">技術名</TableHead>
							<TableHead className="text-xs text-center">統合TRL</TableHead>
							<TableHead className="text-xs text-center">論文</TableHead>
							<TableHead className="text-xs text-center">特許</TableHead>
							<TableHead className="text-xs text-center">市場</TableHead>
							<TableHead className="text-xs text-center">分類</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{scores.map((s) => (
							<TableRow key={s.technology_name}>
								<TableCell className="text-xs font-medium">
									{s.technology_name}
								</TableCell>
								<TableCell className="text-xs text-center font-bold">
									{s.integrated_trl}
								</TableCell>
								<TableCell className="text-xs text-center">
									<TrlCellWithPopover
										value={s.article_trl}
										source="article"
										detail={s.sourceDetails.find((d) => d.source === "article")}
									/>
								</TableCell>
								<TableCell className="text-xs text-center">
									<TrlCellWithPopover
										value={s.patent_trl}
										source="patent"
										detail={s.sourceDetails.find((d) => d.source === "patent")}
									/>
								</TableCell>
								<TableCell className="text-xs text-center">
									<TrlCellWithPopover
										value={s.market_trl}
										source="market"
										detail={s.sourceDetails.find((d) => d.source === "market")}
									/>
								</TableCell>
								<TableCell className="text-xs text-center">
									<span
										className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
										style={{
											backgroundColor:
												s.category === "bottleneck"
													? COLORS.bottleneck
													: COLORS.feasible,
										}}
									>
										{s.category === "bottleneck" ? "ボトルネック" : "実現可能"}
									</span>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
