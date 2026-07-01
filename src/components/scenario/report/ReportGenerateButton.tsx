import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

interface ReportGenerateButtonProps {
	onGenerate: () => void
	isLoading?: boolean
	disabled?: boolean
}

export function ReportGenerateButton({
	onGenerate,
	isLoading,
	disabled,
}: ReportGenerateButtonProps) {
	const { t } = useTranslation()
	return (
		<div className="flex items-center justify-center py-4">
			<Button
				onClick={onGenerate}
				disabled={disabled}
				className="gap-2 bg-[#2563eb] hover:bg-[#2563eb]/90 disabled:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
				{isLoading
					? t("scenario.report.generating")
					: t("scenario.report.generate")}
			</Button>
		</div>
	)
}
