// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

// =============================================================================
// TYPE DEFINITIONS (Inlined from api-specifications/python-api-types.ts)
// =============================================================================

interface ScenarioTreeInput {
	treeId: string
	scenarioNode: TreeNodeInput
}

// New interface for use cases API request
interface UseCasesApiRequest {
	tree_id: string
	query: string
	scenario_node: {
		id: string
		title: string
		description: string
		level: number
		children: string[]
		keywords?: string[]
		context?: string
	}
}

interface TreeNodeInput {
	id: string
	title: string
	description?: string
	level: number
	children: TreeNodeInput[]
	keywords?: string[]
	context?: string
}

interface EnrichedScenarioResponse {
	treeId: string
	scenarioNode: EnrichedTreeNode
}

interface EnrichedTreeNode {
	id: string
	title: string
	description?: string
	level: number
	papers: Paper[]
	useCases?: UseCase[] // Optional since use cases API is not production ready
	children: EnrichedTreeNode[]
}

interface Paper {
	id: string
	title: string
	authors: string
	journal: string
	tags: string[]
	abstract: string
	date: string | null // Allow null dates for papers without publication dates
	citations: number
	region: string
	doi: string
	url: string
	score: number
}

interface UseCase {
	id: string
	product: string // Changed from 'title' to 'product'
	company: string[] // New field - array of company names
	description: string
	press_releases: string[] // Changed from complex object array to simple string array
}

const OPENAI_RESPONSES_CONFIG = {
	model: "gpt-4.1-mini",
	maxTokens: 32768,
	temperature: 0.7,
	presencePenalty: 0.3,
	frequencyPenalty: 0.3,
}

function makeJsonResponseRequestBody(systemPrompt: string, userPrompt: string) {
	return {
		model: OPENAI_RESPONSES_CONFIG.model,
		max_output_tokens: OPENAI_RESPONSES_CONFIG.maxTokens,
		temperature: OPENAI_RESPONSES_CONFIG.temperature,
		presence_penalty: OPENAI_RESPONSES_CONFIG.presencePenalty,
		frequency_penalty: OPENAI_RESPONSES_CONFIG.frequencyPenalty,
		text: { format: { type: "json_object" } },
		instructions: systemPrompt,
		input: userPrompt,
	}
}

function extractResponseText(response: any): string {
	if (typeof response.output_text === "string") {
		return response.output_text
	}

	const text = response.output
		?.flatMap((item: any) => item.content ?? [])
		?.filter((content: any) => content.type === "output_text")
		?.map((content: any) => content.text)
		?.join("")

	if (typeof text === "string" && text.length > 0) {
		return text
	}

	throw new Error("OpenAI response did not include output text")
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error)
}

function getErrorStack(error: unknown): string | undefined {
	return error instanceof Error ? error.stack : undefined
}

// =============================================================================
// PRODUCTION API FUNCTIONS
// =============================================================================

// Search articles API call
async function callTreePapersAPI(
	scenarioTree: ScenarioTreeInput,
	query: string,
): Promise<EnrichedScenarioResponse> {
	// Transform the data to match the API's expected snake_case format
	const apiPayload = transformToSnakeCase(scenarioTree, query)

	const res = await fetch(`${getSearchApiBaseUrl("stg")}/v5/search_articles`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: makeBasicAuthHeader(),
		},
		body: JSON.stringify(apiPayload),
	})

	if (!res.ok) {
		const text = await res.text()
		throw new Error(`search_articles API ${res.status}: ${text}`)
	}

	const response = await res.json()
	// Transform the response back to camelCase if needed
	return transformToCamelCase(response)
}

// Search market implementations API call
async function callUseCasesAPI(request: UseCasesApiRequest): Promise<any> {
	console.log(
		`[USECASES_API DEBUG] Sending request to search_market_impls API:`,
		JSON.stringify(request, null, 2),
	)

	const res = await fetch(
		`${getSearchApiBaseUrl("stg")}/v5/search_market_impls`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: makeBasicAuthHeader(),
			},
			body: JSON.stringify(request),
		},
	)

	if (!res.ok) {
		const text = await res.text()
		console.error(
			`[USECASES_API ERROR] API call failed with status ${res.status}:`,
			text,
		)
		throw new Error(`search_market_impls API ${res.status}: ${text}`)
	}

	const response = await res.json()
	console.log(
		`[USECASES_API DEBUG] Raw response from search_market_impls API:`,
		JSON.stringify(response, null, 2),
	)

	return response
}

// Helper function to prepare use cases API request
function prepareUseCasesApiRequest(
	treeId: string,
	query: string,
	scenarioNode: any,
): UseCasesApiRequest {
	const transformNodeForUseCases = (node: any): any => ({
		id: node.id,
		title: node.title,
		description: node.description || "",
		level: node.level,
		children: (node.children || []).map(
			(child: any) => child.id || child.title,
		), // Use IDs or titles as strings
		keywords: node.keywords || [],
		context: node.context || "",
	})

	return {
		tree_id: treeId,
		query: query,
		scenario_node: transformNodeForUseCases(scenarioNode),
	}
}

// Helper function to transform camelCase to snake_case for API
function transformToSnakeCase(data: ScenarioTreeInput, query: string): any {
	const transformNode = (node: any): any => ({
		id: node.id,
		title: node.title,
		description: node.description,
		level: node.level,
		children: node.children.map(transformNode),
		...(node.keywords && { keywords: node.keywords }),
		...(node.context && { context: node.context }),
	})

	return {
		tree_id: data.treeId, // Convert treeId to tree_id
		query: query, // Add the query parameter
		scenario_node: transformNode(data.scenarioNode), // Convert scenarioNode to scenario_node
	}
}

// Helper function to transform snake_case response back to camelCase
function transformToCamelCase(response: any): EnrichedScenarioResponse {
	const transformNode = (node: any): any => {
		const transformedUseCases = (node.use_cases || node.useCases || []).map(
			(useCase: any, index: number) => {
				// Handle both old and new API formats
				if (typeof useCase === "object" && useCase !== null) {
					return {
						id: useCase.id || crypto.randomUUID(),
						product: useCase.product || useCase.title || `Product ${index + 1}`,
						company: useCase.company || [],
						description: useCase.description || "",
						press_releases:
							useCase.press_releases || useCase.pressReleases || [],
					}
				}
				return useCase
			},
		)

		return {
			id: node.id,
			title: node.title,
			description: node.description,
			level: node.level,
			papers: (node.papers || []).map((paper: any) => ({
				...paper,
				date: validateAndFormatDate(paper.date),
				region: validateRegion(paper.region),
			})),
			useCases: transformedUseCases,
			children: (node.children || []).map(transformNode),
		}
	}

	return {
		treeId: response.tree_id || response.treeId, // Handle both formats
		scenarioNode: transformNode(
			response.scenario_node || response.scenarioNode,
		),
	}
}

