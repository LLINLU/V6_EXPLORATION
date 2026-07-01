import { useState } from "react"

export const useSidebar = (initialTab = "result") => {
	const [sidebarTab, setSidebarTab] = useState(initialTab)
	const [showSidebar, setShowSidebar] = useState(true)
	const [collapsedSidebar, setCollapsedSidebar] = useState(false)

	const toggleSidebar = () => {
		if (collapsedSidebar) {
			setCollapsedSidebar(false)
			setShowSidebar(true)
		} else {
			setCollapsedSidebar(true)
		}
	}

	return {
		sidebarTab,
		showSidebar,
		collapsedSidebar,
		setSidebarTab,
		setShowSidebar,
		toggleSidebar,
	}
}
