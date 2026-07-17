"use client"

import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
	id: string
	role: "user" | "assistant"
	content: string
	timestamp: Date
}

const SCENARIO_LABELS: Record<string, string> = {
	s1: "高性能バッテリーの熱暴走を抑制し安全性を確保し続ける",
	s2: "高精度シミュレーションで新材料開発期間を大幅に短縮する",
	s3: "高周波デバイスの熱損失を低減し通信品質を維持し続ける",
	s4: "半導体パッケージの熱抵抗を低減し冷却効率を高め続ける",
	s5: "自動車用電動モーターの効率を最大化し航続距離を伸ばす",
	s6: "医療機器の放熱設計を最適化し小型化と信頼性を両立する",
}

const SUGGESTED_QUESTIONS = [
	"このシナリオの主要な技術リスクを教えてください",
	"競合他社はどのようなアプローチを取っていますか？",
	"自社の既存技術との相性を評価してください",
	"参入に向けた最初のマイルストーンは何ですか？",
]

function TypingDots() {
	return (
		<div className="flex items-center gap-1 px-4 py-3">
			{[0, 1, 2].map((i) => (
				<span
					key={i}
					className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
					style={{ animationDelay: `${i * 0.15}s` }}
				/>
			))}
		</div>
	)
}

function MessageBubble({ message }: { message: Message }) {
	const isUser = message.role === "user"
	return (
		<div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
			{!isUser && (
				<div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
					A
				</div>
			)}
			<div
				className={cn(
					"max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
					isUser
						? "bg-blue-600 text-white rounded-tr-sm"
						: "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm",
				)}
			>
				{message.content}
			</div>
		</div>
	)
}

