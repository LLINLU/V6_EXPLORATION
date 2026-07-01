import { useTranslation } from "react-i18next"
import { MIcon } from "@/components/ui/m-icon"

interface CompactNodeInfoProps {
	selectedNodeTitle?: string
}

export const CompactNodeInfo = ({
	selectedNodeTitle,
}: CompactNodeInfoProps) => {
	const { t } = useTranslation()
	if (!selectedNodeTitle) {
		return null
	}

	return (
		<div className="sticky top-0 z-10 px-4 py-3 bg-blue-50 border-b border-blue-200">
			<div className="flex items-center gap-2">
				<div className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
					<MIcon className="h-3 w-3" size={12} />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-xs text-blue-600 font-medium truncate">
						{t("tech.current_node")}: {selectedNodeTitle}
					</p>
				</div>
			</div>
		</div>
	)
}
