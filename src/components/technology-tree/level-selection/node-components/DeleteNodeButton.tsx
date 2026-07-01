import { Trash2 } from "lucide-react"
import type React from "react"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface DeleteNodeButtonProps {
	itemName: string
	onDeleteClick: (e: React.MouseEvent) => void
}

export const DeleteNodeButton: React.FC<DeleteNodeButtonProps> = ({
	itemName,
	onDeleteClick,
}) => {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 bg-white/70 hover:bg-red-100"
					onClick={(e) => e.stopPropagation()}
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
					<AlertDialogDescription>
						ノード「{itemName}
						」を完全に削除します。この操作は元に戻すことができません。
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>キャンセル</AlertDialogCancel>
					<AlertDialogAction
						className="bg-red-600 hover:bg-red-700"
						onClick={(e) => {
							e.stopPropagation()
							onDeleteClick(e)
						}}
					>
						削除
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
