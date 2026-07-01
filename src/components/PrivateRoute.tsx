import { Loader2 } from "lucide-react"
import { type ReactNode, useEffect } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "./AuthProvider"

interface PrivateRouteProps {
	children: ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
	const { user, loading } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		// ローディングが完了し、ユーザーが認証されていない場合はデフォルトルートにリダイレクト
		if (!loading && !user) {
			navigate("/login")
		}
	}, [user, loading, navigate])
	if (!user && loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		)
	}

	if (!user) {
		return <Navigate to="/login" replace />
	}

	return <>{children}</>
}
