import type React from "react"
import MIconSvg from "@/assets/M_icon.svg"

interface MIconProps {
	className?: string
	size?: number
}

export const MIcon: React.FC<MIconProps> = ({ className = "", size = 20 }) => {
	return (
		<img
			src={MIconSvg.src}
			alt="M Icon"
			className={className}
			width={size}
			height={size}
		/>
	)
}
