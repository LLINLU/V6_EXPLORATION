import { type AppEnv, env } from "./env.js"

/**
 * Application administrator user IDs, per deployment environment. The admin
 * role is checked against the set for the current `APP_ENV` at request time.
 * To grant admin to a user, add their auth user ID under the matching env.
 *
 * Hard-coded here because admin role is not part of the BE's own database
 * schema; once it is, this set should be replaced with a DB lookup.
 */
const ADMINS_BY_ENV: Record<AppEnv, ReadonlySet<string>> = {
	dev: new Set<string>([
		"bd0331d4-15df-4446-a295-fd471c975339", // mlab_test_user@memoryai.jp
	]),
	stg: new Set<string>([
		"bd0331d4-15df-4446-a295-fd471c975339", // mlab_test_user@memoryai.jp
	]),
	prd: new Set<string>([
		"dce13f1e-999a-4cc2-afa6-152e19a79cbc", // admin@memorylab.jp
		"fbd638be-add0-4f4f-8ef7-c8c12e21a339", // admin2@memorylab.jp
		"5fef0c0f-d81d-4f3f-8cc5-9685682fbafc", // mlab_share_user@memoryai.jp
	]),
}

export const ADMIN_USER_IDS: ReadonlySet<string> = ADMINS_BY_ENV[env.APP_ENV]

export function isAdmin(userId: string): boolean {
	return ADMIN_USER_IDS.has(userId)
}
