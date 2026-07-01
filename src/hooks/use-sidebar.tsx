import * as React from "react"

export const SIDEBAR_COOKIE_NAME = "sidebar:state"
// const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // Unused - commented out
// const SIDEBAR_KEYBOARD_SHORTCUT = "b" // Unused - commented out

type SidebarContext = {
	state: "expanded" | "collapsed"
	open: boolean
	setOpen: (open: boolean) => void
	openMobile: boolean
	setOpenMobile: (open: boolean) => void
	isMobile: boolean
	toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

export function useSidebar() {
	const context = React.useContext(SidebarContext)
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider.")
	}
	return context
}

export { SidebarContext }
export const SIDEBAR_WIDTH = "16rem"
export const SIDEBAR_WIDTH_MOBILE = "18rem"
export const SIDEBAR_WIDTH_ICON = "4rem" // Increased from 3rem to 4rem for better icon visibility
