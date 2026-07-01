interface QuerySectionHeaderProps {
	num: string
	title: string
}

export function QuerySectionHeader({ num, title }: QuerySectionHeaderProps) {
	return (
		<div className="mb-5">
			<div className="flex items-center gap-3">
				<span className="flex items-center justify-center w-7 h-7 rounded bg-blue-50 text-blue-600 font-mono text-xs font-bold shrink-0">
					{num}
				</span>
				<h2 className="text-base font-bold text-gray-900">{title}</h2>
			</div>
		</div>
	)
}
