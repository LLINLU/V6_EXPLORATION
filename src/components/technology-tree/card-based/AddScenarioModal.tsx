import { Loader2, Plus } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import type { ManualScenarioInput } from "@/types/ui"

export type { AIGenerationInput, ManualScenarioInput } from "@/types/ui"

interface AddScenarioModalProps {
	searchTheme: string
	treeMode: "TED" | "FAST"
	onAddScenario: (context: string) => Promise<void> // AI generation
	onAddManualScenario?: (input: ManualScenarioInput) => void // Manual input
}

export const AddScenarioModal: React.FC<AddScenarioModalProps> = ({
	searchTheme,
	treeMode,
	onAddScenario,
	onAddManualScenario,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai")

	// AI Generation state
	const [context, setContext] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	// Manual Input state
	const [manualName, setManualName] = useState("")
	const [manualSummary, setManualSummary] = useState("")

	const handleAISubmit = async () => {
		if (!context.trim()) {
			toast({
				title: "エラー",
				description: "追加の情報を入力してください。",
			})
			return
		}

		setIsLoading(true)
		try {
			await onAddScenario(context.trim())
			setContext("")
			setIsOpen(false)
		} catch (error) {
			console.error("[ADD_SCENARIO] Error:", error)
			toast({
				title: "エラー",
				description: "シナリオの追加に失敗しました。もう一度お試しください。",
			})
		} finally {
			setIsLoading(false)
		}
	}

	const handleManualSubmit = () => {
		if (!manualName.trim()) {
			toast({
				title: "エラー",
				description:
					treeMode === "FAST"
						? "実装方式の名前を入力してください。"
						: "シナリオの名前を入力してください。",
			})
			return
		}

		if (!manualSummary.trim()) {
			toast({
				title: "エラー",
				description: "概要を入力してください。",
			})
			return
		}

		if (onAddManualScenario) {
			onAddManualScenario({
				name: manualName.trim(),
				summary: manualSummary.trim(),
			})
			setManualName("")
			setManualSummary("")
			setIsOpen(false)
			toast({
				title: "成功",
				description:
					treeMode === "FAST"
						? "新しい実装方式を追加しました。"
						: "新しいシナリオを追加しました。",
			})
		}
	}

	const handleCancel = () => {
		setContext("")
		setManualName("")
		setManualSummary("")
		setIsOpen(false)
	}

	const modalTitle =
		treeMode === "FAST" ? "新しい実装方式を追加" : "新しいシナリオを追加"

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="h-full min-h-[200px] border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-gray-700 transition-colors"
				>
					<Plus className="h-8 w-8" />
					<span className="text-sm font-medium">
						{treeMode === "FAST" ? "実装方式を追加" : "シナリオを追加"}
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{modalTitle}</DialogTitle>
					<DialogDescription className="text-sm text-gray-600">
						{treeMode === "FAST" ? "技術シーズ" : "検索テーマ"}:{" "}
						<span className="font-medium text-gray-800">{searchTheme}</span>
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as "ai" | "manual")}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="ai">AIで生成</TabsTrigger>
						<TabsTrigger value="manual">手動入力</TabsTrigger>
					</TabsList>

					{/* AI Generation Tab */}
					<TabsContent value="ai" className="space-y-4 pt-4">
						<div className="space-y-2">
							<Label htmlFor="context" className="text-sm font-medium">
								追加の情報を入力してください
							</Label>
							<Textarea
								id="context"
								placeholder={
									treeMode === "FAST"
										? "新しい実装方式に関する具体的な要求や制約条件を入力してください..."
										: "新しいシナリオに関する具体的な用途や要求を入力してください..."
								}
								value={context}
								onChange={(e) => setContext(e.target.value)}
								className="min-h-[150px] resize-none"
								disabled={isLoading}
							/>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={handleCancel}
								disabled={isLoading}
							>
								キャンセル
							</Button>
							<Button
								onClick={handleAISubmit}
								disabled={isLoading || !context.trim()}
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										生成中...
									</>
								) : (
									"生成開始"
								)}
							</Button>
						</div>
					</TabsContent>

					{/* Manual Input Tab */}
					<TabsContent value="manual" className="space-y-4 pt-4">
						<div className="space-y-2">
							<Label htmlFor="manual-name" className="text-sm font-medium">
								{treeMode === "FAST" ? "実装方式の名前" : "シナリオの名前"}{" "}
								<span className="text-red-500">*</span>
							</Label>
							<Input
								id="manual-name"
								placeholder={
									treeMode === "FAST"
										? "例: リアルタイムビーム制御システム"
										: "例: 医療現場での遠隔触診"
								}
								value={manualName}
								onChange={(e) => setManualName(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="manual-summary" className="text-sm font-medium">
								概要 <span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="manual-summary"
								placeholder={
									treeMode === "FAST"
										? "この実装方式の概要を入力してください..."
										: "このシナリオの概要を入力してください..."
								}
								value={manualSummary}
								onChange={(e) => setManualSummary(e.target.value)}
								className="min-h-[120px] resize-none"
							/>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<Button variant="outline" onClick={handleCancel}>
								キャンセル
							</Button>
							<Button
								onClick={handleManualSubmit}
								disabled={!manualName.trim() || !manualSummary.trim()}
							>
								追加
							</Button>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
