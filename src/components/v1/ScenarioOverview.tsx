import { useState } from "react"
import { ChevronDown, Sparkles } from "lucide-react"
import type { Scenario } from "@/types/scenario"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScenarioPaperPanel } from "@/components/scenario/side-panel/ScenarioSidePanel"

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
const TF: Record<string, string> = {
  s1: "量子シミュレーション",
  s2: "量子暗号通信",
  s3: "量子センシング",
  s4: "量子誤り訂正",
  s5: "量子アルゴリズム",
  s6: "量子認証",
  s7: "量子最適化",
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

const TRL_COLORS = ["#fecaca","#fed7aa","#fef08a","#d9f99d","#bbf7d0","#99f6e4","#a5f3fc","#bae6fd","#bfdbfe"]

function TrlMiniBar({ trl }: { trl: number }) {
  const filled = Math.min(Math.max(Math.round(trl), 0), 9)
  return (
    <div className="flex items-center gap-0.5 flex-1">
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className="h-2 rounded-sm flex-1 flex-shrink-0"
          style={{ background: i < filled ? TRL_COLORS[i] : "#e5e7eb" }}
        />
      ))}
      <span className="text-[11px] font-semibold text-gray-500 ml-1.5 w-4 text-right tabular-nums">{trl}</span>
    </div>
  )
}

type Axis = "ind" | "tf" | "kf"
const MAPS: Record<Axis, Record<string, string>> = { ind: IND, tf: TF, kf: KF }
const AXIS_LABELS: Record<Axis, string> = { ind: "産業", tf: "技術特性", kf: "技術レイヤー" }
const AXIS_Q: Record<Axis, string> = { ind: "どこが熱いか", tf: "何を強化するか", kf: "どこに関われるか" }

interface Group {
  name: string
  items: Scenario[]
  maxTam: number
  avgTam: number
  avgTrl: number
  maxTrl: number
}

