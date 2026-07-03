"use client"

import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, ChevronDown, ChevronRight, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────
type MarketKey =
	| "energy"
	| "consumer"
	| "space"
	| "semi"
	| "measurement"
	| "auto"
	| "medical"
	| "telecom"
type TechLayerKey =
	| "material"
	| "process"
	| "evaluation"
	| "device"
	| "simulation"
type LifecyclePhase = "成長期" | "普及期" | "成熟期" | "衰退期"

type MockScenario = {
	id: string
	name: string
	description: string
	market: MarketKey
	techLayers: TechLayerKey[]
	tam: number
	cagr: number
	trl: number
	paperCagr: number
	patentCagr: number
	lifecycle: LifecyclePhase
	rationale: string
}

// ─── Static data ─────────────────────────────────────────
const MARKETS: {
	key: MarketKey
	label: string
	count: number
	color: string
}[] = [
	{ key: "energy", label: "エネルギー", count: 5, color: "#f59e0b" },
	{
		key: "consumer",
		label: "民生エレクトロニクス",
		count: 5,
		color: "#3b82f6",
	},
	{ key: "space", label: "宇宙・航空", count: 2, color: "#8b5cf6" },
	{ key: "semi", label: "半導体", count: 8, color: "#ef4444" },
	{ key: "measurement", label: "計測機器", count: 2, color: "#22c55e" },
	{ key: "auto", label: "車載", count: 5, color: "#f97316" },
	{ key: "medical", label: "医療", count: 2, color: "#ec4899" },
	{ key: "telecom", label: "通信・光", count: 2, color: "#14b8a6" },
]

const TECH_LAYERS: { key: TechLayerKey; label: string; count: number }[] = [
	{ key: "material", label: "素材技術", count: 26 },
	{ key: "process", label: "プロセス技術", count: 18 },
	{ key: "evaluation", label: "評価技術", count: 31 },
	{ key: "device", label: "デバイス設計", count: 8 },
	{ key: "simulation", label: "シミュレーション", count: 5 },
]

