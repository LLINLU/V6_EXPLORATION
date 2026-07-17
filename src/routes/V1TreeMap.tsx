import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowUp, Download } from "lucide-react"
import { TechTreeMainComponent } from "@/components/technology-tree/TechTreeMainComponent"
import { TechTreeResearchPanelComponent } from "@/components/technology-tree/TechTreeResearchPanelComponent"
import { TechnologyTreeLayoutWrapper } from "@/components/technology-tree/TechnologyTreeLayout"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useTreeDataStore } from "@/stores/treeDataStore"
import { useTreeUIStore } from "@/stores/treeUIStore"
import type { TreeNode } from "@/types/tree"

// ── Dummy tree: 光電融合技術 ────────────────────────────────────────────────
const QUERY = "光電融合技術"
const DUMMY_SCENARIO = "「炭素回収技術」を実現する方式は、原理的に12通りあります。そのうち、すでに実用化されているのが3件、実証段階が2件、基礎研究段階が3件。そして、理論上は可能なのにまだ誰も実現していない方式が4件あります。これらは、この技術が成り立つために欠かせない3つの働き——分離メカニズム（物理吸着か、化学吸収か）、反応場（湿式か、乾式か）、捕集後の処理形態（固定か、再利用か）——の組み合わせから導き出しています。"

// Sorted low TRL → high TRL top-to-bottom at every tier
const L1: TreeNode[] = [
	{ id: "l1-4", name: "光コンピューティング",  level: 1, children_count: 2, trl: 2 },
	{ id: "l1-3", name: "シリコンフォトニクス",  level: 1, children_count: 3, trl: 5 },
	{ id: "l1-2", name: "光インターコネクト",    level: 1, children_count: 3, trl: 7 },
	{ id: "l1-1", name: "光電変換",              level: 1, children_count: 3, trl: 9 },
]
const L2: Record<string, TreeNode[]> = {
	"l1-4": [
		{ id: "l2-4b", name: "光ニューラルネット", level: 2, children_count: 2, trl: 1 },
		{ id: "l2-4a", name: "光論理演算",         level: 2, children_count: 2, trl: 3 },
	],
	"l1-3": [
		{ id: "l2-3a", name: "光導波路",           level: 2, children_count: 2, trl: 3 },
		{ id: "l2-3b", name: "光変調器",           level: 2, children_count: 2, trl: 5 },
		{ id: "l2-3c", name: "フォトディテクタ",   level: 2, children_count: 2, trl: 6 },
	],
	"l1-2": [
		{ id: "l2-2a", name: "オンチップ光配線",   level: 2, children_count: 2, trl: 5 },
		{ id: "l2-2b", name: "チップ間光通信",     level: 2, children_count: 2, trl: 7 },
		{ id: "l2-2c", name: "光ファイバー集積",   level: 2, children_count: 2, trl: 8 },
	],
	"l1-1": [
		{ id: "l2-1a", name: "受光素子",           level: 2, children_count: 2, trl: 7 },
		{ id: "l2-1b", name: "発光素子",           level: 2, children_count: 2, trl: 8 },
		{ id: "l2-1c", name: "変換効率最適化",     level: 2, children_count: 2, trl: 9 },
	],
}
const L3: Record<string, TreeNode[]> = {
	"l2-4b": [
		{ id: "l3-4b1", name: "光位相変調NN",          level: 3, children_count: 0, trl: 1 },
		{ id: "l3-4b2", name: "Mach-Zehnder干渉計NN", level: 3, children_count: 0, trl: 2 },
	],
	"l2-4a": [
		{ id: "l3-4a1", name: "光AND/ORゲート",      level: 3, children_count: 0, trl: 2 },
		{ id: "l3-4a2", name: "光フリップフロップ",   level: 3, children_count: 0, trl: 3 },
	],
	"l2-3a": [
		{ id: "l3-3a2", name: "ストリップ導波路",  level: 3, children_count: 0, trl: 3 },
		{ id: "l3-3a1", name: "リブ導波路",        level: 3, children_count: 0, trl: 4 },
	],
	"l2-3b": [
		{ id: "l3-3b2", name: "リング共振器変調器", level: 3, children_count: 0, trl: 4 },
		{ id: "l3-3b1", name: "MZI変調器",          level: 3, children_count: 0, trl: 6 },
	],
	"l2-3c": [
		{ id: "l3-3c1", name: "pin型フォトディテクタ", level: 3, children_count: 0, trl: 5 },
		{ id: "l3-3c2", name: "APDフォトディテクタ",   level: 3, children_count: 0, trl: 7 },
	],
	"l2-2a": [
		{ id: "l3-2a2", name: "SiN導波路",  level: 3, children_count: 0, trl: 4 },
		{ id: "l3-2a1", name: "SOI導波路",  level: 3, children_count: 0, trl: 6 },
	],
	"l2-2b": [
		{ id: "l3-2b1", name: "WDM多重化",      level: 3, children_count: 0, trl: 6 },
		{ id: "l3-2b2", name: "光スイッチング", level: 3, children_count: 0, trl: 8 },
	],
	"l2-2c": [
		{ id: "l3-2c2", name: "エッジカプラ",         level: 3, children_count: 0, trl: 7 },
		{ id: "l3-2c1", name: "グレーティングカプラ", level: 3, children_count: 0, trl: 8 },
	],
	"l2-1a": [
		{ id: "l3-1a2", name: "Ge-on-Si受光素子", level: 3, children_count: 0, trl: 7 },
		{ id: "l3-1a1", name: "InGaAs受光素子",   level: 3, children_count: 0, trl: 8 },
	],
	"l2-1b": [
		{ id: "l3-1b1", name: "VCSEL",            level: 3, children_count: 0, trl: 8 },
		{ id: "l3-1b2", name: "エッジ発光レーザ", level: 3, children_count: 0, trl: 9 },
	],
	"l2-1c": [
		{ id: "l3-1c2", name: "量子ドット構造",    level: 3, children_count: 0, trl: 8 },
		{ id: "l3-1c1", name: "III-V族材料最適化", level: 3, children_count: 0, trl: 9 },
	],
}
const EMPTY: Record<string, TreeNode[]> = {}
const LEVEL_NAMES = {
	level1: "実現手法",
	level2: "構成技術1",
	level3: "構成技術2",
	level4: "構成技術3",
	level5: "構成技術4",
}

