import type React from "react"

interface ThreeColumnsIconProps {
	className?: string
	isSelected?: boolean
}

export const ThreeColumnsIcon: React.FC<ThreeColumnsIconProps> = ({
	isSelected = false,
}) => {
	const color = isSelected ? "#6B7280" : "#D1D5DB"
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
		>
			<path d="M1.5 1.5L10.5 1.5V2.5L1.5 2.5V1.5Z" stroke={color} />
			<path
				d="M1 5.5V6.5C1 6.77614 1.22386 7 1.5 7L10.5 7C10.7761 7 11 6.77614 11 6.5V5.5C11 5.22386 10.7761 5 10.5 5L1.5 5C1.22386 5 1 5.22386 1 5.5Z"
				fill={color}
			/>
			<path
				d="M1 9.5V10.5C1 10.7761 1.22386 11 1.5 11H10.5C10.7761 11 11 10.7761 11 10.5V9.5C11 9.22386 10.7761 9 10.5 9H1.5C1.22386 9 1 9.22386 1 9.5Z"
				fill={color}
			/>
		</svg>
	)
}
