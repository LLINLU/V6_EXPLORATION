import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/AppSidebar"
import { ScenarioSelectionScreen } from "@/components/scenario-selection/ScenarioSelectionScreen"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function ScenarioSelectionPage() {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => setIsClient(true), [])

	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-gray-600">Loading...</p>
			</div>
		)
	}

	return (
		<SidebarProvider>
			<div className="min-h-screen flex w-full">
				<AppSidebar />
				<ScenarioSelectionScreen />
			</div>
		</SidebarProvider>
	)
}
