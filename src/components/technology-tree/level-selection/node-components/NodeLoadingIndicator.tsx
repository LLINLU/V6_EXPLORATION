import { Loader2 } from "lucide-react"
import type React from "react"

interface NodeLoadingIndicatorProps {
	size?: "sm" | "md" | "lg"
}

export const NodeLoadingIndicator: React.FC<NodeLoadingIndicatorProps> = ({
	size = "sm",
}) => {
	const sizeClasses = {
		sm: "w-3 h-3",
		md: "w-4 h-4",
		lg: "w-5 h-5",
	}

	return (
		<div className="flex items-center gap-1.5 text-blue-600">
			<Loader2 className={`${sizeClasses[size]} animate-spin`} />
			<span className="text-xs text-blue-600">生成中...</span>
		</div>
	)
}
