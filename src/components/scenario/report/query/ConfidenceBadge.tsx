import { useQueryReportLabels } from "./queryReportLabels"

type Confidence = "high" | "medium" | "low"

const STYLES: Record<Confidence, { cls: string }> = {
	high: {
		cls: "bg-[#E6FFE6] text-[#256D59]",
	},
	medium: {
		cls: "bg-[#FFF8DD] text-[#575529]",
	},
	low: {
		cls: "bg-gray-100 text-gray-600",
	},
}

export function ConfidenceBadge({ value }: { value?: Confidence }) {
	const labels = useQueryReportLabels()
	if (!value) return null
	const s = STYLES[value]
	return (
		<span
			className={`inline-flex items-center font-mono text-[10px] font-medium px-2.5 py-0.5 rounded-[10000px] ${s.cls}`}
		>
			{labels.confidence[value]}
		</span>
	)
}
