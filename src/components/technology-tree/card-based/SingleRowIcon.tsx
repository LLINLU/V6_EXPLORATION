import type React from "react"

interface SingleRowIconProps {
	className?: string
}

export const SingleRowIcon: React.FC<SingleRowIconProps> = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
		>
			<path d="M2.5 1.5V10.5H1.5V1.5H2.5Z" stroke="#1C4ED8" />
			<path
				d="M6.5 1H5.5C5.22386 1 5 1.22386 5 1.5V10.5C5 10.7761 5.22386 11 5.5 11H6.5C6.77614 11 7 10.7761 7 10.5V1.5C7 1.22386 6.77614 1 6.5 1Z"
				fill="#1C4ED8"
			/>
			<path
				d="M10.5 1H9.5C9.22386 1 9 1.22386 9 1.5V10.5C9 10.7761 9.22386 11 9.5 11H10.5C10.7761 11 11 10.7761 11 10.5V1.5C11 1.22386 10.7761 1 10.5 1Z"
				fill="#1C4ED8"
			/>
		</svg>
	)
}
