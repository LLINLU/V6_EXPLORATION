import type React from "react"

interface ThreeColumnsWideIconProps {
	className?: string
	isSelected?: boolean
}

export const ThreeColumnsWideIcon: React.FC<ThreeColumnsWideIconProps> = ({
	isSelected = false,
}) => {
	const color = isSelected ? "#6B7280" : "#D1D5DB"
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="13"
			height="12"
			viewBox="0 0 13 12"
			fill="none"
		>
			<path
				d="M3.75 1H2.25C1.97386 1 1.75 1.22386 1.75 1.5V5C1.75 5.27614 1.97386 5.5 2.25 5.5H3.75C4.02614 5.5 4.25 5.27614 4.25 5V1.5C4.25 1.22386 4.02614 1 3.75 1Z"
				fill={color}
			/>
			<path
				d="M7.25 1H5.75C5.47386 1 5.25 1.22386 5.25 1.5V5C5.25 5.27614 5.47386 5.5 5.75 5.5H7.25C7.52614 5.5 7.75 5.27614 7.75 5V1.5C7.75 1.22386 7.52614 1 7.25 1Z"
				fill={color}
			/>
			<path
				d="M10.75 1H9.25C8.97386 1 8.75 1.22386 8.75 1.5V5C8.75 5.27614 8.97386 5.5 9.25 5.5H10.75C11.0261 5.5 11.25 5.27614 11.25 5V1.5C11.25 1.22386 11.0261 1 10.75 1Z"
				fill={color}
			/>
			<path
				d="M3.75 6.5H2.25C1.97386 6.5 1.75 6.72386 1.75 7V10.5C1.75 10.7761 1.97386 11 2.25 11H3.75C4.02614 11 4.25 10.7761 4.25 10.5V7C4.25 6.72386 4.02614 6.5 3.75 6.5Z"
				fill={color}
			/>
			<path
				d="M7.25 6.5H5.75C5.47386 6.5 5.25 6.72386 5.25 7V10.5C5.25 10.7761 5.47386 11 5.75 11H7.25C7.52614 11 7.75 10.7761 7.75 10.5V7C7.75 6.72386 7.52614 6.5 7.25 6.5Z"
				fill={color}
			/>
			<path
				d="M10.75 6.5H9.25C8.97386 6.5 8.75 6.72386 8.75 7V10.5C8.75 10.7761 8.97386 11 9.25 11H10.75C11.0261 11 11.25 10.7761 11.25 10.5V7C11.25 6.72386 11.0261 6.5 10.75 6.5Z"
				fill={color}
			/>
		</svg>
	)
}
