import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TabNavigatorProps {
	onValueChange: (value: string) => void
	papersCount?: number
	patentsCount?: number
	useCasesCount?: number
	loadingPapers?: boolean
	loadingPatents?: boolean
	loadingUseCases?: boolean
	activeTab?: string
	showSummaryTab?: boolean
	loadingSummary?: boolean
	showTechSeedsTab?: boolean
}

export const TabNavigator = ({
	onValueChange,
	papersCount,
	patentsCount,
	useCasesCount,
	loadingPapers = false,
	loadingPatents = false,
	loadingUseCases = false,
	activeTab = "papers",
	showSummaryTab = false,
	loadingSummary = false,
	showTechSeedsTab: _showTechSeedsTab = false, // Tech Seeds暫定廃止
}: TabNavigatorProps) => {
	const { t } = useTranslation()
	const countLabel = (count?: number) =>
		typeof count === "number" ? `(${count})` : ""
	return (
		<Tabs value={activeTab} className="w-auto" onValueChange={onValueChange}>
			<TabsList className="border-gray-200 gap-4 h-auto p-0 bg-transparent overflow-x-auto whitespace-nowrap scrollbar-hide">
				<TabsTrigger
					value="overview"
					className="flex items-center flex items-center data-[state=active]:text-blue-600 data-[state=active]:shadow-[inset_0_-2px_0_0_#2563eb] px-0 py-2 rounded-none bg-transparent text-gray-600 hover:text-blue-600 flex-shrink-0 text-[13px]"
				>
					{t("tech.tab_overview")}
				</TabsTrigger>
				<TabsTrigger
					value="papers"
					className="flex items-center flex items-center data-[state=active]:text-blue-600 data-[state=active]:shadow-[inset_0_-2px_0_0_#2563eb] px-0 py-2 rounded-none bg-transparent text-gray-600 hover:text-blue-600 flex-shrink-0 text-[13px]"
				>
					{loadingPapers && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
					{t("tech.tab_papers")}{" "}
					{loadingPapers ? t("tech.tab_searching") : countLabel(papersCount)}
				</TabsTrigger>
				<TabsTrigger
					value="patents"
					className="flex items-center flex items-center data-[state=active]:text-blue-600 data-[state=active]:shadow-[inset_0_-2px_0_0_#2563eb] px-0 py-2 rounded-none bg-transparent text-gray-600 hover:text-blue-600 flex-shrink-0 text-[13px]"
				>
					{loadingPatents && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
					{t("tech.tab_patents")}{" "}
					{loadingPatents ? t("tech.tab_searching") : countLabel(patentsCount)}
				</TabsTrigger>
				<TabsTrigger
					value="implementation"
					className="flex items-center flex items-center data-[state=active]:text-blue-600 data-[state=active]:shadow-[inset_0_-2px_0_0_#2563eb] px-0 py-2 rounded-none bg-transparent text-gray-600 hover:text-blue-600 flex-shrink-0 text-[13px]"
				>
					{loadingUseCases && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
					{t("tech.tab_cases")}{" "}
					{loadingUseCases
						? t("tech.tab_searching")
						: countLabel(useCasesCount)}
				</TabsTrigger>
				{showSummaryTab && (
					<TabsTrigger
						value="summary"
						className="flex items-center flex items-center data-[state=active]:text-blue-600 data-[state=active]:shadow-[inset_0_-2px_0_0_#2563eb] px-0 py-2 rounded-none bg-transparent text-gray-600 hover:text-blue-600 flex-shrink-0 text-[13px]"
					>
						{loadingSummary && (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						)}
						{t("tech.tab_report")}
					</TabsTrigger>
				)}
				{/* Tech Seeds暫定廃止
				{showTechSeedsTab && (
					<TooltipProvider delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center">
									<TabsTrigger
										value="techseeds"
										className="flex items-center data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none px-0 py-2 rounded-none bg-transparent text-gray-600 hover:text-blue-600 shadow-none"
									>
										Tech Seeds
									</TabsTrigger>
								</div>
							</TooltipTrigger>
							<TooltipContent className="font-normal max-w-[220px]">
								<p>
									Quick view of how this scenario breaks down into technical
									components
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			*/}
			</TabsList>
		</Tabs>
	)
}
