"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowUp } from "lucide-react"
import { AppSidebar } from "@/components/AppSidebar"
import { ScenarioSelectionMainLayout } from "@/components/scenario-selection/ScenarioSelectionMainLayout"
import { ScenarioOverview } from "@/components/v1/ScenarioOverview"
import { ScenarioGuide } from "@/components/v1/ScenarioGuide"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { Scenario } from "@/types/scenario"

type ScenarioTab = "overview" | "guide" | "table"

const TABS: { key: ScenarioTab; label: string }[] = [
	{ key: "overview", label: "概観" },
	{ key: "table", label: "シナリオ一覧" },
	{ key: "guide", label: "ガイド" },
]

// ─── Dummy data ───────────────────────────────────────────────────────────────
const DUMMY_TREE_ID = "v1-prioritization-demo"
const DUMMY_QUERY = "Quantum computing"

const DUMMY_SCENARIOS: Scenario[] = [
	{
		id: "s1",
		name: "Optimize drug discovery by accelerating molecular simulations",
		description:
			"Quantum algorithms enable molecular simulation at a scale impossible for classical computers, dramatically shortening the drug development pipeline from target identification to clinical candidates.",
		level: 1,
		metrics: {
			tam: 4.2, tamCategory: "small",
			trl: 6, trlCategory: "mid",
			cagr: 22.4, cagrCategory: "high",
			marketGrowthRate: 22.4, competitiveness: null,
			implementationDifficulty: "medium", timeToMarket: "long",
			paperCount: 190, patentCount: 19200, implementationCount: 10,
			papers: { count: 190, cagr: 8.4 },
			patents: { count: 19200, cagr: 12.1 },
			useCases: { count: 10, cagr: null },
		},
		tags: ["pharma", "simulation"],
	},
	{
		id: "s2",
		name: "Secure long-distance communication by enabling ultra-safe key distribution",
		description:
			"Quantum key distribution provides information-theoretically secure communication channels, leveraging the no-cloning theorem to prevent eavesdropping on long-haul fiber networks.",
		level: 1,
		metrics: {
			tam: 8.9, tamCategory: "medium",
			trl: 6, trlCategory: "mid",
			cagr: 29.8, cagrCategory: "high",
			marketGrowthRate: 29.8, competitiveness: null,
			implementationDifficulty: "high", timeToMarket: "medium",
			paperCount: 188, patentCount: 16700, implementationCount: 11,
			papers: { count: 188, cagr: 6.2 },
			patents: { count: 16700, cagr: 9.8 },
			useCases: { count: 11, cagr: null },
		},
		tags: ["security", "networking"],
	},
	{
		id: "s3",
		name: "Improve sensor sensitivity by leveraging quantum tunneling effects",
		description:
			"Quantum tunneling sensors achieve detection thresholds orders of magnitude below classical limits, enabling new applications in medical imaging, navigation, and fundamental physics research.",
		level: 1,
		metrics: {
			tam: 2.7, tamCategory: "small",
			trl: 4, trlCategory: "mid",
			cagr: 18.1, cagrCategory: "high",
			marketGrowthRate: 18.1, competitiveness: null,
			implementationDifficulty: "high", timeToMarket: "long",
			paperCount: 190, patentCount: 22600, implementationCount: 7,
			papers: { count: 190, cagr: 7.8 },
			patents: { count: 22600, cagr: 11.3 },
			useCases: { count: 7, cagr: null },
		},
		tags: ["sensing", "medical"],
	},
	{
		id: "s4",
		name: "Maintain quantum information integrity to enable reliable quantum computing",
		description:
			"Quantum error correction codes suppress decoherence-induced logical errors, unlocking fault-tolerant computation for practical optimization and cryptanalysis workloads.",
		level: 1,
		metrics: {
			tam: 12.4, tamCategory: "large",
			trl: 4, trlCategory: "mid",
			cagr: 35.2, cagrCategory: "very-high",
			marketGrowthRate: 35.2, competitiveness: null,
			implementationDifficulty: "high", timeToMarket: "long",
			paperCount: 187, patentCount: 18400, implementationCount: 14,
			papers: { count: 187, cagr: 9.1 },
			patents: { count: 18400, cagr: 14.7 },
			useCases: { count: 14, cagr: null },
		},
		tags: ["error correction", "hardware"],
	},
	{
		id: "s5",
		name: "Accelerate database search by processing all entries simultaneously",
		description:
			"Grover's algorithm provides a quadratic speedup over classical search, with immediate applications in unstructured database queries, cryptography, and combinatorial optimization.",
		level: 1,
		metrics: {
			tam: 6.1, tamCategory: "medium",
			trl: 7, trlCategory: "mature",
			cagr: 26.3, cagrCategory: "high",
			marketGrowthRate: 26.3, competitiveness: null,
			implementationDifficulty: "medium", timeToMarket: "medium",
			paperCount: 187, patentCount: 29100, implementationCount: 9,
			papers: { count: 187, cagr: 5.4 },
			patents: { count: 29100, cagr: 16.2 },
			useCases: { count: 9, cagr: null },
		},
		tags: ["algorithms", "database"],
	},
	{
		id: "s6",
		name: "Enable ultra-secure authentication by exploiting quantum state discreteness",
		description:
			"Quantum authentication protocols exploit the discrete nature of quantum states to create unforgeable credentials, replacing classical password systems vulnerable to brute-force attacks.",
		level: 1,
		metrics: {
			tam: 3.5, tamCategory: "small",
			trl: 4, trlCategory: "mid",
			cagr: 31.7, cagrCategory: "very-high",
			marketGrowthRate: 31.7, competitiveness: null,
			implementationDifficulty: "medium", timeToMarket: "medium",
			paperCount: 180, patentCount: 20500, implementationCount: 19,
			papers: { count: 180, cagr: 6.9 },
			patents: { count: 20500, cagr: 10.4 },
			useCases: { count: 19, cagr: null },
		},
		tags: ["security", "authentication"],
	},
	{
		id: "s7",
		name: "Improve financial risk modeling by evaluating multiple market scenarios simultaneously",
		description:
			"Quantum Monte Carlo methods evaluate thousands of portfolio risk scenarios in parallel, enabling real-time derivatives pricing and risk management at a scale classical systems cannot match.",
		level: 1,
		metrics: {
			tam: 9.8, tamCategory: "medium",
			trl: 5, trlCategory: "mid",
			cagr: 24.6, cagrCategory: "high",
			marketGrowthRate: 24.6, competitiveness: null,
			implementationDifficulty: "medium", timeToMarket: "medium",
			paperCount: 191, patentCount: 20500, implementationCount: 7,
			papers: { count: 191, cagr: 4.7 },
			patents: { count: 20500, cagr: 8.3 },
			useCases: { count: 7, cagr: null },
		},
		tags: ["finance", "optimization"],
	},
]

