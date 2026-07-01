import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { IpAllowlistTeamMode } from "./IpAllowlistTeamMode"
import { IpAllowlistUserMode } from "./IpAllowlistUserMode"
import type { IpAllowlistTarget } from "./ipAllowlistShared"

// Type-only re-export. Runtime values (constants, helpers) must be imported
// from `ipAllowlistShared.ts` directly; re-exporting them through a component
// module breaks React Fast Refresh.
export type {
	IpAllowlistMember,
	IpAllowlistTarget,
} from "./ipAllowlistShared"

interface IpAllowlistPanelProps {
	target: IpAllowlistTarget
	onClose: () => void
}

/**
 * In-layout side panel shell for managing IP allowlist entries.
 *
 * Switches on `target.kind`:
 *   - "user": IpAllowlistUserMode (list + add + delete for one user)
 *   - "team": IpAllowlistTeamMode (member roster + aggregate + bulk add/delete)
 *
 * Both children dispatch `IP_ALLOWLIST_CHANGED_EVENT` on mutation so listeners
 * (UserManagementTab badges) refresh without a prop-drilled callback.
 */
export const IpAllowlistPanel = ({
	target,
	onClose,
}: IpAllowlistPanelProps) => {
	const { t } = useTranslation()

	const headerTitle =
		target.kind === "user"
			? t("admin.ipAllowlist.headerUser")
			: t("admin.ipAllowlist.headerTeam")

	const targetBadgeLabel =
		target.kind === "user"
			? t("admin.ipAllowlist.targetUser")
			: t("admin.ipAllowlist.targetTeam")

	const targetBadgeValue =
		target.kind === "user"
			? target.label
			: `${target.teamName} (${target.members.length} ${t("admin.ipAllowlist.peopleSuffix")})`

	const summary =
		target.kind === "user"
			? t("admin.ipAllowlist.summaryUser")
			: t("admin.ipAllowlist.summaryTeam")

	return (
		<aside className="w-full h-full bg-white flex flex-col">
			<header className="shrink-0 px-5 py-4 border-b space-y-3">
				<div className="flex items-start justify-between gap-2">
					<h2 className="text-lg font-semibold text-gray-900">{headerTitle}</h2>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 w-7 p-0 shrink-0"
						onClick={onClose}
						aria-label={t("admin.ipAllowlist.close")}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				<div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
					<p className="text-[11px] font-medium text-blue-700 uppercase tracking-wide">
						{targetBadgeLabel}
					</p>
					<p className="text-sm font-semibold text-gray-900 mt-0.5 break-all">
						{targetBadgeValue}
					</p>
				</div>

				<p className="text-xs text-gray-500 leading-relaxed">{summary}</p>
			</header>

			<div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
				{target.kind === "user" ? (
					<IpAllowlistUserMode userId={target.userId} />
				) : (
					<IpAllowlistTeamMode
						teamId={target.teamId}
						teamName={target.teamName}
						members={target.members}
					/>
				)}
			</div>
		</aside>
	)
}
