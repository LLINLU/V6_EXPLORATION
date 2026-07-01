// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import {
	getSearchApiBaseUrl,
	makeBasicAuthHeader,
} from "../_shared/search-api.ts"

const getErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error)

const getErrorStack = (error: unknown): string | undefined =>
	error instanceof Error ? error.stack : undefined

// ---------------------------------------------------------------------------
// Search market implementations API call
// ---------------------------------------------------------------------------
async function callUseCasesAPI(request: UseCasesApiRequest): Promise<any> {
	//console.log(`[USECASES_API DEBUG] Sending request to search_market_impls API:`, JSON.stringify(request, null, 2));

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

// ---------------------------------------------------------------------------
// Search articles API call
// ---------------------------------------------------------------------------
async function callTreePapersAPI(
	scenarioTree: ScenarioTreeInput,
	query: string,
): Promise<EnrichedScenarioResponse> {
	// Transform the data to match the API's expected snake_case format
	const apiPayload = transformToSnakeCase(scenarioTree, query)

	// DEBUG: Log the input being sent to search_articles API
	console.log(
		`[DEBUG] search_articles API input payload:`,
		JSON.stringify(apiPayload, null, 2),
	)
	console.log(`[DEBUG] search_articles API query:`, query)
	console.log(
		`[DEBUG] search_articles API scenarioTree:`,
		JSON.stringify(scenarioTree, null, 2),
	)

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
		console.error(`[DEBUG] search_articles API error response:`, text)
		console.error(`[DEBUG] search_articles API error status:`, res.status)
		throw new Error(`search_articles API ${res.status}: ${text}`)
	}

	const response = await res.json()
	console.log(
		`[DEBUG] search_articles API success response:`,
		JSON.stringify(response, null, 2),
	)
	// Transform the response back to camelCase if needed
	return transformToCamelCase(response)
}
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// STEP 2 INTERNAL PROCESSING FUNCTION
interface Step2Params {
	searchTheme: string
	scenarioId: string
	scenarioName: string
	scenarioDescription: string
	treeId: string
	team_id: string | null
	supabaseClient: any
	openaiApiKey: string
	context?: string
	purpose?: string
	user_id?: string | null
}

