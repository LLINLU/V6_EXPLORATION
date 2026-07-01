import {
	ScenarioChatBox,
	ScenarioChatContent,
	type ScenarioChatDisplayMode,
} from "@/components/scenario/chat"
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable"

type Props = {
	isChatOpen: boolean
	chatDisplayMode: ScenarioChatDisplayMode
	displayMode: "table" | "mindmap"
	setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>
	setChatDisplayMode: React.Dispatch<
		React.SetStateAction<ScenarioChatDisplayMode>
	>
}

export function ScenarioChatPanel({
	isChatOpen,
	chatDisplayMode,
	displayMode,
	setIsChatOpen,
	setChatDisplayMode,
}: Props) {
	if (!(isChatOpen && chatDisplayMode === "panel" && displayMode === "table")) {
		return null
	}

	return (
		<>
			<ResizableHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />
			<ResizablePanel
				id="scenario-chat-panel"
				order={3}
				defaultSize={25}
				minSize={20}
				maxSize={40}
				collapsible={true}
				collapsedSize={0}
				onCollapse={() => setIsChatOpen(false)}
				className="bg-white rounded-lg overflow-hidden"
			>
				<ScenarioChatBox
					isOpen={true}
					onToggleOpen={() => setIsChatOpen(false)}
					displayMode="panel"
					onDisplayModeChange={setChatDisplayMode}
				>
					<ScenarioChatContent />
				</ScenarioChatBox>
			</ResizablePanel>
		</>
	)
}
