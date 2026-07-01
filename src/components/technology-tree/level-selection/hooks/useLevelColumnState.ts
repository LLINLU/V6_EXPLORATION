import { useState } from "react"

interface LevelItem {
	id: string
	name: string
	info?: string
	isCustom?: boolean
	description?: string
	children_count?: number
}

export const useLevelColumnState = () => {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [editingNode, setEditingNode] = useState<LevelItem | null>(null)
	const [editTitle, setEditTitle] = useState("")
	const [editDescription, setEditDescription] = useState("")
	const [showDescriptions, setShowDescriptions] = useState(true)
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [addTitle, setAddTitle] = useState("")
	const [addDescription, setAddDescription] = useState("")

	const resetEditState = () => {
		setEditingNode(null)
		setEditTitle("")
		setEditDescription("")
		setIsEditDialogOpen(false)
	}

	const resetAddState = () => {
		setAddTitle("")
		setAddDescription("")
		setIsAddDialogOpen(false)
	}

	const openEditDialog = (item: LevelItem) => {
		setEditingNode(item)
		setEditTitle(item.name)
		setEditDescription(item.description || "")
		setIsEditDialogOpen(true)
	}

	const openAddDialog = () => {
		setAddTitle("")
		setAddDescription("")
		setIsAddDialogOpen(true)
	}

	const toggleDescriptions = () => {
		setShowDescriptions(!showDescriptions)
	}

	return {
		isEditDialogOpen,
		setIsEditDialogOpen,
		editingNode,
		editTitle,
		setEditTitle,
		editDescription,
		setEditDescription,
		showDescriptions,
		isAddDialogOpen,
		setIsAddDialogOpen,
		addTitle,
		setAddTitle,
		addDescription,
		setAddDescription,
		resetEditState,
		resetAddState,
		openEditDialog,
		openAddDialog,
		toggleDescriptions,
	}
}
