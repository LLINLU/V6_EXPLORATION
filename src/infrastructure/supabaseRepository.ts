import { supabase } from "@/integrations/supabase/client"
import type {
	CreateProjectInput,
	NodeChildrenCountRow,
	Project,
	ProjectListOptions,
	ProjectTree,
	ProjectWithTreeCount,
	Tree,
	TreeIdsOptions,
	TreeListOptions,
	TreeSearchOptions,
	UpdateProjectInput,
	UserDetails,
} from "@/types/infrastructure"

export type {
	CreateProjectInput,
	NodeChildrenCountRow,
	Project,
	ProjectListOptions,
	ProjectTree,
	ProjectWithTreeCount,
	ProjectWithTrees,
	Tree,
	TreeIdsOptions,
	TreeListOptions,
	TreeSearchOptions,
	UpdateProjectInput,
	UserDetails,
} from "@/types/infrastructure"

/**
 * Infrastructure layer - Supabase Repository
 *
 * 純粋なデータベースクエリを提供します。
 * ビジネスロジック（team_idフィルタリングなど）は含みません。
 */

// =============================================================================
// Supabase Repository
// =============================================================================

/**
 * Supabase Repository
 *
 * Supabaseデータベースへのアクセスを提供します。
 */
export class SupabaseRepository {
	/**
	 * ツリー一覧を取得（フル情報）
	 */
	async fetchTrees(options: TreeListOptions = {}): Promise<Tree[]> {
		const { orderBy = "created_at", ascending = false, teamId } = options

		let query = supabase
			.from("technology_trees")
			.select("*")
			.order(orderBy, { ascending })

		if (teamId) {
			query = query.eq("user_id", teamId)
		}

		const { data, error } = await query

		if (error) {
			throw new Error(`Failed to fetch trees: ${error.message}`)
		}

		return (data as Tree[]) || []
	}

	async fetchTreesBySearchQuery(
		options: TreeSearchOptions = {},
	): Promise<Tree[]> {
		const { limit, userId, search } = options
		// If there's a search term, we calculate similarity score
		// otherwise, we just select everything

		if (!userId) return []

		let query = supabase
			.from("technology_trees")
			.select("*")
			.eq("user_id", userId)

		if (search && search.trim() !== "") {
			// This looks for the term in the name OR the search_theme
			// The % allows for partial matches (e.g., "Carbon" matches "Carbon Neutral")
			query = query.or(`name.ilike.%${search}%,search_theme.ilike.%${search}%`)
		}
		const { data, error } = await query
			.order("updated_at", { ascending: false })
			.limit(limit || 50)

		if (error) console.log(error)

		return (data ?? []) as Tree[]
	}

	/**
	 * ツリーIDのみを取得（軽量）
	 */
	async fetchTreeIds(options: TreeIdsOptions = {}): Promise<string[]> {
		const { limit = 10, teamId } = options

		let query = supabase
			.from("technology_trees")
			.select("id")
			.order("created_at", { ascending: false })

		if (teamId) {
			query = query.eq("user_id", teamId)
		}

		if (limit) {
			query = query.limit(limit)
		}

		const { data, error } = await query

		if (error) {
			throw new Error(`Failed to fetch tree IDs: ${error.message}`)
		}

		return data?.map((t) => t.id) || []
	}

	/**
	 * 単一のツリーを取得
	 */
	async fetchTreeById(treeId: string): Promise<Tree | null> {
		const { data, error } = await supabase
			.from("technology_trees")
			.select("id, name, search_theme, created_at, mode, user_id")
			.eq("id", treeId)
			.single()

		if (error) {
			if (error.code === "PGRST116") {
				// Not found
				return null
			}
			throw new Error(`Failed to fetch tree: ${error.message}`)
		}

		return data as Tree
	}

	/**
	 * チームに紐づくツリー一覧を取得
	 */
	async fetchTreesByTeam(teamId?: string | null): Promise<Tree[]> {
		if (!teamId) {
			return []
		}

		const { data, error } = await supabase
			.from("technology_trees")
			.select("*")
			.order("created_at", { ascending: false })
			.eq("team_id", teamId)

		if (error) {
			if (error.message.includes("does not exist")) {
				return []
			}
			throw new Error(`Failed to fetch team trees: ${error.message}`)
		}

		return (data as Tree[]) || []
	}

	/**
	 * ツリーの最終閲覧日時を更新
	 */
	async updateLastViewedAt(treeId: string): Promise<void> {
		const { error } = await supabase
			.from("technology_trees")
			.update({ last_viewed_at: new Date().toISOString() })
			.eq("id", treeId)

		if (error) {
			throw new Error(`Failed to update last_viewed_at: ${error.message}`)
		}
	}

