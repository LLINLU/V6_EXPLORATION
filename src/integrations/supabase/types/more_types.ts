import type { Tables } from "@/integrations/supabase/types/database.types"

type PaperData = Tables<"node_papers">
type NodeUseCases = Tables<"node_use_cases">

export type PapersWithSaved = Omit<PaperData, "saved"> & { saved: boolean }
export type CasesWithSaved = Omit<NodeUseCases, "saved"> & { saved: boolean }
