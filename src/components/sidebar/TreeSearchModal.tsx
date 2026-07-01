import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { KeyboardHint } from "@/components/ui/KeyboardHint"
import { cleanupName } from "@/hooks/tree/utils/stringCleaner"
import { useTreeListStore } from "@/stores/treeListStore"

interface TreeSearchModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function TreeSearchModal({ open, onOpenChange }: TreeSearchModalProps) {
	const navigate = useNavigate()

	const {
		searchQuery,
		setSearchQuery,
		clearSearch,
		filteredTrees,
		hasResults,
		isSearching,
		fetchTreesBySearchQuery,
	} = useTreeListStore()

	const [loading, setLoading] = useState(false)

	const isSocialProblemMode = (mode?: string | null) =>
		mode === "SOCIAL_PROBLEM" || mode === "social_problem"

	// Add Command+K keyboard shortcut
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault()
				onOpenChange(!open)
			}
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [open, onOpenChange])

	// searchQuery changes
	// 1. Immediately show Loader ()
	// 2. Wait for a second — if the query changes again, don't do anything yet
	// 3. If the query is stable, send a request to the backend to fetch results
	// 4. Update results
	useEffect(() => {
		if (searchQuery) {
			setLoading(true)
		}

		const timer = setTimeout(async () => {
			try {
				// console.log(searchQuery)
				if (searchQuery) fetchTreesBySearchQuery(searchQuery)
			} catch (_error) {
				// console.log(error)
			}
			setLoading(false)
		}, 1000)

		return () => {
			clearTimeout(timer)
			setLoading(false)
		}
	}, [searchQuery, fetchTreesBySearchQuery])

	const handleTreeSelect = (
		treeId: string,
		treeName: string,
		mode?: string | null,
	) => {
		onOpenChange(false)
		clearSearch()

		if (mode === "REPORT") {
			navigate(`/query-report?id=${encodeURIComponent(treeId)}`)
			return
		}

		if (isSocialProblemMode(mode)) {
			navigate(`/technology-tree?id=${encodeURIComponent(treeId)}`, {
				state: {
					treeId,
					query: treeName,
					searchMode: "social_problem",
					fromDatabase: true,
					fromSidebar: true,
					mode: "TED",
					socialProblemMode: true,
				},
			})
			return
		}

		if (mode !== "TED") {
			navigate(`/technology-tree?id=${encodeURIComponent(treeId)}`, {
				state: {
					treeId,
					query: treeName,
					searchMode: mode ?? undefined,
					fromDatabase: true,
					fromSidebar: true,
				},
			})
			return
		}

		navigate(`/scenario-selection?id=${encodeURIComponent(treeId)}`, {
			state: {
				treeId,
				query: treeName,
				searchMode: mode,
				fromDatabase: true,
				fromSidebar: true,
			},
		})
	}

	const handleKeyDown = (ev: React.KeyboardEvent) => {
		if (ev.key === "Enter") {
			// console.log("enter pressed yoo: ", searchQuery)
			// console.log(filteredTrees())
			ev.stopPropagation()
		}
	}

	const getModeColor = (mode?: string | null) => {
		if (mode === "TED") return "bg-blue-500"
		if (mode === "FAST") return "bg-purple-500"
		if (mode === "REPORT") return "bg-green-500"
		if (isSocialProblemMode(mode)) return "bg-[#e8f3ff] border border-blue-200"
		return "bg-gray-400"
	}

	const getModeIndicatorClasses = (mode?: string | null) =>
		mode === "REPORT"
			? "w-4 h-2 rounded-full flex-shrink-0"
			: "w-2 h-2 rounded-full flex-shrink-0 aspect-square"

	const getModePrefix = (mode?: string | null) => {
		if (mode === "TED") return "ニーズから"
		if (mode === "FAST") return "技術から"
		if (mode === "REPORT") return "レポート"
		if (isSocialProblemMode(mode)) return "社会課題"
		return ""
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[678px] max-h-[80vh] p-0 gap-0 flex flex-col">
				<DialogHeader className="sr-only">
					<DialogTitle>ツリー検索</DialogTitle>
				</DialogHeader>
				<Command shouldFilter={false} className="border-none flex flex-col">
					<div className="relative flex-shrink-0">
						<CommandInput
							placeholder="ツリーを検索..."
							value={searchQuery}
							onValueChange={setSearchQuery}
							className="border-none focus-visible:ring-0 pr-10"
							onKeyDown={handleKeyDown}
						/>
					</div>
					<div className="border-t-[0.1px] flex-1 overflow-hidden flex flex-col">
						<CommandList className="flex-1 overflow-y-auto">
							<CommandEmpty className="py-6 justify-center text-center text-sm">
								{isSearching() ? (
									loading ? (
										<Loader2 className="w-full animate-spin" />
									) : (
										"検索結果が見つかりませんでした"
									)
								) : (
									"ツリーを検索してください"
								)}
							</CommandEmpty>
							{hasResults() && (
								<CommandGroup>
									{filteredTrees().map((tree) => {
										const modePrefix = getModePrefix(tree.mode)
										const displayName = cleanupName(tree.name)
										const tooltipText = modePrefix
											? `${modePrefix} ${displayName}`
											: displayName

										return (
											<CommandItem
												key={tree.id}
												value={tree.id}
												onSelect={() =>
													handleTreeSelect(
														tree.id,
														tree.search_theme,
														tree.mode,
													)
												}
												className="cursor-pointer"
											>
												<div className="flex items-center gap-2 w-full p-0.5">
													<div
														className={`${getModeIndicatorClasses(tree.mode)} ${getModeColor(tree.mode)}`}
													/>
													<span className="truncate flex-1" title={tooltipText}>
														{displayName}
													</span>
												</div>
											</CommandItem>
										)
									})}
								</CommandGroup>
							)}
						</CommandList>
					</div>
					<KeyboardHint
						showOpenSearchHint={true}
						showNavigationHint={true}
						showSelectionHint={true}
						showCloseHint={true}
					/>
				</Command>
			</DialogContent>
		</Dialog>
	)
}
