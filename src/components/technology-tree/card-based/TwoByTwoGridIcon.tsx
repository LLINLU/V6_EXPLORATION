import type React from "react"

interface TwoByTwoGridIconProps {
	className?: string
	isSelected?: boolean
}

export const TwoByTwoGridIcon: React.FC<TwoByTwoGridIconProps> = ({
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
			<path
				d="M4.5 1H1.5C1.22386 1 1 1.22386 1 1.5V4.5C1 4.77614 1.22386 5 1.5 5H4.5C4.77614 5 5 4.77614 5 4.5V1.5C5 1.22386 4.77614 1 4.5 1Z"
				fill={color}
			/>
			<path
				d="M4.5 7H1.5C1.22386 7 1 7.22386 1 7.5V10.5C1 10.7761 1.22386 11 1.5 11H4.5C4.77614 11 5 10.7761 5 10.5V7.5C5 7.22386 4.77614 7 4.5 7Z"
				fill={color}
			/>
			<path
				d="M10.5 1H7.5C7.22386 1 7 1.22386 7 1.5V4.5C7 4.77614 7.22386 5 7.5 5H10.5C10.7761 5 11 4.77614 11 4.5V1.5C11 1.22386 10.7761 1 10.5 1Z"
				fill={color}
			/>
			<path
				d="M10.5 7H7.5C7.22386 7 7 7.22386 7 7.5V10.5C7 10.7761 7.22386 11 7.5 11H10.5C10.7761 11 11 10.7761 11 10.5V7.5C11 7.22386 10.7761 7 10.5 7Z"
				fill={color}
			/>
		</svg>
	)
}
