import ReactCountryFlag from "react-country-flag"
import type { ThemeS01 } from "@/types/theme-report"
import { CitedText, injectCitationsIntoHtml } from "../citations"
import { ThemeMemlabBadges } from "../ThemeMemlabBadges"
import { ThemeSectionHeader } from "../ThemeSectionHeader"

/** Convert a flag emoji (e.g. 🇯🇵) to its 2-letter ISO 3166-1 alpha-2 code (e.g. "JP") */
function flagEmojiToCode(flag: string): string {
	return [...flag]
		.map((c) => String.fromCharCode((c.codePointAt(0) ?? 0) - 0x1f1e6 + 65))
		.join("")
}

export function ThemeSection01({
	data,
	isExpanded = false,
	title,
}: {
	data: ThemeS01
	isExpanded?: boolean
	title: string
}) {
	return (
		<section id="theme-s01" className="scroll-mt-2">
			<ThemeSectionHeader num="01" title={title} />
			<ThemeMemlabBadges sources={data.sources} />

			{/* KPI Cards */}
			<div
				className={`grid gap-3 mb-5 ${isExpanded ? "grid-cols-3" : "grid-cols-1"}`}
			>
				{data.kpis.map((kpi, i) => (
					<div
						key={i}
						className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col justify-between gap-3"
					>
						<p className="text-[11px] text-gray-400 leading-snug">
							<CitedText text={kpi.label} sources={data.sources} />
						</p>
						<p className="text-[16px] font-bold leading-none text-[#4f5fe0]">
							{kpi.value}
						</p>
					</div>
				))}
			</div>

			{/* Body HTML */}
			<div
				className="prose prose-sm prose-gray max-w-none text-[14px] text-gray-700 leading-relaxed space-y-3 mb-5 [&_strong]:text-gray-900 [&_p]:mb-3 [&_p]:text-[14px]"
				dangerouslySetInnerHTML={{
					__html: injectCitationsIntoHtml(data.body, data.sources),
				}}
			/>

			{/* Policy Cards */}
			{data.policies?.length > 0 && (
				<div className="space-y-2 mb-2">
					{data.policies.map((p, i) => (
						<div
							key={i}
							className="p-3 bg-gray-50 rounded-lg border border-gray-100"
						>
							<div className="flex items-center gap-1.5 mb-1">
								<span
									className="shrink-0 rounded-sm overflow-hidden"
									style={{ width: 20, height: "auto", display: "inline-flex" }}
								>
									<ReactCountryFlag
										countryCode={flagEmojiToCode(p.flag)}
										svg
										style={{ width: 20, height: "auto" }}
									/>
								</span>
								<p className="text-xs font-semibold text-gray-900">
									{p.country}
								</p>
							</div>
							<p className="text-[14px] text-gray-600 leading-relaxed">
								<CitedText text={p.text} sources={data.sources} />
							</p>
						</div>
					))}
				</div>
			)}
		</section>
	)
}
