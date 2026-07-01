import {
	Check,
	Copy,
	FolderInput,
	FolderPlus,
	Loader2,
	MoreVertical,
	SquarePen,
	Trash2,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { toast as sonnerToast, toast } from "sonner"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useTreeOperations } from "@/hooks/tree/useTreeOperations"
import { cleanupName } from "@/hooks/tree/utils/stringCleaner"
import { useSidebar } from "@/hooks/use-sidebar"
import { useToast } from "@/hooks/use-toast"
import { useTreeGeneration } from "@/hooks/useTreeGeneration"
import { useUserDetail } from "@/hooks/useUserDetail"
import type { Tree } from "@/infrastructure/supabaseRepository"
import { projectService } from "@/services/projectService"
import { useProjectStore } from "@/stores/projectStore"
import { CreateProjectDialog } from "./CreateProjectDialog"
import { EditNameDialog } from "./EditNameDialog"

interface SearchSectionProps {
	title: string
	searches: Tree[]
	onSearchClick: (treeId: string, searchTheme: string, mode: string) => void
	onDuplicate: (treeId: string, treeName: string) => void
	onAddToProject: (treeId: string, projectId: string) => void
	onCreateProjectAndAdd: (treeId: string) => void
	onRemoveFromProject?: (treeId: string) => void
	isLoading?: boolean
	currentTreeId?: string
	selectedProjectId?: string | null
}

const isSocialProblemMode = (mode?: string | null) =>
	mode === "SOCIAL_PROBLEM" || mode === "social_problem"

