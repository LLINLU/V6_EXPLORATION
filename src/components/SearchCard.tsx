import { Copy, MoreVertical } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TagBadge } from "./TagBadge"

interface Tag {
	label: string
	variant:
		| "materials"
		| "engineering"
		| "aiml"
		| "healthcare"
		| "energy"
		| "sustainability"
		| "default"
		| "algorithms"
		| "realtime"
		| "predictive"
		| "robotics"
		| "blue"
		| "yellow"
		| "quantum"
}

interface SearchCardProps {
	title: string
	paperCount: number
	implementationCount: number
	tags: Tag[]
	timeAgo: string
	treeId?: string
	onDuplicate?: (treeId: string, treeName: string) => void
}

export const SearchCard = ({
	title,
	paperCount,
	implementationCount,
	tags,
	timeAgo,
	treeId,
	onDuplicate,
}: SearchCardProps) => {
	const navigate = useNavigate()
	const { t } = useTranslation()

	const handleClick = () => {
		if (treeId) {
			// Navigate to the specific tree
			navigate(`/technology-tree?id=${encodeURIComponent(treeId)}`, {
				state: {
					query: title,
					searchMode: "recent-search",
					treeId: treeId,
					fromDatabase: true,
					isDemo: false,
				},
			})
		}
	}

	return (
		<div
			className={`bg-white px-5 py-4 rounded-lg border border-gray-200 relative group ${
				treeId ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""
			}`}
			onClick={handleClick}
		>
			{onDuplicate && treeId && (
				<div className="absolute top-3 right-3">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								aria-label={t("common.open_menu")}
								className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
								onClick={(e) => e.stopPropagation()}
							>
								<MoreVertical className="h-4 w-4 text-gray-500" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation()
									onDuplicate(treeId, title)
								}}
							>
								<Copy className="mr-2 h-4 w-4" />
								{t("common.duplicate")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
			<h3 className="text-[18px] font-semibold mb-2">{title}</h3>
			<div className="text-[14px] text-gray-600 mb-2">
				{t("index.paper_and_case_count", { paperCount, implementationCount })}
			</div>

			<div className="flex flex-wrap gap-2 mb-4">
				{tags.map((tag) => (
					<TagBadge key={tag.label} label={tag.label} variant={tag.variant} />
				))}
			</div>

			<div className="text-sm text-gray-500 text-right">{timeAgo}</div>
		</div>
	)
}
