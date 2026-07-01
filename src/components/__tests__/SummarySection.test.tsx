import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

// Mock react-markdown before importing SummarySection
// (react-markdown is ESM-only; this mock provides RTL-testable output)
jest.mock(
	"react-markdown",
	() =>
		function MockReactMarkdown({ children }: { children: string }) {
			// Render a minimal HTML representation so tests can assert on rendered elements
			const html = (children ?? "")
				.replace(/^### (.+)$/gm, "<h3>$1</h3>")
				.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
				.replace(/^- (.+)$/gm, "<li>$1</li>")
			// biome-ignore lint/security/noDangerouslySetInnerHtml: test mock only
			return <div dangerouslySetInnerHTML={{ __html: html }} />
		},
)

import { SummarySection } from "@/components/technology-tree/components/SummarySection"

// Mock Supabase — paper fetch returns markdown; usecase/patent fetches return null by default
const mockMaybySingle = jest.fn()
const mockPatentCount = jest.fn()
jest.mock("@/integrations/supabase/client", () => ({
	supabase: {
		from: jest.fn((table: string) => ({
			select: jest.fn((_columns?: string, options?: { head?: boolean }) => ({
				eq: jest.fn(() => {
					if (table === "node_patents" && options?.head) {
						return mockPatentCount()
					}

					return { maybeSingle: mockMaybySingle }
				}),
			})),
		})),
	},
}))

jest.mock("@/hooks/useEnrichedData", () => ({
	enrichmentEventBus: { subscribe: jest.fn(() => jest.fn()) },
}))

const mockLang = { value: "en" }
jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, unknown>) => {
			if (key === "summary_section.papers_title")
				return `Papers (${opts?.count ?? 0})`
			if (key === "summary_section.cases_title")
				return `Cases (${opts?.count ?? 0})`
			return key
		},
		i18n: {
			get language() {
				return mockLang.value
			},
		},
	}),
}))

const MARKDOWN_SUMMARY =
	"### Research Overview\n\nThis study covers **quantum algorithms** with key findings:\n\n- Finding one\n- Finding two"
const JAPANESE_SUMMARY =
	"### 研究概要\n\n量子アルゴリズムについての研究です。\n\n- 発見一"

function setupMocks(
	paperSummary: string | null,
	usecaseSummary: string | null = null,
) {
	mockMaybySingle
		.mockReset()
		.mockResolvedValueOnce(
			paperSummary
				? {
						data: { summary: paperSummary, papers_count: 5, query: "test" },
						error: null,
					}
				: { data: null, error: null },
		)
		.mockResolvedValueOnce(
			usecaseSummary
				? {
						data: { summary: usecaseSummary, usecases_count: 3, query: "test" },
						error: null,
					}
				: { data: null, error: null },
		)
		.mockResolvedValueOnce({ data: null, error: null })

	mockPatentCount.mockReset().mockResolvedValue({ count: 0, error: null })
}

describe("SummarySection — markdown rendering", () => {
	beforeEach(() => {
		mockLang.value = "en"
	})

	it("renders ### headings as <h3> elements, not as literal ### text", async () => {
		setupMocks(MARKDOWN_SUMMARY)
		render(<SummarySection selectedNodeId="n1" activeTab="papers" />)

		await waitFor(() => {
			expect(document.querySelector("h3")).toBeInTheDocument()
		})

		expect(document.querySelector("h3")?.textContent).toBe("Research Overview")
		// Literal "###" must NOT appear in the document
		expect(document.body.textContent).not.toMatch(/^###/)
	})

	it("renders **text** as <strong>, not as literal **text**", async () => {
		setupMocks(MARKDOWN_SUMMARY)
		render(<SummarySection selectedNodeId="n2" activeTab="papers" />)

		await waitFor(() => {
			expect(document.querySelector("strong")).toBeInTheDocument()
		})

		expect(document.querySelector("strong")?.textContent).toBe(
			"quantum algorithms",
		)
		expect(document.body.textContent).not.toMatch(/\*\*quantum algorithms\*\*/)
	})

	it("renders - list items as <li> elements", async () => {
		setupMocks(MARKDOWN_SUMMARY)
		render(<SummarySection selectedNodeId="n3" activeTab="papers" />)

		await waitFor(() => {
			const items = document.querySelectorAll("li")
			expect(items.length).toBeGreaterThan(0)
		})

		const items = document.querySelectorAll("li")
		expect(items[0].textContent).toBe("Finding one")
	})
})

describe("SummarySection — Japanese content filtering", () => {
	it("hides Japanese summary when UI language is English", async () => {
		mockLang.value = "en"
		setupMocks(JAPANESE_SUMMARY)
		const { container } = render(
			<SummarySection selectedNodeId="n4" activeTab="papers" />,
		)

		await waitFor(() => {
			expect(mockMaybySingle).toHaveBeenCalledTimes(3)
		})

		// In English mode with a Japanese summary, the component returns null
		expect(container.firstChild).toBeNull()
	})

	it("shows Japanese summary when UI language is Japanese", async () => {
		mockLang.value = "ja"
		setupMocks(JAPANESE_SUMMARY)
		render(<SummarySection selectedNodeId="n5" activeTab="papers" />)

		await waitFor(() => {
			expect(screen.getByText(/Papers/)).toBeInTheDocument()
		})
	})

	it("shows English summary in English mode", async () => {
		mockLang.value = "en"
		setupMocks(MARKDOWN_SUMMARY)
		render(<SummarySection selectedNodeId="n6" activeTab="papers" />)

		await waitFor(() => {
			expect(screen.getByText(/Papers/)).toBeInTheDocument()
		})
	})
})
