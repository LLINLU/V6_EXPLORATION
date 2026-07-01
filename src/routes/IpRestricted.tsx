import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"

/**
 * Public block screen shown when the authenticated user attempts to access
 * the app from an IP that is not in their allowlist. The user has already
 * been signed out by the time this page is rendered (see AuthProvider).
 */
const IpRestricted = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const handleSignInAgain = async () => {
		// Defensive: ensure no stale Supabase session lingers when the user
		// retries from a different network.
		await supabase.auth.signOut().catch(() => {
			/* ignore — already signed out */
		})
		navigate("/login")
	}

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
			<div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					{t("ipRestricted.title")}
				</h1>
				<p className="text-sm text-gray-700 mb-2">{t("ipRestricted.body")}</p>
				<p className="text-sm text-gray-600 mb-6">{t("ipRestricted.hint")}</p>
				<button
					type="button"
					onClick={handleSignInAgain}
					className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm"
				>
					{t("ipRestricted.backToLogin")}
				</button>
			</div>
		</div>
	)
}

export default IpRestricted
