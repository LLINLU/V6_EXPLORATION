import * as TabsPrimitive from "@radix-ui/react-tabs"
import * as React from "react"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		className={cn(
			"inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
			className,
		)}
		{...props}
	/>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(
			"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
			className,
		)}
		{...props}
	/>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			"mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			className,
		)}
		{...props}
	/>
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Horizontal tab view with content side by side
const TabsHorizontal = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Root
		ref={ref}
		className={cn("flex flex-col", className)}
		{...props}
	/>
))
TabsHorizontal.displayName = "TabsHorizontal"

// Define a type for the custom TabsHorizontalContent props
interface TabsHorizontalContentProps
	extends React.HTMLAttributes<HTMLDivElement> {
	value: string
}

const TabsHorizontalContent = React.forwardRef<
	HTMLDivElement,
	TabsHorizontalContentProps
>(({ className, value, ...props }, ref) => {
	// We need to use a different approach since TabsPrimitive.TabsContext doesn't exist
	// Instead, we'll use data attributes to handle active state
	return (
		<div
			ref={ref}
			className={cn("flex-1 hidden data-[state=active]:block", className)}
			data-state="inactive"
			data-tab-value={value}
			role="tabpanel"
			{...props}
		/>
	)
})
TabsHorizontalContent.displayName = "TabsHorizontalContent"

// Add this function to the exports to update the active tab content
// This will be used in TechnologyTree.tsx to manually control the active tab
const updateTabsHorizontalState = (selectedValue: string) => {
	// Find all tab contents
	const tabContents = document.querySelectorAll("[data-tab-value]")

	// Update their state based on the selected value
	tabContents.forEach((content) => {
		const tabValue = content.getAttribute("data-tab-value")
		if (tabValue === selectedValue) {
			content.setAttribute("data-state", "active")
		} else {
			content.setAttribute("data-state", "inactive")
		}
	})
}

export {
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
	TabsHorizontal,
	TabsHorizontalContent,
	updateTabsHorizontalState,
}