async function processStep2Internal(params: Step2Params): Promise<any> {
	const {
		searchTheme,
		scenarioId,
		scenarioName,
		scenarioDescription,
		treeId,
		team_id,
		supabaseClient: sb,
		openaiApiKey,
		context,
		user_id,
	} = params

	console.log(
		`=== STEP 2 INTERNAL: Generating subtree for scenario: ${scenarioName} ===`,
	)

	/*──────── OpenAI for Step 2 ────────*/
	const oa = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${openaiApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "gpt-4.1",
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content:
						"You are a structured, concise assistant specialized in detailed technology subtree generation.",
				},
				{
					role: "user",
					content: makeStepTwoPrompt(
						searchTheme,
						scenarioName,
						scenarioDescription,
						context,
						params.purpose,
					),
				},
			],
		}),
	})
	if (!oa.ok) throw new Error(`OpenAI ${oa.status}: ${await oa.text()}`)
	const gpt = await oa.json()
	let parsedResponse: any
	try {
		parsedResponse = JSON.parse(gpt.choices[0].message.content)
	} catch (parseError) {
		console.error(parseError)
		throw new Error(
			`Failed to parse OpenAI response: ${getErrorMessage(parseError)}`,
		)
	}

	// Handle children array format (no scenario wrapper needed)
	let purposeNodes: BareNode[]
	if (parsedResponse.children && Array.isArray(parsedResponse.children)) {
		purposeNodes = parsedResponse.children
	} else if (parsedResponse.subtree?.children) {
		// Fallback: if model still returns subtree format, extract children
		purposeNodes = parsedResponse.subtree.children
		console.log(
			`[STEP 2 INTERNAL] Using subtree.children, found ${purposeNodes.length} purpose nodes`,
		)
	} else if (parsedResponse.name && parsedResponse.children) {
		// Fallback: if model returns scenario node, extract children
		purposeNodes = parsedResponse.children
		console.log(
			`[STEP 2 INTERNAL] Using scenario.children, found ${purposeNodes.length} purpose nodes`,
		)
	} else {
		console.error(
			`[STEP 2 INTERNAL] Invalid subtree structure for ${scenarioName}. Available keys:`,
			Object.keys(parsedResponse),
		)
		console.error(`[STEP 2 INTERNAL] Full response:`, parsedResponse)
		throw new Error("Model returned malformed subtree")
	}
	/*──────── Save Bare Tree Structure First ────────*/
	console.log(
		`=== Saving bare tree structure for scenario: ${scenarioName} ===`,
	)

	const subtreeWithIds = assignIdsToSubtree(purposeNodes)

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
	) => {
		const axisForLevel = detectAxis(lvl)

		// Validate axis value exists in enum
		const validAxisValues = [
			"Root",
			"Scenario", //level 1
			"Purpose", //level 2
			"Function", //level 3
			"Measure",
			"Measure2",
			"Measure3",
			"Measure4",
			"Measure5",
			"Measure6",
			"Measure7",
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
			)
		}
	}

	// Save purpose nodes (level 2) and their subtrees first
	for (let i = 0; i < purposeNodes.length; i++) {
		const purposeNodeId = subtreeWithIds[i].id
		await saveSubtreeWithoutEnrichment(
			purposeNodes[i],
			purposeNodeId,
			subtreeWithIds[i].id, // Use same ID for enriched mapping
			scenarioId,
			2, // Purpose level
			i,
		)
	}

	// Update scenario node children_count after bare tree is saved
	const { error: updateError } = await sb
		.from("tree_nodes")
		.update({ children_count: purposeNodes.length })
		.eq("id", scenarioId)

	if (updateError) {
		console.error(
			`[STEP 2 INTERNAL] Failed to update children_count for scenario ${scenarioId}:`,
			updateError,
		)
	}

	console.log(
		`[STEP 2 INTERNAL] Bare tree structure saved for scenario: ${scenarioName}`,
	)

	/*──────── Python API Enrichment ────────*/
	console.log(`=== Calling Papers API for enrichment: ${scenarioName} ===`)

	const scenarioTreeInput = {
		treeId,
		scenarioNode: {
			id: scenarioId,
			title: scenarioName,
			description: scenarioDescription,
			level: 1,
			children: subtreeWithIds,
		},
	}
	// Call Papers API (now after tree is already saved)
	console.log(`[STEP 2 INTERNAL] Calling papers API...`)
	let enrichedResponse: EnrichedScenarioResponse
	try {
		enrichedResponse = await callTreePapersAPI(scenarioTreeInput, searchTheme)
	} catch (apiErr) {
		const apiErrorMessage = getErrorMessage(apiErr)
		console.error("[search_articles] API failed:", apiErrorMessage)
		throw new Error(`Papers API failed: ${apiErrorMessage}`)
	}
	console.log(`=== Papers enrichment completed ===`)

	/*──────── Update Nodes with Enriched Data ────────*/

	// Save only enriched data (papers) to existing nodes
	const saveEnrichedDataOnly = async (enrichedNode: any) => {
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
				await saveEnrichedDataOnly(enrichedChild)
			}
		}
	}

	// Save enriched data for the scenario node and its entire subtree
	console.log(
		`[STEP 2 INTERNAL] Saving enriched data for scenario: ${scenarioName}`,
	)

	// Save enriched data for the scenario node itself (papers only for now)
	try {
		if (
			enrichedResponse.scenarioNode.papers &&
			enrichedResponse.scenarioNode.papers.length > 0
		) {
			await saveNodePapers(
				sb,
				scenarioId,
				treeId,
				enrichedResponse.scenarioNode.papers,
				team_id,
				user_id,
			)
			console.log(
				`[ENRICHMENT] Saved ${enrichedResponse.scenarioNode.papers.length} papers for scenario: ${scenarioName}`,
			)
		}
		// Use cases will be saved separately later
	} catch (scenarioEnrichError) {
		console.error(
			`[STEP 2 INTERNAL] Failed to save enriched data for scenario node ${scenarioId}:`,
			scenarioEnrichError,
		)
	}

	// Save enriched data for purpose nodes and their subtrees
	if (
		enrichedResponse.scenarioNode.children &&
		enrichedResponse.scenarioNode.children.length > 0
	) {
		for (const enrichedChild of enrichedResponse.scenarioNode.children) {
			await saveEnrichedDataOnly(enrichedChild)
		}
	}
	/*──────── Generate Summaries ────────*/
	console.log(
		`[STEP 2 INTERNAL] Generating summaries for scenario: ${scenarioName}`,
	)

	// Generate summaries for all nodes in the enriched response
	await generateSummariesRecursively(
		enrichedResponse.scenarioNode,
		searchTheme,
		sb,
		treeId,
		team_id || null,
		user_id ?? null,
		openaiApiKey,
	)

	console.log(
		`[STEP 2 INTERNAL] Successfully completed subtree generation for scenario: ${scenarioName}`,
	)
	return {
		success: true,
		scenarioId,
		scenarioName,
		purposeNodesCount: purposeNodes.length,
		enrichedDataSaved: true,
		papersEnrichmentComplete: true,
		useCasesEnrichmentComplete: true, // Use cases are now handled at Step 1
		summariesGenerated: true,
	}
}

// =============================================================================
// SUMMARY GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate paper summary using GPT-4o
 */
