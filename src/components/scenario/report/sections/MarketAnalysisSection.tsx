import type {
	JapanMarketData,
	MarketDerivation,
	MarketSegment,
	MarketValueDescription,
} from "@/types/report"
import { MarketDerivationCard } from "./MarketDerivationCard"
import { SegmentDonutChart } from "./SegmentDonutChart"
import { TamSamChart } from "./TamSamChart"

interface MarketAnalysisSectionProps {
	japanMarket?: JapanMarketData
	globalTam: MarketValueDescription
	globalSam: MarketValueDescription
	globalCagr: MarketValueDescription
	tamNumber: number
	samNumber: number
	segments: MarketSegment[]
	derivation: MarketDerivation
	rawSummary?: string
}

function MetricBlock({
	label,
	value,
	description,
}: {
	label: string
	value: string
	description: string
}) {
	return (
		<div className="bg-gray-50 rounded-lg p-3">
			<p className="text-xs text-gray-500 mb-1">{label}</p>
			<p className="text-sm font-bold text-gray-900">{value}</p>
			<p className="text-xs text-gray-500 mt-1">{description}</p>
		</div>
	)
}

export function MarketAnalysisSection({
	japanMarket,
	globalTam,
	globalSam,
	globalCagr,
	tamNumber,
	samNumber,
	segments,
	derivation,
	rawSummary,
}: MarketAnalysisSectionProps) {
	return (
		<section id="report-market-analysis" className="scroll-mt-4">
			<h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
				<span className="text-blue-600">3.</span> 市場分析
			</h2>

			{/* Japan Market */}
			{japanMarket && (
				<div className="mb-4">
					<h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
						🇯🇵 国内市場
					</h4>
					<div className="grid grid-cols-3 gap-3">
						<MetricBlock
							label="TAM"
							value={japanMarket.tamValue}
							description={japanMarket.marketName}
						/>
						<MetricBlock
							label="SAM"
							value={japanMarket.samValue}
							description="サービス対象市場"
						/>
						<MetricBlock
							label="CAGR"
							value={japanMarket.cagr}
							description="年平均成長率"
						/>
					</div>
				</div>
			)}

			{/* Global Market */}
			<div className="mb-4">
				<h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
					グローバル市場
				</h4>
				<div className="grid grid-cols-3 gap-3">
					<MetricBlock
						label="TAM"
						value={globalTam.value}
						description="総市場規模"
					/>
					<MetricBlock
						label="SAM"
						value={globalSam.value}
						description="サービス対象市場"
					/>
					<MetricBlock
						label="CAGR"
						value={globalCagr.value}
						description={globalCagr.description}
					/>
				</div>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<TamSamChart tamValue={tamNumber} samValue={samNumber} />
				<SegmentDonutChart segments={segments} />
			</div>

			{/* Segment Cards */}
			{segments.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
					{segments.map((seg, i) => (
						<div
							key={seg.segment_name}
							className="border border-gray-200 rounded-lg p-3"
							style={{
								borderLeft: `3px solid ${["#3498DB", "#E74C3C", "#2ECC71", "#F39C12", "#9B59B6"][i % 5]}`,
							}}
						>
							<div className="flex items-center justify-between mb-1">
								<h5 className="text-xs font-semibold text-gray-800">
									{seg.segment_name}
								</h5>
							</div>
							<p className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-medium">
								Share {seg.share_percent}%
							</p>
							<p className="text-xs text-gray-500">
								Size: {seg.estimated_size}
							</p>
							{seg.description && (
								<p className="text-[10px] text-gray-400 mt-1">
									{seg.description}
								</p>
							)}
						</div>
					))}
				</div>
			)}

			{/* Derivation */}
			{derivation && (
				<MarketDerivationCard derivation={derivation} rawSummary={rawSummary} />
			)}
		</section>
	)
}
