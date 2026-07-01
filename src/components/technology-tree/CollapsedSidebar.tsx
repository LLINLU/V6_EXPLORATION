import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

interface CollapsedSidebarProps {
	toggleSidebar: () => void
}
export const CollapsedSidebar = ({ toggleSidebar }: CollapsedSidebarProps) => {
	return (
		<div className="fixed right-2 top-[72px] z-10">
			<TooltipProvider delayDuration={200} skipDelayDuration={100}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							onClick={toggleSidebar}
							className="w-[32px] h-[32px] p-0 flex items-center justify-center text-gray-700 shadow-lg border-gray-300"
							style={{ backgroundColor: "#eff1f3" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#e5e7ea"
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#eff1f3"
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								fill="#797979"
								viewBox="0 0 256 256"
							>
								<path d="M230,128a6,6,0,0,1-6,6H86.49l61.75,61.76a6,6,0,1,1-8.48,8.48l-72-72a6,6,0,0,1,0-8.48l72-72a6,6,0,0,1,8.48,8.48L86.49,122H224A6,6,0,0,1,230,128ZM40,34a6,6,0,0,0-6,6V216a6,6,0,0,0,12,0V40A6,6,0,0,0,40,34Z"></path>
							</svg>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>事例と論文を表示</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	)
}
