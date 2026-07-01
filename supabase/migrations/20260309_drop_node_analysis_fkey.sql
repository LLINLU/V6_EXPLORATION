-- Drop foreign key constraint on node_analysis.node_id.
-- node_id stores scenario IDs and other arbitrary identifiers, not just tree_nodes IDs.
ALTER TABLE IF EXISTS public.node_analysis DROP CONSTRAINT IF EXISTS node_analysis_node_id_fkey;
