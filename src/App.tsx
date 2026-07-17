"use client"

import "@/lib/i18n"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/components/AuthProvider"
import { PrivateRoute } from "@/components/PrivateRoute"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import AdminPage from "./routes/AdminPage"
import Index from "./routes/Index"
import IpRestricted from "./routes/IpRestricted"
import Login from "./routes/Login"
import { MyPage } from "./routes/MyPage"
import NotFound from "./routes/NotFound"
import Projects from "./routes/Projects"
import QueryReportPreview from "./routes/QueryReportPreview"
import Releases from "./routes/Releases"
import ResearchContext from "./routes/ResearchContext"
import ScenarioSelection from "./routes/ScenarioSelection"
import SearchResults from "./routes/SearchResults"
import TechnologyTree from "./routes/TechnologyTree"
import V1Chat from "./routes/V1Chat"
import V1EntryPage from "./routes/V1EntryPage"
import V1Prioritization from "./routes/V1Prioritization"
import V1ProblemFlow from "./routes/V1ProblemFlow"
import V1TreeMap from "./routes/V1TreeMap"

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
		},
	},
})

function LanguageSync() {
	const { i18n } = useTranslation()
	useEffect(() => {
		document.documentElement.lang = i18n.language
	}, [i18n.language])
	return null
}

const App = () => {
	return (
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<LanguageSync />
					<Toaster position="bottom-center" />
					<BrowserRouter
						future={{
							v7_relativeSplatPath: true,
							v7_startTransition: true,
						}}
					>
						<AuthProvider>
							<Routes>
								<Route path="/login" element={<Login />} />
								<Route path="/ip-restricted" element={<IpRestricted />} />
								<Route
									path="/"
									element={
										<PrivateRoute>
											<Index />
										</PrivateRoute>
									}
								/>
								<Route
									path="/search-results"
									element={
										<PrivateRoute>
											<SearchResults />
										</PrivateRoute>
									}
								/>
								<Route
									path="/research-context"
									element={
										<PrivateRoute>
											<ResearchContext />
										</PrivateRoute>
									}
								/>
								<Route path="/technology-tree" element={<TechnologyTree />} />
								<Route path="/scenario-table" element={<ScenarioSelection />} />
								<Route
									path="/scenario-selection"
									element={<ScenarioSelection />}
								/>
								<Route
									path="/scenario-selection"
									element={
										<PrivateRoute>
											<ScenarioSelection />
										</PrivateRoute>
									}
								/>
								<Route
									path="/my-page"
									element={
										<PrivateRoute>
											<MyPage />
										</PrivateRoute>
									}
								/>
								<Route
									path="/releases"
									element={
										<PrivateRoute>
											<Releases />
										</PrivateRoute>
									}
								/>
								<Route
									path="/projects"
									element={
										<PrivateRoute>
											<Projects />
										</PrivateRoute>
									}
								/>
								<Route
									path="/admin"
									element={
										<PrivateRoute>
											<AdminPage />
										</PrivateRoute>
									}
								/>
								<Route
									path="/query-report"
									element={
										<PrivateRoute>
											<QueryReportPreview />
										</PrivateRoute>
									}
								/>
								{/* V1 Flow exploration routes */}
								<Route path="/v1" element={<V1EntryPage />} />
								<Route
									path="/v1/prioritization"
									element={<V1Prioritization />}
								/>
								<Route path="/v1/chat" element={<V1Chat />} />
								<Route path="/v1/problem" element={<V1ProblemFlow />} />
								<Route path="/v1/treemap" element={<V1TreeMap />} />
								{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
								<Route path="*" element={<NotFound />} />
							</Routes>
						</AuthProvider>
					</BrowserRouter>
				</TooltipProvider>
			</QueryClientProvider>
		</StrictMode>
	)
}

export default App
