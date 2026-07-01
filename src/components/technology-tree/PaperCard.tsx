import {
	Bookmark,
	BookmarkCheck,
	Calendar,
	ChevronDown,
	ChevronUp,
	ExternalLink,
	Quote,
	Star,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TagBadge } from "@/components/TagBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUserDetail } from "@/hooks/useUserDetail"

interface PaperCardProps {
	id: string
	title: string
	authors: string
	journal: string
	tags: string[]
	abstract: string
	date: string
	citations?: number
	doi: string
	score: number
	saved?: boolean
	togglePaper: () => void
}

// Map tag names to appropriate variants
const getTagVariant = (tag: string) => {
	const tagLower = tag.toLowerCase()

	if (
		tagLower.includes("material") ||
		tagLower.includes("nano") ||
		tagLower.includes("polymer")
	)
		return "materials"
	if (
		tagLower.includes("engineer") ||
		tagLower.includes("design") ||
		tagLower.includes("system")
	)
		return "engineering"
	if (
		tagLower.includes("ai") ||
		tagLower.includes("machine") ||
		tagLower.includes("learning") ||
		tagLower.includes("data")
	)
		return "aiml"
	if (
		tagLower.includes("health") ||
		tagLower.includes("medical") ||
		tagLower.includes("bio")
	)
		return "healthcare"
	if (
		tagLower.includes("energy") ||
		tagLower.includes("power") ||
		tagLower.includes("battery")
	)
		return "energy"
	if (
		tagLower.includes("sustain") ||
		tagLower.includes("environment") ||
		tagLower.includes("eco")
	)
		return "sustainability"
	if (
		tagLower.includes("algorithm") ||
		tagLower.includes("compute") ||
		tagLower.includes("process")
	)
		return "algorithms"
	if (
		tagLower.includes("real-time") ||
		tagLower.includes("realtime") ||
		tagLower.includes("control")
	)
		return "realtime"
	if (
		tagLower.includes("predict") ||
		tagLower.includes("forecast") ||
		tagLower.includes("model")
	)
		return "predictive"
	if (
		tagLower.includes("robot") ||
		tagLower.includes("automation") ||
		tagLower.includes("mechatronic")
	)
		return "robotics"

	// Alternate between blue and yellow for default tags
	return Math.random() > 0.5 ? "blue" : "yellow"
}

export const PaperCard = ({
	title,
	authors,
	journal,
	tags,
	abstract,
	date,
	citations,
	doi,
	score,
	saved,
	togglePaper,
}: PaperCardProps) => {
	const [isExpanded, setIsExpanded] = useState(false)
	const [tagsExpanded, setTagsExpanded] = useState(false)
	const shouldTruncate = abstract.length > 100
	const displayedAbstract =
		shouldTruncate && !isExpanded
			? `${abstract.substring(0, 100)}...`
			: abstract

	const shouldTruncateTags = tags.length > 2
	const displayedTags =
		shouldTruncateTags && !tagsExpanded ? tags.slice(0, 2) : tags

	const { t } = useTranslation()
	const { userDetails } = useUserDetail()

	return (
		<li className="w-full bg-white p-6 rounded-lg border border-gray-200">
			<div className="space-y-3">
				{/* Information Cards - Above Title */}
				<div className="flex gap-1 flex-wrap items-center">
					{citations !== undefined && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Card className="bg-gray-50 border-gray-200 shadow-none cursor-default flex-shrink-0">
										<CardContent className="px-2 py-1">
											<div className="flex items-center gap-1">
												<Quote size={12} className="text-gray-600" />
												<span className="text-xs text-gray-800">
													{citations}
												</span>
											</div>
										</CardContent>
									</Card>
								</TooltipTrigger>
								<TooltipContent>
									<p>Citations {citations}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Card className="bg-gray-50 border-gray-200 shadow-none cursor-default flex-shrink-0">
									<CardContent className="px-2 py-1">
										<div className="flex items-center gap-1">
											<Calendar size={12} className="text-gray-600" />
											<span className="text-xs text-gray-800">{date}</span>
										</div>
									</CardContent>
								</Card>
							</TooltipTrigger>
							<TooltipContent>
								<p>Published {date}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					{score !== 0 && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Card className="bg-gray-50 border-gray-200 shadow-none cursor-default flex-shrink-0">
										<CardContent className="px-2 py-1">
											<div className="flex items-center gap-1">
												<Star size={12} className="text-gray-600" />
												<span className="text-xs text-gray-800">
													{score.toFixed(4)}
												</span>
											</div>
										</CardContent>
									</Card>
								</TooltipTrigger>
								<TooltipContent>
									<p>Relevance {score.toFixed(4)}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>

				<div>
					<h6 className="text-base leading-6 text-black">{title}</h6>
				</div>
				{authors || journal ? (
					<div className="flex items-center gap-2 text-sm text-gray-600 truncate">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="truncate">{authors?.trim() || ""}</span>
								</TooltipTrigger>
								{authors ? (
									<TooltipContent>
										<p>{authors}</p>
									</TooltipContent>
								) : (
									""
								)}
							</Tooltip>
						</TooltipProvider>
						{authors?.trim() && journal?.trim() && (
							<span className="shrink-0">•</span>
						)}
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="truncate">{journal?.trim() || ""}</span>
								</TooltipTrigger>
								{journal ? (
									<TooltipContent>
										<p>{journal}</p>
									</TooltipContent>
								) : (
									""
								)}
							</Tooltip>
						</TooltipProvider>
					</div>
				) : null}
				<div className="flex gap-2 flex-wrap">
					{displayedTags.map((tag) => (
						<TagBadge key={tag} label={tag} variant={getTagVariant(tag)} />
					))}
					{shouldTruncateTags && !tagsExpanded && (
						<span
							onClick={() => setTagsExpanded(true)}
							className="px-3 py-1 rounded-full text-[0.75rem] font-normal bg-[#f3f3f3] text-[#4f4f4f] cursor-pointer hover:bg-gray-200 transition-colors"
						>
							+{tags.length - 2} more
						</span>
					)}
				</div>
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

				<div className="flex gap-2 justify-start flex-wrap">
					<a
						href={`https://doi.org/${doi}`}
						target="_blank"
						rel="noopener noreferrer"
						className="notranslate flex-shrink-0"
					>
						<Button
							variant="outline"
							size="sm"
							className="text-xs flex items-center gap-2"
						>
							DOI <ExternalLink size={14} />
						</Button>
					</a>
					{userDetails ? (
						<Button
							variant="outline"
							size="sm"
							className="text-xs flex-shrink-0"
							onClick={togglePaper}
						>
							{saved ? (
								<>
									<BookmarkCheck size={14} />
									{t("tech.saved")}
								</>
							) : (
								<>
									<Bookmark size={14} />
									{t("tech.save")}
								</>
							)}
						</Button>
					) : null}
				</div>
			</div>
		</li>
	)
}
