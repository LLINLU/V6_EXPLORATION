import {
	ChevronDown,
	Edit,
	Eye,
	FolderOpen,
	FolderPlus,
	MoreVertical,
} from "lucide-react"
import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { useUserDetail } from "@/hooks/useUserDetail"
import type { Project } from "@/infrastructure/supabaseRepository"
import { projectService } from "@/services/projectService"
import { useProjectStore } from "@/stores/projectStore"
import { CreateProjectDialog } from "./CreateProjectDialog"
import { EditNameDialog } from "./EditNameDialog"

export function SidebarProjects() {
	const { state } = useSidebar()
	const navigate = useNavigate()
	const isExpanded = state === "expanded"
	const { t } = useTranslation()

	const {
		selectedProjectId,
		projects,
		projectsLoading,
		setSelectedProjectId,
		clearSelectedProject,
		fetchProjects,
	} = useProjectStore()

	const { userDetails } = useUserDetail()

	const [showCreateDialog, setShowCreateDialog] = React.useState(false)
	const [isOpen, setIsOpen] = React.useState(false)
	const [_editingProject, setEditingProject] = React.useState("")
	const [editDialogOpen, setEditDialogOpen] = React.useState(false)
	const [editingProjectData, setEditingProjectData] =
		React.useState<Project | null>(null)

	useEffect(() => {
		fetchProjects()
	}, [fetchProjects])

	const handleProjectClick = (projectId: string) => {
		if (selectedProjectId === projectId) {
			clearSelectedProject()
		} else {
			setSelectedProjectId(projectId)
		}
		setIsOpen(false)
		setEditingProject("")
	}

	const handleOpenChange = (val: boolean) => {
		setIsOpen(val)
		setEditingProject("")
	}

	const handleViewAll = () => {
		navigate("/projects")
		setIsOpen(false)
		setEditingProject("")
	}

	const handleClearSelection = () => {
		clearSelectedProject()
		setIsOpen(false)
		setEditingProject("")
	}

	const handleCreateSuccess = (_projectId: string) => {
		fetchProjects()
	}

	const handleStartEdit = (project: Project) => {
		if (project.creator_id !== userDetails?.user_id) {
			toast(t("sidebar.projects.cannot_edit_others"))
			return
		}
		setEditingProjectData(project)
		setEditDialogOpen(true)
	}

	const handleConfirmEdit = (newName: string) => {
		if (editingProjectData) {
			if (
				confirm(
					t("sidebar.projects.confirm_rename", {
						current: editingProjectData.name,
						next: newName,
					}),
				)
			) {
				projectService.updateProjectName(editingProjectData.id, newName)
				fetchProjects()
				toast.success(t("sidebar.projects.renamed"))
			}
		}
		setEditDialogOpen(false)
		setEditingProjectData(null)
	}

	const handleCancelEdit = () => {
		setEditDialogOpen(false)
		setEditingProjectData(null)
	}

	if (!isExpanded) {
		return null
	}

	const selectedProject = selectedProjectId
		? projects.find((p) => p.id === selectedProjectId)
		: null

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton className="cursor-pointer hover:bg-gray-100">
								<FolderOpen className="h-4 w-4" />
								<span className="flex-1 truncate">
									{selectedProject
										? selectedProject.name
										: t("sidebar.projects.all")}
								</span>
								<ChevronDown className="h-4 w-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-56">
							<DropdownMenuLabel>
								{t("sidebar.projects.select")}
							</DropdownMenuLabel>

							<DropdownMenuItem
								onClick={handleClearSelection}
								className="cursor-pointer"
							>
								<FolderOpen className="mr-2 h-4 w-4" />
								<span>{t("sidebar.projects.view_all")}</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />

							{projectsLoading ? (
								<div className="flex items-center justify-center py-4">
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
								</div>
							) : projects.length === 0 ? (
								<div className="px-2 py-2 text-sm text-muted-foreground">
									{t("sidebar.projects.empty")}
								</div>
							) : (
								projects.map((project) => (
									<DropdownMenuItem
										key={project.id}
										onClick={() => handleProjectClick(project.id)}
										onSelect={(e) => e.preventDefault()}
										className={`cursor-pointer ${
											selectedProjectId === project.id ? "bg-accent" : ""
										}`}
									>
										<div className="flex items-center gap-1 w-full">
											<FolderOpen className="mr-2 h-4 w-4 text-blue-500" />
											<span className="truncate">{project.name}</span>

											{project.creator_id === userDetails?.user_id ? (
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<button
															type="button"
															className="group-hover/menu-item:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
														>
															<MoreVertical className="group-hover/menu-item:opacity-100 transition-opacity h-4 w-4 text-gray-500" />
														</button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={(ev) => {
																ev.preventDefault()
																ev.stopPropagation()
																handleStartEdit(project)
															}}
															className="cursor-pointer"
														>
															<Edit className="mr-2 h-4 w-4" />
															{t("sidebar.projects.rename")}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											) : (
												""
											)}
										</div>
									</DropdownMenuItem>
								))
							)}

							<DropdownMenuSeparator />

							<DropdownMenuItem
								onClick={handleViewAll}
								className="cursor-pointer"
							>
								<Eye className="mr-2 h-4 w-4" />
								<span>{t("sidebar.projects.view")}</span>
							</DropdownMenuItem>

							<DropdownMenuItem
								onClick={() => {
									setIsOpen(false)
									setEditingProject("")
									setShowCreateDialog(true)
								}}
								className="cursor-pointer"
							>
								<FolderPlus className="mr-2 h-4 w-4" />
								<span>{t("sidebar.projects.new")}</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>

			<CreateProjectDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onSuccess={handleCreateSuccess}
			/>

			<EditNameDialog
				open={editDialogOpen}
				title={t("sidebar.projects.rename")}
				currentName={editingProjectData?.name || ""}
				onConfirm={handleConfirmEdit}
				onCancel={handleCancelEdit}
			/>
		</>
	)
}