const noop = () => {}
const asyncNoop = async () => {}

export default function V1TreeMap() {
	const navigate = useNavigate()
	const [inputQuery, setInputQuery] = useState(QUERY)
	const containerRef = useRef<HTMLDivElement>(null)
	const expansionState = useRef(new Set<string>())
	const panZoom = useRef({ zoom: 1, panX: 0, panY: 0 })

	const { setLevelItems, setLevelNames, setTreeMode } = useTreeDataStore()
	const { collapsedSidebar, toggleSidebar, setSidebarTab, setTrlColorMode } = useTreeUIStore()

	// Populate store with dummy data once
	useEffect(() => {
		setTreeMode("FAST")
		setSidebarTab("result")
		setTrlColorMode(true)
		setLevelNames(LEVEL_NAMES)
		setLevelItems(1, L1)
		setLevelItems(2, L2)
		setLevelItems(3, L3)
		setLevelItems(4, EMPTY)
		setLevelItems(5, EMPTY)
		setLevelItems(6, EMPTY)
		setLevelItems(7, EMPTY)
		setLevelItems(8, EMPTY)
		setLevelItems(9, EMPTY)
		setLevelItems(10, EMPTY)
	}, [setLevelItems, setLevelNames, setTreeMode, setSidebarTab, setTrlColorMode])

	const researchPanelContent = (
		<TechTreeResearchPanelComponent
			onSendMessage={asyncNoop}
			onUseNode={noop}
			onEditNode={noop}
			onRefine={noop}
			onCheckResults={noop}
			onChatToggle={noop}
			researchPanelNodeData={null}
			selectedNodeInfo={{ nodeId: "", title: "", description: "" }}
			selectedPath={{ level1: "", level2: "", level3: "" }}
		/>
	)

	const mainContent = (
		<TechTreeMainComponent
			locationState={null}
			savedConversationHistory={[]}
			scenario={DUMMY_SCENARIO}
			searchMode="FAST"
			currentQuery={QUERY}
			containerRef={containerRef}
			canScrollLeft={false}
			canScrollRight={false}
			lastVisibleLevel={3}
			handleScrollToStart={noop}
			handleScrollToEnd={noop}
			handleGuidanceClick={noop}
			handleAddScenario={asyncNoop}
			handleResearchPanelChange={noop}
			onAiAssist={noop}
			viewMode="mindmap"
			toggleView={noop}
			setMindmapExpansionState={(s) => { expansionState.current = s }}
			getMindmapExpansionState={() => expansionState.current}
			justSwitchedView={false}
			clearViewSwitchFlag={noop}
			saveMindmapPanZoomState={(s) => { panZoom.current = s }}
			getMindmapPanZoomState={() => panZoom.current}
			isFullscreenMode={false}
			toggleFullscreenMode={noop}
			researchPanelContent={researchPanelContent}
			chatboxContent={null}
		/>
	)

	const navbar = (
		<div className="bg-white rounded-lg px-4 py-2 flex items-center justify-between gap-3">
			<div className="flex items-center shrink-0 w-[100px]">
				<Button type="button" variant="ghost" size="icon"
					onClick={() => navigate("/")}
					className="h-8 w-8 text-gray-500 hover:text-gray-800"
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
			</div>

			<div className="w-1/2 min-w-0 flex items-center gap-[0.2rem]">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button type="button" className="shrink-0 focus:outline-none">
							<span className="inline-flex items-center text-sm border h-9 rounded-[8px] px-3 bg-blue-50 text-blue-700 border-[#cddeff] gap-1.5 whitespace-nowrap">
								ツリーマップを直接生成する
								<svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25"><path d="M6 9l6 6 6-6"/></svg>
							</span>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-52 py-1">
						<DropdownMenuItem onSelect={() => navigate("/query-report", { state: { createReport: true, query: inputQuery } })}
							className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer">
							<span>技術の全体像を把握する</span>
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => navigate("/v1/prioritization")}
							className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer">
							<span>シナリオを探索する</span>
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={noop}
							className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer">
							<span>ツリーマップを直接生成する</span>
							<svg viewBox="0 0 8 6" className="w-3 h-3 shrink-0 text-blue-600" fill="none">
								<path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<div className="relative flex-1 min-w-0">
					<Input type="text" value={inputQuery} onChange={(e) => setInputQuery(e.target.value)}
						placeholder="クエリを入力" className="h-9 pr-10" />
					<Button type="button" size="sm"
						className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 bg-transparent hover:bg-muted border-0 text-foreground">
						<ArrowUp className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="flex items-center gap-2 shrink-0">
				<Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-md">
					<Download className="h-4 w-4" />
				</Button>
				<Button className="ask-ai-btn rounded-full px-[18px] text-white font-medium"
					style={{ height: "36px", width: "100px" }}>
					<span className="text-white font-medium">Ask AI</span>
				</Button>
			</div>
		</div>
	)

	return (
		<TechnologyTreeLayoutWrapper
			viewMode="mindmap"
			showSidebar={true}
			collapsedSidebar={false}
			toggleSidebar={toggleSidebar}
			researchPanelContent={researchPanelContent}
			chatboxContent={null}
			mainContent={mainContent}
			chatBoxOpen={false}
			chatDisplayMode="overlay"
			handleQueueNodeSelect={noop}
			navbarContent={navbar}
		/>
	)
}
