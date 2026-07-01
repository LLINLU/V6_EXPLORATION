// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import {
	corsPreflightResponse,
	jsonErrorResponse,
	sseStreamResponse,
} from "./cors.ts"
import {
	existsTree,
	existsTreeNode,
	saveNodeUseCasesWithSummary,
} from "./db-operations.ts"
import { searchMarketImpls } from "./search-api.ts"
import { SSEWriter } from "./sse-writer.ts"

serve(async (req) => {
	if (req.method === "OPTIONS") return corsPreflightResponse()
	try {
		const body = await req.json()
		// ---- validation ----
		if (!body.query || !body.query.trim()) {
			return jsonErrorResponse("Missing required parameter: query", 400)
		}
		if (!body.node_id || !body.node_id.trim()) {
			return jsonErrorResponse("Missing required parameter: node_id", 400)
		}
		if (!body.tree_id || !body.tree_id.trim()) {
			return jsonErrorResponse("Missing required parameter: tree_id", 400)
		}
		/*if (!body.team_id || !body.team_id.trim()) {
      return jsonErrorResponse("Missing required parameter: team_id", 400)
    }*/ const query = body.query.trim()
		const nodeId = body.node_id.trim()
		const treeId = body.tree_id.trim()
		const teamId = body.team_id //body.team_id.trim()
		const language = body.language ?? "English"
		const scenarioName = body.scenario_name ?? ""
		const scenarioDescription = body.scenario_description ?? ""
		const userContext = body.user_context ?? ""
		// ---- 外部キーの存在確認 ----
		if (!(await existsTreeNode(nodeId))) {
			return jsonErrorResponse(
				`Node "${nodeId}" does not exist in tree_nodes table`,
				400,
			)
		}
		if (!(await existsTree(treeId))) {
			return jsonErrorResponse(
				`Tree "${treeId}" does not exist in technology_trees table`,
				400,
			)
		}
		/*if (!(await existsTeam(teamId))) {
      return jsonErrorResponse(
        `Team "${teamId}" does not exist in teams table`,
        400,
      )
    }*/ // ---- SSE ストリーミングレスポンス ----
		const stream = new ReadableStream({
			async start(controller) {
				const writer = new SSEWriter(controller)
				try {
					// 1. 市場実装検索（upstream SSE をリレー）
					const markets = await searchMarketImpls(
						query,
						language,
						scenarioName,
						scenarioDescription,
						userContext,
						(upstream) => {
							writer.send(upstream)
						},
					)
					// 2. DB 保存 + 要約生成
					if (markets.length > 0) {
						writer.send({
							type: "progress",
							phase: "saving",
							message_ja: "検索結果をデータベースに保存中...",
							message_en: "Saving search results to database...",
							progress: 90,
						})
						const { savedCount, summaryGenerated } =
							await saveNodeUseCasesWithSummary(
								nodeId,
								treeId,
								markets,
								teamId,
								query,
							)
						// 3. 完了
						writer.send({
							type: "result",
							phase: "complete",
							message_ja: `検索完了 (${markets.length}件取得, ${savedCount}件保存)`,
							message_en: `Search complete (${markets.length} fetched, ${savedCount} saved)`,
							progress: 100,
							data: {
								markets,
								savedCount,
								summaryGenerated,
							},
						})
					} else {
						// 検索結果 0 件
						writer.send({
							type: "result",
							phase: "complete",
							message_ja: "検索完了 (0件)",
							message_en: "Search complete (0 markets)",
							progress: 100,
							data: {
								markets: [],
								savedCount: 0,
								summaryGenerated: false,
							},
						})
					}
				} catch (e) {
					writer.send({
						type: "error",
						phase: "error",
						message_ja: e?.message ?? "市場実装検索でエラーが発生しました",
						message_en: e?.message ?? "Market implementation search failed",
						progress: -1,
					})
				}
				writer.close()
			},
		})
		return sseStreamResponse(stream)
	} catch (err) {
		return jsonErrorResponse(err?.message ?? "unknown", 500)
	}
})
