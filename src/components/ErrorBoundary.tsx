import React from "react"

interface ErrorBoundaryState {
	hasError: boolean
	error?: Error
	errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
	children: React.ReactNode
	fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		console.error("[ErrorBoundary] Caught error:", error)
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Some codepaths may throw non-Error values (e.g. plain objects or strings).
		// Normalize the value so our logs and UI show useful information.
		const normalizedMessage =
			error && typeof (error as any).message === "string"
				? (error as any).message
				: typeof error === "string"
					? error
					: (() => {
							try {
								return JSON.stringify(error)
							} catch (_) {
								return String(error)
							}
						})()

		const normalizedStack = (error && (error as any).stack) || undefined

		console.error("[ErrorBoundary] Error details:", {
			error: normalizedMessage,
			stack: normalizedStack,
			componentStack: errorInfo?.componentStack,
		})

		this.setState({
			error: error instanceof Error ? error : new Error(normalizedMessage),
			errorInfo,
		})
	}

	resetError = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined })
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				const Fallback = this.props.fallback
				return (
					<Fallback error={this.state.error} resetError={this.resetError} />
				)
			}

			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-100">
					<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
						<h2 className="text-xl font-bold text-red-600 mb-4">
							Something went wrong
						</h2>
						<p className="text-gray-600 mb-4">
							An error occurred while rendering the application.
						</p>
						{this.state.error && (
							<details className="mb-4">
								<summary className="cursor-pointer text-sm font-medium text-gray-700">
									Error details
								</summary>
								<pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
									{this.state.error.message}
								</pre>
							</details>
						)}
						<button
							onClick={this.resetError}
							className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
						>
							Try again
						</button>
					</div>
				</div>
			)
		}

		return this.props.children
	}
}

export default ErrorBoundary
