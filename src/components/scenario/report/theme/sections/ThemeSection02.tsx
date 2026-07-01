import type { ThemeS02 } from "@/types/theme-report"
import { ThemeMemlabBadges } from "../ThemeMemlabBadges"
import { ThemeSectionHeader } from "../ThemeSectionHeader"

export function ThemeSection02({
	data,
	isExpanded = false,
	title,
	labels,
}: {
	data: ThemeS02
	isExpanded?: boolean
	title: string
	labels: {
		advantages: string
		customers: string
	}
}) {
	return (
		<section id="theme-s02" className="scroll-mt-2">
			<ThemeSectionHeader num="02" title={title} />
			<ThemeMemlabBadges sources={data.sources} />

			{/* Definition block */}
			<div
				className="bg-blue-50 p-4 rounded-lg mb-5 text-[14px] text-gray-700 leading-relaxed [&_strong]:text-gray-900 [&_em]:text-blue-700 [&_em]:not-italic [&_em]:font-medium"
				dangerouslySetInnerHTML={{ __html: data.definition }}
			/>

			{/* Advantages */}
			<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
				{labels.advantages}
			</p>
			<div className="bg-white rounded-lg border border-gray-200 p-2 mb-5 space-y-2">
				{data.advantages.map((adv, i) => (
					<div key={i} className="bg-gray-50 rounded-md px-3 py-2">
						<p className="text-[14px] font-semibold text-gray-900 mb-1 leading-snug">
							{adv.title}
						</p>
						<p className="text-[14px] text-gray-600 leading-relaxed">
							{adv.desc}
						</p>
					</div>
				))}
			</div>

			{/* Customers */}
			<p className="text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2">
				{labels.customers}
			</p>
			<div
				className={`grid gap-3 mb-2 ${isExpanded ? "grid-cols-2" : "grid-cols-1"}`}
			>
				{data.customers.map((c, i) => (
					<div
						key={i}
						className="bg-white rounded-lg border border-gray-200 px-5 py-4"
					>
						<span className="inline-block font-mono text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded mb-1.5">
							{c.label}
						</span>
						<p className="text-[14px] font-semibold text-gray-900 mb-1">
							{c.title}
						</p>
						<p className="text-[14px] text-gray-600 leading-relaxed mb-2">
							{c.desc}
						</p>
						{c.links?.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{c.links.map((l, j) => (
									<a
										key={j}
										href={l.url}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
									>
										{l.label}
										<svg
											className="w-2.5 h-2.5 shrink-0"
											viewBox="0 0 12 12"
											fill="none"
										>
											<path
												d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5"
												stroke="currentColor"
												strokeWidth="1.2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</a>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		</section>
	)
}