// =============================================================================
// DATABASE FUNCTIONS
// =============================================================================

/**
 * Save papers for a specific node
 */
async function saveNodePapers(
	supabaseClient: any,
	nodeId: string,
	treeId: string,
	papers: Paper[],
	teamId: string | null,
	userId: string | null,
): Promise<void> {
	if (papers.length === 0) return

	const papersToInsert = papers.map((paper) => {
		const validatedDate = validateAndFormatDate(paper.date)
		const validatedRegion = validateRegion(paper.region)
		return {
			id: paper.id,
			node_id: nodeId,
			tree_id: treeId,
			title: paper.title,
			authors: paper.authors,
			journal: paper.journal,
			tags: paper.tags,
			abstract: paper.abstract,
			date: validatedDate,
			citations: paper.citations,
			region: validatedRegion,
			doi: paper.doi,
			url: paper.url,
			team_id: teamId,
			score: paper.score,
			user_id: userId,
		}
	})

	const { error } = await supabaseClient
		.from("node_papers")
		.insert(papersToInsert)

	if (error) {
		throw new Error(
			`Failed to save papers for node ${nodeId}: ${error.message}`,
		)
	}
}

/**
 * Save use cases for a specific node
 * Updated for new API structure:
 * - title -> product
 * - releases field removed
 * - company field added (array)
 * - pressReleases -> press_releases (string array)
 */
async function saveNodeUseCases(
	supabaseClient: any,
	nodeId: string,
	treeId: string,
	useCases: UseCase[],
	teamId: string | null,
	userId: string | null,
): Promise<void> {
	if (useCases.length === 0) return

	for (const [index, useCase] of useCases.entries()) {
		const { error: useCaseError } = await supabaseClient
			.from("node_use_cases")
			.insert({
				id: useCase.id,
				node_id: nodeId,
				tree_id: treeId,
				product: useCase.product,
				description: useCase.description,
				company: useCase.company || [],
				press_releases: useCase.press_releases || [],
				team_id: teamId,
				user_id: userId,
			})

		if (useCaseError) {
			console.error(
				`[USE_CASES] Failed to save use case ${index + 1} for node ${nodeId}:`,
				useCaseError,
			)
			throw new Error(
				`Failed to save use case ${
					index + 1
				} for node ${nodeId}: ${useCaseError.message}`,
			)
		}
	}
}

// =============================================================================
// STEP 2 INTERNAL PROCESSING FUNCTION
// =============================================================================

interface Step2Params {
	searchTheme: string
	implementationId: string
	implementationName: string
	implementationDescription: string
	treeId: string
	team_id: string | null
	supabaseClient: any
	openaiApiKey: string
	context?: string
	purpose?: string
	user_id: string | null
	language?: string
}

