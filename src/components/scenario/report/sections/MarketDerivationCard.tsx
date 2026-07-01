import type { MarketDerivation } from "@/types/report"

interface MarketDerivationCardProps {
	derivation: MarketDerivation
	rawSummary?: string
}

export function MarketDerivationCard({
	derivation,
	rawSummary,
}: MarketDerivationCardProps) {
	const hasContent = derivation.tam_source_name

	if (!hasContent) return null

	return (
		<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
			<h5 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
				🛡 導出根拠
			</h5>

			{derivation.tam_source_name && (
				<div className="mb-2">
					<p className="text-xs text-gray-500">
						<strong>TAMソース:</strong> {derivation.tam_source_name}
					</p>
					{derivation.tam_source_url && (
						<a
							href={derivation.tam_source_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-blue-500 hover:underline"
						>
							{derivation.tam_source_url}
						</a>
					)}
				</div>
			)}

			{derivation.sam_formula && (
				<div className="mb-2">
					<p className="text-xs text-gray-500">
						<strong>SAM算出式:</strong> {derivation.sam_formula}
					</p>
					{derivation.sam_description && (
						<p className="text-xs text-gray-400 mt-0.5">
							{derivation.sam_description}
						</p>
					)}
				</div>
			)}

			{derivation.reference_sources.length > 0 && (
				<div className="mt-2">
					<p className="text-xs text-gray-500 font-semibold mb-1">参考文献:</p>
					<ul className="space-y-0.5">
						{derivation.reference_sources.map((src, i) => (
							<li key={i} className="text-xs text-gray-500">
								{src.url ? (
									<a
										href={src.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-500 hover:underline"
									>
										{src.label}
									</a>
								) : (
									src.label
								)}
							</li>
						))}
					</ul>
				</div>
			)}

			{rawSummary && (
				<div className="mt-3 pt-2 border-t border-gray-200">
					<p className="text-xs text-gray-500 whitespace-pre-line">
						{rawSummary}
					</p>
				</div>
			)}
		</div>
	)
}
