import type React from "react"

interface ConnectionLinesProps {
	level1to2Line: { x1: number; y1: number; x2: number; y2: number } | null
	level2to3Line: { x1: number; y1: number; x2: number; y2: number } | null
	level3to4Line?: { x1: number; y1: number; x2: number; y2: number } | null
	level4to5Line?: { x1: number; y1: number; x2: number; y2: number } | null
	level5to6Line?: { x1: number; y1: number; x2: number; y2: number } | null
	level6to7Line?: { x1: number; y1: number; x2: number; y2: number } | null
	level7to8Line?: { x1: number; y1: number; x2: number; y2: number } | null
	level8to9Line?: { x1: number; y1: number; x2: number; y2: number } | null
	level9to10Line?: { x1: number; y1: number; x2: number; y2: number } | null
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
	level1to2Line,
	level2to3Line,
	level3to4Line,
	level4to5Line,
	level5to6Line,
	level6to7Line,
	level7to8Line,
	level8to9Line,
	level9to10Line,
}) => {
	const renderLine = (
		line: { x1: number; y1: number; x2: number; y2: number } | null | undefined,
	) => {
		if (!line) return null
		return (
			<line
				x1={line.x1}
				y1={line.y1}
				x2={line.x2}
				y2={line.y2}
				stroke="#2563eb"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		)
	}

	return (
		<svg
			className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
			style={{ overflow: "visible" }}
		>
			{renderLine(level1to2Line)}
			{renderLine(level2to3Line)}
			{renderLine(level3to4Line)}
			{renderLine(level4to5Line)}
			{renderLine(level5to6Line)}
			{renderLine(level6to7Line)}
			{renderLine(level7to8Line)}
			{renderLine(level8to9Line)}
			{renderLine(level9to10Line)}
		</svg>
	)
}
