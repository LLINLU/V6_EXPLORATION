import { supabase } from "@/integrations/supabase/client"
import type {
	MemoNotes,
	SavedPaperWithDetails,
	SavedUseCaseWithDetails,
} from "@/types/services"

export type { MemoNotes, SavedPaperWithDetails, SavedUseCaseWithDetails }

/**
 * Save a paper for the current user
 */
export async function savePaper(
	paperId: string,
	treeId: string,
	nodeId: string,
	teamId?: string | null,
) {
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error("User not authenticated")

	const { data, error } = await supabase
		.from("saved_papers")
		.insert({
			user_id: user.id,
			paper_id: paperId,
			tree_id: treeId,
			node_id: nodeId,
			team_id: teamId,
		})
		.select()
		.single()

	if (error) throw error
	return data
}

/**
 * Remove a saved paper
 */
export async function unsavePaper(paperId: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error("User not authenticated")

	const { error } = await supabase
		.from("saved_papers")
		.delete()
		.eq("user_id", user.id)
		.eq("paper_id", paperId)

	if (error) throw error
}

/**
 * Get all saved papers for the current user with full paper details
 */
export async function getSavedPapers(): Promise<SavedPaperWithDetails[]> {
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error("User not authenticated")

	const { data, error } = await supabase
		.from("saved_papers")
		.select(`
      id,
      paper_id,
      saved_at,
      notes,
      tree_id,
      node_id,
      paper:node_papers!inner(
        id,
        title,
        authors,
        journal,
        abstract,
        date,
        citations,
        doi,
        url,
        tags,
        region
      )
    `)
		.eq("user_id", user.id)
		.order("saved_at", { ascending: false })

	if (error) throw error
	return data as any
}

/**
 * Check if a paper is saved by the current user
 */
export async function checkIfPaperIsSaved(paperId: string): Promise<boolean> {
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return false

	const { data, error } = await supabase
		.from("saved_papers")
		.select("id")
		.eq("user_id", user.id)
		.eq("paper_id", paperId)
		.single()

	if (error && error.code !== "PGRST116") throw error
	return !!data
}

/**
 * Save a use case for the current user
 */
export async function saveUseCase(
	useCaseId: string,
	treeId: string,
	nodeId: string,
	teamId?: string | null,
) {
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error("User not authenticated")

	const { data, error } = await supabase
		.from("saved_use_cases")
		.insert({
			user_id: user.id,
			use_case_id: useCaseId,
			tree_id: treeId,
			node_id: nodeId,
			team_id: teamId,
		})
		.select()
		.single()

	if (error) throw error
	return data
}

/**
 * Remove a saved use case
 */
export async function unsaveUseCase(useCaseId: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error("User not authenticated")

	const { error } = await supabase
		.from("saved_use_cases")
		.delete()
		.eq("user_id", user.id)
		.eq("use_case_id", useCaseId)

	if (error) throw error
}

/**
 * Get all saved use cases for the current user with full details
 */
export async function getSavedUseCases(): Promise<SavedUseCaseWithDetails[]> {
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error("User not authenticated")

	const { data, error } = await supabase
		.from("saved_use_cases")
		.select(`
      id,
      use_case_id,
      saved_at,
      notes,
      tree_id,
      node_id,
      use_case:node_use_cases!inner(
        id,
        product,
        description,
        company,
        press_releases
      )
    `)
		.eq("user_id", user.id)
		.order("saved_at", { ascending: false })

	if (error) throw error
	return data as any
}

/**
 * Check if a use case is saved by the current user
 */
export async function checkIfUseCaseIsSaved(
	useCaseId: string,
): Promise<boolean> {
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return false

	const { data, error } = await supabase
		.from("saved_use_cases")
		.select("id")
		.eq("user_id", user.id)
		.eq("use_case_id", useCaseId)
		.single()

	if (error && error.code !== "PGRST116") throw error
	return !!data
}

/**
 * Update notes for a saved paper
 */
export async function updatePaperNotes(savedPaperId: string, notes: MemoNotes) {
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error("User not authenticated")

	const { data, error } = await supabase
		.from("saved_papers")
		.update({ notes: JSON.stringify(notes) })
		.eq("id", savedPaperId)
		.eq("user_id", user.id)
		.select()
		.single()

	if (error) throw error
	return data
}

/**
 * Update notes for a saved use case
 */
export async function updateUseCaseNotes(
	savedUseCaseId: string,
	notes: MemoNotes,
) {
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error("User not authenticated")

	const { data, error } = await supabase
		.from("saved_use_cases")
		.update({ notes: JSON.stringify(notes) })
		.eq("id", savedUseCaseId)
		.eq("user_id", user.id)
		.select()
		.single()

	if (error) throw error
	return data
}

/**
 * Parse notes from string to MemoNotes object
 */
export function parseNotes(notes: string | null): MemoNotes {
	if (!notes) return { tags: [], memo: "" }
	try {
		const parsed = JSON.parse(notes)
		return {
			tags: Array.isArray(parsed.tags) ? parsed.tags : [],
			memo: typeof parsed.memo === "string" ? parsed.memo : "",
		}
	} catch {
		// If notes is plain text, treat it as memo
		return { tags: [], memo: notes }
	}
}
