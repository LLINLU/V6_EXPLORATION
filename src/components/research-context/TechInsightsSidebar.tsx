import { FileText, Globe, TrendingUp, Users } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TechInsightsSidebarProps {
	query: string
}

export const TechInsightsSidebar = ({ query }: TechInsightsSidebarProps) => {
	const { t } = useTranslation()
	const [insights, setInsights] = useState<any>(null)

	const generateInsights = useCallback(() => {
		// Mock data - in real implementation, this would call an API
		const mockInsights = {
			marketTrends: [
				"市場規模: 年率15%成長",
				"主要プレイヤー: 5社が市場の70%を占有",
				"新規参入: 年間20社以上",
			],
			patents: {
				total: 1247,
				recent: 89,
				topCompanies: ["Sony", "Panasonic", "富士通"],
			},
			applications: [
				"医療機器",
				"コンシューマー電子機器",
				"産業用途",
				"自動車",
			],
			researchTrends: ["AI技術との統合", "小型化・低消費電力化", "コスト削減"],
		}

		setInsights(mockInsights)
	}, [])

	useEffect(() => {
		// Generate mock insights based on query
		generateInsights()
	}, [generateInsights])

	if (!insights) {
		return (
			<div className="h-screen bg-gray-50 p-4">
				<div className="animate-pulse space-y-4">
					<div className="h-4 bg-gray-200 rounded w-3/4"></div>
					<div className="h-4 bg-gray-200 rounded w-1/2"></div>
					<div className="h-4 bg-gray-200 rounded w-5/6"></div>
				</div>
			</div>
		)
	}

	return (
		<div className="h-screen bg-gray-50 p-4 overflow-y-auto">
			<div className="space-y-4">
				<div className="mb-6">
					<h2 className="text-xl font-bold text-gray-900 mb-2">
						Tech Insights
					</h2>
					<p className="text-sm text-gray-600">
						{t("research.techInsights.subtitle", { query })}
					</p>
				</div>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm flex items-center">
							<TrendingUp className="h-4 w-4 mr-2 text-green-600" />
							{t("research.techInsights.marketTrends")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{(insights as any).marketTrends.map((trend: string) => (
								<div
									key={trend}
									className="text-sm text-gray-700 flex items-center"
								>
									<div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
									{trend}
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm flex items-center">
							<FileText className="h-4 w-4 mr-2 text-blue-600" />
							{t("research.techInsights.patents")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">
									{t("research.techInsights.totalPatents")}
								</span>
								<Badge variant="secondary">
									{(insights as any).patents.total}
								</Badge>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">
									{t("research.techInsights.recentYear")}
								</span>
								<Badge variant="secondary">
									{(insights as any).patents.recent}
								</Badge>
							</div>
							<div>
								<span className="text-sm text-gray-600 block mb-2">
									{t("research.techInsights.topCompanies")}
								</span>
								<div className="flex flex-wrap gap-1">
									{(insights as any).patents.topCompanies.map(
										(company: string) => (
											<Badge
												key={company}
												variant="outline"
												className="text-xs"
											>
												{company}
											</Badge>
										),
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm flex items-center">
							<Globe className="h-4 w-4 mr-2 text-purple-600" />
							{t("research.techInsights.applications")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-2">
							{(insights as any).applications.map((app: string) => (
								<Badge
									key={app}
									variant="outline"
									className="text-xs justify-center"
								>
									{app}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm flex items-center">
							<Users className="h-4 w-4 mr-2 text-orange-600" />
							{t("research.techInsights.researchTrends")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{(insights as any).researchTrends.map((trend: string) => (
								<div
									key={trend}
									className="text-sm text-gray-700 flex items-center"
								>
									<div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
									{trend}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
