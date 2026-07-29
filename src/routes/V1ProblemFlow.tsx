"use client"

import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

type Step = 1 | 2 | 3 | 4

// ─── Mock data ────────────────────────────────────────────────

const SAMPLE_PROBLEM =
	"地球温暖化の暑さのせいで地域の人付き合いや活動が減り、それが生活の質を下げている"

const MOCK_ENRICHED = {
	sentence:
		"2035年の日本（都市部）において、猛暑による外出抑制が高齢者・子育て世帯の社会参加を減らし、地域コミュニティの希薄化と生活の質の低下を引き起こしている",
	where: "日本（特に都市部・郊外住宅地）",
	when: "2035年",
	who: "地域住民（特に高齢者・子育て世帯）",
	what: "猛暑下における地域コミュニティ活動・社会参加の維持",
	techState:
		"2035年には屋外熱ストレス計測・スマート冷却技術が実用段階へ移行するが、普及率は地域差が大きく、低所得地域への展開は遅れる見込み。ウェアラブル熱センサーの普及率は60%超を予測（NEDO, 2024）。",
	regState:
		"ヒートアイランド対策を義務化する都市計画法改正が2028年頃施行見込み。気候変動適応法の地方自治体向けガイドラインも2026年改訂予定（環境省）。",
	socState:
		"単身高齢者世帯の割合は2035年に32%へ（国立社会保障・人口問題研究所, 2023）。暑熱による外出抑制がさらに孤立を深める悪循環が予測されている。",
}

type BN = {
	id: number
	axis: string
	axisColor: string
	name: string
	mechanism: string
	evidence: string
	sample: string
}

const BOTTLENECKS: BN[] = [
	{
		id: 1,
		axis: "技術的",
		axisColor: "#4f5fe0",
		name: "屋外空間冷却技術の精度・コスト問題",
		mechanism:
			"個人スケールでの熱緩和技術は実証段階にあるが、公共空間への大規模展開では単位面積あたりコストが$300/m²を超え、普及の経済障壁となっている。",
		evidence:
			"環境省「ヒートアイランド対策技術調査」(2023)：都市部のミスト冷却装置の設置費用が年間維持費込みで1スポット当たり平均120万円。",
		sample:
			"東京・新宿区のミスト設備は夏季3ヶ月で設置コスト回収が困難なため、実証事業どまりで恒久設置に至らないケースが多い。",
	},
	{
		id: 2,
		axis: "情報的",
		axisColor: "#2563eb",
		name: "個人熱リスクのリアルタイム通知手段が未整備",
		mechanism:
			"地域単位の気温情報は整備されているが、個人の行動パターン・既往症・年齢を組み合わせたパーソナライズドリスク通知の標準化が行われていない。",
		evidence:
			"消費者庁「熱中症対策に関する調査」(2024)：高齢者の72%が「外出時に熱中症リスクを判断する手段がない」と回答。",
		sample:
			"気象庁の熱中症アラートは都道府県単位での発報であり、屋内外の活動判断には粒度が粗すぎると地域包括支援センターが課題報告。",
	},
	{
		id: 3,
		axis: "経済的",
		axisColor: "#0891b2",
		name: "冷却環境整備コストの負担主体が未合意",
		mechanism:
			"涼しい地域活動拠点の整備・維持コストを公的機関・民間・住民のどこが担うかの合意形成が困難で、投資が先送りされ続ける。",
		evidence:
			"総務省「地域コミュニティ活性化調査」(2023)：自治会の86%が「活動場所の冷房費が財政を圧迫している」と回答。1自治会平均年間冷房費35万円。",
		sample:
			"大阪市では夏季の地域活動開催数が2015年比で41%減（市民局調査）。公民館の冷房代補助制度が縮小されたことが主因と指摘。",
	},
	{
		id: 4,
		axis: "オペレーション的",
		axisColor: "#059669",
		name: "デジタルデバイドによる高齢者へのリーチ不全",
		mechanism:
			"スマートフォンやアプリを前提とした熱対策サービスは、最も影響を受ける高齢者層（特に75歳以上）の低いデジタルリテラシーにより実効的なリーチができない。",
		evidence:
			"総務省「情報通信白書」(2024)：75歳以上のスマートフォン利用率は48%。熱中症対策アプリの利用率は同年齢層で6%以下。",
		sample:
			"環境省の熱中症対策アプリ「熱中症ゼロへ」のダウンロード数のうち65歳以上が占める割合は9%に留まる（2023年実績）。",
	},
	{
		id: 5,
		axis: "制度的",
		axisColor: "#7c3aed",
		name: "公共空間の緊急避暑利用に関する法的根拠の不明確さ",
		mechanism:
			"猛暑時に民間施設を公的避暑所として活用したり、公道上にミスト設備を設置したりするための法的根拠・責任規定が整備されておらず、実施に踏み切れない自治体が多い。",
		evidence:
			"国交省「都市の気候変動適応策に関する法制度調査」(2024)：自治体の64%が「道路占用許可のグレーゾーンが屋外冷却設備展開の障壁」と回答。",
		sample:
			"横浜市では商店街のミストトンネル設置に際し、道路占用許可取得に平均8ヶ月を要し、夏季展開に間に合わないケースが発生。",
	},
	{
		id: 6,
		axis: "社会的受容",
		axisColor: "#dc2626",
		name: "新技術への心理的抵抗と費用対効果論争",
		mechanism:
			"既存の打ち水・緑化などアナログ対策への慣れと愛着があり、新技術導入に対する住民の心理的抵抗が強い。加えて費用対効果の可視化が困難なため、行政内部での導入承認に時間がかかる。",
		evidence:
			"内閣府「気候変動適応技術に関する住民意識調査」(2024)：新技術導入に「積極的に賛成」は23%、「様子を見たい」が51%。特に60代以上で保守的傾向。",
		sample:
			"さいたま市の実証実験では、住民説明会を4回開催しても反対意見が解消されず、ラジアント冷却舗装の試験導入が1年延期された。",
	},
]

