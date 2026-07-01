import {
	Bookmark,
	BookmarkCheck,
	ChevronDown,
	ChevronUp,
	Copy,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useUserDetail } from "@/hooks/useUserDetail"
import { cn } from "@/lib/utils"

interface PressRelease {
	title: string
	url: string
}

interface ImplementationCardProps {
	title: string
	description: string
	company?: string[]
	releases: number
	badgeColor: string
	badgeTextColor: string
	pressReleases?: PressRelease[]
	saved?: boolean
	toggleCase: () => void
}

export const ImplementationCard = ({
	title,
	description,
	company = [],
	releases,
	badgeColor,
	badgeTextColor,
	pressReleases = [],
	saved = false,
	toggleCase,
}: ImplementationCardProps) => {
	const [isExpanded, setIsExpanded] = useState(false)
	const { t } = useTranslation()
	const { toast } = useToast()
	const hasMoreReleases = pressReleases.length > 3
	const displayedReleases = isExpanded
		? pressReleases
		: pressReleases.slice(0, 3)

	const { userDetails } = useUserDetail()

	return (
		<div className="bg-white p-4 rounded-lg border border-gray-200">
			<div className="mb-3">
				<h4 className="font-semibold">{title}</h4>
				{company.length > 0 && (
					<div className="group/company flex items-center gap-1 mt-1">
						<p className="text-sm text-gray-500">{company.join(", ")}</p>
						<button
							type="button"
							className="flex-shrink-0 p-1 rounded transition-all opacity-0 group-hover/company:opacity-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700"
							title={t("tech.copy_tooltip")}
							onClick={async (e) => {
								e.stopPropagation()
								try {
									await navigator.clipboard.writeText(company.join(", "))
									toast({
										title: t("tech.copied"),
										description: t("tech.copied_desc"),
									})
								} catch {
									toast({
										title: t("tech.copy_failed"),
										description: t("tech.copy_failed_desc"),
									})
								}
							}}
						>
							<Copy className="h-3 w-3" />
						</button>
					</div>
				)}
			</div>
			<p className="text-gray-600 text-sm font-normal mb-3">{description}</p>
			{pressReleases.length > 0 && (
				<div className="space-y-1.5 mb-4">
					<div className="flex items-center gap-2">
						<span className="text-xs font-medium text-gray-700">
							{t("tech.press_releases")}：
						</span>
						<Badge
							variant="releaseCount"
							className={cn(
								badgeColor,
								badgeTextColor,
								"border-0 pointer-events-none",
							)}
							style={{ padding: "4px 12px", fontSize: "12px" }}
						>
							{t("tech.release_count", { count: releases })}
						</Badge>
					</div>
					<div className="space-y-2">
						{displayedReleases.map((release) => (
							<a
								key={release.url}
								href={release.url}
								className="block h-[14px] text-sm text-blue-600"
								target="_blank"
								rel="noopener noreferrer"
							>
								{release.title}
							</a>
						))}
					</div>
					{hasMoreReleases && (
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className="flex items-center gap-1 text-sm text-gray-600 mt-1"
						>
							{isExpanded ? (
								<>
									<ChevronUp className="w-4 h-4" />
									{t("tech.collapse")}
								</>
							) : (
								<>
									<ChevronDown className="w-4 h-4" />
									{t("tech.show_more_count", {
										count: pressReleases.length - 3,
									})}
								</>
							)}
						</button>
					)}
				</div>
			)}
			{userDetails ? (
				<div className="flex justify-start">
					<Button
						variant="outline"
						size="sm"
						className="text-xs flex-shrink-0"
						onClick={toggleCase}
					>
						{saved ? (
							<>
								<BookmarkCheck size={14} />
								{t("tech.saved")}
							</>
						) : (
							<>
								<Bookmark size={14} />
								{t("tech.save")}
							</>
						)}
					</Button>
				</div>
			) : null}
		</div>
	)
}
