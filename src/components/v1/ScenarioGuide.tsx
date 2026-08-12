import type React from "react"
import { useEffect, useState } from "react"
import { ScenarioSelectionMainLayout } from "@/components/scenario-selection/ScenarioSelectionMainLayout"
import type { Scenario } from "@/types/scenario"

// Design exploration: static category mappings for quantum computing scenarios
const IND: Record<string, string> = {
  s1: "医療",
  s2: "情報通信",
  s3: "計測機器",
  s4: "情報通信",
  s5: "情報通信",
  s6: "セキュリティ",
  s7: "金融",
}
const KF: Record<string, string> = {
  s1: "アルゴリズム",
  s2: "通信プロトコル",
  s3: "ハードウェア",
  s4: "ハードウェア",
  s5: "アルゴリズム",
  s6: "セキュリティ",
  s7: "アルゴリズム",
}

type TimingKey = "grow" | "dawn" | "mature" | "decline"

interface TimingInfo {
  label: string
  key: TimingKey
  bg: string
  text: string
  badgeStyle: React.CSSProperties
  selectedBadgeStyle: React.CSSProperties
}

const BADGE_COLOR = "#1f2937"

function getTimingInfo(paperCagr: number, patentCagr: number): TimingInfo {
  const ph = paperCagr >= 4.6
  const pth = patentCagr >= 5
  if (ph && pth) return { label: "成長期", key: "grow", bg: "bg-emerald-100", text: "text-emerald-700", badgeStyle: { backgroundColor: "#f3fdf8", color: BADGE_COLOR }, selectedBadgeStyle: { backgroundColor: "#cff7de", color: BADGE_COLOR } }
  if (ph && !pth) return { label: "黎明期", key: "dawn", bg: "bg-purple-100", text: "text-purple-700", badgeStyle: { backgroundColor: "#f5f3ff", color: BADGE_COLOR }, selectedBadgeStyle: { backgroundColor: "#f5f3ff", color: BADGE_COLOR } }
  if (!ph && pth) return { label: "成熟期", key: "mature", bg: "bg-amber-100", text: "text-amber-700", badgeStyle: { backgroundColor: "#fffbeb", color: BADGE_COLOR }, selectedBadgeStyle: { backgroundColor: "#fffbeb", color: BADGE_COLOR } }
  return { label: "衰退期", key: "decline", bg: "bg-red-100", text: "text-red-700", badgeStyle: { backgroundColor: "#fff1f2", color: BADGE_COLOR }, selectedBadgeStyle: { backgroundColor: "#fff1f2", color: BADGE_COLOR } }
}

function fmtTam(v: number) {
  return `${v.toFixed(1)}B$`
}

const STEPS = [
  { key: "market", label: "市場" },
  { key: "attract", label: "魅力度" },
  { key: "timing", label: "タイミング" },
  { key: "techLayer", label: "技術レイヤー" },
  { key: "result", label: "有望シナリオ" },
]

// Same 3-band grouping as the FAST tree map's TRL legend
// (基礎研究 1–3 / 実証段階 4–6 / 商業化済み 7–9), not a per-level rainbow.
const trlBandColor = (level: number) =>
  level <= 3 ? "#e8898f" : level <= 6 ? "#d9a63c" : "#6f93d1"

function TrlBar({ trl }: { trl: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 9 }, (_, i) => {
        const level = i + 1
        const filled = level <= trl
        return (
          <div
            key={i}
            className="h-1.5 rounded-sm flex-shrink-0"
            style={{ width: filled ? 7 : 4, background: filled ? trlBandColor(level) : "#f3f4f6" }}
          />
        )
      })}
      <span className="text-[10px] text-gray-400 ml-1">{trl}</span>
    </div>
  )
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div className={`w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
      checked ? "bg-blue-600 text-white" : "bg-white border border-gray-300"
    }`}>
      {checked && "✓"}
    </div>
  )
}

