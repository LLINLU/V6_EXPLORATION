-- Prevent duplicate active reports for the same tree_id + scenario_id.
-- Error reports are excluded so users can retry after failures.
CREATE UNIQUE INDEX idx_scenario_reports_unique_active
  ON scenario_reports (tree_id, scenario_id)
  WHERE status != 'error';
