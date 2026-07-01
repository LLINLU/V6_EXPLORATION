import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/hooks/use-sidebar"
import { useProjectStore } from "@/stores/projectStore"

export function SidebarHeader() {
	const { state, toggleSidebar } = useSidebar()
	const clearSelectedProject = useProjectStore(
		(state) => state.clearSelectedProject,
	)
	const isExpanded = state === "expanded"

	return (
		<div className="border-b p-4">
			<div className="flex items-center justify-between">
				{isExpanded && (
					<Link
						to="/"
						onClick={clearSelectedProject}
						className="flex items-center gap-2 text-2xl font-bold whitespace-nowrap"
					>
						<span className="text-blue-600"></span>
						<span>Memory AI</span>
					</Link>
				)}
				<Button
					variant="ghost"
					size="icon"
					onClick={toggleSidebar}
					className={`h-8 w-8 ${!isExpanded ? "flex items-center justify-center -ml-1" : ""}`}
					aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
				>
					{isExpanded ? (
						<PanelLeftClose size={16} />
					) : (
						<PanelLeftOpen size={16} />
					)}
				</Button>
			</div>
		</div>
	)
}
