import { Check, ChevronDown } from "lucide-react"
import React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"

export const SearchCriteria = () => {
	const { t } = useTranslation()
	const [isOpen, setIsOpen] = React.useState(true)
	const navigate = useNavigate()

	return (
		<div className="container mx-auto px-4 mb-6 mt-6">
			<Collapsible
				open={isOpen}
				onOpenChange={setIsOpen}
				className="bg-blue-50 rounded-lg border border-blue-100 p-6"
			>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">
						{t("search.criteria_title")}
					</h2>
					<CollapsibleTrigger asChild>
						<button className="text-gray-500 hover:bg-blue-100 rounded-full p-1 transition-colors">
							<ChevronDown
								size={20}
								className={`transform transition-transform duration-200 ${isOpen ? "" : "rotate-180"}`}
							/>
						</button>
					</CollapsibleTrigger>
				</div>

				<CollapsibleContent className="space-y-4">
					<div className="flex items-center gap-4">
						<div className="w-32 font-medium">{t("search.field_label")}</div>
						<div className="flex-1">
							<div className="inline-flex items-center bg-white rounded-md px-4 py-2 border border-gray-200">
								Optical Engineering{" "}
								<ChevronDown size={16} className="ml-2 text-gray-500" />
							</div>
							<Button variant="outline" className="ml-4 text-gray-500">
								{t("search.add_field")}
							</Button>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="w-32 font-medium">{t("search.subfield_label")}</div>
						<div className="inline-flex items-center bg-white rounded-md px-4 py-2 border border-gray-200">
							Adaptive Optics{" "}
							<ChevronDown size={16} className="ml-2 text-gray-500" />
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="w-32 font-medium">{t("search.use_case_label")}</div>
						<div className="inline-flex items-center bg-white rounded-md px-4 py-2 border border-gray-200">
							Ophthalmology{" "}
							<ChevronDown size={16} className="ml-2 text-gray-500" />
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="w-32 font-medium">
							{t("search.technology_label")}
						</div>
						<div className="flex flex-wrap gap-2">
							<div className="inline-flex items-center bg-white rounded-md px-4 py-2 border border-gray-200">
								AO-SLO <Check size={16} className="ml-2 text-blue-500" />
							</div>
							<div className="inline-flex items-center bg-white rounded-md px-4 py-2 border border-gray-200">
								Wavefront Sensing{" "}
								<Check size={16} className="ml-2 text-blue-500" />
							</div>
							<div className="inline-flex items-center bg-white rounded-md px-4 py-2 border border-gray-200">
								Retinal Imaging{" "}
								<Check size={16} className="ml-2 text-blue-500" />
							</div>
							<Button variant="outline" className="text-gray-500">
								{t("search.show_more")}
							</Button>
							<Button
								variant="outline"
								className="ml-auto text-blue-500 border-blue-500"
								onClick={() => navigate("/technology-tree")}
							>
								{t("search.view_tech_tree")}
							</Button>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	)
}
