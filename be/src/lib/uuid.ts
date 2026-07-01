/**
 * Loose on version/variant nibbles intentionally: the value comes from the
 * verified Authorizer context, so this is a defensive format check rather
 * than an authoritative validator.
 */
export const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
	return UUID_RE.test(value)
}
