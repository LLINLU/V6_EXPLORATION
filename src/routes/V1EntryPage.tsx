"use client"

import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

type EntryMode = "tech" | "problem"

type EntryOption = {
	mode: EntryMode
	label: string
	sublabel: string
	description: string
	steps: string[]
	accent: string
	accentBg: string
	path: string
}

const OPTIONS: EntryOption[] = [
	{
		mode: "tech",
		label: "技術起点",
		sublabel: "自社技術から探索する",
		description:
			"保有技術・強みを出発点に、どの市場・シナリオで勝ち筋があるかを探索します。テーマ理解から壁打ちを経て有望シナリオを絞り込みます。",
		steps: ["テーマ理解", "壁打ち①", "シナリオ探索", "有望シナリオ選定", "壁打ち②", "技術分解"],
		accent: "text-blue-600",
		accentBg: "bg-blue-50 border-blue-100",
		path: "/v1/prioritization",
	},
	{
		mode: "problem",
		label: "問題起点",
		sublabel: "解決したい課題から探索する",
		description:
			"市場・社会の問題を出発点に、TOEフレームワークでボトルネックを分解し、解決シナリオを導出します。問題の解像度を高めてから技術に落とします。",
		steps: ["問題の精緻化", "BN分解（TOE）", "解決シナリオ", "有望シナリオ選定", "技術分解"],
		accent: "text-violet-600",
		accentBg: "bg-violet-50 border-violet-100",
		path: "/v1/problem",
	},
]

export default function V1EntryPage() {
	const navigate = useNavigate()

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
			<div className="w-full max-w-2xl">
				{/* Header */}
				<div className="text-center mb-10">
					<p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
						V1 Research Flow
					</p>
					<h1 className="text-3xl font-bold text-gray-900 mb-3">
						どこから探索を始めますか？
					</h1>
					<p className="text-sm text-gray-500">
						起点によってフローが変わります。どちらも有望シナリオ選定へ収束します。
					</p>
				</div>

				{/* Entry options */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{OPTIONS.map((opt) => (
						<button
							key={opt.mode}
							onClick={() => navigate(opt.path)}
							className={cn(
								"text-left p-6 rounded-2xl border-2 transition-all group hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
								opt.accentBg,
							)}
						>
							<div className="flex items-start justify-between mb-4">
								<div>
									<p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", opt.accent)}>
										{opt.sublabel}
									</p>
									<h2 className="text-xl font-bold text-gray-900">{opt.label}</h2>
								</div>
								<ArrowRight
									className={cn(
										"w-5 h-5 transition-transform group-hover:translate-x-1 mt-1 shrink-0",
										opt.accent,
									)}
								/>
							</div>

							<p className="text-sm text-gray-600 leading-relaxed mb-5">
								{opt.description}
							</p>

							<div className="flex flex-wrap gap-x-2 gap-y-1">
								{opt.steps.map((step, i) => (
									<span key={step} className="inline-flex items-center gap-1 text-xs text-gray-500">
										{i > 0 && <span className="text-gray-300">›</span>}
										{step}
									</span>
								))}
							</div>
						</button>
					))}
				</div>

				{/* Demo note */}
				<p className="text-center text-xs text-gray-400 mt-8">
					この画面はデザイン探索用のモックです。「技術起点」は有望シナリオ選定ウィザードに直接遷移します。
				</p>
			</div>
		</div>
	)
}
