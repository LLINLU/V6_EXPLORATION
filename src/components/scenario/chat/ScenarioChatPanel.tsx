import type React from "react"
import {
	type ScenarioChatDisplayMode,
	ScenarioChatHeader,
} from "./ScenarioChatHeader"

interface ScenarioChatPanelProps {
	displayMode: ScenarioChatDisplayMode
	onToggleOpen: () => void
	onDisplayModeChange: (mode: ScenarioChatDisplayMode) => void
	children?: React.ReactNode
}

export const ScenarioChatPanel: React.FC<ScenarioChatPanelProps> = ({
	displayMode,
	onToggleOpen,
	onDisplayModeChange,
	children,
}) => {
	return (
		<div
			className="h-full flex flex-col overflow-hidden"
			style={{ backgroundColor: "#f9fafb" }}
			data-panel
		>
			<ScenarioChatHeader
				toggleOpen={onToggleOpen}
				displayMode={displayMode}
				onDisplayModeChange={onDisplayModeChange}
			/>

			<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
				{/* Content will be passed as children - to be customized later */}
				{children || (
					<div className="flex-1 flex items-center justify-center p-4 text-gray-500">
						<p>チャット内容はここに表示されます</p>
					</div>
				)}
			</div>
		</div>
	)
}
