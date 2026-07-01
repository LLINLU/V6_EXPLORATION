import type { MarketImpl } from "@/types/report"
import { ImplTable } from "./ImplTable"

interface MarketImplementationsSectionProps {
	items: MarketImpl[]
}

export function MarketImplementationsSection({
	items,
}: MarketImplementationsSectionProps) {
	const filtered = items.filter(
		(item) => (item.press_releases ?? item.urls ?? []).length > 0,
	)
	const commercial = filtered.filter((m) => m.stage === "commercial").length
	const rnd = filtered.filter((m) => m.stage === "rnd").length

	return (
		<section id="report-market-implementations" className="scroll-mt-4">
			<h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
				<span className="text-blue-600">5.</span> 市場実装事例
			</h2>

			<p className="text-xs text-gray-600 mb-3">
				合計: <strong>{filtered.length}件</strong> (商用: {commercial}, R&D:{" "}
				{rnd})
			</p>

			<ImplTable items={filtered} />
		</section>
	)
}