async function processStep2Internal(params: Step2Params): Promise<any> {
	const {
		searchTheme,
		implementationId,
		implementationName,
		implementationDescription,
		treeId,
		team_id,
		supabaseClient: sb,
		openaiApiKey,
		context,
		user_id,
		language,
	} = params

	console.log(
		`=== STEP 2 INTERNAL (FAST-V3): Generating subtree for implementation: ${implementationName} ===`,
	)

	/*──────── OpenAI Responses API for Step 2 ────────*/
	const oa = await fetch("https://api.openai.com/v1/responses", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${openaiApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(
			makeJsonResponseRequestBody(
				"You are a structured, concise assistant specialized in detailed technology subtree generation.",
				makeStepTwoPrompt(
					searchTheme,
					implementationName,
					implementationDescription,
					context,
					params.purpose,
					language,
				),
			),
		),
	})
	if (!oa.ok) throw new Error(`OpenAI ${oa.status}: ${await oa.text()}`)
	const gpt = await oa.json()
	let parsedResponse: any
	try {
		parsedResponse = JSON.parse(extractResponseText(gpt))
	} catch (parseError) {
		console.error(
			`[STEP 2 INTERNAL] Failed to parse OpenAI response:`,
			parseError,
		)
		throw new Error(
			`Failed to parse OpenAI response: ${getErrorMessage(parseError)}`,
		)
	}

	// Handle children array format (no implementation wrapper needed)
	let implementationNodes: BareNode[]
	if (parsedResponse.children && Array.isArray(parsedResponse.children)) {
		implementationNodes = parsedResponse.children
	} else if (parsedResponse.subtree?.children) {
		// Fallback: if model still returns subtree format, extract children
		implementationNodes = parsedResponse.subtree.children
		console.log(
			`[STEP 2 INTERNAL] Using subtree.children, found ${implementationNodes.length} implementation nodes`,
		)
	} else if (parsedResponse.name && parsedResponse.children) {
		// Fallback: if model returns implementation node, extract children
		implementationNodes = parsedResponse.children
		console.log(
			`[STEP 2 INTERNAL] Using implementation.children, found ${implementationNodes.length} implementation nodes`,
		)
	} else {
		console.error(
			`[STEP 2 INTERNAL] Invalid subtree structure for ${implementationName}. Available keys:`,
			Object.keys(parsedResponse),
		)
		console.error(`[STEP 2 INTERNAL] Full response:`, parsedResponse)
		throw new Error("Model returned malformed subtree")
	}

	/*──────── Save Bare Tree Structure First ────────*/
	console.log(
		`=== Saving bare tree structure for implementation: ${implementationName} ===`,
	)

	const subtreeWithIds = assignIdsToSubtree(implementationNodes)

	// Helper function to find node in subtree by title
	const findNodeInSubtree = (nodes: any[], title: string): any => {
		for (const node of nodes) {
			if (node.title === title) {
				return node
			}
			if (node.children && node.children.length > 0) {
				const found = findNodeInSubtree(node.children, title)
				if (found) return found
			}
		}
		return null
	}

	// Create mapping from enriched node IDs to saved node IDs
	const nodeIdMapping = new Map<string, string>()

	// Save bare tree nodes first (without enriched data)
	const saveSubtreeWithoutEnrichment = async (
		bareNode: BareNode,
		nodeId: string,
		enrichedNodeId: string,
		parentId: string,
		lvl: number,
		idx: number,
		user_id: string | null,
	) => {
		const axisForLevel = detectAxisFast(lvl)

		// Validate axis value exists in enum for FAST
		const validAxisValues = [
			"Technology",
			"How1",
			"How2",
			"How3",
			"How4",
			"How5",
			"How6",
			"How7",
		]

		if (!validAxisValues.includes(axisForLevel)) {
			console.error(
				`[SAVE] Invalid axis value: ${axisForLevel} for level ${lvl}`,
			)
			throw new Error(`Invalid axis value: ${axisForLevel} for level ${lvl}`)
		}

		// Save tree node without enriched data
		try {
			const { error } = await sb.from("tree_nodes").insert({
				id: nodeId,
				tree_id: treeId,
				parent_id: parentId,
				name: bareNode.name,
				description: bareNode.description ?? "",
				axis: axisForLevel as any,
				level: lvl,
				node_order: idx,
				children_count: bareNode.children?.length || 0,
				team_id: team_id || null,
				user_id: user_id || null,
			})

			if (error) {
				console.error(`[SAVE] Database error saving node ${nodeId}:`, error)
				throw new Error(`DB error (node ${nodeId}): ${error.message}`)
			}
		} catch (dbError) {
			console.error(`[SAVE] Failed to save node ${nodeId}:`, dbError)
			throw dbError
		}

		// Store the mapping for enrichment phase
		nodeIdMapping.set(enrichedNodeId, nodeId)

		// Recursively save children
		const children = bareNode.children || []
		for (let i = 0; i < children.length; i++) {
			// Find the corresponding child from subtreeWithIds
			const correspondingParent = findNodeInSubtree(
				subtreeWithIds,
				bareNode.name,
			)
			const childId =
				correspondingParent?.children?.[i]?.id || crypto.randomUUID()
			const childEnrichedId = correspondingParent?.children?.[i]?.id || childId
			await saveSubtreeWithoutEnrichment(
				children[i],
				childId,
				childEnrichedId,
				nodeId,
				lvl + 1,
				i,
				user_id,
			)
		}
	}

	// Save How2 nodes (level 2) and their subtrees first
	for (let i = 0; i < implementationNodes.length; i++) {
		const howTwoNodeId = subtreeWithIds[i].id
		await saveSubtreeWithoutEnrichment(
			implementationNodes[i],
			howTwoNodeId,
			subtreeWithIds[i].id, // Use same ID for enriched mapping
			implementationId,
			2, // How2 level
			i,
			user_id,
		)
	}

	// Update implementation node children_count after bare tree is saved
	const { error: updateError } = await sb
		.from("tree_nodes")
		.update({ children_count: implementationNodes.length })
		.eq("id", implementationId)

	if (updateError) {
		console.error(
			`[STEP 2 INTERNAL] Failed to update children_count for implementation ${implementationId}:`,
			updateError,
		)
	}

	console.log(
		`[STEP 2 INTERNAL] Bare tree structure saved for implementation: ${implementationName}`,
	)

	/*──────── Python API Enrichment ────────*/
	console.log(
		`=== Calling Papers API for enrichment: ${implementationName} ===`,
	)

	const implementationTreeInput = {
		treeId,
		scenarioNode: {
			id: implementationId,
			title: implementationName,
			description: implementationDescription,
			level: 1,
			children: subtreeWithIds,
		},
	}

	// Call Papers API (now after tree is already saved)
	console.log(`[STEP 2 INTERNAL] Calling papers API...`)
	let enrichedResponse: EnrichedScenarioResponse
	try {
		enrichedResponse = await callTreePapersAPI(
			implementationTreeInput,
			searchTheme,
		)
	} catch (apiErr) {
		console.error("[search_articles] API failed:", getErrorMessage(apiErr))
		throw new Error(`Papers API failed: ${getErrorMessage(apiErr)}`)
	}
	console.log(`=== Papers enrichment completed ===`)

	/*──────── Update Nodes with Enriched Data ────────*/

	// Save only enriched data (papers) to existing nodes
	const saveEnrichedDataOnly = async (
		enrichedNode: any,
		user_id: string | null,
	) => {
		// Get the actual saved node ID from mapping
		const actualNodeId = nodeIdMapping.get(enrichedNode.id)
		if (!actualNodeId) {
			console.warn(
				`[ENRICHMENT] No mapping found for enriched node ID: ${enrichedNode.id}, title: ${enrichedNode.title}`,
			)
			return
		}

		// Save enriched data for this node (papers only for now)
		try {
			if (enrichedNode.papers && enrichedNode.papers.length > 0) {
				await saveNodePapers(
					sb,
					actualNodeId,
					treeId,
					enrichedNode.papers,
					team_id,
					user_id,
				)
				console.log(
					`[ENRICHMENT] Saved ${enrichedNode.papers.length} papers for node: ${enrichedNode.title}`,
				)
			}
			// Use cases will be saved separately later
		} catch (enrichError) {
			console.error(
				`[ENRICHMENT] Failed to save enriched data for node ${actualNodeId}:`,
				enrichError,
			)
		}

		// Recursively save enriched data for children
		if (enrichedNode.children && enrichedNode.children.length > 0) {
			for (const enrichedChild of enrichedNode.children) {
				await saveEnrichedDataOnly(enrichedChild, user_id)
			}
		}
	}

	// Save enriched data for the implementation node and its entire subtree
	console.log(
		`[STEP 2 INTERNAL] Saving enriched data for implementation: ${implementationName}`,
	)

	// Save enriched data for the implementation node itself (papers only for now)
	try {
		if (
			enrichedResponse.scenarioNode.papers &&
			enrichedResponse.scenarioNode.papers.length > 0
		) {
			await saveNodePapers(
				sb,
				implementationId,
				treeId,
				enrichedResponse.scenarioNode.papers,
				team_id,
				user_id,
			)
			console.log(
				`[STEP 2 INTERNAL] Saved ${enrichedResponse.scenarioNode.papers.length} papers for implementation: ${implementationName}`,
			)
		}
		// Use cases will be saved separately later
	} catch (implementationEnrichError) {
		console.error(
			`[STEP 2 INTERNAL] Failed to save enriched data for implementation node ${implementationId}:`,
			implementationEnrichError,
		)
	}

	// Save enriched data for How2 nodes and their subtrees
	if (
		enrichedResponse.scenarioNode.children &&
		enrichedResponse.scenarioNode.children.length > 0
	) {
		for (const enrichedChild of enrichedResponse.scenarioNode.children) {
			await saveEnrichedDataOnly(enrichedChild, user_id)
		}
	}

	console.log(
		`[STEP 2 INTERNAL] Successfully completed subtree generation for implementation: ${implementationName}`,
	)
	return {
		success: true,
		implementationId,
		implementationName,
		howTwoNodesCount: implementationNodes.length,
		enrichedDataSaved: true,
		papersEnrichmentComplete: true,
		useCasesEnrichmentComplete: true, // Use cases are now handled at Step 1
	}
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Helper function to assign unique IDs to subtree nodes for API
function assignIdsToSubtree(nodes: BareNode[], startLevel: number = 2): any[] {
	return nodes.map((node, _index) => {
		const id = crypto.randomUUID()

		const result = {
			id,
			title: node.name,
			description: node.description || "",
			level: startLevel,
			children: assignIdsToSubtree(node.children || [], startLevel + 1),
		}
		return result
	})
}

// Domain types
interface BareNode {
	name: string
	description?: string
	children?: BareNode[]
}

// Function to determine axis based on level for FAST approach
function detectAxisFast(level: number): string {
	if (level === 0) {
		return "Technology" // Level 0 is Technology (root)
	} else if (level >= 1 && level <= 7) {
		return `How${level}` // Level 1 = How1, Level 2 = How2, ..., Level 7 = How7
	} else {
		return "How7" // Cap at How7 for levels beyond 7
	}
}

// Helper function to validate and format dates
function validateAndFormatDate(dateString: string | null): string | null {
	// Handle empty or null dates - return null instead of current date
	if (!dateString || dateString.trim() === "") {
		return null
	}

	// Check if the date is already in valid YYYY-MM-DD format
	if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
		// Validate that it's a real date
		const date = new Date(dateString)
		if (!Number.isNaN(date.getTime())) {
			return dateString
		}
	}

	// Try to parse other date formats
	const date = new Date(dateString)
	if (!Number.isNaN(date.getTime())) {
		const formattedDate = date.toISOString().split("T")[0]
		return formattedDate
	}

	// If all else fails, return null for invalid dates
	console.warn(`[DB] Invalid date format: "${dateString}", storing as null`)
	return null
}

