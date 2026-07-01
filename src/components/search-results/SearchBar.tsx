import { ArrowUp, Lightbulb, Target } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

export const SearchBar = () => {
	const { t } = useTranslation()
	const [searchMode, setSearchMode] = useState("TED") // Default to "TED"
	const [searchValue, setSearchValue] = useState(t("search.default_query"))
	const location = useLocation()

	// Only show search mode selector on homepage
	const isHomepage = location.pathname === "/"

	const handleSearchModeChange = (mode: string) => {
		setSearchMode(mode)
	}

	return (
		<div className="border-b border-gray-200 bg-white px-4 py-4">
			<div className="container mx-auto">
				<div className="bg-gray-50 rounded-2xl p-4">
					<Input
						type="text"
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
						placeholder={
							searchMode === "FAST" ? t("search.fast_mode_placeholder") : ""
						}
						className="w-full px-4 py-3 text-base border-none bg-gray-50 focus-visible:ring-0 truncate"
					/>

					{isHomepage && (
						<div className="flex mt-2 items-center">
							<div className="flex space-x-2">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												type="button"
												onClick={() => handleSearchModeChange("TED")}
												className={`inline-flex items-center rounded-full py-1 px-4 h-[28px] text-sm transition-colors ${
													searchMode === "TED"
														? "bg-blue-50 text-blue-700"
														: "bg-gray-200 hover:bg-gray-300 text-[#9f9f9f]"
												}`}
											>
												<Target
													className={`h-3 w-3 mr-1 ${searchMode === "TED" ? "stroke-[2.5px]" : ""}`}
												/>
												{t("search.mode_from_need")}
											</button>
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-xs">
												{t("search.mode_from_need_tooltip")}
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												type="button"
												onClick={() => handleSearchModeChange("FAST")}
												className={`inline-flex items-center rounded-full py-1 px-4 h-[28px] text-sm transition-colors ${
													searchMode === "FAST"
														? "bg-purple-50 text-purple-700"
														: "bg-gray-200 hover:bg-gray-300 text-[#9f9f9f]"
												}`}
											>
												<Lightbulb
													className={`h-3 w-3 mr-1 ${searchMode === "FAST" ? "stroke-[2.5px]" : ""}`}
												/>
												{t("search.mode_from_tech")}
											</button>
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-xs">
												{t("search.mode_from_tech_tooltip")}
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>

							<div className="ml-auto">
								<Button className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200">
									<ArrowUp className="h-4 w-4 text-gray-600" />
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
