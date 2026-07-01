import { Share2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export const BrowseButton = () => {
	const navigate = useNavigate()

	return (
		<Button
			variant="outline"
			className="flex items-center gap-2 border-2 border-gray-200 hover:border-blue-500 hover:bg-white text-blue-500 py-6 px-8 text-lg font-medium mx-auto"
			onClick={() => navigate("/technology-tree")}
		>
			<Share2 className="h-5 w-5" />
			テクノロジーツリーを探索
		</Button>
	)
}
