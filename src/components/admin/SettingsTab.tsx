import type React from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SettingsTabProps {
	hasAccess: boolean
	allowedTeamId: string
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
	hasAccess,
	allowedTeamId,
}) => {
	const { t } = useTranslation()
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>{t("admin.settings.systemTitle")}</CardTitle>
						<CardDescription>
							{t("admin.settings.systemDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>{t("admin.settings.allowedTeamId")}</Label>
							<Input value={allowedTeamId} disabled />
						</div>
						<div className="space-y-2">
							<Label>{t("admin.settings.adminCheck")}</Label>
							<Input value={t("admin.settings.useIsAppAdmin")} disabled />
						</div>
						<div className="space-y-2">
							<Label>{t("admin.settings.accessPermission")}</Label>
							<Badge variant={hasAccess ? "default" : "destructive"}>
								{hasAccess
									? t("admin.settings.hasAdminAccess")
									: t("admin.settings.noAdminAccess")}
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t("admin.settings.securityTitle")}</CardTitle>
						<CardDescription>
							{t("admin.settings.securityDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">
									{t("admin.settings.lastLogin")}
								</span>
								<span className="text-sm text-gray-600">
									{t("admin.settings.currentSession")}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">
									{t("admin.settings.authStatus")}
								</span>
								<Badge variant="default">
									{t("admin.settings.authenticated")}
								</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">
									{t("admin.settings.sessionExpiry")}
								</span>
								<span className="text-sm text-gray-600">
									{t("admin.settings.sessionExpiryValue")}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