function buildGroups(scenarios: Scenario[], axis: Axis): Group[] {
  const map = new Map<string, Scenario[]>()
  for (const s of scenarios) {
    const key = MAPS[axis][s.id] ?? "その他"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return Array.from(map.entries())
    .map(([name, items]) => {
      const tams = items.map((s) => s.metrics?.tam ?? 0)
      const trls = items.map((s) => s.metrics?.trl ?? 0)
      return {
        name,
        items,
        maxTam: Math.max(...tams, 0),
        avgTam: tams.reduce((a, b) => a + b, 0) / tams.length,
        avgTrl: Math.round((trls.reduce((a, b) => a + b, 0) / trls.length) * 10) / 10,
        maxTrl: Math.max(...trls, 0),
      }
    })
    .sort((a, b) => b.items.length - a.items.length || b.maxTam - a.maxTam)
}

function fmtTam(v: number) {
  return `${v.toFixed(1)}B$`
}

function narrativeSummary(g: Group, axis: Axis): string {
  const trlPhase = g.avgTrl >= 7 ? "商業化が視野に入る段階" : g.avgTrl >= 5 ? "実証段階にあり、実用まであと一歩" : g.avgTrl >= 3 ? "基礎研究〜実証の初期段階" : "まだ基礎研究段階"
  const trlSpread = g.maxTrl - Math.round(g.avgTrl)
  const spreadNote = trlSpread >= 2 ? `シナリオによってTRL ${Math.round(g.avgTrl)}〜${g.maxTrl}と幅がある。` : ""

  if (axis === "ind") {
    const mktScale = g.maxTam >= 10 ? "非常に大きく" : g.maxTam >= 5 ? "中規模で" : "比較的小さく"
    return `${g.name}は市場規模が${mktScale}、最大${fmtTam(g.maxTam)}が見込まれる。技術的には${trlPhase}。${spreadNote}`
  }
  if (axis === "tf") {
    return `「${g.name}」の特性を持つシナリオは${g.items.length}件。${trlPhase}で、市場最大${fmtTam(g.maxTam)}の機会がある。${spreadNote}`
  }
  return `「${g.name}」レイヤーへの接点は${g.items.length}件。${trlPhase}で参入余地を探れる。${spreadNote}`
}

function summaryLine(groups: Group[], axis: Axis): string {
  if (groups.length < 2) return ""
  const top = groups[0]
  const bigMkt = [...groups].sort((a, b) => b.maxTam - a.maxTam)[0]
  const hiTrl = [...groups].sort((a, b) => b.avgTrl - a.avgTrl)[0]
  if (axis === "ind") {
    let s = `シナリオが最も厚いのは「${top.name}」（${top.items.length}件）。市場規模では「${bigMkt.name}」が最大（${fmtTam(bigMkt.maxTam)}）。`
    if (hiTrl.name !== bigMkt.name) s += `実用に近いのは「${hiTrl.name}」（平均TRL ${hiTrl.avgTrl}）。`
    return s
  }
  if (axis === "tf") return `「${top.name}」が${top.items.length}件と最多。平均TRLが高いのは「${hiTrl.name}」（${hiTrl.avgTrl}）。`
  return `「${top.name}」が${top.items.length}件と最も多く、参入の接点が広い。`
}


export function ScenarioOverview({ scenarios }: { scenarios: Scenario[] }) {
  const [axis, setAxis] = useState<Axis>("ind")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [modes, setModes] = useState<Set<"avg" | "max">>(new Set(["max"]))
  const [tldrOpen, setTldrOpen] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)

  const showAvg = modes.has("avg")
  const showMax = modes.has("max")
  const both = showAvg && showMax

  const groups = buildGroups(scenarios, axis)
  const axisCounts: Record<Axis, number> = {
    ind: buildGroups(scenarios, "ind").length,
    tf: buildGroups(scenarios, "tf").length,
    kf: buildGroups(scenarios, "kf").length,
  }

  const handleAxisChange = (a: Axis) => setAxis(a)

  const toggleMode = (m: "avg" | "max") => {
    setModes((prev) => {
      if (prev.has(m) && prev.size === 1) return prev // keep at least one
      const next = new Set(prev)
      next.has(m) ? next.delete(m) : next.add(m)
      return next
    })
  }

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const matLabel = (trl: number) =>
    trl >= 6 ? "すぐに狙える。" : trl >= 4 ? "あと一歩。" : "まだ先は長い。"

  const primaryTrl = (g: Group) => showAvg ? g.avgTrl : g.maxTrl
  const primaryTam = (g: Group) => showAvg ? g.avgTam : g.maxTam

  return (
    <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3">
        <TooltipProvider>
          <div className="flex items-center gap-2 mb-3">
            {(["ind", "tf", "kf"] as Axis[]).map((a) => (
              <Tooltip key={a}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleAxisChange(a)}
                    className={`px-3 pt-1 pb-1 border rounded-full transition-colors text-left flex items-center gap-1.5 ${
                      axis === a ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className={`text-xs font-medium leading-3 ${axis === a ? "text-blue-700" : "text-gray-600"}`}>
                      {AXIS_LABELS[a]}
                    </span>
                    <span className={`text-xs leading-3 tabular-nums ${axis === a ? "text-blue-400" : "text-gray-400"}`}>
                      {axisCounts[a]}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{AXIS_Q[a]}</TooltipContent>
              </Tooltip>
            ))}

            {/* avg / max multi-select switcher */}
            <div className="ml-auto flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {(["avg", "max"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMode(m)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-all ${
                    modes.has(m)
                      ? "bg-white text-blue-600 font-medium shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m === "avg" ? "平均" : "最大"}
                </button>
              ))}
            </div>
          </div>
        </TooltipProvider>

        <div className="mt-1 bg-gray-50 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setTldrOpen((o) => !o)}
              className="w-full flex items-center gap-1.5 px-2.5 py-2 text-left hover:bg-gray-100 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 flex-1">サマリー</span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-300 flex-shrink-0 transition-transform ${tldrOpen ? "" : "-rotate-90"}`} />
            </button>
            {tldrOpen && (
              <div className="px-2.5 pb-2.5 flex flex-col gap-1.5">
                {/* column headers */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-24 flex-shrink-0" />
                  <span className="w-8 flex-shrink-0 text-[9px] text-gray-400 uppercase tracking-wider text-right">件数</span>
                  {showAvg && <><span className="flex-1 text-[9px] text-gray-400 uppercase tracking-wider ml-1.5">TRL 平均</span><span className="w-14 flex-shrink-0 text-[9px] text-gray-400 uppercase tracking-wider text-right">市場規模</span></>}
                  {both && <span className="w-px self-stretch bg-gray-200 mx-0.5 flex-shrink-0" />}
                  {showMax && <><span className="flex-1 text-[9px] text-gray-400 uppercase tracking-wider ml-1.5">TRL 最大</span><span className="w-14 flex-shrink-0 text-[9px] text-gray-400 uppercase tracking-wider text-right">市場規模</span></>}
                </div>
                {(() => {
                  const sorted = [...groups].sort((a, b) => primaryTrl(b) - primaryTrl(a))
                  const topAvgTam = Math.max(...groups.map((g) => g.avgTam))
                  const topMaxTam = Math.max(...groups.map((g) => g.maxTam))
                  return sorted.map((g) => (
                    <div key={g.name} className="flex items-center gap-1.5">
                      <span className="w-24 flex-shrink-0 text-[11px] font-semibold text-gray-600 truncate">{g.name}</span>
                      <span className="w-8 flex-shrink-0 text-[11px] font-semibold text-gray-700 tabular-nums text-right">{g.items.length}</span>
                      {showAvg && (
                        <>
                          <TrlMiniBar trl={g.avgTrl} />
                          <span className={`w-14 flex-shrink-0 text-[11px] tabular-nums text-right ${g.avgTam === topAvgTam ? "font-bold text-blue-600" : "font-medium text-gray-500"}`}>{fmtTam(g.avgTam)}</span>
                        </>
                      )}
                      {both && <span className="w-px self-stretch bg-gray-200 mx-0.5 flex-shrink-0" />}
                      {showMax && (
                        <>
                          <TrlMiniBar trl={g.maxTrl} />
                          <span className={`w-14 flex-shrink-0 text-[11px] tabular-nums text-right ${g.maxTam === topMaxTam ? "font-bold text-blue-600" : "font-medium text-gray-500"}`}>{fmtTam(g.maxTam)}</span>
                        </>
                      )}
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
      </div>

      {/* Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col gap-2">
          {groups.map((g) => {
            const isOpen = expanded.has(g.name)
            return (
              <div key={g.name} className={`border-[0.5px] rounded-lg bg-white ${g.items.some((s) => s.id === selectedScenario?.id) ? "border-[1.5px] border-blue-400" : "border-[0.5px] border-gray-200"}`}>
                {/* Card head */}
                <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                  <div className="text-sm font-semibold text-gray-900">{g.name}</div>
                  <span className="text-xs text-gray-400 tabular-nums">{g.items.length}件</span>
                </div>

                {/* Insight box */}
                <div className="mx-3 mb-2 bg-blue-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-600 leading-relaxed">{narrativeSummary(g, axis)}</p>
                </div>

                {/* Scenario list */}
                {(() => {
                  const topTam = Math.max(...g.items.map((s) => s.metrics?.tam ?? 0))
                  const topTrl = Math.max(...g.items.map((s) => s.metrics?.trl ?? 0))
                  const ScenarioRow = ({ s }: { s: typeof g.items[0] }) => {
                    const tamVal = s.metrics?.tam ?? 0
                    const trlVal = s.metrics?.trl ?? 0
                    const tam = fmtTam(tamVal)
                    const trl = trlVal || "—"
                    const tamCls = tamVal === topTam ? "font-bold text-blue-600" : "text-gray-400"
                    const trlCls = trlVal === topTrl ? "font-bold text-blue-600" : "text-gray-400"
                    return (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-b-0 text-xs transition-colors cursor-pointer ${selectedScenario?.id === s.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
                        onClick={() => setSelectedScenario(s)}
                      >
                        <div className="flex-1 text-gray-700 leading-snug min-w-0">{s.name}</div>
                        {showAvg && (
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`tabular-nums w-14 text-right ${tamCls}`}>{tam}</span>
                            <span className={`tabular-nums w-12 text-right ${trlCls}`}>TRL {trl}</span>
                          </div>
                        )}
                        {both && <span className="w-px self-stretch bg-gray-200 flex-shrink-0 mx-0.5" />}
                        {showMax && (
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`tabular-nums w-14 text-right ${tamCls}`}>{tam}</span>
                            <span className={`tabular-nums w-12 text-right ${trlCls}`}>TRL {trl}</span>
                          </div>
                        )}
                      </div>
                    )
                  }
                  const list = (
                    <div className="border-t border-gray-100">
                      {/* column header */}
                      <div className="flex items-center gap-2 px-3 pt-1.5 pb-1 border-b border-gray-50">
                        <div className="flex-1 text-[9px] text-gray-400 uppercase tracking-wider">シナリオ</div>
                        {showAvg && (
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-[9px] text-gray-400 uppercase tracking-wider w-14 text-right">市場規模</span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-wider w-12 text-right">{both ? "TRL 平均" : "TRL"}</span>
                          </div>
                        )}
                        {both && <span className="w-px self-stretch bg-gray-200 flex-shrink-0 mx-0.5" />}
                        {showMax && (
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-[9px] text-gray-400 uppercase tracking-wider w-14 text-right">市場規模</span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-wider w-12 text-right">{both ? "TRL 最大" : "TRL"}</span>
                          </div>
                        )}
                      </div>
                      {g.items.map((s) => <ScenarioRow key={s.id} s={s} />)}
                    </div>
                  )
                  if (g.items.length > 5) return (
                    <>
                      <button
                        type="button"
                        className="w-full px-3 pb-2.5 text-left text-[11px] text-gray-400 hover:text-gray-500 select-none"
                        onClick={() => toggleExpand(g.name)}
                      >
                        {isOpen ? "▲ 閉じる" : `▼ シナリオを見る（${g.items.length}件）`}
                      </button>
                      {isOpen && list}
                    </>
                  )
                  return list
                })()}
              </div>
            )
          })}
        </div>
      </div>
    </div>

    {/* Right panel — shown when a scenario row is selected */}
    {selectedScenario && (
      <div className="w-[400px] flex-shrink-0 border-l border-gray-200 overflow-hidden flex flex-col">
        <ScenarioPaperPanel
          scenario={selectedScenario}
          onClose={() => setSelectedScenario(null)}
          isExpanded={true}
        />
      </div>
    )}
    </div>
  )
}
