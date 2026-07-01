import { ArrowUp } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useTreeGeneration } from "@/hooks/useTreeGeneration"
import { cn } from "@/lib/utils"
import type { Keyword } from "@/types/axis"

interface QueryDisplayProps {
	query?: string
	treeMode?: string
	initialKeywords?: Keyword[]
	className?: string
	hideContainer?: boolean // If true, removes border and background from container
	disableSubmit?: boolean
}

export const QueryDisplay = ({
	query,
	treeMode,
	className,
	initialKeywords,
	hideContainer = false,
	disableSubmit = false,
}: QueryDisplayProps) => {
	const { t } = useTranslation()
	const location = useLocation()
	const navigate = useNavigate()
	const { generateTree, isGenerating } = useTreeGeneration()

	// State for the search interface
	const [inputQuery, setInputQuery] = useState(query || "")
	// Query Helper - commented out
	// const [isQueryHelperEnabled, setIsQueryHelperEnabled] = useState(
	// 	initialKeywords && initialKeywords.length > 0,
	// )
	const _isQueryHelperEnabled = false
	const [_selectedKeywords, setSelectedKeywords] = useState<Keyword[]>(
		initialKeywords || [],
	)

	// Get searchMode from location state - if it's "quick", hide the component
	const searchMode = location.state?.searchMode
	const fromDatabase = location.state?.fromDatabase
	const effectiveTreeMode = treeMode?.toUpperCase() === "FAST" ? "FAST" : "TED"

	useEffect(() => {
		setInputQuery(query || "")
	}, [query])

	// Update query helper enabled state when initialKeywords changes
	useEffect(() => {
		if (initialKeywords && initialKeywords.length > 0) {
			// setIsQueryHelperEnabled(true) // Query Helper - commented out
			setSelectedKeywords(initialKeywords)
		}
	}, [initialKeywords])

	if (searchMode === "quick") {
		return null
	}

	const shouldShowSearchBar = (query && query.trim() !== "") || fromDatabase
	// shouldShowSearchBar computed

	if (!shouldShowSearchBar) {
		return null
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (disableSubmit) return

		if (!inputQuery.trim()) {
			toast({
				title: t("tech_page.errorTitle"),
				description: t("tech_page.errorEmptyQuery"),
			})
			return
		}

		try {
			const result = await generateTree(inputQuery.trim(), effectiveTreeMode)
			if (result) {
				navigate(`/technology-tree?id=${encodeURIComponent(result.treeId)}`, {
					state: {
						query: inputQuery.trim(),
						scenario: result.treeStructure?.scenario_inputs?.scenario,
						searchMode: "deep",
						treeData: {
							...result.treeStructure,
							mode: effectiveTreeMode,
						},
						treeId: result.treeId,
						fromDatabase: true,
						isGenerating: (result as any).status === "generating",
					},
					replace: true,
				})
			}
		} catch (_error) {
			toast({
				title: t("tech_page.errorGenerationTitle"),
				description: t("tech_page.errorGenerationDesc"),
			})
		}
	}

	return (
		<div className={cn("mb-4", className)}>
			<form onSubmit={handleSubmit}>
				<div
					className={cn(
						"relative flex items-center rounded-md",
						hideContainer ? "" : "border border-input bg-background",
					)}
				>
					<Input
						type="text"
						value={inputQuery}
						onChange={(e) => setInputQuery(e.target.value)}
						placeholder={t("tech_page.queryPlaceholder")}
						disabled={isGenerating}
						className={cn(
							"flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 pr-64",
							hideContainer ? "" : "border-0 bg-transparent",
						)}
					/>

					{/* Query Helper toggle - commented out
					<div className="absolute right-12 flex items-center gap-3">
						<TooltipProvider delayDuration={200}>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex items-center space-x-2">
										<Switch
											id="query-helper-tech-tree"
											checked={isQueryHelperEnabled}
											onCheckedChange={setIsQueryHelperEnabled}
											disabled={isGenerating}
										/>
										<Label
											htmlFor="query-helper-tech-tree"
											className="text-sm text-gray-600 cursor-pointer"
										>
											Query Helper
										</Label>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-xs">
										Generate keywords across multiple dimensions to guide
										systematic research.
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					*/}

					<Button
						type="submit"
						size="sm"
						disabled={isGenerating || !inputQuery.trim() || disableSubmit}
						className="absolute right-2 h-8 w-8 p-0 bg-transparent hover:bg-muted border-0 text-foreground"
					>
						{isGenerating ? (
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
						) : (
							<ArrowUp className="h-4 w-4" />
						)}
					</Button>
				</div>
			</form>

			{/* Query Helper / QueryRefiner - commented out
			{isQueryHelperEnabled && (
				<QueryRefiner
					query={inputQuery}
					isExpanded={true}
					onKeywordsSelected={setSelectedKeywords}
					onQueryRefined={setInputQuery}
					initialKeywords={initialKeywords}
					className="mt-4"
				/>
			)}
			*/}
		</div>
	)
}
