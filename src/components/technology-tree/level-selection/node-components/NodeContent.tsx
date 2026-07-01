import { Copy } from "lucide-react"
import type React from "react"
import { useToast } from "@/hooks/use-toast"
import type { TreeNode } from "@/types/tree"
import { NodeLoadingIndicator } from "./NodeLoadingIndicator"

interface NodeContentProps {
	item: TreeNode
	isSelected: boolean
	isHovered: boolean
	level?: number
}

export const NodeContent: React.FC<NodeContentProps> = ({
	item,
	isSelected,
	isHovered,
	level,
}) => {
	const { toast } = useToast()

	// Force white text for better contrast on blue backgrounds
	const textColorClass = isSelected ? "text-white" : "text-gray-800"

	// Extract only the Japanese part of the title (before the English part in parentheses)
	const getJapaneseTitle = (name: string) => {
		// Check if the name contains both Japanese and English parts
		const match = name.match(/^(.+?)\s*\(\([^)]+\)\)$/)
		if (match) {
			return match[1].trim()
		}
		// If no English part found, return the original name
		return name
	}
	const japaneseTitle = getJapaneseTitle(item.name)

	// Check if this node is being generated (children_count = 0 for TED scenario nodes only)
	// Only Level 1 nodes (scenarios) should show generating status when children_count = 0
	// Level 4+ nodes naturally have children_count = 0 as leaf nodes
	const isGenerating =
		typeof item.children_count === "number" &&
		item.children_count === 0 &&
		level === 1 // Only show generating for Level 1 (scenario) nodes

	const handleCopyTitle = async (e: React.MouseEvent) => {
		e.stopPropagation()
		try {
			await navigator.clipboard.writeText(japaneseTitle)
			toast({
				title: "Copied!",
				description: "Node title copied to clipboard",
			})
		} catch (error) {
			console.error("Failed to copy:", error)
			toast({
				title: "Copy failed",
				description: "Failed to copy title to clipboard",
			})
		}
	}

	return (
		<div className="flex flex-col w-full min-w-0">
			{/* Title row with copy button */}
			<div className="flex items-start justify-between gap-2 min-w-0">
				<h4
					className={`text-base leading-6 font-medium ${textColorClass} break-words flex-1 min-w-0`}
				>
					{japaneseTitle}
				</h4>

				{/* Copy button - visible on hover */}
				{!isGenerating && (
					<button
						onClick={handleCopyTitle}
						className={`flex-shrink-0 p-1 rounded transition-all ${
							isHovered ? "opacity-100" : "opacity-0"
						} ${
							isSelected
								? "hover:bg-white/30 text-white/80 hover:text-white"
								: "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
						}`}
						title="タイトルをコピー"
					>
						<Copy className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* Show loading indicator if node is being generated */}
			{isGenerating && (
				<div className="mt-2">
					<NodeLoadingIndicator size="sm" />
				</div>
			)}

			{/* Always show info if it exists and not generating */}
			{item.info && !isGenerating && (
				<p className={`text-xs mt-1 ${textColorClass} break-words`}>
					{item.info}
				</p>
			)}
		</div>
	)
}
