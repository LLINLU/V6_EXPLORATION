import { Loader2 } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface AddNodeDialogProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description: string
	onTitleChange: (value: string) => void
	onDescriptionChange: (value: string) => void
	onSave: () => void
	onDirectSave: (title: string, description: string) => void
	onGuidanceClick?: (type: string) => void
}

export const AddNodeDialog: React.FC<AddNodeDialogProps> = ({
	isOpen,
	onOpenChange,
	title,
	description,
	onTitleChange,
	onDescriptionChange,
	onSave,
	onDirectSave,
}) => {
	const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai")
	const [aiContext, setAiContext] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const { toast } = useToast()

	const handleAISubmit = async () => {
		if (!aiContext.trim()) return
		setIsLoading(true)
		try {
			const { data, error } = await supabase.functions.invoke("chat-gpt", {
				body: {
					message: `あなたはFASTツリーの技術要素を提案するAIアシスタントです。\n\nユーザーの入力: ${aiContext}\n\n3つの技術要素を以下のJSON配列形式のみで回答してください（他のテキスト不要）:\n[{"title": "技術要素の名前（簡潔に20文字以内）", "description": "この技術要素の概要（100文字程度）"}, ...]`,
				},
			})
			if (error) throw error
			const text: string = data.response || ""
			const match = text.match(/\[[\s\S]*?\]/)
			if (match) {
				const parsed: Array<{ title?: string; description?: string }> =
					JSON.parse(match[0])
				for (const item of parsed) {
					onDirectSave(item.title || "", item.description || "")
				}
			} else {
				throw new Error("Invalid AI response format")
			}
		} catch (err) {
			console.error("AI generation failed:", err)
			toast({
				title: "エラー",
				description: "AI生成に失敗しました。手動で入力してください。",
			})
		} finally {
			setIsLoading(false)
			setAiContext("")
		}
	}

	const handleManualSubmit = () => {
		onSave()
	}

	const handleCancel = () => {
		setAiContext("")
		onOpenChange(false)
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>技術要素を追加</DialogTitle>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as "ai" | "manual")}
					className="w-full"
				>
					<div className="inline-flex items-center border border-gray-200 rounded-lg p-0.5 w-fit">
						<button
							type="button"
							onClick={() => setActiveTab("ai")}
							className={`px-3 py-1 text-xs rounded-md transition-colors ${
								activeTab === "ai"
									? "bg-blue-50 text-blue-600 font-medium"
									: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
							}`}
						>
							AIで生成
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("manual")}
							className={`px-3 py-1 text-xs rounded-md transition-colors ${
								activeTab === "manual"
									? "bg-blue-50 text-blue-600 font-medium"
									: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
							}`}
						>
							手動入力
						</button>
					</div>

					{/* AI Generation Tab */}
					<TabsContent value="ai" className="space-y-4 pt-4">
						<div className="space-y-2">
							<Label htmlFor="ai-context" className="text-sm font-medium">
								追加の情報を入力してください
							</Label>
							<Textarea
								id="ai-context"
								placeholder="新しいノードに関する具体的な用途や要求を入力してください..."
								value={aiContext}
								onChange={(e) => setAiContext(e.target.value)}
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
								className="bg-blue-600 hover:bg-blue-600/90 text-white"
								onClick={handleAISubmit}
								disabled={isLoading || !aiContext.trim()}
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
							<Label htmlFor="node-name" className="text-sm font-medium">
								技術要素の名前 <span className="text-red-500">*</span>
							</Label>
							<Input
								id="node-name"
								placeholder="例: リアルタイムビーム制御システム"
								value={title}
								onChange={(e) => onTitleChange(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="node-description" className="text-sm font-medium">
								概要 <span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="node-description"
								placeholder="このノードの概要を入力してください..."
								value={description}
								onChange={(e) => onDescriptionChange(e.target.value)}
								className="min-h-[120px] resize-none"
							/>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<Button variant="outline" onClick={handleCancel}>
								キャンセル
							</Button>
							<Button
								onClick={handleManualSubmit}
								disabled={!title.trim() || !description.trim()}
								className="bg-[rgba(38,99,235,0.9)] text-primary-foreground hover:bg-[rgba(38,99,235,0.8)]"
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
