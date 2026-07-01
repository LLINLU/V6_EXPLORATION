import type React from "react"
import { AddNodeDialog } from "../AddNodeDialog"
import { EditNodeDialog } from "../EditNodeDialog"

interface LevelColumnDialogsProps {
	isEditDialogOpen: boolean
	onEditDialogOpenChange: (open: boolean) => void
	editTitle: string
	editDescription: string
	onEditTitleChange: (value: string) => void
	onEditDescriptionChange: (value: string) => void
	onEditSave: () => void
	isAddDialogOpen: boolean
	onAddDialogOpenChange: (open: boolean) => void
	addTitle: string
	addDescription: string
	onAddTitleChange: (value: string) => void
	onAddDescriptionChange: (value: string) => void
	onAddSave: () => void
	onAddDirectSave: (title: string, description: string) => void
	onGuidanceClick?: (type: string) => void
}

export const LevelColumnDialogs: React.FC<LevelColumnDialogsProps> = ({
	isEditDialogOpen,
	onEditDialogOpenChange,
	editTitle,
	editDescription,
	onEditTitleChange,
	onEditDescriptionChange,
	onEditSave,
	isAddDialogOpen,
	onAddDialogOpenChange,
	addTitle,
	addDescription,
	onAddTitleChange,
	onAddDescriptionChange,
	onAddSave,
	onAddDirectSave,
	onGuidanceClick,
}) => {
	return (
		<>
			<EditNodeDialog
				isOpen={isEditDialogOpen}
				onOpenChange={onEditDialogOpenChange}
				title={editTitle}
				description={editDescription}
				onTitleChange={onEditTitleChange}
				onDescriptionChange={onEditDescriptionChange}
				onSave={onEditSave}
			/>

			<AddNodeDialog
				isOpen={isAddDialogOpen}
				onOpenChange={onAddDialogOpenChange}
				title={addTitle}
				description={addDescription}
				onTitleChange={onAddTitleChange}
				onDescriptionChange={onAddDescriptionChange}
				onSave={onAddSave}
				onDirectSave={onAddDirectSave}
				onGuidanceClick={onGuidanceClick}
			/>
		</>
	)
}
