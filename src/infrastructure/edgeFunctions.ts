import { supabase } from "@/integrations/supabase/client"
import type { DuplicateTreeRequest } from "@/types/infrastructure"

export type {
	DuplicateTreeRequest,
	DuplicateTreeResponse,
} from "@/types/infrastructure"

/**
 * Infrastructure layer - Edge Functions Repository
 *
 * Supabase edge functionsとの通信を担当します。
 * ビジネスロジックは含まず、純粋に技術的な実装のみです。
 */

// =============================================================================
// Edge Function Repository
// =============================================================================

/**
 * Edge Function Repository
 *
 * Supabase edge functionsへのアクセスを提供します。
 */
export class EdgeFunctionRepository {
	/**
	 * ツリー複製edge functionを呼び出す（結果を待たない）
	 *
	 * バックグラウンドで処理を開始し、即座にreturnします。
	 * 処理の完了は別途ポーリングで検出する必要があります。
	 */
	async invokeDuplicateTree(treeId: string, newName?: string): Promise<void> {
		await supabase.functions
			.invoke("duplicate-tree", {
				body: {
					tree_id: treeId,
					new_name: newName,
				} satisfies DuplicateTreeRequest,
			})
			.catch((error) => {
				console.error("[invokeDuplicateTree] Error:", error)
			})
	}

	/**
	 * ツリー生成edge functionを呼び出す
	 */
	async invokeGenerateTree(params: {
		functionName: string
		requestBody: Record<string, unknown>
	}) {
		const { data, error } = await supabase.functions.invoke(
			params.functionName,
			{
				body: params.requestBody,
			},
		)

		return { data, error }
	}

	/**
	 * 研究コンテキスト生成edge functionを呼び出す
	 */
	async invokeResearchContext(params: {
		query: string
		aim: string
		type: "TED" | "FAST"
	}) {
		const { data, error } = await supabase.functions.invoke(
			"research-context",
			{
				body: { query: params.query, aim: params.aim, type: params.type },
			},
		)

		return { data, error }
	}
}

// =============================================================================
// Default Instance
// =============================================================================

/**
 * デフォルトのEdgeFunctionRepositoryインスタンス
 */
export const edgeFunctionRepository = new EdgeFunctionRepository()
