import type React from "react"
import {
	type ScenarioChatDisplayMode,
	ScenarioChatHeader,
} from "./ScenarioChatHeader"

interface ScenarioChatOverlayProps {
	displayMode: ScenarioChatDisplayMode
	isDragging: boolean
	position: { x: number; y: number }
	size: { width: number; height: number }
	elementRef: React.RefObject<HTMLDivElement>
	onToggleOpen: () => void
	onDisplayModeChange: (mode: ScenarioChatDisplayMode) => void
	onMouseDown: (e: React.MouseEvent) => void
	onResizeMouseDown: (e: React.MouseEvent) => void
	children?: React.ReactNode
}

export const ScenarioChatOverlay: React.FC<ScenarioChatOverlayProps> = ({
	displayMode,
	isDragging,
	position,
	size,
	elementRef,
	onToggleOpen,
	onDisplayModeChange,
	onMouseDown,
	onResizeMouseDown,
	children,
}) => {
	return (
		<div
			ref={elementRef}
			className={`fixed bg-white border flex flex-col z-50 overflow-hidden ${
				isDragging
					? "shadow-2xl border-blue-300 rounded-lg select-none"
					: "shadow-xl border-gray-200 rounded-lg"
			}`}
			style={{
				left: position.x,
				top: position.y,
				width: size.width,
				height: size.height,
				minWidth: 300,
				minHeight: 400,
				transition: isDragging ? "none" : undefined,
			}}
		>
			<ScenarioChatHeader
				toggleOpen={onToggleOpen}
				displayMode={displayMode}
				onDisplayModeChange={onDisplayModeChange}
				onMouseDown={onMouseDown}
				isDragging={isDragging}
			/>

			<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
				{/* Content will be passed as children - to be customized later */}
				{children || (
					<div className="flex-1 flex items-center justify-center p-4 text-gray-500">
						<p>チャット内容はここに表示されます</p>
					</div>
				)}
			</div>

			{/* Resize handle */}
			<div
				className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize bg-gray-300 hover:bg-gray-400 transition-colors"
				style={{
					clipPath: "polygon(100% 0%, 0% 100%, 100% 100%)",
				}}
				onMouseDown={onResizeMouseDown}
				title="ドラッグしてサイズ変更"
			/>
		</div>
	)
}
