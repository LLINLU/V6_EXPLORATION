import i18next from "i18next"
import { supabase } from "@/integrations/supabase/client"
import { getOutputLanguage } from "@/lib/outputLanguage"

//TODO move this to treeService.ts and supabase repository
interface GenerateTreeWithContextParams {
	searchTheme: string
	context: string
	treeMode: "TED" | "FAST"
	teamId?: string
	treeId?: string
	user_id?: string
	language?: string
}

interface TreeGenerationResponse {
	success: boolean
	treeId?: string
	message?: string
	scenarios?: Array<{ id: string; name: string }>
	implementations?: Array<{ id: string; name: string }>
	status?: string
	error?: string
}

export async function ensureScenarioTreeGenerated(
	treeId: string,
	scenarioId: string,
	language: string = getOutputLanguage(),
): Promise<{ generated: boolean; scenarioId: string }> {
	const loadScenarioNode = async () =>
		supabase
			.from("tree_nodes")
			.select("id, children_count")
			.eq("tree_id", treeId)
			.eq("id", scenarioId)
			.eq("level", 1)
			.maybeSingle()

	const { data, error } = await loadScenarioNode()

	if (error) throw error

	if (data && (data.children_count ?? 0) > 0) {
		return { generated: false, scenarioId }
	}

	await generateTreesForSelectedScenarios(treeId, [scenarioId], language)

	const MAX_ATTEMPTS = 40
	const POLL_INTERVAL_MS = 1500

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		const { data: refreshedData, error: refreshedError } =
			await loadScenarioNode()

		if (refreshedError) {
			console.error(
				"[ENSURE_SCENARIO_TREE] Failed while waiting for generated scenario:",
				refreshedError,
			)
			throw refreshedError
		}

		if ((refreshedData?.children_count ?? 0) > 0) {
			return { generated: true, scenarioId }
		}

		await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
	}

	throw new Error("Scenario tree generation timed out")
}

export async function enrichTreeForExploration(
	treeId: string,
	language: string = getOutputLanguage(),
): Promise<void> {
	const { error: strengthsError } = await supabase.functions.invoke(
		"generate-technical-strengths",
		{ body: { treeId, language } },
	)

	if (strengthsError) throw strengthsError

	await runV5TreePipeline(treeId, language)
}

export async function runV5TreePipeline(
	treeId: string,
	language: string = getOutputLanguage(),
): Promise<void> {
	const { error: scenariosError } = await supabase.functions.invoke(
		"generate-scenarios",
		{ body: { tree_id: treeId, language } },
	)

	if (scenariosError) throw scenariosError

	const { error: treeError } = await supabase.functions.invoke(
		"generate-tree-from-v5",
		{ body: { tree_id: treeId, language } },
	)

	if (treeError) throw treeError
}

export async function generateTreesForSelectedScenarios(
	treeId: string,
	scenarioIds: string[],
	language: string = getOutputLanguage(),
): Promise<{ expandedScenarios: string[] }> {
	if (!scenarioIds.length) return { expandedScenarios: [] }

	const results = await Promise.allSettled(
		scenarioIds.map(async (scenarioId) => {
			const { data, error } = await supabase.functions.invoke(
				"generate-tree-from-v5",
				{
					body: {
						tree_id: treeId,
						language,
						scenario_ids: [scenarioId],
					},
				},
			)

			if (error) throw error

			return data?.expanded_scenarios || []
		}),
	)

	const expandedScenarios: string[] = []
	let hasError = false

	for (const result of results) {
		if (result.status === "fulfilled") {
			expandedScenarios.push(...result.value)
		} else {
			hasError = true
		}
	}

	if (hasError && expandedScenarios.length === 0) {
		throw new Error("All scenario tree generations failed")
	}

	return { expandedScenarios }
}

type MindmapTreeData = {
	level1Items: Array<{
		id: string
		name: string
		description: string
		level: number
		children_count: number
	}>
	level2Items: Record<
		string,
		Array<{
			id: string
			name: string
			description: string
			level: number
			children_count: number
		}>
	>
	level3Items: Record<
		string,
		Array<{
			id: string
			name: string
			description: string
			level: number
			children_count: number
		}>
	>
	level4Items: Record<
		string,
		Array<{
			id: string
			name: string
			description: string
			level: number
			children_count: number
		}>
	>
	level5Items: Record<string, any[]>
	level6Items: Record<string, any[]>
	level7Items: Record<string, any[]>
	level8Items: Record<string, any[]>
	level9Items: Record<string, any[]>
	level10Items: Record<string, any[]>
	levelNames: Record<string, string>
	mode?: string
}