const noop = () => {}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function V1Prioritization() {
	const navigate = useNavigate()
	const [isClient, setIsClient] = useState(false)
	const [inputQuery, setInputQuery] = useState(DUMMY_QUERY)
	const [activeTab, setActiveTab] = useState<ScenarioTab>("overview")

	useEffect(() => setIsClient(true), [])

	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-100">
				<p className="text-gray-600">Loading...</p>
			</div>
		)
	}

	return (
		<SidebarProvider defaultOpen={false}>
		<div className="h-screen bg-gray-100 flex w-full">
			<AppSidebar />
		<div className="flex-1 min-w-0 flex flex-col gap-1 p-2">
			{/* V1 Navbar */}
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

				<div className="w-1/2 min-w-0 flex items-center gap-[0.2rem]">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button type="button" className="shrink-0 focus:outline-none">
								<span className="inline-flex items-center text-sm border h-9 rounded-[8px] px-3 bg-blue-50 text-blue-700 border-[#cddeff] gap-1.5 whitespace-nowrap">
									シナリオを探索する
									<svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25"><path d="M6 9l6 6 6-6"/></svg>
								</span>
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-52 py-1">
							<DropdownMenuItem
								onSelect={() => navigate("/query-report", { state: { createReport: true, query: inputQuery } })}
								className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
							>
								<span>技術の全体像を把握する</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={noop}
								className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
							>
								<span>シナリオを探索する</span>
								<svg viewBox="0 0 8 6" className="w-3 h-3 shrink-0 text-blue-600" fill="none">
									<path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => navigate("/v1/treemap")}
								className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
							>
								<span>ツリーマップを直接生成する</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<div className="relative flex-1 min-w-0">
						<Input
							type="text"
							value={inputQuery}
							onChange={(e) => setInputQuery(e.target.value)}
							placeholder="クエリを入力"
							className="h-9 pr-10"
						/>
						<Button
							type="button"
							size="sm"
							className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 bg-transparent hover:bg-muted border-0 text-foreground"
						>
							<ArrowUp className="h-4 w-4" />
						</Button>
					</div>
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

			{/* Scenario panel with 3 tabs */}
			<div className="flex-1 min-h-0 overflow-hidden bg-white rounded-lg flex flex-col">
				{/* Tab row */}
				<div className="flex-shrink-0 flex items-center gap-0 px-4 border-b border-gray-200">
					{TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setActiveTab(tab.key)}
							className={`text-sm px-4 py-3 transition-colors border-b-2 -mb-px ${
								activeTab === tab.key
									? "border-blue-600 text-blue-600 font-medium"
									: "border-transparent text-gray-700 hover:text-gray-900 font-normal"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Tab content */}
				{activeTab === "overview" && (
					<ScenarioOverview scenarios={DUMMY_SCENARIOS} />
				)}
				{activeTab === "guide" && (
					<ScenarioGuide scenarios={DUMMY_SCENARIOS} />
				)}
				{activeTab === "table" && (
					<ScenarioSelectionMainLayout
						scenarios={DUMMY_SCENARIOS}
						treeId={DUMMY_TREE_ID}
						technicalStrengths={[]}
						query={inputQuery}
						effectiveMode="FAST"
					/>
				)}
			</div>
		</div>
		</div>
		</SidebarProvider>
	)
}
