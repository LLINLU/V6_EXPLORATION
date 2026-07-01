import {
	Check,
	ChevronDown,
	Clock,
	Copy,
	FolderInput,
	FolderPlus,
	Loader2,
	MoreVertical,
	Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast as sonnerToast } from "sonner"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
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
import { useTreeOperations } from "@/hooks/tree/useTreeOperations"
import { useToast } from "@/hooks/use-toast"
import { useTreeGeneration } from "@/hooks/useTreeGeneration"
import { useUserDetail } from "@/hooks/useUserDetail"
import type { Tree } from "@/infrastructure/supabaseRepository"
import { projectService } from "@/services/projectService"
import { useProjectStore } from "@/stores/projectStore"
import { CreateProjectDialog } from "./sidebar/CreateProjectDialog"

export const RecentGeneratedTrees = () => {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { trees, treesLoading, listSavedTrees } = useTreeGeneration()
	const [showAll, setShowAll] = useState(false)
	const { toast } = useToast()
	const {
		duplicateTree,
		isDuplicating,
		deleteTree,
		isDeleting,
		setIsDeleting,
	} = useTreeOperations()
	const { userDetails } = useUserDetail()
	const { projects, projectsLoading, fetchProjects } = useProjectStore()
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [pendingTreeId, setPendingTreeId] = useState<string | null>(null)
	const [treeProjectsMap, setTreeProjectsMap] = useState<
		Map<string, Set<string>>
	>(new Map())

	// Load all project-tree relations on mount
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

	const isSocialProblemMode = (mode?: string | null) => {
		const normalizedMode = mode
			?.trim()
			.toLowerCase()
			.replace(/[-\s]+/g, "_")
		return (
			normalizedMode === "social_problem" ||
			normalizedMode === "social_issue" ||
			mode === "社会課題"
		)
	}

	const handleViewTree = (tree: Tree) => {
		if (tree.mode === "REPORT") {
			navigate(`/query-report?id=${encodeURIComponent(tree.id)}`)
		} else if (isSocialProblemMode(tree.mode)) {
			navigate(`/technology-tree?id=${encodeURIComponent(tree.id)}`, {
				state: {
					query: tree.search_theme,
					searchMode: "social_problem",
					treeId: tree.id,
					fromDatabase: true,
					isDemo: false,
					mode: "TED",
					socialProblemMode: true,
				},
			})
		} else if (tree.mode == "TED") {
			navigate(`/scenario-selection?id=${encodeURIComponent(tree.id)}`, {
				state: {
					query: tree.search_theme,
					searchMode: "prompt-generated",
					treeId: tree.id,
					fromDatabase: true,
					isDemo: false,
				},
			})
		} else {
			navigate(`/technology-tree?id=${encodeURIComponent(tree.id)}`, {
				state: {
					query: tree.search_theme,
					searchMode: "prompt-generated",
					treeId: tree.id,
					fromDatabase: true,
					isDemo: false,
				},
			})
		}
	}

	const handleAddToProject = async (treeId: string, projectId: string) => {
		try {
			await projectService.addTreeToProject(projectId, treeId)
			toast({
				title: t("index.toast_added_to_project_title"),
				description: t("index.toast_added_to_project_desc"),
			})

			// Update the local map
			setTreeProjectsMap((prev) => {
				const newMap = new Map(prev)
				const projectSet = newMap.get(treeId) || new Set()
				projectSet.add(projectId)
				newMap.set(treeId, projectSet)
				return newMap
			})

			// Refresh projects to update tree counts
			await fetchProjects()
		} catch (error) {
			toast({
				title: t("common.toast_error_title"),
				description:
					error instanceof Error
						? error.message
						: t("index.toast_add_to_project_failed"),
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

	const handleDelete = async (treeName: string, treeId: string) => {
		if (isDeleting) return
		if (confirm(t("index.confirm_delete", { name: treeName }))) {
			setIsDeleting(true)
			try {
				await deleteTree(treeId)
				toast({ title: t("index.toast_deleted") })
			} catch (_e) {
				toast({ title: t("index.toast_delete_failed") })
			} finally {
				setIsDeleting(false)
			}
		}
	}

	const handleDuplicate = async (treeId: string, treeName: string) => {
		if (isDuplicating) {
			toast({
				title: t("index.toast_duplicating_title"),
				description: t("index.toast_duplicating_desc"),
			})
			return
		}

		// Show persistent toast during duplication
		const toastId = toast({
			title: t("index.toast_duplicating_in_progress_title"),
			description: t("index.toast_duplicating_in_progress_desc", {
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
					title: t("index.toast_duplicate_complete_title"),
					description: t("index.toast_duplicate_complete_desc", {
						name: treeName,
					}),
				})
				await listSavedTrees()
				// Navigate to the new tree
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
					title: t("common.toast_error_title"),
					description: error.message,
				})
			},
		})
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ja-JP", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		})
	}

	const getModeLabel = (mode?: string) => {
		if (isSocialProblemMode(mode)) {
			return t("index.mode_label_social_problem")
		}

		switch (mode) {
			case "FAST":
				return t("index.mode_label_fast")
			case "TED":
				return t("index.mode_label_ted")
			case "REPORT":
				return t("index.mode_label_report")
			default:
				return t("index.mode_label_ted")
		}
	}

	const getModeClasses = (mode?: string) => {
		if (isSocialProblemMode(mode)) {
			return "px-3 py-1 rounded-full text-[0.75rem] font-normal bg-pink-100 text-pink-700"
		}

		switch (mode) {
			case "FAST":
				return "px-3 py-1 rounded-full text-[0.75rem] font-normal text-[#9151ce] bg-[#fdfbff]"
			case "TED":
				return "px-3 py-1 rounded-full text-[0.75rem] font-normal bg-blue-50 text-blue-700"
			case "REPORT":
				return "px-3 py-1 rounded-full text-[0.75rem] font-normal bg-green-50 text-green-700"
			default:
				return "px-3 py-1 rounded-full text-[0.75rem] font-normal bg-blue-50 text-blue-700"
		}
	}

	// Determine which trees to display
	const displayedTrees = showAll ? trees : trees.slice(0, 20)
	const hasMoreTrees = trees.length > 20

	if (treesLoading && trees.length === 0) {
		return (
			<>
				<Card className="border-0 shadow-none">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-[18px]">
							{t("index.recent_searches_title")}
						</CardTitle>
						<CardDescription>{t("index.recent_searches_desc")}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-center py-4">
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
							{t("common.loading")}
						</div>
					</CardContent>
				</Card>

				<CreateProjectDialog
					open={showCreateDialog}
					onOpenChange={setShowCreateDialog}
					onSuccess={handleProjectCreated}
				/>
			</>
		)
	}

	return (
		<>
			<Card className="border-0 shadow-none">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-[18px]">
						{t("index.recent_searches_title")}
					</CardTitle>
					<CardDescription>{t("index.recent_searches_desc")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{displayedTrees.map((tree) => (
							<div
								key={tree.id}
								className="group flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
								onClick={() => handleViewTree(tree)}
							>
								<div className="flex-1 space-y-1">
									<h4 className="font-medium text-sm">{tree.name}</h4>
									<div className="flex items-center gap-3 text-xs text-gray-500">
										<div className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{formatDate(tree.created_at)}
										</div>
										<span className={getModeClasses(tree.mode || "")}>
											{getModeLabel(tree.mode || "")}
										</span>
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											type="button"
											aria-label={t("common.open_menu")}
											className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
											onClick={(e) => e.stopPropagation()}
										>
											<MoreVertical className="h-4 w-4 text-gray-500" />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={(e) => {
												e.stopPropagation()
												handleDuplicate(tree.id, tree.name)
											}}
										>
											<Copy className="mr-2 h-4 w-4" />
											{t("common.duplicate")}
										</DropdownMenuItem>

										{tree.user_id === userDetails?.user_id && (
											<>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={(e) => {
														e.stopPropagation()
														handleDelete(tree.name, tree.id)
													}}
													className="text-red-600 focus:text-red-600"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													{t("index.delete")}
												</DropdownMenuItem>
											</>
										)}

										<DropdownMenuSub>
											<DropdownMenuSubTrigger
												onSelect={(e) => {
													e.preventDefault()
													fetchProjects()
												}}
											>
												<FolderInput className="mr-2 h-4 w-4" />
												{t("index.add_to_project")}
											</DropdownMenuSubTrigger>
											<DropdownMenuSubContent>
												{projectsLoading ? (
													<div className="flex items-center justify-center py-2 px-2">
														<Loader2 className="h-4 w-4 animate-spin text-gray-500" />
													</div>
												) : projects.length === 0 ? (
													<div className="px-2 py-2 text-sm text-muted-foreground">
														{t("index.no_projects")}
													</div>
												) : (
													projects.map((project) => {
														const isAdded =
															treeProjectsMap.get(tree.id)?.has(project.id) ??
															false

														return (
															<DropdownMenuItem
																key={project.id}
																disabled={isAdded}
																onClick={async (e) => {
																	e.stopPropagation()
																	if (!isAdded) {
																		await handleAddToProject(
																			tree.id,
																			project.id,
																		)
																	}
																}}
																className={
																	isAdded ? "opacity-50 cursor-not-allowed" : ""
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
																		{t("index.already_added")}
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
														handleCreateProjectAndAdd(tree.id)
													}}
												>
													<FolderPlus className="mr-2 h-4 w-4" />
													{t("index.new_project")}
												</DropdownMenuItem>
											</DropdownMenuSubContent>
										</DropdownMenuSub>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						))}
					</div>

					{hasMoreTrees && !showAll && (
						<div className="flex justify-center mt-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowAll(true)}
								className="text-sm text-gray-600 hover:text-gray-900"
							>
								<ChevronDown className="h-4 w-4 mr-1" />
								{t("common.show_more")}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<CreateProjectDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onSuccess={handleProjectCreated}
			/>
		</>
	)
}
