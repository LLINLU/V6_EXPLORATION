import { ArrowUp, FileText, MessageSquare } from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

interface MindMapFullscreenNavProps {
	onToggleNavigation: () => void
	onToggleResearchPanel: () => void
	onToggleChatPanel?: () => void
	showResearchPanel: boolean
	showChatPanel?: boolean
	searchValue: string
	searchMode: "TED" | "FAST"
	isSearching: boolean
	onSearchValueChange: (value: string) => void
	onSearchModeChange: (mode: "TED" | "FAST") => void
	onSearchSubmit: (e: React.FormEvent) => void
}

export const MindMapFullscreenNav: React.FC<MindMapFullscreenNavProps> = ({
	onToggleNavigation,
	onToggleResearchPanel,
	onToggleChatPanel,
	showResearchPanel,
	showChatPanel = false,
	searchValue,
	searchMode,
	isSearching,
	onSearchValueChange,
	onSearchModeChange,
	onSearchSubmit,
}) => {
	const { t } = useTranslation()
	const getModeStyles = () => {
		if (searchMode === "TED") {
			return "bg-blue-50 text-blue-700"
		} else {
			return "bg-purple-50 text-purple-700"
		}
	}
	return (
		<nav className="flex items-center justify-between py-2 px-6 bg-white border-b border-gray-200 h-12 relative z-50">
			<div className="flex items-center">
				<span className="text-sm text-gray-500">{t("tech_page.mindmap")}</span>
			</div>

			{/* Search Bar */}
			<div className="flex-1 max-w-md mx-8">
				<form onSubmit={onSearchSubmit}>
					<div className="relative flex items-center border border-input rounded-md bg-background">
						<Input
							type="text"
							value={searchValue || ""}
							onChange={(e) => onSearchValueChange(e.target.value)}
							placeholder={t("tech_page.queryPlaceholder")}
							disabled={isSearching}
							className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-32 h-8"
						/>

						<div className="absolute right-8 flex items-center">
							<Select
								value={searchMode}
								onValueChange={onSearchModeChange}
								disabled={isSearching}
							>
								<SelectTrigger
									className={`h-6 w-auto border-0 rounded-full px-2 text-xs focus:ring-0 focus:ring-offset-0 ${getModeStyles()}`}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="TED">{t("tech_page.modeTed")}</SelectItem>
									<SelectItem value="FAST">
										{t("tech_page.modeFast")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Button
							type="submit"
							size="sm"
							disabled={isSearching || !(searchValue || "").trim()}
							className="absolute right-1 h-6 w-6 p-0 bg-transparent hover:bg-muted border-0 text-foreground"
						>
							{isSearching ? (
								<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-foreground"></div>
							) : (
								<ArrowUp className="h-3 w-3" />
							)}
						</Button>
					</div>
				</form>
			</div>

			<div className="flex items-center space-x-4">
				<TooltipProvider>
					{/* Chat Panel Toggle */}
					{onToggleChatPanel && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Toggle
									pressed={showChatPanel}
									onPressedChange={onToggleChatPanel}
									size="sm"
									className="flex items-center h-8 w-8 p-0 font-normal"
									aria-label="チャットパネルを切り替え"
								>
									<MessageSquare className="h-4 w-4" />
								</Toggle>
							</TooltipTrigger>
							<TooltipContent>
								<p className="text-xs">チャット</p>
							</TooltipContent>
						</Tooltip>
					)}

					{/* Research Panel Toggle */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Toggle
								pressed={showResearchPanel}
								onPressedChange={onToggleResearchPanel}
								size="sm"
								className="flex items-center h-8 w-8 p-0 font-normal"
								aria-label="リサーチパネルを切り替え"
							>
								<FileText className="h-4 w-4" strokeWidth={1.5} />
							</Toggle>
						</TooltipTrigger>
						<TooltipContent>
							<p>リサーチパネルを表示</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={onToggleNavigation}
							className="flex items-center gap-2"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								fill="#424242"
								viewBox="0 0 256 256"
							>
								<path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"></path>
							</svg>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<div className="flex flex-col items-center gap-1">
							<div className="flex items-center gap-1">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									fill="#595959"
									viewBox="0 0 256 256"
								>
									<path d="M116,116h24v24H116ZM86,72a14,14,0,0,0,0,28h14V86A14,14,0,0,0,86,72Zm98,14a14,14,0,0,0-28,0v14h14A14,14,0,0,0,184,86ZM72,170a14,14,0,0,0,28,0V156H86A14,14,0,0,0,72,170ZM224,48V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48Zm-68,92V116h14a30,30,0,1,0-30-30v14H116V86a30,30,0,1,0-30,30h14v24H86a30,30,0,1,0,30,30V156h24v14a30,30,0,1,0,30-30Zm0,30a14,14,0,1,0,14-14H156Z"></path>
								</svg>
								<span>＋</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									fill="#595959"
									viewBox="0 0 256 256"
								>
									<path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM187.31,187.31a8,8,0,0,1-11.31,0L68.69,80A8,8,0,0,1,80,68.69L187.31,176A8,8,0,0,1,187.31,187.31Z"></path>
								</svg>
							</div>
							<span>でナビゲーションバーの表示／非表示</span>
						</div>
					</TooltipContent>
				</Tooltip>
			</div>
		</nav>
	)
}
