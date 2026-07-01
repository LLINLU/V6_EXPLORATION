import type React from "react"
import { AppSidebar } from "@/components/AppSidebar"
import { Navigation } from "@/components/Navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

interface PageLayoutProps {
	children: React.ReactNode
}

export const PageLayout = ({ children }: PageLayoutProps) => {
	return (
		<SidebarProvider>
			<div className="h-screen flex w-full overflow-hidden">
				<AppSidebar />
				<div className="flex-1 bg-gray-50 pb-12 overflow-auto">
					<Navigation />
					<div className="relative">
						<SidebarTrigger className="absolute left-4 top-4 md:hidden" />
						{children}
					</div>
				</div>
			</div>
		</SidebarProvider>
	)
}
