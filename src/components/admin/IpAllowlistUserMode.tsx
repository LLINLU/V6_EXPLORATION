import { AlertTriangle } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/apiClient"
import {
	type AllowlistEntry,
	notifyAllowlistChanged,
	reportApiError,
	wouldLockOutOnAdd,
	wouldLockOutOnDelete,
} from "./ipAllowlistShared"

interface IpAllowlistUserModeProps {
	userId: string
}

/**
 * Single-user IP allowlist editor: list entries, add, delete-with-confirm.
 * Caller decides where to surface success / error toasts (we render the error
 * inline and dispatch a window event on mutation).
 */
export const IpAllowlistUserMode = ({ userId }: IpAllowlistUserModeProps) => {
	const { t } = useTranslation()
	const { user, sourceIp } = useAuth()
	const isEditingSelf = !!user?.id && user.id === userId

	const [entries, setEntries] = useState<AllowlistEntry[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [newCidr, setNewCidr] = useState("")
	const [newDescription, setNewDescription] = useState("")
	const [adding, setAdding] = useState(false)
	const [pendingDelete, setPendingDelete] = useState<{
		id: string
		cidr: string
	} | null>(null)
	// Set when the add submission would strand the editing admin's own IP. The
	// inline confirm dialog renders the warning details; clicking "proceed"
	// flips through to the actual POST.
	const [pendingAddWarning, setPendingAddWarning] = useState<{
		cidr: string
		description: string | null
	} | null>(null)

	const loadEntries = useCallback(
		async (signal?: AbortSignal) => {
			setLoading(true)
			setError(null)
			try {
				const data = await apiClient.get<{ items: AllowlistEntry[] }>(
					`/users/${userId}/ip-allowlist`,
					{ signal },
				)
				if (signal?.aborted) return
				setEntries(data.items)
			} catch (e) {
				if (signal?.aborted) return
				setError(reportApiError(t, t("admin.ipAllowlist.errorList"), e))
				setEntries([])
			} finally {
				if (!signal?.aborted) setLoading(false)
			}
		},
		[userId, t],
	)

	useEffect(() => {
		setNewCidr("")
		setNewDescription("")
		setError(null)
		setPendingDelete(null)
		setPendingAddWarning(null)
		const ac = new AbortController()
		loadEntries(ac.signal)
		return () => ac.abort()
	}, [loadEntries])

	// Compute the per-render lockout flag for the pending delete (so the
	// dialog body can decide whether to render the extra warning).
	const deleteWouldLockOut = useMemo(() => {
		if (!isEditingSelf || !pendingDelete) return false
		const target = entries.find((e) => e.id === pendingDelete.id)
		if (!target) return false
		return wouldLockOutOnDelete({
			sourceIp,
			target,
			otherEntries: entries.filter((e) => e.id !== pendingDelete.id),
		})
	}, [isEditingSelf, pendingDelete, entries, sourceIp])

	const performAdd = async (cidr: string, description: string | null) => {
		setAdding(true)
		setError(null)
		try {
			await apiClient.post(`/users/${userId}/ip-allowlist`, {
				cidr,
				description,
			})
			setNewCidr("")
			setNewDescription("")
			await loadEntries()
			notifyAllowlistChanged()
		} catch (e) {
			setError(reportApiError(t, t("admin.ipAllowlist.errorAdd"), e))
		} finally {
			setAdding(false)
		}
	}

	const requestAdd = () => {
		if (!newCidr) return
		const description = newDescription || null
		// Only intercept with a warning when (a) the admin is editing their own
		// row and (b) the change would actually remove their last protection.
		// Cross-user adds and adds that don't change coverage skip the dialog.
		if (
			isEditingSelf &&
			wouldLockOutOnAdd({
				sourceIp,
				cidr: newCidr,
				existingEntries: entries,
			})
		) {
			setPendingAddWarning({ cidr: newCidr, description })
			return
		}
		performAdd(newCidr, description)
	}

	const confirmAddAfterWarning = async () => {
		if (!pendingAddWarning) return
		const { cidr, description } = pendingAddWarning
		setPendingAddWarning(null)
		await performAdd(cidr, description)
	}

	const confirmRemove = async () => {
		if (!pendingDelete) return
		const { id } = pendingDelete
		setError(null)
		try {
			await apiClient.del(`/users/${userId}/ip-allowlist/${id}`)
			await loadEntries()
			notifyAllowlistChanged()
		} catch (e) {
			setError(reportApiError(t, t("admin.ipAllowlist.errorDelete"), e))
		} finally {
			setPendingDelete(null)
		}
	}

	// Self-edit safety: when an admin edits their own row but `/me` hasn't yet
	// returned the caller's source IP, we can't evaluate self-lockout. Disable
	// mutations until sourceIp lands so the operator can't commit a change
	// whose blast radius is unknown.
	const selfEditAwaitingSourceIp = isEditingSelf && sourceIp === null
	const inputsEmpty = !newCidr || adding
	const addDisabled = inputsEmpty || selfEditAwaitingSourceIp

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

			<section className="space-y-3">
				<h3 className="text-sm font-medium text-gray-900">
					{t("admin.ipAllowlist.newSectionUser")}
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
						<Button onClick={requestAdd} disabled={addDisabled}>
							{adding
								? t("admin.ipAllowlist.addingButton")
								: t("admin.ipAllowlist.addButton")}
						</Button>
					</div>
				</div>
			</section>

			<section className="space-y-2">
				<h3 className="text-sm font-medium text-gray-900">
					{t("admin.ipAllowlist.registeredEntries", { count: entries.length })}
				</h3>
				<div className="border rounded">
					{loading ? (
						<p className="text-sm text-gray-500 p-3">
							{t("admin.ipAllowlist.loading")}
						</p>
					) : entries.length === 0 ? (
						<p className="text-sm text-gray-500 p-3">
							{t("admin.ipAllowlist.emptyUserEntries")}
						</p>
					) : (
						<table className="w-full text-sm">
							<thead className="bg-gray-50">
								<tr className="text-left">
									<th className="p-2">{t("admin.ipAllowlist.colCidr")}</th>
									<th className="p-2">
										{t("admin.ipAllowlist.colDescription")}
									</th>
									<th className="p-2 w-20" />
								</tr>
							</thead>
							<tbody>
								{entries.map((e) => (
									<tr key={e.id} className="border-t">
										<td className="p-2 font-mono break-all">
											{e.cidr}
											<div className="text-[11px] text-gray-400">
												{new Date(e.createdAt).toLocaleString("ja-JP")}
											</div>
										</td>
										<td className="p-2">{e.description ?? "—"}</td>
										<td className="p-2 text-right">
											<Button
												variant="destructive"
												size="sm"
												disabled={selfEditAwaitingSourceIp}
												onClick={() =>
													setPendingDelete({ id: e.id, cidr: e.cidr })
												}
											>
												{t("admin.ipAllowlist.deleteButton")}
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</section>

			{/* Self-lockout warning before ADD. Only fires when editing one's own
			    row and the new CIDR wouldn't protect the caller's current IP. */}
			<AlertDialog
				open={!!pendingAddWarning}
				onOpenChange={(open) => {
					if (!open) setPendingAddWarning(null)
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-amber-600" />
							{t("admin.ipAllowlist.selfLockoutAddTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingAddWarning &&
								t("admin.ipAllowlist.selfLockoutAddBody", {
									sourceIp: sourceIp ?? "?",
									cidr: pendingAddWarning.cidr,
								})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("admin.ipAllowlist.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={confirmAddAfterWarning}
						>
							{t("admin.ipAllowlist.selfLockoutProceed")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={!!pendingDelete}
				onOpenChange={(open) => {
					if (!open) setPendingDelete(null)
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							{deleteWouldLockOut && (
								<AlertTriangle className="h-5 w-5 text-amber-600" />
							)}
							{t("admin.ipAllowlist.deleteEntryTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingDelete &&
								t("admin.ipAllowlist.deleteEntryBody", {
									cidr: pendingDelete.cidr,
								})}
							{deleteWouldLockOut && pendingDelete && (
								<>
									{" "}
									<strong className="block mt-2 text-amber-700">
										{t("admin.ipAllowlist.selfLockoutDeleteBody", {
											sourceIp: sourceIp ?? "?",
											cidr: pendingDelete.cidr,
										})}
									</strong>
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("admin.ipAllowlist.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmRemove}
							className={
								deleteWouldLockOut
									? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
									: undefined
							}
						>
							{deleteWouldLockOut
								? t("admin.ipAllowlist.selfLockoutProceed")
								: t("admin.ipAllowlist.deleteButton")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
