// Lightweight IP address family detector and CIDR containment check for the
// browser. Mirrors the return shape of `node:net`'s `isIP` (0 / 4 / 6) so
// shared code can use the same predicate name across BE / FE.
//
// `isIP` is intentionally simple — it does not canonicalize the address.
// Server-side validation (BE `normalizeCidr`) and PostgreSQL's `inet` / `cidr`
// types are the authoritative validators; this module is only used for UI
// affordances (canonical-form trimming, self-lockout warning).

const IPV4_OCTET = /^(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/

function isIPv4(value: string): boolean {
	const parts = value.split(".")
	if (parts.length !== 4) return false
	return parts.every((p) => IPV4_OCTET.test(p))
}

function isIPv6(value: string): boolean {
	if (!value.includes(":")) return false
	// Reject more than one "::" run (zero-compression must be unique).
	if ((value.match(/::/g)?.length ?? 0) > 1) return false

	// IPv4-mapped form: ::ffff:1.2.3.4 — split the trailing IPv4 piece out.
	const lastColon = value.lastIndexOf(":")
	const tail = value.slice(lastColon + 1)
	let head: string
	let extraGroups = 0
	if (tail.includes(".")) {
		if (!isIPv4(tail)) return false
		head = value.slice(0, lastColon)
		extraGroups = 2
	} else {
		head = value
	}

	const hasCollapse = head.includes("::")
	const groups = head.split(":")

	// "::" leaves empty strings at start/end/middle — count non-empty groups.
	const nonEmpty = groups.filter((g) => g.length > 0)
	if (nonEmpty.some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return false

	const total = nonEmpty.length + extraGroups
	if (hasCollapse) {
		return total <= 7
	}
	return total === 8
}

export function isIP(value: string): 0 | 4 | 6 {
	if (isIPv4(value)) return 4
	if (isIPv6(value)) return 6
	return 0
}

// ─── CIDR containment ────────────────────────────────────────────────────

function ipv4ToInt(ip: string): number | null {
	if (!isIPv4(ip)) return null
	const parts = ip.split(".").map(Number)
	// Use unsigned right shift to coerce to a uint32 — leftshift of the high
	// octet flips sign in JS otherwise.
	return (
		((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
	)
}

/**
 * Expand an IPv6 address to a 128-bit BigInt. Handles `::` compression and
 * IPv4-mapped tail (`::ffff:1.2.3.4`). Returns null for malformed input.
 */
function ipv6ToBigInt(ip: string): bigint | null {
	if (!isIPv6(ip)) return null

	// Strip any IPv4-mapped tail first so the rest can assume pure hextet groups.
	let tail32: bigint | null = null
	let head = ip
	const lastColon = ip.lastIndexOf(":")
	if (lastColon >= 0 && ip.slice(lastColon + 1).includes(".")) {
		const tail4 = ipv4ToInt(ip.slice(lastColon + 1))
		if (tail4 === null) return null
		tail32 = BigInt(tail4)
		head = ip.slice(0, lastColon + 1) // keep trailing ":" so "::ffff:" parses
	}

	const collapse = head.split("::")
	if (collapse.length > 2) return null
	let leftGroups: string[] = []
	let rightGroups: string[] = []
	if (collapse.length === 2) {
		leftGroups = collapse[0] === "" ? [] : collapse[0].split(":")
		// Strip trailing ":" remnant from the IPv4 split above.
		const rightRaw = collapse[1].replace(/^:|:$/, "")
		rightGroups = rightRaw === "" ? [] : rightRaw.split(":")
	} else {
		leftGroups = head.replace(/:$/, "").split(":")
	}

	const trailingGroupsFromV4 = tail32 !== null ? 2 : 0
	const explicitGroups = leftGroups.length + rightGroups.length
	const totalNeeded = 8 - trailingGroupsFromV4

	let allGroups: string[]
	if (collapse.length === 2) {
		const fillCount = totalNeeded - explicitGroups
		if (fillCount < 0) return null
		allGroups = [
			...leftGroups,
			...Array<string>(fillCount).fill("0"),
			...rightGroups,
		]
	} else {
		if (explicitGroups !== totalNeeded) return null
		allGroups = leftGroups
	}

	let result = 0n
	for (const g of allGroups) {
		if (!/^[0-9a-f]{1,4}$/i.test(g)) return null
		result = (result << 16n) | BigInt(Number.parseInt(g, 16))
	}
	if (tail32 !== null) {
		result = (result << 32n) | tail32
	}
	return result
}

/**
 * Returns true when `ip` is contained in `cidr`. The CIDR may be a bare host
 * (treated as /32 for IPv4, /128 for IPv6) or include an explicit mask. IP and
 * CIDR families must match — an IPv4 address is never inside an IPv6 CIDR or
 * vice versa. Returns false on any parse error (treat as "cannot determine"
 * and let the BE be the authoritative validator).
 */
export function ipInCidr(ip: string, cidr: string): boolean {
	const ipFamily = isIP(ip)
	if (ipFamily === 0) return false

	const slash = cidr.indexOf("/")
	const host = slash < 0 ? cidr.trim() : cidr.slice(0, slash).trim()
	const maskStr = slash < 0 ? undefined : cidr.slice(slash + 1).trim()

	const hostFamily = isIP(host)
	if (hostFamily === 0 || hostFamily !== ipFamily) return false

	const maxMask = hostFamily === 4 ? 32 : 128
	let mask = maxMask
	if (maskStr !== undefined) {
		if (!/^\d+$/.test(maskStr)) return false
		const n = Number(maskStr)
		if (n < 0 || n > maxMask) return false
		mask = n
	}

	if (ipFamily === 4) {
		const ipInt = ipv4ToInt(ip)
		const hostInt = ipv4ToInt(host)
		if (ipInt === null || hostInt === null) return false
		if (mask === 0) return true
		const maskBits = (0xffffffff << (32 - mask)) >>> 0
		return (ipInt & maskBits) === (hostInt & maskBits)
	}

	const ipBig = ipv6ToBigInt(ip)
	const hostBig = ipv6ToBigInt(host)
	if (ipBig === null || hostBig === null) return false
	if (mask === 0) return true
	const maskBits = ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - mask)) - 1n)
	return (ipBig & maskBits) === (hostBig & maskBits)
}
