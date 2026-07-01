import { AlertTriangle, Globe, LogOut, UserRound } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/components/AuthProvider"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useSidebar } from "@/hooks/use-sidebar"
import { useLanguage } from "@/hooks/useLanguage"
import { useReleaseNotifications } from "@/hooks/useReleaseNotifications"
import { useUserDetail } from "@/hooks/useUserDetail"

export function SidebarFooter() {
	const { state } = useSidebar()
	const navigate = useNavigate()
	const location = useLocation()
	const { t } = useTranslation()
	const { language, setLanguage } = useLanguage()
	const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false)
	const [selectedLanguage, setSelectedLanguage] = useState<"ja" | "en">(
		language,
	)

	useEffect(() => {
		if (isLanguageDialogOpen) setSelectedLanguage(language)
	}, [isLanguageDialogOpen, language])

	const { signOut, isAdmin } = useAuth()
	const { userDetails } = useUserDetail()
	const { hasNewReleases } = useReleaseNotifications()
	const isExpanded = state === "expanded"

	const handleSignOut = async () => {
		await signOut()
	}

	const displayName = useMemo(() => {
		return userDetails?.username || t("sidebar.footer.user_default")
	}, [userDetails, t])

	return (
		<div className="border-t">
			<SidebarMenu>
				{isAdmin && (
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltip={t("sidebar.footer.admin")}
							onClick={() => navigate("/admin")}
						>
							{isExpanded && <span>{t("sidebar.footer.admin")}</span>}
						</SidebarMenuButton>
					</SidebarMenuItem>
				)}
				<SidebarMenuItem>
					<SidebarMenuButton
						tooltip={t("sidebar.footer.updates")}
						onClick={() => navigate("/releases")}
						className={location.pathname === "/releases" ? "bg-[#f3f4f6]" : ""}
					>
						<svg
							width="16"
							height="16"
							fill="currentColor"
							viewBox="0 0 256 256"
						>
							<path d="M223.85,47.12a16,16,0,0,0-15-15c-12.58-.75-44.73.4-71.41,27.07L132.69,64H74.36A15.91,15.91,0,0,0,63,68.68L28.7,103a16,16,0,0,0,9.07,27.16l38.47,5.37,44.21,44.21,5.37,38.49a15.94,15.94,0,0,0,10.78,12.92,16.11,16.11,0,0,0,5.1.83A15.91,15.91,0,0,0,153,227.3L187.32,193A15.91,15.91,0,0,0,192,181.64V123.31l4.77-4.77C223.45,91.86,224.6,59.71,223.85,47.12ZM74.36,80h42.33L77.16,119.52,40,114.34Zm74.41-9.45a76.65,76.65,0,0,1,59.11-22.47,76.46,76.46,0,0,1-22.42,59.16L128,164.68,91.32,128ZM176,181.64,141.67,216l-5.19-37.17L176,139.31Zm-74.16,9.5C97.34,201,82.29,224,40,224a8,8,0,0,1-8-8c0-42.29,23-57.34,32.86-61.85a8,8,0,0,1,6.64,14.56c-6.43,2.93-20.62,12.36-23.12,38.91,26.55-2.5,36-16.69,38.91-23.12a8,8,0,1,1,14.56,6.64Z" />
						</svg>
						{hasNewReleases && !isExpanded && (
							<Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
								Check
							</Badge>
						)}
						{isExpanded && (
							<div className="flex items-center gap-1">
								<span>{t("sidebar.footer.updates")}</span>
								{hasNewReleases && (
									<Badge variant="update" className="text-xs px-1 py-0">
										Check
									</Badge>
								)}
							</div>
						)}
					</SidebarMenuButton>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								tooltip={displayName}
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<Avatar className="size-4">
									<AvatarFallback className="size-4 p-0 text-xs">
										<UserRound className="size-4" />
									</AvatarFallback>
								</Avatar>
								{isExpanded && <span>{displayName}</span>}
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-56"
							align="end"
							alignOffset={-4}
							side="top"
						>
							<DropdownMenuLabel className="text-xs">
								{displayName}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => setIsLanguageDialogOpen(true)}>
								<Globe className="mr-2 h-4 w-4" />
								{t("sidebar.footer.language")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={handleSignOut}
								className="text-red-600"
							>
								<LogOut className="mr-2 h-4 w-4" />
								{t("sidebar.footer.logout")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>

			<AlertDialog
				open={isLanguageDialogOpen}
				onOpenChange={setIsLanguageDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader className="space-y-2">
						<div className="flex items-center justify-between gap-3">
							<AlertDialogTitle className="flex items-center gap-2">
								<AlertTriangle className="size-5 text-red-500 shrink-0" />
								{t("sidebar.footer.change_language.title", {
									lng: selectedLanguage,
								})}
							</AlertDialogTitle>
							<ToggleGroup
								type="single"
								size="sm"
								value={selectedLanguage}
								onValueChange={(value) => {
									if (value === "en" || value === "ja")
										setSelectedLanguage(value)
								}}
								className="h-7 gap-0 rounded-md bg-gray-100 p-0.5"
							>
								<ToggleGroupItem
									value="en"
									className="h-6 px-2 text-xs rounded-sm text-gray-400 data-[state=on]:bg-white data-[state=on]:text-black"
								>
									{t("sidebar.footer.change_language.option_en", {
										lng: selectedLanguage,
									})}
								</ToggleGroupItem>
								<ToggleGroupItem
									value="ja"
									className="h-6 px-2 text-xs rounded-sm text-gray-400 data-[state=on]:bg-white data-[state=on]:text-black"
								>
									{t("sidebar.footer.change_language.option_ja", {
										lng: selectedLanguage,
									})}
								</ToggleGroupItem>
							</ToggleGroup>
						</div>
						<AlertDialogDescription className="bg-red-50 text-red-700 rounded-md px-3 py-4">
							{t("sidebar.footer.change_language.description", {
								lng: selectedLanguage,
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("sidebar.footer.change_language.cancel", {
								lng: selectedLanguage,
							})}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setLanguage(language === "ja" ? "en" : "ja")
								setIsLanguageDialogOpen(false)
							}}
							className="bg-[#c83b3b] hover:bg-[#b03333]"
						>
							{t("sidebar.footer.change_language.confirm", {
								lng: selectedLanguage,
							})}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