// Helper function to validate region field
function validateRegion(region: string): "domestic" | "international" {
	if (!region || typeof region !== "string") {
		return "international"
	}

	const normalizedRegion = region.toLowerCase().trim()

	// Check for domestic indicators
	if (
		normalizedRegion.includes("domestic") ||
		normalizedRegion.includes("japan") ||
		normalizedRegion.includes("jp") ||
		normalizedRegion.includes("japanese")
	) {
		return "domestic"
	}

	// Check for international indicators
	if (
		normalizedRegion.includes("international") ||
		normalizedRegion.includes("global") ||
		normalizedRegion.includes("worldwide")
	) {
		return "international"
	}
	return "international"
}

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

// Step 1: Generate Root + How1 only (FAST approach)
const makeStepOnePrompt = (
	theme: string,
	context?: string,
	purpose?: string,
	domain?: string,
	mechanism?: string,
	language = "Japanese",
) =>
	`
<TECHNOLOGY_SEED> = ${theme}
<CONTEXT> = ${context || "None"}
<PURPOSE> = ${purpose || "None"}
<DOMAIN> = ${domain || "None"}
<MECHANISM> = ${mechanism || "None"}
<LANGUAGE> = ${language}

あなたは <TECHNOLOGY_SEED> の技術専門家です。
<TECHNOLOGY_SEED> を「原理の構造化（物理・化学的原理による分解）」の観点から分析してください。

目的は、既知の方式を帰納的に列挙することではなく、技術の中心メカニズムを
物理・化学的原理に分解し、そこから方式を演繹的に導出することです。
理論上ありうるが未実現の「空白」や物理的に不成立な組み合わせも内部では網羅し、
最終的に実現段階にある方式（商業化済／実証・パイロット／基礎研究）のみを出力します。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【内部思考（ユーザー非公開・出力しない）】

■ STEP0：分析スコープの宣言
  ・<TECHNOLOGY_SEED> の中心メカニズムを、広い定義／狭い定義の
    少なくとも2通りで言い換える。
    （例：「電池」＝「電気エネルギーを蓄える技術」（広）／
     「化学エネルギーを電気に変換する技術」（狭））
  ・本分析で採用するスコープを1つ選び、理由を確定する。
  ・<CONTEXT>/<PURPOSE>/<DOMAIN>/<MECHANISM> が提供されている場合は、
    スコープ選定と原理軸抽出に反映する。
  ・採用スコープから外れる隣接技術を把握し、なぜ外したかを意識する。

■ STEP1：現象を原理に分解する
  ・採用スコープのもとで中心メカニズムを特定する
    （エネルギー変換／物質変換／情報変換 など）。
  ・成立に必要な物理・化学的サブプロセスを列挙する。
  ・各サブプロセスについて確認する：
    - 欠けると現象自体が成立しないか（不可欠性）
    - 列挙したサブプロセスだけで現象が完結するか（十分性）
  ・各サブプロセスを左右する物理・化学的変数を把握する
    （温度・圧力・材料・電荷・波長・濃度 など）。

■ STEP2：原理軸を抽出する
  ・各サブプロセスごとに、方式を分岐させる「原理軸」を抽出する。
  ・各軸は以下を満たすこと：
    - 軸の値が変わるとサブプロセスの物理・化学的振る舞いが
      質的に変わる（効率・耐久性の差ではなく機構自体の差）。
    - 軸同士が独立（一軸を固定しても他軸が物理的に制約されない）。
  ・独立でない場合は軸を統合するか片方を従属変数として外す。
  ・軸は原則3〜5本に絞る。多い場合は独立性を再検討するか階層化する。
  ・原理軸 vs 実装の工夫の判定：
    - 違いを消すと中心メカニズムのサブプロセス自体が別物になる → 原理軸
    - 効率・耐久性・コストだけが変わる → 実装の工夫（除外）
  ・各軸の「質的に区別される取りうる値」を列挙する。
    相転移・反応機構の変化など質的境界で区切り、
    量的な違い（200℃と250℃など）では区切らない。
  ・軸間に従属制約（ある値が他軸の値を強制/禁止する）があれば記録する。

■ STEP3：直積で全方式を導出し分類する
  ・各軸の値を直積で組み合わせ、論理的にありうる全方式を導出する。
  ・組み合わせの総数を明示的に数える（例：3値×4値×3値＝36通り）。
  ・★D・E も含めて全セルを必ず埋める。A/B/C だけを探す帰納に陥らない。
  ・各方式を以下に分類する：
    - A. 商業化済
    - B. 実証・パイロット段階
    - C. 基礎研究段階
    - D. 理論上ありうるが実現例なし（原理的な空白）
    - E. 物理・化学的に矛盾するため不成立
  ・STEP2で記録した軸間制約に抵触する組み合わせは E とする。
  ・「Aが見つからないから」という理由で安易にD扱いしない。
    実在を確認できる方式は必ずA/B/Cに分類する。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【出力仕様】
◆ ルートは **1 つの JSON オブジェクト**。
  "root" オブジェクト
   • name: "Technology Seed: ${theme}" で始める。
   • description: 「構造化の概要」を200〜250字で記す。次の3点を必ず含める：
     ① 採用スコープと分解した中心メカニズム
     ② 抽出した各原理軸が「どのサブプロセスの、どんな質的差異を分けているか」の説明（軸ごとに一言）
     ③ なぜそれらを分岐の主軸として選定したか
        （＝どの軸の差異が方式を最も大きく分けるか）
   • children: 分類が A・B・C の方式のみを第1階層ノードとして列挙する。
◆ 各方式ノードは
   { "name": string, "description": string, "children": [] }
   だけを含むこと。
   • name: 実在する方式の名称をできるだけ正確に書く。方式名は技術文書の見出しとして自然な名詞句にし、
     変更前の一般的な方式名から大きく外れる言い換えや、読者が同一方式と認識しにくい抽象化を避ける。
     末尾に「（パイロット段階）」「（基礎研究段階）」「（商業化済）」などの成熟度・段階ラベルを付けない。
   • description: 100〜180字程度の自己完結した概要文にする。次を自然な文章として含める：
     - 「何を」「どのように作用させ」「何が起こるか」というプロセス・メカニズム
     - 反応条件、触媒・材料・場の役割、学習・評価・最適化の方法、従来法との違いなど、技術的ポイントを把握できる補足
     - 用途例だけで補足を済ませず、方式の成立条件や特徴を少なくとも1文で説明する
     - 軸の観点は必要に応じて文中で説明するが、「軸①＝○○／軸②＝○○」のような分類ラベルの羅列にしない
     - 「本質的差異・備考：」などの見出し語をそのまま本文に含めない
     - 体言止めや専門用語の圧縮を避け、助詞・接続表現を使って論理関係を明示する

【方式ノードの表現例】
NG name: 熱触媒による炭酸塩類と固定窒素化合物反応方式（パイロット段階）
OK name: 熱触媒による炭酸塩類と固定窒素化合物の反応方式
NG description: 軸①＝分子N2／軸②＝CO2／軸③＝生物触媒 本質的差異・備考：生体内酵素群活用によるN2およびCO2直接結合による尿素類似体生成の基礎研究領域。
OK description: 生物触媒を用いて分子状窒素と二酸化炭素を温和な条件下で活性化し、酵素反応により尿素類似体の形成を目指す方式。高温高圧の化学合成ではなく、生体由来触媒の選択性を利用する点が特徴である。
NG description: 環境との相互作用により報酬を最大化する方針を浅層ネットワークで学習し、単純構造で行動価値を評価する方式である。動画ゲームや単純ロボット制御に利用される。
OK description: 環境との相互作用を通じて得られる報酬を最大化する方針を、単純な浅層ネットワークで学習し、逐次的に行動の価値を評価して最適化を図る方式である。小規模な制御問題に適した簡潔な構造を持ち、動画ゲームや単純なロボット制御に利用される。
◆ ルート name は必ず "Technology Seed: ${theme}" で始める。
◆ 出力言語は必ず指定された言語（<LANGUAGE>）で統一すること。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【分析の前提として root.description に含める内容】
・採用した分析スコープ（広義/狭義のどちらをなぜ採用したか）
・分解した中心メカニズム
・抽出した原理軸の一覧（軸名と取りうる値）
・直積の総数と内訳（A/B/C/D/E の各件数）
 ※D・Eは件数のみ記し、個別方式は列挙しない。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【方針・禁止事項】
- 帰納（既知の事例集め）ではなく演繹（原理の直積から導く）で進める。
- 分析スコープを途中で広げない（広げたくなったらSTEP0に戻る）。
- 「実装の工夫」（効率・耐久性・コストのみの差）を軸にしない。
- 量的差異（数値の刻み）で軸の値を区切らない。
- D・Eを導出段階で省略しない（内部では必ず全セルを埋める）。
- 最終リストにはA・B・C以外を載せない。
- 各方式ノードの name に成熟度・段階ラベルを含めない。成熟度は内部分類にとどめ、出力名には書かない。
- 各方式ノードの description は分類表のセル説明ではなく、単体で読める技術概要にする。
- description では「軸①＝」「軸②＝」「軸③＝」「本質的差異」「備考：」などのラベル表現を禁止する。
- description では「単純構造で評価する」「高精度に処理する」などの圧縮表現だけで済ませず、何を基準にどう評価・最適化・反応させるかを説明する。
- 用途例は補足として扱い、用途例だけを条件・特徴の説明の代替にしない。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【最終セルフチェック（出力前に内部で確認）】
□ 構造化の概要が200〜250字で、各軸の説明と軸選定の理由を含むか
□ 各軸の値が変わると機構自体が質的に変わるか（実装の工夫でないか）
□ 軸同士が物理的に独立しているか
□ 軸の数は3〜5本に収まっているか
□ 直積の総数を数え、全セルをA〜Eで埋めたか
□ 実在する方式をD扱いで取りこぼしていないか
□ 最終リストにA・B・Cのみを載せたか
□ 各方式名に「（パイロット段階）」「（基礎研究段階）」などの段階紹介が残っていないか
□ 各方式の概要は、主題・述語が揃った完全な文で構成されているか
□ 各方式の概要は、分類軸や表の見出しを参照しなくても単体で理解できるか
□ 各方式の概要は、プロセス・メカニズムと条件・特徴を自然な文章で説明しているか
□ 各方式の概要に「軸①＝」「本質的差異・備考」などのラベル羅列が含まれていないか
□ 各方式の概要は、評価・最適化・反応の基準や方法を説明しており、用途例だけで技術的補足を済ませていないか

セルフチェック合格後、JSON を出力してください。
`

