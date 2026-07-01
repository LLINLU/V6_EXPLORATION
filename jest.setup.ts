import "@testing-library/jest-dom"

// Mock Next.js router
jest.mock("next/navigation", () => ({
	useRouter() {
		return {
			push: jest.fn(),
			replace: jest.fn(),
			prefetch: jest.fn(),
			back: jest.fn(),
			pathname: "/",
			query: {},
			asPath: "/",
		}
	},
	usePathname() {
		return "/"
	},
	useSearchParams() {
		return new URLSearchParams()
	},
}))

// Mock environment variables
// Set BEFORE any module under test is imported. apiClient.ts (and any other
// module that validates env at load time) reads these during module init,
// before test code runs.
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key"
process.env.NEXT_PUBLIC_API_BASE_URL = "https://test.example.com"
