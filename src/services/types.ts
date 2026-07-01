/**
 * Service layer types
 */

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
} from "@/infrastructure/supabaseRepository"

// =============================================================================
// Dependency Injection Types
// =============================================================================

/**
 * Edge function repository interface
 *
 * TreeServiceが依存するリポジトリのインターフェース
 */
export interface IEdgeFunctionRepository {
	invokeDuplicateTree(treeId: string, newName?: string): Promise<void>
	invokeGenerateTree(params: {
		functionName: string
		requestBody: Record<string, unknown>
	}): Promise<{ data: unknown; error: unknown }>
	invokeResearchContext(params: {
		query: string
		aim: string
		type: "TED" | "FAST"
	}): Promise<{ data: unknown; error: unknown }>
}

/**
 * Database repository interface
 *
 * TreeServiceが依存するデータベースリポジトリのインターフェース
 */
export interface IDatabaseRepository {
	// Tree methods
	fetchTrees(options?: TreeListOptions): Promise<Tree[]>
	fetchTreeIds(options?: TreeIdsOptions): Promise<string[]>
	fetchTreeById(treeId: string): Promise<Tree | null>
	fetchTreesByTeam(teamId: string): Promise<Tree[]>
	fetchTreesBySearchQuery(options?: TreeSearchOptions): Promise<Tree[]>
	updateLastViewedAt(treeId: string): Promise<void>
	updateSearchName(treeId: string, newName: string): Promise<void>
	deleteTree(treeId: string): Promise<void>

	// Project methods
	createProject(input: CreateProjectInput): Promise<Project>
	fetchProjects(options?: ProjectListOptions): Promise<Project[]>
	fetchProjectsWithTreeCount(
		options?: ProjectListOptions,
	): Promise<ProjectWithTreeCount[]>
	fetchProjectById(projectId: string): Promise<Project | null>
	updateProject(projectId: string, input: UpdateProjectInput): Promise<Project>
	deleteProject(projectId: string): Promise<void>
	updateProjectName(projectId: string, newName: string): Promise<void>

	// Project-Tree association methods
	addTreeToProject(
		projectId: string,
		treeId: string,
		position?: number,
	): Promise<ProjectTree>
	removeTreeFromProject(projectId: string, treeId: string): Promise<void>
	fetchProjectTreesWithDetails(
		projectId: string,
	): Promise<{ position: number; tree: any }[]>
	fetchProjectIdsForTree(treeId: string): Promise<string[]>
	fetchAllProjectTreeRelations(
		teamId: string,
	): Promise<{ project_id: string; tree_id: string }[]>
	updateProjectTreePosition(
		projectId: string,
		treeId: string,
		position: number,
	): Promise<void>

	// User details methods
	fetchUserDetailsById(userId: string): Promise<UserDetails | null>
	fetchNodeChildrenCounts(nodeIds: string[]): Promise<NodeChildrenCountRow[]>
	checkDatabaseHealth(): Promise<{ data: unknown; error: unknown }>
	fetchTreeMetadata(treeId: string): Promise<{ data: unknown; error: unknown }>
	fetchTreeNodes(treeId: string): Promise<{ data: unknown; error: unknown }>
}

// =============================================================================
// Re-exports from Infrastructure
// =============================================================================

export type {
	DuplicateTreeRequest,
	DuplicateTreeResponse,
	EdgeFunctionRepository,
} from "@/infrastructure/edgeFunctions"
