import { render, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

// Configurable language — changed per test without module reloading
const mockLang = { value: "ja" }

jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: {
			get language() {
				return mockLang.value
			},
			changeLanguage: jest.fn(),
		},
	}),
}))

jest.mock("@/hooks/useEnrichedData", () => ({
	useEnrichedData: () => ({
		papers: [],
		patents: [],
		useCases: [],
		loadingPapers: false,
		loadingPatents: false,
		loadingUseCases: false,
	}),
	enrichmentEventBus: { subscribe: jest.fn(() => jest.fn()) },
}))

jest.mock("@/hooks/useUserDetail", () => ({
	useUserDetail: () => ({ userDetails: null }),
}))

jest.mock("@/hooks/use-toast", () => ({
	useToast: () => ({ toast: jest.fn() }),
}))

jest.mock("@/stores/savedStore", () => ({
	savedItemStore: (
		selector: (s: {
			toggle_paper: jest.Mock
			toggle_usecase: jest.Mock
		}) => unknown,
	) => selector({ toggle_paper: jest.fn(), toggle_usecase: jest.fn() }),
}))

jest.mock("@/services/enrichmentQueue", () => ({
	getEnrichmentElapsedTime: jest.fn(() => 0),
}))

jest.mock("react-csv", () => ({
	CSVLink: ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	),
}))

jest.mock("@/components/technology-tree/components/SummarySection", () => ({
	SummarySection: () => null,
}))

jest.mock("@/components/technology-tree/components/SelectedNodeInfo", () => ({
	SelectedNodeInfo: () => null,
}))

jest.mock("@/components/technology-tree/FilterSort", () => ({
	FilterSort: () => null,
}))

jest.mock("@/components/technology-tree/PaperList", () => ({
	PaperList: () => null,
}))

jest.mock("@/components/technology-tree/ImplementationList", () => ({
	ImplementationList: () => null,
}))

jest.mock("@/components/technology-tree/PatentCard", () => ({
	PatentCard: () => null,
}))

import { TabContent } from "@/components/technology-tree/components/TabContent"

const BASE_PROPS = {
	activeTab: "papers" as const,
	saved_paper_ids: [] as string[],
	saved_case_ids: [] as string[],
}

afterEach(() => {
	// Clean up any rendered elements between tests
	document.body.innerHTML = ""
	document
		.querySelectorAll(
			'script[src*="translate.google.com/translate_a/element.js"]',
		)
		.forEach((script) => script.remove())
	delete (window as typeof window & { google?: unknown }).google
	delete (window as typeof window & { googleTranslateElementInit?: unknown })
		.googleTranslateElementInit
	jest.clearAllMocks()
})

describe("TabContent — Google Translate div visibility", () => {
	it("renders google_translate_element div in Japanese mode", () => {
		mockLang.value = "ja"
		render(<TabContent {...BASE_PROPS} />)

		expect(
			document.getElementById("google_translate_element"),
		).toBeInTheDocument()
	})

	it("renders google_translate_element div in English mode", () => {
		mockLang.value = "en"
		render(<TabContent {...BASE_PROPS} />)

		expect(
			document.getElementById("google_translate_element"),
		).toBeInTheDocument()
	})

	it("GT div present in both language modes", () => {
		mockLang.value = "ja"
		render(<TabContent {...BASE_PROPS} />)
		expect(
			document.getElementById("google_translate_element"),
		).toBeInTheDocument()

		document.body.innerHTML = ""

		mockLang.value = "en"
		render(<TabContent {...BASE_PROPS} />)
		expect(
			document.getElementById("google_translate_element"),
		).toBeInTheDocument()
	})

	it("initializes Google Translate without InlineLayout when the API omits it", async () => {
		mockLang.value = "ja"
		const TranslateElement = jest.fn()
		;(window as typeof window & { google?: unknown }).google = {
			translate: {
				TranslateElement,
			},
		}

		render(<TabContent {...BASE_PROPS} />)

		await waitFor(() =>
			expect(TranslateElement).toHaveBeenCalledWith(
				{
					pageLanguage: "en",
					includedLanguages: "ja,en",
					autoDisplay: false,
				},
				"google_translate_element",
			),
		)
	})

	it("initializes Google Translate with horizontal layout when InlineLayout is available", async () => {
		mockLang.value = "ja"
		const TranslateElement = jest.fn() as jest.Mock & {
			InlineLayout?: { HORIZONTAL: string }
		}
		TranslateElement.InlineLayout = { HORIZONTAL: "horizontal" }
		;(window as typeof window & { google?: unknown }).google = {
			translate: {
				TranslateElement,
			},
		}

		render(<TabContent {...BASE_PROPS} />)

		await waitFor(() =>
			expect(TranslateElement).toHaveBeenCalledWith(
				{
					pageLanguage: "en",
					includedLanguages: "ja,en",
					autoDisplay: false,
					layout: "horizontal",
				},
				"google_translate_element",
			),
		)
	})
})
