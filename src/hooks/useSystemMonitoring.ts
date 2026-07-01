import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import type { SystemStats, TeamStats } from "@/types/admin"

export type { TeamStats, SystemStats }

interface SystemMonitoringData {
	systemStats: SystemStats | null
	teamStats: TeamStats[]
	isLoading: boolean
	error: string | null
	refreshStats: () => Promise<void>
}

export const useSystemMonitoring = (): SystemMonitoringData => {
	const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
	const [teamStats, setTeamStats] = useState<TeamStats[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchSystemStats = useCallback(async (): Promise<SystemStats> => {
		const [
			treesResult,
			nodesResult,
			papersResult,
			useCasesResult,
			usersResult,
		] = await Promise.all([
			supabase.from("technology_trees").select("id", { count: "exact" }),
			supabase.from("tree_nodes").select("id", { count: "exact" }),
			supabase.from("node_papers").select("id", { count: "exact" }),
			supabase.from("node_use_cases").select("id", { count: "exact" }),
			supabase.auth.admin.listUsers(),
		])

		// チーム数を取得（重複のないteam_idの数）
		const { data: teamData } = await supabase
			.from("technology_trees")
			.select("team_id")
			.not("team_id", "is", null)

		const uniqueTeams = new Set(teamData?.map((t) => t.team_id) || [])

		return {
			totalTrees: treesResult.count || 0,
			totalNodes: nodesResult.count || 0,
			totalPapers: papersResult.count || 0,
			totalUseCases: useCasesResult.count || 0,
			activeUsers: usersResult.data?.users?.length || 0,
			totalTeams: uniqueTeams.size,
		}
	}, [])

	const fetchTeamStats = useCallback(async (): Promise<TeamStats[]> => {
		try {
			// チーム別の統計を取得
			const { data: teamData, error: teamError } = await supabase
				.from("technology_trees")
				.select(`
          id,
          team_id,
          search_theme,
          created_at,
          user_id,
          tree_nodes (
            id,
            node_papers (id),
            node_use_cases (id)
          )
        `)
				.not("team_id", "is", null)
				.order("created_at", { ascending: false })

			if (teamError) {
				console.error("Error fetching team data:", teamError)
				throw new Error(
					`チームデータの取得に失敗しました: ${teamError.message}`,
				)
			}

			if (!teamData || teamData.length === 0) {
				// console.log("No team data found")
				return []
			}

			const teamIds = [
				...new Set(teamData.map((t) => t.team_id).filter(Boolean)),
			]

			// チーム名とユーザー情報を取得
			const { data: teamNameData, error: teamNameError } = await supabase
				.from("v_user_details")
				.select("user_id, email, team_id, team_name")
				.in("team_id", teamIds)

			// 検索者のユーザー情報を取得
			const userIds = [
				...new Set(teamData.map((t) => t.user_id).filter(Boolean)),
			]
			const { data: userData, error: userError } = await supabase
				.from("v_user_details")
				.select("user_id, email")
				.in("user_id", userIds)

			if (teamNameError) {
				// console.warn("Error fetching team names:", teamNameError)
				// チーム名の取得に失敗してもチーム統計は表示する
			}

			if (userError) {
				// console.warn("Error fetching user data:", userError)
				// ユーザー情報の取得に失敗してもチーム統計は表示する
			}

			// チーム別にグループ化
			const teamMap = new Map<string, TeamStats>()

			teamData.forEach((tree) => {
				const teamId = tree.team_id
				if (!teamId) return

				if (!teamMap.has(teamId)) {
					teamMap.set(teamId, {
						team_id: teamId,
						team_name:
							teamNameData?.find((t) => t.team_id === teamId)?.team_name ||
							`チーム ${teamId.slice(0, 8)}...`,
						totalTrees: 0,
						totalNodes: 0,
						totalPapers: 0,
						totalUseCases: 0,
						recentSearches: [],
						lastActivity: "",
					})
				}

				const teamStat = teamMap.get(teamId)!
				teamStat.totalTrees += 1
				teamStat.totalNodes += tree.tree_nodes?.length || 0

				// 論文とユースケースをカウント
				tree.tree_nodes?.forEach((node) => {
					teamStat.totalPapers += node.node_papers?.length || 0
					teamStat.totalUseCases += node.node_use_cases?.length || 0
				})

				// 最近の検索を追加（最大5件）
				if (teamStat.recentSearches.length < 200) {
					// この検索クエリの論文、ユースケース、ノード数を計算
					let searchPapers = 0
					let searchUseCases = 0
					const searchNodes = tree.tree_nodes?.length || 0

					tree.tree_nodes?.forEach((node) => {
						searchPapers += node.node_papers?.length || 0
						searchUseCases += node.node_use_cases?.length || 0
					})

					const userInfo = userData?.find((u) => u.user_id === tree.user_id)
					teamStat.recentSearches.push({
						search_theme: tree.search_theme || "テーマなし",
						created_at: tree.created_at,
						tree_id: tree.id,
						papers: searchPapers,
						useCases: searchUseCases,
						nodes: searchNodes,
						user_id: tree.user_id || "",
						user_email: userInfo?.email || "",
					})
				}

				// 最新の活動日時を更新
				if (
					!teamStat.lastActivity ||
					new Date(tree.created_at) > new Date(teamStat.lastActivity)
				) {
					teamStat.lastActivity = tree.created_at
				}
			})

			// 最新の活動順でソート
			return Array.from(teamMap.values()).sort(
				(a, b) =>
					new Date(b.lastActivity).getTime() -
					new Date(a.lastActivity).getTime(),
			)
		} catch (error) {
			console.error("Error in fetchTeamStats:", error)
			throw error
		}
	}, [])

	const refreshStats = useCallback(async () => {
		setIsLoading(true)
		setError(null)

		try {
			const [systemData, teamData] = await Promise.all([
				fetchSystemStats(),
				fetchTeamStats(),
			])

			setSystemStats(systemData)
			setTeamStats(teamData)
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "データの取得に失敗しました",
			)
			console.error("Error fetching system monitoring data:", err)
		} finally {
			setIsLoading(false)
		}
	}, [fetchSystemStats, fetchTeamStats])

	useEffect(() => {
		// 初回ロード時にデータを取得
		const initializeData = async () => {
			// セッションが確立されているかチェック
			const {
				data: { session },
			} = await supabase.auth.getSession()
			if (session) {
				await refreshStats()
			} else {
				// セッションがない場合は認証状態の変更を待つ
				const {
					data: { subscription },
				} = supabase.auth.onAuthStateChange(async (event, session) => {
					if (session && event === "SIGNED_IN") {
						await refreshStats()
						subscription.unsubscribe()
					}
				})
			}
		}

		initializeData()
	}, [refreshStats])

	return {
		systemStats,
		teamStats,
		isLoading,
		error,
		refreshStats,
	}
}
