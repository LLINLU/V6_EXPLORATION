import { format } from "date-fns"
import { enUS, ja } from "date-fns/locale"
import {
	Folder,
	Globe,
	Lock,
	MoreVertical,
	Pencil,
	Plus,
	Users,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar"
import { CreateProjectDialog } from "@/components/sidebar/CreateProjectDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useToast } from "@/hooks/use-toast"
import type { Project } from "@/infrastructure/supabaseRepository"
import { projectService } from "@/services/projectService"
import { useProjectStore } from "@/stores/projectStore"

const ProjectsContent = () => {
	const { t, i18n } = useTranslation()
	const { toast } = useToast()
	const navigate = useNavigate()
	const { projects, projectsLoading, fetchProjects, setSelectedProjectId } =
		useProjectStore()
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [showRenameDialog, setShowRenameDialog] = useState(false)
	const [renamingProject, setRenamingProject] = useState<Project | null>(null)
	const [newProjectName, setNewProjectName] = useState("")
	const [isRenaming, setIsRenaming] = useState(false)

	const loadProjects = useCallback(async (): Promise<Project[]> => {
		return await fetchProjects(50)
	}, [fetchProjects])

	useEffect(() => {
		loadProjects()
	}, [loadProjects])

	const handleProjectClick = (projectId: string) => {
		setSelectedProjectId(projectId)
		navigate("/")
	}

	const handleRename = (project: Project) => {
		setRenamingProject(project)
		setNewProjectName(project.name)
		setShowRenameDialog(true)
	}

	const handleRenameSubmit = async () => {
		if (!renamingProject || !newProjectName.trim()) {
			return
		}

		try {
			setIsRenaming(true)
			await projectService.updateProject(renamingProject.id, {
				name: newProjectName.trim(),
			})
			toast({
				title: t("common.success"),
				description: t("projects.rename_success"),
			})
			setShowRenameDialog(false)
			setRenamingProject(null)
			setNewProjectName("")
			loadProjects()
		} catch (error) {
			console.error("Failed to rename project:", error)
			toast({
				title: t("common.error"),
				description: t("projects.rename_error"),
			})
		} finally {
			setIsRenaming(false)
		}
	}

	const handleDelete = async (projectId: string, projectName: string) => {
		if (!window.confirm(t("projects.confirm_delete", { name: projectName }))) {
			return
		}

		try {
			await projectService.deleteProject(projectId)
			toast({
				title: t("common.success"),
				description: t("projects.delete_success"),
			})
			loadProjects()
		} catch (error) {
			console.error("Failed to delete project:", error)
			toast({
				title: t("common.error"),
				description: t("projects.delete_error"),
			})
		}
	}

	const getVisibilityIcon = (visibility: string) => {
		switch (visibility) {
			case "private":
				return <Lock className="h-3 w-3" />
			case "team":
				return <Users className="h-3 w-3" />
			case "public":
				return <Globe className="h-3 w-3" />
			default:
				return <Lock className="h-3 w-3" />
		}
	}

	const getVisibilityLabel = (visibility: string) => {
		switch (visibility) {
			case "private":
				return t("projects.visibility_private")
			case "team":
				return t("projects.visibility_team")
			case "public":
				return t("projects.visibility_public")
			default:
				return t("projects.visibility_private")
		}
	}

	return (
		<SidebarProvider>
			<div className="h-screen flex w-full overflow-hidden p-1">
				<AppSidebar />
				<div className="flex-1 overflow-auto">
					<div className="container mx-auto px-4 py-6">
						<div className="relative">
							<SidebarTrigger className="absolute left-4 top-4 md:hidden" />

							{/* Header */}
							<div className="mb-8">
								<div className="flex items-center justify-between">
									<div>
										<h1 className="text-3xl font-bold">
											{t("projects.title")}
										</h1>
										<p className="text-muted-foreground mt-1">
											{t("projects.subtitle")}
										</p>
									</div>
									<Button
										onClick={() => setShowCreateDialog(true)}
										variant="outline"
										className="gap-2"
									>
										<Plus className="h-4 w-4" />
										{t("projects.new_project")}
									</Button>
								</div>
							</div>

							{/* Projects Grid */}
							{projectsLoading ? (
								<div className="text-center py-12">
									<p className="text-muted-foreground">{t("common.loading")}</p>
								</div>
							) : projects.length === 0 ? (
								<div className="text-center py-12">
									<Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
									<h3 className="text-lg font-semibold mb-2">
										{t("projects.empty_title")}
									</h3>
									<p className="text-muted-foreground mb-4">
										{t("projects.empty_description")}
									</p>
									<Button
										onClick={() => setShowCreateDialog(true)}
										variant="outline"
										className="gap-2"
									>
										<Plus className="h-4 w-4" />
										{t("projects.new_project")}
									</Button>
								</div>
							) : (
								<div className="max-w-5xl mx-auto">
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
										{projects.map((project) => (
											<Card
												key={project.id}
												className="hover:shadow-lg transition-shadow cursor-pointer"
												onClick={() => handleProjectClick(project.id)}
											>
												<CardHeader>
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<CardTitle className="flex items-center gap-2">
																<Folder className="h-5 w-5 text-blue-500" />
																{project.name}
															</CardTitle>
															<CardDescription className="mt-1">
																{project.description ||
																	t("projects.no_description")}
															</CardDescription>
														</div>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8"
																	onClick={(e) => e.stopPropagation()}
																>
																	<MoreVertical className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem
																	onClick={(e) => {
																		e.stopPropagation()
																		handleRename(project)
																	}}
																>
																	<Pencil className="h-4 w-4 mr-2" />
																	{t("projects.rename")}
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={(e) => {
																		e.stopPropagation()
																		handleDelete(project.id, project.name)
																	}}
																	className="text-red-600"
																>
																	{t("projects.delete")}
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												</CardHeader>
												<CardContent>
													<div className="space-y-2">
														<div className="flex items-center justify-between text-sm">
															<span className="text-muted-foreground">
																{t("projects.tree_count")}
															</span>
															<Badge variant="secondary">
																{project.tree_count ?? 0}
															</Badge>
														</div>
														<div className="flex items-center gap-2">
															{getVisibilityIcon(project.visibility)}
															<span className="text-sm text-muted-foreground">
																{getVisibilityLabel(project.visibility)}
															</span>
														</div>
													</div>
												</CardContent>
												<CardFooter className="text-xs text-muted-foreground">
													{t("projects.created_at")}{" "}
													{format(
														new Date(project.created_at),
														i18n.language === "en"
															? "MMM d, yyyy"
															: "yyyy年MM月dd日",
														{ locale: i18n.language === "en" ? enUS : ja },
													)}
												</CardFooter>
											</Card>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<CreateProjectDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onSuccess={loadProjects}
			/>

			<Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("projects.rename_dialog_title")}</DialogTitle>
						<DialogDescription>
							{t("projects.rename_dialog_description")}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="project-name">
								{t("projects.project_name_label")}
							</Label>
							<Input
								id="project-name"
								value={newProjectName}
								onChange={(e) => setNewProjectName(e.target.value)}
								onKeyDown={(e) => {
									if (
										e.key === "Enter" &&
										!isRenaming &&
										newProjectName.trim()
									) {
										handleRenameSubmit()
									}
								}}
								placeholder={t("projects.project_name_placeholder")}
								disabled={isRenaming}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowRenameDialog(false)}
							disabled={isRenaming}
						>
							{t("projects.cancel")}
						</Button>
						<Button
							onClick={handleRenameSubmit}
							disabled={isRenaming || !newProjectName.trim()}
						>
							{isRenaming
								? t("projects.renaming")
								: t("projects.rename_submit")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</SidebarProvider>
	)
}

const Projects = () => {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	return <ProjectsContent />
}

export default Projects
