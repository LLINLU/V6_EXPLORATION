import type React from "react"
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

interface EditNodeDialogProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description: string
	onTitleChange: (value: string) => void
	onDescriptionChange: (value: string) => void
	onSave: () => void
}

export const EditNodeDialog: React.FC<EditNodeDialogProps> = ({
	isOpen,
	onOpenChange,
	title,
	description,
	onTitleChange,
	onDescriptionChange,
	onSave,
}) => {
	const { t } = useTranslation()
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("tech.edit_node")}</DialogTitle>
					<DialogDescription>{t("tech.edit_node_desc")}</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<label htmlFor="title" className="text-sm font-medium">
							{t("tech.title_label")}
						</label>
						<input
							id="title"
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							value={title}
							onChange={(e) => onTitleChange(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<label htmlFor="description" className="text-sm font-medium">
							{t("tech.description_label")}
						</label>
						<textarea
							id="description"
							className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							value={description}
							onChange={(e) => onDescriptionChange(e.target.value)}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("tech.cancel")}
					</Button>
					<Button onClick={onSave}>{t("tech.save_changes")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
