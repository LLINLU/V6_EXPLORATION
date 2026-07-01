"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import ErrorBoundary from "../../components/ErrorBoundary"

const App = dynamic(() => import("../../App"), {
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center h-screen">Loading...</div>
	),
})

export function ClientOnly() {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		// Add error handling for maximum update depth
		const originalError = console.error
		console.error = (...args) => {
			if (args[0]?.includes?.("Maximum update depth exceeded")) {
				// console.warn(
				// "[CLIENT] Detected maximum update depth error - this may be caused by infinite re-renders",
				// )
			}
			originalError.apply(console, args)
		}

		setIsClient(true)

		return () => {
			console.error = originalError
		}
	}, [])

	if (!isClient) {
		return (
			<div className="flex items-center justify-center h-screen">
				Loading...
			</div>
		)
	}

	return (
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	)
}
