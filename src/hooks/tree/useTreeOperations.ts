import { useCallback, useState } from "react"
import { poll } from "@/hooks/usePolling"
import { useUserDetail } from "@/hooks/useUserDetail"
import type { Tree } from "@/infrastructure/supabaseRepository"
import { treeService } from "@/services/treeService"
import { useTreeListStore } from "@/stores/treeListStore"
import { cleanupName } from "./utils/stringCleaner"

/**
 * ツリー操作用のフック
 *
 * ツリーの複製などの操作を提供します。
 */

interface DuplicateTreeOptions {
	treeId: string
	treeName: string
	newName?: string
	onSuccess?: (newTreeId: string) => void
	onError?: (error: Error) => void
	onStart?: () => void
	onComplete?: () => void
}

export function useTreeOperations() {
	const [isDuplicating, setIsDuplicating] = useState(false)
	const [duplicatingTreeId, setDuplicatingTreeId] = useState<string | null>(
		null,
	)
	const { userDetails } = useUserDetail()
	const { fetchTrees } = useTreeListStore()

	/**
	 * ツリーを複製する
	 */
	const duplicateTree = useCallback(
		async (options: DuplicateTreeOptions): Promise<string | null> => {
			const {
				treeId,
				treeName,
				newName,
				onSuccess,
				onError,
				onStart,
				onComplete,
			} = options

			if (isDuplicating) {
				const error = new Error(
					"別のツリーを複製中です。完了までお待ちください。",
				)
				onError?.(error)
				return null
			}

			try {
				setIsDuplicating(true)
				setDuplicatingTreeId(treeId)
				onStart?.()

				// サービス層経由で現在のツリーIDを取得
				const existingTreeIds = new Set(await treeService.fetchTreeIds(10))

				// サービス層経由でedge functionを呼び出す
				treeService.duplicateTree(treeId, newName)

				// ポーリングで新しいツリーを検出
				const result = await poll<Tree>({
					pollFn: async () => {
						// サービス層経由でツリー一覧を取得
						const polledTrees = await treeService.fetchTreesForPolling()

						if (!polledTrees || polledTrees.length === 0) return null

						const newTree = polledTrees.find(
							(t) =>
								!existingTreeIds.has(t.id) &&
								(cleanupName(t.name) === `${treeName} (Copy)` ||
									cleanupName(t.name).startsWith(treeName)),
						)

						return newTree || null
					},
					shouldStop: (data) => data !== null,
					interval: 1000,
					maxAttempts: 30,
				})

				if (!result) {
					throw new Error(
						"複製がタイムアウトしました。ページを更新して確認してください。",
					)
				}

				// Refresh tree list from server
				const teamId = userDetails?.team_id
				if (teamId) {
					fetchTrees().catch((error: Error) => {
						console.error("Failed to refresh trees after duplication:", error)
					})
				}

				onSuccess?.(result.id)

				return result.id
			} catch (error) {
				const err =
					error instanceof Error
						? error
						: new Error("ツリーの複製に失敗しました")
				onError?.(err)
				return null
			} finally {
				setIsDuplicating(false)
				setDuplicatingTreeId(null)
				onComplete?.()
			}
		},
		[isDuplicating, fetchTrees, userDetails?.team_id],
	)

	/**
	 * ツリーの最終閲覧日時を更新する
	 */
	const updateLastViewedAt = useCallback(
		(treeId: string) => {
			// Update database and refresh tree list
			treeService
				.updateLastViewedAt(treeId)
				.then(() => {
					// Refresh tree list from server in the background
					const teamId = userDetails?.team_id
					if (teamId) {
						fetchTrees().catch((error: Error) => {
							console.error("Failed to refresh trees after update:", error)
						})
					}
				})
				.catch((error) => {
					console.error("Failed to update last_viewed_at:", error)
				})
		},
		[fetchTrees, userDetails?.team_id],
	)

	const updateSearchName = useCallback(
		(treeId: string, newName: string) => {
			treeService
				.updateSearchName(treeId, newName)
				.then(() => {
					// Refresh tree list from server in the background
					const teamId = userDetails?.team_id
					if (teamId) {
						fetchTrees().catch((error: Error) => {
							console.error("Failed to refresh trees after update:", error)
						})
					}
				})
				.catch((error) => {
					console.error("Failed to update last_viewed_at:", error)
				})
		},
		[fetchTrees, userDetails?.team_id],
	)

	const [isDeleting, setIsDeleting] = useState(false)

	const deleteTree = useCallback(
		async (treeId: string): Promise<void> => {
			await treeService.deleteTree(treeId)
			const teamId = userDetails?.team_id
			if (teamId) {
				fetchTrees().catch((error: Error) => {
					console.error("Failed to refresh trees after delete:", error)
				})
			}
		},
		[fetchTrees, userDetails?.team_id],
	)

	return {
		duplicateTree,
		isDuplicating,
		duplicatingTreeId,
		isDeleting,
		setIsDeleting,
		updateLastViewedAt,
		updateSearchName,
		deleteTree,
	}
}