type Scenario = {
	id: string
	name: string
	summary: string
	axis: string
	axisColor: string
	tam: string
	cagr: string
	papers: number
	patents: number
	cases: number
	trl: number
}

const SCENARIOS: Scenario[] = [
	{
		id: "sc1",
		name: "屋外ミクロ気候制御システム",
		summary: "超高効率ミスト+遮熱舗装の統合センサー制御による公共空間冷却",
		axis: "技術的",
		axisColor: "#4f5fe0",
		tam: "1.8兆円",
		cagr: "19.4%",
		papers: 2140,
		patents: 847,
		cases: 23,
		trl: 5,
	},
	{
		id: "sc2",
		name: "個人熱ストレスモニタリングAI",
		summary: "ウェアラブル生体データ×気象情報の融合によるパーソナライズドリスク通知",
		axis: "情報的",
		axisColor: "#2563eb",
		tam: "0.9兆円",
		cagr: "26.1%",
		papers: 3820,
		patents: 1290,
		cases: 15,
		trl: 4,
	},
	{
		id: "sc3",
		name: "地域クーリングハブネットワーク",
		summary: "商業施設×コミュニティスペース連携による分散型避暑拠点の整備・運営",
		axis: "経済的",
		axisColor: "#0891b2",
		tam: "3.2兆円",
		cagr: "14.2%",
		papers: 1560,
		patents: 432,
		cases: 41,
		trl: 6,
	},
	{
		id: "sc4",
		name: "熱適応型コミュニティプラットフォーム",
		summary: "暑熱リスクスコアに基づく地域活動の時間帯最適化と近隣マッチング",
		axis: "オペレーション的",
		axisColor: "#059669",
		tam: "1.4兆円",
		cagr: "22.8%",
		papers: 940,
		patents: 213,
		cases: 8,
		trl: 3,
	},
	{
		id: "sc5",
		name: "スマート街路樹・緑化インフラ",
		summary: "AI水やり最適化と蒸散データ活用による都市緑化の冷却効果最大化",
		axis: "制度的",
		axisColor: "#7c3aed",
		tam: "2.1兆円",
		cagr: "17.3%",
		papers: 2870,
		patents: 1104,
		cases: 34,
		trl: 5,
	},
	{
		id: "sc6",
		name: "行政向け暑熱リスクダッシュボード",
		summary: "リアルタイム地域脆弱性マッピングによる熱中症対策の意思決定支援",
		axis: "社会的受容",
		axisColor: "#dc2626",
		tam: "0.6兆円",
		cagr: "31.2%",
		papers: 4200,
		patents: 2180,
		cases: 57,
		trl: 7,
	},
]

