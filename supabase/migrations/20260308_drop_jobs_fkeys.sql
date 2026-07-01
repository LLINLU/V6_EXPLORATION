-- Drop foreign key constraints on jobs and node_analysis tables.
-- node_id stores arbitrary identifiers (scenario IDs, etc.), not just tree_nodes IDs.
ALTER TABLE IF EXISTS public.jobs DROP CONSTRAINT IF EXISTS jobs_node_id_fkey;
ALTER TABLE IF EXISTS public.jobs DROP CONSTRAINT IF EXISTS jobs_tree_id_fkey;
ALTER TABLE IF EXISTS public.node_analysis DROP CONSTRAINT IF EXISTS node_analysis_node_id_fkey;