export function ScenarioGuide({ scenarios }: { scenarios: Scenario[] }) {
  const [step, setStep] = useState(0)
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set())
  const [selectedTechLayers, setSelectedTechLayers] = useState<Set<string>>(new Set())
  const [selectedAttract, setSelectedAttract] = useState<Set<string>>(new Set())
  const [selectedTiming, setSelectedTiming] = useState<Set<string>>(new Set())
  const [techLayersGenerated, setTechLayersGenerated] = useState(false)
  const [attractSort, setAttractSort] = useState<"cagr" | "tam">("cagr")
  const [resultView, setResultView] = useState<"card" | "table">("table")

  const allIndustries = Array.from(new Set(scenarios.map((s) => IND[s.id]).filter(Boolean)))
  const allTechLayers = Array.from(new Set(scenarios.map((s) => KF[s.id]).filter(Boolean)))

  // Skipping a step means "nothing narrowed" — the whole incoming pool carries forward.
  const afterMarket = scenarios.filter(
    (s) => selectedMarkets.size === 0 || selectedMarkets.has(IND[s.id])
  )
  const timingPool = selectedAttract.size === 0 ? afterMarket : afterMarket.filter((s) => selectedAttract.has(s.id))
  const afterTiming = selectedTiming.size === 0 ? timingPool : timingPool.filter((s) => selectedTiming.has(s.id))
  const finalScenarios = selectedTechLayers.size === 0 ? afterTiming : afterTiming.filter((s) => selectedTechLayers.has(KF[s.id]))

  // Changing an upstream filter (market/attract/timing) changes which scenarios feed the
  // tech-layer classification, so any previously generated layers are now stale.
  useEffect(() => {
    setTechLayersGenerated(false)
    setSelectedTechLayers(new Set())
  }, [selectedMarkets, selectedAttract, selectedTiming])

  function toggleSet<T>(prev: Set<T>, val: T): Set<T> {
    const next = new Set(prev)
    next.has(val) ? next.delete(val) : next.add(val)
    return next
  }

  // ── Step 1: Market ──
  const StepMarket = () => (
    <>
      <div className="text-base font-bold mb-1">どの市場に関心がありますか？</div>
      <div className="text-xs text-gray-500 leading-relaxed mb-4">
        狙いたい産業を選んでください（複数可）。未選択なら全市場が対象です。
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {allIndustries.map((ind) => {
          const count = scenarios.filter((s) => IND[s.id] === ind).length
          const on = selectedMarkets.has(ind)
          return (
            <button
              key={ind}
              onClick={() => setSelectedMarkets(toggleSet(selectedMarkets, ind))}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                on
                  ? "border-blue-500 bg-blue-50 text-blue-700 font-normal"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {ind}
              <span className={`text-[10px] ${on ? "text-blue-400" : "text-gray-400"}`}>{count}</span>
            </button>
          )
        })}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {selectedMarkets.size > 0 ? (
            <><b className="text-gray-800">{selectedMarkets.size}</b> 市場を選択（{afterMarket.length}件）</>
          ) : (
            `全市場が対象（${scenarios.length}件）`
          )}
        </span>
        <button onClick={() => setStep(1)} className="bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
          次へ →
        </button>
      </div>
    </>
  )

  // ── Step 2: Attractiveness ──
  const StepAttract = () => {
    const pool = [...afterMarket].sort((a, b) =>
      attractSort === "tam"
        ? (b.metrics?.tam ?? 0) - (a.metrics?.tam ?? 0)
        : (b.metrics?.cagr ?? 0) - (a.metrics?.cagr ?? 0)
    )
    const toggleAttract = (id: string) => {
      setSelectedAttract(toggleSet(selectedAttract, id))
    }
    return (
      <>
        <div className="text-base font-bold mb-1">賭ける価値のあるシナリオは？</div>
        <div className="text-xs text-gray-500 leading-relaxed mb-3">
          市場の大きさ（TAM）と伸び（CAGR）で判断してください。各シナリオのTRLも色分けで確認できます。
        </div>
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          並び替え：
          {(["cagr", "tam"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setAttractSort(s)}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                attractSort === s
                  ? "border-blue-500 bg-blue-50 text-blue-700 font-normal"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              {s === "cagr" ? "成長率" : "市場規模"}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 mb-3">
          {pool.map((s) => {
            const on = selectedAttract.has(s.id)
            const primary = attractSort === "tam" ? fmtTam(s.metrics?.tam ?? 0) : `${s.metrics?.cagr ?? 0}%`
            const primaryLabel = attractSort === "tam" ? "TAM" : "CAGR"
            return (
              <div
                key={s.id}
                onClick={() => toggleAttract(s.id)}
                className={`grid gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  on ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                style={{ gridTemplateColumns: "20px 1fr auto" }}
              >
                <CheckBox checked={on} />
                <div>
                  <div className="text-xs font-semibold text-gray-800 leading-snug mb-1.5">{s.name}</div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{IND[s.id]}</span>
                    <span className="text-[10px] text-gray-500">TAM {fmtTam(s.metrics?.tam ?? 0)}</span>
                    <span className="text-[10px] text-gray-500">CAGR {s.metrics?.cagr ?? 0}%</span>
                  </div>
                  <TrlBar trl={s.metrics?.trl ?? 0} />
                </div>
                <div className="text-right flex-shrink-0 self-start">
                  <div className="text-base font-bold text-blue-600">{primary}</div>
                  <div className="text-[10px] text-gray-400">{primaryLabel}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button onClick={() => setStep(0)} className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-300 transition-colors">
            ← 戻る
          </button>
          <span className="text-xs text-gray-500">
            {selectedAttract.size > 0 ? (
              <><b className="text-gray-800">{selectedAttract.size}</b> 件選択</>
            ) : (
              `すべて対象（${pool.length}件）`
            )}
          </span>
          <button
            onClick={() => setStep(2)}
            className="bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
          >
            次へ →
          </button>
        </div>
      </>
    )
  }

  // ── Step 4: Timing ──
  const StepTiming = () => {
    const ORDER: Record<TimingKey, number> = { grow: 0, dawn: 1, mature: 2, decline: 3 }
    const sorted = [...timingPool].sort((a, b) => {
      const ta = getTimingInfo(a.metrics?.papers?.cagr ?? 0, a.metrics?.patents?.cagr ?? 0)
      const tb = getTimingInfo(b.metrics?.papers?.cagr ?? 0, b.metrics?.patents?.cagr ?? 0)
      return ORDER[ta.key] - ORDER[tb.key]
    })
    const toggleTiming = (id: string) => {
      setSelectedTiming(toggleSet(selectedTiming, id))
    }
    return (
      <>
        <div className="text-base font-bold mb-1">今が参入すべきタイミングは？</div>
        <div className="text-xs text-gray-500 leading-relaxed mb-3">
          論文の伸びは基礎研究の勢い、特許の伸びは実用化の勢いを表します。「成長期」が参入好機です。
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { label: "成長期", sub: "論文↑・特許↑ 参入好機", bg: "", style: { backgroundColor: "#f3fdf8" } },
            { label: "黎明期", sub: "論文↑・特許→ 先行仕込み", bg: "bg-purple-50", style: {} },
            { label: "成熟期", sub: "論文→・特許↑ 後発注意", bg: "bg-amber-50", style: {} },
            { label: "衰退期", sub: "論文↓・特許↓ 見極め", bg: "bg-red-50", style: {} },
          ].map((t) => (
            <span key={t.label} className={`${t.bg} rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap`} style={{ color: "#1f2937", ...t.style }}>
              {t.label}
              <span className="font-normal opacity-70 ml-1">{t.sub}</span>
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-2 mb-3">
          {sorted.map((s) => {
            const on = selectedTiming.has(s.id)
            const timing = getTimingInfo(s.metrics?.papers?.cagr ?? 0, s.metrics?.patents?.cagr ?? 0)
            return (
              <div
                key={s.id}
                onClick={() => toggleTiming(s.id)}
                className={`grid gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  on ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                style={{ gridTemplateColumns: "20px 1fr auto" }}
              >
                <CheckBox checked={on} />
                <div>
                  <div className="text-xs font-semibold text-gray-800 leading-snug mb-1.5">{s.name}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-gray-500">論文CAGR {s.metrics?.papers?.cagr ?? 0}%</span>
                    <span className="text-[10px] text-gray-500">特許CAGR {s.metrics?.patents?.cagr ?? 0}%</span>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 self-start" style={on ? timing.selectedBadgeStyle : timing.badgeStyle}>
                  {timing.label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button onClick={() => setStep(1)} className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-300 transition-colors">
            ← 戻る
          </button>
          <span className="text-xs text-gray-500">
            {selectedTiming.size > 0 ? (
              <><b className="text-gray-800">{selectedTiming.size}</b> 件選択</>
            ) : (
              `すべて対象（${sorted.length}件）`
            )}
          </span>
          <button
            onClick={() => setStep(3)}
            className="bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
          >
            次へ →
          </button>
        </div>
      </>
    )
  }

  // ── Step 4: Tech Layer ──
  const StepTechLayer = () => {
    const [generating, setGenerating] = useState(false)
    const generated = techLayersGenerated
    const [progressIndex, setProgressIndex] = useState(-1)

    const toggleTechLayer = (kf: string) => {
      setSelectedTechLayers(toggleSet(selectedTechLayers, kf))
    }

    const runGenerate = () => {
      setGenerating(true)
      const total = afterTiming.length
      const stepDelay = total > 0 ? 30000 / total : 30000
      let i = 0
      const advance = () => {
        if (i >= total) {
          setGenerating(false)
          setTechLayersGenerated(true)
          setProgressIndex(-1)
          return
        }
        setProgressIndex(i)
        i += 1
        setTimeout(advance, stepDelay)
      }
      advance()
    }

    return (
    <>
      <div className="text-base font-bold mb-1">どの技術レイヤーに関心がありますか？</div>
      <div className="text-xs text-gray-400 mb-2">任意のステップです。不要ならスキップして構いません</div>
      <div className="text-xs text-gray-500 leading-relaxed mb-4">
        技術レイヤーは、選択した各シナリオの「コア技術」を構成技術に分解し、その分解結果をもとに分類したものです。狙いたいレイヤーに絞り込むことで、関心のある技術領域のシナリオだけに集中できます。
        分類には各シナリオのコア技術のファストツリーを個別に生成してから判定する必要があるため、少し時間がかかります。
      </div>

      {!generated && !generating && (
        <div className="mb-4">
          <button
            onClick={runGenerate}
            className="inline-flex items-center gap-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-normal px-4 py-2 rounded-md transition-colors"
          >
            技術レイヤーを生成する
          </button>
        </div>
      )}

      {generating && (
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-700">技術レイヤーを生成しています（約10分）</div>
            <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              生成が終わるまでお待ちいただく必要はありません。その間、他のタブ（概観・シナリオ一覧など）で各シナリオの詳細をご確認いただけます。
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
            {afterTiming.map((s, i) => {
              const state = i < progressIndex ? "done" : i === progressIndex ? "running" : "pending"
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-2.5 px-4 py-2 text-xs ${state === "pending" ? "text-gray-400" : "text-gray-700"}`}
                >
                  <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {state === "done" && <span className="text-green-600">✓</span>}
                    {state === "running" && (
                      <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {state === "pending" && <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                  </span>
                  <span className="flex-1 truncate">
                    {s.name} — コア技術を構成技術に分解{state === "done" ? "しました" : "中…"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {generated && (
        <div className="flex flex-wrap gap-2 mb-4">
          {allTechLayers.map((kf) => {
            const count = afterTiming.filter((s) => KF[s.id] === kf).length
            const on = selectedTechLayers.has(kf)
            return (
              <button
                key={kf}
                onClick={() => toggleTechLayer(kf)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  on
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-normal"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {kf}
                <span className={`text-[10px] ${on ? "text-blue-400" : "text-gray-400"}`}>{count}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button onClick={() => setStep(2)} className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-300 transition-colors">
          ← 戻る
        </button>
        <span className="text-xs text-gray-500">
          {selectedTechLayers.size > 0 ? (
            <><b className="text-gray-800">{selectedTechLayers.size}</b> レイヤーを選択（{finalScenarios.length}件）</>
          ) : (
            `全レイヤーが対象（${afterTiming.length}件）`
          )}
        </span>
        <button onClick={() => setStep(4)} className="bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
          結果を見る →
        </button>
      </div>
    </>
    )
  }

  // ── Step 5: Result ──
  const StepResult = () => (
    <>
      <div className="text-base font-bold mb-3">{finalScenarios.length}件の有望シナリオが特定されました</div>
      <div className="border-l-2 border-blue-500 bg-gray-50 rounded-r-md pl-3 pr-3 py-2.5 mb-4 text-xs text-gray-600 leading-relaxed">
        {selectedMarkets.size > 0 ? [...selectedMarkets].join("・") : "全市場"}を対象に、
        市場規模と成長率の観点から{timingPool.length}件を選定。
        参入タイミングと技術レイヤーを評価し、{finalScenarios.length}件の有望シナリオを特定しました。
      </div>

      <div className="border-t border-gray-200 mb-4 -mx-4" />

      {/* View toggle */}
      <div className="flex items-center gap-1 mb-3 bg-gray-100 rounded-lg p-0.5 w-fit">
        {(["card", "table"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setResultView(v)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${
              resultView === v ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {v === "card" ? "カード" : "テーブル"}
          </button>
        ))}
      </div>

      {resultView === "card" ? (
        <div className="flex flex-col gap-2 mb-4">
          {finalScenarios.map((s) => {
            const timing = getTimingInfo(s.metrics?.papers?.cagr ?? 0, s.metrics?.patents?.cagr ?? 0)
            return (
              <div key={s.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="text-xs font-semibold text-gray-900 mb-2 leading-snug">{s.name}</div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{IND[s.id]}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={timing.badgeStyle}>
                    {timing.label}
                  </span>
                  <span className="text-[10px] text-gray-500">TAM {fmtTam(s.metrics?.tam ?? 0)}</span>
                  <span className="text-[10px] text-gray-500">CAGR {s.metrics?.cagr ?? 0}%</span>
                </div>
                <TrlBar trl={s.metrics?.trl ?? 0} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mb-4 -mx-4">
          <ScenarioSelectionMainLayout
            scenarios={finalScenarios}
            treeId="v1-guide-result"
            technicalStrengths={[]}
            query=""
            effectiveMode="FAST"
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button onClick={() => setStep(3)} className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-300 transition-colors">
          ← 戻る
        </button>
        <button
          onClick={() => {
            setStep(0)
            setSelectedMarkets(new Set())
            setSelectedTechLayers(new Set())
            setSelectedAttract(new Set())
            setSelectedTiming(new Set())
            setTechLayersGenerated(false)
          }}
          className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-300 transition-colors"
        >
          最初からやり直す
        </button>
      </div>
    </>
  )

  const stepContent = [<StepMarket />, <StepAttract />, <StepTiming />, <StepTechLayer />, <StepResult />]

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {/* Stepper */}
        <div className="flex items-center mb-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              {/* Circle + label */}
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setStep(i)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                  i === step
                    ? "bg-blue-600 text-white"
                    : i < step
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-400 group-hover:border-gray-400 group-hover:text-gray-500"
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm whitespace-nowrap transition-colors ${
                  i === step
                    ? "text-blue-600 font-medium"
                    : i < step
                    ? "text-blue-500"
                    : "text-gray-400 group-hover:text-gray-500"
                }`}>
                  {s.label}
                </span>
              </div>
              {/* Connecting line */}
              {i < STEPS.length - 1 && (
                <div className={`h-px mx-3 flex-shrink-0 ${i < step ? "bg-blue-300" : "bg-gray-200"}`} style={{ width: 32 }} />
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mb-4">
          各ステップでシナリオを絞り込み、有望なシナリオを特定します（すべて任意・ステップ番号で直接移動可）。
        </div>

        {/* Step card */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          {stepContent[step]}
        </div>
      </div>
    </div>
  )
}
