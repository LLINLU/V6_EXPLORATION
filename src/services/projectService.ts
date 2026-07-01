import type { Tree, UserDetails } from "@/infrastructure/supabaseRepository"
import { supabaseRepository } from "@/infrastructure/supabaseRepository"
import { supabase } from "@/integrations/supabase/client"
import type { IDatabaseRepository } from "@/services/types"

/**
 * Project service - Business logic layer for projects
 *
 * DI経由でインフラ層を呼び出します。
 * テスト時にはモックと差し替え可能です。
 */

export class ProjectService {
	constructor(private databaseRepo: IDatabaseRepository = supabaseRepository) {}

	/**
	 * 現在のユーザーのteam_idを取得
	 */
	private async getUserDetails(): Promise<UserDetails> {
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			throw new Error("User not authenticated")
		}

		const userDetails = await this.databaseRepo.fetchUserDetailsById(user.id)
		if (!userDetails) {
			throw new Error("User details not found")
		}

		return userDetails
	}

	/**
	 * プロジェクトを作成
	 */
	async createProject(
		name: string,
		options?: {
			description?: string
			visibility?: "private" | "team" | "public"
		},
	) {
		const userDetails = await this.getUserDetails()
		if (!userDetails) {
			throw new Error("User details not found")
		}

		if (!userDetails.team_id) {
			throw new Error("Team ID not found")
		}

		if (!userDetails.user_id) {
			throw new Error("User ID not found")
		}

		return this.databaseRepo.createProject({
			name,
			description: options?.description,
			visibility: options?.visibility || "private",
			teamId: userDetails.team_id,
			creatorId: userDetails.user_id,
		})
	}

	/**
	 * プロジェクト一覧を取得（現在のユーザーのteam_idでフィルタリング）
	 */
	async fetchProjects(limit = 50) {
		const userDetails = await this.getUserDetails()
		if (!userDetails) {
			throw new Error("User details not found")
		}

		if (!userDetails.team_id) {
			throw new Error("Team ID not found")
		}
		const teamId = userDetails.team_id

		return this.databaseRepo.fetchProjects({ limit, teamId })
	}

	/**
	 * プロジェクト一覧をツリー数とともに取得（現在のユーザーのteam_idでフィルタリング）
	 */
	async fetchProjectsWithTreeCount(limit = 50) {
		const userDetails = await this.getUserDetails()
		if (!userDetails) {
			throw new Error("User details not found")
		}

		if (!userDetails.team_id) {
			throw new Error("Team ID not found")
		}
		const teamId = userDetails.team_id

		return this.databaseRepo.fetchProjectsWithTreeCount({ limit, teamId })
	}

	/**
	 * プロジェクトを取得
	 */
	async fetchProjectById(projectId: string) {
		return this.databaseRepo.fetchProjectById(projectId)
	}

	/**
	 * プロジェクトを更新
	 */
	async updateProject(
		projectId: string,
		input: {
			name?: string
			description?: string
			visibility?: "private" | "team" | "public"
			teamId?: string
		},
	) {
		return this.databaseRepo.updateProject(projectId, input)
	}

	async updateProjectName(projectId: string, newName: string) {
		return this.databaseRepo.updateProjectName(projectId, newName)
	}

	/**
	 * プロジェクトを削除
	 */
	async deleteProject(projectId: string) {
		return this.databaseRepo.deleteProject(projectId)
	}

	/**
	 * プロジェクトにツリーを追加
	 */
	async addTreeToProject(projectId: string, treeId: string, position?: number) {
		return this.databaseRepo.addTreeToProject(projectId, treeId, position)
	}

	/**
	 * プロジェクトからツリーを削除
	 */
	async removeTreeFromProject(projectId: string, treeId: string) {
		return this.databaseRepo.removeTreeFromProject(projectId, treeId)
	}

	/**
	 * プロジェクトに属するツリー一覧を取得
	 */
	async fetchTreesByProject(projectId: string) {
		const projectTrees =
			await this.databaseRepo.fetchProjectTreesWithDetails(projectId)

		// Extract and filter trees
		return projectTrees
			.map((item) => item.tree)
			.filter((tree): tree is Tree => tree !== null)
	}

	/**
	 * 指定したツリーが追加されているプロジェクトIDの一覧を取得
	 */
	async fetchProjectIdsForTree(treeId: string): Promise<string[]> {
		return this.databaseRepo.fetchProjectIdsForTree(treeId)
	}

	/**
	 * 全てのプロジェクトとツリーの関連を取得（現在のチームに属するもののみ）
	 */
	async fetchAllProjectTreeRelations() {
		const userDetails = await this.getUserDetails()
		if (!userDetails) {
			throw new Error("User details not found")
		}

		if (!userDetails.team_id) {
			throw new Error("Team ID not found")
		}

		return this.databaseRepo.fetchAllProjectTreeRelations(userDetails.team_id)
	}

	/**
	 * プロジェクトツリーの順序を更新
	 */
	async updateProjectTreePosition(
		projectId: string,
		treeId: string,
		position: number,
	) {
		return this.databaseRepo.updateProjectTreePosition(
			projectId,
			treeId,
			position,
		)
	}

	/**
	 * プロジェクトをツリーと一緒に取得
	 */
	async fetchProjectWithTrees(projectId: string) {
		const project = await this.databaseRepo.fetchProjectById(projectId)
		if (!project) {
			return null
		}

		const trees = await this.fetchTreesByProject(projectId)

		return {
			...project,
			trees,
		}
	}
}

// =============================================================================
// Default Instance
// =============================================================================

/**
 * デフォルトのProjectServiceインスタンス
 *
 * 通常はこのインスタンスを使用します。
 * テスト時には new ProjectService(mockDeps) で新しいインスタンスを作成できます。
 */
export const projectService = new ProjectService()
