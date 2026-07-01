import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import MIcon from "@/assets/M_icon.svg"
import DemoImage from "@/assets/MemoryAI_demo.svg"
import PosterStory from "@/assets/poster_story.svg"
import { useAuth } from "@/components/AuthProvider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Shared with AuthProvider, which stashes the originating URL here on
// IP_RESTRICTED so we can restore it after the next successful login.
const REDIRECT_KEY = "memorylab:postLoginRedirect"

function isSafeRedirect(target: string): boolean {
	// Open-redirect guard: only same-origin paths. Reject protocol-relative
	// (`//...`) and external URLs, plus the two pages that would re-loop.
	if (!target.startsWith("/")) return false
	if (target.startsWith("//")) return false
	if (target === "/login" || target === "/ip-restricted") return false
	return true
}

function LoginContent() {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	})

	const { signIn } = useAuth()

	const persistedFrom =
		typeof window !== "undefined"
			? window.localStorage.getItem(REDIRECT_KEY)
			: null
	const redirectTarget =
		(persistedFrom && isSafeRedirect(persistedFrom) && persistedFrom) || "/"

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		})
		setError(null)
	}

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setError(null)

		try {
			await signIn(formData.email, formData.password)
			if (typeof window !== "undefined") {
				window.localStorage.removeItem(REDIRECT_KEY)
				window.location.href = redirectTarget
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : "Sign in failed")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex bg-background">
			{/* Left side - Login Form */}
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="w-full max-w-md space-y-8">
					{/* Logo and Header */}
					<div className="text-center space-y-6">
						<div className="flex justify-center">
							<img src={MIcon.src} alt="Memory AI" className="h-12 w-auto" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-foreground">Sign in</h1>
							<p className="text-muted-foreground mt-2">
								Welcome back to Memory AI
							</p>
						</div>
					</div>

					{/* Login Form */}
					<form onSubmit={handleSignIn} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="email" className="text-sm font-medium">
								Email
							</Label>
							<Input
								id="email"
								name="email"
								type="email"
								value={formData.email}
								onChange={handleInputChange}
								autoComplete="email"
								required
								disabled={isLoading}
								className="h-12"
								placeholder=""
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password" className="text-sm font-medium">
								Password
							</Label>
							<Input
								id="password"
								name="password"
								type="password"
								value={formData.password}
								onChange={handleInputChange}
								autoComplete="current-password"
								required
								disabled={isLoading}
								className="h-12"
								placeholder=""
							/>
						</div>

						{/* <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot your password?
              </button>
            </div> */}

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<Button
							type="submit"
							className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
							disabled={isLoading}
						>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Sign in
						</Button>

						{/* <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Create an account
              </button>
            </div> */}
					</form>
				</div>
			</div>

			{/* Right side - Demo Image */}
			<div
				className="hidden lg:block flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden"
				style={{
					backgroundImage: `url(${PosterStory.src})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}
			>
				<div className="absolute inset-0 flex items-center justify-end pr-0">
					<img
						src={DemoImage.src}
						alt="Memory AI Demo"
						className="h-3/5 w-auto object-contain"
					/>
				</div>
			</div>
		</div>
	)
}

export default function Login() {
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

	return <LoginContent />
}