export function mergeMindmapTreeData(
	existing: MindmapTreeData | null,
	incoming: MindmapTreeData,
): MindmapTreeData {
	if (!existing) return incoming

	const incomingIds = new Set(incoming.level1Items.map((n) => n.id))
	const mergedLevel1 = [
		...existing.level1Items.filter((n) => !incomingIds.has(n.id)),
		...incoming.level1Items,
	]

	return {
		level1Items: mergedLevel1,
		level2Items: { ...existing.level2Items, ...incoming.level2Items },
		level3Items: { ...existing.level3Items, ...incoming.level3Items },
		level4Items: { ...existing.level4Items, ...incoming.level4Items },
		level5Items: { ...existing.level5Items, ...incoming.level5Items },
		level6Items: { ...existing.level6Items, ...incoming.level6Items },
		level7Items: { ...existing.level7Items, ...incoming.level7Items },
		level8Items: { ...existing.level8Items, ...incoming.level8Items },
		level9Items: { ...existing.level9Items, ...incoming.level9Items },
		level10Items: { ...existing.level10Items, ...incoming.level10Items },
		levelNames: incoming.levelNames,
		mode: incoming.mode ?? existing.mode,
	}
}

export async function fetchMindmapTreeData(
	treeId: string,
	scenarioIds: string[],
): Promise<MindmapTreeData> {
	const empty = (): MindmapTreeData => ({
		level1Items: [],
		level2Items: {},
		level3Items: {},
		level4Items: {},
		level5Items: {},
		level6Items: {},
		level7Items: {},
		level8Items: {},
		level9Items: {},
		level10Items: {},
		levelNames: {
			level1: i18next.t("scenario.level_names.scenario"),
			level2: i18next.t("scenario.level_names.objective"),
			level3: i18next.t("scenario.level_names.function"),
			level4: i18next.t("scenario.level_names.means"),
		},
	})

	if (!scenarioIds.length) return empty()

	const { data: level1, error: level1Error } = await supabase
		.from("tree_nodes")
		.select(
			"id, parent_id, name, description, level, node_order, children_count",
		)
		.eq("tree_id", treeId)
		.eq("level", 1)
		.in("id", scenarioIds)
		.order("node_order", { ascending: true })

	if (level1Error || !level1) return empty()
	if (!level1.length) return empty()

	const level1Ids = new Set(level1.map((n) => n.id))

	let level2: any[] = []
	if (level1Ids.size > 0) {
		const { data, error } = await supabase
			.from("tree_nodes")
			.select(
				"id, parent_id, name, description, level, node_order, children_count",
			)
			.eq("tree_id", treeId)
			.eq("level", 2)
			.in("parent_id", Array.from(level1Ids))
			.order("node_order", { ascending: true })

		if (error || !data) return empty()
		level2 = data
	}

	const level2Ids = new Set(level2.map((n) => n.id))

	let level3: any[] = []
	if (level2Ids.size > 0) {
		const { data, error } = await supabase
			.from("tree_nodes")
			.select(
				"id, parent_id, name, description, level, node_order, children_count",
			)
			.eq("tree_id", treeId)
			.eq("level", 3)
			.in("parent_id", Array.from(level2Ids))
			.order("node_order", { ascending: true })

		if (error || !data) return empty()
		level3 = data
	}

	const level3Ids = new Set(level3.map((n) => n.id))

	let level4: any[] = []
	if (level3Ids.size > 0) {
		const { data, error } = await supabase
			.from("tree_nodes")
			.select(
				"id, parent_id, name, description, level, node_order, children_count",
			)
			.eq("tree_id", treeId)
			.eq("level", 4)
			.in("parent_id", Array.from(level3Ids))
			.order("node_order", { ascending: true })

		if (error || !data) return empty()
		level4 = data
	}

	const toNode = (n: any) => ({
		id: n.id,
		name: n.name || "",
		description: n.description || "",
		level: n.level,
		children_count: n.children_count ?? 0,
	})

	const groupBy = (nodes: any[]) =>
		nodes.reduce<Record<string, any[]>>((acc, n) => {
			if (!n.parent_id) return acc
			if (!acc[n.parent_id]) acc[n.parent_id] = []
			acc[n.parent_id].push(toNode(n))
			return acc
		}, {})

	return {
		level1Items: level1.map(toNode),
		level2Items: groupBy(level2),
		level3Items: groupBy(level3),
		level4Items: groupBy(level4),
		level5Items: {},
		level6Items: {},
		level7Items: {},
		level8Items: {},
		level9Items: {},
		level10Items: {},
		levelNames: {
			level1: i18next.t("scenario.level_names.scenario"),
			level2: i18next.t("scenario.level_names.objective"),
			level3: i18next.t("scenario.level_names.function"),
			level4: i18next.t("scenario.level_names.means"),
		},
	}
}

