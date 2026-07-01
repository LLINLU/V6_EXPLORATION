export const LoadingIndicator = () => {
	return (
		<div className="flex justify-start">
			<div className="bg-gray-100 p-4 rounded-lg">
				<div className="flex items-center space-x-2">
					<div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
					<div
						className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
						style={{ animationDelay: "0.1s" }}
					></div>
					<div
						className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
						style={{ animationDelay: "0.2s" }}
					></div>
				</div>
			</div>
		</div>
	)
}
