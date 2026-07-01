import { useEffect, useState } from "react"

const NotFound = () => {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	useEffect(() => {
		if (!isClient) return

		// Check if we're on research-context route and redirect using window.location
		if (
			typeof window !== "undefined" &&
			window.location.pathname === "/research-context"
		) {
			// console.log("Redirecting from removed research-context route to home")
			window.location.replace("/")
			return
		}

		if (typeof window !== "undefined") {
			console.error(
				`404 Error: User attempted to access non-existent route: ${window.location.pathname}`,
			)
		}
	}, [isClient])

	// Show loading during SSR or while client is initializing
	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	// If it's the research-context route, show loading while redirecting
	if (
		isClient &&
		typeof window !== "undefined" &&
		window.location.pathname === "/research-context"
	) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Redirecting...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
				<p className="text-gray-600 mb-8">
					The page you're looking for doesn't exist.
				</p>
				<button
					onClick={() => {
						if (typeof window !== "undefined") {
							window.location.href = "/"
						}
					}}
					className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
				>
					Go Home
				</button>
			</div>
		</div>
	)
}

export default NotFound
