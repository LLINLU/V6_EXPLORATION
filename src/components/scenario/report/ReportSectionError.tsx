import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReportSectionErrorProps {
	sectionTitle?: string
	errorMessage?: string
	onRetry?: () => void
}

export function ReportSectionError({
	sectionTitle,
	errorMessage,
	onRetry,
}: ReportSectionErrorProps) {
	return (
		<div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
			<div className="flex items-center gap-2 text-red-700">
				<AlertCircle className="h-4 w-4 flex-shrink-0" />
				<span className="text-sm font-medium">
					{sectionTitle
						? `${sectionTitle}の読み込みに失敗しました`
						: "セクションの読み込みに失敗しました"}
				</span>
			</div>
			{errorMessage && (
				<p className="text-xs text-red-600 pl-6">{errorMessage}</p>
			)}
			{onRetry && (
				<div className="pl-6">
					<Button
						variant="outline"
						size="sm"
						onClick={onRetry}
						className="text-red-700 border-red-300 hover:bg-red-100"
					>
						<RefreshCw className="h-3 w-3 mr-1" />
						リトライ
					</Button>
				</div>
			)}
		</div>
	)
}
