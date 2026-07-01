import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const ResultsHeader = () => {
	const { t } = useTranslation()

	return (
		<div className="container mx-auto px-4 mb-6">
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
				<h2 className="text-xl font-bold">{t("search.results_count")}</h2>

				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center">
						<span className="text-gray-600 mr-2">
							{t("search.filter_label")}
						</span>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="border rounded-md px-4 py-2 bg-gray-50 hover:bg-gray-100"
								>
									{t("search.filter_past_5_years")}{" "}
									<ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="bg-white">
								<DropdownMenuItem>
									{t("search.filter_past_5_years")}
								</DropdownMenuItem>
								<DropdownMenuItem>
									{t("search.filter_past_1_year")}
								</DropdownMenuItem>
								<DropdownMenuItem>
									{t("search.filter_year_2024")}
								</DropdownMenuItem>
								<DropdownMenuItem>
									{t("search.filter_before_2020")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="border rounded-md px-4 py-2 ml-2 bg-gray-50 hover:bg-gray-100"
								>
									{t("search.citation_filter_50plus")}{" "}
									<ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="bg-white">
								<DropdownMenuItem>{t("search.citation_all")}</DropdownMenuItem>
								<DropdownMenuItem>
									{t("search.citation_10plus")}
								</DropdownMenuItem>
								<DropdownMenuItem>
									{t("search.citation_50plus")}
								</DropdownMenuItem>
								<DropdownMenuItem>
									{t("search.citation_100plus")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="flex items-center">
						<span className="text-gray-600 mr-2">{t("search.sort_label")}</span>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-6 py-2">
									{t("search.sort_newest")}{" "}
									<ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="bg-white">
								<DropdownMenuItem>{t("search.sort_newest")}</DropdownMenuItem>
								<DropdownMenuItem>{t("search.sort_oldest")}</DropdownMenuItem>
								<DropdownMenuItem>
									{t("search.sort_relevance")}
								</DropdownMenuItem>
								<DropdownMenuItem>
									{t("search.sort_citations")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</div>
	)
}