// ─── Sub-components ───────────────────────────────────────────

const SIDEBAR_STEPS = [
	{ n: 1, label: "テーマを決める" },
	{ n: 2, label: "問題文を固める" },
	{ n: 3, label: "全体像を調べる" },
	{ n: 4, label: "問題を洗い出す" },
	{ n: 5, label: "起点を選ぶ" },
	{ n: 6, label: "解決アプローチ" },
	{ n: 7, label: "技術分解" },
] as const

function StepSidebar({ active }: { active: number }) {
	return (
		<nav className="w-52 shrink-0 border-r border-gray-100 py-4 px-2 flex flex-col gap-0.5 overflow-y-auto">
			{SIDEBAR_STEPS.map(({ n, label }) => {
				const isActive = n === active
				return (
					<div
						key={n}
						className={cn(
							"flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap",
							isActive
								? "bg-[#eef0fd66] text-[#4f5fe0] font-semibold"
								: "text-gray-400 font-medium",
						)}
					>
						<span className={cn("font-mono text-[10px] w-3.5 shrink-0", isActive ? "text-[#4f5fe0]" : "text-gray-300")}>
							{n}
						</span>
						{label}
					</div>
				)
			})}
		</nav>
	)
}

function TrlBar({ trl }: { trl: number }) {
	return (
		<div className="flex items-center gap-0.5">
			{Array.from({ length: 9 }, (_, i) => {
				const level = i + 1
				const filled = level <= trl
				let color = "#EF4444"
				if (level >= 8) color = "#3B82F6"
				else if (level >= 6) color = "#F59E0B"
				return (
					<span
						key={i}
						className="rounded-sm"
						style={{
							width: 5,
							height: 10,
							background: filled ? color : "#e5e7eb",
						}}
					/>
				)
			})}
			<span className="ml-1.5 font-mono text-xs text-gray-500">{trl.toFixed(1)}</span>
		</div>
	)
}

function AxisBadge({ label, color }: { label: string; color: string }) {
	return (
		<span
			className="inline-block text-xs font-semibold px-2 py-0.5 rounded"
			style={{ background: `${color}18`, color }}
		>
			{label}
		</span>
	)
}


// ─── Step 1 ───────────────────────────────────────────────────

