/* 

This file will use the supabase integration in @/integrations/supabase 
to fetch the current user's saved papers and usecases, 
and store them in zustand, which is a state management system like redux.

Then this data will be available to be "hooked" to from throughout
the application.

*/
import { create } from "zustand"
import { supabase } from "@/integrations/supabase/client"
import type { Json, Tables } from "@/integrations/supabase/types"

type paperData = Tables<"node_papers">
type caseData = Tables<"node_use_cases">

type SavedPaper = {
	id: string
	paper_id: string
	paper: {
		id: string
		title: string
		authors: string
		journal: string
		abstract: string
		date: string | null
		citations: number
		doi: string | null
		url: string | null
		tags: Json
		region: string
	}
	tree_id: string
	node_id: string
	saved_at: string | null
	notes: string | null
}

type SavedCase = {
	id: string
	use_case_id: string
	use_case: {
		product: string
		description: string
		company: string[]
		press_releases: string[]
	}
	tree_id: string
	node_id: string
	saved_at: string | null
	notes: string | null
}

interface SavedItemsState {
	user_id: string
	team_id: string
	saved_paper_ids: string[]
	saved_case_ids: string[]
	saved_papers: SavedPaper[]
	saved_cases: SavedCase[]
	loading_paper_ids: boolean
	loading_case_ids: boolean
	toggle_paper: (paper: paperData) => void
	toggle_usecase: (usecase: caseData) => void
	fetchSavedPapers: () => Promise<void>
	fetchSavedCases: () => Promise<void>
	unsave_paper: (paperId: string, treeId: string, nodeId: string) => void
	unsave_usecase: (caseId: string, treeId: string, nodeId: string) => void
}