function SearchSection({
	title,
	searches,
	onSearchClick,
	onDuplicate,
	onAddToProject,
	onCreateProjectAndAdd,
	onRemoveFromProject,
	isLoading,
	currentTreeId,
	selectedProjectId,
	className = "",
}: SearchSectionProps & { className?: string }) {
	const { state } = useSidebar()
	const { t } = useTranslation()
	const { projects, projectsLoading, fetchProjects } = useProjectStore()
	const [treeProjectsMap, setTreeProjectsMap] = useState<
		Map<string, Set<string>>
	>(new Map())
	const location = useLocation()
	const navigate = useNavigate()

	const { userDetails } = useUserDetail()

	const getModeColor = (mode?: string) => {
		if (mode === "TED") return "bg-blue-500"
		if (mode === "FAST") return "bg-purple-500"
		if (mode === "REPORT") return "bg-green-700"
		if (isSocialProblemMode(mode)) return "bg-pink-600"
		return "bg-gray-400"
	}

	const getModeIndicatorClasses = (_mode?: string) =>
		"w-2 h-2 rounded-full flex-shrink-0 aspect-square"

	const getModePrefix = (mode?: string) => {
		if (mode === "TED") return t("sidebar.searches.mode_need")
		if (mode === "FAST") return t("sidebar.searches.mode_tech")
		if (mode === "REPORT") return t("sidebar.searches.mode_report")
		if (isSocialProblemMode(mode))
			return t("sidebar.searches.mode_social_problem")
		return ""
	}

	const getTooltipText = (search: { name: string; mode?: string }) => {
		const prefix = getModePrefix(search.mode)
		return prefix ? `${prefix} ${search.name}` : search.name
	}

	const { updateSearchName, deleteTree, isDeleting, setIsDeleting } =
		useTreeOperations()

	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [editingTree, setEditingTree] = useState<Tree | null>(null)

	const handleStartEdit = (search: Tree) => {
		if (search.user_id !== userDetails?.user_id) {
			toast(t("sidebar.searches.cannot_edit_others"))
			return
		}
		setEditingTree(search)
		setEditDialogOpen(true)
	}

	const handleConfirmEdit = (newName: string) => {
		if (editingTree) {
			if (
				confirm(
					t("sidebar.searches.confirm_rename", {
						current: editingTree.name,
						next: newName,
					}),
				)
			) {
				updateSearchName(editingTree.id, `Search Theme: ${newName}`)
				toast.success(t("sidebar.searches.title_updated"))
			}
		}
		setEditDialogOpen(false)
		setEditingTree(null)
	}

	const handleCancelEdit = () => {
		setEditDialogOpen(false)
		setEditingTree(null)
	}

	const handleConfirmDelete = async (tree_name: string, tree_id: string) => {
		if (isDeleting) return
		if (confirm(t("sidebar.searches.confirm_delete", { name: tree_name }))) {
			setIsDeleting(true)
			try {
				await deleteTree(tree_id)
				toast.success(t("sidebar.searches.deleted"))
				const currentId = new URLSearchParams(location.search).get("id")
				if (currentId === tree_id) {
					navigate("/")
				}
			} catch (_e) {
				toast.error(t("sidebar.searches.delete_failed"))
			} finally {
				setIsDeleting(false)
			}
		}
	}

	useEffect(() => {
		const loadAllRelations = async () => {
			try {
				const relations = await projectService.fetchAllProjectTreeRelations()
				const map = new Map<string, Set<string>>()

				for (const relation of relations) {
					if (!map.has(relation.tree_id)) {
						map.set(relation.tree_id, new Set())
					}
					map.get(relation.tree_id)?.add(relation.project_id)
				}

				setTreeProjectsMap(map)
			} catch (error) {
				console.error("Failed to load project-tree relations:", error)
			}
		}

		loadAllRelations()
	}, [])

	return (
		state === "expanded" && (
			<>
				<div
					className={`px-3 pt-3 text-xs font-medium text-muted-foreground ${className}`}
				>
					{title}
				</div>
				<SidebarMenu>
					{isLoading && searches.length === 0 ? (
						<SidebarMenuItem>
							<SidebarMenuButton disabled>
								<Loader2 className="h-4 w-4 animate-spin text-gray-500" />
								<span className="text-gray-500">
									{t("sidebar.searches.loading")}
								</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					) : searches.length === 0 ? (
						<SidebarMenuItem>
							<SidebarMenuButton disabled>
								<div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0 aspect-square" />
								<span className="text-gray-400 text-sm">
									{t("sidebar.searches.empty")}
								</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					) : (
						searches.map((search) => {
							const isSelected = search.id === currentTreeId
							return (
								<SidebarMenuItem
									key={search.id}
									onSelect={(e) => e.preventDefault()}
								>
									<div className="flex items-center gap-1 w-full">
										<SidebarMenuButton
											onClick={() =>
												onSearchClick(
													search.id,
													search.search_theme,
													search.mode!,
												)
											}
											className={`cursor-pointer flex-1 ${
												isSelected
													? "bg-gray-100 hover:bg-gray-200"
													: "hover:bg-gray-100"
											}`}
										>
											<div
												className={`${getModeIndicatorClasses(search.mode || "")} ${getModeColor(search.mode || "")}`}
											/>
											<span
												className="truncate"
												title={getTooltipText({
													name: cleanupName(search.name),
													mode: search.mode || "",
												})}
											>
												{cleanupName(search.name)}
											</span>
										</SidebarMenuButton>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<button
													type="button"
													className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
												>
													<MoreVertical className="h-4 w-4 text-gray-500" />
												</button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={(e) => {
														e.stopPropagation()
														onDuplicate(search.id, search.search_theme)
													}}
												>
													<Copy className="mr-2 h-4 w-4" />
													{t("sidebar.searches.duplicate")}
												</DropdownMenuItem>

												{search.user_id === userDetails?.user_id ? (
													<>
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation()
																handleStartEdit(search)
															}}
														>
															<SquarePen className="mr-2 h-4 w-4" />
															{t("sidebar.searches.rename")}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation()
																handleConfirmDelete(search.name, search.id)
															}}
															className="text-red-600 focus:text-red-600"
														>
															<Trash2 className="mr-2 h-4 w-4" />
															{t("sidebar.searches.delete")}
														</DropdownMenuItem>
													</>
												) : null}

												<DropdownMenuSub>
													<DropdownMenuSubTrigger
														onSelect={(e) => {
															e.preventDefault()
															fetchProjects()
														}}
													>
														<FolderInput className="mr-2 h-4 w-4" />
														{t("sidebar.searches.add_to_project")}
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														{projectsLoading ? (
															<div className="flex items-center justify-center py-2 px-2">
																<Loader2 className="h-4 w-4 animate-spin text-gray-500" />
															</div>
														) : projects.length === 0 ? (
															<div className="px-2 py-2 text-sm text-muted-foreground">
																{t("sidebar.searches.no_projects")}
															</div>
														) : (
															projects.map((project) => {
																const isAdded =
																	treeProjectsMap
																		.get(search.id)
																		?.has(project.id) ?? false
																return (
																	<DropdownMenuItem
																		key={project.id}
																		disabled={isAdded}
																		onClick={async (e) => {
																			e.stopPropagation()
																			if (!isAdded) {
																				await onAddToProject(
																					search.id,
																					project.id,
																				)
																				setTreeProjectsMap((prev) => {
																					const newMap = new Map(prev)
																					const projectSet =
																						newMap.get(search.id) || new Set()
																					projectSet.add(project.id)
																					newMap.set(search.id, projectSet)
																					return newMap
																				})
																			}
																		}}
																		className={
																			isAdded
																				? "opacity-50 cursor-not-allowed"
																				: ""
																		}
																	>
																		{isAdded ? (
																			<Check className="mr-2 h-4 w-4 text-green-500" />
																		) : (
																			<FolderInput className="mr-2 h-4 w-4 text-blue-500" />
																		)}
																		<span>{project.name}</span>
																		{isAdded && (
																			<span className="ml-auto text-xs text-muted-foreground">
																				{t("sidebar.searches.already_added")}
																			</span>
																		)}
																	</DropdownMenuItem>
																)
															})
														)}
														{projects.length > 0 && <DropdownMenuSeparator />}
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation()
																onCreateProjectAndAdd(search.id)
															}}
														>
															<FolderPlus className="mr-2 h-4 w-4" />
															{t("sidebar.searches.new_project")}
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>

												{selectedProjectId && onRemoveFromProject && (
													<>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation()
																onRemoveFromProject(search.id)
															}}
															className="text-red-600 focus:text-red-600"
														>
															<Trash2 className="mr-2 h-4 w-4" />
															{t("sidebar.searches.remove_from_project")}
														</DropdownMenuItem>
													</>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</SidebarMenuItem>
							)
						})
					)}
				</SidebarMenu>
				<EditNameDialog
					open={editDialogOpen}
					title={t("sidebar.searches.rename")}
					currentName={editingTree ? cleanupName(editingTree.name) : ""}
					onConfirm={handleConfirmEdit}
					onCancel={handleCancelEdit}
				/>
			</>
		)
	)
}

