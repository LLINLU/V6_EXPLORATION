import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FallbackAlertProps {
	isVisible: boolean
	onDismiss: () => void
}

export const FallbackAlert = ({ isVisible, onDismiss }: FallbackAlertProps) => {
	if (!isVisible) return null

	return (
		<Alert className="mb-4 border-yellow-200 bg-yellow-50">
			<AlertTriangle className="h-4 w-4 text-yellow-600" />
			<AlertTitle className="text-yellow-800">
				テンプレートデータを使用中
			</AlertTitle>
			<AlertDescription className="text-yellow-700">
				一部のノードでは、より早く表示するためにテンプレートデータを使用しています。必要に応じて、ノードをクリックして内容を編集・カスタマイズできます。
				<button
					onClick={onDismiss}
					className="ml-2 text-yellow-800 underline hover:no-underline"
				>
					閉じる
				</button>
			</AlertDescription>
		</Alert>
	)
}
