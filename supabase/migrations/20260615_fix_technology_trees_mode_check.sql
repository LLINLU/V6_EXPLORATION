-- The original mode_check constraint only allowed 'TED' and 'FAST'.
-- 'REPORT' was added for query report trees without updating the constraint.
-- Allow null to keep compatibility with trees created before the mode column existed.
ALTER TABLE technology_trees DROP CONSTRAINT IF EXISTS technology_trees_mode_check;
ALTER TABLE technology_trees ADD CONSTRAINT technology_trees_mode_check
  CHECK (mode IS NULL OR mode IN ('TED', 'FAST', 'REPORT', 'QUERY'));
