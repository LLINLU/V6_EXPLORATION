export const getLevelColor = (level: number) => {
	const colors = [
		{ bg: "bg-[#e8f1ff]", border: "border-[#90aff7]", text: "text-blue-800" },
		{ bg: "bg-[#effdfa]", border: "border-[#97d0ca]", text: "text-green-800" },
		{ bg: "bg-[#f9f3ff]", border: "border-[#debbe0]", text: "text-purple-800" },
		{ bg: "bg-[#fffeef]", border: "border-[#d9d2bc]", text: "text-orange-800" },
		{ bg: "bg-[#f4fafe]", border: "border-[#b2ddfa]", text: "text-[#242c4e]" },
		{ bg: "bg-[#f5f7ff]", border: "border-[#bec8fd]", text: "text-indigo-800" },
		{ bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-800" },
		{ bg: "bg-red-100", border: "border-red-300", text: "text-red-800" },
		{
			bg: "bg-yellow-100",
			border: "border-yellow-300",
			text: "text-yellow-800",
		},
		{ bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-800" },
	]

	return colors[(level - 1) % colors.length]
}

export const getLegendColor = (level: number) => {
	const legendColors = [
		{ bg: "bg-[#e8f1ff]", border: "border-[#4a90e2]" }, // Light blue bg, saturated blue border
		{ bg: "bg-[#effdfa]", border: "border-[#4a9b8a]" }, // Light green bg, saturated green border
		{ bg: "bg-[#f9f3ff]", border: "border-[#9b6ba3]" }, // Light purple bg, saturated purple border
		{ bg: "bg-[#fffeef]", border: "border-[#cc9a47]" }, // Light yellow bg, saturated orange border
		{ bg: "bg-[#f4fafe]", border: "border-[#5a9bd4]" }, // Light blue bg, saturated light blue border
		{ bg: "bg-[#f5f7ff]", border: "border-[#7b8fd4]" }, // Light indigo bg, saturated indigo border
		{ bg: "bg-teal-100", border: "border-teal-600" },
		{ bg: "bg-red-100", border: "border-red-600" },
		{ bg: "bg-yellow-100", border: "border-yellow-600" },
		{ bg: "bg-cyan-100", border: "border-cyan-600" },
	]

	return legendColors[(level - 1) % legendColors.length]
}

export const getLevelBadgeStyle = (level: number) => {
	const { bg, text } = getLevelColor(level)
	return `${bg} ${text} font-light`
}
