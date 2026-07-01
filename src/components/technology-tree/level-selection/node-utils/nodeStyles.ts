import type { TreeNode } from "@/types/tree"

export const getNodeStyle = (
	item: TreeNode,
	isSelected: boolean,
	level?: number,
) => {
	// Handle microscopy custom nodes specially
	if (item.isCustom && item.name.toLowerCase().includes("microscopy")) {
		if (isSelected) {
			return "bg-[#2463eb] border-2 border-[#FBCA17] text-white"
		} else {
			return "bg-[rgb(72,58,59)] text-white hover:border border-[#3d2f30]"
		}
	}

	// Apply level-specific styling
	if (level === 1) {
		return isSelected
			? "bg-[#2463eb] border border-[#90aff7] text-white"
			: "bg-[#e8f1ff] border border-[#90aff7] text-[#0d2965]"
	} else if (level === 2) {
		return isSelected
			? "bg-[#2463eb] border border-[#97d0ca] text-white"
			: "bg-[#effdfa] border border-[#97d0ca] text-[#0b554f]"
	} else if (level === 3) {
		return isSelected
			? "bg-[#2463eb] border border-[#debbe0] text-white"
			: "bg-[#f9f3ff] border border-[#debbe0] text-[#502450]"
	} else if (level === 4) {
		return isSelected
			? "bg-[#2463eb] border border-[#d9d2bc] text-white"
			: "bg-[#fffeef] border border-[#d9d2bc] text-[#31250a]"
	} else if (level === 5) {
		return isSelected
			? "bg-[#2463eb] border border-[#b2ddfa] text-white"
			: "bg-[#f4fafe] border border-[#b2ddfa] text-[#242c4e]"
	} else if (level === 6) {
		return isSelected
			? "bg-[#2463eb] border border-[#bec8fd] text-white"
			: "bg-[#f5f7ff] border border-[#bec8fd] text-[#2a247e]"
	}

	// Default styling for any other cases (fall back to original logic)
	else if (isSelected) {
		return item.isCustom
			? "bg-[#2463eb] border-2 border-[#FBCA17] text-white"
			: "bg-[#2463eb] text-white"
	} else {
		return item.isCustom
			? "bg-[#FFF4CB] text-[#554444] hover:border border-[#3d3030]"
			: "bg-[#E6F0FF] text-[#2E2E2E] hover:border border-[#1f1f1f]"
	}
}

export const getTextColor = (
	item: TreeNode,
	isSelected: boolean,
	level?: number,
) => {
	// Handle microscopy custom nodes specially
	if (item.isCustom && item.name.toLowerCase().includes("microscopy")) {
		return "text-white"
	}

	// Apply level-specific text coloring - for selected nodes, use white text
	if (isSelected) {
		return "text-white"
	}

	if (level === 1) {
		return "text-[#0d2965]"
	} else if (level === 2) {
		return "text-[#0b554f]"
	} else if (level === 3) {
		return "text-[#502450]"
	} else if (level === 4) {
		return "text-[#31250a]"
	} else if (level === 5) {
		return "text-[#242c4e]"
	} else if (level === 6) {
		return "text-[#2a247e]"
	}

	// Default styling for any other cases (fall back to original logic)
	else {
		return item.isCustom ? "text-[#483B3B]" : "text-gray-600"
	}
}
