import type React from "react"

interface HorizontalBarsIconProps {
	className?: string
}

export const HorizontalBarsIcon: React.FC<HorizontalBarsIconProps> = ({
	className = "",
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			className={className}
		>
			<path
				d="M10.5 1.5H1.5C1.22386 1.5 1 1.72386 1 2V3C1 3.27614 1.22386 3.5 1.5 3.5H10.5C10.7761 3.5 11 3.27614 11 3V2C11 1.72386 10.7761 1.5 10.5 1.5Z"
				fill="#1C4ED8"
			/>
			<path
				d="M10.5 4.5H1.5C1.22386 4.5 1 4.72386 1 5V6C1 6.27614 1.22386 6.5 1.5 6.5H10.5C10.7761 6.5 11 6.27614 11 6V5C11 4.72386 10.7761 4.5 10.5 4.5Z"
				fill="#1C4ED8"
			/>
			<path
				d="M10.5 7.5H1.5C1.22386 7.5 1 7.72386 1 8V9C1 9.27614 1.22386 9.5 1.5 9.5H10.5C10.7761 9.5 11 9.27614 11 9V8C11 7.72386 10.7761 7.5 10.5 7.5Z"
				fill="#1C4ED8"
			/>
		</svg>
	)
}
