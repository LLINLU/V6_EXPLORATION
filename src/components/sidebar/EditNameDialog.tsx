import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog"
import { Input } from "../ui/input"

interface EditNameDialogProps {
	open: boolean
	title: string
	currentName: string
	onConfirm: (newName: string) => void
	onCancel: () => void
}

export function EditNameDialog({
	open,
	title,
	currentName,
	onConfirm,
	onCancel,
}: EditNameDialogProps) {
	const [value, setValue] = useState(currentName)
	const inputRef = useRef<HTMLInputElement>(null)
	const { t } = useTranslation()

	useEffect(() => {
		if (open) {
			setValue(currentName)
			setTimeout(() => {
				inputRef.current?.focus()
				inputRef.current?.select()
			}, 0)
		}
	}, [open, currentName])

	const handleConfirm = () => {
		if (value.trim()) {
			onConfirm(value.trim())
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault()
			handleConfirm()
		} else if (e.key === "Escape") {
			e.preventDefault()
			onCancel()
		}
	}

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						{t("dialog.edit_name.description")}
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<Input
						ref={inputRef}
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={t("dialog.edit_name.placeholder")}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						{t("dialog.edit_name.cancel")}
					</Button>
					<Button onClick={handleConfirm} disabled={!value.trim()}>
						{t("dialog.edit_name.confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
