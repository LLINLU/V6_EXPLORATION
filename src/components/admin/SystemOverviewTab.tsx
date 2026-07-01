import {
	ChevronDown,
	ChevronUp,
	Clock,
	RefreshCw,
	Search,
	User,
	Users,
} from "lucide-react"
import type React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { TeamStats } from "@/hooks/useSystemMonitoring"

interface SystemOverviewTabProps {
	teamStats: TeamStats[]
	isLoading: boolean
	error: string | null
	onRefresh: () => Promise<void>
}

export const SystemOverviewTab: React.FC<SystemOverviewTabProps> = ({
	teamStats,
	isLoading,
	error,
	onRefresh,
}) => {
	const { t } = useTranslation()
	const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())

	const toggleTeamExpansion = (teamId: string) => {
		const newExpanded = new Set(expandedTeams)
		if (newExpanded.has(teamId)) {
			newExpanded.delete(teamId)
		} else {
			newExpanded.add(teamId)
		}
		setExpandedTeams(newExpanded)
	}

	const formatRelativeTime = (dateString: string) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffInMinutes = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60),
		)

		if (diffInMinutes < 60) {
			return t("admin.overview.minutesAgo", { count: diffInMinutes })
		} else if (diffInMinutes < 1440) {
			return t("admin.overview.hoursAgo", {
				count: Math.floor(diffInMinutes / 60),
			})
		} else {
			return t("admin.overview.daysAgo", {
				count: Math.floor(diffInMinutes / 1440),
			})
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">
					{t("admin.overview.systemStats")}
				</h2>
				<Button
					onClick={onRefresh}
					disabled={isLoading}
					variant="outline"
					size="sm"
					className="flex items-center gap-2"
				>
					<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
					{t("admin.overview.refresh")}
				</Button>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						{t("admin.overview.teamStats")}
					</CardTitle>
					<CardDescription>
						{t("admin.overview.teamStatsDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
							<span className="ml-2 text-muted-foreground">
								{t("admin.overview.loadingData")}
							</span>
						</div>
					) : teamStats.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							{t("admin.overview.noTeamData")}
						</div>
					) : (
						<div className="space-y-4">
							{teamStats.map((team, index) => (
								<div
									key={team.team_id}
									className="border rounded-lg p-4 space-y-3"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge variant="outline">
												{team.team_name ||
													t("admin.overview.teamNumber", { number: index + 1 })}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{t("admin.overview.lastActivity")}:{" "}
												{formatRelativeTime(team.lastActivity)}
											</span>
										</div>
										<Clock className="h-4 w-4 text-muted-foreground" />
									</div>

									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="text-center">
											<div className="text-lg font-semibold text-blue-600">
												{team.totalTrees}
											</div>
											<div className="text-xs text-muted-foreground">
												{t("admin.overview.trees")}
											</div>
										</div>
										<div className="text-center">
											<div className="text-lg font-semibold text-green-600">
												{team.totalNodes}
											</div>
											<div className="text-xs text-muted-foreground">
												{t("admin.overview.nodes")}
											</div>
										</div>
										<div className="text-center">
											<div className="text-lg font-semibold text-purple-600">
												{team.totalPapers}
											</div>
											<div className="text-xs text-muted-foreground">
												{t("admin.overview.papers")}
											</div>
										</div>
										<div className="text-center">
											<div className="text-lg font-semibold text-orange-600">
												{team.totalUseCases}
											</div>
											<div className="text-xs text-muted-foreground">
												{t("admin.overview.useCases")}
											</div>
										</div>
									</div>

									{team.recentSearches.length > 0 && (
										<div className="border-t pt-3">
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<Search className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm font-medium">
														{t("admin.overview.recentSearches")}
													</span>
												</div>
												{team.recentSearches.length > 3 && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => toggleTeamExpansion(team.team_id)}
														className="h-6 px-2 text-xs"
													>
														{expandedTeams.has(team.team_id) ? (
															<>
																<ChevronUp className="h-3 w-3 mr-1" />
																{t("admin.overview.collapse")}
															</>
														) : (
															<>
																<ChevronDown className="h-3 w-3 mr-1" />
																{t("admin.overview.showMore")}
															</>
														)}
													</Button>
												)}
											</div>
											<div className="space-y-2">
												{(expandedTeams.has(team.team_id)
													? team.recentSearches
													: team.recentSearches.slice(0, 3)
												).map((search) => (
													<div
														key={search.tree_id}
														className="flex items-center justify-between text-sm border-l-2 border-gray-200 pl-3 py-1"
													>
														<div className="flex-1 min-w-0">
															<TooltipProvider>
																<Tooltip>
																	<TooltipTrigger asChild>
																		<div className="truncate max-w-[300px] font-medium cursor-help">
																			{search.search_theme}
																		</div>
																	</TooltipTrigger>
																	<TooltipContent>
																		<div className="max-w-sm text-sm">
																			{search.search_theme}
																		</div>
																	</TooltipContent>
																</Tooltip>
															</TooltipProvider>
															<div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
																<span className="flex items-center gap-1">
																	<User className="w-3 h-3" />
																	{search.user_email
																		? search.user_email.split("@")[0]
																		: t("admin.overview.unknownUser")}
																</span>
																<span className="flex items-center gap-1">
																	<div className="w-2 h-2 bg-green-500 rounded-full"></div>
																	{search.nodes}
																	{t("admin.overview.nodesUnit")}
																</span>
																<span className="flex items-center gap-1">
																	<div className="w-2 h-2 bg-purple-500 rounded-full"></div>
																	{search.papers}
																	{t("admin.overview.papersUnit")}
																</span>
																<span className="flex items-center gap-1">
																	<div className="w-2 h-2 bg-orange-500 rounded-full"></div>
																	{search.useCases}
																	{t("admin.overview.casesUnit")}
																</span>
															</div>
														</div>
														<span className="text-xs text-muted-foreground ml-2">
															{formatRelativeTime(search.created_at)}
														</span>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