// Step 2: Generate subtree for a specific implementation method (FAST approach)
const makeStepTwoPrompt = (
	theme: string,
	implementationName: string,
	implementationDescription: string,
	context?: string,
	purpose?: string,
	language = "Japanese",
) =>
	language === "English"
		? `
<TECHNOLOGY_SEED> = ${theme}
<IMPLEMENTATION_METHOD> = ${implementationName}
<IMPLEMENTATION_DESCRIPTION> = ${implementationDescription}
<CONTEXT> = ${context || "None"}
<PURPOSE> = ${purpose || "None"}

You are a technology expert on <TECHNOLOGY_SEED>.
**Step 2**: Generate a detailed subtree for the specific implementation method "${implementationName}".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Internal reasoning — not shown to user]

0-A Divide the techniques for realizing <IMPLEMENTATION_METHOD> into MECE segments.
0-B If <CONTEXT> is provided, prioritize techniques and component technologies highly relevant to that context.
0-C If <PURPOSE> is provided, select techniques with that goal in mind.
0-D For each technique, list the required component technologies (≥3, variable count).
0-D For each component technology, identify 1 core technology and list all required support technologies (1+, variable).
0-E For each technology, ask "Can this be further decomposed?" and drill down as deeply as possible (layer 5+).
0-F Review all layers, verify MECE and variable node counts, and adjust.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Output specification]
◆ Top level is a **technique node array**.
  "children" array
   • Output the child nodes (technique array) of the implementation method directly.
   • Do not include the implementation method node itself (already saved).
◆ Each node contains only:
   { "name": string, "description": string, "children": [] }
◆ Leaf nodes have children: [].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Layer definitions]
• Layer 1 (How2) — techniques detailing how the implementation method works
• Layer 2 (How3) — component technologies composing each technique
• Layer 3+ (How4+) — nest component technologies as deeply as needed (variable depth and count)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Prohibited]
• Redundant phrases like "main technology", "auxiliary technology", "technology called X"
• Generic components (not specific to the technology seed) mixed in as core technologies
• Market-needs or use-case-centric thinking

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MECE & variable-count self-check]
□ No overlapping roles or content within a layer?
□ Child nodes collectively explain the parent completely?
□ Node counts are not suspiciously uniform?
□ No generic components mixed in as core technologies?
□ No drillable technologies cut off prematurely?

Output JSON after passing the self-check.
`
		: `
<TECHNOLOGY_SEED> = ${theme}
<IMPLEMENTATION_METHOD> = ${implementationName}
<IMPLEMENTATION_DESCRIPTION> = ${implementationDescription}
<CONTEXT> = ${context || "None"}
<PURPOSE> = ${purpose || "None"}

あなたは <TECHNOLOGY_SEED> の技術専門家です。
**第2段階**: 特定の実装方式「${implementationName}」の詳細なサブツリーを生成してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【内部思考（ユーザー非公開）】

0-A <IMPLEMENTATION_METHOD> を実現するための技術手法を MECE に分割。
0-B <CONTEXT> が提供されている場合は、そのコンテキストに関連性の高い技術手法や要素技術を優先的に生成。
0-C <PURPOSE> が提供されている場合は、その目的を重視して技術手法を選定。
0-D 各技術手法ごとに必要な要素技術を列挙（≥3 件、個数非固定）。
0-D 要素技術ごとに **コア技術 1 件** を決定し、
   必要な **サポート技術 1 件以上・可変** を漏れなく列挙。
0-E 各技術を「さらに要素技術へ分解できるか？」と自問し、
   可能な限り掘り下げ（第 5 階層以降）。
0-F 全階層を再点検し MECE と "非固定数" を確認し調整。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【出力仕様】
◆ トップレベルは **技術手法ノード配列**。
  "children" 配列
   • 実装方式の子ノード（技術手法配列）を直接出力。
   • 実装方式ノード自体は含めない（既に保存済み）。
◆ 各ノードは
   { "name": string, "description": string, "children": [] }
   だけを含むこと。
◆ 末端ノードは children: []。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【各階層の定義】
• 第1階層（How2層）… 実装方式を「どのように詳細化するか」の技術手法
• 第2階層（How3層）… 技術手法を「どのように構成するか」の要素技術
• 第3階層以降（How4+層）… 要素技術を必要なだけ技術的にネスト（深さ・個数可変）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【禁止事項】
• 「主技術」「補助技術」「という技術」等の冗長語
• 技術シーズ固有でない汎用部品がコア技術に混在
• 市場ニーズや用途中心の発想

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【MECE & 非固定数セルフチェック】
□ 階層内で役割・内容が重複していないか
□ 下位ノード総和で上位を完全に説明できるか
□ *ノード数がそろい過ぎ* になっていないか
□ 技術シーズ固有でない汎用部品がコア技術に混在していないか
□ 深掘り可能な技術を途中で打ち切っていないか

セルフチェック合格後、JSON を出力してください。
`

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
}