async function generatePaperSummary(
	papers: Paper[],
	query: string,
	openaiApiKey: string,
): Promise<string> {
	// Use top 5 papers by score
	const topPapers = papers.sort((a, b) => b.score - a.score).slice(0, 5)

	if (topPapers.length === 0) {
		return "この検索条件に該当する論文は見つかりませんでした。"
	}

	const papersText = topPapers
		.map(
			(paper) =>
				`Title:${paper.title} Date:(${
					paper.date || "N/A"
				}) Author:${paper.authors}`,
		)
		.join("\n")

	const prompt = `### **ユーザーのペルソナ (User Persona)**
* 複数の論文を短時間で把握し、研究背景や全体像を整理することを目的としている。
* 300字前後の統合要約を用いて、研究の方向性や空白領域を把握したい。

---
### **AIのペルソナ (Assistant Persona)**
* あなたは学術論文の要約を専門とする研究アナリスト。
* 各論文を分析し、**主要な知見 (Main Findings)**、**方法論 (Methodologies)**、**研究の意義 (Implications)** を明確に抽出できる。
* 簡潔だが学術的な日本語で要約を作成する。

---
### **手順 (Chain of Thought):**

1. 提示された論文群の **タイトル・日付・著者** 情報を基に内容を推測し、論文の主題を把握する。
2. 各論文について、可能な範囲で**主要な知見・方法論・意義**を簡潔にまとめる。
3. 共通点・相違点を分析し、全体像を俯瞰する300字程度の日本語要約を作成する。
4. 学術的トーンを保ちつつ、流れを自然に整える。

---
### **入力形式:**

\`\`\`
Query: ${query}

Papers:
${papersText}
\`\`\`
---
### **出力形式:**

* 日本語で600字程度の学術的要約
* 各研究の知見・方法論・意義を俯瞰し、全体像を整理

**出力例:(plain text)**

\`\`\`
人工知能（AI）は近年急速に進化し、社会のあらゆる分野で幅広く応用されています。AIシステムは、機械学習、深層ニューラルネットワーク、自然言語処理などの高度な技術を組み合わせ、膨大なデータを解析して予測や分類といった複雑なタスクを遂行する能力を備えています（Kulkarni, 2024）。医療分野においては、遠隔地や医療資源が不足している地域でのメンタルヘルス支援を目的として、AIを用いたバーチャル心理療法デバイスの開発が進められており、患者個々の状態に合わせた適応型のカウンセリングや症状モニタリングが可能になりつつあります（Singh et al., 2024）。さらに、AIや機械学習は銀行、交通、製造業、教育といった産業にも導入が進み、オペレーション効率化やコスト削減、新たなサービスモデルの創出を促進しています（Soni et al., 2023）。

一方で、AIの普及は課題も伴います。大量の個人データを扱うことによるプライバシー侵害の懸念、雇用構造の変化による失業リスク、アルゴリズムバイアスや説明責任の欠如といった倫理的問題が指摘されています（Akpabio et al., 2024）。これらに対処するため、透明性を高めたAIモデルの開発や法的・倫理的ガイドラインの整備が不可欠です。将来的には、汎用人工知能（AGI）の登場に加え、ブロックチェーンや5G通信ネットワークなどの先端技術との統合が見込まれ、AIの可能性はさらに拡大するでしょう（Akpabio et al., 2024）。その恩恵を最大化し、リスクを最小化するためには、国際的な協調と責任ある開発姿勢が求められています（Soni et al., 2023）。
\`\`\``

	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${openaiApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content:
						"あなたは学術論文の要約を専門とする研究アナリストです。簡潔だが学術的な日本語で要約を作成してください。",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 1000,
			temperature: 0.3,
		}),
	})

	if (!response.ok) {
		console.error(`[SUMMARY] OpenAI API error: ${response.status}`)
		return "要約の生成中にエラーが発生しました。"
	}

	const result = await response.json()
	return result.choices[0].message.content.trim()
}

/**
 * Generate use case summary using GPT-4o
 */
async function generateUseCaseSummary(
	useCases: UseCase[],
	query: string,
	openaiApiKey: string,
): Promise<string> {
	if (useCases.length === 0) {
		return "この検索条件に該当するユースケースは見つかりませんでした。"
	}

	const useCasesText = useCases
		.map((useCase) => {
			const pressReleases =
				Array.isArray(useCase.press_releases) &&
				useCase.press_releases.length > 0
					? useCase.press_releases
							.map((pr) => `<a href="${pr}" target="_blank">${pr}</a>`)
							.join(", ")
					: "N/A"
			return `Product: ${useCase.product}\nCompany: ${
				Array.isArray(useCase.company)
					? useCase.company.join(", ")
					: useCase.company
			}\nDescription: ${useCase.description}\nPress Releases: ${pressReleases}`
		})
		.join("\n\n")

	const prompt = `### ユーザーのペルソナ (User Persona)
- あなたは研究者、アナリスト、戦略立案担当者のいずれかであり、
- 製品・技術に関する大量のユースケース情報を整理し、共通するトレンドや課題を把握したい。
- 全体像を深く理解して、ビジネス戦略や研究の方向性に活かすことを目的としている。

### アシスタントのペルソナ (Assistant Persona)
- あなたは大量の製品・技術情報を統合して分析する専門のリサーチアナリスト。
- 多分野（医療、IT、製造、エネルギー、消費財など）にわたる技術・製品を分析し、
特徴・用途・価値・動向・課題を論理的かつ網羅的に整理することができる。
- ユーザーが戦略的意思決定や研究計画立案に使える深いインサイトを提供する。

### 出力要件
1. 最初から内容に入り、解説的な前置きは書かない。
2. 各製品や技術の名称、企業名、特徴、用途、導入背景を具体的に織り込みながらまとめる。
3. 製品の分野・カテゴリごとに構造化し、段落を明確に分ける。
4. 各カテゴリの共通する動向や課題、全体に共通するトレンド・今後の示唆を必ず含める。
5. 出力は日本語で **1000字程度** の長文にし、論理性と読みやすさを意識して構成する。

### 入力:
Query: ${query}

Usecases:

${useCasesText}

### 出力:
- 日本語の詳細サマリー（1000字）
- カテゴリごとの大きな段落構成で整理
- 各製品の特徴や価値を深掘り、分野間の関係性や全体のトレンドも含める
- HTMLリンクを適切に含める（必ず <a href="URL" target="_blank">リンクテキスト</a> 形式で出力）

### 出力例
<div>
医薬品分野では<a href="https://www.pfizer.co.jp/pfizer/company/press/2023" target="_blank">ファイザーの「ジェノトロピン」</a>がプラダー・ウィリ症候群の体組成異常に対する適応追加承認を取得した。また<a href="https://www.pfizer.co.jp/pfizer/company/press/2023" target="_blank">「ベバシズマブBS点滴静注100mgおよび400mg『ファイザー』」</a>も適応症追加が承認され、がん治療領域での選択肢が拡大した。円形脱毛症の新しい治療薬としては<a href="https://www.pfizer.co.jp/pfizer/company/press/2023" target="_blank">「リットフーロ® カプセル50mg」</a>が発売され、自己免疫性疾患への対応力が向上している。さらに抗ウイルス薬<a href="https://www.pfizer.co.jp/pfizer/company/press/2023" target="_blank">「パキロビッド®」</a>の一般流通が始まり、医療従事者向けの総合窓口<a href="https://www.pfizer.co.jp/pfizer/company/press/2023" target="_blank">「Pfizer Connect」</a>も展開が進む。
医療IT領域では、<a href="https://hc-i.tech/" target="_blank">ヘルスケアイノベーションテクノロジーの「PHRアプリ」</a>が健康情報の活用を推進し、<a href="https://hc-i.tech/" target="_blank">「健診結果閲覧システム」</a>や<a href="https://hc-i.tech/" target="_blank">「Web問診システム」</a>が医療機関向けの開発支援として提供されている。これにより患者データの収集と活用が効率化され、医療現場のデジタル化が一層進んでいる。

新興技術分野では、<a href="https://www.inpart.io/blog/17-top-healthcare-innovations-2023" target="_blank">Inpartの「Cost-effective gaze-tracking system for surgical environments」</a>が外科手術中の術者視線をリアルタイムに追跡し、精度と安全性を高めることを目指している。同社はさらに、海藻由来の<a href="https://www.inpart.io/blog/17-top-healthcare-innovations-2023" target="_blank">「Seaweed-based wearable sensors」</a>を開発し、リアルタイムでの健康モニタリングを可能にした。また、妊娠中の胎児発育不全リスクを非侵襲的に検出する<a href="https://www.inpart.io/blog/17-top-healthcare-innovations-2023" target="_blank">「Non-invasive platform for detecting small-for-gestational-age risks」</a>も注目されている。

これらの事例は、製薬・医療IT・新興デバイスの各分野で高度化が進んでいることを示している。共通するトレンドとして、医療現場のデジタル化と精密化が進み、患者の安全性向上や診療効率化、製造・運用プロセスの合理化が重視されている。今後はAIやデータ連携の進化により、これらの技術の融合が加速し、医療のパラダイムシフトがさらに推進されるだろう。
</div>`

	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${openaiApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content:
						"あなたは大量の製品・技術情報を統合して分析する専門のリサーチアナリストです。HTMLリンクを含む日本語の詳細サマリーを作成してください。",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 2000,
			temperature: 0.3,
		}),
	})

	if (!response.ok) {
		console.error(`[SUMMARY] OpenAI API error: ${response.status}`)
		return "要約の生成中にエラーが発生しました。"
	}

	const result = await response.json()
	return result.choices[0].message.content.trim()
}

