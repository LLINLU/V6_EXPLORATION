import { render, screen } from "@testing-library/react"
import { SearchCard } from "@/components/SearchCard"
import "@testing-library/jest-dom"

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: () => jest.fn(),
}))

// Mock react-i18next so t() returns English translations with interpolation
jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, unknown>) => {
			const translations: Record<string, string> = {
				"index.paper_and_case_count":
					"{{paperCount}} papers / {{implementationCount}} cases",
			}
			let str = translations[key] ?? key
			if (opts) {
				for (const [k, v] of Object.entries(opts)) {
					str = str.replace(`{{${k}}}`, String(v))
				}
			}
			return str
		},
		i18n: { language: "en", changeLanguage: jest.fn() },
	}),
}))

describe("SearchCard", () => {
	const mockProps = {
		title: "Test Technology",
		paperCount: 10,
		implementationCount: 5,
		tags: [
			{ label: "AI", variant: "blue" as const },
			{ label: "Research", variant: "default" as const },
		],
		timeAgo: "2 hours ago",
		treeId: "test-tree-id",
	}

	it("renders search card with title", () => {
		render(<SearchCard {...mockProps} />)
		expect(screen.getByText("Test Technology")).toBeInTheDocument()
	})

	it("displays paper and implementation counts", () => {
		render(<SearchCard {...mockProps} />)
		expect(screen.getByText(/10/)).toBeInTheDocument()
		expect(screen.getByText(/5/)).toBeInTheDocument()
		expect(screen.getByText(/papers/)).toBeInTheDocument()
		expect(screen.getByText(/cases/)).toBeInTheDocument()
	})

	it("renders all tags", () => {
		render(<SearchCard {...mockProps} />)
		expect(screen.getByText("AI")).toBeInTheDocument()
		expect(screen.getByText("Research")).toBeInTheDocument()
	})

	it("shows time ago information", () => {
		render(<SearchCard {...mockProps} />)
		expect(screen.getByText("2 hours ago")).toBeInTheDocument()
	})
})