function processTreesData(trees: Tree[] | null | undefined): {
	recent: Tree[]
	previous: Tree[]
	recentVisited: Tree[]
} {
	if (!trees || !Array.isArray(trees)) {
		return { recent: [], previous: [], recentVisited: [] }
	}

	const now = new Date()
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

	const recent = trees
		.filter((tree) => new Date(tree.created_at) > sevenDaysAgo)
		.slice(0, 5)

	const previous = trees
		.filter((tree) => new Date(tree.created_at) <= sevenDaysAgo)
		.slice(0, 5)

	const recentVisited = trees
		.filter(
			(tree) =>
				tree.last_viewed_at &&
				new Date(tree.last_viewed_at) &&
				!Number.isNaN(new Date(tree.last_viewed_at).getTime()),
		)
		.sort((a, b) => {
			const aTime =
				a.last_viewed_at &&
				new Date(a.last_viewed_at) &&
				!Number.isNaN(new Date(a.last_viewed_at).getTime())
					? new Date(a.last_viewed_at).getTime()
					: 0
			const bTime =
				b.last_viewed_at &&
				new Date(b.last_viewed_at) &&
				!Number.isNaN(new Date(b.last_viewed_at).getTime())
					? new Date(b.last_viewed_at).getTime()
					: 0
			return bTime - aTime
		})
		.slice(0, 5)

	return { recent, previous, recentVisited }
}

