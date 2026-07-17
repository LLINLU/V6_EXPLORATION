"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Check, RotateCcw, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type Step = 1 | 2 | 3

// ─── Mock data ────────────────────────────────────────────────

const SAMPLE_PROBLEM =
	"地球温暖化の暑さのせいで地域の人付き合いや活動が減り、それが生活の質を下げている"

const MOCK_ENRICHED = {
	sentence:
		"2035年の日本（都市部）において、猛暑による外出抑制が高齢者・子育て世帯の社会参加を減らし、地域コミュニティの希薄化と生活の質の低下を引き起こしている",
	where: "日本（特に都市部・郊外住宅地）",
	when: "2035年",
	who: "地域住民（特に高齢者・子育て世帯）",
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

function ProgressBar({ step }: { step: Step }) {
	const steps = [
		{ n: 1, label: "問題の精緻化" },
		{ n: 2, label: "ボトルネック分解" },
		{ n: 3, label: "解決シナリオ" },
	] as const

	return (
		<div className="sticky top-0 z-10 bg-white border-b border-gray-200">
			<div className="max-w-5xl mx-auto px-6 flex items-stretch h-14">
				{steps.map(({ n, label }, i) => {
					const done = n < step
					const active = n === step
					return (
						<div key={n} className="flex items-center flex-1">
							<div className={cn("flex items-center gap-2.5 py-4 flex-1", active && "opacity-100", !active && !done && "opacity-40")}>
								<div
									className={cn(
										"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
										done && "bg-[#1e293b] text-white",
										active && "bg-[#4f5fe0] text-white",
										!done && !active && "bg-gray-200 text-gray-500",
									)}
								>
									{done ? <Check className="w-3.5 h-3.5" /> : n}
								</div>
								<span
									className={cn(
										"text-sm font-medium whitespace-nowrap",
										active && "text-[#1e293b]",
										done && "text-[#1e293b]",
										!done && !active && "text-gray-400",
									)}
								>
									{label}
								</span>
							</div>
							{i < steps.length - 1 && (
								<div className={cn("w-8 h-px mx-2 shrink-0", done ? "bg-[#1e293b]" : "bg-gray-200")} />
							)}
						</div>
					)
				})}
			</div>
		</div>
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

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
	const [open, setOpen] = useState(defaultOpen)
	return (
		<div className="border border-gray-200 rounded-lg overflow-hidden">
			<button
				onClick={() => setOpen(!open)}
				className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
			>
				<span className="text-sm font-semibold text-[#1e293b]">{title}</span>
				{open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
			</button>
			{open && <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-white">{children}</div>}
		</div>
	)
}

// ─── Step 1 ───────────────────────────────────────────────────

function Step1({
	onDone,
}: {
	onDone: () => void
}) {
	const [input, setInput] = useState("")
	const [loading, setLoading] = useState(false)
	const [enriched, setEnriched] = useState(false)
	const [where, setWhere] = useState(MOCK_ENRICHED.where)
	const [when, setWhen] = useState(MOCK_ENRICHED.when)
	const [who, setWho] = useState(MOCK_ENRICHED.who)

	const runEnrich = (text: string) => {
		if (!text.trim()) return
		setLoading(true)
		setTimeout(() => {
			setLoading(false)
			setEnriched(true)
		}, 1600)
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			runEnrich(input)
		}
	}

	return (
		<div className="max-w-3xl mx-auto px-6 pb-16 pt-10">
			{/* Hero */}
			<div className="mb-10">
				<p className="text-xs font-semibold tracking-widest uppercase text-[#4f5fe0] mb-2">
					Scenario Exploration
				</p>
				<h1 className="text-2xl font-bold text-[#1e293b] mb-2">解決したい問題を入力してください</h1>
				<p className="text-sm text-gray-500">問題文を入力すると、コンテキストを補足・精緻化します</p>
			</div>

			{/* Search box */}
			<div className="mb-3">
				<div className="flex items-start gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#4f5fe0] transition-colors shadow-sm">
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={loading || enriched}
						placeholder="例：地球温暖化の暑さのせいで地域の人付き合いや活動が減り、それが生活の質を下げている"
						rows={2}
						className="flex-1 bg-transparent resize-none text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
					/>
					<button
						onClick={() => runEnrich(input)}
						disabled={!input.trim() || loading || enriched}
						className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-[#1e293b] hover:bg-[#2d3f55] disabled:bg-gray-200 transition-colors flex items-center justify-center"
					>
						<Search className="w-4 h-4 text-white" />
					</button>
				</div>
				<div className="flex items-center gap-3 mt-2 px-1">
					<button
						onClick={() => setInput(SAMPLE_PROBLEM)}
						disabled={enriched}
						className="text-xs text-[#4f5fe0] hover:underline disabled:opacity-40"
					>
						サンプル入力を使う
					</button>
					<span className="text-xs text-gray-300">·</span>
					<span className="text-xs text-gray-400">Enterで精緻化</span>
				</div>
			</div>

			{/* Loading */}
			{loading && (
				<div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg mb-6">
					<div className="w-4 h-4 border-2 border-[#4f5fe0] border-t-transparent rounded-full animate-spin shrink-0" />
					<span className="text-sm text-[#4f5fe0]">問題を分析・精緻化しています...</span>
				</div>
			)}

			{/* Enriched card */}
			{enriched && (
				<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
					<div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#f8fafc]">
						<span className="font-mono text-xs font-bold bg-[#1e293b] text-white px-2 py-0.5 rounded">
							STEP 1
						</span>
						<span className="text-sm font-semibold text-[#1e293b]">
							問題の精緻化 — 確認・編集してください
						</span>
					</div>
					<div className="p-5 space-y-4">
						{/* Enriched sentence */}
						<div className="text-sm text-gray-700 leading-relaxed border-l-4 border-[#4f5fe0] pl-4 py-1 bg-[#f5f6ff] rounded-r-lg">
							{MOCK_ENRICHED.sentence}
						</div>

						{/* WHERE / WHEN / WHO */}
						<div className="grid grid-cols-3 gap-3">
							{[
								{ label: "WHERE", val: where, set: setWhere },
								{ label: "WHEN", val: when, set: setWhen },
								{ label: "WHO", val: who, set: setWho },
							].map(({ label, val, set }) => (
								<div key={label}>
									<p className="font-mono text-xs text-[#4f5fe0] font-bold mb-1">{label}</p>
									<input
										value={val}
										onChange={(e) => set(e.target.value)}
										className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#4f5fe0] bg-white"
									/>
								</div>
							))}
						</div>

						{/* 3-axis accordions */}
						<div className="space-y-2">
							<Accordion title="技術の状態" defaultOpen>
								<p className="text-sm text-gray-600 leading-relaxed">{MOCK_ENRICHED.techState}</p>
							</Accordion>
							<Accordion title="規制・制度">
								<p className="text-sm text-gray-600 leading-relaxed">{MOCK_ENRICHED.regState}</p>
							</Accordion>
							<Accordion title="社会構造">
								<p className="text-sm text-gray-600 leading-relaxed">{MOCK_ENRICHED.socState}</p>
							</Accordion>
						</div>

						{/* Actions */}
						<div className="flex items-center justify-between pt-2">
							<button
								onClick={() => {
									setEnriched(false)
									setInput("")
								}}
								className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
							>
								<RotateCcw className="w-3.5 h-3.5" />
								リセット
							</button>
							<button
								onClick={onDone}
								className="inline-flex items-center gap-2 bg-[#1e293b] hover:bg-[#2d3f55] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
							>
								ボトルネック分解へ
								<ArrowRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

// ─── Step 2 ───────────────────────────────────────────────────

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

function Step2({ onDone }: { onDone: () => void }) {
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

// ─── Step 3 ───────────────────────────────────────────────────

function Step3({ onSelectScenario }: { onSelectScenario: (id: string) => void }) {
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
	const [step, setStep] = useState<Step>(1)

	return (
		<div className="min-h-screen bg-[#f9fafb]">
			{/* Back nav */}
			<div className="bg-white border-b border-gray-100 px-6 py-2.5">
				<button
					onClick={() => navigate("/")}
					className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					エントリーページへ戻る
				</button>
			</div>

			<ProgressBar step={step} />

			{step === 1 && <Step1 onDone={() => setStep(2)} />}
			{step === 2 && <Step2 onDone={() => setStep(3)} />}
			{step === 3 && (
				<Step3
					onSelectScenario={(id) => {
						navigate(`/v1/prioritization?from=problem&scenario=${id}`)
					}}
				/>
			)}
		</div>
	)
}
