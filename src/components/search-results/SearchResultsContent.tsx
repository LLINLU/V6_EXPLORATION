import { ResultsHeader } from "./ResultsHeader"
import { ResultsTabs } from "./ResultsTabs"
import { SearchBar } from "./SearchBar"
import { SearchCriteria } from "./SearchCriteria"

export const SearchResultsContent = () => {
	return (
		<>
			<SearchBar />
			<SearchCriteria />
			<ResultsHeader />
			<ResultsTabs />
		</>
	)
}