const MOCK_SCENARIOS: MockScenario[] = [
	{
		id: "s1",
		name: "高性能バッテリーの熱暴走を抑制し安全性を確保し続ける",
		description:
			"高エネルギー密度バッテリーの熱管理技術で安全性と性能を両立。急速充放電下での発熱を抑制し、次世代EVや定置型蓄電システムの信頼性を高める。",
		market: "energy",
		techLayers: ["material", "evaluation"],
		tam: 291,
		cagr: 32.9,
		trl: 3.0,
		paperCagr: 5.2,
		patentCagr: 7.1,
		lifecycle: "成長期",
		rationale:
			"市場規模291億$（大規模）、CAGR 32.9%の超高成長市場。再エネシフトとEV普及で蓄電需要が急拡大。早期参入でポジション確立が可能。TRL 3と基礎段階だが、先行企業が少なく差別化余地が大きい。",
	},
	{
		id: "s2",
		name: "高精度シミュレーションで新材料開発期間を大幅に短縮する",
		description:
			"マルチスケールシミュレーションで材料探索を加速し研究コストを削減。従来の試行錯誤型開発から脱却し、半導体・電池材料の設計期間を最大70%短縮する。",
		market: "consumer",
		techLayers: ["simulation", "evaluation"],
		tam: 1.4,
		cagr: 16.4,
		trl: 5.3,
		paperCagr: 4.4,
		patentCagr: 3.2,
		lifecycle: "成長期",
		rationale:
			"市場規模1.4億$（ニッチ）、年平均成長率16.4%の急成長市場。規模は大きくないが伸びが顕著で、早期参入で先行者利益が狙える。加えて自社技術融合性が高い環境。",
	},
	{
		id: "s3",
		name: "高周波デバイスの熱損失を低減し通信品質を維持し続ける",
		description:
			"5G/6G向け高周波デバイスの熱管理で信号品質と信頼性を確保。基地局および端末側の発熱問題を解決し、大容量通信の安定稼働を実現する。",
		market: "telecom",
		techLayers: ["device", "process"],
		tam: 473,
		cagr: 13.7,
		trl: 4.5,
		paperCagr: 6.1,
		patentCagr: 8.3,
		lifecycle: "普及期",
		rationale:
			"市場規模473億$（大規模）、CAGR 13.7%の安定成長市場。5G展開が続く中で参入機会は十分。特許出願が増加傾向にあり、早期確保が重要。",
	},
	{
		id: "s4",
		name: "半導体パッケージの熱抵抗を低減し冷却効率を高め続ける",
		description:
			"高集積半導体パッケージでは熱抵抗が増加し冷却効率低下が課題。本技術は新素材料利用での熱性制御を図る。",
		market: "semi",
		techLayers: ["material", "process", "evaluation"],
		tam: 396,
		cagr: 10.4,
		trl: 5.0,
		paperCagr: 3.89,
		patentCagr: 6.4,
		lifecycle: "成熟期",
		rationale:
			"市場の魅力度: 市場規模396億$（中規模）、年平均成長率10.4%の高成長系市場。規模感と成長性を両立し、賭ける価値が高い。参入タイミング: 特許CAGR 6.4%と実用化・塗り込みが混在の一方、論文CAGR 3.89%と基礎研究は一段落。TRL 6、後発は先行者優位に注意。",
	},
	{
		id: "s5",
		name: "自動車用電動モーターの効率を最大化し航続距離を伸ばす",
		description:
			"次世代モーター設計でEVの効率と航続距離を大幅に改善。希土類フリー永久磁石の採用とトポロジー最適化により、競合対比で15%以上の効率向上を目指す。",
		market: "auto",
		techLayers: ["material", "device"],
		tam: 521,
		cagr: 22.5,
		trl: 6.0,
		paperCagr: 8.4,
		patentCagr: 12.1,
		lifecycle: "成長期",
		rationale:
			"市場規模521億$（超大規模）、CAGR 22.5%の高成長市場。EV市場の急拡大が追い風。TRL 6と商業化フェーズに近く、短期での収益化が見込める。",
	},
	{
		id: "s6",
		name: "医療機器の放熱設計を最適化し小型化と信頼性を両立する",
		description:
			"ウェアラブル・植込み型デバイスの熱設計革新で小型化と安全性を確保。体温への影響を最小化しながら、24時間連続稼働を実現するための熱マネジメント技術。",
		market: "medical",
		techLayers: ["material", "device"],
		tam: 134,
		cagr: 18.9,
		trl: 4.0,
		paperCagr: 7.8,
		patentCagr: 6.2,
		lifecycle: "成長期",
		rationale:
			"市場規模134億$（中規模）、CAGR 18.9%の高成長市場。高齢化社会を背景にウェアラブル医療機器の需要が急増。規制要件が参入障壁となる反面、一度確立すれば強固な競争優位を築ける。",
	},
]

const TOTAL_SCENARIO_COUNT = 31

// ─── Helpers ─────────────────────────────────────────────
function getTRLVisual(trl: number) {
	if (trl <= 3)
		return (
			<span className="inline-flex gap-0.5 items-center">
				<span className="w-2.5 h-2.5 rounded-full border-2 border-blue-300" />
				<span className="w-2.5 h-2.5 rounded-full border-2 border-blue-200 opacity-40" />
			</span>
		)
	if (trl <= 6)
		return (
			<span className="inline-flex gap-0.5 items-center">
				<span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
				<span
					className="w-2.5 h-2.5 rounded-full border-2 border-blue-400"
					style={{
						background:
							"linear-gradient(90deg, #60a5fa 50%, transparent 50%)",
					}}
				/>
			</span>
		)
	return (
		<span className="inline-flex gap-0.5 items-center">
			<span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
			<span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
		</span>
	)
}

function getTRLCategory(trl: number) {
	if (trl <= 3) return { label: "基礎研究", color: "text-blue-400" }
	if (trl <= 6) return { label: "応用研究", color: "text-blue-600" }
	return { label: "商業化", color: "text-blue-800" }
}

function getLifecycleStyle(phase: LifecyclePhase) {
	switch (phase) {
		case "成長期":
			return "bg-green-100 text-green-700 border-green-200"
		case "普及期":
			return "bg-blue-100 text-blue-700 border-blue-200"
		case "成熟期":
			return "bg-orange-100 text-orange-700 border-orange-200"
		case "衰退期":
			return "bg-gray-100 text-gray-600 border-gray-200"
	}
}

function formatTam(tam: number) {
	if (tam < 10) return `${tam}億$`
	if (tam < 1000) return `${tam}億$`
	return `${(tam / 100).toFixed(0)}兆$`
}

// ─── Breadcrumb ───────────────────────────────────────────
type BreadcrumbProps = {
	step: number
	marketSummary: string
	techLayerSummary: string
	attractiveCount: number
	timingCount: number
}

