import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

import { cn } from "@/lib/utils"

/** Default padding + type scale for standard badge variants */
const STANDARD_BADGE_PAD_TYPE = "px-2.5 py-0.5 text-overline-default"

/** Padding and type scale for `variant="releaseCount"` (12px text, 12px horizontal / 4px vertical padding) */
const RELEASE_COUNT_BADGE_LAYOUT = "px-3 py-1 text-xs font-normal"

const badgeVariants = cva(
	"inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				default: cn(
					"border-transparent text-primary-foreground",
					STANDARD_BADGE_PAD_TYPE,
				),
				secondary: cn(
					"border-transparent bg-secondary text-secondary-foreground",
					STANDARD_BADGE_PAD_TYPE,
				),
				destructive: cn(
					"border-transparent bg-destructive text-destructive-foreground",
					STANDARD_BADGE_PAD_TYPE,
				),
				outline: cn("text-foreground", STANDARD_BADGE_PAD_TYPE),
				update: cn(
					"border-green-300 bg-[#ecfff1] text-green-800",
					STANDARD_BADGE_PAD_TYPE,
				),
				releaseCount: cn("border-transparent", RELEASE_COUNT_BADGE_LAYOUT),
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
)

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	)
}

export { Badge, badgeVariants }
