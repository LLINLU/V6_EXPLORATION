import {
	Bookmark,
	BookmarkCheck,
	Calendar,
	ChevronDown,
	ChevronUp,
	ExternalLink,
	MoreVertical,
	Quote,
	RotateCcw,
	Star,
	StickyNote,
	Trash2,
	X,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { TagBadge } from "@/components/TagBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSavedItems } from "@/hooks/useSavedItems"
import { type MemoNotes, parseNotes } from "@/services/savedItemsService"
import { savedItemStore } from "@/stores/savedStore"

interface PaperCardProps {
	paper?: {
		id: string
		title: string
		authors: string
		journal: string
		tags: any
		abstract: string
		date: string | null
		citations?: number
		doi: string | null
		score?: number
	}
	title?: string
	authors?: string
	journal?: string
	tags?: string[]
	abstract?: string
	date?: string
	citations?: number
	doi?: string
	score?: number
	treeId?: string
	nodeId?: string
	isSavedItemsView?: boolean
	savedItemId?: string
	savedNotes?: string | null
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

export const SavedPaperCard = (props: PaperCardProps) => {
	const { t } = useTranslation()
	const {
		paper,
		treeId,
		nodeId,
		isSavedItemsView = false,
		savedItemId,
		savedNotes,
	} = props

	// Support both direct props and paper object
	const title = paper?.title ?? props.title ?? ""
	const authors = paper?.authors ?? props.authors ?? ""
	const journal = paper?.journal ?? props.journal ?? ""
	const tags = Array.isArray(paper?.tags) ? paper.tags : (props.tags ?? [])
	const abstract = paper?.abstract ?? props.abstract ?? ""
	const date = paper?.date ?? props.date ?? ""
	const citations = paper?.citations ?? props.citations
	const doi = paper?.doi ?? props.doi ?? ""
	const score = paper?.score ?? props.score ?? 0
	const paperId = paper?.id ?? ""

	const [isExpanded, setIsExpanded] = useState(false)
	const [tagsExpanded, setTagsExpanded] = useState(false)
	const [showMenu, setShowMenu] = useState(false)
	const [memoDialogOpen, setMemoDialogOpen] = useState(false)
	const [memoNotes, setMemoNotes] = useState<MemoNotes>({ tags: [], memo: "" })
	const [tagInput, setTagInput] = useState("")

	const { updatePaperNotes } = useSavedItems()

	const unsavePaper = savedItemStore((state) => state.unsave_paper)
	const saved_paper_ids = savedItemStore((state) => state.saved_paper_ids)

	const isSaved = saved_paper_ids.includes(paperId)

	const shouldTruncate = abstract.length > 100
	const displayedAbstract =
		shouldTruncate && !isExpanded
			? `${abstract.substring(0, 100)}...`
			: abstract

	const shouldTruncateTags = tags.length > 2
	const displayedTags =
		shouldTruncateTags && !tagsExpanded ? tags.slice(0, 2) : tags

	const handleSaveToggle = () => {
		if (!paperId || !treeId || !nodeId) {
			return
		}
		if (isSaved) {
			unsavePaper(paperId, treeId, nodeId)
		}
	}

	const handleOpenMemo = () => {
		if (savedItemId) {
			const currentNotes = parseNotes(savedNotes || null)
			setMemoNotes(currentNotes)
		}
		setMemoDialogOpen(true)
	}

	const handleSaveMemo = () => {
		if (savedItemId) {
			updatePaperNotes({ savedPaperId: savedItemId, notes: memoNotes })
		}
		setMemoDialogOpen(false)
	}

	const handleAddTag = () => {
		const trimmedTag = tagInput.trim()
		if (trimmedTag && !memoNotes.tags.includes(trimmedTag)) {
			setMemoNotes((prev) => ({
				...prev,
				tags: [...prev.tags, trimmedTag],
			}))
			setTagInput("")
		}
	}

	const handleRemoveTag = (tagToRemove: string) => {
		setMemoNotes((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}))
	}

	const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault()
			handleAddTag()
		}
	}

	const parsedNotes = useMemo(() => {
		return parseNotes(savedNotes || null)
	}, [savedNotes])

	return (
		<div
			className="w-full bg-white p-6 rounded-lg border border-gray-200 outline-none focus:outline-none relative"
			onMouseEnter={() => setShowMenu(true)}
			onMouseLeave={() => setShowMenu(false)}
		>
			{/* Kebab Menu - Only in saved items view */}
			{isSavedItemsView && (
				<div
					className={`absolute top-4 right-4 transition-opacity duration-200 ${showMenu ? "opacity-100" : "opacity-0"}`}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="bg-background z-50">
							<DropdownMenuItem
								onClick={handleOpenMemo}
								className="cursor-pointer"
							>
								<StickyNote className="mr-2 h-4 w-4" />
								{t("tech.add_personal_memo")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={handleSaveToggle}
								className="cursor-pointer"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								{t("tech.remove_from_saved")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}

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
				<div className="flex items-center gap-2 text-sm text-gray-600 truncate">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="truncate">{authors}</span>
							</TooltipTrigger>
							<TooltipContent>
								<p>{authors}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<span className="shrink-0">•</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="truncate">{journal}</span>
							</TooltipTrigger>
							<TooltipContent>
								<p>{journal}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				{/* Default Tags */}
				<div className="flex gap-2 flex-wrap">
					{displayedTags.map((tag, _index) => (
						<TagBadge key={`${tag}`} label={tag} variant={getTagVariant(tag)} />
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

				{/* User Tags */}
				{parsedNotes.tags.length > 0 && (
					<div className="flex gap-2 flex-wrap">
						{parsedNotes.tags.map((tag: string) => (
							<Badge
								key={tag}
								variant="outline"
								className="text-xs bg-blue-50 border-blue-200 text-blue-700"
							>
								{tag}
							</Badge>
						))}
					</div>
				)}
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

				{/* User Memo */}
				{parsedNotes.memo && (
					<div className="p-3 bg-muted/50 rounded-md border border-border">
						<p className="text-sm text-foreground whitespace-pre-wrap">
							{parsedNotes.memo}
						</p>
					</div>
				)}

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
					{!isSavedItemsView && (
						<Button
							variant="outline"
							size="sm"
							className="text-xs flex items-center gap-1 flex-shrink-0"
							onClick={handleSaveToggle}
							disabled={!paperId}
						>
							{isSaved ? (
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
					)}
				</div>
			</div>

			{/* Memo Dialog */}
			<Dialog open={memoDialogOpen} onOpenChange={setMemoDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{t("tech.personal_memo")}
							<div className="ml-auto flex gap-1">
								<Button variant="ghost" size="icon" className="h-6 w-6">
									<RotateCcw className="h-4 w-4" />
								</Button>
							</div>
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						{/* Tags Section */}
						<div className="space-y-2">
							<label className="text-sm font-medium">{t("tech.tags")}</label>
							<div className="flex flex-wrap gap-2 mb-2">
								{memoNotes.tags.map((tag) => (
									<Badge
										key={tag}
										variant="outline"
										className="text-xs bg-blue-50 border-blue-200 text-blue-700 pr-1"
									>
										{tag}
										<button
											onClick={() => handleRemoveTag(tag)}
											className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
							<Input
								placeholder={t("tech.add_tag_placeholder")}
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								onKeyDown={handleTagInputKeyDown}
								className="text-sm"
							/>
						</div>

						{/* Memo Section */}
						<div className="space-y-2">
							<label className="text-sm font-medium">{t("tech.memo")}</label>
							<Textarea
								placeholder={t("tech.enter_memo_placeholder")}
								value={memoNotes.memo}
								onChange={(e) =>
									setMemoNotes((prev) => ({ ...prev, memo: e.target.value }))
								}
								className="min-h-[200px] resize-none text-sm"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setMemoDialogOpen(false)}>
							{t("tech.cancel")}
						</Button>
						<Button onClick={handleSaveMemo}>{t("tech.save")}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
