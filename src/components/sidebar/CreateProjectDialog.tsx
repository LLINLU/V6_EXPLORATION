import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { projectService } from "@/services/projectService"

interface CreateProjectDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess?: (projectId: string) => void
}

export function CreateProjectDialog({
	open,
	onOpenChange,
	onSuccess,
}: CreateProjectDialogProps) {
	const { toast } = useToast()
	const { t } = useTranslation()
	const [isCreating, setIsCreating] = useState(false)
	const [name, setName] = useState("")
	const [visibility, setVisibility] = useState<"team" | "private">("team")

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!name.trim()) {
			toast({
				title: t("common.error"),
				description: t("dialog.create_project.name_required"),
			})
			return
		}

		try {
			setIsCreating(true)
			const project = await projectService.createProject(name.trim(), {
				visibility,
			})

			toast({
				title: t("common.success"),
				description: t("dialog.create_project.success"),
			})

			setName("")
			setVisibility("team")
			onOpenChange(false)
			onSuccess?.(project.id)
		} catch (error) {
			console.error("Failed to create project:", error)
			toast({
				title: t("common.error"),
				description:
					error instanceof Error
						? error.message
						: t("dialog.create_project.error"),
			})
		} finally {
			setIsCreating(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[525px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold">
							{t("dialog.create_project.title")}
						</DialogTitle>
						<DialogDescription className="sr-only">
							{t("dialog.create_project.description")}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-6 py-6">
						<div className="grid gap-3">
							<Label htmlFor="name" className="text-sm font-medium">
								{t("dialog.create_project.name_label")}
							</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t("dialog.create_project.name_placeholder")}
								required
								autoFocus
								className="h-10"
							/>
						</div>

						<div className="grid gap-3 opacity-50 pointer-events-none">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-medium">
									{t("dialog.create_project.collaborators_label")}
								</Label>
								<span className="text-xs text-muted-foreground">
									{t("common.coming_soon")}
								</span>
							</div>
							<p className="text-sm text-muted-foreground">
								{t("dialog.create_project.collaborators_hint")}
							</p>
							<div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
								{t("dialog.create_project.collaborators_empty")}
							</div>
						</div>
					</div>

					<DialogFooter className="flex justify-end">
						<Button
							type="submit"
							disabled={isCreating || !name.trim()}
							className="w-[40%] bg-blue-600 hover:bg-blue-700 text-white"
						>
							{isCreating
								? t("dialog.create_project.saving")
								: t("dialog.create_project.save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
