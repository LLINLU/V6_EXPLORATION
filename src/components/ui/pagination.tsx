import {
	ChevronFirst,
	ChevronLast,
	ChevronLeft,
	ChevronRight,
	MoreHorizontal,
} from "lucide-react"
import * as React from "react"
import { type ButtonProps, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
	<nav
		aria-label="pagination"
		className={cn("mx-auto flex w-full justify-center", className)}
		{...props}
	/>
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
	HTMLUListElement,
	React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
	<ul
		ref={ref}
		className={cn("flex flex-row items-center gap-1", className)}
		{...props}
	/>
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
	HTMLLIElement,
	React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
	<li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
	isActive?: boolean
} & Pick<ButtonProps, "size"> &
	React.ComponentProps<"button">

const PaginationLink = ({
	className,
	isActive,
	size = "icon",
	type = "button",
	...props
}: PaginationLinkProps) => (
	<button
		type={type}
		aria-current={isActive ? "page" : undefined}
		className={cn(
			buttonVariants({
				variant: isActive ? "outline" : "ghost",
				size,
			}),
			"cursor-pointer",
			className,
		)}
		{...props}
	/>
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
	className,
	children,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Go to previous page"
		size="default"
		className={cn("gap-1 px-2.5", className)}
		{...props}
	>
		<ChevronLeft className="h-4 w-4" />
		<span>{children}</span>
	</PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
	className,
	children,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Go to next page"
		size="default"
		className={cn("gap-1 px-2.5", className)}
		{...props}
	>
		<span>{children}</span>
		<ChevronRight className="h-4 w-4" />
	</PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
	className,
	...props
}: React.ComponentProps<"span">) => (
	<span
		aria-hidden
		className={cn("flex h-9 w-9 items-center justify-center", className)}
		{...props}
	>
		<MoreHorizontal className="h-4 w-4" />
		<span className="sr-only">More pages</span>
	</span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

const PaginationFirst = ({
	className,
	children,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Go to first page"
		size="default"
		className={cn("gap-1 px-2.5", className)}
		{...props}
	>
		<ChevronFirst className="h-4 w-4" />
		<span>{children}</span>
	</PaginationLink>
)
PaginationFirst.displayName = "PaginationFirst"

const PaginationLast = ({
	className,
	children,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Go to last page"
		size="default"
		className={cn("gap-1 px-2.5", className)}
		{...props}
	>
		<span>{children}</span>
		<ChevronLast className="h-4 w-4" />
	</PaginationLink>
)
PaginationLast.displayName = "PaginationLast"

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationFirst,
	PaginationItem,
	PaginationLast,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
}
