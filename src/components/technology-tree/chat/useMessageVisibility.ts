import { useEffect, useState } from "react"

export const useMessageVisibility = (
	_messages: any[],
	onResearchAreaVisible?: (isVisible: boolean) => void,
) => {
	const [researchAreaElements, setResearchAreaElements] = useState<
		HTMLDivElement[]
	>([])

	// Find research area elements after messages update
	useEffect(() => {
		setTimeout(() => {
			const elements = Array.from(
				document.querySelectorAll(".conversation-message"),
			).filter((el) =>
				el.textContent?.includes("潜在的な研究分野"),
			) as HTMLDivElement[]
			setResearchAreaElements(elements)
		}, 100)
	}, [])

	// Track research area visibility
	useEffect(() => {
		if (researchAreaElements.length === 0 || !onResearchAreaVisible) return

		const observer = new IntersectionObserver(
			(entries) => {
				const isVisible = entries.some((entry) => entry.isIntersecting)
				onResearchAreaVisible(isVisible)
			},
			{ threshold: 0.3 },
		) // Consider visible when 30% is visible

		researchAreaElements.forEach((element) => {
			observer.observe(element)
		})

		return () => {
			researchAreaElements.forEach((element) => {
				observer.unobserve(element)
			})
		}
	}, [researchAreaElements, onResearchAreaVisible])

	return { researchAreaElements }
}
