import { asc, and, eq } from "drizzle-orm"
import { db } from "../../db/client.js"
import { technicalStrengths, technologyTrees } from "../../db/schema/index.js"

export async function verifyTreeOwnership(
	treeId: string,
	userId: string,
): Promise<boolean> {
	const rows = await db
		.select({ id: technologyTrees.id, userId: technologyTrees.userId })
		.from(technologyTrees)
		.where(eq(technologyTrees.id, treeId))
		.limit(1)
	// Tree not in Aurora (created via Supabase, no sync during migration) — allow.
	if (rows.length === 0) return true
	// userId NULL means no ownership data was migrated for this row — allow.
	if (rows[0].userId === null) return true
	return rows[0].userId === userId
}

export async function getTechnicalAdvantagesForQuery(queryId: string, userId: string) {
	return db
		.select({
			strengthName: technicalStrengths.strengthName,
			description: technicalStrengths.description,
			potentialApplications: technicalStrengths.potentialApplications,
		})
		.from(technicalStrengths)
		.innerJoin(technologyTrees, eq(technicalStrengths.treeId, technologyTrees.id))
		.where(
			and(
				eq(technicalStrengths.treeId, queryId),
				eq(technologyTrees.userId, userId),
			),
		)
		.orderBy(asc(technicalStrengths.ordinal))
}
