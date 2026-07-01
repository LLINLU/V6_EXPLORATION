import { cn } from "@/lib/utils"

interface TagBadgeProps {
	label: string
	variant?:
		| "materials"
		| "engineering"
		| "aiml"
		| "healthcare"
		| "energy"
		| "sustainability"
		| "default"
		| "algorithms"
		| "realtime"
		| "predictive"
		| "robotics"
		| "blue"
		| "yellow"
		| "quantum"
	className?: string
}

const variantStyles = {
	// All variants now use consistent styling
	materials: "bg-[#f3f3f3] text-[#4f4f4f]",
	engineering: "bg-[#f3f3f3] text-[#4f4f4f]",
	aiml: "bg-[#f3f3f3] text-[#4f4f4f]",
	healthcare: "bg-[#f3f3f3] text-[#4f4f4f]",
	energy: "bg-[#f3f3f3] text-[#4f4f4f]",
	sustainability: "bg-[#f3f3f3] text-[#4f4f4f]",
	algorithms: "bg-[#f3f3f3] text-[#4f4f4f]",
	realtime: "bg-[#f3f3f3] text-[#4f4f4f]",
	predictive: "bg-[#f3f3f3] text-[#4f4f4f]",
	robotics: "bg-[#f3f3f3] text-[#4f4f4f]",
	quantum: "bg-[#f3f3f3] text-[#4f4f4f]",
	default: "bg-[#f3f3f3] text-[#4f4f4f]",
	blue: "bg-[#f3f3f3] text-[#4f4f4f]",
	yellow: "bg-[#f3f3f3] text-[#4f4f4f]",
}

export const TagBadge = ({
	label,
	variant = "default",
	className,
}: TagBadgeProps) => {
	return (
		<span
			className={cn(
				"px-3 py-1 rounded-full text-[0.75rem] font-normal", // Updated font size and weight
				variantStyles[variant],
				className,
			)}
		>
			{label}
		</span>
	)
}
