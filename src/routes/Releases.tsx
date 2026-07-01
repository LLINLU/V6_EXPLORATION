import { Bell, Check, Search, SlidersHorizontal, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { AppSidebar } from "@/components/AppSidebar"
import { getLevelColor } from "@/components/technology-tree/utils/levelColors"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useToast } from "@/hooks/use-toast"
import { useReleaseNotifications } from "@/hooks/useReleaseNotifications"

// Supabase Storage base URL for release assets
const RELEASE_ASSETS_BASE_URL =
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	"https://mlhxwypwicflpahwpmlg.supabase.co"
const STORAGE_PATH = "/storage/v1/object/public/github-releases-asset/releases"

function ReleasesContent() {
	const { t } = useTranslation()
	const { toast } = useToast()
	const { markReleasesAsViewed } = useReleaseNotifications()
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedCategories, setSelectedCategories] = useState<string[]>([])
	// TODO: Uncomment when implementing pagination for many releases
	// const [expandedReleases, setExpandedReleases] = useState<Set<string>>(
	// 	new Set(),
	// )
	const [selectedImage, setSelectedImage] = useState<{
		src: string
		alt: string
		caption?: string
	} | null>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)
	// Track releases with failed assets to hide entire release
	const [releasesWithErrors, setReleasesWithErrors] = useState<Set<string>>(
		new Set(),
	)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setSearchTerm("")
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [])

	useEffect(() => {
		if (searchInputRef.current) {
			searchInputRef.current.focus()
		}
		// Mark releases as viewed when page loads
		markReleasesAsViewed()
	}, [markReleasesAsViewed])

	const handleClearSearch = () => {
		setSearchTerm("")
		if (searchInputRef.current) {
			searchInputRef.current.focus()
		}
	}

	const titleToSlug = (title: string): string => {
		// Small stable hash used as a fallback when a slug cannot be produced
		const hashString = (s: string) => {
			let h = 0
			for (let i = 0; i < s.length; i++) {
				h = (h << 5) - h + s.charCodeAt(i)
				h |= 0
			}
			return Math.abs(h).toString(36)
		}

		// Use Unicode-aware character class so non-Latin titles (e.g. Japanese)
		// are preserved. If the resulting slug is empty, fall back to a
		// stable hash-based id.
		const slug = title
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s-]/gu, "") // Keep letters (all scripts), numbers, spaces and hyphens
			.replace(/\s+/g, "-") // Replace spaces with hyphens
			.replace(/-+/g, "-") // Replace multiple hyphens with single
			.trim()

		return slug || `t-${hashString(title)}`
	}

	const copyReleaseLink = async (title: string) => {
		try {
			const slug = titleToSlug(title)
			const url = `${window.location.origin}/releases#${slug}`
			await navigator.clipboard.writeText(url)
			toast({
				title: t("releases.toast.linkCopiedTitle"),
				description: t("releases.toast.linkCopiedDescription"),
			})
		} catch (_error) {
			toast({
				title: t("releases.toast.errorTitle"),
				description: t("releases.toast.errorDescription"),
			})
		}
	}

	const releases = [
		{
			id: "global-search",
			type: "feature_add",
			title: t("releases.globalSearch.title"),
			description: t("releases.globalSearch.description"),
			media: [
				{
					type: "screenshot",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/global_search/1.png`,
					alt: t("releases.globalSearch.media.screenshotAlt"),
					caption: t("releases.globalSearch.media.screenshotCaption"),
				},
				{
					type: "video",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/global_search/1.mov`,
					alt: t("releases.globalSearch.media.videoAlt"),
					caption: t("releases.demoVideoCaption"),
				},
			],
			date: "November 28th, 2025",
		},
		{
			id: "ui-optimization",
			type: "ui_improvement",
			title: t("releases.uiOptimization.title"),
			description: t("releases.uiOptimization.description"),
			media: [
				{
					type: "screenshot",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/ui_optimization/1.png`,
					alt: t("releases.uiOptimization.media.screenshotAlt"),
					caption: t("releases.uiOptimization.media.screenshotCaption"),
				},
				{
					type: "video",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/ui_optimization/1.mov`,
					alt: t("releases.uiOptimization.media.videoAlt"),
					caption: t("releases.demoVideoCaption"),
				},
			],
			date: "November 28th, 2025",
		},
		{
			id: "saved-papers",
			type: "feature_add",
			title: t("releases.savedPapers.title"),
			description: t("releases.savedPapers.description"),
			media: [
				{
					type: "screenshot",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/saved_papers/1.png`,
					alt: t("releases.savedPapers.media.screenshotAlt"),
					caption: t("releases.savedPapers.media.screenshotCaption"),
				},
				{
					type: "video",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/saved_papers/1.mov`,
					alt: t("releases.savedPapers.media.videoAlt"),
					caption: t("releases.demoVideoCaption"),
				},
			],
			date: "November 21st, 2025",
		},
		{
			id: "project-folders",
			type: "feature_add",
			title: t("releases.projectFolders.title"),
			description: t("releases.projectFolders.description"),
			media: [
				{
					type: "screenshot",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/project_folders/1.png`,
					alt: t("releases.projectFolders.media.screenshotAlt"),
					caption: t("releases.projectFolders.media.screenshotCaption"),
				},
				{
					type: "video",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/project_folders/1.mov`,
					alt: t("releases.projectFolders.media.videoAlt"),
					caption: t("releases.demoVideoCaption"),
				},
			],
			date: "November 21st, 2025",
		},
		{
			id: "treemap-level1-add",
			type: "feature_add",
			title: t("releases.treemapLevel1.title"),
			description: t("releases.treemapLevel1.description"),
			media: [
				{
					type: "screenshot",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/treemap_level1_add/1.png`,
					alt: t("releases.treemapLevel1.media.screenshotAlt"),
					caption: t("releases.treemapLevel1.media.screenshotCaption"),
				},
				{
					type: "video",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/treemap_level1_add/1.mov`,
					alt: t("releases.treemapLevel1.media.videoAlt"),
					caption: t("releases.demoVideoCaption"),
				},
			],
			date: "November 7th, 2025",
		},
		{
			id: "chat-assistant",
			type: "feature_add",
			title: t("releases.chatAssistant.title"),
			description: t("releases.chatAssistant.description"),
			media: [
				{
					type: "screenshot",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/chat_assistant/1.png`,
					alt: t("releases.chatAssistant.media.screenshotAlt"),
					caption: t("releases.chatAssistant.media.screenshotCaption"),
				},
				{
					type: "video",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/chat_assistant/1.mov`,
					alt: t("releases.chatAssistant.media.videoAlt"),
					caption: t("releases.demoVideoCaption"),
				},
			],
			date: "August 7th, 2025",
		},
		{
			id: "top-search-research",
			type: "feature_add",
			title: t("releases.topSearchResearch.title"),
			description: t("releases.topSearchResearch.description"),
			media: [
				{
					type: "screenshot",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/top_search/1.png`,
					alt: t("releases.topSearchResearch.media.screenshotAlt"),
					caption: t("releases.topSearchResearch.media.screenshotCaption"),
				},
				{
					type: "video",
					src: `${RELEASE_ASSETS_BASE_URL}${STORAGE_PATH}/top_search/1.mov`,
					alt: t("releases.topSearchResearch.media.videoAlt"),
					caption: t("releases.demoVideoCaption"),
				},
			],
			date: "August 7th, 2025",
		},
	]

	const getBadgeLevel = (type: string) => {
		switch (type) {
			case "feature_add":
				return 1
			case "bug_fix":
				return 2
			case "ui_improvement":
				return 3
			case "feature_improvement":
				return 4
			default:
				return 5
		}
	}

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "feature_add":
				return t("releases.types.featureAdd")
			case "bug_fix":
				return t("releases.types.bugFix")
			case "ui_improvement":
				return t("releases.types.uiImprovement")
			case "feature_improvement":
				return t("releases.types.featureImprovement")
			default:
				return t("releases.types.other")
		}
	}

	const handleCategoryToggle = (category: string) => {
		setSelectedCategories((prev) =>
			prev.includes(category)
				? prev.filter((c) => c !== category)
				: [...prev, category],
		)
	}

	const filteredReleases = useMemo(() => {
		return releases.filter((release) => {
			const matchesSearch =
				searchTerm === "" ||
				release.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				release.description.toLowerCase().includes(searchTerm.toLowerCase())

			const matchesCategory =
				selectedCategories.length === 0 ||
				selectedCategories.includes(release.type)

			return matchesSearch && matchesCategory
		})
	}, [searchTerm, selectedCategories, releases.filter])

	return (
		<SidebarProvider>
			<div className="h-screen flex w-full p-1 overflow-hidden">
				<AppSidebar />
				<div className="flex-1 overflow-auto">
					<div className="container mx-auto py-12 px-6 max-w-5xl">
						<div className="relative">
							<SidebarTrigger className="absolute left-4 top-4 md:hidden" />

							{/* Header Section */}
							<div className="mb-4">
								<div className="flex items-start justify-between mb-6">
									<div>
										<h1 className="text-[1.8rem] font-bold text-foreground mb-4">
											{t("releases.header.title")}
										</h1>
										<p className="text-base text-muted-foreground max-w-2xl">
											{t("releases.header.subtitle")}
										</p>
									</div>
								</div>
							</div>

							{/* Search and Filter Section */}
							<div className="flex items-center justify-between mb-8">
								<Button
									variant="outline"
									size="sm"
									className="flex items-center gap-2 py-1"
									style={{ borderColor: "#6e90ff", backgroundColor: "#eff6ff" }}
								>
									<Bell className="w-4 h-4" />
									{t("releases.header.subscribe")}
								</Button>

								<div className="flex items-center gap-2">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className={`gap-2 text-gray-700 relative ${
													selectedCategories.length > 0
														? "bg-gray-100 hover:bg-gray-200"
														: ""
												}`}
											>
												<SlidersHorizontal className="h-4 w-4" />
												{selectedCategories.length > 0 && (
													<span className="bg-[#dbdbdb] text-[#565656] text-[0.65rem] rounded-full w-5 h-5 flex items-center justify-center font-medium">
														{selectedCategories.length}
													</span>
												)}
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-48">
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault()
													handleCategoryToggle("feature_add")
												}}
												className="flex items-center justify-between"
											>
												{t("releases.types.featureAdd")}
												{selectedCategories.includes("feature_add") && (
													<Check className="h-4 w-4" />
												)}
											</DropdownMenuItem>
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault()
													handleCategoryToggle("bug_fix")
												}}
												className="flex items-center justify-between"
											>
												{t("releases.types.bugFix")}
												{selectedCategories.includes("bug_fix") && (
													<Check className="h-4 w-4" />
												)}
											</DropdownMenuItem>
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault()
													handleCategoryToggle("ui_improvement")
												}}
												className="flex items-center justify-between"
											>
												{t("releases.types.uiImprovement")}
												{selectedCategories.includes("ui_improvement") && (
													<Check className="h-4 w-4" />
												)}
											</DropdownMenuItem>
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault()
													handleCategoryToggle("feature_improvement")
												}}
												className="flex items-center justify-between"
											>
												{t("releases.types.featureImprovement")}
												{selectedCategories.includes("feature_improvement") && (
													<Check className="h-4 w-4" />
												)}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>

									<div className="relative w-64">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
										<Input
											ref={searchInputRef}
											placeholder={t("releases.search.placeholder")}
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-10 pr-10"
										/>
										{searchTerm && (
											<Button
												variant="ghost"
												size="sm"
												onClick={handleClearSearch}
												className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
											>
												<X className="h-4 w-4" />
											</Button>
										)}
									</div>
								</div>
							</div>

							<Separator className="my-12" />

							{/* Releases */}
							<div className="space-y-12">
								{filteredReleases.map((release, index) => {
									// Skip entire release if any asset failed to load
									if (releasesWithErrors.has(release.id)) {
										return null
									}

									const levelColor = getLevelColor(getBadgeLevel(release.type))
									const isFullContent = true // Show all content for now - TODO: Use pagination logic when needed

									// Handle media load errors - mark entire release as failed
									const handleMediaError = () => {
										setReleasesWithErrors((prev) =>
											new Set(prev).add(release.id),
										)
									}

									return (
										<div key={release.id}>
											<div className="relative" id={titleToSlug(release.title)}>
												{/* Two-column layout */}
												<div className="flex flex-col md:flex-row gap-6">
													{/* Left column - Date and Badge */}
													<div className="md:w-36 flex-shrink-0">
														<div className="space-y-2">
															<p
																className="text-sm text-muted-foreground"
																style={{ lineHeight: "30px" }}
															>
																{release.date}
															</p>
															<Badge
																className={`${levelColor.bg} ${levelColor.text} border-none text-xs font-normal`}
															>
																{getTypeLabel(release.type)}
															</Badge>
														</div>
													</div>

													{/* Right column - Content */}
													<div className="space-y-4 mb-6">
														<div className="flex-1">
															<div className="flex items-center justify-between mb-3">
																<h2
																	className="font-bold text-foreground"
																	style={{
																		fontSize: "21px",
																		lineHeight: "30px",
																	}}
																>
																	{release.title}
																</h2>
																<button
																	onClick={() => copyReleaseLink(release.title)}
																	className="opacity-60 hover:opacity-100 transition-opacity duration-200 p-1 rounded-sm hover:bg-muted"
																	title={t("releases.copyLinkTitle")}
																>
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		width="16"
																		height="16"
																		fill="#424242"
																		viewBox="0 0 256 256"
																	>
																		<path d="M240,88.23a54.43,54.43,0,0,1-16,37L189.25,160a54.27,54.27,0,0,1-38.63,16h-.05A54.63,54.63,0,0,1,96,119.84a8,8,0,0,1,16,.45A38.62,38.62,0,0,0,150.58,160h0a38.39,38.39,0,0,0,27.31-11.31l34.75-34.75a38.63,38.63,0,0,0-54.63-54.63l-11,11A8,8,0,0,1,135.7,59l11-11A54.65,54.65,0,0,1,224,48A54.86,54.86,0,0,1,240,88.23ZM109,185.66l-11,11A38.41,38.41,0,0,1,70.6,208h0a38.63,38.63,0,0,1-27.29-65.94L78,107.31A38.63,38.63,0,0,1,144,135.71a8,8,0,0,0,16,.45A54.86,54.86,0,0,0,144,96a54.65,54.65,0,0,0-77.27,0L32,130.75A54.62,54.62,0,0,0,70.56,224h0a54.28,54.28,0,0,0,38.64-16l11-11A8,8,0,0,0,109,185.66Z"></path>
																	</svg>
																</button>
															</div>
														</div>
														{/* Media Gallery */}
														<div className="space-y-2">
															{/* Container controlling truncation */}
															<div
																className={`relative ${
																	!isFullContent
																		? ""
																		: "max-h-64 overflow-hidden"
																}`}
															>
																{/* Gallery grid */}
																<div
																	className={`grid gap-3 ${
																		// 1 column on small screens, 2 on md, 3 on lg+
																		"grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
																	}`}
																>
																	{release.media.map((media, i) => (
																		<figure
																			key={`${media.src}-${i}`}
																			className={`relative w-full rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow`}
																		>
																			{media.type === "screenshot" ? (
																				<img
																					src={media.src}
																					alt={media.alt || `media-${i}`}
																					className={`w-full h-40 object-cover ${
																						!isFullContent
																							? "filter blur-sm"
																							: "cursor-pointer hover:opacity-90 transition-opacity"
																					}`}
																					loading={i > 2 ? "lazy" : "eager"}
																					onError={handleMediaError}
																					onClick={() =>
																						isFullContent &&
																						setSelectedImage({
																							src: media.src,
																							alt: media.alt || `media-${i}`,
																							caption: media.caption,
																						})
																					}
																				/>
																			) : (
																				<video
																					src={media.src}
																					poster={media.src}
																					controls={isFullContent}
																					muted
																					preload={i > 2 ? "none" : "metadata"}
																					className={`w-full h-40 object-cover ${
																						!isFullContent
																							? "filter blur-sm"
																							: ""
																					}`}
																					onError={handleMediaError}
																				>
																					Your browser does not support the
																					video tag.
																				</video>
																			)}{" "}
																			{/* Per-item caption (only when expanded) */}
																			{isFullContent && media.caption && (
																				<figcaption className="p-2 text-xs text-muted-foreground bg-background/70 backdrop-blur-sm">
																					{media.caption}
																				</figcaption>
																			)}
																		</figure>
																	))}
																</div>

																{/* TODO: Uncomment in case of implementing pagination for many releases */}
																{/* Continue Reading overlay for truncated gallery */}
																{/* {!isFullContent && release.media.length > 0 && (
																	<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
																		<Button
																			variant="secondary"
																			className="bg-black/80 text-white hover:bg-black/90 border-none"
																			onClick={() => toggleExpand(slug)}
																		>
																			Continue Reading
																		</Button>
																		<p className="mt-2 text-[11px] text-white/80">
																			{release.media.length} item
																			{release.media.length > 1 ? "s" : ""}
																		</p>
																	</div>
																)} */}
															</div>
														</div>
														{/* Description (expanded only) */}
														{isFullContent && release.description && (
															<p className="text-muted-foreground mb-6 text-sm leading-[21px]">
																{release.description}
															</p>
														)}
													</div>
												</div>
											</div>

											{/* Add separator between releases, but not after the last one */}
											{index < filteredReleases.length - 1 && (
												<div className="my-12">
													<Separator />
												</div>
											)}
										</div>
									)
								})}
							</div>

							{/* Footer */}
							<div className="mt-16 pt-8 border-t border-border">
								<div className="text-center">
									<p className="text-muted-foreground text-sm">
										{t("releases.footer.archivePrefix")}
										<Button variant="link" className="text-sm p-0 h-auto">
											{t("releases.footer.archiveLink")}
										</Button>
										{t("releases.footer.archiveSuffix")}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Image Viewer Dialog */}
			<Dialog
				open={!!selectedImage}
				onOpenChange={() => setSelectedImage(null)}
			>
				<DialogContent className="max-w-4xl max-h-[90vh] p-0">
					<DialogTitle className="sr-only">
						{selectedImage?.alt || t("releases.imageDialog.title")}
					</DialogTitle>
					<DialogDescription className="sr-only">
						{t("releases.imageDialog.description")}
					</DialogDescription>
					{selectedImage && (
						<div className="relative">
							<img
								src={selectedImage.src}
								alt={selectedImage.alt}
								className="w-full h-auto max-h-[85vh] object-contain"
							/>
							{selectedImage.caption && (
								<div className="p-4 bg-background border-t">
									<p className="text-sm text-muted-foreground">
										{selectedImage.caption}
									</p>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</SidebarProvider>
	)
}

export default function Releases() {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	// Show loading during SSR
	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	return <ReleasesContent />
}
