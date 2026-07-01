// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { generateUseCaseSummary } from "./summary-generator.ts"

/* ====== Supabase クライアント生成 ====== */ let _supabase = null
/**
 * Supabase Service Role クライアントをシングルトンで取得する。
 */ export function getSupabaseClient() {
	if (_supabase) return _supabase
	const url = Deno.env.get("SUPABASE_URL")
	const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
	if (!url || !key) {
		throw new Error(
			"Server mis-config (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
		)
	}
	_supabase = createClient(url, key)
	return _supabase
}
/* ====== 存在確認 ====== */ export async function existsTreeNode(nodeId) {
	const sb = getSupabaseClient()
	const { data, error } = await sb
		.from("tree_nodes")
		.select("id")
		.eq("id", nodeId)
		.single()
	return !error && !!data
}
export async function existsTree(treeId) {
	const sb = getSupabaseClient()
	const { data, error } = await sb
		.from("technology_trees")
		.select("id")
		.eq("id", treeId)
		.single()
	return !error && !!data
}
export async function existsTeam(teamId) {
	const sb = getSupabaseClient()
	const { data, error } = await sb
		.from("teams")
		.select("id")
		.eq("id", teamId)
		.single()
	return !error && !!data
}
/* ====== 市場実装を DB に保存し、GPT-4o 要約を生成する ====== */ /**
 * node_use_cases / node_usecases_summary の保存処理。
 *
 * 処理順序:
 * 1. 既存 node_use_cases を DELETE
 * 2. 既存 node_usecases_summary を DELETE
 * 3. node_use_cases に INSERT
 * 4. GPT-4o で要約生成
 * 5. node_usecases_summary に UPSERT
 *
 * ※ node_id の存在確認は呼び出し元（index.ts）で実施済み。
 *
 * @returns 保存件数と要約生成の成否
 */ export async function saveNodeUseCasesWithSummary(
	nodeId,
	treeId,
	markets,
	teamId,
	searchQuery,
) {
	if (markets.length === 0) {
		return {
			savedCount: 0,
			summaryGenerated: false,
		}
	}
	const sb = getSupabaseClient()
	console.log(`[DB] Starting save process for node: ${nodeId}`)
	// 1. 既存 node_use_cases を DELETE
	const { error: deleteError } = await sb
		.from("node_use_cases")
		.delete()
		.eq("node_id", nodeId)
	if (deleteError) {
		console.error(
			`[DB] Failed to delete existing use cases for node ${nodeId}:`,
			deleteError,
		)
		throw new Error(
			`Failed to delete existing use cases for node ${nodeId}: ${deleteError.message}`,
		)
	}
	// 2. 既存 node_usecases_summary を DELETE
	const { error: deleteSummaryError } = await sb
		.from("node_usecases_summary")
		.delete()
		.eq("node_id", nodeId)
	if (deleteSummaryError) {
		console.warn(
			`[DB] Failed to delete existing use case summary for node ${nodeId}:`,
			deleteSummaryError,
		)
	}
	// 3. node_use_cases に INSERT
	const useCasesToInsert = markets.map((market) => ({
		id: market.id,
		node_id: nodeId,
		tree_id: treeId,
		product: market.product,
		description: market.description,
		company: market.company ?? [],
		press_releases: market.press_releases ?? [],
		team_id: teamId,
		year: typeof market.year === "number" ? market.year : null,
	}))
	const { data: insertedData, error: insertError } = await sb
		.from("node_use_cases")
		.insert(useCasesToInsert)
		.select()
	if (insertError) {
		console.error(`[DB] Failed to insert use cases:`, {
			error: insertError,
			message: insertError.message,
			details: insertError.details,
			hint: insertError.hint,
			code: insertError.code,
		})
		throw new Error(
			`Failed to save use cases for node ${nodeId}: ${insertError.message}`,
		)
	}
	const savedCount = insertedData?.length ?? 0
	console.log(
		`[DB] Successfully inserted ${savedCount} use cases for node: ${nodeId}`,
	)
	// 4. GPT-4o で要約生成 → 5. node_usecases_summary に UPSERT
	let summaryGenerated = false
	const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
	if (OPENAI_API_KEY) {
		try {
			console.log(`[SUMMARY] Generating use case summary for node: ${nodeId}`)
			const summary = await generateUseCaseSummary(
				markets,
				searchQuery,
				OPENAI_API_KEY,
			)
			console.log(
				`[SUMMARY] Successfully generated use case summary for node: ${nodeId}`,
			)
			const summaryData = {
				node_id: nodeId,
				tree_id: treeId,
				user_id: null,
				team_id: teamId,
				summary,
				query: searchQuery,
				usecases_count: markets.length,
			}
			const { error: summaryError } = await sb
				.from("node_usecases_summary")
				.upsert(summaryData)
			if (summaryError) {
				console.error(
					`[SUMMARY] Failed to save use case summary for node ${nodeId}:`,
					summaryError,
				)
			} else {
				console.log(`[SUMMARY] Saved use case summary for node: ${nodeId}`)
				summaryGenerated = true
			}
		} catch (summaryError) {
			console.error(
				`[SUMMARY] Error generating use case summary for node ${nodeId}:`,
				summaryError,
			)
			// 市場実装データは既に保存済みなので続行
		}
	} else {
		console.warn(
			`[SUMMARY] OpenAI API key not found, skipping use case summary generation`,
		)
	}
	return {
		savedCount,
		summaryGenerated,
	}
}
