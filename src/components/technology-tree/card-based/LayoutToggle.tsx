import type React from "react"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ThreeColumnsIcon } from "./ThreeColumnsIcon"
import { ThreeColumnsWideIcon } from "./ThreeColumnsWideIcon"
import { TwoByTwoGridIcon } from "./TwoByTwoGridIcon"

type CardLayoutMode = "one-per-row" | "two-per-row" | "three-per-row"

interface LayoutToggleProps {
	cardLayout: CardLayoutMode
	onLayoutChange: (layout: CardLayoutMode) => void
	scenarioCount: number
	totalNodeCount: number
}

export const LayoutToggle: React.FC<LayoutToggleProps> = ({
	cardLayout,
	onLayoutChange,
	scenarioCount,
	totalNodeCount,
}) => {
	return (
		<div>
			<div className="flex items-center justify-between bg-white px-4 rounded-lg">
				<div
					className="flex items-center gap-1 text-sm font-medium"
					style={{
						color: "#5F729F",
					}}
				>
					<span className="text-xs font-normal">{scenarioCount}シナリオ</span>
					<span>・</span>
					<Badge
						className="text-xs py-0.5 px-0 border-0 font-light"
						style={{ color: "#5F729F", backgroundColor: "transparent" }}
					>
						{totalNodeCount}ノード
					</Badge>
				</div>
				<ToggleGroup
					type="single"
					value={cardLayout}
					onValueChange={(value) =>
						value && onLayoutChange(value as CardLayoutMode)
					}
					className="p-1 rounded-lg bg-white"
				>
					<ToggleGroupItem
						value="one-per-row"
						aria-label="1行1カード"
						className="data-[state=on]:bg-white"
					>
						<ThreeColumnsIcon
							className="h-4 w-4"
							isSelected={cardLayout === "one-per-row"}
						/>
					</ToggleGroupItem>
					<ToggleGroupItem
						value="two-per-row"
						aria-label="1行2カード"
						className="data-[state=on]:bg-white"
					>
						<TwoByTwoGridIcon
							className="h-4 w-4"
							isSelected={cardLayout === "two-per-row"}
						/>
					</ToggleGroupItem>
					<ToggleGroupItem
						value="three-per-row"
						aria-label="1行3カード"
						className="data-[state=on]:bg-white"
					>
						<ThreeColumnsWideIcon
							className="h-4 w-4"
							isSelected={cardLayout === "three-per-row"}
						/>
					</ToggleGroupItem>
				</ToggleGroup>
			</div>
		</div>
	)
}