function StepBreadcrumb({
	step,
	marketSummary,
	techLayerSummary,
	attractiveCount,
	timingCount,
}: BreadcrumbProps) {
	const steps = [
		{ num: 1, label: "市場", summary: marketSummary },
		{ num: 2, label: "技術レイヤー", summary: techLayerSummary },
		{
			num: 3,
			label: "魅力度",
			summary: attractiveCount > 0 ? `${attractiveCount}件` : "",
		},
		{
			num: 4,
			label: "タイミング",
			summary: timingCount > 0 ? `${timingCount}件` : "",
		},
		{ num: 5, label: "有望シナリオ", summary: "" },
	]

	return (
		<div className="flex items-center gap-1 flex-wrap">
			{steps.map((s, i) => {
				const isDone = step > s.num
				const isCurrent = step === s.num

				return (
					<div key={s.num} className="flex items-center gap-1">
						{isDone ? (
							<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
								<Check className="w-3 h-3" />
								{s.label}
								{s.summary && (
									<span className="text-gray-400 ml-0.5">{s.summary}</span>
								)}
							</span>
						) : isCurrent ? (
							<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
								{s.num} {s.label}
							</span>
						) : (
							<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-gray-400 border border-gray-200">
								{s.num} {s.label}
							</span>
						)}
						{i < steps.length - 1 && (
							<ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
						)}
					</div>
				)
			})}
		</div>
	)
}

// ─── Step 1: Market ───────────────────────────────────────
function Step1Market({
	selected,
	onChange,
	onNext,
}: {
	selected: Set<MarketKey>
	onChange: (k: MarketKey) => void
	onNext: () => void
}) {
	const total = selected.size === 0
		? TOTAL_SCENARIO_COUNT
		: MARKETS.filter((m) => selected.has(m.key)).reduce(
				(sum, m) => sum + m.count,
				0,
			)

	return (
		<div className="space-y-6">
			<div>
				<p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
					STEP 1 / 市場の魅力度評価
				</p>
				<h2 className="text-2xl font-bold text-gray-900">
					どの市場に関心がありますか？
				</h2>
				<p className="mt-2 text-sm text-gray-500 leading-relaxed">
					狙いたい産業を選んでください（複数可・未選択なら全市場が対象）。この後その市場のシナリオを規模と成長率で見ていきます。
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				{MARKETS.map((m) => {
					const active = selected.has(m.key)
					return (
						<button
							key={m.key}
							onClick={() => onChange(m.key)}
							className={cn(
								"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all",
								active
									? "border-transparent text-white"
									: "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
							)}
							style={active ? { backgroundColor: m.color } : {}}
						>
							<span
								className="w-2 h-2 rounded-full"
								style={{ backgroundColor: active ? "rgba(255,255,255,0.7)" : m.color }}
							/>
							{m.label}
							<span className={cn("ml-0.5 text-xs", active ? "text-white/70" : "text-gray-400")}>
								{m.count}
							</span>
						</button>
					)
				})}
			</div>

			<div className="pt-2 border-t border-gray-100 flex items-center justify-between">
				<p className="text-sm text-gray-500">
					{selected.size === 0 ? "全市場が対象" : `${selected.size}市場を選択中`}（{total}件）
				</p>
				<Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white">
					次へ →
				</Button>
			</div>
		</div>
	)
}

// ─── Step 2: Tech Layer ───────────────────────────────────
function Step2TechLayer({
	selected,
	onChange,
	onSelectAll,
	filteredCount,
	onBack,
	onNext,
}: {
	selected: Set<TechLayerKey>
	onChange: (k: TechLayerKey) => void
	onSelectAll: () => void
	filteredCount: number
	onBack: () => void
	onNext: () => void
}) {
	return (
		<div className="space-y-6">
			<div>
				<p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
					STEP 1 / 市場の魅力度評価
				</p>
				<h2 className="text-2xl font-bold text-gray-900">
					技術レイヤーで絞りますか？
				</h2>
				<p className="mt-2 text-sm text-gray-500 leading-relaxed">
					シナリオの実現に必要な技術を、素材からプロセス・デバイス設計・評価まで、バリューチェーンのレイヤーで分類しています。自社が関われるレイヤーで絞り込みます。こだわりがなければ「すべて」のまま次へ。
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				{TECH_LAYERS.map((t) => {
					const active = selected.has(t.key)
					return (
						<button
							key={t.key}
							onClick={() => onChange(t.key)}
							className={cn(
								"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
								active
									? "bg-blue-600 text-white border-blue-600"
									: "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
							)}
						>
							{t.label}
							<span className={cn("text-xs", active ? "text-blue-200" : "text-gray-400")}>
								{t.count}
							</span>
						</button>
					)
				})}
			</div>

			<button
				onClick={onSelectAll}
				className="text-sm text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
			>
				すべて選択
			</button>

			<div className="pt-2 border-t border-gray-100 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" onClick={onBack} className="text-sm">
						← 戻る
					</Button>
					<span className="text-sm text-gray-500">{filteredCount}件が対象</span>
				</div>
				<Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white">
					次へ →
				</Button>
			</div>
		</div>
	)
}

