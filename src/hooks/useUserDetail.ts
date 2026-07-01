import { useEffect, useState } from "react"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/integrations/supabase/client"
import type { UserDetails } from "@/types/infrastructure"

interface UseUserDetailReturn {
	userDetails: UserDetails | null
	loading: boolean
	error: string | null
}

export function useUserDetail(): UseUserDetailReturn {
	const { user } = useAuth()
	const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchUserDetails = async () => {
			if (!user?.id) {
				setUserDetails(null)
				return
			}

			setLoading(true)
			setError(null)

			try {
				const { data, error: fetchError } = await supabase
					.from("v_user_details")
					.select("*")
					.eq("user_id", user.id)
					.single()

				if (fetchError) {
					console.error("Error fetching user details:", fetchError)
					setError(fetchError.message)
					return
				}

				setUserDetails(data)
			} catch (err) {
				console.error("Unexpected error fetching user details:", err)
				setError("ユーザー詳細の取得に失敗しました")
			} finally {
				setLoading(false)
			}
		}

		fetchUserDetails()
	}, [user?.id])

	return {
		userDetails,
		loading,
		error,
	}
}

// ユーザー表示名を取得するヘルパー関数
export function getUserDisplayName(
	userDetails: UserDetails | null,
	userEmail?: string,
): string {
	if (userDetails?.username) {
		return userDetails.username
	}

	return userEmail || "ユーザー"
}
