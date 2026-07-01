import { Move, PanelRightClose, PictureInPicture2 } from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import type { ChatDisplayMode } from "@/types/tree"

interface ChatHeaderProps {
	toggleOpen: () => void
	displayMode?: ChatDisplayMode
	onDisplayModeChange?: (mode: ChatDisplayMode) => void
	onMouseDown?: (e: React.MouseEvent) => void
	isDragging?: boolean
}

export const ChatHeader = ({
	toggleOpen,
	displayMode = "overlay",
	onDisplayModeChange,
	onMouseDown,
	isDragging = false,
}: ChatHeaderProps) => {
	const { t } = useTranslation()
	const handleModeToggle = () => {
		if (onDisplayModeChange) {
			const newMode = displayMode === "overlay" ? "panel" : "overlay"
			onDisplayModeChange(newMode)
		}
	}

	return (
		<>
			<div
				className={`flex items-center justify-between px-4 py-3 bg-white transition-colors ${
					displayMode === "overlay"
						? "drag-handle cursor-move select-none hover:bg-gray-50"
						: ""
				} ${isDragging ? "cursor-grabbing bg-gray-50" : ""}`}
				onMouseDown={displayMode === "overlay" ? onMouseDown : undefined}
			>
				{/* Left side - Title and drag indicator */}
				<div
					className={`flex items-center gap-2 flex-1 ${
						displayMode === "overlay" ? "drag-handle cursor-move" : ""
					}`}
				>
					{displayMode === "overlay" && (
						<Move className="h-4 w-4 text-gray-400 drag-handle" />
					)}
					<div
						className={`flex flex-col ${
							displayMode === "overlay" ? "drag-handle" : ""
						}`}
					>
						{displayMode === "overlay" && (
							<span className="text-xs text-gray-500 drag-handle">
								Drag to move
							</span>
						)}
					</div>
				</div>

				{/* Right side - Controls */}
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={handleModeToggle}
						className="h-7 w-7 hover:bg-gray-100 rounded-md"
						title={
							displayMode === "overlay"
								? t("tech.switch_to_panel_mode")
								: t("tech.switch_to_overlay_mode")
						}
					>
						{displayMode === "overlay" ? (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 14 14"
								fill="none"
							>
								<path
									d="M9.26667 1.83333V12.1667M1 2.69445C1 1.7433 1.77107 0.972229 2.72222 0.972229H11.3333C12.2845 0.972229 13.0556 1.74329 13.0556 2.69445V11.3056C13.0556 12.2567 12.2845 13.0278 11.3333 13.0278H2.72222C1.77107 13.0278 1 12.2567 1 11.3056V2.69445Z"
									stroke="#454545"
									stroke-width="1.03333"
									stroke-linecap="round"
								/>
							</svg>
						) : (
							<PictureInPicture2 className="h-3.5 w-3.5 text-gray-600" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleOpen}
						className="h-7 w-7 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
						title={t("tech.close")}
					>
						<PanelRightClose className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>
			<div className="border-b border-gray-200"></div>
		</>
	)
}