function Step1({
	input,
	setInput,
	extracted,
	setExtracted,
	onDone,
}: {
	input: string
	setInput: (v: string) => void
	extracted: boolean
	setExtracted: (v: boolean) => void
	onDone: () => void
}) {
	const [loading, setLoading] = useState(false)
	const [where, setWhere] = useState(MOCK_ENRICHED.where)
	const [when, setWhen] = useState(MOCK_ENRICHED.when)
	const [who, setWho] = useState(MOCK_ENRICHED.who)
	const [what, setWhat] = useState(MOCK_ENRICHED.what)

	const runExtract = (text: string) => {
		const trimmed = text.trim()
		if (!trimmed) return
		setLoading(true)
		setTimeout(() => {
			setLoading(false)
			if (trimmed === SAMPLE_PROBLEM) {
				setWhere(MOCK_ENRICHED.where)
				setWhen(MOCK_ENRICHED.when)
				setWho(MOCK_ENRICHED.who)
				setWhat(MOCK_ENRICHED.what)
			} else {
				setWhere("未指定")
				setWhen("未指定")
				setWho("未指定")
				setWhat(trimmed)
			}
			setExtracted(true)
		}, 900)
	}

	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		const el = textareaRef.current
		if (!el) return
		el.style.height = "auto"
		el.style.height = `${el.scrollHeight}px`
	}, [input])

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			runExtract(input)
		}
	}

	return (
		<div className="max-w-3xl mx-auto px-6 pb-16 pt-10">
			{/* Search box */}
			<h2 className="text-base font-semibold text-[#1e293b] mb-2">問題</h2>
			<div className="mb-3">
				<div className="p-5 border border-[#ebf0f7] rounded-2xl" style={{ backgroundColor: "#fbfbfb" }}>
					<div className="relative">
						<textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							disabled={loading}
							placeholder="例：地球温暖化の暑さのせいで地域の人付き合いや活動が減り、それが生活の質を下げている"
							rows={1}
							className="w-full resize-none overflow-hidden bg-gray-50 rounded-xl px-4 py-3 pr-12 text-sm text-gray-800 placeholder:text-gray-400 border-none outline-none focus-visible:ring-0 leading-relaxed"
						/>
						<Button
							onClick={() => runExtract(input)}
							size="icon"
							disabled={!input.trim() || loading}
							className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<ArrowUp className="h-4 w-4 text-gray-600" />
						</Button>
					</div>
				</div>
			</div>

			{/* Loading */}
			{loading && (
				<div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg mb-6">
					<div className="w-4 h-4 border-2 border-[#4f5fe0] border-t-transparent rounded-full animate-spin shrink-0" />
					<span className="text-sm text-[#4f5fe0]">4項目を抽出しています...</span>
				</div>
			)}

			{/* 4W confirmation (GATE 1) */}
			{extracted && (
				<div className="mb-6">
					<div className="mb-8">
						<span className="text-sm font-semibold text-[#1e293b]">抽出した4項目を確認してください</span>
						<p className="text-xs text-gray-500 mt-3">
							叩き台です。クリックして書き換えられます。確定すると次の「問題文を固める」に進みます。
						</p>
					</div>
					<div className="space-y-5">
						{[
							{ id: "where", label: "WHERE（国・地域）", val: where, set: setWhere },
							{ id: "when", label: "WHEN（年）", val: when, set: setWhen },
							{ id: "who", label: "WHO（当事者）", val: who, set: setWho },
							{ id: "what", label: "WHAT（活動・ドメイン）", val: what, set: setWhat },
						].map(({ id, label, val, set }) => (
							<div key={id} className="relative">
								<input
									id={`gate1-${id}`}
									value={val}
									onChange={(e) => set(e.target.value)}
									placeholder=" "
									className="peer w-full h-14 px-4 pt-3 text-base text-gray-900 bg-white rounded border border-[#dddfe2] outline-none transition-colors hover:border-[#93c5fd] focus:border-2 focus:border-[#4f5fe0] focus:hover:border-[#4f5fe0]"
								/>
								<label
									htmlFor={`gate1-${id}`}
									className="absolute left-3 -top-2.5 bg-white px-1 font-mono text-[11px] text-gray-500 peer-focus:text-[#4f5fe0] pointer-events-none"
								>
									{label}
								</label>
							</div>
						))}
						<div className="flex justify-end pt-2">
							<button
								onClick={onDone}
								className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
							>
								次へ
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

// ─── Step 2: 問題文を固める ─────────────────────────────────────

const MOCK_MEMO = [
	{
		text: "2035年には屋外熱ストレス計測・スマート冷却技術が実用段階へ移行するが、普及率は地域差が大きく、低所得地域への展開は遅れる見込み。ウェアラブル熱センサーの普及率は60%超を予測。",
		cite: "NEDO, 2024",
	},
	{
		text: "ヒートアイランド対策を義務化する都市計画法改正が2028年頃施行見込み。気候変動適応法の地方自治体向けガイドラインも2026年改訂予定。",
		cite: "環境省",
	},
	{
		text: "単身高齢者世帯の割合は2035年に32%へ。暑熱による外出抑制がさらに孤立を深める悪循環が予測されている。",
		cite: "国立社会保障・人口問題研究所, 2023",
	},
]

function Step2ProblemStatement({ onDone }: { onDone: () => void }) {
	const [loading, setLoading] = useState(false)
	const [enriched, setEnriched] = useState(false)
	const [problemText, setProblemText] = useState("")
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		const el = textareaRef.current
		if (!el) return
		el.style.height = "auto"
		el.style.height = `${el.scrollHeight}px`
	}, [problemText])

	const runEnrich = () => {
		setLoading(true)
		setTimeout(() => {
			setLoading(false)
			setProblemText(MOCK_ENRICHED.sentence)
			setEnriched(true)
		}, 1600)
	}

	return (
		<div className="max-w-3xl mx-auto px-6 pb-16 pt-10">
			<h2 className="text-lg font-bold text-[#1e293b] mb-1.5">問題文を固める</h2>
			<p className="text-sm text-gray-500 leading-relaxed mb-5">
				ここで作る問題文が、この先すべての調査の土台になります。あいまいなまま進むと分析全体がずれるため、まずweb調査で事実を確かめながら、問題を1文に固めます。下書きは自由に書き換えられます。
			</p>

			{!enriched && (
				<button
					onClick={runEnrich}
					disabled={loading}
					className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-default text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
				>
					{loading && <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
					{loading ? "調査中…（1〜2分）" : "調査して問題文を固める（1〜2分）"}
				</button>
			)}

			{enriched && (
				<>
					<div className="mt-6 pt-6 border-t border-dashed border-gray-200">
						<div className="mb-2">
							<span className="text-sm font-semibold text-[#1e293b]">問題文の下書き</span>
							<span className="text-xs text-gray-400 ml-2">クリックして書き換えられます</span>
						</div>
						<textarea
							ref={textareaRef}
							value={problemText}
							onChange={(e) => setProblemText(e.target.value)}
							rows={1}
							className="w-full resize-none overflow-hidden border border-[#c9cdf5] rounded-xl bg-[#fbfcfe] px-4 py-3.5 text-sm text-gray-800 leading-relaxed outline-none focus:border-[#4f5fe0] transition-colors"
						/>
					</div>

					<div className="mt-6">
						<div className="mb-2">
							<span className="text-sm font-semibold text-[#1e293b]">裏取りメモ</span>
							<span className="text-xs text-gray-400 ml-2">調査で確認した事実と出典</span>
						</div>
						<div className="flex flex-col gap-3">
							{MOCK_MEMO.map((m) => (
								<div key={m.cite} className="text-sm text-gray-600 leading-relaxed border-l-2 border-gray-200 pl-3">
									{m.text}{" "}
									<span className="font-mono text-[11px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 whitespace-nowrap">
										{m.cite}
									</span>
								</div>
							))}
						</div>
					</div>

					<div className="flex justify-end mt-6">
						<button
							onClick={onDone}
							className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
						>
							この問題文で確定 → 全体像を調べる
						</button>
					</div>
				</>
			)}
		</div>
	)
}

// ─── Step 3: ボトルネック分解 ────────────────────────────────────

const TOE_CARDS = [
	{ axis: "技術的", q: "技術的に可能か？", color: "#4f5fe0" },
	{ axis: "情報的", q: "それを証明できるか？", color: "#2563eb" },
	{ axis: "経済的", q: "割に合うか？", color: "#0891b2" },
	{ axis: "オペレーション的", q: "実際にやれるか？", color: "#059669" },
	{ axis: "制度的", q: "法的・制度的に許されるか？", color: "#7c3aed" },
	{ axis: "社会的受容", q: "信頼・受け入れられるか？", color: "#dc2626" },
]

function BnDetailRow({ bn }: { bn: BN }) {
	const [open, setOpen] = useState(false)
	return (
		<>
			<tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
				<td className="px-3 py-3 text-center">
					<input type="checkbox" defaultChecked className="rounded" />
				</td>
				<td className="px-3 py-3 font-mono text-xs text-gray-400">{String(bn.id).padStart(2, "0")}</td>
				<td className="px-3 py-3">
					<AxisBadge label={bn.axis} color={bn.axisColor} />
				</td>
				<td className="px-3 py-3 text-sm font-semibold text-[#1e293b]">{bn.name}</td>
				<td className="px-3 py-3 text-sm text-gray-600 leading-relaxed">{bn.mechanism}</td>
				<td className="px-3 py-3">
					<button
						onClick={() => setOpen(!open)}
						className="font-mono text-xs text-[#4f5fe0] hover:underline whitespace-nowrap"
					>
						{open ? "▲ 閉じる" : "▼ 根拠・事例"}
					</button>
				</td>
			</tr>
			{open && (
				<tr className="bg-[#f8fafc] border-b border-gray-100">
					<td colSpan={6} className="px-6 py-4">
						<div className="grid grid-cols-2 gap-3">
							<div className="bg-[#f0fdf4] border-l-2 border-[#16a34a] rounded-r-lg px-4 py-3">
								<p className="font-mono text-xs font-bold text-[#16a34a] mb-1.5">EVIDENCE</p>
								<p className="text-xs text-gray-700 leading-relaxed">{bn.evidence}</p>
							</div>
							<div className="bg-[#f0f9ff] border-l-2 border-[#0369a1] rounded-r-lg px-4 py-3">
								<p className="font-mono text-xs font-bold text-[#0369a1] mb-1.5">SAMPLE</p>
								<p className="text-xs text-gray-700 leading-relaxed">{bn.sample}</p>
							</div>
						</div>
					</td>
				</tr>
			)}
		</>
	)
}

function Step3({ onDone }: { onDone: () => void }) {
	return (
		<div className="max-w-5xl mx-auto px-6 pb-16 pt-8">
			{/* Problem callout */}
			<div className="border-l-4 border-[#1e293b] pl-4 mb-8">
				<p className="text-sm text-gray-500 mb-1">分析対象の問題</p>
				<p className="text-sm font-medium text-[#1e293b] leading-relaxed">
					{MOCK_ENRICHED.sentence}
				</p>
			</div>

			{/* TOE intro */}
			<div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
				<h3 className="text-base font-bold text-[#1e293b] mb-1.5">
					ボトルネックの構造分析 — TOEフレームワーク（6軸）
				</h3>
				<p className="text-xs text-gray-500 leading-relaxed mb-5">
					解決策の普及を決める要因は、技術（Technology）・組織（Organization）・環境（Environment）の3文脈に論理的に限られる（TOE: Tornatzky &amp; Fleischer, 1990）。
					各文脈を補完的な2側面に分割した計6軸で、未解決の原因を網羅的に洗い出す。
				</p>
				<div className="grid grid-cols-3 gap-3">
					{TOE_CARDS.map(({ axis, q, color }) => (
						<div
							key={axis}
							className="rounded-lg px-4 py-3 border"
							style={{ borderLeftColor: color, borderLeftWidth: 3, borderColor: "#e5e7eb", borderLeftStyle: "solid" }}
						>
							<p className="text-sm font-bold mb-0.5" style={{ color }}>{axis}</p>
							<p className="text-xs text-gray-500">{q}</p>
						</div>
					))}
				</div>
			</div>

			{/* BN table */}
			<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-[#1e293b] text-white">
								<th className="px-3 py-3 w-8">
									<input type="checkbox" defaultChecked className="rounded" />
								</th>
								<th className="px-3 py-3 font-mono text-xs w-10">#</th>
								<th className="px-3 py-3 text-xs font-semibold w-28">観点</th>
								<th className="px-3 py-3 text-xs font-semibold w-44">ボトルネック名</th>
								<th className="px-3 py-3 text-xs font-semibold">阻害のメカニズム</th>
								<th className="px-3 py-3 text-xs font-semibold w-24"></th>
							</tr>
						</thead>
						<tbody>
							{BOTTLENECKS.map((bn) => (
								<BnDetailRow key={bn.id} bn={bn} />
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="flex justify-end">
				<button
					onClick={onDone}
					className="inline-flex items-center gap-2 bg-[#1e293b] hover:bg-[#2d3f55] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
				>
					シナリオを調査
					<ArrowRight className="w-4 h-4" />
				</button>
			</div>
		</div>
	)
}

// ─── Step 4 ───────────────────────────────────────────────────

function Step4({ onSelectScenario }: { onSelectScenario: (id: string) => void }) {
	const [activeFilter, setActiveFilter] = useState<string | null>(null)

	const filters = ["すべて", ...Array.from(new Set(SCENARIOS.map((s) => s.axis)))]
	const filtered =
		!activeFilter || activeFilter === "すべて"
			? SCENARIOS
			: SCENARIOS.filter((s) => s.axis === activeFilter)

	return (
		<div className="max-w-5xl mx-auto px-6 pb-16 pt-8">
			<h3 className="text-xl font-bold text-[#1e293b] mb-1.5">解決シナリオ</h3>
			<p className="text-sm text-gray-500 mb-6">
				各ボトルネックを解消するシナリオをWeb検索で個別調査し、市場規模・成長率・研究動向・TRLを付与しました。
			</p>

			{/* TRL legend */}
			<div className="flex items-center gap-5 mb-3 justify-end">
				{[
					{ label: "TRL 8–9", color: "#3B82F6" },
					{ label: "TRL 6–7", color: "#F59E0B" },
					{ label: "TRL ≤5", color: "#EF4444" },
				].map(({ label, color }) => (
					<span key={label} className="flex items-center gap-1.5 font-mono text-xs text-gray-400">
						<span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
						{label}
					</span>
				))}
			</div>

			{/* Filter chips */}
			<div className="flex flex-wrap gap-2 mb-4">
				{filters.map((f) => (
					<button
						key={f}
						onClick={() => setActiveFilter(f === "すべて" ? null : f)}
						className={cn(
							"text-xs px-3 py-1.5 rounded-full border transition-colors font-medium",
							(f === "すべて" && !activeFilter) || f === activeFilter
								? "bg-[#1e293b] text-white border-[#1e293b]"
								: "bg-white text-gray-600 border-gray-200 hover:border-gray-400",
						)}
					>
						{f}
					</button>
				))}
			</div>

			{/* Scenario table */}
			<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-[#1e293b] text-white">
								<th className="px-3 py-3 font-mono text-xs w-8">#</th>
								<th className="px-4 py-3 text-xs font-semibold min-w-[160px]">シナリオ名</th>
								<th className="px-4 py-3 text-xs font-semibold min-w-[180px]">概要</th>
								<th className="px-3 py-3 text-xs font-semibold w-24">観点</th>
								<th className="px-3 py-3 text-xs font-semibold w-24">TAM</th>
								<th className="px-3 py-3 text-xs font-semibold w-16">CAGR</th>
								<th className="px-3 py-3 text-xs font-semibold w-12">論文</th>
								<th className="px-3 py-3 text-xs font-semibold w-12">特許</th>
								<th className="px-3 py-3 text-xs font-semibold w-12">事例</th>
								<th className="px-3 py-3 text-xs font-semibold w-32">TRL</th>
								<th className="px-3 py-3 w-10"></th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((sc, i) => (
								<tr
									key={sc.id}
									className="border-b border-gray-100 hover:bg-[#f5f6ff] transition-colors cursor-pointer group"
									onClick={() => onSelectScenario(sc.id)}
								>
									<td className="px-3 py-4 font-mono text-xs text-gray-400">{i + 1}</td>
									<td className="px-4 py-4 text-sm font-semibold text-[#1e293b] leading-snug">
										{sc.name}
									</td>
									<td className="px-4 py-4 text-xs text-gray-600 leading-relaxed">{sc.summary}</td>
									<td className="px-3 py-4">
										<AxisBadge label={sc.axis} color={sc.axisColor} />
									</td>
									<td className="px-3 py-4 font-mono text-xs font-bold text-[#1e293b]">{sc.tam}</td>
									<td className="px-3 py-4 font-mono text-xs text-[#059669] font-bold">{sc.cagr}</td>
									<td className="px-3 py-4 font-mono text-xs text-gray-700">{sc.papers.toLocaleString()}</td>
									<td className="px-3 py-4 font-mono text-xs text-gray-700">{sc.patents.toLocaleString()}</td>
									<td className="px-3 py-4 font-mono text-xs text-gray-700">{sc.cases}</td>
									<td className="px-3 py-4">
										<TrlBar trl={sc.trl} />
									</td>
									<td className="px-3 py-4">
										<ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#4f5fe0] transition-colors" />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<p className="text-xs text-center text-gray-400">
				行をクリックすると、そのシナリオで有望シナリオ選定ウィザードへ進みます
			</p>
		</div>
	)
}

// ─── Main ─────────────────────────────────────────────────────

export default function V1ProblemFlow() {
	const navigate = useNavigate()
	const location = useLocation()
	const incomingTheme = (location.state as { theme?: string } | null)?.theme?.trim()
	const [step, setStep] = useState<Step>(1)
	const [query, setQuery] = useState(incomingTheme || SAMPLE_PROBLEM)
	const [extracted, setExtracted] = useState(!!incomingTheme)
	const activeSidebarStep = step === 1 ? 1 : step === 2 ? 2 : step === 3 ? 4 : 6

	return (
		<SidebarProvider defaultOpen={false}>
		<div className="h-screen bg-gray-100 flex w-full">
			<AppSidebar />
		<div className="flex-1 min-w-0 flex flex-col gap-1 p-2">
			{/* Navbar */}
			<div className="flex-shrink-0 bg-white rounded-lg px-4 py-2 flex items-center justify-between gap-3">
				<div className="flex items-center shrink-0 w-[100px]">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => navigate("/")}
						className="h-8 w-8 text-gray-500 hover:text-gray-800"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<Button
						className="ask-ai-btn rounded-full px-[18px] text-white font-medium"
						style={{ height: "36px", width: "100px" }}
					>
						<span className="text-white font-medium">Ask AI</span>
					</Button>
				</div>
			</div>

			{/* Main body */}
			<div className="flex-1 min-h-0 overflow-hidden bg-white rounded-lg flex">
				<StepSidebar active={activeSidebarStep} />
				<div className="flex-1 min-h-0 overflow-y-auto">
					{step === 1 && (
						<Step1
							input={query}
							setInput={setQuery}
							extracted={extracted}
							setExtracted={setExtracted}
							onDone={() => setStep(2)}
						/>
					)}
					{step === 2 && <Step2ProblemStatement onDone={() => setStep(3)} />}
					{step === 3 && <Step3 onDone={() => setStep(4)} />}
					{step === 4 && (
						<Step4
							onSelectScenario={(id) => {
								navigate(`/v1/prioritization?from=problem&scenario=${id}`)
							}}
						/>
					)}
				</div>
			</div>
		</div>
		</div>
		</SidebarProvider>
	)
}
