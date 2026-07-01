import {
	Calendar,
	ChevronDown,
	ChevronUp,
	ExternalLink,
	Globe,
	Star,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { NodePatent } from "@/stores/enrichedDataStore"

interface PatentCardProps {
	patent: NodePatent
}

export const PatentCard = ({ patent }: PatentCardProps) => {
	const [isExpanded, setIsExpanded] = useState(false)

	const abstractText = patent.abstract ?? ""
	const shouldTruncate = abstractText.length > 150
	const displayedAbstract =
		shouldTruncate && !isExpanded
			? `${abstractText.substring(0, 150)}...`
			: abstractText

	const assigneeNames = patent.assignee
		?.map((a) => a.name_harmonized ?? a.name)
		.join(", ")
	const inventorNames = patent.inventor?.map((i) => i.name).join(", ")
	const countries = patent.countries?.join(", ")

	const googlePatentsUrl = patent.publication_number
		? `https://patents.google.com/patent/${patent.publication_number}/en`
		: null

	return (
		<li className="w-full bg-white p-6 rounded-lg border border-gray-200">
			<div className="space-y-3">
				{/* Meta info badges */}
				<div className="flex gap-1 flex-wrap items-center">
					{patent.earliest_priority_date && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Card className="bg-gray-50 border-gray-200 shadow-none cursor-default flex-shrink-0">
										<CardContent className="px-2 py-1">
											<div className="flex items-center gap-1">
												<Calendar size={12} className="text-gray-600" />
												<span className="text-xs text-gray-800">
													{patent.earliest_priority_date}
												</span>
											</div>
										</CardContent>
									</Card>
								</TooltipTrigger>
								<TooltipContent>
									<p>優先日 {patent.earliest_priority_date}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}

					{countries && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Card className="bg-gray-50 border-gray-200 shadow-none cursor-default flex-shrink-0">
										<CardContent className="px-2 py-1">
											<div className="flex items-center gap-1">
												<Globe size={12} className="text-gray-600" />
												<span className="text-xs text-gray-800">
													{countries}
												</span>
											</div>
										</CardContent>
									</Card>
								</TooltipTrigger>
								<TooltipContent>
									<p>出願国</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}

					{patent.similarity_score != null && patent.similarity_score > 0 && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Card className="bg-gray-50 border-gray-200 shadow-none cursor-default flex-shrink-0">
										<CardContent className="px-2 py-1">
											<div className="flex items-center gap-1">
												<Star size={12} className="text-gray-600" />
												<span className="text-xs text-gray-800">
													{patent.similarity_score.toFixed(3)}
												</span>
											</div>
										</CardContent>
									</Card>
								</TooltipTrigger>
								<TooltipContent>
									<p>類似度スコア</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>

				{/* Title */}
				<div>
					<h6 className="text-base leading-6 text-black">{patent.title}</h6>
				</div>

				{/* Assignee / Inventor */}
				{(assigneeNames || inventorNames) && (
					<div className="flex items-center gap-2 text-sm text-gray-600 truncate">
						{assigneeNames && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="truncate font-medium">
											{assigneeNames}
										</span>
									</TooltipTrigger>
									<TooltipContent>
										<p>出願人: {assigneeNames}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
						{assigneeNames && inventorNames && (
							<span className="shrink-0">•</span>
						)}
						{inventorNames && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="truncate">{inventorNames}</span>
									</TooltipTrigger>
									<TooltipContent>
										<p>発明者: {inventorNames}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
				)}

				{/* IPC / CPC tags */}
				{patent.ipc_prefixes && patent.ipc_prefixes.length > 0 && (
					<div className="flex gap-1 flex-wrap">
						{patent.ipc_prefixes.map((ipc) => (
							<span
								key={ipc}
								className="px-3 py-1 rounded-full text-[0.7rem] font-normal bg-[#e3e4fc] text-[#7458d3]"
							>
								{ipc}
							</span>
						))}
					</div>
				)}

				{/* Abstract */}
				{abstractText && (
					<div className="text-sm text-gray-700 leading-relaxed">
						<p className="inline">{displayedAbstract}</p>
						{shouldTruncate && (
							<button
								onClick={() => setIsExpanded(!isExpanded)}
								className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-sm"
							>
								{isExpanded ? (
									<>
										Show less <ChevronUp size={14} />
									</>
								) : (
									<>
										Show more <ChevronDown size={14} />
									</>
								)}
							</button>
						)}
					</div>
				)}

				{/* Actions */}
				<div className="flex gap-2 justify-start flex-wrap">
					{googlePatentsUrl && (
						<a
							href={googlePatentsUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="notranslate flex-shrink-0"
						>
							<Button
								variant="outline"
								size="sm"
								className="text-xs flex items-center gap-2"
							>
								Google Patents <ExternalLink size={14} />
							</Button>
						</a>
					)}
					{patent.family_id && (
						<span className="text-xs text-gray-400 self-center">
							Family ID: {patent.family_id}
						</span>
					)}
				</div>
			</div>
		</li>
	)
}
