import {
	ChevronDown,
	ChevronUp,
	Copy,
	Key,
	Loader2,
	MoreHorizontal,
	Plus,
	RefreshCw,
	Search,
	Shield,
	Trash2,
	Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { NewUser, Team, User } from "@/hooks/useUserManagement"
import { generateEmailFromUsername, validateEmail } from "@/utils/csvDownload"

interface UserTableSectionProps {
	users: User[]
	teams: Team[]
	onDeleteUser: (userId: string, username: string) => Promise<void>
	onResetPassword: (userId: string, username: string) => Promise<void>
	onCreateUser: (user: NewUser) => Promise<boolean>
	onCreateMultipleUsers: (usersData: {
		teamId: string
		users: Array<{ username: string; email: string; password: string }>
	}) => Promise<void>
	generatePassword: () => string
	copyPasswordToClipboard: (password: string) => void
	itemsPerPage: number
	onItemsPerPageChange: (itemsPerPage: number) => void
	isCreatingUser: boolean
	isCreatingMultipleUsers: boolean
	/** IP allowlist entry counts per user_id (absent = 0 entries / no restriction). */
	ipAllowlistCounts?: Record<string, number>
	/**
	 * Invoked when an admin opens the IP allowlist for a row. The parent decides
	 * whether and where to render the side panel.
	 */
	onOpenIpAllowlist?: (target: { userId: string; label: string }) => void
	className?: string
}

export const UserTableSection: React.FC<UserTableSectionProps> = ({
	users,
	teams,
	onDeleteUser,
	onResetPassword,
	onCreateUser,
	onCreateMultipleUsers,
	generatePassword,
	copyPasswordToClipboard,
	itemsPerPage,
	onItemsPerPageChange,
	isCreatingUser,
	isCreatingMultipleUsers,
	ipAllowlistCounts,
	onOpenIpAllowlist,
	className,
}) => {
	const { t } = useTranslation()
	const [userSearch, setUserSearch] = useState("")
	const [userSortField, setUserSortField] = useState<keyof User>("created_at")
	const [userSortDirection, setUserSortDirection] = useState<"asc" | "desc">(
		"desc",
	)
	const [userPage, setUserPage] = useState(1)
	const [userSectionOpen, setUserSectionOpen] = useState(true)

	// Dialog states
	const [createUserOpen, setCreateUserOpen] = useState(false)
	const [createMultipleUsersOpen, setCreateMultipleUsersOpen] = useState(false)
	const [newUser, setNewUser] = useState<NewUser>({
		username: "",
		email: "",
		teamId: "",
		role: "member",
		password: "",
	})
	const [emailError, setEmailError] = useState<string>("")
	const [multipleUsersData, setMultipleUsersData] = useState({
		teamId: "",
		users: [] as Array<{ username: string; email: string; password: string }>,
	})
	const [multipleUsersEmailErrors, setMultipleUsersEmailErrors] = useState<{
		[key: number]: string
	}>({})
	const [currentUsername, setCurrentUsername] = useState("")

	const filteredAndSortedUsers = useMemo(() => {
		const filtered = users.filter(
			(user) =>
				user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
				user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
				user.team_name.toLowerCase().includes(userSearch.toLowerCase()),
		)

		return filtered.sort((a, b) => {
			const aValue = a[userSortField]
			const bValue = b[userSortField]

			if (aValue < bValue) return userSortDirection === "asc" ? -1 : 1
			if (aValue > bValue) return userSortDirection === "asc" ? 1 : -1
			return 0
		})
	}, [users, userSearch, userSortField, userSortDirection])

	const paginatedUsers = useMemo(() => {
		const startIndex = (userPage - 1) * itemsPerPage
		return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage)
	}, [filteredAndSortedUsers, userPage, itemsPerPage])

	const totalUserPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)

	// Dialog handlers
	const handleCreateUserDialogOpen = (open: boolean) => {
		setCreateUserOpen(open)
		if (open) {
			const password = generatePassword()
			setNewUser({
				username: "",
				email: "",
				teamId: "",
				role: "member",
				password,
			})
		} else {
			setNewUser({
				username: "",
				email: "",
				teamId: "",
				role: "member",
				password: "",
			})
			setEmailError("")
		}
	}

	const handleUsernameChange = (username: string) => {
		const email = username.trim() ? generateEmailFromUsername(username) : ""
		setNewUser({
			...newUser,
			username,
			email,
		})
		// Clear email error when username changes (auto-generated email is always valid)
		if (username.trim()) {
			setEmailError("")
		}
	}

	const handleCreateUser = async () => {
		// Validate email before creating user
		const emailValidation = validateEmail(newUser.email)
		if (!emailValidation.isValid) {
			setEmailError(emailValidation.error || "")
			return
		}

		const success = await onCreateUser(newUser)
		if (success) {
			setNewUser({
				username: "",
				email: "",
				teamId: "",
				role: "member",
				password: "",
			})
			setEmailError("")
			setCreateUserOpen(false)
		}
	}

	const handleCreateMultipleUsersDialogOpen = (open: boolean) => {
		setCreateMultipleUsersOpen(open)
		if (!open) {
			setMultipleUsersData({
				teamId: "",
				users: [],
			})
			setCurrentUsername("")
			setMultipleUsersEmailErrors({})
		}
	}

	const addUsername = (username: string) => {
		if (!username.trim() || !multipleUsersData.teamId) return

		const isExisting = multipleUsersData.users.some(
			(user) => user.username === username.trim(),
		)
		if (isExisting) return

		const email = generateEmailFromUsername(username.trim())
		const newUserData = {
			username: username.trim(),
			email,
			password: generatePassword(),
		}

		setMultipleUsersData({
			...multipleUsersData,
			users: [...multipleUsersData.users, newUserData],
		})

		// Validate the auto-generated email
		const validation = validateEmail(email)
		if (!validation.isValid) {
			const newIndex = multipleUsersData.users.length
			setMultipleUsersEmailErrors({
				...multipleUsersEmailErrors,
				[newIndex]: validation.error || "",
			})
		}

		setCurrentUsername("")
	}

	const removeUser = (index: number) => {
		const updatedUsers = [...multipleUsersData.users]
		updatedUsers.splice(index, 1)
		setMultipleUsersData({
			...multipleUsersData,
			users: updatedUsers,
		})

		// Remove email error for this user and adjust indices
		const updatedErrors = { ...multipleUsersEmailErrors }
		delete updatedErrors[index]
		// Shift error indices down for remaining users
		const newErrors: { [key: number]: string } = {}
		Object.keys(updatedErrors).forEach((key) => {
			const keyIndex = parseInt(key)
			if (keyIndex > index) {
				newErrors[keyIndex - 1] = updatedErrors[keyIndex]
			} else if (keyIndex < index) {
				newErrors[keyIndex] = updatedErrors[keyIndex]
			}
		})
		setMultipleUsersEmailErrors(newErrors)
	}

	const handleUsernameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && currentUsername.trim()) {
			e.preventDefault()
			addUsername(currentUsername)
		}
	}

	const handleMultipleTeamChange = (teamId: string) => {
		setMultipleUsersData({
			...multipleUsersData,
			teamId,
			users: [],
		})
		setMultipleUsersEmailErrors({})
	}

	const updateUserEmail = (index: number, email: string) => {
		const updatedUsers = [...multipleUsersData.users]
		updatedUsers[index] = { ...updatedUsers[index], email }
		setMultipleUsersData({
			...multipleUsersData,
			users: updatedUsers,
		})

		// Validate email and update error state
		const validation = validateEmail(email)
		const updatedErrors = { ...multipleUsersEmailErrors }
		if (validation.isValid) {
			delete updatedErrors[index]
		} else {
			updatedErrors[index] = validation.error || ""
		}
		setMultipleUsersEmailErrors(updatedErrors)
	}

	const handleCreateMultipleUsers = async () => {
		if (multipleUsersData.users.length === 0) return

		// Validate all emails before creating users
		const hasEmailErrors = Object.keys(multipleUsersEmailErrors).length > 0
		if (hasEmailErrors) {
			return // Don't proceed if there are email validation errors
		}

		await onCreateMultipleUsers(multipleUsersData)

		setMultipleUsersData({
			teamId: "",
			users: [],
		})
		setCurrentUsername("")
		setMultipleUsersEmailErrors({})
		setCreateMultipleUsersOpen(false)
	}

	const handleUserSort = (field: keyof User) => {
		if (userSortField === field) {
			setUserSortDirection(userSortDirection === "asc" ? "desc" : "asc")
		} else {
			setUserSortField(field)
			setUserSortDirection("asc")
		}
		setUserPage(1)
	}

	const handleDeleteUser = async (userId: string, username: string) => {
		await onDeleteUser(userId, username)
	}

	const handleResetPassword = async (userId: string, username: string) => {
		await onResetPassword(userId, username)
	}

	return (
		<Collapsible open={userSectionOpen} onOpenChange={setUserSectionOpen}>
			<Card className={className}>
				<CollapsibleTrigger asChild>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer hover:bg-gray-50 transition-colors">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								{t("admin.userManagement.title")}
								<ChevronDown
									className={`h-4 w-4 transition-transform duration-200 ${userSectionOpen ? "rotate-180" : ""}`}
								/>
							</CardTitle>
							<CardDescription>
								{t("admin.userManagement.description")}
							</CardDescription>
						</div>
						<div onClick={(e) => e.stopPropagation()} className="flex gap-2">
							<Dialog
								open={createUserOpen}
								onOpenChange={handleCreateUserDialogOpen}
							>
								<DialogTrigger asChild>
									<Button>
										<Plus className="h-4 w-4 mr-2" />
										{t("admin.userManagement.createUser")}
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[500px]">
									<DialogHeader>
										<DialogTitle>
											{t("admin.userManagement.createNewUser")}
										</DialogTitle>
										<DialogDescription>
											{t("admin.userManagement.createUserDescription")}
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-6 py-4">
										<div className="space-y-4">
											<h4 className="text-sm font-medium text-gray-900">
												{t("admin.userManagement.basicInfo")}
											</h4>
											<div className="space-y-3">
												<div>
													<Label
														htmlFor="username"
														className="text-sm font-medium"
													>
														{t("admin.userManagement.username")}{" "}
														<span className="text-red-500">*</span>
													</Label>
													<Input
														id="username"
														value={newUser.username}
														onChange={(e) =>
															handleUsernameChange(e.target.value)
														}
														placeholder={t(
															"admin.userManagement.enterUsername",
														)}
														className="mt-1"
													/>
												</div>
												<div>
													<Label
														htmlFor="email"
														className="text-sm font-medium"
													>
														{t("admin.userManagement.email")}{" "}
														<span className="text-red-500">*</span>
													</Label>
													<Input
														id="email"
														type="email"
														value={newUser.email}
														onChange={(e) => {
															const email = e.target.value
															setNewUser({ ...newUser, email })
															// Real-time email validation
															const validation = validateEmail(email)
															setEmailError(
																validation.isValid
																	? ""
																	: validation.error || "",
															)
														}}
														placeholder="example@memoryai.jp"
														className={`mt-1 ${emailError ? "border-red-500" : ""}`}
													/>
													{emailError ? (
														<p className="text-xs text-red-500 mt-1">
															{emailError}
														</p>
													) : (
														<p className="text-xs text-gray-500 mt-1">
															{t(
																"admin.userManagement.usernameEmailAutoGeneratedHint",
															)}
															{t("admin.userManagement.atMemoryaiJpDomain")}
														</p>
													)}
												</div>
											</div>
										</div>

										<div className="space-y-4">
											<h4 className="text-sm font-medium text-gray-900">
												{t("admin.userManagement.teamSettings")}
											</h4>
											<div className="grid grid-cols-2 gap-3">
												<div>
													<Label htmlFor="team" className="text-sm font-medium">
														{t("admin.common.team")}{" "}
														<span className="text-red-500">*</span>
													</Label>
													<Select
														value={newUser.teamId}
														onValueChange={(value) =>
															setNewUser({ ...newUser, teamId: value })
														}
													>
														<SelectTrigger className="mt-1">
															<SelectValue
																placeholder={t("admin.common.selectTeam")}
															/>
														</SelectTrigger>
														<SelectContent>
															{teams.map((team) => (
																<SelectItem key={team.id} value={team.id}>
																	{team.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div>
													<Label htmlFor="role" className="text-sm font-medium">
														{t("admin.userManagement.role")}
													</Label>
													<div className="mt-1">
														<div className="flex items-center p-3 border rounded-md bg-gray-50">
															<Badge variant="secondary" className="mr-2">
																{t("admin.common.member")}
															</Badge>
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className="space-y-4">
											<h4 className="text-sm font-medium text-gray-900">
												{t("admin.userManagement.passwordSettings")}
											</h4>
											<div className="space-y-3">
												<div>
													<Label
														htmlFor="password"
														className="text-sm font-medium"
													>
														{t("admin.userManagement.autoGeneratedPassword")}
													</Label>
													<div className="flex gap-2 mt-1">
														<Input
															id="password"
															type="text"
															value={newUser.password}
															readOnly
															className="flex-1 bg-gray-50 font-mono text-sm"
															placeholder={t(
																"admin.userManagement.passwordAutoGenerated",
															)}
														/>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => {
																const password = generatePassword()
																setNewUser({ ...newUser, password })
															}}
															className="px-3"
														>
															<RefreshCw className="h-4 w-4" />
														</Button>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() =>
																copyPasswordToClipboard(newUser.password)
															}
															disabled={!newUser.password}
															className="px-3"
														>
															<Copy className="h-4 w-4" />
														</Button>
													</div>
												</div>
												{newUser.password && (
													<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
														<div className="flex items-start gap-2">
															<div className="text-blue-600 mt-0.5">📄</div>
															<div className="text-sm text-blue-800">
																<p className="font-medium mb-1">
																	{t("admin.userManagement.csvAutoSave")}
																</p>
																<p>{t("admin.userManagement.csvSaveInfo")}</p>
															</div>
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
									<DialogFooter>
										<Button
											type="submit"
											onClick={handleCreateUser}
											disabled={isCreatingUser || !!emailError}
										>
											{isCreatingUser ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													{t("admin.common.creating")}
												</>
											) : (
												t("admin.userManagement.createUserAndSaveCsv")
											)}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>

							<Dialog
								open={createMultipleUsersOpen}
								onOpenChange={handleCreateMultipleUsersDialogOpen}
							>
								<DialogTrigger asChild>
									<Button variant="outline">
										<Users className="h-4 w-4 mr-2" />
										{t("admin.userManagement.createMultipleUsers")}
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
									<DialogHeader>
										<DialogTitle>
											{t("admin.userManagement.createMultipleTitle")}
										</DialogTitle>
										<DialogDescription>
											{t("admin.userManagement.createMultipleDescLine1")}
											{t("admin.userManagement.createMultipleDescLine2")}
										</DialogDescription>
									</DialogHeader>
									<div className="flex-1 overflow-hidden flex flex-col">
										<div className="flex-shrink-0 space-y-6 p-6 pb-4">
											<div className="space-y-4">
												<h4 className="text-sm font-medium text-gray-900">
													{t("admin.userManagement.teamSettings")}
												</h4>
												<div>
													<Label
														htmlFor="multiple-team"
														className="text-sm font-medium"
													>
														{t("admin.common.team")}{" "}
														<span className="text-red-500">*</span>
													</Label>
													<Select
														value={multipleUsersData.teamId}
														onValueChange={handleMultipleTeamChange}
													>
														<SelectTrigger className="mt-1">
															<SelectValue
																placeholder={t("admin.common.selectTeam")}
															/>
														</SelectTrigger>
														<SelectContent>
															{teams.map((team) => (
																<SelectItem key={team.id} value={team.id}>
																	{team.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
											</div>

											<div className="space-y-4">
												<h4 className="text-sm font-medium text-gray-900">
													{t("admin.userManagement.addUsername")}
												</h4>
												<div>
													<Label
														htmlFor="username-input"
														className="text-sm font-medium"
													>
														{t("admin.userManagement.username")}{" "}
														<span className="text-red-500">*</span>
													</Label>
													<div className="flex gap-2 mt-1">
														<Input
															id="username-input"
															value={currentUsername}
															onChange={(e) =>
																setCurrentUsername(e.target.value)
															}
															onKeyPress={handleUsernameKeyPress}
															placeholder={t(
																"admin.userManagement.enterUsernameEnterToAdd",
															)}
															className="flex-1"
															disabled={!multipleUsersData.teamId}
														/>
														<Button
															type="button"
															onClick={() => addUsername(currentUsername)}
															disabled={
																!currentUsername.trim() ||
																!multipleUsersData.teamId
															}
															variant="outline"
															size="sm"
														>
															<Plus className="h-4 w-4" />
														</Button>
													</div>
													<div className="text-xs text-gray-500 mt-2">
														<p>
															• •{" "}
															{t(
																"admin.userManagement.enterAndPressEnterOrPlus",
															)}
														</p>
														<p>
															•{" "}
															{t(
																"admin.userManagement.emailAutoGeneratedLine1",
															)}
														</p>
														<p>• {t("admin.userManagement.selectTeamFirst")}</p>
													</div>
												</div>
											</div>
										</div>

										{multipleUsersData.users.length > 0 && (
											<div className="flex-1 overflow-hidden flex flex-col px-6 pb-4">
												<div className="flex-shrink-0 mb-4">
													<h4 className="text-sm font-medium text-gray-900">
														{t("admin.userManagement.pendingUsers")} (
														{multipleUsersData.users.length}
														{t("admin.userManagement.peopleUnit")})
													</h4>
												</div>

												<div className="border rounded-lg bg-gray-50 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-4">
													<div className="space-y-3">
														{multipleUsersData.users.map((user, index) => {
															const isAutoGenerated =
																user.email.endsWith("@memoryai.jp") &&
																user.email ===
																	generateEmailFromUsername(user.username)
															return (
																<div
																	key={user.email}
																	className="bg-white border rounded-lg p-3 shadow-sm"
																>
																	<div className="flex items-start gap-3">
																		<div className="flex-1 space-y-2">
																			<div>
																				<Label className="text-xs text-gray-600">
																					{t("admin.userManagement.username")}
																				</Label>
																				<div className="font-medium text-sm">
																					{user.username}
																				</div>
																			</div>
																			<div>
																				<Label className="text-xs text-gray-600">
																					{t("admin.userManagement.email")}
																				</Label>
																				<div className="flex items-center gap-2">
																					<div className="flex-1">
																						<Input
																							type="email"
																							value={user.email}
																							onChange={(e) =>
																								updateUserEmail(
																									index,
																									e.target.value,
																								)
																							}
																							className={`text-sm h-8 ${multipleUsersEmailErrors[index] ? "border-red-500" : ""}`}
																							placeholder={t(
																								"admin.userManagement.enterEmail",
																							)}
																						/>
																						{multipleUsersEmailErrors[
																							index
																						] && (
																							<p className="text-xs text-red-500 mt-1">
																								{
																									multipleUsersEmailErrors[
																										index
																									]
																								}
																							</p>
																						)}
																					</div>
																					{isAutoGenerated ? (
																						<Badge
																							variant="secondary"
																							className="text-xs"
																						>
																							{t("admin.common.auto")}
																						</Badge>
																					) : (
																						<Badge
																							variant="outline"
																							className="text-xs"
																						>
																							{t("admin.common.custom")}
																						</Badge>
																					)}
																				</div>
																			</div>
																		</div>
																		<div className="flex flex-col items-end gap-2">
																			<Button
																				type="button"
																				variant="ghost"
																				size="sm"
																				onClick={() => removeUser(index)}
																				className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
																			>
																				<Trash2 className="h-3 w-3" />
																			</Button>
																			<div className="text-center">
																				<div className="text-xs text-gray-500 mb-1">
																					{t("admin.userManagement.password")}
																				</div>
																				<div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
																					{user.password}
																				</div>
																			</div>
																		</div>
																	</div>
																</div>
															)
														})}
													</div>
												</div>

												<div className="flex-shrink-0 bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
													<div className="flex items-start gap-2">
														<div className="text-blue-600 mt-0.5">📄</div>
														<div className="text-sm text-blue-800">
															<p className="font-medium mb-1">
																{t("admin.userManagement.csvAutoSave")}
															</p>
															<p>
																{t("admin.userManagement.csvSaveInfoMultiple")}
															</p>
														</div>
													</div>
												</div>
											</div>
										)}
									</div>
									<DialogFooter className="flex-shrink-0 border-t bg-white">
										<Button
											type="submit"
											onClick={handleCreateMultipleUsers}
											disabled={
												multipleUsersData.users.length === 0 ||
												isCreatingMultipleUsers ||
												Object.keys(multipleUsersEmailErrors).length > 0
											}
										>
											{isCreatingMultipleUsers ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													{t("admin.common.creating")}
												</>
											) : (
												t("admin.userManagement.createNUsersAndSaveCsv", {
													count: multipleUsersData.users.length,
												})
											)}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</CardHeader>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent>
						<div className="flex items-center gap-4 mb-4">
							<div className="relative flex-1 max-w-sm">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder={t("admin.userManagement.searchPlaceholder")}
									value={userSearch}
									onChange={(e) => {
										setUserSearch(e.target.value)
										setUserPage(1)
									}}
									className="pl-10"
								/>
							</div>
							<div className="flex items-center gap-2">
								<Label
									htmlFor="user-items-per-page"
									className="text-sm text-gray-600"
								>
									{t("admin.userManagement.itemsPerPage")}
								</Label>
								<Select
									value={itemsPerPage.toString()}
									onValueChange={(value) => {
										onItemsPerPageChange(parseInt(value))
										setUserPage(1)
									}}
								>
									<SelectTrigger id="user-items-per-page" className="w-20">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="5">5</SelectItem>
										<SelectItem value="10">10</SelectItem>
										<SelectItem value="20">20</SelectItem>
										<SelectItem value="50">50</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="text-sm text-gray-500">
								{t("admin.common.showingRange", {
									total: filteredAndSortedUsers.length,
									from: Math.min(
										(userPage - 1) * itemsPerPage + 1,
										filteredAndSortedUsers.length,
									),
									to: Math.min(
										userPage * itemsPerPage,
										filteredAndSortedUsers.length,
									),
								})}
							</div>
						</div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead
										className="cursor-pointer hover:bg-gray-50 select-none"
										onClick={() => handleUserSort("username")}
									>
										<div className="flex items-center gap-1">
											{t("admin.userManagement.usernameCol")}
											{userSortField === "username" &&
												(userSortDirection === "asc" ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												))}
										</div>
									</TableHead>
									<TableHead
										className="cursor-pointer hover:bg-gray-50 select-none"
										onClick={() => handleUserSort("email")}
									>
										<div className="flex items-center gap-1">
											{t("admin.userManagement.emailCol")}
											{userSortField === "email" &&
												(userSortDirection === "asc" ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												))}
										</div>
									</TableHead>
									<TableHead
										className="cursor-pointer hover:bg-gray-50 select-none"
										onClick={() => handleUserSort("team_name")}
									>
										<div className="flex items-center gap-1">
											{t("admin.userManagement.teamCol")}
											{userSortField === "team_name" &&
												(userSortDirection === "asc" ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												))}
										</div>
									</TableHead>
									<TableHead
										className="cursor-pointer hover:bg-gray-50 select-none"
										onClick={() => handleUserSort("role")}
									>
										<div className="flex items-center gap-1">
											{t("admin.userManagement.roleCol")}
											{userSortField === "role" &&
												(userSortDirection === "asc" ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												))}
										</div>
									</TableHead>
									<TableHead
										className="cursor-pointer hover:bg-gray-50 select-none"
										onClick={() => handleUserSort("created_at")}
									>
										<div className="flex items-center gap-1">
											{t("admin.common.createdAt")}
											{userSortField === "created_at" &&
												(userSortDirection === "asc" ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												))}
										</div>
									</TableHead>
									<TableHead>{t("admin.userManagement.ipColumn")}</TableHead>
									<TableHead>{t("admin.common.actions")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedUsers.map((user) => (
									<TableRow key={user.user_id}>
										<TableCell className="font-medium">
											{user.username}
										</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>
											<Badge variant="outline">{user.team_name}</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													user.role === "admin" ? "default" : "secondary"
												}
											>
												{user.role === "admin"
													? t("admin.common.admin")
													: t("admin.common.member")}
											</Badge>
										</TableCell>
										<TableCell>
											{new Date(user.created_at).toLocaleDateString("ja-JP")}
										</TableCell>
										<TableCell>
											{(() => {
												const count = ipAllowlistCounts?.[user.user_id] ?? 0
												return (
													<button
														type="button"
														onClick={() =>
															onOpenIpAllowlist?.({
																userId: user.user_id,
																label: `${user.username} (${user.email})`,
															})
														}
														className="inline-flex items-center rounded hover:bg-gray-100 px-2 py-1 -mx-2 -my-1 transition-colors cursor-pointer"
														title={t("admin.ipAllowlist.openPanel")}
													>
														{count === 0 ? (
															<span className="text-gray-400 text-sm">
																{t("admin.ipAllowlist.badgeNone")}
															</span>
														) : (
															<Badge variant="default">
																{count} {t("admin.ipAllowlist.countSuffix")}
															</Badge>
														)}
													</button>
												)
											})()}
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															onOpenIpAllowlist?.({
																userId: user.user_id,
																label: `${user.username} (${user.email})`,
															})
														}
														className="cursor-pointer"
													>
														<Shield className="h-4 w-4 mr-2" />
														{t("admin.ipAllowlist.manage")}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															handleResetPassword(user.user_id, user.username)
														}
														className="cursor-pointer"
													>
														<Key className="h-4 w-4 mr-2" />
														{t("admin.userManagement.resetPassword")}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															handleDeleteUser(user.user_id, user.username)
														}
														className="cursor-pointer text-red-600 focus:text-red-600"
													>
														<Trash2 className="h-4 w-4 mr-2" />
														{t("admin.userManagement.deleteUser")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						{totalUserPages > 1 && (
							<div className="flex items-center justify-between mt-4">
								<div className="text-sm text-gray-500">
									{t("admin.common.page")} {userPage} / {totalUserPages}
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setUserPage(Math.max(1, userPage - 1))}
										disabled={userPage === 1}
									>
										{t("admin.common.prev")}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setUserPage(Math.min(totalUserPages, userPage + 1))
										}
										disabled={userPage === totalUserPages}
									>
										{t("admin.common.next")}
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>
	)
}
