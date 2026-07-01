import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
	type NewTeam,
	type NewUser,
	useUserManagement,
} from "@/hooks/useUserManagement"
import { ApiError, apiClient } from "@/lib/apiClient"
import {
	downloadMultipleUsersCSV,
	downloadUserCSV,
	type UserCSVData,
} from "@/utils/csvDownload"
import { IP_ALLOWLIST_CHANGED_EVENT } from "./ipAllowlistShared"
import { TeamManagementSection } from "./TeamManagementSection"
import { UserTableSection } from "./UserTableSection"

interface UserManagementTabProps {
	className?: string
	/**
	 * Forwarded from AdminPage. The IP allowlist panel lives at the page-level
	 * layout (so it can push the entire admin content left), not inside this
	 * tab's box. We only need to expose the "open" action to UserTableSection
	 * (per-user) and TeamManagementSection (team-bulk).
	 */
	onOpenIpAllowlist?: (target: { userId: string; label: string }) => void
	onOpenIpAllowlistForTeam?: (target: {
		teamId: string
		teamName: string
		members: { userId: string; label: string }[]
	}) => void
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({
	className,
	onOpenIpAllowlist,
	onOpenIpAllowlistForTeam,
}) => {
	const { t } = useTranslation()
	const {
		users,
		teams,
		loading,
		loadData,
		createUser,
		createTeam,
		deleteUser,
		deleteTeam,
		toggleTeamPrivacy,
		resetPassword,
		generatePassword,
		copyPasswordToClipboard,
	} = useUserManagement()

	const [itemsPerPage, setItemsPerPage] = useState(5)
	const [isCreatingUser, setIsCreatingUser] = useState(false)
	const [isCreatingMultipleUsers, setIsCreatingMultipleUsers] = useState(false)

	// Per-user IP allowlist entry counts, keyed by userId. One aggregate fetch
	// powers the IP-restriction column badges across the whole table. Refreshed
	// after any panel-driven mutation. Users with zero entries are absent from
	// the map.
	const [ipAllowlistCounts, setIpAllowlistCounts] = useState<
		Record<string, number>
	>({})

	const loadIpAllowlistCounts = useCallback(async () => {
		try {
			const data = await apiClient.get<{ counts: Record<string, number> }>(
				"/ip-allowlist/summary",
			)
			setIpAllowlistCounts(data.counts ?? {})
		} catch (err) {
			// 403 FORBIDDEN here is expected for non-admin viewers — keep the badges
			// empty without surfacing an error. AuthProvider already routes
			// IP_RESTRICTED-class 403s to the block screen.
			if (err instanceof ApiError && err.status === 403) {
				setIpAllowlistCounts({})
				return
			}
			console.warn("[UserManagementTab] ip-allowlist summary failed:", err)
			setIpAllowlistCounts({})
		}
	}, [])

	useEffect(() => {
		loadData()
		loadIpAllowlistCounts()
	}, [loadData, loadIpAllowlistCounts])

	// Refresh count badges when the page-level panel mutates entries. Using a
	// CustomEvent (rather than a prop-drilled callback) keeps AdminPage free of
	// the count-fetch concern. Declared after `loadIpAllowlistCounts` so the
	// dependency reference is in scope.
	useEffect(() => {
		const handler = () => {
			loadIpAllowlistCounts()
		}
		window.addEventListener(IP_ALLOWLIST_CHANGED_EVENT, handler)
		return () => {
			window.removeEventListener(IP_ALLOWLIST_CHANGED_EVENT, handler)
		}
	}, [loadIpAllowlistCounts])

	const handleCreateUser = async (user: NewUser): Promise<boolean> => {
		setIsCreatingUser(true)
		try {
			const userToCreate = { ...user, role: "member" as const }
			const success = await createUser(userToCreate)
			if (success) {
				const selectedTeam = teams.find((team) => team.id === user.teamId)
				const teamName = selectedTeam ? selectedTeam.name : "Unknown"

				downloadUserCSV({
					username: user.username,
					email: user.email,
					password: user.password,
					teamName: teamName,
					createdAt: new Date().toLocaleString("ja-JP"),
				})
			}
			return success
		} finally {
			setIsCreatingUser(false)
		}
	}

	const handleCreateMultipleUsers = async (multipleUsersData: {
		teamId: string
		users: Array<{ username: string; email: string; password: string }>
	}) => {
		if (multipleUsersData.users.length === 0) return

		setIsCreatingMultipleUsers(true)
		try {
			const selectedTeam = teams.find(
				(team) => team.id === multipleUsersData.teamId,
			)
			const teamName = selectedTeam ? selectedTeam.name : "Unknown"
			const createdAt = new Date().toLocaleString("ja-JP")

			const csvData: UserCSVData[] = []
			let successCount = 0

			for (const user of multipleUsersData.users) {
				const userToCreate = {
					username: user.username,
					email: user.email,
					teamId: multipleUsersData.teamId,
					role: "member" as const,
					password: user.password,
				}

				const success = await createUser(userToCreate)
				if (success) {
					successCount++
					csvData.push({
						username: user.username,
						email: user.email,
						password: user.password,
						teamName,
						createdAt,
					})
				}
			}

			if (csvData.length > 0) {
				downloadMultipleUsersCSV(csvData)
			}

			if (successCount > 0) {
				// console.log(`${successCount}人のユーザーが正常に作成されました`)
			}
		} finally {
			setIsCreatingMultipleUsers(false)
		}
	}

	const handleCreateTeam = async (team: NewTeam): Promise<boolean> => {
		return await createTeam(team)
	}

	const handleDeleteUser = async (userId: string, username: string) => {
		await deleteUser(userId, username)
	}

	const handleDeleteTeam = async (teamId: string, teamName: string) => {
		await deleteTeam(teamId, teamName)
	}

	const handleResetPassword = async (userId: string, username: string) => {
		await resetPassword(userId, username)
	}

	const handleTeamPrivacyToggle = async (
		teamId: string,
		teamName: string,
		team_is_private: boolean,
	) => {
		// console.log("Privacy updated")
		await toggleTeamPrivacy(teamId, teamName, team_is_private)
	}

	if (loading) {
		return (
			<div className={`space-y-6 ${className}`}>
				<div className="flex items-center justify-center h-32">
					<p>{t("admin.userManagement.loadingData")}</p>
				</div>
			</div>
		)
	}

	return (
		<div className={`space-y-6 ${className ?? ""}`}>
			<UserTableSection
				users={users}
				teams={teams}
				onDeleteUser={handleDeleteUser}
				onResetPassword={handleResetPassword}
				onCreateUser={handleCreateUser}
				onCreateMultipleUsers={handleCreateMultipleUsers}
				generatePassword={generatePassword}
				copyPasswordToClipboard={copyPasswordToClipboard}
				itemsPerPage={itemsPerPage}
				onItemsPerPageChange={setItemsPerPage}
				isCreatingUser={isCreatingUser}
				isCreatingMultipleUsers={isCreatingMultipleUsers}
				ipAllowlistCounts={ipAllowlistCounts}
				onOpenIpAllowlist={onOpenIpAllowlist}
			/>

			<TeamManagementSection
				teams={teams}
				onCreateTeam={handleCreateTeam}
				onDeleteTeam={handleDeleteTeam}
				onToggleTeamPrivacy={handleTeamPrivacyToggle}
				onOpenIpAllowlist={
					onOpenIpAllowlistForTeam
						? ({ teamId, teamName }) => {
								// Derive members from the already-loaded `users` list so the
								// panel can open without a second roster fetch.
								const members = users
									.filter((u) => u.team_id === teamId)
									.map((u) => ({
										userId: u.user_id,
										label: `${u.username} (${u.email})`,
									}))
								onOpenIpAllowlistForTeam({ teamId, teamName, members })
							}
						: undefined
				}
				itemsPerPage={itemsPerPage}
			/>
		</div>
	)
}
