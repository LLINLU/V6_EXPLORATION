import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

// Simple component for testing
function TestComponent() {
	return <div>Hello, Test!</div>
}

describe("Example Test", () => {
	it("renders test component", () => {
		render(<TestComponent />)
		expect(screen.getByText("Hello, Test!")).toBeInTheDocument()
	})

	it("performs basic math", () => {
		expect(1 + 1).toBe(2)
	})
})