export const savedItemStore = create<SavedItemsState>((set, get) => ({
	team_id: "",
	user_id: "",
	saved_paper_ids: [],
	saved_case_ids: [],
	saved_papers: [],
	saved_cases: [],
	loading_paper_ids: false,
	loading_case_ids: false,

	toggle_paper: async (paper: paperData) => {
		const wasSaved = get().saved_paper_ids.includes(paper.id)

		set({ loading_paper_ids: true })

		const userID = get().user_id

		if (userID) {
			try {
				// First check if a saved item already exists, with is_active = false. Get the note as well.
				const { data: original } = await supabase
					.from("saved_papers")
					.select("*")
					.eq("paper_id", paper.id)
					.eq("user_id", userID)
					.eq("node_id", paper.node_id)
					.eq("tree_id", paper.tree_id)
					.maybeSingle()

				if (!wasSaved) {
					if (original) {
						const { data: data2, error } = await supabase
							.from("saved_papers")
							.update({ is_active: true })
							.eq("paper_id", paper.id)
							.eq("user_id", userID)
							.eq("node_id", paper.node_id)
							.eq("tree_id", paper.tree_id)
							.select()
							.single()
						if (!error) {
							const saved_paper: SavedPaper = {
								id: data2.id,
								paper_id: paper.id,
								paper: {
									id: paper.id,
									title: paper.title,
									authors: paper.authors,
									journal: paper.journal,
									abstract: paper.abstract,
									date: paper.date,
									citations: paper.citations,
									doi: paper.doi,
									url: paper.url,
									tags: paper.tags,
									region: paper.region,
								},
								tree_id: paper.tree_id,
								node_id: paper.node_id,
								saved_at: new Date().toISOString(),
								notes: null,
							}

							set({
								saved_papers: [saved_paper, ...get().saved_papers],
							})
						}
					} else {
						const { data: data2, error } = await supabase
							.from("saved_papers")
							.insert([
								{
									node_id: paper.node_id,
									paper_id: paper.id,
									team_id: null,
									tree_id: paper.tree_id,
									user_id: userID,
									saved_at: new Date().toISOString(),
									notes: null,
								},
							])
							.select()
							.single()
						if (!error) {
							const saved_paper: SavedPaper = {
								id: data2.id,
								paper_id: paper.id,
								paper: {
									id: paper.id,
									title: paper.title,
									authors: paper.authors,
									journal: paper.journal,
									abstract: paper.abstract,
									date: paper.date,
									citations: paper.citations,
									doi: paper.doi,
									url: paper.url,
									tags: paper.tags,
									region: paper.region,
								},
								tree_id: paper.tree_id,
								node_id: paper.node_id,
								saved_at: new Date().toISOString(),
								notes: null,
							}

							set({
								saved_papers: [saved_paper, ...get().saved_papers],
							})
						}
					}
					set({ saved_paper_ids: [paper.id, ...get().saved_paper_ids] })
				} else {
					if (original) {
						const { error } = await supabase
							.from("saved_papers")
							.update({ is_active: false })
							.eq("paper_id", paper.id)
							.eq("user_id", userID)
							.eq("node_id", paper.node_id)
							.eq("tree_id", paper.tree_id)
							.select()
							.single()
						if (error) console.log(error)
					} else {
						const { error } = await supabase
							.from("saved_papers")
							.delete()
							.eq("paper_id", paper.id)
							.eq("user_id", userID)
							.eq("tree_id", paper.tree_id)
							.eq("node_id", paper.node_id)

						if (error) console.log(error)
					}
					set({
						saved_paper_ids: get().saved_paper_ids.filter(
							(r) => r !== paper.id,
						),
						saved_papers: get().saved_papers.filter(
							(r) => r.paper_id !== paper.id,
						),
					})
				}
			} catch (_error) {
				// console.log(_error)
			}
		}
		set({ loading_paper_ids: false })
	},

	unsave_paper: async (paperId: string, treeId: string, nodeId: string) => {
		// console.log("UNSAVING PAPER...", paperId, treeId, nodeId)
		const { data: original, error } = await supabase
			.from("node_papers")
			.select("*")
			.eq("id", paperId)
			.eq("node_id", nodeId)
			.eq("tree_id", treeId)
			.maybeSingle()

		if (original) {
			// console.log("ORIGINAL: ", original)
			get().toggle_paper(original)
		}
		if (error) {
			// console.log(error)
		}
	},

	toggle_usecase: async (use_case: caseData) => {
		const wasSaved = get().saved_case_ids.includes(use_case.id)

		set({ loading_case_ids: true })

		const userID = get().user_id
		const teamID = get().team_id ?? null

		if (userID)
			try {
				// First check if a saved item already exists, with is_active = false. Get the note as well.
				const { data: original } = await supabase
					.from("saved_use_cases")
					.select("*")
					.eq("use_case_id", use_case.id)
					.eq("user_id", userID)
					.eq("node_id", use_case.node_id)
					.eq("tree_id", use_case.tree_id)
					.maybeSingle()

				// Insert in Supabase
				if (!wasSaved) {
					// SAVE
					// If already existed, just flip the is_active switch.
					if (original) {
						// First check if a saved item already exists, with is_active = false. Get the note as well.
						const { data: data2, error } = await supabase
							.from("saved_use_cases")
							.update({ is_active: true })
							.eq("use_case_id", use_case.id)
							.eq("user_id", userID)
							.eq("node_id", use_case.node_id)
							.eq("tree_id", use_case.tree_id)
							.select()
							.single()

						if (!error)
							set({
								saved_cases: [
									{
										id: data2.id,
										use_case_id: use_case.id,
										use_case: {
											product: use_case.product,
											description: use_case.description,
											company: use_case.company,
											press_releases: use_case.press_releases,
										},
										tree_id: use_case.tree_id,
										node_id: use_case.node_id,
										saved_at: data2.saved_at,
										notes: data2.notes ?? null,
									},
									...get().saved_cases,
								],
							})
					}
					// If no, add a new row as below.
					else {
						const { data: data2, error } = await supabase
							.from("saved_use_cases")
							.insert([
								{
									node_id: use_case.node_id,
									use_case_id: use_case.id,
									team_id: teamID,
									tree_id: use_case.tree_id,
									user_id: userID,
									saved_at: new Date().toISOString(),
								},
							])
							.select()
							.single()

						if (!error)
							set({
								saved_cases: [
									{
										id: data2.id,
										use_case_id: use_case.id,
										use_case: {
											product: use_case.product,
											description: use_case.description,
											company: use_case.company,
											press_releases: use_case.press_releases,
										},
										tree_id: use_case.tree_id,
										node_id: use_case.node_id,
										saved_at: data2.saved_at,
										notes: data2.notes ?? null,
									},
									...get().saved_cases,
								],
							})
					}

					set({ saved_case_ids: [use_case.id, ...get().saved_case_ids] })
				} else {
					// UNSAVE
					// If already existed, just turn off active flag
					if (original) {
						const { error } = await supabase
							.from("saved_use_cases")
							.update({ is_active: false })
							.eq("use_case_id", use_case.id)
							.eq("user_id", userID)
							.eq("node_id", use_case.node_id)
							.eq("tree_id", use_case.tree_id)
							.select()

						if (error) console.log(error)
					} else {
						// Delete from Supabase
						const { error } = await supabase
							.from("saved_use_cases")
							.delete()
							.eq("use_case_id", use_case.id)
							.eq("user_id", userID)
							.eq("tree_id", use_case.tree_id)
							.eq("node_id", use_case.node_id)

						if (error) {
							// console.log("[SavedStore]", error)
						}
					}
					// Remove locally
					set({
						saved_case_ids: get().saved_case_ids.filter(
							(r) => r !== use_case.id,
						),

						saved_cases: get().saved_cases.filter(
							(r) => r.use_case_id !== use_case.id,
						),
					})
				}
			} catch (_error) {
				// console.log(_error)
			}
		set({ loading_case_ids: false })
	},

	unsave_usecase: async (caseId: string, treeId: string, nodeId: string) => {
		// console.log("UNSAVING USE CASE...", caseId, treeId, nodeId)
		const { data: original, error } = await supabase
			.from("node_use_cases")
			.select("*")
			.eq("id", caseId)
			.eq("node_id", nodeId)
			.eq("tree_id", treeId)
			.maybeSingle()

		if (original) {
			// console.log("ORIGINAL: ", original)
			get().toggle_usecase(original)
		}
		if (error) {
			// console.log(error)
		}
	},

	fetchSavedPapers: async () => {
		const user_id = get().user_id
		if (!user_id) {
			set({ saved_paper_ids: [] })
			return
		}

		set({ loading_paper_ids: true })

		try {
			const { data: papers } = await supabase
				.from("saved_papers")
				.select(
					`
					*,
					node_papers:paper_id (
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
					`,
				)
				.eq("user_id", user_id)
				.eq("is_active", true)

			if (papers) {
				// console.log("FETCHED SAVED PAPERS! ", papers)
				set({ saved_paper_ids: papers?.map((r) => r.paper_id) })

				const saved_papers: SavedPaper[] = papers.map((r) => ({
					id: r.id,
					paper_id: r.paper_id,
					paper: {
						id: r.node_papers.id,
						title: r.node_papers.title,
						authors: r.node_papers.authors,
						journal: r.node_papers.journal,
						abstract: r.node_papers.abstract,
						date: r.node_papers.date,
						citations: r.node_papers.citations,
						doi: r.node_papers.doi,
						url: r.node_papers.url,
						tags: r.node_papers.tags,
						region: r.node_papers.region,
					},
					tree_id: r.tree_id,
					node_id: r.node_id,
					saved_at: r.saved_at,
					notes: r.notes,
				}))

				set({ saved_papers: saved_papers })
			}
		} catch (_error) {
			// console.log(error)
		}

		set({ loading_paper_ids: false })
	},

	fetchSavedCases: async () => {
		const user_id = get().user_id
		if (!user_id) {
			set({ saved_case_ids: [] })
			return
		}

		set({ loading_case_ids: true })

		try {
			// 1) fetch saves
			const { data: cases } = await supabase
				.from("saved_use_cases")
				.select(
					`
				*,
				node_use_cases:use_case_id (
				id,
				product,
				description,
				company,
				press_releases
				)
			`,
				)
				.eq("user_id", user_id)
				.eq("is_active", true)

			if (!cases?.length) {
				set({ saved_cases: [] })
				return
			}

			// 2) build local ids (don’t pull from store)
			const useCaseIds = [...new Set(cases.map((su) => su.use_case_id))]

			const saves: SavedCase[] = cases.map((su) => ({
				id: su.id,
				use_case_id: su.use_case_id,
				use_case: {
					product: su.node_use_cases.product,
					description: su.node_use_cases.description,
					company: su.node_use_cases.company,
					press_releases: su.node_use_cases.press_releases,
				},
				tree_id: su.tree_id,
				node_id: su.node_id,
				saved_at: su.saved_at,
				notes: su.notes,
			}))

			set({ saved_cases: saves })
			set({ saved_case_ids: useCaseIds })
		} catch (_error) {
			// console.log(error)
		}

		set({ loading_case_ids: false })
	},
}))