export function SidebarSearches() {
	const { trees, treesLoading, listSavedTrees } = useTreeGeneration()
	const location = useLocation()
	const navigate = useNavigate()
	const { toast } = useToast()
	const { t } = useTranslation()
	const { duplicateTree, isDuplicating } = useTreeOperations()
	const { fetchProjects, selectedProjectId } = useProjectStore()
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [pendingTreeId, setPendingTreeId] = useState<string | null>(null)
	const currentTreeId = useMemo(() => {
		const idFromQuery = new URLSearchParams(location.search).get("id")
		return location.state?.treeId ?? idFromQuery ?? undefined
	}, [location.search, location.state?.treeId])
	const { recent: recentSearches, recentVisited: recentVisitedSearches } =
		useMemo(() => processTreesData(trees), [trees])

	const fetchTrees = useCallback(async (): Promise<Tree[]> => {
		return await listSavedTrees()
	}, [listSavedTrees])

	// biome-ignore lint/correctness/useExhaustiveDependencies: need to dependency to be empty to prevent infinite loop render
	useEffect(() => {
		fetchTrees()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleSearchClick = (
		treeId: string,
		searchTheme: string,
		mode: string,
	) => {
		if (mode === "REPORT") {
			navigate(`/query-report?id=${encodeURIComponent(treeId)}`)
		} else if (isSocialProblemMode(mode)) {
			navigate(`/technology-tree?id=${encodeURIComponent(treeId)}`, {
				state: {
					treeId,
					query: searchTheme,
					searchMode: "social_problem",
					fromDatabase: true,
					fromSidebar: true,
					mode: "TED",
					socialProblemMode: true,
				},
			})
		} else if (mode == "TED") {
			navigate(`/scenario-selection?id=${encodeURIComponent(treeId)}`, {
				state: {
					treeId,
					query: searchTheme,
					searchMode: mode,
					fromDatabase: true,
					fromSidebar: true,
				},
			})
		} else {
			navigate(`/technology-tree?id=${encodeURIComponent(treeId)}`, {
				state: {
					treeId,
					query: searchTheme,
					searchMode: mode,
					fromDatabase: true,
					fromSidebar: true,
				},
			})
		}
	}

	const handleDuplicate = async (treeId: string, treeName: string) => {
		if (isDuplicating) {
			toast({
				title: t("sidebar.searches.duplicating"),
				description: t("sidebar.searches.duplicating_wait"),
			})
			return
		}

		const toastId = toast({
			title: t("sidebar.searches.duplicating_progress"),
			description: t("sidebar.searches.duplicating_description", {
				name: treeName,
			}),
			duration: Infinity,
		})

		await duplicateTree({
			treeId,
			treeName,
			onSuccess: async (newTreeId) => {
				sonnerToast.dismiss(toastId)
				toast({
					title: t("sidebar.searches.duplicate_complete"),
					description: t("sidebar.searches.duplicate_complete_description", {
						name: treeName,
					}),
				})
				await listSavedTrees()
				navigate(`/technology-tree?id=${encodeURIComponent(newTreeId)}`, {
					state: {
						treeId: newTreeId,
						query: `${treeName} (Copy)`,
						fromDatabase: true,
						fromSidebar: true,
					},
				})
			},
			onError: (error) => {
				sonnerToast.dismiss(toastId)
				toast({
					title: t("common.error"),
					description: error.message,
				})
			},
		})
	}

	const handleAddToProject = async (treeId: string, projectId: string) => {
		try {
			await projectService.addTreeToProject(projectId, treeId)
			toast({
				title: t("sidebar.searches.added_to_project"),
				description: t("sidebar.searches.added_to_project_description"),
			})
			await fetchProjects()
		} catch (error) {
			toast({
				title: t("common.error"),
				description:
					error instanceof Error
						? error.message
						: t("sidebar.searches.add_failed"),
			})
		}
	}

	const handleCreateProjectAndAdd = (treeId: string) => {
		setPendingTreeId(treeId)
		setShowCreateDialog(true)
	}

	const handleProjectCreated = async (projectId: string) => {
		if (pendingTreeId) {
			await handleAddToProject(pendingTreeId, projectId)
			setPendingTreeId(null)
		}
	}

	const handleRemoveFromProject = async (treeId: string) => {
		if (!selectedProjectId) {
			toast({
				title: t("common.error"),
				description: t("sidebar.searches.no_project_selected"),
			})
			return
		}

		try {
			await projectService.removeTreeFromProject(selectedProjectId, treeId)
			toast({
				title: t("sidebar.searches.removed_from_project"),
				description: t("sidebar.searches.removed_from_project_description"),
			})
			await listSavedTrees()
			await fetchProjects()
		} catch (error) {
			toast({
				title: t("common.error"),
				description:
					error instanceof Error
						? error.message
						: t("sidebar.searches.remove_failed"),
			})
		}
	}

	return (
		<>
			<SearchSection
				title={t("sidebar.searches.recent_searches")}
				className="pt-0 -mt-6"
				searches={recentSearches}
				onSearchClick={handleSearchClick}
				onDuplicate={handleDuplicate}
				onAddToProject={handleAddToProject}
				onCreateProjectAndAdd={handleCreateProjectAndAdd}
				onRemoveFromProject={handleRemoveFromProject}
				isLoading={treesLoading}
				currentTreeId={currentTreeId}
				selectedProjectId={selectedProjectId}
			/>
			<SearchSection
				title={t("sidebar.searches.recent_trees")}
				searches={recentVisitedSearches}
				onSearchClick={handleSearchClick}
				onDuplicate={handleDuplicate}
				onAddToProject={handleAddToProject}
				onCreateProjectAndAdd={handleCreateProjectAndAdd}
				onRemoveFromProject={handleRemoveFromProject}
				isLoading={treesLoading}
				currentTreeId={currentTreeId}
				selectedProjectId={selectedProjectId}
			/>

			<CreateProjectDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onSuccess={handleProjectCreated}
			/>
		</>
	)
}
