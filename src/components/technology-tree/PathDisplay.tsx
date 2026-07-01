interface TreeNode {
	id: string
	name: string
	[key: string]: any
}

interface PathDisplayProps {
	selectedPath: {
		level1: string
		level2: string
		level3: string
		level4?: string
		level5?: string
		level6?: string
		level7?: string
		level8?: string
		level9?: string
		level10?: string
	}
	level1Items: any[]
	level2Items: Record<string, TreeNode[]>
	level3Items: Record<string, TreeNode[]>
	level4Items: Record<string, TreeNode[]>
	level5Items?: Record<string, TreeNode[]>
	level6Items?: Record<string, TreeNode[]>
	level7Items?: Record<string, TreeNode[]>
	level8Items?: Record<string, TreeNode[]>
	level9Items?: Record<string, TreeNode[]>
	level10Items?: Record<string, TreeNode[]>
	showLevel4: boolean
	onGuidanceClick?: (type: string) => void
	// Navigation control props - kept for compatibility but unused
	onScrollToStart?: () => void
	onScrollToEnd?: () => void
	canScrollLeft?: boolean
	canScrollRight?: boolean
	lastVisibleLevel?: number
	// View mode prop
	viewMode: "treemap" | "mindmap"
}

export const PathDisplay = ({
	selectedPath,
	level1Items,
	level2Items,
	level3Items,
	level4Items,
	level5Items = {},
	level6Items = {},
	level7Items = {},
	level8Items = {},
	level9Items = {},
	level10Items = {},
	viewMode,
}: PathDisplayProps) => {
	// This component is now empty as the breadcrumb has been moved to CardBasedTreemap
	// Return null for treemap view since breadcrumb is now shown in CardBasedTreemap
	if (viewMode === "treemap") {
		return null
	}

	// Find the selected items by ID to display their names (for mindmap view only)
	const findItemName = (itemId: string, items: any[]) => {
		const item = items.find((item: any) => item.id === itemId)
		return item ? item.name : ""
	}

	// Extract only the Japanese part of the name (before the English part in parentheses)
	const getJapaneseName = (name: string) => {
		// Check if the name contains both Japanese and English parts
		const match = name.match(/^(.+?)\s*\(\([^)]+\)\)$/)
		if (match) {
			return match[1].trim()
		}
		// If no English part found, return the original name
		return name
	}

	// Add null safety check for selectedPath
	if (!selectedPath) {
		return null
	}

	const level1Name = selectedPath.level1
		? getJapaneseName(findItemName(selectedPath.level1, level1Items))
		: ""
	const level2Name =
		selectedPath.level2 && selectedPath.level1
			? getJapaneseName(
					findItemName(
						selectedPath.level2,
						level2Items[selectedPath.level1] || [],
					),
				)
			: ""
	const level3Name =
		selectedPath.level3 && selectedPath.level2
			? getJapaneseName(
					findItemName(
						selectedPath.level3,
						level3Items[selectedPath.level2] || [],
					),
				)
			: ""
	const level4Name =
		selectedPath.level4 && selectedPath.level3
			? getJapaneseName(
					findItemName(
						selectedPath.level4,
						level4Items[selectedPath.level3] || [],
					),
				)
			: ""
	const level5Name =
		selectedPath.level5 && selectedPath.level4
			? getJapaneseName(
					findItemName(
						selectedPath.level5,
						level5Items[selectedPath.level4] || [],
					),
				)
			: ""
	const level6Name =
		selectedPath.level6 && selectedPath.level5
			? getJapaneseName(
					findItemName(
						selectedPath.level6,
						level6Items[selectedPath.level5] || [],
					),
				)
			: ""
	const level7Name =
		selectedPath.level7 && selectedPath.level6
			? getJapaneseName(
					findItemName(
						selectedPath.level7,
						level7Items[selectedPath.level6] || [],
					),
				)
			: ""
	const level8Name =
		selectedPath.level8 && selectedPath.level7
			? getJapaneseName(
					findItemName(
						selectedPath.level8,
						level8Items[selectedPath.level7] || [],
					),
				)
			: ""
	const level9Name =
		selectedPath.level9 && selectedPath.level8
			? getJapaneseName(
					findItemName(
						selectedPath.level9,
						level9Items[selectedPath.level8] || [],
					),
				)
			: ""
	const level10Name =
		selectedPath.level10 && selectedPath.level9
			? getJapaneseName(
					findItemName(
						selectedPath.level10,
						level10Items[selectedPath.level9] || [],
					),
				)
			: ""

	// Component to render level number in a circle
	const LevelCircle = ({ level }: { level: number }) => (
		<span
			className="inline-flex items-center justify-center w-4 h-4 rounded-full font-medium mr-1"
			style={{ fontSize: "10px", backgroundColor: "#eaeaea", color: "#7c7c7c" }}
		>
			{level}
		</span>
	)

	// Component to render arrow separator
	const ArrowSeparator = () => (
		<span className="mx-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				fill="#000000"
				viewBox="0 0 256 256"
			>
				<path d="M178.83,130.83l-80,80a4,4,0,0,1-5.66-5.66L170.34,128,93.17,50.83a4,4,0,0,1,5.66-5.66l80,80A4,4,0,0,1,178.83,130.83Z"></path>
			</svg>
		</span>
	)

	return (
		<div className="mb-0" style={{ paddingTop: "0rem" }}>
			{/* Breadcrumb path - only for mindmap view */}
			<div className="mb-2">
				<p
					className="text-gray-600 flex items-center flex-wrap"
					style={{ fontSize: "14px", lineHeight: "28px", paddingLeft: "16px" }}
				>
					{level1Name && (
						<span className="flex items-center">
							<LevelCircle level={1} />
							{level1Name}
						</span>
					)}
					{level2Name && (
						<span className="flex items-center">
							<ArrowSeparator />
							<LevelCircle level={2} />
							{level2Name}
						</span>
					)}
					{level3Name && (
						<span className="flex items-center">
							<ArrowSeparator />
							<LevelCircle level={3} />
							{level3Name}
						</span>
					)}
					{level4Name && (
						<span className="flex items-center">
							<ArrowSeparator />
							<LevelCircle level={4} />
							{level4Name}
						</span>
					)}
					{level5Name && (
						<span className="flex items-center">
							<ArrowSeparator />
							<LevelCircle level={5} />
							{level5Name}
						</span>
					)}
					{level6Name && (
						<span className="flex items-center">
							<ArrowSeparator />
							<LevelCircle level={6} />
							{level6Name}
						</span>
					)}
					{level7Name && (
						<span className="flex items-center">
							<ArrowSeparator />
							<LevelCircle level={7} />
							{level7Name}
						</span>
					)}
					{level8Name && (
						<span className="flex items-center">
							<ArrowSeparator />
							<LevelCircle level={8} />
							{level8Name}
						</span>
					)}
					{level9Name && (
						<span className="flex items-center">
							<ArrowSeparator />
							<LevelCircle level={9} />
							{level9Name}
						</span>
					)}
					{level10Name && (
						<span className="flex items-center">
							<ArrowSeparator />
							<LevelCircle level={10} />
							{level10Name}
						</span>
					)}
				</p>
			</div>
		</div>
	)
}

export default PathDisplay