export async function getScenariosWithTrees(treeId: string): Promise<string[]> {
	const { data, error } = await supabase
		.from("tree_nodes")
		.select("id, children_count")
		.eq("tree_id", treeId)
		.eq("level", 1)
		.gt("children_count", 0)

	if (error) return []

	return (data || []).map((node) => node.id)
}

export async function generateTreeWithContext({
	searchTheme,
	context,
	treeMode,
	teamId,
	treeId,
	user_id,
	language = getOutputLanguage(),
}: GenerateTreeWithContextParams): Promise<TreeGenerationResponse> {
	try {
		const edgeFunctionName =
			treeMode === "FAST" ? "generate-tree-fast-v3" : "generate-tree-v3"

		const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
			body: {
				searchTheme,
				context,
				team_id: teamId,
				user_id,
				treeId,
				language,
			},
		})

		if (error) {
			throw new Error(`Failed to generate tree: ${error.message}`)
		}

		if (!data?.success) {
			throw new Error(data?.error || "Tree generation failed")
		}

		return {
			success: true,
			treeId: data.treeId,
			message: data.message,
			scenarios: data.scenarios,
			implementations: data.implementations,
			status: data.status,
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		}
	}
}

export async function addScenariosToTree(
	treeId: string,
	context?: string,
	language = getOutputLanguage(),
): Promise<{ success: boolean; scenarios?: any[]; error?: string }> {
	try {
		const { data, error } = await supabase.functions.invoke(
			"add-scenarios-v5",
			{
				body: { tree_id: treeId, context, language },
			},
		)
		if (error) throw new Error(`Failed to add scenarios: ${error.message}`)
		return { success: true, ...data }
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		}
	}
}

export async function addManualScenario(
	treeId: string,
	name: string,
	description: string,
	teamId?: string,
	userId?: string,
): Promise<{ success: boolean; scenario?: any; error?: string }> {
	try {
		const { data: rootNode } = await supabase
			.from("tree_nodes")
			.select("id")
			.eq("tree_id", treeId)
			.eq("level", 0)
			.maybeSingle()

		const { count } = await supabase
			.from("tree_nodes")
			.select("id", { count: "exact", head: true })
			.eq("tree_id", treeId)
			.eq("level", 1)

		const { data, error } = await supabase
			.from("tree_nodes")
			.insert({
				id: crypto.randomUUID(),
				tree_id: treeId,
				team_id: teamId,
				user_id: userId,
				parent_id: rootNode?.id ?? null,
				name,
				description,
				axis: "Scenario" as any,
				level: 1,
				node_order: count ?? 0,
				children_count: 0,
			})
			.select("id, name, description, level")
			.single()

		if (error) throw error
		return { success: true, scenario: data }
	} catch (error) {
		const msg =
			error instanceof Error
				? error.message
				: ((error as any)?.message ?? JSON.stringify(error))
		return { success: false, error: msg }
	}
}

export async function checkTreeGenerationStatus(treeId: string): Promise<{
	isComplete: boolean
	completedCount: number
	totalCount: number
	scenarios?: Array<{ id: string; name: string; children_count: number }>
}> {
	try {
		const { data, error } = await supabase
			.from("tree_nodes")
			.select("id, name, children_count")
			.eq("tree_id", treeId)
			.eq("level", 1)
			.order("node_order")

		if (error) throw error

		const scenarios = data || []
		const totalCount = scenarios.length
		const completedCount = scenarios.filter(
			(s) => s.children_count != null && s.children_count > 0,
		).length
		const isComplete = completedCount === totalCount && totalCount > 0

		return {
			isComplete,
			completedCount,
			totalCount,
			scenarios: scenarios.map((s) => ({
				...s,
				children_count: s.children_count ?? 0,
			})),
		}
	} catch {
		return {
			isComplete: false,
			completedCount: 0,
			totalCount: 0,
		}
	}
}
