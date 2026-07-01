import { ChevronLeft, ChevronRight } from "lucide-react"
import type React from "react"
import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavigationControlsProps {
	onScrollToStart: () => void
	onScrollToEnd: () => void
	canScrollLeft: boolean
	canScrollRight: boolean
	lastVisibleLevel: number
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
	onScrollToStart,
	onScrollToEnd,
	canScrollLeft,
	canScrollRight,
	lastVisibleLevel,
}) => {
	return (
		<div className="flex items-center justify-between mb-4 px-4">
			<div className="flex items-center gap-2">
				<TooltipProvider delayDuration={200} skipDelayDuration={100}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								onClick={onScrollToStart}
								disabled={!canScrollLeft}
								className={`h-8 w-8 p-0 border-[#4877e5] ${
									!canScrollLeft ? "opacity-50" : ""
								}`}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>レベル1に戻る</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								onClick={onScrollToEnd}
								disabled={!canScrollRight}
								className={`h-8 w-8 p-0 border-[#4877e5] ${
									!canScrollRight ? "opacity-50" : ""
								}`}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>レベル{lastVisibleLevel}まで進む</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	)
}