// ─── Step 3: Attractiveness ───────────────────────────────
type SortMode = "cagr" | "tam"
type TRLFilter = "all" | "low" | "mid" | "high"

function ScenarioAttractivenessCard({
	scenario,
	isSelected,
	onToggle,
}: {
	scenario: MockScenario
	isSelected: boolean
	onToggle: () => void
}) {
	const [rationaleOpen, setRationaleOpen] = useState(false)
	const market = MARKETS.find((m) => m.key === scenario.market)
	const { label: trlLabel } = getTRLCategory(scenario.trl)

	return (
		<div
			className={cn(
				"border rounded-lg p-4 transition-all cursor-pointer",
				isSelected
					? "border-blue-400 bg-blue-50"
					: "border-gray-200 bg-white hover:border-gray-300",
			)}
			onClick={onToggle}
		>
			<div className="flex items-start gap-3">
				<Checkbox
					checked={isSelected}
					onCheckedChange={onToggle}
					className="mt-0.5 shrink-0"
					onClick={(e) => e.stopPropagation()}
				/>
				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between gap-2">
						<h3 className="font-semibold text-sm text-gray-900 leading-snug">
							{scenario.name}
						</h3>
						<span className="text-lg font-bold text-gray-800 shrink-0 ml-2">
							{scenario.cagr}%
						</span>
					</div>

					<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
						{market && (
							<span
								className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium"
								style={{
									borderColor: market.color,
									color: market.color,
									backgroundColor: `${market.color}15`,
								}}
							>
								{market.label}
							</span>
						)}
						<span>TAM {formatTam(scenario.tam)}</span>
						<span>CAGR {scenario.cagr}%</span>
						<span className="inline-flex items-center gap-1">
							TRL {scenario.trl.toFixed(1)}
							{getTRLVisual(scenario.trl)}
							<span className={cn("text-xs", getTRLCategory(scenario.trl).color)}>
								{trlLabel}
							</span>
						</span>
					</div>

					<button
						className={cn(
							"mt-2 inline-flex items-center gap-1 text-xs font-medium transition-colors",
							rationaleOpen ? "text-blue-600" : "text-gray-400 hover:text-gray-600",
						)}
						onClick={(e) => {
							e.stopPropagation()
							setRationaleOpen((v) => !v)
						}}
					>
						選定理由
						<ChevronDown
							className={cn(
								"w-3 h-3 transition-transform",
								rationaleOpen ? "rotate-180" : "",
							)}
						/>
					</button>

					{rationaleOpen && (
						<div
							className={cn(
								"mt-2 p-3 rounded-md text-xs leading-relaxed",
								isSelected
									? "bg-blue-100 text-blue-800 border border-blue-200"
									: "bg-gray-50 text-gray-600 border border-gray-100",
							)}
						>
							{scenario.rationale}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function Step3Attractiveness({
	scenarios,
	selected,
	onToggle,
	onBack,
	onNext,
}: {
	scenarios: MockScenario[]
	selected: Set<string>
	onToggle: (id: string) => void
	onBack: () => void
	onNext: () => void
}) {
	const [sort, setSort] = useState<SortMode>("cagr")
	const [trlFilter, setTrlFilter] = useState<TRLFilter>("all")

	const filtered = useMemo(() => {
		let list = [...scenarios]
		if (trlFilter === "low") list = list.filter((s) => s.trl <= 3)
		else if (trlFilter === "mid") list = list.filter((s) => s.trl > 3 && s.trl <= 6)
		else if (trlFilter === "high") list = list.filter((s) => s.trl > 6)
		if (sort === "cagr") list.sort((a, b) => b.cagr - a.cagr)
		else list.sort((a, b) => b.tam - a.tam)
		return list
	}, [scenarios, sort, trlFilter])

	return (
		<div className="space-y-5">
			<div>
				<p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
					STEP 1 / 市場の魅力度評価
				</p>
				<h2 className="text-2xl font-bold text-gray-900">
					賭ける価値のあるシナリオは？
				</h2>
				<p className="mt-2 text-sm text-gray-500 leading-relaxed">
					なぜこの2指標か：「賭ける価値」は市場の大きさ（TAM）と伸び（CAGR）で決まります。小さくも急成長する市場、大きく安定した市場、それぞれ勝ち筋があります。迷いがある場合、シナリオを選んでください。各シナリオのTRL（義成技術の成熟度）も色分けで確認できます。
				</p>
			</div>

			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2 text-sm text-gray-500">
					<span>並び替え:</span>
					<button
						onClick={() => setSort("cagr")}
						className={cn(
							"px-2 py-0.5 rounded text-xs font-medium transition-colors",
							sort === "cagr"
								? "bg-gray-900 text-white"
								: "text-gray-500 hover:text-gray-700",
						)}
					>
						成長率
					</button>
					<span className="text-gray-300">|</span>
					<button
						onClick={() => setSort("tam")}
						className={cn(
							"px-2 py-0.5 rounded text-xs font-medium transition-colors",
							sort === "tam"
								? "bg-gray-900 text-white"
								: "text-gray-500 hover:text-gray-700",
						)}
					>
						市場規模
					</button>
				</div>

				<div className="flex items-center gap-1.5 text-xs text-gray-500">
					<span>TRL</span>
					{(
						[
							{ key: "all", label: "すべて" },
							{
								key: "low",
								label: (
									<span className="w-2 h-2 rounded-full border-2 border-blue-300 inline-block" />
								),
							},
							{
								key: "mid",
								label: (
									<span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
								),
							},
							{
								key: "high",
								label: (
									<span className="w-2 h-2 rounded-full bg-blue-700 inline-block" />
								),
							},
						] as { key: TRLFilter; label: React.ReactNode }[]
					).map((f) => (
						<button
							key={f.key}
							onClick={() => setTrlFilter(f.key)}
							className={cn(
								"px-2 py-0.5 rounded text-xs transition-colors",
								trlFilter === f.key
									? "bg-blue-100 text-blue-700 font-medium"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							{f.label}
						</button>
					))}
				</div>
			</div>

			<div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
				{filtered.map((s) => (
					<ScenarioAttractivenessCard
						key={s.id}
						scenario={s}
						isSelected={selected.has(s.id)}
						onToggle={() => onToggle(s.id)}
					/>
				))}
			</div>

			<div className="pt-2 border-t border-gray-100 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" onClick={onBack} className="text-sm">
						← 戻る
					</Button>
					<span className="text-sm text-gray-500">
						{selected.size > 0 ? `${selected.size}件選択中` : "未選択"}
					</span>
				</div>
				<Button
					onClick={onNext}
					disabled={selected.size === 0}
					className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
				>
					次へ →
				</Button>
			</div>
		</div>
	)
}

// ─── Step 4: Timing ───────────────────────────────────────
const LIFECYCLE_GRID: {
	phase: LifecyclePhase
	paperTrend: string
	patentTrend: string
	label: string
	col: number
	row: number
}[] = [
	{
		phase: "成長期",
		paperTrend: "論文↑",
		patentTrend: "特許↑",
		label: "参入好機",
		col: 0,
		row: 0,
	},
	{
		phase: "普及期",
		paperTrend: "論文→",
		patentTrend: "特許↑",
		label: "先行仕込み",
		col: 1,
		row: 0,
	},
	{
		phase: "成熟期",
		paperTrend: "論文↑",
		patentTrend: "特許→",
		label: "後発注意",
		col: 0,
		row: 1,
	},
	{
		phase: "衰退期",
		paperTrend: "論文↑",
		patentTrend: "特許↓",
		label: "見極め",
		col: 1,
		row: 1,
	},
]

function ScenarioTimingCard({
	scenario,
	isSelected,
	onToggle,
}: {
	scenario: MockScenario
	isSelected: boolean
	onToggle: () => void
}) {
	const [rationaleOpen, setRationaleOpen] = useState(false)
	const phaseStyle = getLifecycleStyle(scenario.lifecycle)

	return (
		<div
			className={cn(
				"border rounded-lg p-4 transition-all cursor-pointer",
				isSelected
					? "border-blue-400 bg-blue-50"
					: "border-gray-200 bg-white hover:border-gray-300",
			)}
			onClick={onToggle}
		>
			<div className="flex items-start gap-3">
				<Checkbox
					checked={isSelected}
					onCheckedChange={onToggle}
					className="mt-0.5 shrink-0"
					onClick={(e) => e.stopPropagation()}
				/>
				<div className="flex-1 min-w-0">
					<div className="flex items-start gap-2">
						<span
							className={cn(
								"inline-block px-2 py-0.5 rounded text-xs font-medium border shrink-0",
								phaseStyle,
							)}
						>
							{scenario.lifecycle}
						</span>
						<h3 className="font-semibold text-sm text-gray-900 leading-snug">
							{scenario.name}
						</h3>
					</div>

					<div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
						<span>論文CAGR {scenario.paperCagr.toFixed(2)}%</span>
						<span>特許CAGR {scenario.patentCagr.toFixed(2)}%</span>
					</div>

					<button
						className={cn(
							"mt-2 inline-flex items-center gap-1 text-xs font-medium transition-colors",
							rationaleOpen ? "text-blue-600" : "text-gray-400 hover:text-gray-600",
						)}
						onClick={(e) => {
							e.stopPropagation()
							setRationaleOpen((v) => !v)
						}}
					>
						選定理由
						<ChevronDown
							className={cn(
								"w-3 h-3 transition-transform",
								rationaleOpen ? "rotate-180" : "",
							)}
						/>
					</button>

					{rationaleOpen && (
						<div
							className={cn(
								"mt-2 p-3 rounded-md text-xs leading-relaxed",
								isSelected
									? "bg-blue-100 text-blue-800 border border-blue-200"
									: "bg-gray-50 text-gray-600 border border-gray-100",
							)}
						>
							{scenario.rationale}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function Step4Timing({
	scenarios,
	selected,
	onToggle,
	onSelectGrowth,
	onBack,
	onNext,
}: {
	scenarios: MockScenario[]
	selected: Set<string>
	onToggle: (id: string) => void
	onSelectGrowth: () => void
	onBack: () => void
	onNext: () => void
}) {
	return (
		<div className="space-y-5">
			<div>
				<p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
					STEP 2 / 参入タイミング評価
				</p>
				<h2 className="text-2xl font-bold text-gray-900">
					今が参入すべきタイミングは？
				</h2>
				<p className="mt-2 text-sm text-gray-500 leading-relaxed">
					なぜ論文と特許か：論文の伸びは基礎研究の動き、特許の伸びは実用化の動きを表します。両者の増減の組み合わせで、その技術が今のライフサイクル段階にあるかがわかります。「成長期」が参入好機です。
				</p>
			</div>

			{/* Lifecycle 2×2 grid */}
			<div className="grid grid-cols-2 gap-2">
				{LIFECYCLE_GRID.map((cell) => (
					<div
						key={cell.phase}
						className={cn(
							"p-3 rounded-lg border text-sm",
							cell.phase === "成長期"
								? "bg-green-50 border-green-200"
								: cell.phase === "普及期"
									? "bg-blue-50 border-blue-200"
									: cell.phase === "成熟期"
										? "bg-orange-50 border-orange-200"
										: "bg-gray-50 border-gray-200",
						)}
					>
						<div className="font-semibold text-gray-800 text-sm">{cell.phase}</div>
						<div className="text-xs text-gray-500 mt-0.5">
							{cell.paperTrend} {cell.patentTrend}
						</div>
						<div
							className={cn(
								"text-xs font-medium mt-1",
								cell.phase === "成長期"
									? "text-green-600"
									: cell.phase === "普及期"
										? "text-blue-600"
										: cell.phase === "成熟期"
											? "text-orange-600"
											: "text-gray-500",
							)}
						>
							{cell.label}
						</div>
					</div>
				))}
			</div>

			<button
				onClick={onSelectGrowth}
				className="text-sm text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline font-medium"
			>
				成長期をまとめて選択
			</button>

			<div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
				{scenarios.map((s) => (
					<ScenarioTimingCard
						key={s.id}
						scenario={s}
						isSelected={selected.has(s.id)}
						onToggle={() => onToggle(s.id)}
					/>
				))}
			</div>

			<div className="pt-2 border-t border-gray-100 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" onClick={onBack} className="text-sm">
						← 戻る
					</Button>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-sm text-gray-500">
						{selected.size > 0 ? `${selected.size}件選択` : "未選択"}
					</span>
					<Button
						onClick={onNext}
						disabled={selected.size === 0}
						className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
					>
						結果を見る →
					</Button>
				</div>
			</div>
		</div>
	)
}

// ─── Step 5: Results ──────────────────────────────────────
function Step5Results({
	scenarios,
	attractiveCount,
	onBack,
	onRestart,
	onGenerateReport,
}: {
	scenarios: MockScenario[]
	attractiveCount: number
	onBack: () => void
	onRestart: () => void
	onGenerateReport: (id: string) => void
}) {
	const [openRationale, setOpenRationale] = useState<Set<string>>(new Set())
	const avgCagr =
		scenarios.length > 0
			? (scenarios.reduce((sum, s) => sum + s.cagr, 0) / scenarios.length).toFixed(1)
			: 0

	return (
		<div className="space-y-5">
			<div>
				<p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
					✓ 有望シナリオ
				</p>
				<h2 className="text-2xl font-bold text-gray-900">
					{scenarios.length}件の有望シナリオが特定されました
				</h2>
				<p className="mt-2 text-sm text-gray-500 leading-relaxed">
					全市場を対象に、市場規模と成長率の観点から有望な{attractiveCount}
					件を選定。さらに参入タイミングを評価し、{scenarios.map((s) => s.lifecycle).join("・")}
					に該当する件を有望シナリオとして特定した。選定シナリオの平均成長率は{avgCagr}%。
				</p>
			</div>

			<div className="space-y-4">
				{scenarios.map((s) => {
					const market = MARKETS.find((m) => m.key === s.market)
					const isOpen = openRationale.has(s.id)
					return (
						<div
							key={s.id}
							className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm"
						>
							<div className="flex items-start gap-3 flex-wrap">
								{market && (
									<span
										className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
										style={{
											borderColor: market.color,
											color: market.color,
											backgroundColor: `${market.color}15`,
										}}
									>
										{market.label}
									</span>
								)}
								<span
									className={cn(
										"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
										getLifecycleStyle(s.lifecycle),
									)}
								>
									{s.lifecycle}
								</span>
								<span className="text-xs text-gray-500">
									TAM {formatTam(s.tam)}
								</span>
								<span className="text-xs text-gray-500">CAGR {s.cagr}%</span>
							</div>

							<h3 className="mt-3 font-bold text-base text-gray-900">{s.name}</h3>

							<div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
								<span>TRL {s.trl.toFixed(1)}</span>
								{getTRLVisual(s.trl)}
								<span className={getTRLCategory(s.trl).color}>
									{getTRLCategory(s.trl).label}
								</span>
							</div>

							<p className="mt-2 text-sm text-gray-600 leading-relaxed">
								{s.description}
							</p>

							<button
								onClick={() =>
									setOpenRationale((prev) => {
										const next = new Set(prev)
										if (next.has(s.id)) next.delete(s.id)
										else next.add(s.id)
										return next
									})
								}
								className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
							>
								選定理由を表示
								<ChevronDown
									className={cn(
										"w-3 h-3 transition-transform",
										isOpen ? "rotate-180" : "",
									)}
								/>
							</button>

							{isOpen && (
								<div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800 leading-relaxed">
									{s.rationale}
								</div>
							)}

							<div className="mt-4">
								<Button
									onClick={() => onGenerateReport(s.id)}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white"
								>
									詳細分析レポートを生成
								</Button>
							</div>
						</div>
					)
				})}
			</div>

			<div className="pt-2 border-t border-gray-100 flex items-center justify-between">
				<Button variant="outline" onClick={onBack} className="text-sm">
					← 戻る
				</Button>
				<button
					onClick={onRestart}
					className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
				>
					<RotateCcw className="w-3.5 h-3.5" />
					最初からやり直す
				</button>
			</div>
		</div>
	)
}

// ─── Main wizard ─────────────────────────────────────────
export default function V1Prioritization() {
	const navigate = useNavigate()
	const [step, setStep] = useState(1)
	const [selectedMarkets, setSelectedMarkets] = useState<Set<MarketKey>>(
		new Set(),
	)
	const [selectedTechLayers, setSelectedTechLayers] = useState<Set<TechLayerKey>>(
		new Set(TECH_LAYERS.map((t) => t.key)),
	)
	const [selectedAttractive, setSelectedAttractive] = useState<Set<string>>(
		new Set(),
	)
	const [selectedTiming, setSelectedTiming] = useState<Set<string>>(new Set())

	const marketFilteredScenarios = useMemo(() => {
		if (selectedMarkets.size === 0) return MOCK_SCENARIOS
		return MOCK_SCENARIOS.filter((s) => selectedMarkets.has(s.market))
	}, [selectedMarkets])

	const layerFilteredScenarios = useMemo(() => {
		if (
			selectedTechLayers.size === 0 ||
			selectedTechLayers.size === TECH_LAYERS.length
		)
			return marketFilteredScenarios
		return marketFilteredScenarios.filter((s) =>
			s.techLayers.some((t) => selectedTechLayers.has(t)),
		)
	}, [marketFilteredScenarios, selectedTechLayers])

	const attractiveScenarios = useMemo(
		() => layerFilteredScenarios.filter((s) => selectedAttractive.has(s.id)),
		[layerFilteredScenarios, selectedAttractive],
	)

	const timingScenarios = useMemo(
		() => attractiveScenarios.filter((s) => selectedTiming.has(s.id)),
		[attractiveScenarios, selectedTiming],
	)

	const marketSummary =
		selectedMarkets.size === 0
			? "未選択"
			: `${selectedMarkets.size}件`
	const techLayerSummary =
		selectedTechLayers.size === TECH_LAYERS.length ? "すべて" : `${selectedTechLayers.size}件`

	const toggleMarket = (k: MarketKey) => {
		setSelectedMarkets((prev) => {
			const next = new Set(prev)
			if (next.has(k)) next.delete(k)
			else next.add(k)
			return next
		})
	}

	const toggleTechLayer = (k: TechLayerKey) => {
		setSelectedTechLayers((prev) => {
			const next = new Set(prev)
			if (next.has(k)) next.delete(k)
			else next.add(k)
			return next
		})
	}

	const toggleAttractive = (id: string) => {
		setSelectedAttractive((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const toggleTiming = (id: string) => {
		setSelectedTiming((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const selectGrowthPhase = () => {
		const growthIds = attractiveScenarios
			.filter((s) => s.lifecycle === "成長期")
			.map((s) => s.id)
		setSelectedTiming(new Set(growthIds))
	}

	const restart = () => {
		setStep(1)
		setSelectedMarkets(new Set())
		setSelectedTechLayers(new Set(TECH_LAYERS.map((t) => t.key)))
		setSelectedAttractive(new Set())
		setSelectedTiming(new Set())
	}

	return (
		<div className="min-h-screen bg-gray-50 py-10 px-4">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-6">
					<p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1">
						Scenario Prioritization
					</p>
					<h1 className="text-3xl font-bold text-gray-900">有望シナリオ選定</h1>
				</div>

				{/* Breadcrumb */}
				<div className="mb-6">
					<StepBreadcrumb
						step={step}
						marketSummary={marketSummary}
						techLayerSummary={techLayerSummary}
						attractiveCount={selectedAttractive.size}
						timingCount={selectedTiming.size}
					/>
				</div>

				{/* Card */}
				<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
					{step === 1 && (
						<Step1Market
							selected={selectedMarkets}
							onChange={toggleMarket}
							onNext={() => setStep(2)}
						/>
					)}
					{step === 2 && (
						<Step2TechLayer
							selected={selectedTechLayers}
							onChange={toggleTechLayer}
							onSelectAll={() =>
								setSelectedTechLayers(new Set(TECH_LAYERS.map((t) => t.key)))
							}
							filteredCount={layerFilteredScenarios.length}
							onBack={() => setStep(1)}
							onNext={() => setStep(3)}
						/>
					)}
					{step === 3 && (
						<Step3Attractiveness
							scenarios={layerFilteredScenarios}
							selected={selectedAttractive}
							onToggle={toggleAttractive}
							onBack={() => setStep(2)}
							onNext={() => setStep(4)}
						/>
					)}
					{step === 4 && (
						<Step4Timing
							scenarios={attractiveScenarios}
							selected={selectedTiming}
							onToggle={toggleTiming}
							onSelectGrowth={selectGrowthPhase}
							onBack={() => setStep(3)}
							onNext={() => setStep(5)}
						/>
					)}
					{step === 5 && (
						<Step5Results
							scenarios={timingScenarios}
							attractiveCount={selectedAttractive.size}
							onBack={() => setStep(4)}
							onRestart={restart}
							onGenerateReport={(id) =>
								navigate(`/v1/chat?scenario=${id}`)
							}
						/>
					)}
				</div>
			</div>
		</div>
	)
}
