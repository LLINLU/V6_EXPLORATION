import { edgeFunctionRepository } from "@/infrastructure/edgeFunctions"
import type { Tree } from "@/infrastructure/supabaseRepository"
import { supabaseRepository } from "@/infrastructure/supabaseRepository"
import { supabase } from "@/integrations/supabase/client"
import type {
	IDatabaseRepository,
	IEdgeFunctionRepository,
} from "@/services/types"

/**
 * Tree service - Business logic layer
 *
 * DI経由でインフラ層を呼び出します。
 * テスト時にはモックと差し替え可能です。
 */

export class TreeService {
	constructor(
		private edgeFunctionRepo: IEdgeFunctionRepository = edgeFunctionRepository,
		private databaseRepo: IDatabaseRepository = supabaseRepository,
	) {}

	private async getUserId(): Promise<string | undefined> {
		const {
			data: { user },
		} = await supabase.auth.getUser()
		return user?.id
	}

	/**
	 * ツリーを複製する
	 *
	 * DI経由でedge functionを呼び出します。
	 * Fire-and-forget pattern: エラーはログに記録されます。
	 */
	duplicateTree(treeId: string, newName?: string): void {
		this.edgeFunctionRepo
			.invokeDuplicateTree(treeId, newName)
			.catch((error) => {
				console.error("[TreeService] Failed to duplicate tree:", error)
				console.error("[TreeService] Tree ID:", treeId, "New name:", newName)
			})
	}

	/**
	 * ツリー一覧を取得（user_idでフィルタリング）
	 */
	async fetchTrees(): Promise<Tree[]> {
		const teamId = await this.getUserId()
		return this.databaseRepo.fetchTrees({ teamId })
	}

	/**
	 * ツリーIDのみを取得（user_idでフィルタリング）
	 */
	async fetchTreeIds(limit = 10): Promise<string[]> {
		const teamId = await this.getUserId()
		return this.databaseRepo.fetchTreeIds({ limit, teamId })
	}

	/**
	 * ポーリング用のツリー一覧を取得（user_idでフィルタリング）
	 */
	async fetchTreesForPolling(): Promise<Tree[]> {
		const teamId = await this.getUserId()
		return this.databaseRepo.fetchTrees({ teamId })
	}

	async fetchTreesBySearchQuery(searchQuery: string): Promise<Tree[]> {
		// teamId?: string
		// page?: number
		// pageSize?: number
		// search?: string
		// const userId = await this.getUserId()
		const user_id = await this.getUserId()

		return this.databaseRepo.fetchTreesBySearchQuery({
			userId: user_id,
			limit: 5,
			search: searchQuery,
		})
	}

	/**
	 * ツリーの最終閲覧日時を更新
	 */
	async updateLastViewedAt(treeId: string): Promise<void> {
		return this.databaseRepo.updateLastViewedAt(treeId)
	}

	async updateSearchName(treeId: string, newName: string): Promise<void> {
		return this.databaseRepo.updateSearchName(treeId, newName)
	}

	/**
	 * 指定したノードIDの子ノード数を取得
	 * ツリー構造のポーリングに使用
	 */
	async fetchNodeChildrenCounts(
		nodeIds: string[],
	): Promise<Array<{ id: string; children_count: number; name: string }>> {
		const data = await this.databaseRepo.fetchNodeChildrenCounts(nodeIds)

		// Transform the data to ensure children_count is a number
		return data.map((row) => ({
			id: row.id,
			name: row.name,
			children_count:
				typeof row.children_count === "number" ? row.children_count : 0,
		}))
	}

	async deleteTree(_tree_id: string): Promise<boolean> {
		/*
			1. Fetch original tree
			2. Does this person have permissions?
				2.1 Create a permissions checker function / class?
				2.2. Currently, just check if the person is the creator of this tree.
			3. Find the tree, and delete it including everything in cascade — nodes, papers, use cases, saved papers, saved use cases.
		*/
		await this.databaseRepo.deleteTree(_tree_id)
		return true
	}
}

// =============================================================================
// Default Instance
// =============================================================================

/**
 * デフォルトのTreeServiceインスタンス
 *
 * 通常はこのインスタンスを使用します。
 * テスト時には new TreeService(mockDeps) で新しいインスタンスを作成できます。
 */
export const treeService = new TreeService()

// Re-export types
export type {
	IDatabaseRepository,
	IEdgeFunctionRepository,
} from "@/services/types"