// =============================================================================
// EDGE FUNCTION ENTRY POINT
// =============================================================================

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { status: 200, headers: CORS })
	}

	try {
		const requestBody = await req.json()
		console.log(`[MAIN] Received request:`, {
			method: req.method,
			hasSearchTheme: !!requestBody.searchTheme,
			hasTeamId: !!requestBody.team_id,
		})

		const {
			searchTheme,
			team_id: rawTeamId,
			context,
			treeId,
			user_id: rawUserId,
			purpose,
			domain,
			mechanism,
			specificImplementation,
			language: rawLanguage,
		} = requestBody

		const lang = String(rawLanguage ?? "")
			.toLowerCase()
			.startsWith("en")
			? "English"
			: "Japanese"

		if (!searchTheme) {
			return new Response(
				JSON.stringify({ error: "searchTheme is required" }),
				{
					status: 400,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
		const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
		const SUPABASE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
		if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_ROLE_KEY) {
			throw new Error("Server mis-config (env vars)")
		}

		const sb = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY)

		// Resolve user_id and team_id — prefer values from body, fall back to JWT+DB
		// This handles the race condition where userDetails hasn't loaded on the frontend yet
		let user_id: string | null = (rawUserId as string | undefined) || null
		let team_id: string | null = (rawTeamId as string | undefined) || null
		if (!user_id || !team_id) {
			const authHeader = req.headers.get("authorization")
			if (authHeader?.startsWith("Bearer ")) {
				const token = authHeader.slice(7)
				const {
					data: { user },
				} = await sb.auth.getUser(token)
				if (user && !user_id) user_id = user.id
			}
			if (user_id && !team_id) {
				const { data: ud } = await sb
					.from("v_user_details")
					.select("team_id")
					.eq("user_id", user_id)
					.single()
				if (ud?.team_id) team_id = ud.team_id
			}
			if (!user_id) {
				console.warn("[MAIN] Could not resolve user_id from body or JWT")
			}
			if (!team_id) {
				console.warn("[MAIN] Could not resolve team_id for user", user_id)
			}
		}

		// If a specificImplementation is provided with a treeId, skip Step 1 (LLM + DB inserts)
		// and run Step 2 only for that pre-existing node.
		if (specificImplementation && treeId) {
			const {
				id: implId,
				name: implName,
				description: implDescription,
			} = specificImplementation as {
				id: string
				name: string
				description?: string
			}

			console.log(
				`[MAIN] specificImplementation mode: generating subtree for node ${implId} (${implName})`,
			)

			processStep2Internal({
				searchTheme,
				implementationId: implId,
				implementationName: implName,
				implementationDescription: implDescription || "",
				treeId,
				team_id,
				supabaseClient: sb,
				openaiApiKey: OPENAI_API_KEY,
				context,
				purpose,
				user_id,
				language: lang,
			}).catch((err: Error) =>
				console.error(
					`[SPECIFIC_IMPL] Step 2 failed for ${implName}: ${err.message}`,
				),
			)

			return new Response(
				JSON.stringify({
					success: true,
					treeId,
					message: `Subtree generation started for: ${implName}`,
					implementations: [{ id: implId, name: implName }],
					status: "generating",
				}),
				{
					status: 200,
					headers: { ...CORS, "Content-Type": "application/json" },
				},
			)
		}

		console.log("=== GENERATING COMPLETE FAST TECHNOLOGY TREE V3 ===")

		/*──────── OpenAI Responses API for Step 1 ────────*/
		const oa = await fetch("https://api.openai.com/v1/responses", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(
				makeJsonResponseRequestBody(
					"You are a structured, concise assistant specialized in FAST technology tree generation.",
					makeStepOnePrompt(
						searchTheme,
						context,
						purpose,
						domain,
						mechanism,
						lang,
					),
				),
			),
		})
		if (!oa.ok) throw new Error(`OpenAI ${oa.status}: ${await oa.text()}`)
		const gpt = await oa.json()

		const parsedResponse = JSON.parse(extractResponseText(gpt))

		// Handle both formats: direct tree structure or wrapped in root
		let treeRoot: BareNode
		if (parsedResponse.root?.children) {
			treeRoot = parsedResponse.root
		} else if (parsedResponse.name && parsedResponse.children) {
			treeRoot = parsedResponse
		} else {
			console.error(
				"Invalid tree structure. Expected root.children or direct tree, got:",
				parsedResponse,
			)
			throw new Error("Model returned malformed tree")
		}

		// 🔒 PROGRAMMATICALLY ENSURE IMPLEMENTATION CHILDREN ARE EMPTY
		// This guarantees no misalignment regardless of AI output
		if (treeRoot.children) {
			treeRoot.children.forEach((implementation) => {
				implementation.children = [] // Force empty children for all implementations
			})
		}

		// Generate basic layer config for FAST approach
		const dynamicLayerConfig = ["Technology", "How1", "How2", "How3", "How4"]

		/*──────── Supabase Step 1 ────────*/
		let tt: { id: string }
		let rootNodeId: string

		if (treeId) {
			// If treeId is provided, we're adding implementations to an existing tree
			console.log(`[MAIN] Adding implementations to existing tree: ${treeId}`)

			// Get existing tree data
			const { data: existingTree, error: getTreeErr } = await sb
				.from("technology_trees")
				.select("id")
				.eq("id", treeId)
				.single()

			if (getTreeErr || !existingTree) {
				throw new Error(`Tree with ID ${treeId} not found`)
			}

			tt = existingTree

			// Get existing root node
			const { data: existingRoot, error: getRootErr } = await sb
				.from("tree_nodes")
				.select("id")
				.eq("tree_id", treeId)
				.eq("level", 0)
				.single()

			if (getRootErr || !existingRoot) {
				throw new Error(`Root node for tree ${treeId} not found`)
			}

			rootNodeId = existingRoot.id
		} else {
			// Create new tree as before
			console.log(
				`[MAIN] Creating new FAST tree for search theme: ${searchTheme}`,
			)

			// 1️⃣ technology_trees - Save root metadata
			const { data: newTree, error: ttErr } = await sb
				.from("technology_trees")
				.insert({
					name: treeRoot.name,
					description: treeRoot.description ?? "",
					search_theme: searchTheme,
					reasoning:
						parsedResponse.reasoning ??
						`Generated FAST tree for: ${searchTheme}`,
					layer_config: dynamicLayerConfig,
					scenario_inputs: parsedResponse.scenario_inputs ?? {
						what: null,
						who: null,
						where: null,
						when: null,
					},
					mode: "FAST", // FAST mode indicator
					team_id: team_id || null,
					user_id: user_id || null,
				})
				.select("id")
				.single()
			if (ttErr) throw new Error(`DB error (tree): ${ttErr.message}`)

			tt = newTree

			// 2️⃣ Insert root node at level 0 (Technology level)
			rootNodeId = crypto.randomUUID()
			const { error: rootError } = await sb.from("tree_nodes").insert({
				id: rootNodeId,
				tree_id: tt.id,
				parent_id: null,
				name: treeRoot.name,
				description: treeRoot.description ?? "",
				axis: "Technology" as any,
				level: 0,
				node_order: 0,
				children_count: treeRoot.children?.length || 0,
				team_id: team_id || null,
				user_id: user_id || null,
			})
			if (rootError) {
				throw new Error(`DB error (root node): ${rootError.message}`)
			}
		}

		// 3️⃣ Insert implementation nodes (level 1 = How1) with children_count = 0 (indicating pending generation)
		// For existing trees, we need to get the current highest node_order for implementations
		let startNodeOrder = 0
		if (treeId) {
			const { data: existingImplementations, error: getImplErr } = await sb
				.from("tree_nodes")
				.select("node_order")
				.eq("tree_id", treeId)
				.eq("level", 1)
				.order("node_order", { ascending: false })
				.limit(1)

			if (
				!getImplErr &&
				existingImplementations &&
				existingImplementations.length > 0
			) {
				startNodeOrder = existingImplementations[0].node_order + 1
			}
		}

		const children = treeRoot.children || []
		const implementationPromises = children.map(async (implementation, idx) => {
			const implementationId = crypto.randomUUID()
			const { error } = await sb.from("tree_nodes").insert({
				id: implementationId,
				tree_id: tt.id,
				parent_id: rootNodeId,
				name: implementation.name,
				description: implementation.description ?? "",
				axis: "How1" as any,
				level: 1,
				node_order: startNodeOrder + idx,
				children_count: 0, // Important: Set to 0 to indicate subtree not generated yet
				team_id: team_id || null,
				user_id: user_id || null,
			})
			if (error) {
				throw new Error(`DB error (implementation node): ${error.message}`)
			}
			return {
				id: implementationId,
				name: implementation.name,
				description: implementation.description,
			}
		})
		const implementations = await Promise.all(implementationPromises)

		// Update root node's children_count if adding to existing tree
		if (treeId) {
			const { data: currentRoot, error: getCurrentRootErr } = await sb
				.from("tree_nodes")
				.select("children_count")
				.eq("id", rootNodeId)
				.single()

			if (!getCurrentRootErr && currentRoot) {
				const newChildrenCount =
					currentRoot.children_count + implementations.length
				const { error: updateRootErr } = await sb
					.from("tree_nodes")
					.update({ children_count: newChildrenCount })
					.eq("id", rootNodeId)

				if (updateRootErr) {
					console.error(
						`[STEP 1] Failed to update root children_count:`,
						updateRootErr,
					)
				}
			}
		}

		console.log(
			`[STEP 1] Created ${implementations.length} implementations, starting enrichment and Step 2 generation`,
		)

		// 🆕 NEW: Call Use Cases API for each implementation at Step 1 with empty children
		console.log(
			`[STEP 1] Starting use cases enrichment for implementation nodes...`,
		)

		const useCasePromises = implementations.map(async (implementation) => {
			try {
				console.log(
					`[STEP 1 USECASES] Processing implementation: ${implementation.name}`,
				)

				// Prepare implementation node with empty children for use cases API
				const implementationNodeForUseCases = {
					id: implementation.id,
					title: implementation.name,
					description: implementation.description || "",
					level: 1,
					children: [], // Empty children array as requested
					keywords: [],
					context: "",
				}

				// Prepare use cases API request
				const useCasesRequest = prepareUseCasesApiRequest(
					tt.id,
					searchTheme, // Use searchTheme as query
					implementationNodeForUseCases,
				)

				let useCasesResponse: any
				try {
					// Try production use cases API first
					useCasesResponse = await callUseCasesAPI(useCasesRequest)
					console.log(
						`[STEP 1 USECASES] Production API succeeded for implementation: ${implementation.name}`,
					)
				} catch (apiErr) {
					console.error(
						"[STEP 1 USECASES] Production API failed:",
						getErrorMessage(apiErr),
					)
					// Don't throw here - use cases are optional at Step 1
					// Just log the error and continue without use cases data
					console.log(
						`[STEP 1 USECASES] Skipping use cases for implementation: ${implementation.name}`,
					)
					return {
						implementation: implementation.name,
						success: false,
						error: `Use Cases API failed: ${getErrorMessage(apiErr)}`,
					}
				}

				// Save use cases data for the implementation node
				if (useCasesResponse.scenarioNode || useCasesResponse.scenario_node) {
					const enrichedImplementationNode =
						useCasesResponse.scenarioNode || useCasesResponse.scenario_node

					if (
						enrichedImplementationNode.useCases &&
						enrichedImplementationNode.useCases.length > 0
					) {
						await saveNodeUseCases(
							sb,
							implementation.id,
							tt.id,
							enrichedImplementationNode.useCases,
							team_id,
							user_id,
						)
						console.log(
							`[STEP 1 USECASES] Saved ${enrichedImplementationNode.useCases.length} use cases for implementation: ${implementation.name}`,
						)
					}

					// Handle use_cases field as well (API response format)
					if (
						enrichedImplementationNode.use_cases &&
						enrichedImplementationNode.use_cases.length > 0
					) {
						await saveNodeUseCases(
							sb,
							implementation.id,
							tt.id,
							enrichedImplementationNode.use_cases,
							team_id,
							user_id,
						)
						console.log(
							`[STEP 1 USECASES] Saved ${enrichedImplementationNode.use_cases.length} use cases (from use_cases field) for implementation: ${implementation.name}`,
						)
					}
				}

				return {
					implementation: implementation.name,
					success: true,
				}
			} catch (error) {
				console.error(
					`[STEP 1 USECASES] Error processing use cases for implementation ${implementation.name}:`,
					error,
				)
				return {
					implementation: implementation.name,
					success: false,
					error: getErrorMessage(error),
				}
			}
		})

		// Fire off use cases enrichment in background (don't await)
		Promise.allSettled(useCasePromises)
			.then((useCaseResults) => {
				const successfulUseCases = useCaseResults.filter(
					(r) => r.status === "fulfilled",
				).length
				const failedUseCases = useCaseResults.filter(
					(r) => r.status === "rejected",
				).length
				console.log(
					`[STEP 1 USECASES] Use cases enrichment completed: ${successfulUseCases} successful, ${failedUseCases} failed`,
				)
			})
			.catch((error) => {
				console.error("[STEP 1 USECASES] Error in use cases processing:", error)
			})

		// Start Step 2 generation for each implementation asynchronously with proper error handling
		const step2Promises = implementations.map(async (implementation) => {
			try {
				console.log(
					`[STEP 1] Starting Step 2 for implementation: ${implementation.name} (ID: ${implementation.id})`,
				)

				// Call Step 2 logic directly (not via HTTP) to avoid recursive endpoint calls
				const step2Result = await processStep2Internal({
					searchTheme,
					implementationId: implementation.id,
					implementationName: implementation.name,
					implementationDescription: implementation.description || "",
					treeId: tt.id,
					team_id,
					supabaseClient: sb,
					openaiApiKey: OPENAI_API_KEY,
					context,
					purpose,
					user_id,
					language: lang,
				})

				console.log(
					`[STEP 1] Step 2 completed for implementation: ${implementation.name}`,
					step2Result,
				)
				return {
					implementation: implementation.name,
					success: true,
					result: step2Result,
				}
			} catch (error) {
				console.error(
					`[STEP 1] Error in Step 2 for implementation ${implementation.name}:`,
					{
						message: getErrorMessage(error),
						stack: getErrorStack(error),
					},
				)
				return {
					implementation: implementation.name,
					success: false,
					error: getErrorMessage(error),
				}
			}
		})

		// Start Step 2 processes for each implementation in background
		console.log(
			`[STEP 1] Starting ${implementations.length} Step 2 processes in background...`,
		)

		// Use a completely detached approach - no promise chains that could block function termination
		// Schedule background processing in a way that won't prevent function completion
		const backgroundProcessor = async () => {
			try {
				const results = await Promise.allSettled(step2Promises)
				const successful = results.filter(
					(r) => r.status === "fulfilled",
				).length
				const failed = results.filter((r) => r.status === "rejected").length
				console.log(
					`[COMPLETE] All Step 2 processes completed: ${successful} successful, ${failed} failed`,
				)

				if (failed > 0) {
					const failedResults = results
						.filter((r) => r.status === "rejected")
						.map((r, i) => ({
							implementation: implementations[i]?.name || "Unknown",
							error: r.reason?.message || r.reason,
						}))
					console.error(`[COMPLETE] Failed implementations:`, failedResults)
				}
			} catch (error) {
				console.error(
					`[COMPLETE] Error in background Step 2 processing:`,
					error,
				)
			}
		}

		// Execute background processing without any awaiting or promise chaining
		// This ensures the main function can complete immediately
		backgroundProcessor() // Fire and forget

		// Return immediately so implementations appear in UI with generating indicators
		const message = treeId
			? `Added ${implementations.length} new implementations to existing tree. Use cases enrichment started, subtrees generating in background.`
			: "FAST tree generation started (V3). Implementations created, use cases enrichment started, subtrees generating in background."

		return new Response(
			JSON.stringify({
				success: true,
				treeId: tt.id,
				message,
				implementations: implementations.map((i) => ({
					id: i.id,
					name: i.name,
				})),
				status: "generating", // Indicates background processing is active
			}),
			{
				status: 200,
				headers: { ...CORS, "Content-Type": "application/json" },
			},
		)
	} catch (err: any) {
		console.error("=== EDGE FUNCTION ERROR (FAST-V3) ===")
		console.error("Error details:", {
			message: err.message,
			name: err.name,
			stack: err.stack,
			cause: err.cause,
		})

		// Log the request details for debugging
		console.error("Request context:", {
			method: req.method,
			url: req.url,
			headers: Object.fromEntries(req.headers.entries()),
		})

		// Try to parse request body for additional context
		try {
			const requestBody = await req.clone().json()
			console.error("Request body:", requestBody)
		} catch (bodyError) {
			console.error("Could not parse request body:", getErrorMessage(bodyError))
		}

		console.error("=== END ERROR DETAILS ===")

		return new Response(
			JSON.stringify({
				error: err.message ?? "unknown",
				details: err.stack ?? "No stack trace available",
			}),
			{
				status: 500,
				headers: { ...CORS, "Content-Type": "application/json" },
			},
		)
	}
})
