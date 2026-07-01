import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
} from "@/components/ui/sidebar"
import { SidebarFooter as CustomSidebarFooter } from "./sidebar/SidebarFooter"
import { SidebarHeader as CustomSidebarHeader } from "./sidebar/SidebarHeader"
import { SidebarNavigation } from "./sidebar/SidebarNavigation"
import { SidebarProjects } from "./sidebar/SidebarProjects"
import { SidebarSearches } from "./sidebar/SidebarSearches"

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader>
				<CustomSidebarHeader />
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarNavigation />
				</SidebarGroup>

				<SidebarGroup>
					<SidebarProjects />
				</SidebarGroup>

				<SidebarGroup>
					<SidebarSearches />
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<CustomSidebarFooter />
			</SidebarFooter>
		</Sidebar>
	)
}
