// TODO: useTreeOperationと統合
import { useCallback, useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { useUserDetail } from "@/hooks/useUserDetail"
import { supabase } from "@/integrations/supabase/client"
import { getOutputLanguage } from "@/lib/outputLanguage"
import { projectService } from "@/services/projectService"
import { useProjectStore } from "@/stores/projectStore"
import { useTreeListStore } from "@/stores/treeListStore"
import type { TreeGenerationResult } from "@/types/tree"
import {
	buildContextInfoMessage,
	extractResearchContext,
	type ResearchContextData,
} from "@/utils/researchContextParser"

export const useTreeGeneration = () => {
	const [isGenerating, setIsGenerating] = useState(false)
	const [generatingTechnicalStrengths, setGeneratingTechnicalStrengths] =
		useState(false)
	const [generatingScenarios, setGeneratingScenarios] = useState(false)

	const { userDetails } = useUserDetail()

	// Use tree list store for trees management
	const { trees, treesLoading, pollingTreeId, setPollingTreeId, fetchTrees } =
		useTreeListStore()

	// Get selected project from project store
	const { selectedProjectId } = useProjectStore()

	const generateTree = useCallback(
		async (
			searchTheme: string,
			mode: "TED" | "FAST" = "TED",
			researchContextData?: ResearchContextData,
			persistedMode?: "TED" | "FAST" | "SOCIAL_PROBLEM",
		): Promise<TreeGenerationResult | null> => {
			if (!searchTheme.trim()) {
				toast({
					title: "エラー",
					description: "検索テーマを入力してください",
				})
				return null
			}

			setIsGenerating(true)

			try {
				// Check if Supabase and database tables are available
				const { data: healthCheck, error: healthError } = await supabase
					.from("technology_trees")
					.select("count")
					.limit(1)

				if (healthCheck === null || healthError) {
					// Database tables not available - show error instead of fallback to demo
					console.error(
						"Database not available:",
						healthError?.message || "No response",
					)
					toast({
						title: "データベースエラー",
						description: healthError?.message?.includes("does not exist")
							? `データベーステーブルが未作成です。apply_migration.sqlをSupabaseで実行してください。`
							: `データベース接続エラー: ${
									healthError?.message || "No response"
								}`,
					})
					return null
				}

				// Choose the appropriate edge function based on mode
				const functionName =
					mode === "FAST" ? "generate-tree-fast-v3" : "generate-tree-v3"

				// Get team_id from user details
				// Note: if userDetails is null (still loading), team_id/user_id will be
				// undefined here — the edge function will resolve them from the JWT as fallback
				if (!userDetails) {
					console.warn(
						"[useTreeGeneration] userDetails not yet loaded — team_id/user_id will be resolved server-side from JWT",
					)
				}
				const team_id = userDetails?.team_id

				// Extract research context if provided
				const { purpose, domain, mechanism, context } = extractResearchContext(
					researchContextData,
					mode,
				)

				// Build request body with optional research context parameters
				const savedMode = persistedMode ?? mode
				const requestBody = {
					searchTheme,
					team_id,
					user_id: userDetails?.user_id,
					language: getOutputLanguage(),
					mode: savedMode,
					searchMode:
						savedMode === "SOCIAL_PROBLEM" ? "social_problem" : undefined,
					socialProblemMode: savedMode === "SOCIAL_PROBLEM",
					...(context && { context }),
					...(purpose && { purpose }),
					...(domain && { domain }),
					...(mechanism && { mechanism }),
				}

				// Log research context if provided
				if (researchContextData) {
					console.log("Generating tree with research context:", {
						searchTheme,
						mode,
						purpose,
						domain,
						mechanism,
						context,
					})
				}

				// Supabase is available, use the edge function
				const { data, error } = await supabase.functions.invoke(functionName, {
					body: requestBody,
				})

				if (error) {
					console.error("Edge Function error details:", error)
					throw new Error(
						`Edge Function error: ${error.message || "Unknown error"}`,
					)
				}

				if (!data) {
					throw new Error("No data returned from Edge Function")
				}

				// For both TED v3 and FAST v3, start polling for subtree completion
				if ((mode === "TED" || mode === "FAST") && data.treeId) {
					setPollingTreeId(data.treeId)

					// Link tree to selected project if exists
					if (selectedProjectId) {
						try {
							await projectService.addTreeToProject(
								selectedProjectId,
								data.treeId,
							)
						} catch (error) {
							console.error("Failed to link tree to project:", error)
							// Don't throw error - tree generation succeeded, linking is non-critical
						}
					}
					// For modes with background processing, create a placeholder tree structure
					if (data.status === "generating") {
						const placeholderTreeStructure = {
							root: {
								id: "root",
								content:
									mode === "FAST"
										? `Technology Seed: ${searchTheme}`
										: `Search Theme: ${searchTheme}`,
								level: 0,
								children:
									mode === "FAST"
										? data.implementations?.map((implementation: any) => ({
												id: implementation.id,
												content: implementation.name,
												level: 1,
												children: [], // Empty children for implementations being generated
											})) || []
										: data.scenarios?.map((scenario: any) => ({
												id: scenario.id,
												content: scenario.name,
												level: 1,
												children: [], // Empty children for scenarios being generated
											})) || [],
							},
							reasoning:
								mode === "FAST"
									? `Generated FAST tree for: ${searchTheme}`
									: `Generated TED tree for: ${searchTheme}`,
							layer_config:
								mode === "FAST"
									? ["Technology", "How1", "How2", "How3", "How4"]
									: ["Scenario", "Purpose", "Function", "Measure"],
							scenario_inputs: {
								what: null,
								who: null,
								where: null,
								when: null,
							},
						}

						const modeLabel =
							mode === "FAST" ? "FAST（シーズ深掘り）" : "TED（ニーズ深掘り）"
						const generatingLabel =
							mode === "FAST"
								? "実装方式の詳細を生成中..."
								: "シナリオの詳細を生成中..."
						const contextText = buildContextInfoMessage(
							purpose,
							domain,
							mechanism,
							mode,
						)

						const toastTitle = researchContextData
							? "研究コンテキスト付きツリー生成開始"
							: "ツリー生成開始"

						toast({
							title: toastTitle,
							description: `「${searchTheme}」の${modeLabel}ツリーが生成開始されました${contextText}。${generatingLabel}`,
						})

						return {
							success: true,
							treeId: data.treeId,
							treeStructure: placeholderTreeStructure,
							mode: savedMode,
							status: "generating",
							scenarios: data.scenarios ?? [],
							implementations: data.implementations ?? [],
							tech_strengths: data.tech_strengths ?? [],
						} as any // Use any to avoid type issues for now
					}
				}

				const modeLabel =
					mode === "FAST" ? "FAST（シーズ深掘り）" : "TED（ニーズ深掘り）"

				// Handle different completion states
				let completionMessage: string | null
				if (
					(mode === "TED" || mode === "FAST") &&
					data.status === "generating"
				) {
					// Don't show completion toast here, it was already shown above
					completionMessage = null
				} else {
					const contextText = buildContextInfoMessage(
						purpose,
						domain,
						mechanism,
						mode,
					)

					if (researchContextData) {
						completionMessage = `「${searchTheme}」の${modeLabel}ツリーが研究コンテキスト付きで生成されました${contextText}`
					} else if (mode === "TED") {
						completionMessage = `「${searchTheme}」の${modeLabel}ツリーが生成開始されました。シナリオの詳細を生成中...`
					} else if (mode === "FAST") {
						completionMessage = `「${searchTheme}」の${modeLabel}ツリーが生成開始されました。実装方式の詳細を生成中...`
					} else {
						completionMessage = `「${searchTheme}」の${modeLabel}ツリーが生成されました`
					}
				}

				if (completionMessage) {
					const toastTitle = researchContextData
						? "研究コンテキスト付きツリー生成完了"
						: mode === "TED" || mode === "FAST"
							? "ツリー生成開始"
							: "ツリー生成完了"

					toast({
						title: toastTitle,
						description: completionMessage,
					})
				}

				return { ...data, mode: savedMode } as TreeGenerationResult & {
					mode: string
				}
			} catch (error) {
				console.error("Tree generation error:", error)

				// Show error instead of fallback to demo mode
				const errorTitle = "生成エラー"
				const errorDescription = researchContextData
					? error instanceof Error
						? error.message
						: `「${searchTheme}」の研究コンテキスト付きツリー生成に失敗しました`
					: error instanceof Error
						? error.message
						: `「${searchTheme}」のツリー生成に失敗しました`

				toast({
					title: errorTitle,
					description: errorDescription,
				})

				return null
			} finally {
				setIsGenerating(false)
			}
		},
		[userDetails, setPollingTreeId, selectedProjectId],
	)

	const generateResearchContext = async (
		query: string,
		aim: string,
		type: "TED" | "FAST",
	) => {
		if (!query.trim() || !aim.trim()) {
			toast({
				title: "エラー",
				description: "クエリと目的を入力してください",
			})
			return null
		}

		try {
			const { data, error } = await supabase.functions.invoke(
				"research-context",
				{
					body: { query, aim, type },
				},
			)

			if (error) {
				console.error("Research context error:", error)
				throw new Error(
					`Research context error: ${error.message || "Unknown error"}`,
				)
			}

			if (!data) {
				throw new Error("No data returned from research context function")
			}

			return data
		} catch (error) {
			console.error("Research context generation error:", error)
			toast({
				title: "研究文脈生成エラー",
				description:
					error instanceof Error
						? error.message
						: "研究文脈の生成に失敗しました",
			})
			return null
		}
	}

	/**
	 * Generates a tree with research context (wrapper for backward compatibility).
	 * This is now a simple wrapper around generateTree with researchContextData.
	 */
	const generateTreeWithResearchContext = async (
		searchTheme: string,
		mode: "TED" | "FAST" = "TED",
		researchContextData?: ResearchContextData,
	): Promise<TreeGenerationResult | null> => {
		return generateTree(searchTheme, mode, researchContextData)
	}

	const generateTechnicalStrengths = async (treeId: string) => {
		try {
			setGeneratingTechnicalStrengths(true)

			const { data } = await supabase.functions.invoke(
				"generate-technical-strengths",
				{
					body: {
						tree_id: treeId,
						language: getOutputLanguage(),
					},
				},
			)

			if (data?.technical_strengths) {
				return {
					success: true,
					technical_strengths: data.technical_strengths,
					status: "technical_strengths_ready",
				}
			}
		} catch (error) {
			console.error("Scenario generation error:", error)
			toast({
				title: "シナリオ生成エラー",
				description:
					error instanceof Error
						? error.message
						: "シナリオの生成に失敗しました",
			})
			return null
		} finally {
			setGeneratingTechnicalStrengths(false)
		}
	}

	const generateScenarios = async (
		searchTheme: string,
		mode: "TED" | "FAST" = "TED",
	): Promise<any | null> => {
		if (!searchTheme.trim()) {
			toast({
				title: "エラー",
				description: "検索テーマを入力してください",
			})
			return null
		}

		setIsGenerating(true)

		try {
			// For now, generate the tree normally and extract scenarios
			const result = await generateTree(searchTheme, mode)

			if (result?.treeId) {
				try {
					const technical_strengths = await generateTechnicalStrengths(
						result.treeId,
					)

					if (technical_strengths?.success) {
						console.log("Generated technical strengths:", technical_strengths)

						setGeneratingScenarios(true)

						const { data, error } = await supabase.functions.invoke(
							"generate-scenarios",
							{
								body: {
									tree_id: result.treeId,
									language: getOutputLanguage(),
								},
							},
						)

						if (error) {
							console.error("Scenario generation error:", error)
							toast({
								title: "シナリオ生成エラー",
								description:
									error instanceof Error
										? error.message
										: "シナリオの生成に失敗しました",
							})
							return null
						} else {
							return {
								success: true,
								scenarios: data.scenarios,
								status: "scenarios_ready",
							}
						}
					}
				} catch (error) {
					console.error("Error generating technical strengths:", error)
				}
			}

			return null
		} catch (error) {
			console.error("Scenario generation error:", error)
			toast({
				title: "生成エラー",
				description:
					error instanceof Error
						? error.message
						: `「${searchTheme}」のシナリオ生成に失敗しました`,
			})
			return null
		} finally {
			setIsGenerating(false)
			setGeneratingScenarios(false)
		}
	}

	// const enrichTree = async (treeId: string) => {
	// 	await enrichTreeForExploration(treeId).catch((error) => {
	// 		console.error("[TREE_ENRICH] Failed to enrich tree:", error)
	// 	})
	// }

	const loadTreeFromDatabase = useCallback(
		async (treeId: string) => {
			try {
				// Validate UUID format
				const isValidUUID = (str: string) => {
					const uuidRegex =
						/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
					return uuidRegex.test(str)
				}

				if (!isValidUUID(treeId)) {
					// console.log("Invalid UUID format for tree ID:", treeId)
					toast({
						title: "無効なID",
						description: `無効なツリーID形式です: ${treeId}。正しいUUIDを提供してください。`,
					})
					return null
				} // Load tree metadata
				const { data: treeData, error: treeError } = await supabase
					.from("technology_trees")
					.select("*")
					.eq("id", treeId)
					.single()

				if (treeError) {
					// Check if it's a table doesn't exist error
					if (treeError.message.includes("does not exist")) {
						toast({
							title: "データベース未設定",
							description:
								"データベーステーブルが作成されていません。apply_migration.sqlをSupabaseで実行してください。",
						})
						return null
					}
					throw new Error(treeError.message)
				}

				// Check if user has access to this tree (same team or no team restriction)
				const userTeamId = userDetails?.team_id
				if (treeData.team_id && userTeamId && treeData.team_id !== userTeamId) {
					toast({
						title: "アクセス権限エラー",
						description: "このツリーにアクセスする権限がありません。",
					})
					return null
				} // Load all nodes for this tree

				const { data: nodesData, error: nodesError } = await supabase
					.from("tree_nodes")
					.select("*")
					.eq("tree_id", treeId)
					.order("level", { ascending: true })
					.order("node_order", { ascending: true })

				if (nodesError) {
					throw new Error(nodesError.message)
				}
				// Reconstruct tree structure
				const nodeMap = new Map()
				nodesData.forEach((node) => {
					nodeMap.set(node.id, { ...node, children: [] })
				})

				// Build parent-child relationships
				nodesData.forEach((node) => {
					if (node.parent_id && nodeMap.has(node.parent_id)) {
						nodeMap.get(node.parent_id).children.push(nodeMap.get(node.id))
					}
				})

				// Find root node (level 0)
				const rootNode = nodesData.find((node) => node.level === 0)
				if (!rootNode) {
					throw new Error("Root node not found in database")
				}

				const treeStructure = {
					root: nodeMap.get(rootNode.id),
					reasoning: treeData.reasoning,
					layer_config: treeData.layer_config,
					scenario_inputs: treeData.scenario_inputs,
				}
				return {
					treeData,
					treeStructure,
				}
			} catch (error) {
				console.error("Load tree error:", error)
				toast({
					title: "読み込みエラー",
					description:
						error instanceof Error
							? error.message
							: "ツリーの読み込みに失敗しました",
				})
				return null
			}
		},
		[userDetails],
	)

	const listSavedTrees = useCallback(async () => {
		// Prevent multiple simultaneous calls to avoid loading flicker
		if (treesLoading) {
			return trees
		}
		if (userDetails === undefined || userDetails?.team_id === null) {
			return trees
		}

		try {
			// Use store's fetchTrees method
			const result = await fetchTrees()
			return result
		} catch (error) {
			console.error("List trees error:", error)
			toast({
				title: "一覧取得エラー",
				description:
					error instanceof Error
						? error.message
						: "ツリー一覧の取得に失敗しました",
			})
			return []
		}
	}, [userDetails, trees, treesLoading, fetchTrees])

	/**
	 * Generate scenarios only (for scenario selection page)
	 * This is a temporary implementation using dummy data
	 * TODO: Replace with actual edge function call when backend is ready
	 */
	const generateScenariosOnly = useCallback(
		async (
			searchTheme: string,
			mode: "TED" | "FAST" = "TED",
		): Promise<any | null> => {
			if (!searchTheme.trim()) {
				toast({
					title: "エラー",
					description: "検索テーマを入力してください",
				})
				return null
			}

			setIsGenerating(true)

			try {
				// For now, generate the tree normally and extract scenarios
				const result = await generateTree(searchTheme, mode)

				if (result?.treeStructure) {
					// Extract level 1 nodes as scenarios
					const level1Nodes = result.treeStructure.root.children || []

					// Convert to scenarios without dummy data. Keep only fields available
					const scenarios = level1Nodes.map((node: any) => ({
						id: node.id,
						name: node.content,
						description: node.description || "",
						level: 1,
						// preserve any metrics attached to the node; do not generate dummy metrics
						metrics: node.metrics ?? {},
						tags: node.tags ?? [],
					}))

					return {
						treeId: result.treeId,
						scenarios,
						investigationAim:
							result.treeStructure.scenario_inputs?.scenario || "",
						mode,
						status: "scenarios_ready",
						tech_strengths: (result as any).tech_strengths ?? [],
					}
				}

				return null
			} catch (error) {
				console.error("Scenario generation error:", error)
				toast({
					title: "生成エラー",
					description:
						error instanceof Error
							? error.message
							: `「${searchTheme}」のシナリオ生成に失敗しました`,
				})
				return null
			} finally {
				setIsGenerating(false)
			}
		},
		[generateTree],
	)

	return {
		generateTree,
		generateScenarios,
		generateTreeWithResearchContext,
		generateResearchContext,
		generateScenariosOnly,
		loadTreeFromDatabase,
		listSavedTrees,
		isGenerating,
		generatingTechnicalStrengths,
		generatingScenarios,
		trees,
		treesLoading,
		pollingTreeId,
		setPollingTreeId,
	}
}
