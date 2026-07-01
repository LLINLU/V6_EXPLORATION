import { AlertTriangle, ChevronDown, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/components/AuthProvider"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/apiClient"
import { ipInCidr } from "@/lib/ip"
import {
	type AllowlistEntry,
	type BulkSummary,
	canonicalCidr,
	type IpAllowlistMember,
	notifyAllowlistChanged,
	reportApiError,
} from "./ipAllowlistShared"

interface IpAllowlistTeamModeProps {
	/**
	 * The team being edited. The bulk endpoints operate on the `members`
	 * roster directly, so `teamId` is not referenced in requests; it stays
	 * on the props so a team-scoped allowlist (instead of per-member fan-out)
	 * can be plugged in without changing the signature.
	 */
	teamId: string
	teamName: string
	members: IpAllowlistMember[]
}

/**
 * Row of the team aggregate table: a CIDR with the members who have it
 * registered (plus each member's per-CIDR description).
 */
interface AggregateRow {
	cidr: string
	canonical: string
	owners: { userId: string; description: string | null }[]
}

type BulkAction = "add" | "delete"

interface PendingBulkAction {
	action: BulkAction
	cidr: string
	description: string | null
	/** True when the action came from the form (so we clear inputs after). */
	fromForm: boolean
}

interface BulkApiResult {
	results: { userId: string; outcome: string }[]
}

/**
 * Team-bulk IP allowlist editor. Routes through `/ip-allowlist/bulk` and
 * `/ip-allowlist/bulk-delete` so a team-wide add or delete is a single
 * request.
 */
export const IpAllowlistTeamMode = ({
	teamId: _teamId,
	teamName,
	members,
}: IpAllowlistTeamModeProps) => {
	const { t } = useTranslation()
	const { user, sourceIp } = useAuth()
	const callerId = user?.id ?? null
	const callerInTeam = !!callerId && members.some((m) => m.userId === callerId)

	const [error, setError] = useState<string | null>(null)

	const [newCidr, setNewCidr] = useState("")
	const [newDescription, setNewDescription] = useState("")
	const [busy, setBusy] = useState(false)

	const [pendingBulkAction, setPendingBulkAction] =
		useState<PendingBulkAction | null>(null)
	const [bulkResult, setBulkResult] = useState<BulkSummary | null>(null)

	const [teamAggregate, setTeamAggregate] = useState<AggregateRow[]>([])
	const [aggregateLoading, setAggregateLoading] = useState(false)
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

	const memberIdsCsv = members.map((m) => m.userId).join(",")
	const totalMembers = members.length
	const teamEmpty = totalMembers === 0

	const memberLabelOf = (userId: string): string => {
		const m = members.find((member) => member.userId === userId)
		return m ? m.label : userId
	}

	// Aggregate rows the caller currently owns. Used for self-lockout warnings
	// in bulk operations — we can only see the team's view of allowlist
	// entries, so this check has a small false-positive rate when the caller
	// also has out-of-team entries (the dialog notes the caveat).
	const callerOwnedRows = useMemo(() => {
		if (!callerInTeam || !callerId) return []
		return teamAggregate.filter((row) =>
			row.owners.some((o) => o.userId === callerId),
		)
	}, [teamAggregate, callerInTeam, callerId])

	const loadTeamAggregate = useCallback(
		async (signal?: AbortSignal) => {
			if (!memberIdsCsv) {
				setTeamAggregate([])
				return
			}
			const userIds = memberIdsCsv.split(",")
			setAggregateLoading(true)
			setError(null)
			try {
				// /ip-allowlist/by-users guarantees every requested userId is
				// present in `entriesByUser` (empty array for users with no
				// entries), so we don't need to merge missing ids back in.
				const data = await apiClient.post<{
					entriesByUser: Record<string, AllowlistEntry[]>
				}>("/ip-allowlist/by-users", { userIds }, { signal })

				if (signal?.aborted) return
				const map = new Map<string, AggregateRow>()
				for (const [userId, items] of Object.entries(
					data.entriesByUser ?? {},
				)) {
					for (const item of items) {
						const key = canonicalCidr(item.cidr)
						let row = map.get(key)
						if (!row) {
							row = { cidr: item.cidr, canonical: key, owners: [] }
							map.set(key, row)
						}
						row.owners.push({ userId, description: item.description })
					}
				}
				const sorted = Array.from(map.values()).sort((a, b) =>
					a.canonical.localeCompare(b.canonical),
				)
				setTeamAggregate(sorted)
			} catch (err) {
				if (signal?.aborted) return
				// The aggregate comes from a single request: any failure means
				// no rows to show. Surface the error inline rather than render
				// a partial table.
				setError(reportApiError(t, t("admin.ipAllowlist.errorList"), err))
				setTeamAggregate([])
			} finally {
				if (!signal?.aborted) setAggregateLoading(false)
			}
		},
		[memberIdsCsv, t],
	)

	useEffect(() => {
		setNewCidr("")
		setNewDescription("")
		setError(null)
		setBulkResult(null)
		setPendingBulkAction(null)
		setExpandedRows(new Set())
		// `members` is supplied by the parent at panel-open time and stays
		// frozen until close. If the roster changes mid-edit, the user must
		// reopen the panel or hit Refresh — this component does not have
		// the data access needed to re-fetch the roster on its own.
		const ac = new AbortController()
		loadTeamAggregate(ac.signal)
		return () => ac.abort()
	}, [loadTeamAggregate])

	// Self-lockout flag for the bulk action currently awaiting confirmation.
	// Add: the new CIDR doesn't cover the caller, and none of the team rows the
	//   caller owns already covers them.
	// Delete: the caller owns the CIDR being deleted, that CIDR currently
	//   covers them, and no OTHER row the caller owns covers them.
	const bulkWouldLockOut = useMemo(() => {
		if (!pendingBulkAction || !callerInTeam || !sourceIp) return false
		const cidr = pendingBulkAction.cidr
		if (pendingBulkAction.action === "add") {
			if (ipInCidr(sourceIp, cidr)) return false
			return !callerOwnedRows.some((r) => ipInCidr(sourceIp, r.cidr))
		}
		// delete
		const targetCanonical = canonicalCidr(cidr)
		const callerOwnsTarget = callerOwnedRows.some(
			(r) => r.canonical === targetCanonical,
		)
		if (!callerOwnsTarget) return false
		if (!ipInCidr(sourceIp, cidr)) return false
		const otherCovering = callerOwnedRows.filter(
			(r) => r.canonical !== targetCanonical && ipInCidr(sourceIp, r.cidr),
		)
		return otherCovering.length === 0
	}, [pendingBulkAction, callerInTeam, sourceIp, callerOwnedRows])

	const runBulkAdd = async (
		cidr: string,
		description: string | null,
		fromForm: boolean,
	) => {
		if (!cidr || members.length === 0) return
		setPendingBulkAction(null)
		setBusy(true)
		setError(null)
		setBulkResult(null)
		try {
			const data = await apiClient.post<BulkApiResult>("/ip-allowlist/bulk", {
				userIds: members.map((m) => m.userId),
				cidr,
				description,
			})
			const summary: BulkSummary = {
				action: "add",
				cidr,
				successCount: 0,
				skipped: [],
				failed: [],
			}
			for (const r of data.results) {
				if (r.outcome === "added") summary.successCount++
				else if (r.outcome === "skipped")
					summary.skipped.push({ userId: r.userId })
			}
			setBulkResult(summary)
			if (summary.successCount > 0) {
				notifyAllowlistChanged()
				if (fromForm) {
					setNewCidr("")
					setNewDescription("")
				}
			}
			await loadTeamAggregate()
		} catch (e) {
			setError(reportApiError(t, t("admin.ipAllowlist.errorAdd"), e))
		} finally {
			setBusy(false)
		}
	}

	const runBulkDelete = async (cidr: string, fromForm: boolean) => {
		if (!cidr || members.length === 0) return
		setPendingBulkAction(null)
		setBusy(true)
		setError(null)
		setBulkResult(null)
		try {
			const data = await apiClient.post<BulkApiResult>(
				"/ip-allowlist/bulk-delete",
				{
					userIds: members.map((m) => m.userId),
					cidr,
				},
			)
			const summary: BulkSummary = {
				action: "delete",
				cidr,
				successCount: 0,
				skipped: [],
				failed: [],
			}
			for (const r of data.results) {
				if (r.outcome === "deleted") summary.successCount++
				else if (r.outcome === "not_found")
					summary.skipped.push({ userId: r.userId })
			}
			setBulkResult(summary)
			if (summary.successCount > 0) {
				notifyAllowlistChanged()
				if (fromForm) {
					setNewCidr("")
					setNewDescription("")
				}
			}
			await loadTeamAggregate()
		} catch (e) {
			setError(reportApiError(t, t("admin.ipAllowlist.errorDelete"), e))
		} finally {
			setBusy(false)
		}
	}

	const toggleRowExpanded = (canonical: string) => {
		setExpandedRows((prev) => {
			const next = new Set(prev)
			if (next.has(canonical)) next.delete(canonical)
			else next.add(canonical)
			return next
		})
	}

	// Bulk add/delete affect the entire team — including the caller, if they're
	// a member. While `/me` is still in-flight after page mount, sourceIp is
	// unknown and the self-lockout check can't run, so we suppress bulk
	// operations until it lands. Admins editing teams they don't belong to are
	// unaffected.
	const selfEditAwaitingSourceIp = callerInTeam && sourceIp === null
	const inputsEmpty = !newCidr || busy
	const addDisabled = inputsEmpty || teamEmpty || selfEditAwaitingSourceIp

	return (
		<>
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{selfEditAwaitingSourceIp && (
				<Alert>
					<AlertDescription>
						{t("admin.ipAllowlist.selfLockoutSourceIpUnknown")}
					</AlertDescription>
				</Alert>
			)}

			{bulkResult && (
				<Alert>
					<AlertDescription>
						<div className="space-y-1">
							<p className="font-medium text-gray-900">
								{bulkResult.action === "add"
									? t("admin.ipAllowlist.bulkAddTitle")
									: t("admin.ipAllowlist.bulkDeleteTitle")}
								<span className="ml-2 text-xs font-mono text-gray-500">
									{bulkResult.cidr}
								</span>
							</p>
							<ul className="text-sm text-gray-700 list-disc pl-5">
								<li>
									{bulkResult.action === "add"
										? t("admin.ipAllowlist.addedLabel")
										: t("admin.ipAllowlist.deletedLabel")}
									: {bulkResult.successCount}{" "}
									{t("admin.ipAllowlist.countSuffix")}
								</li>
								<li>
									{bulkResult.action === "add"
										? t("admin.ipAllowlist.skippedAddLabel")
										: t("admin.ipAllowlist.skippedDeleteLabel")}
									: {bulkResult.skipped.length}{" "}
									{t("admin.ipAllowlist.countSuffix")}
								</li>
								<li>
									{t("admin.ipAllowlist.failedLabel")}:{" "}
									{bulkResult.failed.length}{" "}
									{t("admin.ipAllowlist.countSuffix")}
								</li>
							</ul>
							{bulkResult.skipped.length > 0 && (
								<details className="mt-1">
									<summary className="text-xs text-gray-600 cursor-pointer">
										{t("admin.ipAllowlist.showSkipped")}
									</summary>
									<ul className="text-xs text-gray-600 mt-1 space-y-0.5 pl-2">
										{bulkResult.skipped.map((s) => (
											<li key={s.userId}>{memberLabelOf(s.userId)}</li>
										))}
									</ul>
								</details>
							)}
							{bulkResult.failed.length > 0 && (
								<details className="mt-1">
									<summary className="text-xs text-gray-600 cursor-pointer">
										{t("admin.ipAllowlist.showFailed")}
									</summary>
									<ul className="text-xs text-gray-600 mt-1 space-y-0.5 pl-2">
										{bulkResult.failed.map((f) => (
											<li key={f.userId}>
												{memberLabelOf(f.userId)}: {f.reason}
											</li>
										))}
									</ul>
								</details>
							)}
						</div>
					</AlertDescription>
				</Alert>
			)}

			<section className="space-y-3">
				<h3 className="text-sm font-medium text-gray-900">
					{t("admin.ipAllowlist.newSectionTeam")}
				</h3>
				<div className="space-y-3">
					<div className="space-y-1">
						<Label htmlFor="newCidr">{t("admin.ipAllowlist.cidrLabel")}</Label>
						<Input
							id="newCidr"
							value={newCidr}
							onChange={(e) => setNewCidr(e.target.value.trim())}
							placeholder={t("admin.ipAllowlist.cidrPlaceholder")}
						/>
						<p className="text-xs text-gray-500 leading-relaxed">
							{t("admin.ipAllowlist.cidrHelp")}
						</p>
					</div>
					<div className="space-y-1">
						<Label htmlFor="newDescription">
							{t("admin.ipAllowlist.descriptionLabel")}
						</Label>
						<Input
							id="newDescription"
							value={newDescription}
							onChange={(e) => setNewDescription(e.target.value)}
							placeholder={t("admin.ipAllowlist.descriptionPlaceholder")}
						/>
						<p className="text-xs text-gray-500 leading-relaxed">
							{t("admin.ipAllowlist.descriptionHelp")}
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							onClick={() =>
								setPendingBulkAction({
									action: "add",
									cidr: newCidr,
									description: newDescription || null,
									fromForm: true,
								})
							}
							disabled={addDisabled}
						>
							{busy
								? t("admin.ipAllowlist.processingButton")
								: t("admin.ipAllowlist.addToTeamButton", {
										count: totalMembers,
									})}
						</Button>
					</div>
				</div>
			</section>

			<section className="space-y-2">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium text-gray-900">
						{t("admin.ipAllowlist.teamAggregateTitle", {
							count: teamAggregate.length,
						})}
					</h3>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-xs"
						onClick={() => loadTeamAggregate()}
						disabled={aggregateLoading || teamEmpty}
						title={t("admin.ipAllowlist.refresh")}
					>
						<RefreshCw
							className={`h-3 w-3 mr-1 ${aggregateLoading ? "animate-spin" : ""}`}
						/>
						{t("admin.ipAllowlist.refresh")}
					</Button>
				</div>
				<div className="border rounded">
					{aggregateLoading && teamAggregate.length === 0 ? (
						<p className="text-sm text-gray-500 p-3">
							{t("admin.ipAllowlist.loading")}
						</p>
					) : teamEmpty ? (
						<p className="text-sm text-gray-500 p-3">
							{t("admin.ipAllowlist.emptyTeam")}
						</p>
					) : teamAggregate.length === 0 ? (
						<p className="text-sm text-gray-500 p-3">
							{t("admin.ipAllowlist.emptyTeamEntries")}
						</p>
					) : (
						<table className="w-full text-sm">
							<thead className="bg-gray-50">
								<tr className="text-left">
									<th className="p-2">{t("admin.ipAllowlist.colCidr")}</th>
									<th className="p-2 whitespace-nowrap">
										{t("admin.ipAllowlist.colCoverage")}
									</th>
									<th className="p-2 w-56 text-right">
										{t("admin.ipAllowlist.colActions")}
									</th>
								</tr>
							</thead>
							<tbody>
								{teamAggregate.flatMap((row) => {
									const coverage = row.owners.length
									const isFull = coverage === totalMembers
									const expanded = expandedRows.has(row.canonical)
									const rows = [
										<tr
											key={row.canonical}
											className="border-t hover:bg-gray-50"
										>
											<td className="p-2 font-mono align-top break-all">
												<button
													type="button"
													onClick={() => toggleRowExpanded(row.canonical)}
													className="inline-flex items-center gap-1 hover:underline"
													aria-expanded={expanded}
												>
													<ChevronDown
														className={`h-3 w-3 transition-transform ${
															expanded ? "" : "-rotate-90"
														}`}
													/>
													{row.cidr}
												</button>
											</td>
											<td className="p-2 align-top whitespace-nowrap">
												{isFull ? (
													<Badge
														variant="default"
														className="bg-green-100 text-green-800 hover:bg-green-100 whitespace-nowrap"
													>
														{t("admin.ipAllowlist.coverageFull", {
															coverage,
															total: totalMembers,
														})}
													</Badge>
												) : (
													<Badge
														variant="default"
														className="bg-amber-100 text-amber-800 hover:bg-amber-100 whitespace-nowrap"
													>
														{t("admin.ipAllowlist.coveragePartial", {
															coverage,
															total: totalMembers,
														})}
													</Badge>
												)}
											</td>
											<td className="p-2 align-top">
												<div className="flex justify-end gap-1.5 flex-wrap">
													{!isFull && (
														<Button
															size="sm"
															variant="outline"
															className="h-7 text-xs"
															disabled={busy || selfEditAwaitingSourceIp}
															onClick={() =>
																setPendingBulkAction({
																	action: "add",
																	cidr: row.cidr,
																	description: null,
																	fromForm: false,
																})
															}
														>
															{t("admin.ipAllowlist.matchAll")}
														</Button>
													)}
													<Button
														size="sm"
														variant="destructive"
														className="h-7 text-xs"
														disabled={busy || selfEditAwaitingSourceIp}
														onClick={() =>
															setPendingBulkAction({
																action: "delete",
																cidr: row.cidr,
																description: null,
																fromForm: false,
															})
														}
													>
														{t("admin.ipAllowlist.deleteAll")}
													</Button>
												</div>
											</td>
										</tr>,
									]
									if (expanded) {
										rows.push(
											<tr
												key={`${row.canonical}-expanded`}
												className="border-t bg-gray-50"
											>
												<td colSpan={3} className="p-2 pl-8">
													<ul className="text-xs text-gray-700 space-y-1">
														{row.owners.map((o) => (
															<li key={o.userId} className="break-all">
																<span className="font-medium">
																	{memberLabelOf(o.userId)}
																</span>
																{o.description ? (
																	<span className="text-gray-500">
																		{" "}
																		— {o.description}
																	</span>
																) : null}
															</li>
														))}
													</ul>
												</td>
											</tr>,
										)
									}
									return rows
								})}
							</tbody>
						</table>
					)}
				</div>
			</section>

			<section className="space-y-2">
				<h3 className="text-sm font-medium text-gray-900">
					{t("admin.ipAllowlist.membersTitle", { count: members.length })}
				</h3>
				{members.length === 0 ? (
					<p className="text-sm text-gray-500 border rounded p-3">
						{t("admin.ipAllowlist.membersEmpty")}
					</p>
				) : (
					<ul className="border rounded max-h-48 overflow-y-auto divide-y">
						{members.map((m) => (
							<li
								key={m.userId}
								className="text-xs text-gray-700 px-3 py-1.5 break-all"
							>
								{m.label}
							</li>
						))}
					</ul>
				)}
			</section>

			<AlertDialog
				open={pendingBulkAction !== null}
				onOpenChange={(open) => {
					if (!open) setPendingBulkAction(null)
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							{bulkWouldLockOut && (
								<AlertTriangle className="h-5 w-5 text-amber-600" />
							)}
							{pendingBulkAction?.action === "delete"
								? t("admin.ipAllowlist.bulkDeleteConfirmTitle")
								: t("admin.ipAllowlist.bulkAddConfirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingBulkAction &&
								(pendingBulkAction.action === "delete"
									? t("admin.ipAllowlist.bulkDeleteConfirmBody", {
											name: teamName,
											count: members.length,
											cidr: pendingBulkAction.cidr,
										})
									: t("admin.ipAllowlist.bulkAddConfirmBody", {
											name: teamName,
											count: members.length,
											cidr: pendingBulkAction.cidr,
										}))}
							{bulkWouldLockOut && pendingBulkAction && (
								<>
									{" "}
									<strong className="block mt-2 text-amber-700">
										{pendingBulkAction.action === "add"
											? t("admin.ipAllowlist.selfLockoutBulkAddBody", {
													sourceIp: sourceIp ?? "?",
													cidr: pendingBulkAction.cidr,
												})
											: t("admin.ipAllowlist.selfLockoutBulkDeleteBody", {
													sourceIp: sourceIp ?? "?",
													cidr: pendingBulkAction.cidr,
												})}
									</strong>
									<span className="block mt-1 text-xs text-amber-600">
										{t("admin.ipAllowlist.selfLockoutTeamCaveat")}
									</span>
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("admin.ipAllowlist.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (!pendingBulkAction) return
								const { action, cidr, description, fromForm } =
									pendingBulkAction
								if (action === "delete") runBulkDelete(cidr, fromForm)
								else runBulkAdd(cidr, description, fromForm)
							}}
							className={
								pendingBulkAction?.action === "delete" || bulkWouldLockOut
									? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
									: undefined
							}
						>
							{bulkWouldLockOut
								? t("admin.ipAllowlist.selfLockoutProceed")
								: pendingBulkAction?.action === "delete"
									? t("admin.ipAllowlist.deletedLabel")
									: t("admin.ipAllowlist.addedLabel")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