export default function V1Chat() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const scenarioId = searchParams.get("scenario") ?? "s4"
	const scenarioLabel = SCENARIO_LABELS[scenarioId] ?? "選択シナリオ"

	const [messages, setMessages] = useState<Message[]>([
		{
			id: "init",
			role: "assistant",
			content: `「${scenarioLabel}」について壁打ちを始めましょう。このシナリオへの参入可否や優先度を一緒に検討します。どんな点が気になっていますか？自社の強み・リソース・懸念点など、何でもお聞かせください。`,
			timestamp: new Date(),
		},
	])
	const [input, setInput] = useState("")
	const [isStreaming, setIsStreaming] = useState(false)
	const [streamingContent, setStreamingContent] = useState("")
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages, streamingContent])

	const DEMO_REPLIES: Record<string, string> = {
		default: "なるほど。その点、既存の競合はどう対処していますか？自社が差別化できる具体的な要素が1つでもあれば、それが参入根拠になります。",
		"技術リスク":
			"主なリスクは3つです：①素材の量産スケーラビリティ（試験的成功を量産に転換する際の歩留まり）、②知財競合（既に主要特許は押さえられている可能性）、③顧客採用タイムライン（エンタープライズの調達サイクルは12〜18ヶ月）。どれが自社で最も不確実ですか？",
		"競合":
			"直接競合は欧米の大手材料メーカー2〜3社です。ただし彼らは大規模顧客向けに最適化しており、ニッチ・高頻度ユースケースには手が届いていない。そこが隙間です。自社がターゲットするセグメントと被りますか？",
		"自社": "自社技術との相性で見ると、既存の材料プロセス知見は直接転用できそうです。ただし評価測定系の整備が必要。これは内製可能ですか、それとも外部連携で補いますか？",
		"マイルストーン":
			"PoC → 技術検証 → パートナー開拓 → 量産試験 の順が王道です。最初の6ヶ月で「技術的に実現可能か」を証明することに集中し、その後に事業化の意思決定をするのが低リスクです。PoCに投じられるリソースはどの程度ですか？",
	}

	const getDemoReply = (text: string): string => {
		const lower = text
		if (lower.includes("リスク") || lower.includes("技術")) return DEMO_REPLIES["技術リスク"]
		if (lower.includes("競合") || lower.includes("他社")) return DEMO_REPLIES["競合"]
		if (lower.includes("自社") || lower.includes("強み")) return DEMO_REPLIES["自社"]
		if (lower.includes("マイルストーン") || lower.includes("最初")) return DEMO_REPLIES["マイルストーン"]
		return DEMO_REPLIES["default"]
	}

	const sendMessage = async (text: string) => {
		if (!text.trim() || isStreaming) return

		const userMsg: Message = {
			id: `u-${Date.now()}`,
			role: "user",
			content: text.trim(),
			timestamp: new Date(),
		}
		setMessages((prev) => [...prev, userMsg])
		setInput("")
		setIsStreaming(true)
		setStreamingContent("")

		const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY

		if (!apiKey) {
			// Demo mode: simulate streaming with pre-written responses
			const reply = getDemoReply(text)
			let i = 0
			const interval = setInterval(() => {
				i += Math.floor(Math.random() * 4) + 2
				setStreamingContent(reply.slice(0, i))
				if (i >= reply.length) {
					clearInterval(interval)
					setMessages((prev) => [
						...prev,
						{ id: `a-${Date.now()}`, role: "assistant", content: reply, timestamp: new Date() },
					])
					setStreamingContent("")
					setIsStreaming(false)
				}
			}, 30)
			return
		}

		try {
			const history = [...messages, userMsg].map((m) => ({
				role: m.role as "user" | "assistant",
				content: m.content,
			}))
			let accumulated = ""

			const res = await fetch("https://api.anthropic.com/v1/messages", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": apiKey,
					"anthropic-version": "2023-06-01",
					"anthropic-dangerous-direct-browser-access": "true",
				},
				body: JSON.stringify({
					model: "claude-opus-4-8",
					max_tokens: 1024,
					stream: true,
					system: `あなたは新規事業開発の専門家アドバイザーです。シナリオ「${scenarioLabel}」について壁打ちをしています。率直で実践的に。200字以内で。`,
					messages: history,
				}),
			})

			if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

			const reader = res.body.getReader()
			const decoder = new TextDecoder()

			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				const chunk = decoder.decode(value, { stream: true })
				for (const line of chunk.split("\n")) {
					if (!line.startsWith("data: ")) continue
					const data = line.slice(6).trim()
					if (data === "[DONE]") break
					try {
						const parsed = JSON.parse(data)
						if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
							accumulated += parsed.delta.text
							setStreamingContent(accumulated)
						}
					} catch {
						// skip malformed SSE line
					}
				}
			}

			setMessages((prev) => [
				...prev,
				{ id: `a-${Date.now()}`, role: "assistant", content: accumulated, timestamp: new Date() },
			])
			setStreamingContent("")
		} catch {
			setMessages((prev) => [
				...prev,
				{
					id: `err-${Date.now()}`,
					role: "assistant",
					content: "応答の取得に失敗しました。NEXT_PUBLIC_ANTHROPIC_API_KEY を .env.local に設定してください。",
					timestamp: new Date(),
				},
			])
			setStreamingContent("")
		} finally {
			setIsStreaming(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			sendMessage(input)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-4 py-3">
				<div className="max-w-2xl mx-auto flex items-center justify-between">
					<button
						onClick={() => navigate(-1)}
						className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						戻る
					</button>
					<div className="text-center">
						<p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
							壁打ち
						</p>
						<p className="text-sm font-medium text-gray-800 max-w-[280px] truncate">
							{scenarioLabel}
						</p>
					</div>
					<Button
						size="sm"
						onClick={() => navigate(`/v1/prioritization`)}
						className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
					>
						次のステップへ
						<ArrowRight className="w-3.5 h-3.5 ml-1" />
					</Button>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto py-6">
				<div className="max-w-2xl mx-auto px-4 space-y-4">
					{messages.map((msg) => (
						<MessageBubble key={msg.id} message={msg} />
					))}

					{isStreaming && streamingContent && (
						<div className="flex gap-3">
							<div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
								A
							</div>
							<div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm">
								{streamingContent}
							</div>
						</div>
					)}

					{isStreaming && !streamingContent && (
						<div className="flex gap-3">
							<div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
								A
							</div>
							<div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm">
								<TypingDots />
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Suggested questions */}
			{messages.length <= 2 && !isStreaming && (
				<div className="max-w-2xl mx-auto px-4 pb-3 w-full">
					<div className="flex flex-wrap gap-2">
						{SUGGESTED_QUESTIONS.map((q) => (
							<button
								key={q}
								onClick={() => sendMessage(q)}
								className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
							>
								{q}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Input */}
			<div className="bg-white border-t border-gray-200 px-4 py-3">
				<div className="max-w-2xl mx-auto">
					<div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-blue-400 transition-colors">
						<textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="シナリオについて質問や意見を入力… (Shift+Enterで改行)"
							rows={1}
							className="flex-1 bg-transparent resize-none text-sm text-gray-800 placeholder-gray-400 outline-none py-1 max-h-32"
							style={{ lineHeight: "1.5" }}
						/>
						<button
							onClick={() => sendMessage(input)}
							disabled={!input.trim() || isStreaming}
							className="shrink-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 transition-colors flex items-center justify-center"
						>
							{isStreaming ? (
								<Loader2 className="w-4 h-4 text-white animate-spin" />
							) : (
								<Send className="w-4 h-4 text-white" />
							)}
						</button>
					</div>
					<p className="text-xs text-gray-400 mt-1.5 text-center">
						Enterで送信 · Shift+Enterで改行
					</p>
				</div>
			</div>
		</div>
	)
}
