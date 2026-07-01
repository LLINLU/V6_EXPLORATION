import { useEffect, useState } from "react"
import { PageLayout } from "@/components/search-results/PageLayout"
import { SearchResultsContent } from "@/components/search-results/SearchResultsContent"

const SearchResultsPageContent = () => {
	return (
		<PageLayout>
			<SearchResultsContent />
		</PageLayout>
	)
}

const SearchResults = () => {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	// Show loading during SSR
	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	return <SearchResultsPageContent />
}

export default SearchResults
