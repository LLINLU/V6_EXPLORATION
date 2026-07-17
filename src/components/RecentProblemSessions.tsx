"use client"

import { Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ProblemSession = {
	id: string
	theme: string
	date: string
	stepNumber: number
	nextStep: string
}

const STEP_COLORS: Record<number, string> = {
	1: "bg-violet-50 text-violet-600",
	2: "bg-violet-50 text-violet-600",
	3: "bg-indigo-50 text-indigo-600",
	4: "bg-indigo-50 text-indigo-600",
	5: "bg-blue-50 text-blue-600",
	6: "bg-blue-50 text-blue-600",
	7: "bg-green-50 text-green-700",
}

const DUMMY_SESSIONS: ProblemSession[] = [
	{
		id: "p1",
		theme: "猛暑による外出抑制が高齢者・子育て世帯の社会参加を減らし、地域コミュニティの希薄化を引き起こしている",
		date: "7月17日 10:34",
		stepNumber: 1,
		nextStep: "問題文を固める",
	},
	{
		id: "p2",
		theme: "2035年、水ストレス地域におけるデータセンター冷却水の急増と地域水資源への影響",
		date: "7月16日 21:22",
		stepNumber: 2,
		nextStep: "全体像を調べる",
	},
	{
		id: "p3",
		theme: "高齢化社会における医療従事者の慢性的不足と地域医療崩壊リスク",
		date: "7月15日 14:30",
		stepNumber: 3,
		nextStep: "問題を洗い出す",
	},
	{
		id: "p4",
		theme: "食料自給率低下と農業従事者の高齢化による国内農業の持続可能性危機",
		date: "7月14日 09:15",
		stepNumber: 4,
		nextStep: "起点を選ぶ",
	},
	{
		id: "p5",
		theme: "物流業界の2024年問題と都市部ラストマイル配送の効率化・労働力不足の深刻化",
		date: "7月13日 16:20",
		stepNumber: 5,
		nextStep: "解決アプローチ",
	},
	{
		id: "p6",
		theme: "少子化加速による地方自治体の財政悪化と公共サービス維持の困難",
		date: "7月12日 11:05",
		stepNumber: 6,
		nextStep: "技術分解",
	},
]

export const RecentProblemSessions = () => {
	return (
		<Card className="border-0 shadow-none">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-[18px]">
					最近の問題探索
				</CardTitle>
				<CardDescription>クリックして続きから再開できます</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{DUMMY_SESSIONS.map((session) => (
						<div
							key={session.id}
							className="group flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
							onClick={() => {/* resume flow */}}
						>
							<div className="flex-1 space-y-1 min-w-0">
								<h4 className="font-medium text-sm leading-snug line-clamp-2 group-hover:line-clamp-none">{session.theme}</h4>
								<div className="flex items-center gap-3 text-xs text-gray-500">
									<div className="flex items-center gap-1 shrink-0">
										<Clock className="h-3 w-3" />
										{session.date}
									</div>
									<span
										className={cn(
											"px-2.5 py-0.5 rounded-full text-[0.72rem] font-medium whitespace-nowrap shrink-0",
											STEP_COLORS[session.stepNumber] ?? "bg-violet-50 text-violet-600",
										)}
									>
										次：{session.nextStep}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
