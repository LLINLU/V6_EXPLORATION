import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { SIDEBAR_COOKIE_NAME, SidebarContext } from "@/hooks/use-sidebar"

import { cn } from "@/lib/utils"

export const SidebarProvider = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<"div"> & {
		defaultOpen?: boolean
		open?: boolean
		onOpenChange?: (open: boolean) => void
	}
>(
	(
		{
			defaultOpen = true,
			open: openProp,
			onOpenChange: setOpenProp,
			className,
			style,
			children,
			...props
		},
		ref,
	) => {
		const isMobile = useIsMobile()
		const [openMobile, setOpenMobile] = React.useState(false)

		const setOpenMobileStable = React.useCallback(
			(value: boolean | ((prev: boolean) => boolean)) => {
				setOpenMobile(value)
			},
			[],
		)
		const [_open, _setOpen] = React.useState(defaultOpen)
		const open = openProp ?? _open

		const setOpen = React.useCallback(
			(value: boolean | ((value: boolean) => boolean)) => {
				if (setOpenProp) {
					const newValue = typeof value === "function" ? value(open) : value
					setOpenProp(newValue)
				} else {
					if (typeof value === "function") {
						_setOpen((prev) => {
							const newValue = value(prev)
							document.cookie = `${SIDEBAR_COOKIE_NAME}=${newValue}; path=/; max-age=${
								60 * 60 * 24 * 7
							}`
							return newValue
						})
					} else {
						_setOpen(value)
						document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${
							60 * 60 * 24 * 7
						}`
					}
				}
			},
			[setOpenProp, open],
		)

		React.useEffect(() => {
			try {
				const cookieValue = document.cookie
					.split("; ")
					.find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
					?.split("=")[1]

				if (defaultOpen === false) {
					_setOpen(false)
				} else if (cookieValue === undefined || cookieValue === "true") {
					_setOpen(true)
				} else {
					_setOpen(cookieValue === "true")
				}
			} catch (_e) {
				_setOpen(defaultOpen)
			}
		}, [defaultOpen])
		const toggleSidebar = React.useCallback(() => {
			if (isMobile) {
				setOpenMobileStable((open) => !open)
			} else {
				setOpen((open) => !open)
			}
		}, [isMobile, setOpenMobileStable, setOpen])

		React.useEffect(() => {
			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
					event.preventDefault()
					toggleSidebar()
				}
			}

			window.addEventListener("keydown", handleKeyDown)
			return () => window.removeEventListener("keydown", handleKeyDown)
		}, [toggleSidebar])

		const state = open ? "expanded" : "collapsed"

		const contextValue = React.useMemo<SidebarContext>(
			() => ({
				state,
				open,
				setOpen,
				isMobile,
				openMobile,
				setOpenMobile: setOpenMobileStable,
				toggleSidebar,
			}),
			[
				state,
				open,
				isMobile,
				openMobile,
				setOpen,
				setOpenMobileStable,
				toggleSidebar,
			],
		)
		return (
			<SidebarContext.Provider value={contextValue}>
				<div
					style={
						{
							"--sidebar-width": "14rem",
							"--sidebar-width-icon": "3rem",
							...style,
						} as React.CSSProperties
					}
					className={cn(
						"group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar overflow-hidden",
						className,
					)}
					ref={ref}
					{...props}
				>
					{children}
				</div>
			</SidebarContext.Provider>
		)
	},
)
SidebarProvider.displayName = "SidebarProvider"
