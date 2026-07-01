import * as React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"

export const Sidebar = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<"div"> & {
		side?: "left" | "right"
		variant?: "sidebar" | "floating" | "inset"
		collapsible?: "offcanvas" | "icon" | "none"
	}
>(
	(
		{
			side = "left",
			variant = "sidebar",
			collapsible = "offcanvas",
			className,
			children,
			...props
		},
		ref,
	) => {
		const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

		if (collapsible === "none") {
			return (
				<div
					className={cn(
						"flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
						className,
					)}
					ref={ref}
					{...props}
				>
					{children}
				</div>
			)
		}

		if (isMobile) {
			return (
				<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
					<SheetContent
						data-sidebar="sidebar"
						data-mobile="true"
						className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
						style={
							{
								"--sidebar-width": "18rem",
							} as React.CSSProperties
						}
						side={side}
					>
						<div className="flex h-full w-full flex-col">{children}</div>
					</SheetContent>
				</Sheet>
			)
		}

		// For desktop, use width transition based on state
		return (
			<div
				ref={ref}
				className={cn(
					"h-full",
					"flex flex-col",
					"bg-sidebar",
					"text-sidebar-foreground",
					"rounded-lg",
					"transition-[width] duration-200 ease-linear",
					"border border-sidebar-border",
					state === "expanded"
						? "w-[var(--sidebar-width)]"
						: "w-[var(--sidebar-width-icon)]",
					className,
				)}
				data-state={state}
				{...props}
			>
				{children}
			</div>
		)
	},
)
Sidebar.displayName = "Sidebar"