/**
 * Recursively generate summaries for all nodes in the enriched tree
 */
async function generateSummariesRecursively(
	enrichedNode: any,
	query: string,
	supabaseClient: any,
	treeId: string,
	teamId: string | null,
	userId: string | null,
	openaiApiKey: string,
): Promise<void> {
	try {
		// Generate paper summary if node has papers
		if (enrichedNode.papers && enrichedNode.papers.length > 0) {
			console.log(
				`[SUMMARY] Generating paper summary for node: ${enrichedNode.title}`,
			)

			const paperSummary = await generatePaperSummary(
				enrichedNode.papers,
				query,
				openaiApiKey,
			)

			// Save paper summary to database
			const { error: paperSummaryError } = await supabaseClient
				.from("node_papers_summary")
				.upsert({
					node_id: enrichedNode.id,
					tree_id: treeId,
					user_id: userId,
					team_id: teamId,
					summary: paperSummary,
					query: query,
					papers_count: Math.min(enrichedNode.papers.length, 5),
				})

			if (paperSummaryError) {
				console.error(
					`[SUMMARY] Failed to save paper summary for node ${enrichedNode.id}:`,
					paperSummaryError,
				)
			} else {
				console.log(
					`[SUMMARY] Saved paper summary for node: ${enrichedNode.title}`,
				)
			}
		}

		// Note: Use case summaries are now generated at Step 1 when use cases are first saved
		// This ensures summaries are available immediately when use cases are loaded

		// Recursively generate summaries for children
		if (enrichedNode.children && enrichedNode.children.length > 0) {
			for (const child of enrichedNode.children) {
				await generateSummariesRecursively(
					child,
					query,
					supabaseClient,
					treeId,
					teamId,
					userId,
					openaiApiKey,
				)
			}
		}
	} catch (error) {
		console.error(
			`[SUMMARY] Error generating summaries for node ${enrichedNode.id}:`,
			error,
		)
	}
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
			(useCase: any, _index: number) => {
				const transformed = {
					id: useCase.id,
					product: useCase.product,
					company: useCase.company || [],
					description: useCase.description,
					press_releases: useCase.press_releases || [],
				}
				return transformed
			},
		)

		return {
			id: node.id,
			title: node.title,
			description: node.description,
			level: node.level,
			papers: (node.papers || []).map((paper: any) => ({
				...paper,
				date: validateAndFormatDate(paper.date), // Validate dates from API
				region: validateRegion(paper.region), // Validate regions from API
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

/**
 * Save papers for a specific node
 */
async function saveNodePapers(
	supabaseClient: any,
	nodeId: string,
	treeId: string,
	papers: Paper[],
	teamId: string | null,
	userId?: string | null,
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
			date: validatedDate, // This will be either a valid date string or null
			citations: paper.citations,
			region: validatedRegion, // This will be either "domestic" or "international"
			doi: paper.doi,
			url: paper.url,
			team_id: teamId,
			score: paper.score,
			user_id: userId || null,
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
async function _saveNodeUseCases(
	supabaseClient: any,
	nodeId: string,
	treeId: string,
	useCases: UseCase[],
	teamId: string | null,
	userId?: string | null,
): Promise<void> {
	if (useCases.length === 0) return

	for (const [_index, useCase] of useCases.entries()) {
		const { error: useCaseError } = await supabaseClient
			.from("node_use_cases")
			.insert({
				id: useCase.id,
				node_id: nodeId,
				tree_id: treeId,
				product: useCase.product,
				description: useCase.description,
				company: useCase.company || [],
				press_releases: useCase.press_releases || [], // Save press releases directly in the use case record
				team_id: teamId,
				user_id: userId || null,
			})

		if (useCaseError) {
			console.error(
				`[SAVE_USECASES ERROR] Failed to save use case:`,
				useCaseError,
			)
			throw new Error(
				`Failed to save use case for node ${nodeId}: ${useCaseError.message}`,
			)
		}
	}
}

/**
 * Save use cases for a specific node AND generate summary immediately
 * This combines use case saving with summary generation for efficiency
 */
async function saveNodeUseCasesWithSummary(
	supabaseClient: any,
	nodeId: string,
	treeId: string,
	useCases: UseCase[],
	teamId: string | null,
	userId: string | null,
	query: string,
	openaiApiKey: string,
): Promise<void> {
	if (useCases.length === 0) return

	// Save use cases first
	for (const [_index, useCase] of useCases.entries()) {
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
				user_id: userId || null,
			})

		if (useCaseError) {
			console.error(
				`[SAVE_USECASES ERROR] Failed to save use case:`,
				useCaseError,
			)
			throw new Error(
				`Failed to save use case for node ${nodeId}: ${useCaseError.message}`,
			)
		}
	}

	// Generate and save summary immediately after saving use cases
	console.log(`[SUMMARY] Generating use case summary for node: ${nodeId}`)

	try {
		const useCaseSummary = await generateUseCaseSummary(
			useCases,
			query,
			openaiApiKey,
		)

		// Save use case summary to database
		const { error: useCaseSummaryError } = await supabaseClient
			.from("node_usecases_summary")
			.upsert({
				node_id: nodeId,
				tree_id: treeId,
				user_id: userId,
				team_id: teamId,
				summary: useCaseSummary,
				query: query,
				usecases_count: useCases.length,
			})

		if (useCaseSummaryError) {
			console.error(
				`[SUMMARY] Failed to save use case summary for node ${nodeId}:`,
				useCaseSummaryError,
			)
		} else {
			console.log(`[SUMMARY] Saved use case summary for node: ${nodeId}`)
		}
	} catch (summaryError) {
		console.error(
			`[SUMMARY] Error generating use case summary for node ${nodeId}:`,
			summaryError,
		)
		// Don't throw here - use case saving should succeed even if summary fails
	}
}

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

// ---------- domain types ----------
interface BareNode {
	name: string
	description?: string
	children?: BareNode[]
}

// Function to determine axis based on level
function detectAxis(level: number): string {
	const axisMap = ["Root", "Scenario", "Purpose", "Function", "Measure"]
	if (level < axisMap.length) {
		return axisMap[level]
	} else {
		return `Measure${level - axisMap.length + 2}` // e.g., level 5 => Measure2, 6 => Measure3
	}
}

/**
 * Recursively save use cases for all nodes in the tree
 */
// async function saveUseCasesRecursively(
//   enrichedNode: any,
//   treeId: string,
//   supabaseClient: any,
//   teamId: string | null
// ): Promise<void> {
//   try {
//     // Save use cases for current node
//     if (enrichedNode.useCases && enrichedNode.useCases.length > 0) {
//       await saveNodeUseCases(
//         supabaseClient,
//         enrichedNode.id,
//         treeId,
//         enrichedNode.useCases,
//         teamId
//       );
//       console.log(
//         `[ASYNC USECASES] Saved ${enrichedNode.useCases.length} use cases for node: ${enrichedNode.title}`
//       );
//     }

//     // Handle use_cases field as well (API response format)
//     if (enrichedNode.use_cases && enrichedNode.use_cases.length > 0) {
//       await saveNodeUseCases(
//         supabaseClient,
//         enrichedNode.id,
//         treeId,
//         enrichedNode.use_cases,
//         teamId
//       );
//       console.log(
//         `[ASYNC USECASES] Saved ${enrichedNode.use_cases.length} use cases for node: ${enrichedNode.title}`
//       );
//     }

//     // Recursively save for children
//     if (enrichedNode.children && enrichedNode.children.length > 0) {
//       for (const child of enrichedNode.children) {
//         await saveUseCasesRecursively(child, treeId, supabaseClient, teamId);
//       }
//     }
//   } catch (error) {
//     console.error(
//       `[ASYNC USECASES] Error saving use cases for node ${enrichedNode.id}:`,
//       error
//     );
//   }
// }

// ----- Step 1: Generate Root + Scenarios only -----
const makeStepOnePrompt = (
	theme: string,
	context?: string,
	purpose?: string,
	domain?: string,
	mechanism?: string,
) => `
<SEARCH_THEME> = ${theme}
<CONTEXT> = ${context || "None"}
<PURPOSE> = ${purpose || "None"}
<DOMAIN> = ${domain || "None"}
<MECHANISM> = ${mechanism || "None"}

あなたは <SEARCH_THEME> の専門家です。
**第1段階**: ルート（検索テーマ）と第1階層（シナリオ）のみを生成してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【内部思考（ユーザー非公開）】

0-A　<SEARCH_THEME> を 5 語以内で要約し核心概念を抽出。
0-B　<CONTEXT> が提供されている場合は、そのコンテキストを考慮して活用シナリオを生成。
0-C　<PURPOSE> が提供されている場合は、その研究目的を重視して活用シナリオを生成。
0-D　<DOMAIN> が提供されている場合は、その技術領域を考慮して活用シナリオを生成。
0-E　<MECHANISM> が提供されている場合は、その仕組み・観点を反映して活用シナリオを生成。
0-F　概念から **活用シナリオ** を重複なく列挙。
　　 ★最初は多めに洗い出し（7 件以上可）、重複・冗長を削りつつ 3〜7 件に整える。
　　 ★<PURPOSE>、<DOMAIN>、<MECHANISM>が提供されている場合は、これらの要素に関連性の高いシナリオを優先的に生成。
　　 ★<CONTEXT>が提供されている場合は、そのコンテキストに関連性の高いシナリオを優先的に生成。
0-D　各シナリオの概要説明を簡潔に記述（詳細は第2段階で展開）。
0-E　シナリオ間でMECE（重複なし・漏れなし）を確認し調整。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【出力仕様】
◆ ルートは **1 つの JSON オブジェクト**。
  "root" オブジェクト
  　• name: "Search Theme: ${theme}" で始める。
  　• description: ルート概要（英語か日本語いずれでも可）。
  　• children: シナリオ配列（第1階層のみ）。
◆ 各シナリオノードは
   { "name": string, "description": string, "children": [] }
◆ ルート name は必ず "Search Theme: ${theme}" で始める。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【第1階層の定義】
• シナリオ … <検索テーマ> を活用した「〜というシナリオ」
　例: "医療現場での診断支援"、"教育分野での個別指導"など

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【禁止事項】
• 汎用的すぎるシナリオは避ける（テーマ固有にする）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【MECEセルフチェック】
□ シナリオ間で役割・内容が重複していないか
□ シナリオ総和でテーマの主要活用領域を網羅しているか

セルフチェック合格後、JSON を出力してください。
`

// ----- Step 2: Generate subtree for a specific scenario -----
const makeStepTwoPrompt = (
	theme: string,
	scenarioName: string,
	scenarioDescription: string,
	context?: string,
	purpose?: string,
) => `
<SEARCH_THEME> = ${theme}
<SCENARIO> = ${scenarioName}
<SCENARIO_DESCRIPTION> = ${scenarioDescription}
<CONTEXT> = ${context || "None"}
<PURPOSE> = ${purpose || "None"}

あなたは <SEARCH_THEME> の専門家です。
**第2段階**: 特定のシナリオ「${scenarioName}」の詳細なサブツリーを生成してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【内部思考（ユーザー非公開）】

0-A　<SCENARIO> を達成するための目的を MECE に分割。
0-B　<CONTEXT> が提供されている場合は、そのコンテキストに関連性の高い目的や機能を優先的に生成。
0-C　<PURPOSE> が提供されている場合は、その研究目的を重視して目的や機能を生成。
0-D　各目的ごとに必要な機能を列挙（≥3 件、個数非固定）。
0-E　機能ごとに **中核技術 1 件** を決定し、
　　　必要な **補完技術 1 件以上・可変** を漏れなく列挙。
0-F　各技術を「さらに要素技術へ分解できるか？」と自問し、
　　　可能な限り掘り下げ（第 5 階層以降）。
0-G　全階層を再点検し MECE と "非固定数" を確認し調整。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【出力仕様】
◆ トップレベルは **目的ノード配列**。
  "children" 配列
  　• シナリオの子ノード（目的配列）を直接出力。
  　• シナリオノード自体は含めない（既に保存済み）。
◆ 各ノードは
   { "name": string, "description": string, "children": [] }
   だけを含むこと。
◆ 末端ノードは children: []。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【各階層の定義】
• 第1階層 … シナリオを達成する「〜という目的」
• 第2階層 … 目的を構成する「〜という機能」
• 第3階層 … 機能を実現する技術
    - 1 行目＝中核技術（テーマ固有）
    - 2 行目以降＝補完技術（≧1、数は可変）
• 第4階層以降 … 要素技術を必要なだけネスト（深さ・個数可変）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【禁止事項】
• 「主技術」「補完技術」「という技術」等の冗長語
• テーマ固有でない汎用部品が中核技術に混在

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【MECE & 非固定数セルフチェック】
□ 階層内で役割・内容が重複していないか
□ 下位ノード総和で上位を完全に説明できるか
□ *ノード数がそろい過ぎ* になっていないか
□ テーマ固有でない汎用部品が中核技術に混在していないか
□ 深掘り可能な技術を途中で打ち切っていないか

セルフチェック合格後、JSON を出力してください。
`

/*──────────────────── cors ────────────────────*/
const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
}

/*──────────────────── edge entry ────────────────*/
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
			mode: requestBody.mode,
			searchMode: requestBody.searchMode,
			socialProblemMode: requestBody.socialProblemMode,
		})

		const {
			searchTheme,
			team_id,
			context,
			treeId,
			user_id,
			purpose,
			domain,
			mechanism,
			mode,
			searchMode,
			socialProblemMode,
		} = requestBody
		const normalizedMode =
			typeof mode === "string" ? mode.trim().toUpperCase() : "TED"
		const normalizedSearchMode =
			typeof searchMode === "string" ? searchMode.trim().toUpperCase() : ""
		const treeMode =
			normalizedMode === "SOCIAL_PROBLEM" ||
			normalizedSearchMode === "SOCIAL_PROBLEM" ||
			socialProblemMode === true
				? "SOCIAL_PROBLEM"
				: "TED"
		console.log("[MAIN] Mode resolution:", {
			receivedMode: mode,
			receivedSearchMode: searchMode,
			receivedSocialProblemMode: socialProblemMode,
			normalizedMode,
			normalizedSearchMode,
			treeMode,
		})

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
		console.log("=== GENERATING COMPLETE TECHNOLOGY TREE ===")

		/*──────── OpenAI for Step 1 ────────*/
		const oa = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4.1",
				response_format: { type: "json_object" },
				messages: [
					{
						role: "system",
						content:
							"You are a structured, concise assistant specialized in technology tree generation.",
					},
					{
						role: "user",
						content: makeStepOnePrompt(
							searchTheme,
							context,
							purpose,
							domain,
							mechanism,
						),
					},
				],
			}),
		})
		if (!oa.ok) throw new Error(`OpenAI ${oa.status}: ${await oa.text()}`)
		const gpt = await oa.json()

		const parsedResponse = JSON.parse(gpt.choices[0].message.content)

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

		// 🔒 PROGRAMMATICALLY ENSURE SCENARIO CHILDREN ARE EMPTY
		// This guarantees no misalignment regardless of AI output
		if (treeRoot.children) {
			treeRoot.children.forEach((scenario) => {
				scenario.children = [] // Force empty children for all scenarios
			})
		}

		// Generate basic layer config for TED approach (will be updated later)
		const dynamicLayerConfig = ["Scenario", "Purpose", "Function", "Measure"]

		/*──────── Supabase Step 1 ────────*/
		let tt: { id: string }
		let rootNodeId: string

		if (treeId) {
			// If treeId is provided, we're adding scenarios to an existing tree
			console.log(`[MAIN] Adding scenarios to existing tree: ${treeId}`)

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
			console.log(`[MAIN] Creating new tree for search theme: ${searchTheme}`)

			// 1️⃣ technology_trees - Save root metadata
			const { data: newTree, error: ttErr } = await sb
				.from("technology_trees")
				.insert({
					name: treeRoot.name,
					description: treeRoot.description ?? "",
					search_theme: searchTheme,
					reasoning:
						parsedResponse.reasoning ??
						`Generated TED tree for: ${searchTheme}`,
					layer_config: dynamicLayerConfig,
					scenario_inputs: parsedResponse.scenario_inputs ?? {
						what: null,
						who: null,
						where: null,
						when: null,
					},
					mode: treeMode, // TED-compatible mode indicator
					team_id: team_id || null,
					user_id: user_id || null,
				})
				.select("id")
				.single()
			if (ttErr) throw new Error(`DB error (tree): ${ttErr.message}`)
			console.log("[MAIN] Created technology tree:", {
				treeId: newTree.id,
				mode: treeMode,
			})

			tt = newTree

			// 2️⃣ Insert root node at level 0
			rootNodeId = crypto.randomUUID()
			const { error: rootError } = await sb.from("tree_nodes").insert({
				id: rootNodeId,
				tree_id: tt.id,
				parent_id: null,
				name: treeRoot.name,
				description: treeRoot.description ?? "",
				axis: "Root" as any,
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

		// 3️⃣ Insert scenario nodes (level 1) with children_count = 0 (indicating pending generation)
		// For existing trees, we need to get the current highest node_order for scenarios
		let startNodeOrder = 0
		if (treeId) {
			const { data: existingScenarios, error: getScenarioErr } = await sb
				.from("tree_nodes")
				.select("node_order")
				.eq("tree_id", treeId)
				.eq("level", 1)
				.order("node_order", { ascending: false })
				.limit(1)

			if (
				!getScenarioErr &&
				existingScenarios &&
				existingScenarios.length > 0
			) {
				startNodeOrder = existingScenarios[0].node_order + 1
			}
		}
		const children = treeRoot.children || []
		const scenarioPromises = children.map(async (scenario, idx) => {
			const scenarioId = crypto.randomUUID()
			const { error } = await sb.from("tree_nodes").insert({
				id: scenarioId,
				tree_id: tt.id,
				parent_id: rootNodeId,
				name: scenario.name,
				description: scenario.description ?? "",
				axis: "Scenario" as any,
				level: 1,
				node_order: startNodeOrder + idx,
				children_count: 0, // Important: Set to 0 to indicate subtree not generated yet
				team_id: team_id || null,
				user_id: user_id || null,
			})
			if (error) throw new Error(`DB error (scenario node): ${error.message}`)
			return {
				id: scenarioId,
				name: scenario.name,
				description: scenario.description,
			}
		})
		const scenarios = await Promise.all(scenarioPromises)

		// Update root node's children_count if adding to existing tree
		if (treeId) {
			const { data: currentRoot, error: getCurrentRootErr } = await sb
				.from("tree_nodes")
				.select("children_count")
				.eq("id", rootNodeId)
				.single()

			if (!getCurrentRootErr && currentRoot) {
				const newChildrenCount = currentRoot.children_count + scenarios.length
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

		// 🆕 NEW: Call Use Cases API for each scenario at Step 1 with empty children
		console.log(`[STEP 1] Starting use cases enrichment for scenario nodes...`)

		const useCasePromises = scenarios.map(async (scenario) => {
			try {
				console.log(`[STEP 1 USECASES] Processing scenario: ${scenario.name}`)

				// Prepare scenario node with empty children for use cases API
				const scenarioNodeForUseCases = {
					id: scenario.id,
					title: scenario.name,
					description: scenario.description || "",
					level: 1,
					children: [], // Empty children array as requested
					keywords: [],
					context: "",
				}

				// Prepare use cases API request
				const useCasesRequest = prepareUseCasesApiRequest(
					tt.id,
					searchTheme, // Use searchTheme as query
					scenarioNodeForUseCases,
				)

				let useCasesResponse: any
				try {
					// Try production use cases API first
					useCasesResponse = await callUseCasesAPI(useCasesRequest)
					console.log(
						`[STEP 1 USECASES] Production API succeeded for scenario: ${scenario.name}`,
					)
				} catch (apiErr) {
					const apiErrorMessage = getErrorMessage(apiErr)
					console.error(
						"[STEP 1 USECASES] Production API failed:",
						apiErrorMessage,
					)
					// Don't throw here - use cases are optional at Step 1
					// Just log the error and continue without use cases data
					console.log(
						`[STEP 1 USECASES] Skipping use cases for scenario: ${scenario.name}`,
					)
					return {
						scenario: scenario.name,
						success: false,
						error: `Use Cases API failed: ${apiErrorMessage}`,
					}
				}

				// Save use cases data for the scenario node
				if (useCasesResponse.scenarioNode || useCasesResponse.scenario_node) {
					const enrichedScenarioNode =
						useCasesResponse.scenarioNode || useCasesResponse.scenario_node

					if (
						enrichedScenarioNode.useCases &&
						enrichedScenarioNode.useCases.length > 0
					) {
						await saveNodeUseCasesWithSummary(
							sb,
							scenario.id,
							tt.id,
							enrichedScenarioNode.useCases,
							team_id,
							user_id,
							searchTheme,
							OPENAI_API_KEY,
						)
						console.log(
							`[STEP 1 USECASES] Saved ${enrichedScenarioNode.useCases.length} use cases and summary for scenario: ${scenario.name}`,
						)
					}

					// Handle use_cases field as well (API response format)
					if (
						enrichedScenarioNode.use_cases &&
						enrichedScenarioNode.use_cases.length > 0
					) {
						await saveNodeUseCasesWithSummary(
							sb,
							scenario.id,
							tt.id,
							enrichedScenarioNode.use_cases,
							team_id,
							user_id,
							searchTheme,
							OPENAI_API_KEY,
						)
						console.log(
							`[STEP 1 USECASES] Saved ${enrichedScenarioNode.use_cases.length} use cases and summary (from use_cases field) for scenario: ${scenario.name}`,
						)
					}
				}

				return {
					scenario: scenario.name,
					success: true,
				}
			} catch (error) {
				const errorMessage = getErrorMessage(error)
				console.error(
					`[STEP 1 USECASES] Error processing use cases for scenario ${scenario.name}:`,
					error,
				)
				return {
					scenario: scenario.name,
					success: false,
					error: errorMessage,
				}
			}
		}) // Fire off use cases enrichment in background (don't await)
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

		console.log(
			`[STEP 1] Created ${scenarios.length} scenarios, starting Step 2 generation`,
		)

		// Start Step 2 generation for each scenario asynchronously with proper error handling
		const step2Promises = scenarios.map(async (scenario) => {
			try {
				console.log(
					`Starting Step 2 for scenario: ${scenario.name} (ID: ${scenario.id})`,
				)

				// Call Step 2 logic directly (not via HTTP) to avoid recursive endpoint calls
				const step2Result = await processStep2Internal({
					searchTheme,
					scenarioId: scenario.id,
					scenarioName: scenario.name,
					scenarioDescription: scenario.description || "",
					treeId: tt.id,
					team_id,
					supabaseClient: sb,
					openaiApiKey: OPENAI_API_KEY,
					context,
					purpose,
					user_id,
				})

				console.log(
					`[Step 2] completed for scenario: ${scenario.name}`,
					step2Result,
				)
				return {
					scenario: scenario.name,
					success: true,
					result: step2Result,
				}
			} catch (error) {
				const errorMessage = getErrorMessage(error)
				console.error(`Error in Step 2 for scenario ${scenario.name}:`, {
					message: errorMessage,
					stack: getErrorStack(error),
				})
				return {
					scenario: scenario.name,
					success: false,
					error: errorMessage,
				}
			}
		})

		// Start Step 2 processes for each scenario in background
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
							scenario: scenarios[i]?.name || "Unknown",
							error: r.reason?.message || r.reason,
						}))
					console.error(`[COMPLETE] Failed scenarios:`, failedResults)
				}
				// Now that tree with papers is complete, start use cases enrichment
				// 🚫 TEMPORARILY DISABLED - Use Cases API not production ready
				// console.log(`[USECASES] Starting use cases enrichment for all scenarios...`);
				// await enrichTreeWithUseCases(tt.id, sb, team_id);
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

		// Return immediately so scenarios appear in UI with generating indicators
		const message = treeId
			? `Added ${scenarios.length} new scenarios to existing tree. Use cases enrichment started, subtrees generating in background.`
			: "Tree generation started. Scenarios created, use cases enrichment started, subtrees generating in background."

		return new Response(
			JSON.stringify({
				success: true,
				treeId: tt.id,
				message,
				scenarios: scenarios.map((s) => ({ id: s.id, name: s.name })),
				status: "generating", // Indicates background processing is active
			}),
			{
				status: 200,
				headers: { ...CORS, "Content-Type": "application/json" },
			},
		)
	} catch (err: any) {
		console.error("=== EDGE FUNCTION ERROR (TED v2) ===")
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
