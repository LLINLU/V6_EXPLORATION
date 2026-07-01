import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/AppSidebar"
import { RecentGeneratedTrees } from "@/components/RecentGeneratedTrees"
import { TreeGenerationSection } from "@/components/tree-generation/TreeGenerationSection"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

const IndexContent = () => {
	return (
		<SidebarProvider>
			<div className="h-screen flex w-full justify-center p-1 overflow-hidden">
				<AppSidebar />
				<div className="flex-1 overflow-auto">
					<div className="container mx-auto px-4 py-6 flex  justify-center">
						<div className="relative w-full max-w-6xl">
							<SidebarTrigger className="absolute left-4 top-4 md:hidden" />
							<div className="max-w-5xl mx-auto space-y-8">
								<div className="space-y-6">
									<TreeGenerationSection />
									<RecentGeneratedTrees />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</SidebarProvider>
	)
}

const Index = () => {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	// Show loading during SSR
	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	return <IndexContent />
}

export default Index
