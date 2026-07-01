import { ChevronRight, Search, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { KeyboardHint } from "@/components/ui/KeyboardHint"
import type { NodeSuggestion } from "@/types/chat"
import { getLevelNames } from "@/utils/technologyTreeUtils"
import { getLevelColor } from "../utils/levelColors"

interface MentionDropdownProps {
	availableNodes: NodeSuggestion[]
	onNodeSelect: (node: NodeSuggestion) => void
	searchQuery: string
	selectedIndex: number
	onSelectedIndexChange: (index: number) => void
	onLevelChange?: (level: number | null) => void
}

interface GroupedNodes {
	[level: number]: NodeSuggestion[]
}

export const MentionDropdown = ({
	availableNodes,
	onNodeSelect,
	searchQuery,
	selectedIndex,
	onSelectedIndexChange,
	onLevelChange,
}: MentionDropdownProps) => {
	const { t } = useTranslation()
	const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
	const [searchInput, setSearchInput] = useState("")
	const dropdownRef = useRef<HTMLDivElement>(null)
	const itemRefs = useRef<(HTMLDivElement | null)[]>([])

	// Group nodes by level
	const groupedNodes = availableNodes.reduce<GroupedNodes>((acc, node) => {
		if (!acc[node.level]) {
			acc[node.level] = []
		}
		acc[node.level].push(node)
		return acc
	}, {})

	const levels = Object.keys(groupedNodes)
		.map(Number)
		.sort((a, b) => a - b)

	// Filter nodes based on search
	const filterNodes = (nodes: NodeSuggestion[]) => {
		if (!searchInput && !searchQuery) return nodes
		const query = (searchInput || searchQuery).toLowerCase()
		return nodes.filter(
			(node) =>
				node.title.toLowerCase().includes(query) ||
				node.description?.toLowerCase().includes(query),
		)
	}

	// Get displayed items based on current view
	const getDisplayedItems = () => {
		const query = searchInput || searchQuery

		if (query && query.length > 0) {
			// Direct search mode: search across all levels
			const allNodes = availableNodes.filter(
				(node) =>
					node.title.toLowerCase().includes(query.toLowerCase()) ||
					node.description?.toLowerCase().includes(query.toLowerCase()),
			)
			return allNodes.map((node) => ({
				type: "node" as const,
				node,
			}))
		} else if (selectedLevel === null) {
			// Show levels when no search query
			return levels.map((level) => ({
				type: "level" as const,
				level,
				count: groupedNodes[level].length,
			}))
		} else {
			// Show nodes in selected level
			const nodes = filterNodes(groupedNodes[selectedLevel] || [])
			return nodes.map((node) => ({
				type: "node" as const,
				node,
			}))
		}
	}

	const displayedItems = getDisplayedItems()

	// Scroll to selected item
	useEffect(() => {
		if (selectedIndex >= 0 && selectedIndex < itemRefs.current.length) {
			itemRefs.current[selectedIndex]?.scrollIntoView({
				block: "nearest",
				behavior: "smooth",
			})
		}
	}, [selectedIndex])

	// Reset to level view when search query changes
	useEffect(() => {
		if (searchQuery === "") {
			setSelectedLevel(null)
			setSearchInput("")
		} else {
			// If there's a search query from parent, use it for direct search
			setSearchInput(searchQuery)
		}
	}, [searchQuery])

	const handleItemClick = (index: number) => {
		const item = displayedItems[index]
		if (item.type === "level") {
			setSelectedLevel(item.level)
			onSelectedIndexChange(0)
			onLevelChange?.(item.level)
		} else if (item.type === "node") {
			onNodeSelect(item.node)
		}
	}

	const handleBackClick = () => {
		setSelectedLevel(null)
		setSearchInput("")
		onSelectedIndexChange(0)
		onLevelChange?.(null)
	}

	return (
		<div
			ref={dropdownRef}
			className="absolute bottom-full mb-2 w-auto ml-5 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] max-h-64 overflow-hidden flex flex-col"
		>
			{/* Header - Always visible search */}
			<div className="sticky top-0 bg-white border-b border-gray-100 pt-1 px-3 pb-3">
				{selectedLevel !== null && (
					<div className="flex items-center justify-between mb-2">
						<button
							onClick={handleBackClick}
							className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								fill="#2e2e2e"
								viewBox="0 0 256 256"
							>
								<path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
							</svg>
						</button>
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className={(() => {
									const levelColorInfo = getLevelColor(selectedLevel)
									return `${levelColorInfo.bg} ${levelColorInfo.text} border ${levelColorInfo.border} font-normal`
								})()}
							>
								{t("tech.level_n", { n: selectedLevel })} :{(() => {
									const levelNames = getLevelNames("TED")
									switch (selectedLevel) {
										case 1:
											return levelNames.level1
										case 2:
											return levelNames.level2
										case 3:
											return levelNames.level3
										case 4:
											return levelNames.level4
										default:
											return `Level ${selectedLevel}`
									}
								})()}
							</Badge>
							<span className="text-xs text-gray-500">
								{t("tech.n_nodes", {
									count: filterNodes(groupedNodes[selectedLevel] || []).length,
								})}
							</span>
						</div>
					</div>
				)}

				{/* Search input - always visible */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						type="text"
						value={searchInput}
						onChange={(e) => {
							setSearchInput(e.target.value)
							onSelectedIndexChange(0)
						}}
						onKeyDown={(e) => {
							// Allow arrow keys and Enter to bubble up to parent for navigation
							if (["ArrowUp", "ArrowDown", "Enter", "Tab"].includes(e.key)) {
								e.preventDefault()
								// Let the parent handle these keys
								return
							}
						}}
						placeholder={
							selectedLevel !== null
								? t("tech.search_node")
								: t("tech.enter_node_or_select_level")
						}
						className="w-full pl-9 pr-8 py-2 text-sm border-0 border-b border-gray-200 bg-transparent focus:outline-none focus:border-blue-500 focus:ring-0 transition-colors"
					/>
					{searchInput && (
						<button
							onClick={() => {
								setSearchInput("")
								setSelectedLevel(null)
								onSelectedIndexChange(0)
							}}
							className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
						>
							<X className="h-3 w-3" />
						</button>
					)}
				</div>

				{/* Search mode indicator */}
				{(searchInput || searchQuery) &&
					(searchInput || searchQuery).length > 0 && (
						<div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
							<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
								{t("tech.searching_all_levels")}
							</span>
							<span>
								{t("tech.n_results", { count: displayedItems.length })}
							</span>
						</div>
					)}
			</div>

			{/* Items list */}
			<div className="overflow-y-auto flex-1">
				{displayedItems.length === 0 ? (
					<div className="p-4 text-center text-gray-500 text-sm">
						{t("tech.no_search_results")}
					</div>
				) : (
					displayedItems.map((item, index) => (
						<div
							key={item.type === "level" ? `level-${item.level}` : item.node.id}
							ref={(el) => {
								itemRefs.current[index] = el
							}}
							className={`mention-dropdown-item-${index} cursor-pointer transition-colors ${
								index === selectedIndex ? "bg-blue-50" : "hover:bg-gray-50"
							}`}
							onClick={() => handleItemClick(index)}
						>
							{item.type === "level" ? (
								<div className="px-4 py-2 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="font-normal text-gray-900">
											Level {item.level}
										</div>
										<div className="text-sm text-gray-500">
											{t("tech.n_nodes", { count: item.count })}
										</div>
									</div>
									<ChevronRight className="h-4 w-4 text-gray-400" />
								</div>
							) : (
								<div className="px-4 py-3 border-b border-gray-100 last:border-b-0">
									<div className="text-xs text-blue-600 font-medium">
										@{item.node.title.toLowerCase().replace(/\s+/g, "")}
									</div>
								</div>
							)}
						</div>
					))
				)}
			</div>

			{/* Footer hint */}
			<KeyboardHint additionalMessage={t("tech.select_level_to_show_nodes")} />
		</div>
	)
}
