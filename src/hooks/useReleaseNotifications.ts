import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/AuthProvider"

export const useReleaseNotifications = () => {
	const { user } = useAuth()
	const [hasNewReleases, setHasNewReleases] = useState(true) // Default to true to show red dot
	const [loading, setLoading] = useState(false)

	const checkForNewReleases = useCallback(() => {
		try {
			setLoading(true)

			// Check if user has visited releases page today
			const today = new Date().toDateString()
			const lastVisited = localStorage.getItem(
				`releases-last-visited-${user?.id}`,
			)

			if (lastVisited === today) {
				setHasNewReleases(false)
			} else {
				setHasNewReleases(true)
			}
		} catch (error) {
			console.error("Error checking for new releases:", error)
			setHasNewReleases(true)
		} finally {
			setLoading(false)
		}
	}, [user?.id])

	useEffect(() => {
		if (!user) {
			setHasNewReleases(false)
			setLoading(false)
			return
		}

		// Check localStorage for viewed releases
		checkForNewReleases()
	}, [
		user, // Check localStorage for viewed releases
		checkForNewReleases,
	])

	const markReleasesAsViewed = () => {
		if (!user) return

		try {
			// Store the current date in localStorage
			const today = new Date().toDateString()
			localStorage.setItem(`releases-last-visited-${user.id}`, today)
			setHasNewReleases(false)
		} catch (error) {
			console.error("Error updating release views:", error)
		}
	}

	return {
		hasNewReleases,
		loading,
		markReleasesAsViewed,
		refreshNotifications: checkForNewReleases,
	}
}
