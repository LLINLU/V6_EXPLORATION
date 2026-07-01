-- Create jobs table if it does not exist (needed for local dev).
CREATE TABLE IF NOT EXISTS public.jobs (
  id BIGSERIAL PRIMARY KEY,
  node_id TEXT,
  tree_id UUID,
  status TEXT NOT NULL DEFAULT 'queued',
  body JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns (idempotent for environments where the table already existed).
ALTER TABLE IF EXISTS public.jobs
  ADD COLUMN IF NOT EXISTS node_id TEXT,
  ADD COLUMN IF NOT EXISTS tree_id UUID;

CREATE INDEX IF NOT EXISTS jobs_node_id_idx ON public.jobs(node_id);
CREATE INDEX IF NOT EXISTS jobs_tree_id_idx ON public.jobs(tree_id);