	// Update tree / search name
	async updateSearchName(treeId: string, newName: string): Promise<void> {
		const { error } = await supabase
			.from("technology_trees")
			.update({ name: newName })
			.eq("id", treeId)

		if (error) {
			throw new Error(`Failed to update tree name: ${error.message}`)
		}
	}

	async deleteTree(treeId: string): Promise<void> {
		const { error } = await supabase
			.from("technology_trees")
			.delete()
			.eq("id", treeId)

		if (error) {
			throw new Error(`Failed to delete tree: ${error.message}`)
		}
	}

	// =============================================================================
	// Project Methods
	// =============================================================================

	/**
	 * プロジェクトを作成
	 */
	async createProject(input: CreateProjectInput): Promise<Project> {
		const { data, error } = await supabase
			.from("projects")
			.insert({
				name: input.name,
				description: input.description,
				visibility: input.visibility,
				team_id: input.teamId,
				creator_id: input.creatorId,
			})
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to create project: ${error.message}`)
		}

		return data as Project
	}

	/**
	 * プロジェクト一覧を取得
	 */
	async fetchProjects(options: ProjectListOptions = {}): Promise<Project[]> {
		const {
			limit = 50,
			orderBy = "created_at",
			ascending = false,
			teamId,
			creatorId,
		} = options

		let query = supabase
			.from("projects")
			.select("*")
			.order(orderBy, { ascending })

		if (teamId) {
			query = query.eq("team_id", teamId)
		}

		if (creatorId) {
			query = query.eq("creator_id", creatorId)
		}

		if (limit) {
			query = query.limit(limit)
		}

		const { data, error } = await query

		if (error) {
			throw new Error(`Failed to fetch projects: ${error.message}`)
		}

		return (data as Project[]) || []
	}

	/**
	 * プロジェクト一覧をツリー数とともに取得
	 */
	async fetchProjectsWithTreeCount(
		options: ProjectListOptions = {},
	): Promise<ProjectWithTreeCount[]> {
		const {
			limit = 50,
			orderBy = "created_at",
			ascending = false,
			teamId,
			creatorId,
		} = options

		// Use a subquery to count trees for each project
		let query = supabase
			.from("projects")
			.select(
				`
				*,
				tree_count:project_trees(count)
			`,
			)
			.order(orderBy, { ascending })

		if (teamId) {
			query = query.eq("team_id", teamId)
		}

		if (creatorId) {
			query = query.eq("creator_id", creatorId)
		}

		if (limit) {
			query = query.limit(limit)
		}

		const { data, error } = await query

		if (error) {
			throw new Error(
				`Failed to fetch projects with tree count: ${error.message}`,
			)
		}

		// Transform the response to flatten tree_count
		const result = (data || []).map((project) => ({
			...project,
			tree_count: Array.isArray(project.tree_count)
				? (project.tree_count[0]?.count ?? 0)
				: 0,
		})) as ProjectWithTreeCount[]

		return result
	}

	/**
	 * 単一のプロジェクトを取得
	 */
	async fetchProjectById(projectId: string): Promise<Project | null> {
		const { data, error } = await supabase
			.from("projects")
			.select("*")
			.eq("id", projectId)
			.single()

		if (error) {
			if (error.code === "PGRST116") {
				// Not found
				return null
			}
			throw new Error(`Failed to fetch project: ${error.message}`)
		}

		return data as Project
	}

	/**
	 * プロジェクトを更新
	 */
	async updateProject(
		projectId: string,
		input: UpdateProjectInput,
	): Promise<Project> {
		const { data, error } = await supabase
			.from("projects")
			.update(input)
			.eq("id", projectId)
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to update project: ${error.message}`)
		}

		return data as Project
	}

	// Update project name
	async updateProjectName(projectId: string, newName: string): Promise<void> {
		const { error } = await supabase
			.from("projects")
			.update({ name: newName })
			.eq("id", projectId)

		if (error) {
			throw new Error(`Failed to update project name: ${error.message}`)
		}
	}

	/**
	 * プロジェクトを削除
	 */
	async deleteProject(projectId: string): Promise<void> {
		const { error } = await supabase
			.from("projects")
			.delete()
			.eq("id", projectId)

		if (error) {
			throw new Error(`Failed to delete project: ${error.message}`)
		}
	}

	// =============================================================================
	// Project-Tree Association Methods
	// =============================================================================

	/**
	 * プロジェクトにツリーを追加
	 */
	async addTreeToProject(
		projectId: string,
		treeId: string,
		position?: number,
	): Promise<ProjectTree> {
		const { data, error } = await supabase
			.from("project_trees")
			.insert({
				project_id: projectId,
				tree_id: treeId,
				position: position ?? 0,
			})
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to add tree to project: ${error.message}`)
		}

		return data as ProjectTree
	}

	/**
	 * プロジェクトからツリーを削除
	 */
	async removeTreeFromProject(
		projectId: string,
		treeId: string,
	): Promise<void> {
		const { error } = await supabase
			.from("project_trees")
			.delete()
			.eq("project_id", projectId)
			.eq("tree_id", treeId)

		if (error) {
			throw new Error(`Failed to remove tree from project: ${error.message}`)
		}
	}

	/**
	 * 指定したツリーが追加されているプロジェクトIDの一覧を取得
	 */
	async fetchProjectIdsForTree(treeId: string): Promise<string[]> {
		const { data, error } = await supabase
			.from("project_trees")
			.select("project_id")
			.eq("tree_id", treeId)

		if (error) {
			throw new Error(`Failed to fetch projects for tree: ${error.message}`)
		}

		return data?.map((item) => item.project_id) || []
	}

	/**
	 * プロジェクトに属するツリー一覧を取得（project_treesとtechnology_treesのjoin）
	 */
	async fetchProjectTreesWithDetails(projectId: string) {
		const { data, error } = await supabase
			.from("project_trees")
			.select(
				`
				position,
				tree:technology_trees (*)
			`,
			)
			.eq("project_id", projectId)
			.order("position", { ascending: true })

		if (error) {
			throw new Error(`Failed to fetch project trees: ${error.message}`)
		}

		return data || []
	}

	/**
	 * プロジェクトツリーの順序を更新
	 */
	async updateProjectTreePosition(
		projectId: string,
		treeId: string,
		position: number,
	): Promise<void> {
		const { error } = await supabase
			.from("project_trees")
			.update({ position })
			.eq("project_id", projectId)
			.eq("tree_id", treeId)

		if (error) {
			throw new Error(
				`Failed to update project tree position: ${error.message}`,
			)
		}
	}

	/**
	 * 全てのproject_treesの関連を取得（指定したチームに属するもののみ）
	 */
	async fetchAllProjectTreeRelations(
		team_id: string,
	): Promise<{ project_id: string; tree_id: string }[]> {
		const { data, error } = await supabase
			.from("project_trees")
			.select(
				`
				project_id,
				tree_id,
				projects!inner(creator_id, name)
			`,
			)
			.eq("projects.creator_id", team_id)

		if (error) {
			throw new Error(
				`Failed to fetch all project tree relations: ${error.message}`,
			)
		}

		// projectsのjoinデータは不要なので、project_idとtree_idのみ返す
		return (
			data?.map((item) => ({
				project_id: item.project_id,
				tree_id: item.tree_id,
			})) || []
		)
	}

	// =============================================================================
	// User Details Methods
	// =============================================================================

	/**
	 * ユーザー詳細を取得
	 */
	async fetchUserDetailsById(userId: string): Promise<UserDetails | null> {
		const { data, error } = await supabase
			.from("v_user_details")
			.select("*")
			.eq("user_id", userId)
			.single()

		if (error) {
			if (error.code === "PGRST116") {
				// Not found
				return null
			}
			throw new Error(`Failed to fetch user details: ${error.message}`)
		}

		return data as UserDetails
	}

	/**
	 * 指定したノードIDの子ノード数を取得
	 * ツリー構造のポーリングに使用
	 */
	async fetchNodeChildrenCounts(
		nodeIds: string[],
	): Promise<NodeChildrenCountRow[]> {
		if (nodeIds.length === 0) {
			return []
		}

		const { data, error } = await supabase
			.from("tree_nodes")
			.select("id, children_count, name")
			.in("id", nodeIds)
			.order("node_order", { ascending: true })

		if (error) {
			throw new Error(`Failed to fetch node children counts: ${error.message}`)
		}

		return data || []
	}

	/**
	 * データベース接続ヘルスチェック
	 */
	async checkDatabaseHealth(): Promise<{ data: unknown; error: unknown }> {
		const { data, error } = await supabase
			.from("technology_trees")
			.select("count")
			.limit(1)

		return { data, error }
	}

	/**
	 * ツリーのメタデータ（フル情報）を取得
	 */
	async fetchTreeMetadata(treeId: string) {
		const { data, error } = await supabase
			.from("technology_trees")
			.select("*")
			.eq("id", treeId)
			.single()

		return { data, error }
	}

	/**
	 * ツリーの全ノードを取得
	 */
	async fetchTreeNodes(treeId: string) {
		const { data, error } = await supabase
			.from("tree_nodes")
			.select("*")
			.eq("tree_id", treeId)
			.order("level", { ascending: true })
			.order("node_order", { ascending: true })

		return { data, error }
	}
}

// =============================================================================
// Default Instance
// =============================================================================

/**
 * デフォルトのSupabaseRepositoryインスタンス
 */
export const supabaseRepository = new SupabaseRepository()
