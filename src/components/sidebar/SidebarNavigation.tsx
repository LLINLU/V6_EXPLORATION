import { Bookmark, History, Search } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { TreeSearchModal } from "./TreeSearchModal"

export function SidebarNavigation() {
	const { state, toggleSidebar } = useSidebar()
	const isExpanded = state === "expanded"
	const [open, setOpen] = useState(false)
	const { t } = useTranslation()

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					{isExpanded ? (
						<>
							<SidebarMenuButton
								onClick={() => setOpen(true)}
								tooltip={t("sidebar.nav.search_tooltip")}
								className="cursor-pointer"
							>
								<Search />
								<span>{t("sidebar.nav.search")}</span>
							</SidebarMenuButton>
							<SidebarMenuButton
								asChild
								tooltip={t("sidebar.nav.papers_cases")}
							>
								<Link to="/my-page">
									<Bookmark />
									<span>{t("sidebar.nav.papers_cases")}</span>
								</Link>
							</SidebarMenuButton>
						</>
					) : (
						<>
							<SidebarMenuButton
								asChild
								tooltip={t("sidebar.nav.search_tooltip")}
								onClick={() => setOpen(true)}
							>
								<button
									type="button"
									aria-label={t("sidebar.nav.search")}
									title={t("sidebar.nav.search_tooltip")}
								>
									<Search />
								</button>
							</SidebarMenuButton>
							<SidebarMenuButton
								asChild
								tooltip={t("sidebar.nav.papers_cases")}
							>
								<Link to="/my-page">
									<Bookmark />
								</Link>
							</SidebarMenuButton>
						</>
					)}
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton
						tooltip={t("sidebar.nav.history")}
						onClick={toggleSidebar}
						className="cursor-pointer"
					>
						<History />
						{isExpanded && <span>{t("sidebar.nav.history")}</span>}
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>

			<TreeSearchModal open={open} onOpenChange={setOpen} />
		</>
	)
}
