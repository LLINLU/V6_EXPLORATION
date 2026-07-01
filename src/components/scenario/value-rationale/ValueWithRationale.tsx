"use client"

import { useState } from "react"

import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card"

import { RationaleHoverCard } from "./RationaleHoverCard"
import { RationaleModal } from "./RationaleModal"
import type { ValueWithRationaleProps } from "./types"

export function ValueWithRationale({
	children,
	rationale,
	metricName,
	metricValue,
	className,
	cagrInfo,
}: ValueWithRationaleProps) {
	const [isModalOpen, setIsModalOpen] = useState(false)

	// If no rationale data, just render the children without any interaction
	if (!rationale) {
		return <>{children}</>
	}

	const handleOpenModal = () => {
		setIsModalOpen(true)
	}

	return (
		<>
			<HoverCard openDelay={300} closeDelay={100}>
				<HoverCardTrigger asChild>
					<span
						className={`cursor-pointer hover:underline hover:decoration-dotted hover:underline-offset-4 ${className || ""}`}
						onClick={handleOpenModal}
					>
						{children}
					</span>
				</HoverCardTrigger>
				<HoverCardContent
					className="w-auto p-0 border-0 bg-transparent shadow-none"
					side="top"
					align="start"
					sideOffset={8}
				>
					<RationaleHoverCard
						summary={rationale.summary}
						metricName={metricName}
						onClickDetails={handleOpenModal}
						cagrInfo={cagrInfo}
					/>
				</HoverCardContent>
			</HoverCard>

			<RationaleModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				metricName={metricName}
				metricValue={metricValue}
				derivation={rationale.derivation}
			/>
		</>
	)
}
